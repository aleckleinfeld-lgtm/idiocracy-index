import { Manrope } from "next/font/google";

export const dynamic = "force-dynamic";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500"],
});

type FeedItem = {
  id: string;
  fields: {
    Summary?: string;
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

  const data = await res.json();
  return data.records || [];
}

export default async function FeedPage() {
  const records = await getFeed();

  return (
    <>
      <style>{`
        html, body {
          margin: 0;
          padding: 0;
          background: transparent;
        }

        .row {
          display: block;
          text-decoration: none;
          color: #000;
          padding: 22px 0;
          transition: all 0.2s ease;
        }

        .row:hover {
          background: #e10600;
          color: #fff;
        }

        .row:hover .arrow {
          color: #fff;
        }

        .divider {
          height: 2.5px;
          background: #000;
          width: 100%;
        }

        .top-line {
          height: 2.5px;
          background: #000;
          width: 100%;
        }
      `}</style>

      <main
        className={manrope.className}
        style={{
          fontSize: "26px",
          lineHeight: "31px",
          letterSpacing: "-0.6px",
        }}
      >
        <div className="top-line" />

        {records.map((item: FeedItem) => {
          const headline = item.fields.Summary;
          const link = item.fields["Source URL"];

          if (!headline || !link) return null;

          return (
            <div key={item.id}>
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="row"
              >
                {headline}
                <span className="arrow" style={{ marginLeft: 8 }}>
                  →
                </span>
              </a>

              <div className="divider" />
            </div>
          );
        })}
      </main>
    </>
  );
}
