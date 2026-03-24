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
}: any) {
  if (!active || !payload?.length) return null;

  const value =
    typeof payload[0]?.value === "number"
      ? payload[0].value.toFixed(2)
      : "—";

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 8,
        padding: "6px 8px",
        boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ fontSize: 10, color: "rgba(0,0,0,0.45)" }}>{label}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color }}>{value}</div>
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
      const res = await fetch(`/api/index?range=${range}`, {
        cache: "no-store",
      });
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
      const res = await fetch(`/api/index?range=YTD`, {
        cache: "no-store",
      });
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
    ? "rgba(22,163,74,0.10)"
    : "rgba(220,38,38,0.08)";

  const baselineValue = useMemo(() => {
    const first = data.find((d) => typeof d.value === "number");
    return first?.value ?? null;
  }, [data]);

  return (
    <div className={`${manrope.className} h-full w-full bg-white text-[#111]`}>
      <div className="flex h-full flex-col px-[18px] py-[18px]">

        {/* HEADER */}
        <div className="flex items-start justify-between">

          {/* LEFT */}
          <div>
            <h1 className="text-[18px] font-medium tracking-tight">
              Idiocracy Index
            </h1>

            <p className="mt-[6px] text-[9px] text-black/45">
              A live index of convenience, consumption, and decline.
            </p>

            {/* VALUE + CHANGE INLINE */}
            <div className="mt-[18px] flex items-end gap-[10px]">
              <div className="text-[44px] font-medium leading-none">
                {current !== null ? current.toFixed(2) : "—"}
              </div>

              <div
                className="text-[12px] font-medium pb-[6px]"
                style={{ color: lineColor }}
              >
                {change !== null
                  ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}% ${range}`
                  : "—"}
              </div>
            </div>

            {/* RANGE BUTTONS */}
            <div className="mt-[14px] flex gap-[6px]">
              {RANGE_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`rounded-full px-[9px] py-[4px] text-[9px] font-medium ${
                    r === range
                      ? "bg-black text-white"
                      : "bg-black/5 text-black/60"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT BADGES */}
          <div className="flex flex-col items-end gap-[6px] mt-[2px]">
            <div className="rounded-full bg-[#16a34a] px-[10px] py-[5px] text-[11px] text-white font-medium">
              {greenDaysYTD ?? "—"} Green days
            </div>
            <div className="rounded-full bg-[#dc2626] px-[10px] py-[5px] text-[11px] text-white font-medium">
              {redDaysYTD ?? "—"} Red days
            </div>
          </div>

        </div>

        {/* CHART */}
        <div className="mt-[14px] flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <defs>
                <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={gradientTop} />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>

              <XAxis dataKey="label" hide />
              <YAxis hide domain={["dataMin", "dataMax"]} />

              {baselineValue && (
                <ReferenceLine
                  y={baselineValue}
                  stroke="rgba(0,0,0,0.1)"
                  strokeDasharray="3 5"
                />
              )}

              <Tooltip
                cursor={{ stroke: "rgba(0,0,0,0.12)", strokeWidth: 1 }}
                isAnimationActive={false}
                content={<TinyTooltip color={lineColor} />}
              />

              <Area
                type="monotone"
                dataKey="value"
                fill="url(#fill)"
                stroke="none"
                isAnimationActive={false}
              />

              <Line
                type="monotone"
                dataKey="value"
                stroke={lineColor}
                strokeWidth={1.4}
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* FOOTER */}
        <div className="text-[9px] text-black/30 mt-[6px]">
          Not investment advice.
        </div>
      </div>
    </div>
  );
}