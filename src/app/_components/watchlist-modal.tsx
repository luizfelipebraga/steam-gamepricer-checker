"use client";

import { useState } from "react";

import { api } from "@/trpc/react";

interface WatchlistModalProps {
  gameId: string;
  steamAppId: number;
  gameName: string;
  isOpen: boolean;
  onClose: () => void;
  initialIsWatching?: boolean;
}

export function WatchlistModal({
  gameId,
  steamAppId: _steamAppId,
  gameName,
  isOpen,
  onClose,
  initialIsWatching = false,
}: WatchlistModalProps) {
  const [email, setEmail] = useState("");
  const [minDiscount, setMinDiscount] = useState<number | "">("");
  const [targetPrice, setTargetPrice] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const utils = api.useUtils();
  const addToWatchlist = api.watchlist.add.useMutation({
    onSuccess: () => {
      void utils.watchlist.getStatus.invalidate({ gameId });
      onClose();
    },
  });
  const removeFromWatchlist = api.watchlist.remove.useMutation({
    onSuccess: () => {
      void utils.watchlist.getStatus.invalidate({ gameId });
      onClose();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      await addToWatchlist.mutateAsync({
        gameId,
        email,
        minDiscountPercent:
          minDiscount !== "" ? Number(minDiscount) : undefined,
        targetPrice: targetPrice !== "" ? Number(targetPrice) * 100 : undefined, // Convert to cents
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (!email) return;
    setIsSubmitting(true);
    try {
      await removeFromWatchlist.mutateAsync({ gameId, email });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h2 className="mb-4 text-2xl font-bold text-white">
          Price Alert for {gameName}
        </h2>

        {initialIsWatching ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-yellow-500/20 p-4 text-yellow-400">
              <p className="font-semibold">You&apos;re already watching this game!</p>
              <p className="mt-2 text-sm text-gray-300">
                You&apos;ll receive email notifications when the price drops or goes on sale.
              </p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Enter your email to remove the alert:
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded bg-gray-700 px-4 py-2 text-white hover:bg-gray-600"
              >
                Close
              </button>
              <button
                onClick={handleRemove}
                disabled={isSubmitting || !email}
                className="flex-1 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? "Removing..." : "Remove Alert"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-400">
                We&apos;ll send you an email when this game goes on sale
              </p>
            </div>

            <div>
              <label
                htmlFor="minDiscount"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Minimum Discount % (Optional)
              </label>
              <input
                id="minDiscount"
                type="number"
                min="0"
                max="100"
                placeholder="e.g., 50"
                value={minDiscount}
                onChange={(e) =>
                  setMinDiscount(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                className="w-full rounded border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-400">
                Only notify if discount is at least this percentage
              </p>
            </div>

            <div>
              <label
                htmlFor="targetPrice"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Target Price (Optional)
              </label>
              <input
                id="targetPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g., 29.99"
                value={targetPrice}
                onChange={(e) =>
                  setTargetPrice(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                className="w-full rounded border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-400">
                Only notify if price drops to or below this amount
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded bg-gray-700 px-4 py-2 text-white hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !email}
                className="flex-1 rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? "Setting up..." : "Set Alert"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
