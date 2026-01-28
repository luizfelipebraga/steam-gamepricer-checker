/**
 * Steam Store API Service
 * 
 * Official Steam Store API endpoints (public, no authentication required):
 * - https://store.steampowered.com/api/appdetails?appids={APPID}
 * - https://store.steampowered.com/api/featuredcategories
 */

export interface SteamAppDetails {
  type: string;
  name: string;
  steam_appid: number;
  required_age: number;
  is_free: boolean;
  controller_support?: string;
  detailed_description?: string;
  short_description?: string;
  about_the_game?: string;
  supported_languages?: string;
  header_image?: string;
  website?: string;
  pc_requirements?: {
    minimum?: string;
    recommended?: string;
  };
  mac_requirements?: {
    minimum?: string;
    recommended?: string;
  };
  linux_requirements?: {
    minimum?: string;
    recommended?: string;
  };
  developers?: string[];
  publishers?: string[];
  price_overview?: {
    currency: string;
    initial: number;
    final: number;
    discount_percent: number;
    initial_formatted: string;
    final_formatted: string;
  };
  packages?: number[];
  package_groups?: Array<{
    name: string;
    title: string;
    description: string;
    selection_text: string;
    save_text: string;
    display_type: number;
    is_recurring_subscription: string;
    subs: Array<{
      packageid: number;
      percent_savings_text: string;
      percent_savings: number;
      option_text: string;
      option_description: string;
      can_get_free_license: string;
      is_free_license: boolean;
      price_in_cents_with_discount: number;
    }>;
  }>;
  platforms?: {
    windows: boolean;
    mac: boolean;
    linux: boolean;
  };
  categories?: Array<{
    id: number;
    description: string;
  }>;
  genres?: Array<{
    id: number;
    description: string;
  }>;
  screenshots?: Array<{
    id: number;
    path_thumbnail: string;
    path_full: string;
  }>;
  movies?: Array<{
    id: number;
    name: string;
    thumbnail: string;
    webm: {
      480: string;
      max: string;
    };
    mp4: {
      480: string;
      max: string;
    };
    highlight: boolean;
  }>;
  recommendations?: {
    total: number;
  };
  achievements?: {
    total: number;
    highlighted: Array<{
      name: string;
      path: string;
    }>;
  };
  release_date?: {
    coming_soon: boolean;
    date: string;
  };
  support_info?: {
    url: string;
    email: string;
  };
  background?: string;
  content_descriptors?: {
    ids: number[];
    notes: string | null;
  };
}

export type SteamAppDetailsResponse = Record<string, {
  success: boolean;
  data?: SteamAppDetails;
}>;

export interface FeaturedCategories {
  specials?: {
    id: string;
    name: string;
    items: Array<{
      id: number;
      type: number;
      name: string;
      discounted: boolean;
      discount_percent: number;
      original_price: number;
      final_price: number;
      currency: string;
      large_capsule_image: string;
      small_capsule_image: string;
      windows_available: boolean;
      mac_available: boolean;
      linux_available: boolean;
      streamingvideo_available: boolean;
      header_image: string;
      controller_support?: string;
      discount_expiration?: number;
    }>;
  };
  coming_soon?: {
    id: string;
    name: string;
    items: Array<{
      id: number;
      type: number;
      name: string;
      header_image: string;
      release_date: string;
      release_date_unix: number;
      coming_soon: boolean;
      windows_available: boolean;
      mac_available: boolean;
      linux_available: boolean;
    }>;
  };
  top_sellers?: {
    id: string;
    name: string;
    items: Array<{
      id: number;
      type: number;
      name: string;
      discounted: boolean;
      discount_percent: number;
      original_price: number;
      final_price: number;
      currency: string;
      large_capsule_image: string;
      small_capsule_image: string;
      windows_available: boolean;
      mac_available: boolean;
      linux_available: boolean;
      streamingvideo_available: boolean;
      header_image: string;
      controller_support?: string;
    }>;
  };
}

/**
 * Fetch app details from Steam Store API
 */
export async function getAppDetails(
  appId: number,
  currency = "us",
): Promise<SteamAppDetails | null> {
  try {
    const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=${currency}`;
    const response = await fetch(url, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Steam API error: ${response.status}`);
    }

    const data = (await response.json()) as SteamAppDetailsResponse;
    const appData = data[appId.toString()];

    if (!appData?.success || !appData.data) {
      return null;
    }

    return appData.data;
  } catch (error) {
    console.error(`Error fetching app details for ${appId}:`, error);
    return null;
  }
}

/**
 * Fetch featured categories (specials, top sellers, coming soon)
 */
export async function getFeaturedCategories(): Promise<FeaturedCategories | null> {
  try {
    const url = "https://store.steampowered.com/api/featuredcategories";
    const response = await fetch(url, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Steam API error: ${response.status}`);
    }

    const data = (await response.json()) as FeaturedCategories;
    return data;
  } catch (error) {
    console.error("Error fetching featured categories:", error);
    return null;
  }
}

/**
 * Search for games using Steam Store search
 * Note: Steam doesn't have an official search API, so we'll need to use
 * the store search page or implement our own search using app details
 */
export async function searchGames(_query: string): Promise<number[]> {
  // Steam doesn't provide a public search API
  // This is a placeholder - in production, you might want to:
  // 1. Use a third-party API like SteamDB
  // 2. Build your own search index
  // 3. Use Steam's store search page (requires scraping)
  
  // For now, we'll return an empty array and handle search differently
  // by maintaining a local database of popular games
  return [];
}

/**
 * Get popular games on sale from featured categories
 * Optionally fetches individual game details with country code for accurate pricing
 */
export async function getPopularGamesOnSale(
  limit = 50,
  countryCode?: string,
): Promise<Array<{
  appId: number;
  name: string;
  discountPercent: number;
  originalPrice: number;
  finalPrice: number;
  currency: string;
  headerImage: string;
  largeCapsuleImage?: string;
}>> {
  const categories = await getFeaturedCategories();
  if (!categories) {
    return [];
  }

  const games: Array<{
    appId: number;
    name: string;
    discountPercent: number;
    originalPrice: number;
    finalPrice: number;
    currency: string;
    headerImage: string;
    largeCapsuleImage?: string;
  }> = [];

  // Get games from specials
  if (categories.specials?.items) {
    for (const item of categories.specials.items) {
      if (item.discounted && item.type === 0) {
        // type 0 = game
        games.push({
          appId: item.id,
          name: item.name,
          discountPercent: item.discount_percent,
          originalPrice: item.original_price,
          finalPrice: item.final_price,
          currency: item.currency,
          headerImage: item.header_image,
          largeCapsuleImage: item.large_capsule_image,
        });
      }
    }
  }

  // Get discounted games from top sellers
  if (categories.top_sellers?.items) {
    for (const item of categories.top_sellers.items) {
      if (item.discounted && item.type === 0 && !games.find((g) => g.appId === item.id)) {
        games.push({
          appId: item.id,
          name: item.name,
          discountPercent: item.discount_percent,
          originalPrice: item.original_price,
          finalPrice: item.final_price,
          currency: item.currency,
          headerImage: item.header_image,
          largeCapsuleImage: item.large_capsule_image,
        });
      }
    }
  }

  // If country code is provided, fetch accurate prices for each game
  if (countryCode && countryCode !== "us") {
    const gamesWithAccuratePrices = await Promise.all(
      games.slice(0, limit).map(async (game) => {
        try {
          const appDetails = await getAppDetails(game.appId, countryCode);
          if (appDetails?.price_overview) {
            return {
              ...game,
              originalPrice: appDetails.price_overview.initial,
              finalPrice: appDetails.price_overview.final,
              discountPercent: appDetails.price_overview.discount_percent,
              currency: appDetails.price_overview.currency,
            };
          }
          return game;
        } catch {
          return game; // Fallback to original if fetch fails
        }
      }),
    );
    return gamesWithAccuratePrices
      .sort((a, b) => b.discountPercent - a.discountPercent)
      .slice(0, limit);
  }

  // Sort by discount percentage (highest first) and limit
  return games
    .sort((a, b) => b.discountPercent - a.discountPercent)
    .slice(0, limit);
}
