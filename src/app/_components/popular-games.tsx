"use client";

import { useCurrency } from "@/contexts/currency-context";
import { api } from "@/trpc/react";

import { GameCard } from "./game-card";

export function PopularGames() {
  const { currencyInfo } = useCurrency();
  const { data: games, isLoading } = api.game.getPopularOnSale.useQuery({
    limit: 20,
    countryCode: currencyInfo.countryCode,
  });

  if (isLoading) {
    return (
      <div className="text-center text-gray-400">Loading popular games...</div>
    );
  }

  if (!games || games.length === 0) {
    return (
      <div className="text-center text-gray-400">
        No games on sale found. Check back later!
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-3xl font-bold text-white">
        Popular Games on Sale
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {games.map((game, index) => (
          <GameCard
            key={`${game.appId}-${index}`}
            appId={game.appId}
            name={game.name}
            headerImage={game.headerImage}
            discountPercent={game.discountPercent}
            originalPrice={game.originalPrice}
            finalPrice={game.finalPrice}
            currency={game.currency}
            largeCapsuleImage={game.largeCapsuleImage}
          />
        ))}
      </div>
    </div>
  );
}
