# Email Notifications Setup Guide

## Overview

The app now supports email notifications when games go on sale! Users can click the bell icon on any game to set up price alerts.

## Features

- 🔔 **Bell Icon**: Click the bell icon on game cards or detail pages to set up alerts
- 📧 **Email Notifications**: Get notified when:
  - Game goes on sale
  - Discount reaches your minimum threshold
  - Price drops to your target price
  - Price drops significantly (10%+)
- ⚙️ **Customizable Alerts**: Set minimum discount % or target price
- 🚫 **Smart Notifications**: Won't spam - only notifies once per 24 hours per game

## Setup Instructions

### 1. Database Migration

First, run the database migration to add the watchlist table:

```bash
bunx prisma migrate dev --name add_watchlist
# or
npx prisma migrate dev --name add_watchlist
```

### 2. Install Dependencies

The email service uses Resend. Install it:

```bash
bun add resend
# or
npm install resend
```

### 3. Set Up Resend Account

1. Go to [Resend.com](https://resend.com) and create a free account
2. Verify your domain (or use their test domain for development)
3. Get your API key from the dashboard

### 4. Configure Environment Variables

Add these to your `.env` file:

```env
# Resend API Key
RESEND_API_KEY="re_xxxxxxxxxxxxx"

# Email address to send from (must be verified in Resend)
EMAIL_FROM="noreply@yourdomain.com"

# Your app URL (for email links)
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
# For local development:
# NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 5. Set Up Cron Jobs

The app includes two cron jobs:

1. **Sync Prices** (`/api/cron/sync-prices`) - Fetches current prices from Steam
2. **Check Price Drops** (`/api/cron/check-price-drops`) - Checks for price drops and sends emails

#### Option A: Vercel (Automatic)

If deploying to Vercel, the `vercel.json` is already configured. The cron jobs will run automatically every 6 hours.

#### Option B: External Cron Service

Use services like [cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com):

1. **Sync Prices**: `GET https://yourdomain.com/api/cron/sync-prices`
2. **Check Price Drops**: `GET https://yourdomain.com/api/cron/check-price-drops`

Optional: Add authentication by setting `CRON_SECRET` in `.env` and configuring your cron service to send:
```
Authorization: Bearer your-secret-key-here
```

## How It Works

### User Flow

1. User clicks the bell icon on a game
2. Modal opens asking for:
   - Email address
   - Optional: Minimum discount %
   - Optional: Target price
3. User submits → Watchlist entry created
4. Cron job runs periodically:
   - Checks all active watchlists
   - Compares current price with previous price
   - Sends email if conditions are met
   - Updates `lastNotifiedAt` to prevent spam

### Notification Triggers

An email is sent when **any** of these conditions are met:

1. **Game goes on sale** - Game wasn't on sale before, now it is
2. **Discount threshold reached** - Discount % reaches your minimum
3. **Target price reached** - Price drops to or below your target
4. **Significant price drop** - Price drops by 10% or more

### Rate Limiting

- Only one notification per game per 24 hours
- Prevents email spam
- Users can re-enable after 24 hours if price drops again

## Email Template

The email includes:
- Game name and image
- Current price with discount badge
- Previous price (if applicable)
- Links to view details and buy on Steam
- Instructions to manage alerts

## Testing

### Test Email Notifications Locally

1. Set up a watchlist entry via the UI
2. Manually trigger the cron job:
   ```
   GET http://localhost:3000/api/cron/check-price-drops
   ```
3. Check your email inbox

### Test with Resend Test Domain

For development, you can use Resend's test domain:
- `EMAIL_FROM="onboarding@resend.dev"`
- Emails will be sent but won't actually deliver (good for testing)

## Troubleshooting

### Emails Not Sending

1. **Check Resend API Key**: Make sure `RESEND_API_KEY` is set correctly
2. **Verify Domain**: The `EMAIL_FROM` domain must be verified in Resend
3. **Check Logs**: Look for errors in the cron job logs
4. **Test Email Service**: The email service will log warnings if not configured

### Cron Jobs Not Running

1. **Vercel**: Check the Vercel dashboard → Cron Jobs
2. **External Service**: Verify the cron service is calling the correct URL
3. **Authentication**: If using `CRON_SECRET`, make sure it's configured correctly

### Database Issues

If you get migration errors:
```bash
# Reset database (WARNING: Deletes all data)
bunx prisma migrate reset

# Or create a new migration
bunx prisma migrate dev
```

## Future Enhancements

Potential improvements:
- [ ] Email preferences page
- [ ] Unsubscribe links in emails
- [ ] Multiple email addresses per user
- [ ] SMS notifications
- [ ] Push notifications
- [ ] Price history in email
- [ ] Comparison with historical low prices

## API Reference

### tRPC Procedures

- `watchlist.add` - Add game to watchlist
- `watchlist.remove` - Remove game from watchlist
- `watchlist.getStatus` - Check if email is watching a game
- `watchlist.getByEmail` - Get all watchlists for an email

### Cron Endpoints

- `GET /api/cron/sync-prices` - Sync prices from Steam
- `GET /api/cron/check-price-drops` - Check for price drops and send emails

## Support

If you encounter issues:
1. Check the console logs
2. Verify environment variables
3. Test the email service independently
4. Check Resend dashboard for delivery status
