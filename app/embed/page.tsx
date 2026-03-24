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

  const [greenDaysYTD, setGreenDaysYTD] = useState<number | null>(null);
  const [redDaysYTD, setRedDaysYTD] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/index?range=${range}`, { cache: "no-store" });
      const json: ApiResponse = await res.json();

      setData(json.series || []);
      setCurrent(json.current ?? null);
      setChange(json.change ?? null);
    }

    load();
    const i = setInterval(load, 60000);
    return () => clearInterval(i);
  }, [range]);

  useEffect(() => {
    async function loadYTD() {
      const res = await fetch(`/api/index?range=YTD`, { cache: "no-store" });
      const json: ApiResponse = await res.json();
      const { green, red } = countGreenRedDays(json.series || []);
      setGreenDaysYTD(green);
      setRedDaysYTD(red);
    }

    loadYTD();
  }, []);

  const positive = change !== null && change >= 0;
  const lineColor = positive ? "#16a34a" : "#dc2626";

  const gradientTop = positive
    ? "rgba(22,163,74,0.12)"
    : "rgba(220,38,38,0.10)";

  const gradientBottom = "rgba(0,0,0,0)";

  const baselineValue = useMemo(() => {
    const first = data.find((d) => typeof d.value === "number");
    return first?.value ?? null;
  }, [data]);

  return (
    <div className={`${manrope.className} h-full w-full bg-white text-[#111]`}>
      <div className="flex h-full flex-col gap-2 px-[14px] py-[14px]">

        {/* HEADER */}
        <div className="flex items-start justify-between">

          <div>
            <h1 className="text-[20px] font-medium tracking-tight">
              Idiocracy Index
            </h1>
            <p className="text-[10px] text-black/45 mt-1">
              A live index of convenience, consumption, and decline.
            </p>
          </div>

          {/* TRACKER */}
          <div className="flex items-center gap-4 text-[12px] font-medium text-black/50 whitespace-nowrap">
            <span>
              <span className="text-[#16a34a] font-semibold">
                {greenDaysYTD ?? "—"}
              </span>{" "}
              up
            </span>
            <span>
              <span className="text-[#dc2626] font-semibold">
                {redDaysYTD ?? "—"}
              </span>{" "}
              down
            </span>
          </div>

        </div>

        {/* VALUE */}
        <div>
          <div className="text-[32px] font-medium">
            {current !== null ? current.toFixed(2) : "—"}
          </div>

          <div
            className="text-[11px] font-medium mt-1"
            style={{
              color: change === null ? "rgba(0,0,0,0.4)" : lineColor,
            }}
          >
            {change !== null
              ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}% ${range}`
              : "—"}
          </div>
        </div>

        {/* RANGE */}
        <div className="flex gap-1.5 flex-wrap">
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                r === range
                  ? "bg-black text-white"
                  : "bg-black/5 text-black/60"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* CHART */}
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <defs>
                <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={gradientTop} />
                  <stop offset="100%" stopColor={gradientBottom} />
                </linearGradient>
              </defs>

              <XAxis dataKey="label" hide />
              <YAxis hide />

              {baselineValue && (
                <ReferenceLine
                  y={baselineValue}
                  stroke="rgba(0,0,0,0.1)"
                  strokeDasharray="3 5"
                />
              )}

              <Tooltip
                isAnimationActive={false}
                content={<TinyTooltip color={lineColor} />}
              />

              <Area
                dataKey="value"
                fill="url(#fill)"
                stroke="none"
                isAnimationActive={false}
              />

              <Line
                dataKey="value"
                stroke={lineColor}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* FOOTER */}
        <div className="text-[9px] text-black/30">
          Not investment advice.
        </div>

      </div>
    </div>
  );
}