"use client";

import { useEffect, useMemo, useState } from "react";
import { Manrope } from "next/font/google";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
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

export default function EmbedPage() {
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

  const baselineValue = useMemo(() => {
    if (!data.length) return null;
    return data[0]?.value ?? null;
  }, [data]);

  return (
    <div className={`${manrope.className} h-full w-full bg-[#0a0a0a] text-white`}>
      <div className="flex h-full w-full flex-col px-[clamp(14px,2vw,22px)] py-[clamp(14px,2vw,20px)] gap-[10px]">

        {/* HEADER */}
        <div className="flex-shrink-0">
          <h1 className="text-[clamp(22px,3.5vw,34px)] font-extrabold tracking-[-0.04em] leading-[0.95]">
            Idiocracy Index
          </h1>

          <p className="mt-1 text-[clamp(11px,1.3vw,14px)] text-white/55 leading-tight">
            A live index of the companies cashing in on convenience, consumption, and cultural decline.
          </p>
        </div>

        {/* VALUE */}
        <div className="flex-shrink-0">
          <div className="text-[clamp(30px,5vw,52px)] font-extrabold tracking-[-0.045em] leading-none">
            {current !== null ? current.toFixed(2) : "—"}
          </div>

          <div
            className={`mt-1 text-[clamp(11px,1.3vw,14px)] font-semibold ${
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
                {change.toFixed(2)}% <span className="text-white/45">{range}</span>
              </>
            ) : loading ? (
              "Loading..."
            ) : (
              "Unavailable"
            )}
          </div>
        </div>

        {/* RANGE BUTTONS */}
        <div className="flex flex-wrap gap-2 flex-shrink-0">
          {RANGE_OPTIONS.map((item) => {
            const active = range === item;

            return (
              <button
                key={item}
                onClick={() => setRange(item)}
                className={`rounded-full px-[clamp(10px,1.5vw,14px)] py-[5px] text-[clamp(10px,1vw,12px)] font-semibold transition ${
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

        {/* CHART */}
        <div className="flex-1 min-h-0 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 6, right: 2, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" hide />
              <YAxis hide domain={["dataMin", "dataMax"]} />

              {baselineValue !== null && (
                <ReferenceLine
                  y={baselineValue}
                  stroke="rgba(255,255,255,0.15)"
                  strokeDasharray="3 5"
                />
              )}

              <Tooltip
                cursor={false}
                labelFormatter={(label: unknown) =>
                  typeof label === "string" || typeof label === "number"
                    ? String(label)
                    : ""
                }
                formatter={(value: unknown) => [
                  typeof value === "number" ? value.toFixed(2) : "",
                  "Index",
                ]}
                contentStyle={{
                  backgroundColor: "#101010",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "10px",
                  color: "#fff",
                }}
              />

              <Line
                type="monotone"
                dataKey="value"
                stroke="#22c55e"
                strokeWidth={2.25}
                dot={false}
                isAnimationActive={false}
                style={{
                  filter: "drop-shadow(0 0 8px rgba(34,197,94,0.4))",
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* DISCLAIMER */}
        <div className="text-[clamp(10px,1vw,12px)] text-white/35 flex-shrink-0">
          Not investment advice. For illustrative purposes only.
        </div>

      </div>
    </div>
  );
}