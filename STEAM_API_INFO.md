# Steam API Information & Setup Guide

## ✅ Good News: Steam API is Public!

The **Steam Store API is completely public** and requires **no authentication**. You can start using it immediately without any setup steps!

## What We're Using

### Official Steam Store API Endpoints (No Auth Required)

1. **Game Details & Current Price**
   ```
   GET https://store.steampowered.com/api/appdetails?appids={APPID}&cc={CURRENCY}
   ```
   - Returns: Game information, current price, screenshots, descriptions, etc.
   - Example: `https://store.steampowered.com/api/appdetails?appids=730&cc=us`
   - Currency codes: `us`, `eu`, `gb`, etc.

2. **Featured Categories**
   ```
   GET https://store.steampowered.com/api/featuredcategories
   ```
   - Returns: Specials (games on sale), top sellers, coming soon games
   - No parameters needed

## What Steam API Doesn't Provide

1. **Price History**: Steam doesn't provide historical price data. That's why we store it in our database.
2. **Search API**: Steam doesn't have a public search endpoint. We search our local database instead.
3. **All Games on Sale**: The featured categories endpoint only shows a subset. We use it to get popular games on sale.

## How Our App Works

1. **Initial Data**: We fetch popular games on sale from the featured categories endpoint
2. **Game Details**: When you view a game, we fetch full details from the appdetails endpoint
3. **Price Tracking**: We store prices in our database daily (via cron job) to build price history
4. **Search**: We search our local database of games we've synced

## Rate Limiting

Steam doesn't officially document rate limits, but:
- Be respectful with requests (don't spam)
- We cache responses for 5 minutes in our code
- The cron job runs every 6 hours to avoid excessive requests

## No Setup Required!

Since the Steam API is public:
- ✅ No API keys needed
- ✅ No authentication required
- ✅ No registration needed
- ✅ Just start using it!

## Alternative APIs (If Needed in Future)

If you want more features in the future, consider:

1. **IsThereAnyDeal API** - Better price tracking across multiple stores
   - Requires API key (free tier available)
   - Better historical data

2. **SteamDB** - Comprehensive Steam data
   - Some endpoints require scraping
   - More detailed game information

3. **SteamWebAPI** - Third-party wrapper
   - Free tier available
   - Additional features beyond official API

## Current Implementation

Our app uses **only the official Steam Store API** (no third-party services), which means:
- ✅ No external dependencies
- ✅ No API keys to manage
- ✅ Completely free
- ✅ Reliable (official Steam endpoints)

## Summary

**You don't need to do anything!** The Steam API is ready to use. Just:
1. Run the database migrations
2. Start the dev server
3. The app will automatically fetch data from Steam

The only thing you might want to configure is the cron job secret (optional) for production deployments.
