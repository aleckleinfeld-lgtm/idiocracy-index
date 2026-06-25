"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  ComposedChart,
  Label,
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
          width: 100%;
          min-height: 100%;
          overflow: hidden;
        }

        button, select {
          font-family: elza, sans-serif !important;
        }

        .embed-shell {
          height: 100vh;
          width: 100vw;
          background: #ffffff;
          color: #111;
          font-family: elza, sans-serif;
          box-sizing: border-box;
        }

        .embed-inner {
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 18px;
          box-sizing: border-box;
        }

        .top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
        }

        .title {
          font-size: 18px;
          font-weight: 500;
          letter-spacing: -0.03em;
          line-height: 1;
          margin: 0;
        }

        .tm {
          font-size: 10px;
          vertical-align: super;
          margin-left: 2px;
          opacity: 0.7;
        }

        .subtitle {
          margin-top: 4px;
          font-size: 9px;
          line-height: 1.35;
          color: rgba(0,0,0,0.45);
        }

        .value-row {
          margin-top: 8px;
          display: flex;
          align-items: flex-end;
          gap: 10px;
        }

        .value {
          font-size: 36px;
          font-weight: 700;
          line-height: 0.95;
          letter-spacing: -0.04em;
        }

        .change {
          font-size: 12px;
          font-weight: 500;
          padding-bottom: 5px;
          line-height: 1.1;
        }

        .pills {
          display: flex;
          flex-wrap: nowrap;
          gap: 3px;
          align-items: center;
        }

        .pill {
          font-size: 8px;
          font-weight: 500;
          padding: 3px 6px;
          height: 17px;
          min-width: 28px;
          border-radius: 5px;
          line-height: 1;
          border: none;
          cursor: pointer;
        }

        .range-select-wrap {
          display: none;
        }

        .range-select {
          font-size: 12px;
          font-weight: 600;
          height: 32px;
          padding: 0 34px 0 12px;
          border-radius: 10px;
          border: 0;
          background: #000;
          color: #fff;
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
        }

        .range-select-shell {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        .range-select-shell::after {
          content: "⌄";
          position: absolute;
          right: 11px;
          top: 4px;
          color: #fff;
          font-size: 16px;
          line-height: 1;
          pointer-events: none;
        }

        .chart-wrap {
          margin-top: 16px;
          flex: 1;
          min-height: 0;
        }

        .note {
          font-size: 9px;
          color: rgba(0,0,0,0.30);
          margin-top: 6px;
        }

        @media (max-width: 520px) {
          html, body {
            overflow: hidden;
          }

          .embed-shell {
            height: 100vh;
            min-height: 430px;
          }

          .embed-inner {
            padding: 22px 20px 18px;
          }

  .top {
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

          .title {
            font-size: 26px;
            line-height: 0.95;
            letter-spacing: -0.055em;
          }

          .subtitle {
            margin-top: 14px;
            font-size: 13px;
            line-height: 1.35;
            max-width: 220px;
          }

          .value-row {
            margin-top: 22px;
            gap: 12px;
            align-items: center;
          }

          .value {
            font-size: 56px;
            line-height: 0.9;
            letter-spacing: -0.055em;
          }

          .change {
            font-size: 17px;
            line-height: 1.25;
            padding-bottom: 2px;
          }

          .pills {
            display: none;
          }

.range-select-wrap {
  display: flex;
  justify-content: flex-end;
  width: auto;
  flex-shrink: 0;
  order: 0;
}

          .chart-wrap {
            margin-top: 24px;
            flex: none;
            height: 155px;
          }

          .note {
            font-size: 12px;
            margin-top: 12px;
          }
        }
      `}</style>

      <div className="embed-shell">
        <div className="embed-inner">
          <div className="top">
            <div>
              <h1 className="title">
                Idiocracy Index<span className="tm">™</span>
              </h1>

              <p className="subtitle">
                A live index of convenience, consumption, and decline.
              </p>

              <div className="value-row">
                <div className="value">
                  {current !== null ? current.toFixed(2) : "—"}
                </div>

                <div className="change" style={{ color: lineColor }}>
                  {change !== null
                    ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}% ${range}`
                    : "—"}
                </div>
              </div>
            </div>

            <div className="pills">
              {RANGE_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className="pill"
                  style={{
                    background: r === range ? "#000" : "rgba(0,0,0,0.05)",
                    color: r === range ? "#fff" : "rgba(0,0,0,0.6)",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="range-select-wrap">
              <div className="range-select-shell">
                <select
                  className="range-select"
                  value={range}
                  onChange={(e) => setRange(e.target.value as RangeKey)}
                >
                  {RANGE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="chart-wrap">
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
                    stroke="rgba(0,0,0,0.12)"
                    strokeDasharray="3 5"
                  >
                    <Label
                      value={baselineLabel}
                      position="insideTopLeft"
                      offset={6}
                      fill="rgba(0,0,0,0.38)"
                      fontSize={9}
                      fontFamily="elza, sans-serif"
                    />
                  </ReferenceLine>
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

          <div className="note">Not investment advice.</div>
        </div>
      </div>
    </>
  );
}
