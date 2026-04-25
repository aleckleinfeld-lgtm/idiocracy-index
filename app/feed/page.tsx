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

  const tableId = "tblCkYWOUxwy9owM8";
  const viewId = "viwWo8p3NKGsb13L5";

  const url =
    `https://api.airtable.com/v0/${baseId}/${tableId}` +
    `?view=${viewId}&maxRecords=5`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    return { records: [], error: `Airtable error ${res.status}: ${text}` };
  }

  const data = await res.json();
  return { records: data.records || [], error: null };
}

export default async function FeedPage() {
  const { records, error } = await getFeed();

  if (error) {
    return <pre>{error}</pre>;
  }

  return (
    <main
      className={manrope.className}
      style={{
        margin: 0,
        padding: 0,
        background: "transparent",
        fontSize: "26px",
        lineHeight: "28px",
        letterSpacing: "-0.7px",
        color: "#000",
        width: "100%",
      }}
    >
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
              style={{
                display: "block",
                color: "#000",
                textDecoration: "none",
                fontWeight: 500,
                padding: "10px 0",
              }}
            >
              {headline} <span style={{ marginLeft: 6 }}>→</span>
            </a>

            {index !== records.length - 1 && (
              <div
                style={{
                  height: "2px",
                  backgroundColor: "#000",
                  width: "100%",
                }}
              />
            )}
          </div>
        );
      })}
    </main>
  );
}
