import { CurrencySelector } from "@/app/_components/currency-selector";
import { GameSearch } from "@/app/_components/game-search";
import { PopularGames } from "@/app/_components/popular-games";
import { HydrateClient } from "@/trpc/server";

export default async function Home() {
  return (
    <HydrateClient>
      <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex justify-end">
            <CurrencySelector />
          </div>
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
              Steam Game Price Checker
            </h1>
            <p className="text-xl text-gray-300">
              Track prices and view price history for your favorite Steam games
            </p>
          </div>

          <div className="mb-12">
            <h2 className="mb-4 text-2xl font-bold text-white">Search Games</h2>
            <GameSearch />
          </div>

          <div className="mb-8">
            <PopularGames />
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
