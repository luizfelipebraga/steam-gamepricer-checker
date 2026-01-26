/**
 * Currency and country code utilities
 * Maps browser locale and country codes to Steam country codes
 */

export interface CurrencyInfo {
  countryCode: string; // Steam country code (e.g., "br", "us")
  currency: string; // ISO currency code (e.g., "BRL", "USD")
  locale: string; // Locale string for formatting
}

/**
 * Map of country codes to Steam country codes and currency info
 * Steam uses 2-letter country codes (ISO 3166-1 alpha-2)
 */
const COUNTRY_TO_CURRENCY: Record<string, CurrencyInfo> = {
  // Americas
  US: { countryCode: "us", currency: "USD", locale: "en-US" },
  BR: { countryCode: "br", currency: "BRL", locale: "pt-BR" },
  CA: { countryCode: "ca", currency: "CAD", locale: "en-CA" },
  MX: { countryCode: "mx", currency: "MXN", locale: "es-MX" },
  AR: { countryCode: "ar", currency: "ARS", locale: "es-AR" },
  CL: { countryCode: "cl", currency: "CLP", locale: "es-CL" },
  CO: { countryCode: "co", currency: "COP", locale: "es-CO" },
  PE: { countryCode: "pe", currency: "PEN", locale: "es-PE" },
  
  // Europe
  GB: { countryCode: "gb", currency: "GBP", locale: "en-GB" },
  DE: { countryCode: "de", currency: "EUR", locale: "de-DE" },
  FR: { countryCode: "fr", currency: "EUR", locale: "fr-FR" },
  IT: { countryCode: "it", currency: "EUR", locale: "it-IT" },
  ES: { countryCode: "es", currency: "EUR", locale: "es-ES" },
  NL: { countryCode: "nl", currency: "EUR", locale: "nl-NL" },
  PL: { countryCode: "pl", currency: "PLN", locale: "pl-PL" },
  RU: { countryCode: "ru", currency: "RUB", locale: "ru-RU" },
  TR: { countryCode: "tr", currency: "TRY", locale: "tr-TR" },
  
  // Asia
  JP: { countryCode: "jp", currency: "JPY", locale: "ja-JP" },
  CN: { countryCode: "cn", currency: "CNY", locale: "zh-CN" },
  KR: { countryCode: "kr", currency: "KRW", locale: "ko-KR" },
  IN: { countryCode: "in", currency: "INR", locale: "en-IN" },
  SG: { countryCode: "sg", currency: "SGD", locale: "en-SG" },
  AU: { countryCode: "au", currency: "AUD", locale: "en-AU" },
  NZ: { countryCode: "nz", currency: "NZD", locale: "en-NZ" },
  
  // Default fallback
  DEFAULT: { countryCode: "us", currency: "USD", locale: "en-US" },
};

/**
 * Detect country code from browser locale
 */
export function detectCountryFromLocale(): string {
  if (typeof window === "undefined") return "us";
  
  // Try to get from navigator.language or navigator.languages
  const locale = navigator.language || navigator.languages?.[0] || "en-US";
  
  // Extract country code from locale (e.g., "pt-BR" -> "BR")
  const parts = locale.split("-");
  const countryCode = parts[parts.length - 1]?.toUpperCase();
  
  if (countryCode && COUNTRY_TO_CURRENCY[countryCode]) {
    return countryCode;
  }
  
  // Try to extract from timezone (less accurate but better than nothing)
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Some timezone heuristics
    if (timezone.includes("America/Sao_Paulo") || timezone.includes("America/Fortaleza")) {
      return "BR";
    }
    if (timezone.includes("America/New_York") || timezone.includes("America/Los_Angeles")) {
      return "US";
    }
    if (timezone.includes("Europe/")) {
      // Default to Germany for Europe if we can't determine
      return "DE";
    }
  } catch {
    // Ignore errors
  }
  
  return "US"; // Default to US
}

/**
 * Get currency info from country code
 */
export function getCurrencyInfo(countryCode?: string): CurrencyInfo {
  const code = (countryCode || detectCountryFromLocale()).toUpperCase();
  return COUNTRY_TO_CURRENCY[code] || COUNTRY_TO_CURRENCY.DEFAULT;
}

/**
 * Get Steam country code from country code
 */
export function getSteamCountryCode(countryCode?: string): string {
  return getCurrencyInfo(countryCode).countryCode;
}

/**
 * Format price based on currency
 */
export function formatPrice(price: number, currency: string, locale?: string): string {
  const amount = price / 100; // Convert from cents
  const currencyInfo = Object.values(COUNTRY_TO_CURRENCY).find(
    (info) => info.currency === currency,
  );
  const formatLocale = locale || currencyInfo?.locale || "en-US";
  
  return new Intl.NumberFormat(formatLocale, {
    style: "currency",
    currency: currency,
  }).format(amount);
}

/**
 * Get all available currencies for selection
 */
export function getAvailableCurrencies(): Array<{
  countryCode: string;
  currency: string;
  name: string;
  flag?: string;
}> {
  return [
    { countryCode: "us", currency: "USD", name: "United States Dollar" },
    { countryCode: "br", currency: "BRL", name: "Brazilian Real" },
    { countryCode: "ca", currency: "CAD", name: "Canadian Dollar" },
    { countryCode: "gb", currency: "GBP", name: "British Pound" },
    { countryCode: "de", currency: "EUR", name: "Euro (Germany)" },
    { countryCode: "fr", currency: "EUR", name: "Euro (France)" },
    { countryCode: "jp", currency: "JPY", name: "Japanese Yen" },
    { countryCode: "au", currency: "AUD", name: "Australian Dollar" },
    { countryCode: "mx", currency: "MXN", name: "Mexican Peso" },
    { countryCode: "ar", currency: "ARS", name: "Argentine Peso" },
  ];
}
