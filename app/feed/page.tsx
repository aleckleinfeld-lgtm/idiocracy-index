export const dynamic = "force-dynamic";

type FeedItem = {
  id: string;
  fields: {
    Summary?: string;
    "Source URL"?: string;
    "Source Name"?: string;
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
      {/* ✅ Elza font */}
      <link rel="stylesheet" href="https://use.typekit.net/dkt1lmz.css" />

      <style>{`
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: transparent !important;
          font-family: "elza", sans-serif;
        }

        .feed {
          padding-left: 24px;
        }

        .row {
          display: block;
          color: #000;
          text-decoration: none;

          padding: 14px 16px;
          margin-left: -16px;
          border-radius: 12px;

          transition: background 0.12s ease;
        }

        .row:hover {
          background: rgba(255,255,255,0.95);
        }

        .headline {
          display: block;
          font-size: 26px;
          line-height: 31px;
          letter-spacing: -0.6px;
          font-weight: 500;
        }

        .source {
          font-size: 13px;
          line-height: 16px;
          letter-spacing: -0.2px;
          color: rgba(0,0,0,0.45);
          margin-top: 6px;
          font-weight: 400;
        }

        .spacer {
          height: 28px;
        }
      `}</style>

      <main className="feed">
        {records.map((item: FeedItem) => {
          const headline = item.fields.Summary;
          const link = item.fields["Source URL"];
          const source = item.fields["Source Name"];

          if (!headline || !link) return null;

          return (
            <div key={item.id}>
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="row"
              >
                <span className="headline">
                  {headline}
                  <span style={{ marginLeft: 8 }}>→</span>
                </span>

                {source && (
                  <span className="source">
                    {source}
                  </span>
                )}
              </a>

              <div className="spacer" />
            </div>
          );
        })}
      </main>
    </>
  );
}
