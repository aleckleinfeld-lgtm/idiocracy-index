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
          overflow: visible !important;
        }

        .feed {
          overflow: visible;
          padding-left: 35px;
          margin-left: -35px;
          padding-right: 18px;
        }

        .row {
          display: block;
          color: #000;
          text-decoration: none;
          font-weight: 500;
          padding: 22px 24px;
          border-radius: 22px;
          transition: background-color 0.15s ease;
        }

        .row:hover {
          background: rgba(255, 255, 255, 0.92);
          color: #000;
        }

        .spacer {
          height: 2.5px;
          background: transparent;
          width: 100%;
        }
      `}</style>

      <main
        className={`${manrope.className} feed`}
        style={{
          fontSize: "26px",
          lineHeight: "31px",
          letterSpacing: "-0.6px",
          background: "transparent",
          width: "100%",
        }}
      >
        <div className="spacer" />

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
