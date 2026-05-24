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

.line,
.final-line {
  height: 0.5px;
  background: rgba(0,0,0,0.45);
  width: calc(100% - 24px);
  margin-left: 12px;
  transition: opacity 0.12s ease;
  
  }

  .item:hover .line {
    opacity: 0;
  }

  .item:hover + .item .line {
    opacity: 0;
  }

  .item:hover + .final-line {
    opacity: 0;
  }

  .row {
    display: block;
    color: #000;
    text-decoration: none;
    padding: 12px 16px;
    margin-left: -16px;
    border-radius: 12px;
    transition: background 0.12s ease;
  }

  .row:hover {
    background: rgba(255,255,255,0.95);
  }

  .headline {
    display: block;
    font-size: 28px;
    line-height: 30px;
    letter-spacing: -0.6px;
    font-weight: 500;
  }

  .source {
    display: block;
    font-size: 13px;
    line-height: 16px;
    letter-spacing: -0.2px;
    color: rgba(0,0,0,0.45);
    margin-top: 5px;
    font-weight: 400;
  }

  /* MOBILE */

  @media (max-width: 480px) {

    .feed {
      padding-left: 12px;
      padding-right: 12px;
    }

    .row {
      padding: 10px 12px;
      margin-left: -12px;
      border-radius: 10px;
    }

    .headline {
      font-size: 18px;
      line-height: 20px;
      letter-spacing: -0.3px;
    }

    .source {
      font-size: 11px;
      line-height: 13px;
      margin-top: 4px;
    }

.line,
.final-line {
  width: calc(100% - 20px);
  margin-left: 10px;
}
  }
`}</style>

      <main className="feed">
        {records.map((item: FeedItem) => {
          const headline = item.fields.Summary;
          const link = item.fields["Source URL"];
          const source = item.fields["Source Name"];

          if (!headline || !link) return null;

          return (
            <div key={item.id} className="item">
              <div className="line" />

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

                {source && <span className="source">{source}</span>}
              </a>
            </div>
          );
        })}

        <div className="final-line" />
      </main>
    </>
  );
}
