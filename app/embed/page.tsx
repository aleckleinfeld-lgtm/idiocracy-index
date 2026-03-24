"use client";

import { useEffect, useMemo, useState } from "react";
import { Manrope } from "next/font/google";
import {
  Area,
  ComposedChart,
  Line,
  ReferenceLine,
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
  value: number | null;
  label: string;
  timestamp: number | null;
};

type ApiResponse = {
  series: Point[];
  current: number | null;
  change: number | null;
};

const RANGE_OPTIONS: RangeKey[] = ["1D", "1W", "1M", "3M", "6M", "YTD", "1Y", "ALL"];

function TinyTooltip({
  active,
  payload,
  label,
  color,
}: {
  active?: boolean;
  payload?: Array<{ value?: number | string | null }>;
  label?: string;
  color: string;
}) {
  if (!active || !payload?.length) return null;

  const rawValue = payload[0]?.value;
  const value = typeof rawValue === "number" ? rawValue.toFixed(2) : "—";

  return (
    <div
      style={{
        background: "#0f0f10",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
        padding: "10px 12px",
        minWidth: 88,
        boxShadow: "0 8px 24px rgba(0,0,0,0.28)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.5)",
          marginBottom: 4,
          lineHeight: 1.1,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function EmbedPage() {
  const [range, setRange] = useState<RangeKey>("1D");
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

    const interval = window.setInterval(loadData, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [range]);

  const positive = change !== null && change >= 0;
  const lineColor = positive ? "#22c55e" : "#ef4444";
  const gradientTop = positive ? "rgba(34,197,94,0.24)" : "rgba(239,68,68,0.22)";
  const gradientBottom = positive ? "rgba(34,197,94,0.00)" : "rgba(239,68,68,0.00)";

  const baselineValue = useMemo(() => {
    const firstReal = data.find((point) => typeof point.value === "number");
    return firstReal?.value ?? null;
  }, [data]);

  const currentDotData = useMemo(() => {
    const reversed = [...data].reverse();
    const latest = reversed.find((point) => typeof point.value === "number");
    return latest ?? null;
  }, [data]);

  return (
    <div className={`${manrope.className} h-full w-full bg-[#0a0a0a] text-white`}>
      <div className="flex h-full w-full flex-col gap-[10px] px-[clamp(14px,2vw,22px)] py-[clamp(14px,2vw,20px)]">
        <div className="flex-shrink-0">
          <h1 className="text-[clamp(22px,3.5vw,34px)] font-extrabold tracking-[-0.04em] leading-[0.95]">
            Idiocracy Index
          </h1>

          <p className="mt-1 text-[clamp(11px,1.3vw,14px)] text-white/55 leading-tight">
            A live index of the companies cashing in on convenience, consumption, and cultural decline.
          </p>
        </div>

        <div className="flex-shrink-0">
          <div className="text-[clamp(30px,5vw,52px)] font-extrabold tracking-[-0.045em] leading-none">
            {current !== null ? current.toFixed(2) : "—"}
          </div>

          <div
            className={`mt-1 text-[clamp(11px,1.3vw,14px)] font-semibold ${
              change === null ? "text-white/45" : ""
            }`}
            style={{
              color: change === null ? undefined : lineColor,
            }}
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

        <div className="flex-1 min-h-0 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 6, right: 2, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={gradientTop} />
                  <stop offset="100%" stopColor={gradientBottom} />
                </linearGradient>
              </defs>

              <XAxis dataKey="label" hide />
              <YAxis hide domain={["dataMin", "dataMax"]} />

              {baselineValue !== null && (
                <ReferenceLine
                  y={baselineValue}
                  stroke="rgba(255,255,255,0.14)"
                  strokeDasharray="3 6"
                />
              )}

              <Tooltip
                cursor={false}
                isAnimationActive={false}
                content={
                  <TinyTooltip color={lineColor} />
                }
              />

              <Area
                type="monotone"
                dataKey="value"
                stroke="none"
                fill="url(#lineFill)"
                isAnimationActive={false}
                connectNulls={false}
              />

              <Line
                type="monotone"
                dataKey="value"
                stroke={lineColor}
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: lineColor,
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
                connectNulls={false}
                style={{
                  filter: positive
                    ? "drop-shadow(0 0 10px rgba(34,197,94,0.42))"
                    : "drop-shadow(0 0 10px rgba(239,68,68,0.36))",
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-shrink-0 text-[clamp(10px,1vw,12px)] text-white/35">
          Not investment advice. For illustrative purposes only.
        </div>
      </div>
    </div>
  );
}