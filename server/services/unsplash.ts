export interface UnsplashImage {
  url: string;
  altDescription: string;
  photographerName: string;
  photographerUrl: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface UnsplashSearchResult {
  urls: { regular: string };
  alt_description: string | null;
  description: string | null;
  user: {
    name: string;
    links: { html: string };
  };
}

export async function fetchUnsplashImages(
  query: string,
  count: number = 10
): Promise<UnsplashImage[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    throw new Error("UNSPLASH_ACCESS_KEY is not set in .env");
  }

  const endpoint = new URL("https://api.unsplash.com/search/photos");
  endpoint.searchParams.set("query", query);
  endpoint.searchParams.set("per_page", String(count));
  endpoint.searchParams.set("content_filter", "high");
  endpoint.searchParams.set("orientation", "landscape");

  const response = await fetch(endpoint.toString(), {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
      "Accept-Version": "v1",
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Unsplash API error: ${response.status} ${response.statusText} — ${body.slice(0, 200)}`
    );
  }

  const data = (await response.json()) as { results: UnsplashSearchResult[] };

  return data.results.map((r) => ({
    url: r.urls.regular,
    altDescription: r.alt_description || r.description || "",
    photographerName: r.user.name,
    photographerUrl: r.user.links.html,
  }));
}
