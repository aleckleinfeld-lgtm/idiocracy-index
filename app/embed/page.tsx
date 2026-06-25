"use client";

import { useEffect, useMemo, useState } from "react";
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

function TinyTooltip({ active, payload, label, color }: any) {
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
        fontFamily: "elza, sans-serif",
      }}
    >
      <div style={{ fontSize: 10, color: "rgba(0,0,0,0.45)" }}>{label}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

export default function EmbedPage() {
  const [range, setRange] = useState<RangeKey>("1D");
  const [data, setData] = useState<Point[]>([]);
  const [current, setCurrent] = useState<number | null>(null);
  const [change, setChange] = useState<number | null>(null);

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

  const positive = change !== null && change >= 0;
  const lineColor = positive ? "#16a34a" : "#dc2626";

  const gradientTop = "rgba(0,0,0,0.04)";

  const baselineValue = useMemo(() => {
    const first = data.find((d) => typeof d.value === "number");
    return first?.value ?? null;
  }, [data]);

  const baselineLabel = range === "1D" ? "Open" : "Range start";

  return (
    <>
      <style>{`
        @import url("https://use.typekit.net/dkt1lmz.css");

        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          font-family: elza, sans-serif !important;
        }

        button {
          font-family: elza, sans-serif !important;
        }
      `}</style>

      <div
        className="h-full w-full text-[#111]"
        style={{
          fontFamily: "elza, sans-serif",
          backgroundColor: "#ffffff",
        }}
      >
        <div className="flex h-full flex-col px-[18px] py-[18px]">

          <div className="flex items-start justify-between gap-[20px]">
            <div>
              <h1 className="text-[18px] font-medium tracking-tight">
                Idiocracy Index
                <span
                  style={{
                    fontSize: "10px",
                    verticalAlign: "super",
                    marginLeft: 2,
                    opacity: 0.7,
                  }}
                >
                  ™
                </span>
              </h1>

              <p className="mt-[4px] text-[9px] text-black/45">
                A live index of convenience, consumption, and decline.
              </p>

              <div className="mt-[8px] flex items-end gap-[10px]">
                <div className="text-[36px] font-bold leading-none tracking-[-1.2px]">
                  {current !== null ? current.toFixed(2) : "—"}
                </div>

                <div
                  className="text-[12px] font-medium pb-[5px]"
                  style={{ color: lineColor }}
                >
                  {change !== null
                    ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}% ${range}`
                    : "—"}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "nowrap",
                gap: "3px",
                alignItems: "center",
              }}
            >
              {RANGE_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  style={{
                    fontSize: "8px",
                    fontWeight: 500,
                    padding: "3px 6px",
                    height: "17px",
                    minWidth: "28px",
                    borderRadius: "5px",
                    lineHeight: "1",
                    background: r === range ? "#000" : "rgba(0,0,0,0.05)",
                    color: r === range ? "#fff" : "rgba(0,0,0,0.6)",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-[16px] flex-1">
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
                    label={{
                      value: baselineLabel,
                      position: "right",
                      fill: "rgba(0,0,0,0.35)",
                      fontSize: 9,
                      fontFamily: "elza, sans-serif",
                    }}
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

          <div className="text-[9px] text-black/30 mt-[6px]">
            Not investment advice.
          </div>
        </div>
      </div>
    </>
  );
}
