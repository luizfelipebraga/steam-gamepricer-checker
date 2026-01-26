"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { detectCountryFromLocale, getCurrencyInfo, type CurrencyInfo } from "@/lib/currency";

interface CurrencyContextType {
  currencyInfo: CurrencyInfo;
  setCountryCode: (countryCode: string) => void;
  availableCurrencies: Array<{
    countryCode: string;
    currency: string;
    name: string;
  }>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = "steam-price-checker-currency";

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [countryCode, setCountryCodeState] = useState<string | null>(null);
  const [currencyInfo, setCurrencyInfo] = useState<CurrencyInfo>(() => {
    // Try to get from localStorage first
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as CurrencyInfo;
          return parsed;
        } catch {
          // Invalid stored value, ignore
        }
      }
    }
    // Fallback to auto-detection
    return getCurrencyInfo();
  });

  // Auto-detect on mount if no preference is stored
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEY)) {
      const detected = detectCountryFromLocale();
      const info = getCurrencyInfo(detected);
      setCurrencyInfo(info);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
    }
  }, []);

  // Update currency info when country code changes
  useEffect(() => {
    if (countryCode) {
      const info = getCurrencyInfo(countryCode);
      setCurrencyInfo(info);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
    }
  }, [countryCode]);

  const setCountryCode = (code: string) => {
    setCountryCodeState(code);
    const info = getCurrencyInfo(code);
    setCurrencyInfo(info);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
    }
  };

  const availableCurrencies = [
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

  return (
    <CurrencyContext.Provider
      value={{
        currencyInfo,
        setCountryCode,
        availableCurrencies,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
