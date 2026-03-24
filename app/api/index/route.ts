import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TICKERS = [
  "COST",
  "HRB",
  "SBUX",
  "FOXA",
  "KO",
  "PEP",
  "MNST",
  "RBLX",
  "U",
  "VUZI",
  "MCD",
  "YUM",
  "DASH",
  "UBER",
  "WM",
  "RSG",
  "PLTR",
] as const;

type RangeKey = "1D" | "1W" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "ALL";

type YahooPoint = {
  timestamp: number;
  close: number;
};

type SeriesPoint = {
  date: string;
  value: number;
  label: string;
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
      return { range: "max", interval: "1wk" };
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
    });
  }

  if (range === "1W") {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  if (range === "ALL") {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: range === "1Y" || range === "YTD" ? "2-digit" : undefined,
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

  if (!res.ok) {
    throw new Error(`Yahoo request failed for ${ticker}`);
  }

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

function intersectTimestamps(seriesList: YahooPoint[][]) {
  if (!seriesList.length) return [];

  let common = new Set(seriesList[0].map((p) => p.timestamp));

  for (let i = 1; i < seriesList.length; i += 1) {
    const current = new Set(seriesList[i].map((p) => p.timestamp));
    common = new Set([...common].filter((ts) => current.has(ts)));
  }

  return [...common].sort((a, b) => a - b);
}

function removeBadTail(points: SeriesPoint[]) {
  if (points.length < 3) return points;

  const cleaned = [...points];

  while (cleaned.length >= 3) {
    const last = cleaned[cleaned.length - 1].value;
    const prev = cleaned[cleaned.length - 2].value;

    if (!Number.isFinite(last) || !Number.isFinite(prev) || prev === 0) {
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

export async function GET(req: NextRequest) {
  const rawRange = (req.nextUrl.searchParams.get("range") || "6M").toUpperCase() as RangeKey;

  const range: RangeKey = ["1D", "1W", "1M", "3M", "6M", "YTD", "1Y", "ALL"].includes(rawRange)
    ? rawRange
    : "6M";

  try {
    const settled = await Promise.allSettled(
      TICKERS.map((ticker) => fetchTickerSeries(ticker, range))
    );

    const validSeries = settled
      .filter(
        (result): result is PromiseFulfilledResult<YahooPoint[]> =>
          result.status === "fulfilled" && result.value.length > 1
      )
      .map((result) => result.value);

    if (validSeries.length < 2) {
      return NextResponse.json({
        series: [],
        current: null,
        change: null,
      });
    }

    const commonTimestamps = intersectTimestamps(validSeries);

    if (commonTimestamps.length < 2) {
      return NextResponse.json({
        series: [],
        current: null,
        change: null,
      });
    }

    const maps = validSeries.map(
      (series) => new Map(series.map((point) => [point.timestamp, point.close]))
    );

    const baseValues = maps.map((map) => {
      for (const ts of commonTimestamps) {
        const value = map.get(ts);
        if (typeof value === "number" && value > 0) return value;
      }
      return null;
    });

    const series: SeriesPoint[] = commonTimestamps
      .map((timestamp) => {
        let total = 0;
        let count = 0;

        for (let i = 0; i < maps.length; i += 1) {
          const value = maps[i].get(timestamp);
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
          value: (total / count) * 100,
          label: formatLabel(timestamp, range),
        };
      })
      .filter((point): point is SeriesPoint => point !== null);

    const cleanedSeries = removeBadTail(series);

    if (cleanedSeries.length < 2) {
      return NextResponse.json({
        series: [],
        current: null,
        change: null,
      });
    }

    const current = cleanedSeries[cleanedSeries.length - 1].value;
    const first = cleanedSeries[0].value;
    const change = first !== 0 ? ((current - first) / first) * 100 : null;

    return NextResponse.json({
      series: cleanedSeries,
      current,
      change,
    });
  } catch (error) {
    console.error("Index API failed:", error);

    return NextResponse.json({
      series: [],
      current: null,
      change: null,
    });
  }
}