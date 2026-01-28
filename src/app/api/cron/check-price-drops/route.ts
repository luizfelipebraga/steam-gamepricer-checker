import { NextResponse } from "next/server";

import { db } from "@/server/db";
import { getAppDetails } from "@/server/services/steam";
import { sendPriceDropEmail } from "@/server/services/email";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all active watchlists
    const watchlists = await db.watchlist.findMany({
      where: {
        isActive: true,
      },
      include: {
        game: {
          include: {
            priceHistory: {
              orderBy: {
                recordedAt: "desc",
              },
              take: 2, // Get current and previous price
            },
          },
        },
      },
    });

    let checked = 0;
    let notificationsSent = 0;
    let errors = 0;

    // Check each watchlist entry
    for (const watchlist of watchlists) {
      try {
        checked++;

        const game = watchlist.game;
        const currentPriceHistory = game.priceHistory[0];
        const previousPriceHistory = game.priceHistory[1];

        if (!currentPriceHistory) {
          // No price history yet, skip
          continue;
        }

        // Check if we should notify
        let shouldNotify = false;
        let reason = "";

        // Check if game just went on sale
        if (
          currentPriceHistory.isOnSale &&
          (!previousPriceHistory || !previousPriceHistory.isOnSale)
        ) {
          shouldNotify = true;
          reason = "Game just went on sale";
        }

        // Check minimum discount percentage
        if (
          watchlist.minDiscountPercent !== null &&
          currentPriceHistory.discountPercent !== null &&
          currentPriceHistory.discountPercent >= watchlist.minDiscountPercent &&
          (!previousPriceHistory ||
            previousPriceHistory.discountPercent === null ||
            previousPriceHistory.discountPercent < watchlist.minDiscountPercent)
        ) {
          shouldNotify = true;
          reason = `Discount reached ${watchlist.minDiscountPercent}%`;
        }

        // Check target price
        if (
          watchlist.targetPrice !== null &&
          currentPriceHistory.finalPrice <= watchlist.targetPrice &&
          (!previousPriceHistory ||
            previousPriceHistory.finalPrice > watchlist.targetPrice)
        ) {
          shouldNotify = true;
          reason = `Price dropped to target price`;
        }

        // Check if price dropped significantly
        if (
          previousPriceHistory &&
          currentPriceHistory.finalPrice < previousPriceHistory.finalPrice &&
          currentPriceHistory.isOnSale
        ) {
          const priceDrop =
            ((previousPriceHistory.finalPrice -
              currentPriceHistory.finalPrice) /
              previousPriceHistory.finalPrice) *
            100;

          // Notify if price dropped by at least 10%
          if (priceDrop >= 10) {
            shouldNotify = true;
            reason = `Price dropped by ${priceDrop.toFixed(1)}%`;
          }
        }

        // Don't notify if we already notified recently (within last 24 hours)
        if (watchlist.lastNotifiedAt) {
          const hoursSinceLastNotification =
            (Date.now() - watchlist.lastNotifiedAt.getTime()) / (1000 * 60 * 60);
          if (hoursSinceLastNotification < 24) {
            shouldNotify = false;
          }
        }

        if (shouldNotify) {
          // Send email notification
          const gameUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/game/${game.steamAppId}`;
          const steamUrl = `https://store.steampowered.com/app/${game.steamAppId}`;

          const emailSent = await sendPriceDropEmail(watchlist.email, {
            gameName: game.name,
            gameUrl,
            steamUrl,
            currentPrice: currentPriceHistory.finalPrice,
            currency: currentPriceHistory.currency,
            discountPercent: currentPriceHistory.discountPercent,
            previousPrice: previousPriceHistory?.finalPrice ?? null,
            targetPrice: watchlist.targetPrice,
            minDiscountPercent: watchlist.minDiscountPercent,
          });

          if (emailSent) {
            // Update last notified timestamp
            await db.watchlist.update({
              where: {
                id: watchlist.id,
              },
              data: {
                lastNotifiedAt: new Date(),
              },
            });

            notificationsSent++;
            console.log(
              `Sent price drop notification to ${watchlist.email} for ${game.name}: ${reason}`,
            );
          } else {
            errors++;
            console.error(
              `Failed to send email to ${watchlist.email} for ${game.name}`,
            );
          }
        }
      } catch (error) {
        console.error(
          `Error checking watchlist ${watchlist.id}:`,
          error,
        );
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      checked,
      notificationsSent,
      errors,
      total: watchlists.length,
    });
  } catch (error) {
    console.error("Error in check-price-drops cron:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
