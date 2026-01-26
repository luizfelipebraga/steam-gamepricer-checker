import { NextResponse } from "next/server";

import { db } from "@/server/db";
import { getPopularGamesOnSale, getAppDetails } from "@/server/services/steam";

/**
 * Cron job endpoint to sync prices for popular games on sale
 * 
 * This can be called by:
 * - Vercel Cron: https://vercel.com/docs/cron-jobs
 * - GitHub Actions
 * - External cron service (cron-job.org, etc.)
 * 
 * To set up Vercel Cron, add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/sync-prices",
 *     "schedule": "0 */6 * * *"
 *   }]
 * }
 */
export async function GET(request: Request) {
  // Optional: Add authentication/authorization check
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get popular games on sale
    const popularGames = await getPopularGamesOnSale(100);

    let synced = 0;
    let errors = 0;

    // Sync each game
    for (const game of popularGames) {
      try {
        const steamData = await getAppDetails(game.appId);
        if (!steamData) {
          errors++;
          continue;
        }

        // Upsert game
        const dbGame = await db.game.upsert({
          where: {
            steamAppId: game.appId,
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
          const existingPrice = await db.priceHistory.findFirst({
            where: {
              gameId: dbGame.id,
              recordedAt: {
                gte: today,
              },
            },
          });

          if (!existingPrice) {
            await db.priceHistory.create({
              data: {
                gameId: dbGame.id,
                currency: priceData.currency,
                initialPrice: priceData.initial,
                finalPrice: priceData.final,
                discountPercent: priceData.discount_percent,
                isOnSale,
              },
            });
          }
        }

        synced++;
      } catch (error) {
        console.error(`Error syncing game ${game.appId}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      synced,
      errors,
      total: popularGames.length,
    });
  } catch (error) {
    console.error("Error in sync-prices cron:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
