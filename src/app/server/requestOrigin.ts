export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || request.headers.get("sec-fetch-site") === "cross-site") return false;
  try {
    const source = new URL(origin);
    // Next's internal URL can use localhost behind a proxy. The received Host
    // is the browser's app destination, including its port and custom domain.
    return ["http:", "https:"].includes(source.protocol) && source.host === request.headers.get("host");
  } catch { return false; }
}
