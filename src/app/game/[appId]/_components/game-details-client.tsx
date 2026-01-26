"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { PriceHistoryChart } from "@/app/_components/price-history-chart";
import { WatchlistBell } from "@/app/_components/watchlist-bell";
import { useCurrency } from "@/contexts/currency-context";
import { formatPrice } from "@/lib/currency";
import { api } from "@/trpc/react";

interface GameDetailsClientProps {
  initialAppId: number;
}

export function GameDetailsClient({ initialAppId }: GameDetailsClientProps) {
  const { currencyInfo } = useCurrency();
  const [appId, setAppId] = useState(initialAppId);

  // Refetch when currency changes
  useEffect(() => {
    setAppId(initialAppId);
  }, [currencyInfo.countryCode, initialAppId]);

  const { data: game, isLoading, refetch } = api.game.getByAppId.useQuery(
    {
      appId,
      sync: true,
      countryCode: currencyInfo.countryCode,
    },
    {
      enabled: !!appId,
    },
  );

  // Refetch when currency changes
  useEffect(() => {
    if (appId) {
      void refetch();
    }
  }, [currencyInfo.countryCode, appId, refetch]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white">
        Loading game details...
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white">
        Game not found
      </div>
    );
  }

  const currentPrice = game.priceHistory[0];
  const currency = currentPrice?.currency ?? currencyInfo.currency;

  return (
    <>
      <Link
        href="/"
        className="mb-6 inline-block text-blue-400 hover:text-blue-300"
      >
        ← Back to Home
      </Link>

      <div className="mb-8 rounded-lg bg-gray-800 p-6">
        <div className="flex flex-col gap-6 md:flex-row">
          {game.headerImage && (
            <div className="relative h-64 w-full flex-shrink-0 md:h-96 md:w-96">
              <Image
                src={game.headerImage}
                alt={game.name}
                fill
                className="rounded-lg object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
                unoptimized
              />
            </div>
          )}

          <div className="flex-1">
            <div className="mb-4 flex items-start justify-between gap-4">
              <h1 className="text-4xl font-bold text-white">{game.name}</h1>
              <WatchlistBell
                gameId={game.id}
                steamAppId={game.steamAppId}
                gameName={game.name}
              />
            </div>

            {game.shortDescription && (
              <p className="mb-4 text-gray-300">{game.shortDescription}</p>
            )}

            <div className="mb-4 flex flex-wrap gap-4">
              {game.developers.length > 0 && (
                <div>
                  <span className="text-gray-400">Developers: </span>
                  <span className="text-white">
                    {game.developers.join(", ")}
                  </span>
                </div>
              )}
              {game.publishers.length > 0 && (
                <div>
                  <span className="text-gray-400">Publishers: </span>
                  <span className="text-white">
                    {game.publishers.join(", ")}
                  </span>
                </div>
              )}
              {game.releaseDate && (
                <div>
                  <span className="text-gray-400">Release Date: </span>
                  <span className="text-white">{game.releaseDate}</span>
                </div>
              )}
            </div>

            {game.genres.length > 0 && (
              <div className="mb-4">
                <span className="text-gray-400">Genres: </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {game.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="rounded bg-blue-600 px-3 py-1 text-sm text-white"
                    >
                      {genre.description}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {currentPrice && (
              <div className="mt-6 rounded-lg bg-gray-700 p-4">
                <h3 className="mb-2 text-lg font-semibold text-white">
                  Current Price
                </h3>
                <div className="flex items-center gap-4">
                  {currentPrice.initialPrice &&
                    currentPrice.initialPrice > currentPrice.finalPrice && (
                      <span className="text-lg text-gray-400 line-through">
                        {formatPrice(
                          currentPrice.initialPrice,
                          currency,
                          currencyInfo.locale,
                        )}
                      </span>
                    )}
                  <span className="text-3xl font-bold text-green-400">
                    {formatPrice(
                      currentPrice.finalPrice,
                      currency,
                      currencyInfo.locale,
                    )}
                  </span>
                  {currentPrice.discountPercent !== null &&
                    currentPrice.discountPercent > 0 && (
                      <span className="rounded bg-red-600 px-3 py-1 text-lg font-bold text-white">
                        -{currentPrice.discountPercent}%
                      </span>
                    )}
                </div>
                {currentPrice.isOnSale && (
                  <p className="mt-2 text-sm text-green-400">
                    Currently on sale!
                  </p>
                )}
              </div>
            )}

            <div className="mt-6">
              <a
                href={`https://store.steampowered.com/app/${game.steamAppId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
              >
                View on Steam
              </a>
            </div>
          </div>
        </div>
      </div>

      {game.priceHistory.length > 0 && (
        <div className="mb-8">
          <PriceHistoryChart
            data={game.priceHistory.map((ph) => ({
              recordedAt: ph.recordedAt,
              finalPrice: ph.finalPrice,
              initialPrice: ph.initialPrice,
              discountPercent: ph.discountPercent,
              currency: ph.currency,
              isOnSale: ph.isOnSale,
            }))}
            currency={currency}
          />
        </div>
      )}

      {game.priceHistory.length === 0 && (
        <div className="rounded-lg bg-gray-800 p-6 text-center text-gray-400">
          No price history available yet. Price tracking will begin once the
          game is synced.
        </div>
      )}
    </>
  );
}
