import { Manrope } from "next/font/google";

export const dynamic = "force-dynamic";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500"],
});

type FeedItem = {
  id: string;
  fields: {
    Headline?: string;
    "Source URL"?: string;
  };
};

async function getFeed() {
  const apiKey = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!apiKey || !baseId) {
    return {
      records: [],
      error: "Missing AIRTABLE_TOKEN or AIRTABLE_BASE_ID in Vercel.",
    };
  }

  const url =
    `https://api.airtable.com/v0/${baseId}/Feed?view=Site%20Feed&maxRecords=5`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    return {
      records: [],
      error: `Airtable error ${res.status}: ${text}`,
    };
  }

  const data = await res.json();

  return {
    records: data.records || [],
    error: null,
  };
}

export default async function FeedPage() {
  const { records, error } = await getFeed();

  if (error) {
    return (
      <pre
        style={{
          whiteSpace: "pre-wrap",
          fontFamily: "sans-serif",
          fontSize: "14px",
          color: "black",
          background: "white",
          padding: "16px",
        }}
      >
        {error}
      </pre>
    );
  }

  if (!records.length) {
    return (
      <div
        style={{
          fontFamily: "sans-serif",
          fontSize: "14px",
          color: "black",
          background: "transparent",
          padding: "16px 0",
        }}
      >
        No published headlines found.
      </div>
    );
  }

  return (
    <main
      className={`${manrope.className} w-full bg-transparent text-black`}
      style={{
        fontSize: "16px",
        lineHeight: "18px",
        letterSpacing: "-0.2px",
        background: "transparent",
      }}
    >
      <div className="w-full max-w-[100%]">
        {records.map((item: FeedItem, index: number) => {
          const headline = item.fields.Headline;
          const link = item.fields["Source URL"];

          if (!headline || !link) return null;

          return (
            <div key={item.id}>
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="block py-[10px] underline-offset-2 hover:underline"
                style={{
                  color: "#000",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                {headline} ↗
              </a>

              {index !== records.length - 1 && (
                <div
                  style={{
                    height: "1px",
                    backgroundColor: "rgba(0,0,0,0.12)",
                    width: "100%",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
