import { NextResponse } from "next/server";

const robotsTxt = `User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /admin
Disallow: /api
Disallow: /quiz

Sitemap: https://snappword.com/sitemap.xml
Llms-txt: https://snappword.com/llms.txt
`;

export async function GET() {
  return new NextResponse(robotsTxt, {
    headers: { "Content-Type": "text/plain" },
  });
}
