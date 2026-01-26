"use client";

import Image from "next/image";
import Link from "next/link";

import { formatPrice } from "@/lib/currency";

import { WatchlistBell } from "./watchlist-bell";

interface GameCardProps {
  id?: string; // Game database ID (optional, for watchlist)
  appId: number;
  name: string;
  headerImage?: string | null;
  discountPercent?: number;
  originalPrice?: number;
  finalPrice?: number;
  currency?: string;
  largeCapsuleImage?: string;
}

export function GameCard({
  id,
  appId,
  name,
  headerImage,
  discountPercent,
  originalPrice,
  finalPrice,
  currency = "USD",
  largeCapsuleImage,
}: GameCardProps) {
  const imageUrl = headerImage || largeCapsuleImage;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg bg-gray-800 transition-transform hover:scale-105 hover:shadow-xl">
      <Link href={`/game/${appId}`} className="flex flex-1 flex-col">
        <div className="relative aspect-video w-full overflow-hidden bg-gray-900">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover transition-transform group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500">
              No Image
            </div>
          )}
          {discountPercent !== undefined && discountPercent > 0 && (
            <div className="absolute right-2 top-2 rounded bg-red-600 px-2 py-1 text-sm font-bold text-white">
              -{discountPercent}%
            </div>
          )}
          {id && (
            <div
              className="absolute left-2 top-2"
              onClick={(e) => e.preventDefault()}
            >
              <WatchlistBell
                gameId={id}
                steamAppId={appId}
                gameName={name}
              />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-4">
          <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-white group-hover:text-blue-400">
            {name}
          </h3>
          <div className="mt-auto flex items-center gap-2">
            {finalPrice !== undefined ? (
              <>
                {originalPrice !== undefined &&
                  originalPrice > finalPrice && (
                    <span className="text-sm text-gray-400 line-through">
                      {formatPrice(originalPrice, currency)}
                    </span>
                  )}
                <span className="text-lg font-bold text-green-400">
                  {formatPrice(finalPrice, currency)}
                </span>
              </>
            ) : (
              <span className="text-sm text-gray-400">Free</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
