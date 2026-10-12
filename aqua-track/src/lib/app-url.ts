type HeaderReader = Pick<Headers, "get">;

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

function isLocalUrl(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  try {
    const { hostname } = new URL(value);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function normalizeUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    return trimTrailingSlash(new URL(value).origin);
  } catch {
    return null;
  }
}

function getRequestUrl(headers: HeaderReader) {
  const host = firstHeaderValue(
    headers.get("x-forwarded-host") ?? headers.get("host"),
  );

  if (!host) {
    return null;
  }

  const forwardedProto = firstHeaderValue(headers.get("x-forwarded-proto"));
  const proto =
    forwardedProto ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");

  return normalizeUrl(`${proto}://${host}`);
}

export function getPublicAppUrl(headers: HeaderReader) {
  const requestUrl = getRequestUrl(headers);
  const configuredUrl = normalizeUrl(process.env.NEXT_PUBLIC_APP_URL);
  const originUrl = normalizeUrl(headers.get("origin"));

  if (
    requestUrl &&
    (process.env.NODE_ENV === "production" ||
      !configuredUrl ||
      isLocalUrl(configuredUrl))
  ) {
    return requestUrl;
  }

  return configuredUrl ?? originUrl ?? requestUrl ?? "";
}
