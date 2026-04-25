{\rtf1\ansi\ansicpg1252\cocoartf2758
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 import \{ Manrope \} from "next/font/google";\
\
const manrope = Manrope(\{\
  subsets: ["latin"],\
  weight: ["500"],\
\});\
\
type FeedItem = \{\
  id: string;\
  fields: \{\
    Headline?: string;\
    Summary?: string;\
    "Source URL"?: string;\
    "Published At"?: string;\
  \};\
\};\
\
async function getFeed() \{\
  const apiKey = process.env.AIRTABLE_API_KEY;\
  const baseId = process.env.AIRTABLE_BASE_ID;\
\
  const url =\
    `https://api.airtable.com/v0/$\{baseId\}/Feed?view=Site%20Feed&maxRecords=5`;\
\
  const res = await fetch(url, \{\
    headers: \{\
      Authorization: `Bearer $\{apiKey\}`,\
    \},\
    cache: "no-store",\
  \});\
\
  if (!res.ok) return [];\
\
  const data = await res.json();\
  return data.records || [];\
\}\
\
export default async function FeedPage() \{\
  const items: FeedItem[] = await getFeed();\
\
  return (\
    <main\
      className=\{`$\{manrope.className\} w-full bg-transparent text-black`\}\
      style=\{\{\
        fontSize: "16px",\
        lineHeight: "18px",\
        letterSpacing: "-0.2px",\
      \}\}\
    >\
      <div className="w-full max-w-[100%]">\
        \{items.map((item, index) => (\
          <div key=\{item.id\}>\
            <a\
              href=\{item.fields["Source URL"] || "#"\}\
              target="_blank"\
              rel="noreferrer"\
              className="block py-[10px] underline-offset-2 hover:underline"\
              style=\{\{\
                color: "#000",\
                textDecoration: "none",\
              \}\}\
              onMouseEnter=\{(e) =>\
                (e.currentTarget.style.textDecoration = "underline")\
              \}\
              onMouseLeave=\{(e) =>\
                (e.currentTarget.style.textDecoration = "none")\
              \}\
            >\
              \{item.fields.Headline\}\
            </a>\
\
            \{index !== items.length - 1 && (\
              <div\
                style=\{\{\
                  height: "1px",\
                  backgroundColor: "rgba(0,0,0,0.1)",\
                  width: "100%",\
                \}\}\
              />\
            )\}\
          </div>\
        ))\}\
      </div>\
    </main>\
  );\
\}}