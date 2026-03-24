const fs = require("fs");

// PAGE
fs.writeFileSync("app/page.tsx", `
"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const TICKERS = [
  "COST","HRB","SBUX","FOXA","KO","PEP","MNST",
  "RBLX","U","VUZI","MCD","YUM","DASH","UBER",
  "WM","RSG","PLTR"
];

export default function Page() {
  const [data, setData] = useState<any[]>([]);
  const [current, setCurrent] = useState<number>(0);
  const [change, setChange] = useState<number>(0);

  useEffect(() => {
    fetch("/api/index")
      .then((res) => res.json())
      .then((res) => {
        setData(res.series);
        setCurrent(res.current);
        setChange(res.change);
      });
  }, []);

  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen p-6">
      <h1 className="text-2xl font-semibold mb-1">
        Idiocracy Index
      </h1>
      <p className="text-gray-400 mb-6">
        A custom equal-weighted thematic index
      </p>

      <div className="mb-4">
        <div className="text-3xl font-bold">
          {current.toFixed(2)}
        </div>
        <div className={\`text-sm \${change >= 0 ? "text-green-400" : "text-red-400"}\`}>
          {change >= 0 ? "+" : ""}
          {change.toFixed(2)}%
        </div>
      </div>

      <div className="h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              style={{
                filter: "drop-shadow(0px 0px 8px rgba(34,197,94,0.6))",
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 text-sm text-gray-400">
        Holdings:
        <div className="mt-2 grid grid-cols-2 gap-1">
          {TICKERS.map((t) => (
            <div key={t}>{t}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
`);

// API
fs.mkdirSync("app/api/index", { recursive: true });

fs.writeFileSync("app/api/index/route.ts", `
import { NextResponse } from "next/server";

const TICKERS = [
  "COST","HRB","SBUX","FOXA","KO","PEP","MNST",
  "RBLX","U","VUZI","MCD","YUM","DASH","UBER",
  "WM","RSG","PLTR"
];

export async function GET() {
  const results = await Promise.all(
    TICKERS.map(async (ticker) => {
      const res = await fetch(
        \`https://query1.finance.yahoo.com/v8/finance/chart/\${ticker}?range=6mo&interval=1d\`
      );
      const json = await res.json();
      return json.chart.result[0].indicators.quote[0].close;
    })
  );

  const length = results[0].length;

  const series = Array.from({ length }).map((_, i) => {
    let total = 0;

    results.forEach((arr) => {
      const base = arr[0];
      const val = arr[i];
      if (base && val) total += val / base;
    });

    return {
      value: (total / results.length) * 100,
    };
  });

  const current = series.at(-1).value;
  const prev = series.at(-2).value;
  const change = ((current - prev) / prev) * 100;

  return NextResponse.json({
    series,
    current,
    change,
  });
}
`);

console.log("Setup complete");
