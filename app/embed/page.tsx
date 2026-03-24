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
    const first = data[0]?.value;
    return typeof first === "number" ? first : null;
  }, [data]);

  return (
    <div className={`${manrope.className} embed-shell bg-[#0a0a0a] text-white`}>
      <div className="embed-inner">
        <div className="embed-top">
          <h1 className="embed-title">Idiocracy Index</h1>
          <p className="embed-subtitle">
            A live index of the companies cashing in on convenience, consumption, and cultural decline.
          </p>

          <div className="embed-value-wrap">
            <div className="embed-value">
              {current !== null ? current.toFixed(2) : "—"}
            </div>

            <div
              className={`embed-change ${
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

          <div className="embed-ranges">
            {RANGE_OPTIONS.map((item) => {
              const active = range === item;

              return (
                <button
                  key={item}
                  onClick={() => setRange(item)}
                  className={`embed-range-btn ${
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
        </div>

        <div className="embed-chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 6, right: 2, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" hide />
              <YAxis hide domain={["dataMin", "dataMax"]} />

              {baselineValue !== null && (
                <ReferenceLine
                  y={baselineValue}
                  stroke="rgba(255,255,255,0.14)"
                  strokeDasharray="3 5"
                  ifOverflow="extendDomain"
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
                stroke="#22c55e"
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
      </div>
    </div>
  );
}