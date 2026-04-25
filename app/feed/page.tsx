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
          margin: 0 !important;
          padding: 0 !important;
          background: transparent !important;
        }

        .feed {
          padding-left: 24px;
        }

        .row {
          display: block;
          color: #000;
          text-decoration: none;
          font-weight: 500;

          padding: 12px 14px;   /* tighter */
          margin-left: -14px;   /* keep alignment */
          border-radius: 12px; /* tighter corners */

          transition: background 0.12s ease;
        }

        .row:hover {
          background: rgba(255,255,255,0.95);
        }

        .spacer {
          height: 10px; /* slightly tighter vertical rhythm */
        }
      `}</style>

      <main
        className={`${manrope.className} feed`}
        style={{
          fontSize: "26px",
          lineHeight: "31px",
          letterSpacing: "-0.6px",
        }}
      >
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
                <span style={{ marginLeft: 8 }}>→</span>
              </a>

              <div className="spacer" />
            </div>
          );
        })}
      </main>
    </>
  );
}
