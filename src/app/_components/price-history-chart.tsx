"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useCurrency } from "@/contexts/currency-context";
import { formatPrice } from "@/lib/currency";

interface PriceHistoryData {
  recordedAt: Date;
  finalPrice: number;
  initialPrice: number | null;
  discountPercent: number | null;
  currency: string;
  isOnSale: boolean;
}

interface PriceHistoryChartProps {
  data: PriceHistoryData[];
  currency: string;
}

export function PriceHistoryChart({
  data,
  currency,
}: PriceHistoryChartProps) {
  const { currencyInfo } = useCurrency();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const chartData = data
    .map((item) => ({
      date: formatDate(item.recordedAt),
      price: item.finalPrice,
      originalPrice: item.initialPrice,
      discount: item.discountPercent,
    }))
    .reverse(); // Reverse to show oldest to newest

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg bg-gray-800 text-gray-400">
        No price history available
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg bg-gray-800 p-4">
      <h3 className="mb-4 text-xl font-semibold text-white">
        Price History
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <XAxis
            dataKey="date"
            stroke="#9ca3af"
            fontSize={12}
            tickLine={{ stroke: "#9ca3af" }}
          />
          <YAxis
            stroke="#9ca3af"
            fontSize={12}
            tickLine={{ stroke: "#9ca3af" }}
            tickFormatter={(value) =>
              formatPrice(value, currency, currencyInfo.locale)
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "8px",
            }}
            formatter={(value: number) =>
              formatPrice(value, currency, currencyInfo.locale)
            }
            labelStyle={{ color: "#fff" }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: "#10b981", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
