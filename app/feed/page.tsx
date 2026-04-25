export default async function FeedPage() {
  const { records } = await getFeed();

  return (
    <div
      style={{
        background: "transparent",
        margin: 0,
        padding: 0,
      }}
    >
      <main
        className={manrope.className}
        style={{
          margin: 0,
          padding: 0,
          background: "transparent",
          fontSize: "26px",
          lineHeight: "30px",
          letterSpacing: "-0.6px",
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
                  paddingTop: "14px",
                  paddingBottom: "14px",
                }}
              >
                {headline}
                <span style={{ marginLeft: 8 }}>→</span>
              </a>

              {index !== records.length - 1 && (
                <div
                  style={{
                    height: "1.5px",
                    backgroundColor: "#000",
                    width: "100%",
                  }}
                />
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}
