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
        borderRadius: 10,
        padding: "7px 9px",
        minWidth: 72,
        boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "rgba(0,0,0,0.42)",
          marginBottom: 3,
          fontWeight: 500,
          lineHeight: 1.1,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 12,
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
    (p): p is Point & { value: number } => typeof p.value === "number"
  );

  for (let i = 1; i < valid.length; i++) {
    if (valid[i].value > valid[i - 1].value) green++;
    else if (valid[i].value < valid[i - 1].value) red++;
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
  const gradientTop = positive ? "rgba(22,163,74,0.10)" : "rgba(220,38,38,0.08)";
  const gradientBottom = "rgba(0,0,0,0)";

  const baselineValue = useMemo(() => {
    const first = data.find((d) => typeof d.value === "number");
    return first?.value ?? null;
  }, [data]);

  return (
    <div className={`${manrope.className} h-full w-full bg-white text-[#111111]`}>
      <div className="flex h-full flex-col px-[18px] py-[18px]">
        <div className="flex items-start justify-between gap-6">
          <div className="flex min-w-0 flex-col">
            <h1 className="text-[18px] font-medium tracking-[-0.03em] leading-none">
              Idiocracy Index
            </h1>

            <p className="mt-[10px] text-[9px] leading-[1.25] text-black/42">
              A live index of convenience, consumption, and decline.
            </p>

            <div className="mt-[22px] text-[40px] font-medium tracking-[-0.04em] leading-none">
              {current !== null ? current.toFixed(2) : "—"}
            </div>

            <div
              className="mt-[8px] text-[10px] font-medium"
              style={{
                color: change === null ? "rgba(0,0,0,0.40)" : lineColor,
              }}
            >
              {change !== null
                ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}% ${range}`
                : loading
                ? "Loading..."
                : "—"}
            </div>

            <div className="mt-[18px] flex flex-wrap gap-[6px]">
              {RANGE_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`rounded-full px-[10px] py-[4px] text-[9px] font-medium transition ${
                    r === range
                      ? "bg-black text-white"
                      : "bg-black/5 text-black/55 hover:bg-black/8 hover:text-black/75"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-[8px] pt-[2px]">
            <div className="rounded-[10px] bg-[#16a34a] px-[10px] py-[6px] text-[11px] font-medium leading-none text-white">
              {greenDaysYTD ?? "—"} Green days
            </div>
            <div className="rounded-[10px] bg-[#dc2626] px-[10px] py-[6px] text-[11px] font-medium leading-none text-white">
              {redDaysYTD ?? "—"} Red days
            </div>
          </div>
        </div>

        <div className="mt-[18px] flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 6, right: 2, left: 2, bottom: 0 }}>
              <defs>
                <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={gradientTop} />
                  <stop offset="100%" stopColor={gradientBottom} />
                </linearGradient>
              </defs>

              <XAxis dataKey="label" hide />
              <YAxis hide domain={["dataMin", "dataMax"]} />

              {baselineValue !== null && (
                <ReferenceLine
                  y={baselineValue}
                  stroke="rgba(0,0,0,0.10)"
                  strokeDasharray="3 5"
                />
              )}

              <Tooltip
                cursor={{ stroke: "rgba(0,0,0,0.14)", strokeWidth: 1 }}
                isAnimationActive={false}
                content={<TinyTooltip color={lineColor} />}
              />

              <Area
                type="monotone"
                dataKey="value"
                fill="url(#fill)"
                stroke="none"
                isAnimationActive={false}
                connectNulls={false}
              />

              <Line
                type="monotone"
                dataKey="value"
                stroke={lineColor}
                strokeWidth={1.4}
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

        <div className="mt-[10px] text-[9px] text-black/28">
          Not investment advice.
        </div>
      </div>
    </div>
  );
}