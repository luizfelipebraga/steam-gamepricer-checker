import { notFound } from "next/navigation";

import { CurrencySelector } from "@/app/_components/currency-selector";
import { GameDetailsClient } from "@/app/game/[appId]/_components/game-details-client";
import { HydrateClient } from "@/trpc/server";

interface GamePageProps {
  params: Promise<{ appId: string }>;
}

export default async function GamePage({ params }: GamePageProps) {
  const { appId } = await params;
  const appIdNumber = Number.parseInt(appId, 10);

  if (Number.isNaN(appIdNumber)) {
    notFound();
  }

  return (
    <HydrateClient>
      <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 flex justify-end">
            <CurrencySelector />
          </div>
          <GameDetailsClient initialAppId={appIdNumber} />
        </div>
      </main>
    </HydrateClient>
  );
}
