"use client";

import { useEffect, useState } from "react";
import { Manrope } from "next/font/google";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

type RangeKey = "1D" | "1W" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "ALL";

type Point = {
  date: string;
  value: number;
  label: string;
};

type ApiResponse = {
  series: Point[];
  current: number | null;
  change: number | null;
};

const RANGE_OPTIONS: RangeKey[] = ["1D", "1W", "1M", "3M", "6M", "YTD", "1Y", "ALL"];

function formatTooltipLabel(label: unknown) {
  if (typeof label === "string" || typeof label === "number") {
    return String(label);
  }
  return "";
}

export default function Page() {
  const [range, setRange] = useState<RangeKey>("6M");
  const [data, setData] = useState<Point[]>([]);
  const [current, setCurrent] = useState<number | null>(null);
  const [change, setChange] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);

      try {
        const res = await fetch(`/api/index?range=${range}`, {
          cache: "no-store",
        });

        const json: ApiResponse = await res.json();

        if (!cancelled) {
          setData(Array.isArray(json.series) ? json.series : []);
          setCurrent(typeof json.current === "number" ? json.current : null);
          setChange(typeof json.change === "number" ? json.change : null);
        }
      } catch (error) {
        console.error("Failed to load index data:", error);
        if (!cancelled) {
          setData([]);
          setCurrent(null);
          setChange(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [range]);

  const positive = change !== null && change >= 0;

  return (
    <div className={`${manrope.className} min-h-screen bg-[#0a0a0a] text-white`}>
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <h1 className="mb-1 text-[40px] font-extrabold tracking-[-0.03em]">
          Idiocracy Index
        </h1>
        <p className="mb-8 text-[15px] text-white/55">
          A custom equal-weighted thematic index
        </p>

        <div className="mb-6">
          <div className="text-[56px] font-extrabold leading-none tracking-[-0.04em]">
            {current !== null ? current.toFixed(2) : "—"}
          </div>

          <div
            className={`mt-2 text-[15px] font-semibold ${
              change === null
                ? "text-white/45"
                : positive
                ? "text-[#22c55e]"
                : "text-[#ef4444]"
            }`}
          >
            {change !== null ? (
              <>
                {positive ? "+" : ""}
                {change.toFixed(2)}%&nbsp;
                <span className="text-white/45">{range}</span>
              </>
            ) : loading ? (
              "Loading..."
            ) : (
              "Unavailable"
            )}
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((item) => {
            const active = range === item;

            return (
              <button
                key={item}
                onClick={() => setRange(item)}
                className={`rounded-full px-4 py-1.5 text-[12px] font-semibold tracking-[0.01em] transition ${
                  active
                    ? "bg-white text-black"
                    : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>

        <div className="h-[460px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" hide />
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <Tooltip
                cursor={false}
                labelFormatter={formatTooltipLabel}
                formatter={(value: number) => [value.toFixed(2), "Index"]}
                contentStyle={{
                  backgroundColor: "#101010",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  color: "#ffffff",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                }}
                labelStyle={{
                  color: "rgba(255,255,255,0.5)",
                  marginBottom: 6,
                }}
                itemStyle={{
                  color: "#ffffff",
                }}
              />

              <Line
                type="monotone"
                dataKey="value"
                stroke={positive ? "#22c55e" : "#22c55e"}
                strokeWidth={2.25}
                dot={false}
                activeDot={{ r: 0 }}
                isAnimationActive={false}
                style={{
                  filter: "drop-shadow(0 0 10px rgba(34,197,94,0.42))",
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 text-[12px] text-white/35">
          For informational and creative purposes only. Not investment advice.
        </div>
      </div>
    </div>
  );
}