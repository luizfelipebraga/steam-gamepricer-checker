"use client";

import { useCurrency } from "@/contexts/currency-context";

export function CurrencySelector() {
  const { currencyInfo, setCountryCode, availableCurrencies } = useCurrency();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="currency-select" className="text-sm text-gray-300">
        Currency:
      </label>
      <select
        id="currency-select"
        value={currencyInfo.countryCode}
        onChange={(e) => setCountryCode(e.target.value)}
        className="rounded border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {availableCurrencies.map((curr) => (
          <option key={curr.countryCode} value={curr.countryCode}>
            {curr.currency} - {curr.name}
          </option>
        ))}
      </select>
    </div>
  );
}
