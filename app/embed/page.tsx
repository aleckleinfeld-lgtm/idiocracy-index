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
  weight: ["400", "500", "600", "700"],
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
        background: "#ffffff",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 8,
        padding: "6px 8px",
        minWidth: 68,
        boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "rgba(0,0,0,0.45)",
          marginBottom: 2,
          lineHeight: 1.1,
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function countGreenRedDays(series: Point[]) {
  let green = 0;
  let red = 0;

  const valid = series.filter(
    (point): point is Point & { value: number } => typeof point.value === "number"
  );

  for (let i = 1; i < valid.length; i += 1) {
    const prev = valid[i - 1].value;
    const curr = valid[i].value;

    if (curr > prev) green += 1;
    else if (curr < prev) red += 1;
  }

  return { green, red };
}

export default function EmbedPage() {
  const [range, setRange] = useState<RangeKey>("1D");
  const [data, setData] = useState<Point[]>([]);
  const [current, setCurrent] = useState<number | null>(null);
  const [change, setChange] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [greenDaysYTD, setGreenDaysYTD] = useState<number | null>(null);
  const [redDaysYTD, setRedDaysYTD] = useState<number | null>(null);

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

  useEffect(() => {
    let cancelled = false;

    async function loadYTDStats() {
      try {
        const res = await fetch(`/api/index?range=YTD`, {
          cache: "no-store",
        });

        const json: ApiResponse = await res.json();
        const { green, red } = countGreenRedDays(Array.isArray(json.series) ? json.series : []);

        if (!cancelled) {
          setGreenDaysYTD(green);
          setRedDaysYTD(red);
        }
      } catch (error) {
        console.error("Failed to load YTD stats:", error);

        if (!cancelled) {
          setGreenDaysYTD(null);
          setRedDaysYTD(null);
        }
      }
    }

    loadYTDStats();

    const interval = window.setInterval(loadYTDStats, 300_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const positive = change !== null && change >= 0;
  const lineColor = positive ? "#16a34a" : "#dc2626";
  const gradientTop = positive ? "rgba(22,163,74,0.14)" : "rgba(220,38,38,0.12)";
  const gradientBottom = positive ? "rgba(22,163,74,0.00)" : "rgba(220,38,38,0.00)";

  const baselineValue = useMemo(() => {
    const firstReal = data.find((point) => typeof point.value === "number");
    return firstReal?.value ?? null;
  }, [data]);

  return (
    <div className={`${manrope.className} h-full w-full bg-white text-[#111111]`}>
      <div className="flex h-full w-full flex-col gap-[8px] px-[clamp(12px,1.5vw,18px)] py-[clamp(12px,1.5vw,18px)]">
        <div className="flex items-start justify-between gap-4 flex-shrink-0">
          <div>
            <h1 className="text-[clamp(18px,2.5vw,26px)] font-medium tracking-[-0.03em] leading-[1] text-[#111111]">
              Idiocracy Index
            </h1>

            <p className="mt-1 text-[clamp(9px,1vw,11px)] font-medium text-black/45 leading-tight">
              A live index of the companies cashing in on convenience, consumption, and cultural decline.
            </p>
          </div>

          <div className="flex items-center gap-3 text-[clamp(8px,0.8vw,10px)] font-medium text-black/45 whitespace-nowrap">
            <span>
              <span className="text-[#16a34a]">{greenDaysYTD ?? "—"}</span> up
            </span>
            <span>
              <span className="text-[#dc2626]">{redDaysYTD ?? "—"}</span> down
            </span>
          </div>
        </div>

        <div className="flex-shrink-0">
          <div className="text-[clamp(24px,3.8vw,34px)] font-medium tracking-[-0.03em] leading-none text-[#111111]">
            {current !== null ? current.toFixed(2) : "—"}
          </div>

          <div
            className="mt-1 text-[clamp(9px,1vw,11px)] font-medium"
            style={{
              color: change === null ? "rgba(0,0,0,0.42)" : lineColor,
            }}
          >
            {change !== null ? (
              <>
                {positive ? "+" : ""}
                {change.toFixed(2)}% <span className="text-black/35">{range}</span>
              </>
            ) : loading ? (
              "Loading..."
            ) : (
              "Unavailable"
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 flex-shrink-0">
          {RANGE_OPTIONS.map((item) => {
            const active = range === item;

            return (
              <button
                key={item}
                onClick={() => setRange(item)}
                className={`rounded-full px-[clamp(8px,1vw,11px)] py-[3px] text-[clamp(8px,0.85vw,10px)] font-medium transition ${
                  active
                    ? "bg-[#111111] text-white"
                    : "bg-black/[0.04] text-black/55 hover:bg-black/[0.07] hover:text-black/80"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>

        <div className="flex-1 min-h-0 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 4, right: 2, left: 0, bottom: 0 }}>
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
                  stroke="rgba(0,0,0,0.12)"
                  strokeDasharray="3 5"
                />
              )}

              <Tooltip
                cursor={false}
                isAnimationActive={false}
                content={<TinyTooltip color={lineColor} />}
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
                strokeWidth={1.5}
                dot={false}
                activeDot={{
                  r: 3,
                  fill: lineColor,
                  stroke: "#ffffff",
                  strokeWidth: 1.5,
                }}
                isAnimationActive={false}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-shrink-0 text-[clamp(8px,0.8vw,10px)] font-medium text-black/30">
          Not investment advice. For illustrative purposes only.
        </div>
      </div>
    </div>
  );
}