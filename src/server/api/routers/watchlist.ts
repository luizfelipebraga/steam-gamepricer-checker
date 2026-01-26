import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const watchlistRouter = createTRPCRouter({
  /**
   * Add a game to watchlist
   */
  add: publicProcedure
    .input(
      z.object({
        gameId: z.string(),
        email: z.string().email(),
        minDiscountPercent: z.number().min(0).max(100).optional(),
        targetPrice: z.number().optional(), // Price in cents
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Upsert watchlist entry
      const watchlist = await ctx.db.watchlist.upsert({
        where: {
          email_gameId: {
            email: input.email,
            gameId: input.gameId,
          },
        },
        create: {
          email: input.email,
          gameId: input.gameId,
          notifyOnSale: true,
          minDiscountPercent: input.minDiscountPercent,
          targetPrice: input.targetPrice,
          isActive: true,
        },
        update: {
          notifyOnSale: true,
          minDiscountPercent: input.minDiscountPercent,
          targetPrice: input.targetPrice,
          isActive: true,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        watchlistId: watchlist.id,
      };
    }),

  /**
   * Remove a game from watchlist
   */
  remove: publicProcedure
    .input(
      z.object({
        gameId: z.string(),
        email: z.string().email(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.watchlist.deleteMany({
        where: {
          email: input.email,
          gameId: input.gameId,
        },
      });

      return { success: true };
    }),

  /**
   * Get watchlist status for a game (check if email is watching)
   */
  getStatus: publicProcedure
    .input(
      z.object({
        gameId: z.string(),
        email: z.string().email().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!input.email) {
        return { isWatching: false };
      }

      const watchlist = await ctx.db.watchlist.findFirst({
        where: {
          gameId: input.gameId,
          email: input.email,
          isActive: true,
        },
      });

      return {
        isWatching: !!watchlist,
        watchlist: watchlist
          ? {
              id: watchlist.id,
              minDiscountPercent: watchlist.minDiscountPercent,
              targetPrice: watchlist.targetPrice,
            }
          : null,
      };
    }),

  /**
   * Get all watchlists for an email
   */
  getByEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const watchlists = await ctx.db.watchlist.findMany({
        where: {
          email: input.email,
          isActive: true,
        },
        include: {
          game: {
            include: {
              priceHistory: {
                orderBy: {
                  recordedAt: "desc",
                },
                take: 1,
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return watchlists.map((w) => ({
        id: w.id,
        gameId: w.gameId,
        game: {
          id: w.game.id,
          steamAppId: w.game.steamAppId,
          name: w.game.name,
          headerImage: w.game.headerImage,
        },
        currentPrice: w.game.priceHistory[0]
          ? {
              currency: w.game.priceHistory[0].currency,
              finalPrice: w.game.priceHistory[0].finalPrice,
              discountPercent: w.game.priceHistory[0].discountPercent,
              isOnSale: w.game.priceHistory[0].isOnSale,
            }
          : null,
        minDiscountPercent: w.minDiscountPercent,
        targetPrice: w.targetPrice,
        createdAt: w.createdAt,
      }));
    }),
});
