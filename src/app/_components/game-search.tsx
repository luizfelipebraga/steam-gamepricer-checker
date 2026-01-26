"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "@/trpc/react";

import { GameCard } from "./game-card";

export function GameSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const trimmedSearchQuery = searchQuery.trim();
  const router = useRouter();

  const { data: searchResults, isLoading } = api.game.search.useQuery(
    {
      query: trimmedSearchQuery,
      limit: 20,
    },
    {
      enabled: trimmedSearchQuery.length > 0 && !/^\d+$/.test(trimmedSearchQuery),
    },
  );

  // Check if search query is a number (Steam App ID)
  const isAppId = /^\d+$/.test(trimmedSearchQuery);
  const appIdNumber = isAppId ? Number.parseInt(trimmedSearchQuery, 10) : null;

  return (
    <div className="w-full">
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search for a game..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {isLoading && (
        <div className="text-center text-gray-400">Searching...</div>
      )}

      {isAppId && appIdNumber && (
        <div className="rounded-lg bg-gray-800 p-6 text-center">
          <p className="mb-4 text-gray-300">
            Detected Steam App ID: <code className="text-blue-400">{trimmedSearchQuery}</code>
          </p>
          <button
            onClick={() => router.push(`/game/${appIdNumber}`)}
            className="rounded bg-blue-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            View Game Details
          </button>
        </div>
      )}

      {trimmedSearchQuery.length > 0 &&
        !isAppId &&
        searchResults &&
        searchResults.length === 0 && (
          <div className="rounded-lg bg-gray-800 p-6 text-center">
            <p className="mb-4 text-gray-300">
              No games found in database. The game might not be synced yet.
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <p>
                To add a game, visit{" "}
                <code className="rounded bg-gray-700 px-2 py-1 text-blue-400">
                  /game/[SteamAppID]
                </code>{" "}
                or search by App ID (numbers only)
              </p>
              <p className="text-xs">
                Example:{" "}
                <a
                  href="/game/275850"
                  className="text-blue-400 hover:text-blue-300"
                >
                  /game/275850
                </a>{" "}
                (No Man's Sky) or search for "275850"
              </p>
              <p className="text-xs">
                Find the App ID from the game's Steam store page URL
              </p>
            </div>
          </div>
        )}

      {searchResults && searchResults.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {searchResults.map((game, index) => (
            <GameCard
              key={`${game.id}-${index}`}
              id={game.id}
              appId={game.steamAppId}
              name={game.name}
              headerImage={game.headerImage}
              discountPercent={game.currentPrice?.discountPercent ?? undefined}
              originalPrice={game.currentPrice?.initialPrice ?? undefined}
              finalPrice={game.currentPrice?.finalPrice ?? undefined}
              currency={game.currentPrice?.currency}
            />
          ))}
        </div>
      )}
    </div>
  );
}
