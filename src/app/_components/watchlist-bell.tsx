"use client";

import { useState } from "react";

import { api } from "@/trpc/react";

import { WatchlistModal } from "./watchlist-modal";

interface WatchlistBellProps {
  gameId: string;
  steamAppId: number;
  gameName: string;
  className?: string;
}

export function WatchlistBell({
  gameId,
  steamAppId,
  gameName,
  className = "",
}: WatchlistBellProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Note: We can't check status without email, so we'll just show the bell
  // The modal will handle checking if user is already watching
  const { data: watchlistStatus } = api.watchlist.getStatus.useQuery(
    {
      gameId,
    },
    {
      enabled: false, // Disabled for now - would need email context
    },
  );

  const isWatching = watchlistStatus?.isWatching ?? false;

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`relative rounded-full p-2 transition-colors ${
          isWatching
            ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
            : "bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white"
        } ${className}`}
        title={isWatching ? "Watching for price drops" : "Set price alert"}
        aria-label="Set price alert"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill={isWatching ? "currentColor" : "none"}
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
        {isWatching && (
          <span className="absolute -right-1 -top-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-yellow-500"></span>
          </span>
        )}
      </button>

      {isModalOpen && (
        <WatchlistModal
          gameId={gameId}
          steamAppId={steamAppId}
          gameName={gameName}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialIsWatching={isWatching}
        />
      )}
    </>
  );
}
