import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE_DATE = "2026-01-01";

const TICKERS = [
  "COST",
  "WMT",
  "TGT",
  "AMZN",
  "CROX",
  "PDD",
  "DASH",
  "UBER",
  "NFLX",
  "RBLX",
  "U",
  "FOXA",
  "META",
  "TKO",
  "KLAR",
  "MCD",
  "YUM",
  "SBUX",
  "KO",
  "PEP",
  "MNST",
  "PLTR",
  "TSLA",
  "F",
  "WM",
  "RSG",
] as const;

type RangeKey = "1D" | "1W" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "ALL";

type YahooPoint = {
  timestamp: number;
  close: number;
};

type SeriesPoint = {
  date: string;
  label: string;
  timestamp: number | null;
  value: number | null;
};

function getYahooParams(range: RangeKey) {
  switch (range) {
    case "1D":
      return { range: "1d", interval: "5m" };
    case "1W":
      return { range: "5d", interval: "30m" };
    case "1M":
      return { range: "1mo", interval: "1d" };
    case "3M":
      return { range: "3mo", interval: "1d" };
    case "6M":
      return { range: "6mo", interval: "1d" };
    case "YTD":
      return { range: "ytd", interval: "1d" };
    case "1Y":
      return { range: "1y", interval: "1d" };
    case "ALL":
      return { range: "ytd", interval: "1d" };
    default:
      return { range: "6mo", interval: "1d" };
  }
}

function formatLabel(timestamp: number, range: RangeKey) {
  const date = new Date(timestamp * 1000);

  if (range === "1D") {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
    });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: range === "1Y" || range === "YTD" || range === "ALL" ? "2-digit" : undefined,
    timeZone: "America/New_York",
  });
}

async function fetchTickerSeries(ticker: string, rangeKey: RangeKey): Promise<YahooPoint[]> {
  const { range, interval } = getYahooParams(rangeKey);

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=${range}&interval=${interval}&includePrePost=false&events=div%2Csplits`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json",
    },
  });

  if (!res.ok) throw new Error(`Yahoo request failed for ${ticker}`);

  const json = await res.json();
  const result = json?.chart?.result?.[0];
  const timestamps: number[] = result?.timestamp || [];
  const closes: Array<number | null> = result?.indicators?.quote?.[0]?.close || [];

  const points: YahooPoint[] = [];

  for (let i = 0; i < timestamps.length; i += 1) {
    const timestamp = timestamps[i];
    const close = closes[i];

    if (typeof timestamp === "number" && typeof close === "number" && Number.isFinite(close)) {
      points.push({ timestamp, close });
    }
  }

  return points;
}

async function fetchBaseSeries(ticker: string): Promise<YahooPoint[]> {
  const period1 = Math.floor(new Date(`${BASE_DATE}T00:00:00-05:00`).getTime() / 1000);
  const period2 = Math.floor(Date.now() / 1000);

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${period1}&period2=${period2}&interval=1d&includePrePost=false&events=div%2Csplits`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json",
    },
  });

  if (!res.ok) throw new Error(`Yahoo base request failed for ${ticker}`);

  const json = await res.json();
  const result = json?.chart?.result?.[0];
  const timestamps: number[] = result?.timestamp || [];
  const closes: Array<number | null> = result?.indicators?.quote?.[0]?.close || [];

  const points: YahooPoint[] = [];

  for (let i = 0; i < timestamps.length; i += 1) {
    const timestamp = timestamps[i];
    const close = closes[i];

    if (typeof timestamp === "number" && typeof close === "number" && Number.isFinite(close)) {
      points.push({ timestamp, close });
    }
  }

  return points;
}

function removeBadTail(points: SeriesPoint[]) {
  if (points.length < 3) return points;
  const cleaned = [...points];

  while (cleaned.length >= 3) {
    const last = cleaned[cleaned.length - 1].value;
    const prev = cleaned[cleaned.length - 2].value;

    if (typeof last !== "number" || typeof prev !== "number" || prev === 0) {
      cleaned.pop();
      continue;
    }

    const move = Math.abs((last - prev) / prev);
    if (move > 0.15) {
      cleaned.pop();
      continue;
    }

    break;
  }

  return cleaned;
}

function findBaseValue(points: YahooPoint[]) {
  return points.find((p) => p.close > 0)?.close ?? null;
}

function findLatestValue(points: YahooPoint[]) {
  return [...points].reverse().find((p) => p.close > 0)?.close ?? null;
}

function getLastKnownClose(points: YahooPoint[], timestamp: number) {
  let last: number | null = null;

  for (const point of points) {
    if (point.timestamp <= timestamp) {
      last = point.close;
    } else {
      break;
    }
  }

  return last;
}

export async function GET(req: NextRequest) {
  const rawRange = (req.nextUrl.searchParams.get("range") || "6M").toUpperCase() as RangeKey;

  const range: RangeKey = ["1D", "1W", "1M", "3M", "6M", "YTD", "1Y", "ALL"].includes(rawRange)
    ? rawRange
    : "6M";

  try {
    const [rangeSettled, baseSettled] = await Promise.all([
      Promise.allSettled(TICKERS.map((ticker) => fetchTickerSeries(ticker, range))),
      Promise.allSettled(TICKERS.map((ticker) => fetchBaseSeries(ticker))),
    ]);

    const rangeSeries = rangeSettled
      .filter(
        (result): result is PromiseFulfilledResult<YahooPoint[]> =>
          result.status === "fulfilled" && result.value.length > 1
      )
      .map((result) => result.value);

    const baseSeries = baseSettled
      .filter(
        (result): result is PromiseFulfilledResult<YahooPoint[]> =>
          result.status === "fulfilled" && result.value.length > 1
      )
      .map((result) => result.value);

    if (rangeSeries.length < 2 || baseSeries.length < 2) {
      return NextResponse.json({ series: [], current: null, change: null });
    }

    const baseValues = baseSeries.map(findBaseValue);
    const latestValues = baseSeries.map(findLatestValue);

    let currentTotal = 0;
    let currentCount = 0;

    for (let i = 0; i < baseSeries.length; i += 1) {
      const base = baseValues[i];
      const latest = latestValues[i];

      if (typeof base === "number" && typeof latest === "number" && base > 0) {
        currentTotal += latest / base;
        currentCount += 1;
      }
    }

    const current = currentCount > 0 ? (currentTotal / currentCount) * 100 : null;

    const allTimestamps = Array.from(
      new Set(rangeSeries.flatMap((series) => series.map((point) => point.timestamp)))
    ).sort((a, b) => a - b);

    const rawSeries = allTimestamps
      .map((timestamp): SeriesPoint | null => {
        let total = 0;
        let count = 0;

        for (let i = 0; i < rangeSeries.length; i += 1) {
          const value = getLastKnownClose(rangeSeries[i], timestamp);
          const base = baseValues[i];

          if (
            typeof value === "number" &&
            typeof base === "number" &&
            Number.isFinite(value) &&
            Number.isFinite(base) &&
            base > 0
          ) {
            total += value / base;
            count += 1;
          }
        }

        if (count < 2) return null;

        return {
          date: new Date(timestamp * 1000).toISOString(),
          label: formatLabel(timestamp, range),
          timestamp,
          value: (total / count) * 100,
        };
      })
      .filter((point): point is SeriesPoint => point !== null);

    const cleanedActualSeries = removeBadTail(rawSeries);

    const firstRangeValue = cleanedActualSeries[0]?.value;
    const lastRangeValue = cleanedActualSeries[cleanedActualSeries.length - 1]?.value;

    const change =
      typeof firstRangeValue === "number" &&
      typeof lastRangeValue === "number" &&
      firstRangeValue !== 0
        ? ((lastRangeValue - firstRangeValue) / firstRangeValue) * 100
        : null;

    return NextResponse.json({
      series: cleanedActualSeries,
      current,
      change,
    });
  } catch (error) {
    console.error("Index API failed:", error);
    return NextResponse.json({ series: [], current: null, change: null });
  }
}
