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
      timeZone: "America/New_York",
    });
  }

  if (range === "1W") {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: "America/New_York",
    });
  }

  if (range === "ALL") {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      timeZone: "America/New_York",
    });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: range === "1Y" || range === "YTD" ? "2-digit" : undefined,
    timeZone: "America/New_York",
  });
}

function getETTimeKey(timestamp: number) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/New_York",
  });
}

function buildMarketDaySlots() {
  const slots: Array<{ key: string; label: string }> = [];

  let hour = 9;
  let minute = 30;

  while (hour < 16 || (hour === 16 && minute === 0)) {
    const key = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

    const display = new Date(`2026-01-01T${key}:00`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    slots.push({
      key,
      label: display,
    });

    minute += 5;
    if (minute >= 60) {
      hour += 1;
      minute -= 60;
    }
  }

  return slots;
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

function expandToFullDay(points: SeriesPoint[]) {
  const slots = buildMarketDaySlots();

  const pointMap = new Map<string, SeriesPoint>();

  for (const point of points) {
    if (typeof point.timestamp === "number") {
      pointMap.set(getETTimeKey(point.timestamp), point);
    }
  }

  return slots.map((slot) => {
    const match = pointMap.get(slot.key);

    return {
      date: slot.label,
      label: slot.label,
      timestamp: match?.timestamp ?? null,
      value: match?.value ?? null,
    };
  });
}

function isNonNullSeriesPoint(
  point: SeriesPoint | null
): point is SeriesPoint {
  return point !== null;
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

    const rawSeries = commonTimestamps
      .map((timestamp): SeriesPoint | null => {
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
          label: formatLabel(timestamp, range),
          timestamp,
          value: (total / count) * 100,
        };
      })
      .filter(isNonNullSeriesPoint);

    const cleanedActualSeries = removeBadTail(rawSeries);

    if (cleanedActualSeries.length < 2) {
      return NextResponse.json({
        series: [],
        current: null,
        change: null,
      });
    }

    const firstActual = cleanedActualSeries[0].value;
    const currentActual = cleanedActualSeries[cleanedActualSeries.length - 1].value;
    const change =
      typeof firstActual === "number" &&
      typeof currentActual === "number" &&
      firstActual !== 0
        ? ((currentActual - firstActual) / firstActual) * 100
        : null;

    const series =
      range === "1D" ? expandToFullDay(cleanedActualSeries) : cleanedActualSeries;

    return NextResponse.json({
      series,
      current: currentActual,
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