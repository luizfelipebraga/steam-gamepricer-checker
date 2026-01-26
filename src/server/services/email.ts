import { Resend } from "resend";

import { env } from "@/env";

const resend = env.RESEND_API_KEY
  ? new Resend(env.RESEND_API_KEY)
  : null;

export interface PriceDropEmailData {
  gameName: string;
  gameUrl: string;
  steamUrl: string;
  currentPrice: number;
  currency: string;
  discountPercent: number | null;
  previousPrice: number | null;
  targetPrice: number | null;
  minDiscountPercent: number | null;
}

/**
 * Send price drop notification email
 */
export async function sendPriceDropEmail(
  to: string,
  data: PriceDropEmailData,
): Promise<boolean> {
  if (!resend || !env.EMAIL_FROM) {
    console.warn(
      "Email service not configured. Set RESEND_API_KEY and EMAIL_FROM in .env",
    );
    return false;
  }

  try {
    const formatPrice = (price: number, currency: string) => {
      const amount = price / 100; // Convert from cents
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      }).format(amount);
    };

    const subject = `🎮 ${data.gameName} is on sale!`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .game-name { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #667eea; }
            .price-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .current-price { font-size: 32px; font-weight: bold; color: #10b981; }
            .discount { background: #ef4444; color: white; padding: 5px 15px; border-radius: 5px; display: inline-block; margin: 10px 0; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎮 Price Alert!</h1>
            </div>
            <div class="content">
              <div class="game-name">${data.gameName}</div>
              
              <div class="price-info">
                <div class="current-price">${formatPrice(
                  data.currentPrice,
                  data.currency,
                )}</div>
                ${
                  data.discountPercent && data.discountPercent > 0
                    ? `<div class="discount">-${data.discountPercent}% OFF</div>`
                    : ""
                }
                ${
                  data.previousPrice && data.previousPrice > data.currentPrice
                    ? `<p style="color: #666; margin-top: 10px;">Was: <span style="text-decoration: line-through;">${formatPrice(
                        data.previousPrice,
                        data.currency,
                      )}</span></p>`
                    : ""
                }
              </div>

              <p>Great news! This game is now on sale. Don't miss out!</p>

              <div style="text-align: center;">
                <a href="${data.gameUrl}" class="button">View Details</a>
                <a href="${data.steamUrl}" class="button" style="background: #1b2838; margin-left: 10px;">Buy on Steam</a>
              </div>

              <div class="footer">
                <p>You're receiving this because you set up a price alert for this game.</p>
                <p>To manage your alerts, visit the game page and click the bell icon.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Price Alert: ${data.gameName}

Current Price: ${formatPrice(data.currentPrice, data.currency)}
${data.discountPercent && data.discountPercent > 0 ? `Discount: ${data.discountPercent}%` : ""}
${data.previousPrice && data.previousPrice > data.currentPrice ? `Previous Price: ${formatPrice(data.previousPrice, data.currency)}` : ""}

View Details: ${data.gameUrl}
Buy on Steam: ${data.steamUrl}

You're receiving this because you set up a price alert for this game.
    `.trim();

    await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
      text,
    });

    return true;
  } catch (error) {
    console.error("Error sending price drop email:", error);
    return false;
  }
}
