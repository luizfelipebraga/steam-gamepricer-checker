import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  getAppDetails,
  getPopularGamesOnSale,
  type SteamAppDetails,
} from "@/server/services/steam";

export const gameRouter = createTRPCRouter({
  /**
   * Get popular games currently on sale
   */
  getPopularOnSale: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        countryCode: z.string().optional(), // Steam country code
      }),
    )
    .query(async ({ input }) => {
      const games = await getPopularGamesOnSale(
        input.limit,
        input.countryCode,
      );
      return games;
    }),

  /**
   * Search for a game by name
   * Note: Since Steam doesn't have a public search API, we search our database
   * and can also fetch details for specific app IDs
   */
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Search in our database
      // SQLite doesn't support mode: "insensitive", so we use a case-insensitive search
      // by converting both the query and name to lowercase
      const searchQuery = input.query.toLowerCase();
      
      // Fetch all games and filter in memory (for small datasets this is fine)
      // For larger datasets, you'd want to use raw SQL
      const allGames = await ctx.db.game.findMany({
        take: input.limit * 5, // Fetch more to account for filtering
        orderBy: {
          updatedAt: "desc",
        },
        include: {
          priceHistory: {
            orderBy: {
              recordedAt: "desc",
            },
            take: 1,
          },
        },
      });

      // Filter case-insensitively
      const filteredGames = allGames
        .filter((game) => game.name.toLowerCase().includes(searchQuery))
        .slice(0, input.limit);

      return filteredGames.map((game) => ({
        id: game.id,
        steamAppId: game.steamAppId,
        name: game.name,
        headerImage: game.headerImage,
        currentPrice: game.priceHistory[0]
          ? {
              currency: game.priceHistory[0].currency,
              finalPrice: game.priceHistory[0].finalPrice,
              initialPrice: game.priceHistory[0].initialPrice,
              discountPercent: game.priceHistory[0].discountPercent,
              isOnSale: game.priceHistory[0].isOnSale,
            }
          : null,
      }));
    }),

  /**
   * Get game details by Steam App ID
   */
  getByAppId: publicProcedure
    .input(
      z.object({
        appId: z.number(),
        sync: z.boolean().default(false), // Whether to sync from Steam API
        countryCode: z.string().optional(), // Steam country code (e.g., "br", "us")
      }),
    )
    .query(async ({ ctx, input }) => {
      // Check if game exists in database
      let game = await ctx.db.game.findUnique({
        where: {
          steamAppId: input.appId,
        },
        include: {
          priceHistory: {
            orderBy: {
              recordedAt: "desc",
            },
            take: 100, // Get last 100 price records
          },
        },
      });

      // If game doesn't exist or sync is requested, fetch from Steam
      if (!game || input.sync) {
        const steamData = await getAppDetails(
          input.appId,
          input.countryCode || "us",
        );
        if (!steamData) {
          throw new Error("Game not found");
        }

        // Upsert game in database
        game = await ctx.db.game.upsert({
          where: {
            steamAppId: input.appId,
          },
          create: {
            steamAppId: steamData.steam_appid,
            name: steamData.name,
            type: steamData.type,
            headerImage: steamData.header_image ?? undefined,
            developers: steamData.developers
              ? JSON.stringify(steamData.developers)
              : undefined,
            publishers: steamData.publishers
              ? JSON.stringify(steamData.publishers)
              : undefined,
            releaseDate: steamData.release_date?.date,
            genres: steamData.genres
              ? JSON.stringify(steamData.genres)
              : undefined,
            shortDescription: steamData.short_description ?? undefined,
          },
          update: {
            name: steamData.name,
            type: steamData.type,
            headerImage: steamData.header_image ?? undefined,
            developers: steamData.developers
              ? JSON.stringify(steamData.developers)
              : undefined,
            publishers: steamData.publishers
              ? JSON.stringify(steamData.publishers)
              : undefined,
            releaseDate: steamData.release_date?.date,
            genres: steamData.genres
              ? JSON.stringify(steamData.genres)
              : undefined,
            shortDescription: steamData.short_description ?? undefined,
          },
          include: {
            priceHistory: {
              orderBy: {
                recordedAt: "desc",
              },
              take: 100,
            },
          },
        });

        // If we have price data from Steam, record it
        if (steamData.price_overview) {
          const priceData = steamData.price_overview;
          const isOnSale = priceData.discount_percent > 0;

          // Check if we already have a price record for today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const existingPrice = await ctx.db.priceHistory.findFirst({
            where: {
              gameId: game.id,
              recordedAt: {
                gte: today,
              },
            },
          });

          if (!existingPrice) {
            await ctx.db.priceHistory.create({
              data: {
                gameId: game.id,
                currency: priceData.currency,
                initialPrice: priceData.initial,
                finalPrice: priceData.final,
                discountPercent: priceData.discount_percent,
                isOnSale,
              },
            });

            // Reload game with updated price history
            game = await ctx.db.game.findUnique({
              where: {
                steamAppId: input.appId,
              },
              include: {
                priceHistory: {
                  orderBy: {
                    recordedAt: "desc",
                  },
                  take: 100,
                },
              },
            });
          }
        }
      }

      return {
        id: game.id,
        steamAppId: game.steamAppId,
        name: game.name,
        type: game.type,
        headerImage: game.headerImage,
        developers: game.developers
          ? (JSON.parse(game.developers) as string[])
          : [],
        publishers: game.publishers
          ? (JSON.parse(game.publishers) as string[])
          : [],
        releaseDate: game.releaseDate,
        genres: game.genres
          ? (JSON.parse(game.genres) as Array<{ id: number; description: string }>)
          : [],
        shortDescription: game.shortDescription,
        priceHistory: game.priceHistory.map((ph) => ({
          id: ph.id,
          currency: ph.currency,
          initialPrice: ph.initialPrice,
          finalPrice: ph.finalPrice,
          discountPercent: ph.discountPercent,
          isOnSale: ph.isOnSale,
          recordedAt: ph.recordedAt,
        })),
      };
    }),

  /**
   * Get price history for a game
   */
  getPriceHistory: publicProcedure
    .input(
      z.object({
        gameId: z.string(),
        limit: z.number().min(1).max(500).default(100),
      }),
    )
    .query(async ({ ctx, input }) => {
      const priceHistory = await ctx.db.priceHistory.findMany({
        where: {
          gameId: input.gameId,
        },
        orderBy: {
          recordedAt: "desc",
        },
        take: input.limit,
      });

      return priceHistory.map((ph) => ({
        id: ph.id,
        currency: ph.currency,
        initialPrice: ph.initialPrice,
        finalPrice: ph.finalPrice,
        discountPercent: ph.discountPercent,
        isOnSale: ph.isOnSale,
        recordedAt: ph.recordedAt,
      }));
    }),

  /**
   * Sync game data and price from Steam API
   * This can be called manually or via a cron job
   */
  syncGame: publicProcedure
    .input(
      z.object({
        appId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const steamData = await getAppDetails(input.appId);
      if (!steamData) {
        throw new Error("Game not found on Steam");
      }

      // Upsert game
      const game = await ctx.db.game.upsert({
        where: {
          steamAppId: input.appId,
        },
        create: {
          steamAppId: steamData.steam_appid,
          name: steamData.name,
          type: steamData.type,
          headerImage: steamData.header_image ?? undefined,
          developers: steamData.developers
            ? JSON.stringify(steamData.developers)
            : undefined,
          publishers: steamData.publishers
            ? JSON.stringify(steamData.publishers)
            : undefined,
          releaseDate: steamData.release_date?.date,
          genres: steamData.genres
            ? JSON.stringify(steamData.genres)
            : undefined,
          shortDescription: steamData.short_description ?? undefined,
        },
        update: {
          name: steamData.name,
          type: steamData.type,
          headerImage: steamData.header_image ?? undefined,
          developers: steamData.developers
            ? JSON.stringify(steamData.developers)
            : undefined,
          publishers: steamData.publishers
            ? JSON.stringify(steamData.publishers)
            : undefined,
          releaseDate: steamData.release_date?.date,
          genres: steamData.genres
            ? JSON.stringify(steamData.genres)
            : undefined,
          shortDescription: steamData.short_description ?? undefined,
        },
      });

      // Record price if available
      if (steamData.price_overview) {
        const priceData = steamData.price_overview;
        const isOnSale = priceData.discount_percent > 0;

        // Check if we already have a price record for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const existingPrice = await ctx.db.priceHistory.findFirst({
          where: {
            gameId: game.id,
            recordedAt: {
              gte: today,
            },
          },
        });

        if (!existingPrice) {
          await ctx.db.priceHistory.create({
            data: {
              gameId: game.id,
              currency: priceData.currency,
              initialPrice: priceData.initial,
              finalPrice: priceData.final,
              discountPercent: priceData.discount_percent,
              isOnSale,
            },
          });
        }
      }

      return {
        success: true,
        gameId: game.id,
      };
    }),
});
