# Steam Game Price Checker  

A Next.js application built with the T3 Stack that tracks Steam game prices and displays price history. Search for games, view current prices, and see historical price data with beautiful charts.

## Features

- 🔍 **Search Games**: Search for games in your local database
- 📊 **Price History**: View historical price data with interactive charts
- 🎮 **Popular Games on Sale**: Browse the most popular games currently on sale
- 📈 **Price Tracking**: Automatic price tracking via cron jobs
- 🎨 **Modern UI**: Beautiful, responsive design with Tailwind CSS

## Tech Stack

- [Next.js 15](https://nextjs.org) - React framework
- [tRPC](https://trpc.io) - End-to-end typesafe APIs
- [Prisma](https://prisma.io) - Database ORM
- [SQLite](https://www.sqlite.org) - Database (can be swapped for PostgreSQL)
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Recharts](https://recharts.org) - Charting library
- [TypeScript](https://www.typescriptlang.org) - Type safety

## Steam API Information

This app uses the **official Steam Store API**, which is **public and requires no authentication**. The following endpoints are used:

- `https://store.steampowered.com/api/appdetails?appids={APPID}` - Get game details and current price
- `https://store.steampowered.com/api/featuredcategories` - Get featured games (specials, top sellers, coming soon)

### Important Notes:

1. **No Authentication Required**: The Steam Store API is completely public
2. **Rate Limiting**: Steam doesn't officially document rate limits, but be respectful with requests
3. **Price History**: Steam doesn't provide historical price data, so we store it in our database
4. **Search Limitation**: Steam doesn't have a public search API, so we search our local database

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Git

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd steam-gameprice-checker
```

2. Install dependencies:
```bash
bun install
# or
npm install
```

3. Set up the database:
```bash
# Copy the example env file
cp .env.example .env

# The DATABASE_URL is already set in .env.example, but you can customize it
# For SQLite: DATABASE_URL="file:./db.sqlite"
# For PostgreSQL: DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Run migrations
bunx prisma migrate dev
# or
npx prisma migrate dev
```

4. Generate Prisma Client:
```bash
bunx prisma generate
# or
npx prisma generate
```

5. Start the development server:
```bash
bun dev
# or
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Setup

The app uses Prisma with SQLite by default. To use PostgreSQL instead:

1. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Update your `.env` file with a PostgreSQL connection string:
```
DATABASE_URL="postgresql://user:password@localhost:5432/steam_price_checker"
```

3. Run migrations:
```bash
bunx prisma migrate dev
```

## Cron Job Setup

The app includes a cron job endpoint to automatically sync prices. There are several ways to set it up:

### Option 1: Vercel Cron (Recommended for Vercel deployments)

If deploying to Vercel, the `vercel.json` file is already configured. The cron job will run every 6 hours automatically.

### Option 2: External Cron Service

You can use services like [cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com) to call the endpoint:

```
GET https://your-domain.com/api/cron/sync-prices
```

Optional: Add authentication by setting `CRON_SECRET` in your `.env`:
```
CRON_SECRET="your-secret-key-here"
```

Then configure your cron service to send:
```
Authorization: Bearer your-secret-key-here
```

### Option 3: Manual Sync

You can manually trigger the sync by visiting:
```
http://localhost:3000/api/cron/sync-prices
```

## Usage

### Searching for Games

1. Use the search bar on the homepage to search for games in your database
2. If a game isn't found, you can sync it by visiting `/game/{appId}` where `appId` is the Steam App ID
3. To find a Steam App ID, visit the game's Steam store page - the URL will be `https://store.steampowered.com/app/{appId}`

### Viewing Price History

1. Click on any game card to view its details
2. The price history chart will show all recorded prices
3. Prices are automatically tracked when games are synced

### Syncing Games

Games are automatically synced when:
- You visit a game's detail page (`/game/{appId}`)
- The cron job runs (every 6 hours by default)
- You manually call the sync endpoint

## Project Structure

```
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── _components/       # React components
│   │   ├── api/
│   │   │   └── cron/          # Cron job endpoints
│   │   ├── game/[appId]/      # Game detail page
│   │   └── page.tsx           # Homepage
│   ├── server/
│   │   ├── api/
│   │   │   └── routers/       # tRPC routers
│   │   ├── db.ts              # Prisma client
│   │   └── services/          # External API services
│   └── trpc/                  # tRPC client setup
└── vercel.json                # Vercel cron configuration
```

## Available Scripts

- `bun dev` / `npm run dev` - Start development server
- `bun build` / `npm run build` - Build for production
- `bun start` / `npm start` - Start production server
- `bunx prisma studio` / `npx prisma studio` - Open Prisma Studio (database GUI)
- `bunx prisma migrate dev` / `npx prisma migrate dev` - Run database migrations
- `bun lint` / `npm run lint` - Run ESLint
- `bun typecheck` / `npm run typecheck` - Run TypeScript type checking

## Email Notifications

The app supports email notifications for price drops! 

- Click the 🔔 bell icon on any game to set up price alerts
- Get notified when games go on sale or reach your target price
- Customize alerts with minimum discount % or target price

See [EMAIL_NOTIFICATIONS_SETUP.md](./EMAIL_NOTIFICATIONS_SETUP.md) for setup instructions.

## Future Features

Here are some potential features you could add:

### Short-term
- [x] Price drop alerts/notifications ✅
- [ ] Wishlist functionality
- [ ] Filter games by genre, price range, discount percentage
- [ ] Sort games by price, discount, popularity
- [ ] User accounts and personal game lists
- [ ] Email notifications for price drops

### Medium-term
- [ ] Compare prices across different regions
- [ ] Historical lowest price tracking
- [ ] Price prediction based on historical data
- [ ] Integration with IsThereAnyDeal API for better price tracking
- [ ] Steam wishlist import
- [ ] Mobile app (React Native)

### Long-term
- [ ] Multi-store price comparison (Epic Games, GOG, etc.)
- [ ] Community features (reviews, recommendations)
- [ ] Price tracking for DLCs and bundles
- [ ] Advanced analytics and insights
- [ ] API for third-party integrations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Acknowledgments

- Built with [create-t3-app](https://create.t3.gg/)
- Uses the public [Steam Store API](https://store.steampowered.com/api/)
- Icons and images from Steam
