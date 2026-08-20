import { NextRequest, NextResponse } from "next/server";

// Fallback search package (does not require API key)
const YoutubeSearchApi = require("youtube-search-api");

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "";
  const clientApiKey =
    req.headers.get("x-youtube-api-key") ||
    req.nextUrl.searchParams.get("key") ||
    "";
  const apiKey =
    clientApiKey ||
    process.env.YOUTUBE_API_KEY ||
    process.env.NEXT_PUBLIC_YOUTUBE_API_KEY ||
    "";

  if (!query.trim()) {
    return NextResponse.json({ songs: [], items: [], artists: [], playlists: [] });
  }

  // 1. If an API key is provided, query the official Google YouTube Data API v3
  if (apiKey.trim()) {
    try {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=20&q=${encodeURIComponent(
        query
      )}&key=${encodeURIComponent(apiKey.trim())}`;

      const searchRes = await fetch(searchUrl, {
        signal: AbortSignal.timeout(6000),
      });

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const videoIds = (searchData.items || [])
          .map((item: any) => item.id?.videoId)
          .filter(Boolean);

        if (videoIds.length > 0) {
          // Fetch video details for exact duration & highest resolution artwork
          const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds.join(
            ","
          )}&key=${encodeURIComponent(apiKey.trim())}`;
          const detailsRes = await fetch(detailsUrl, {
            signal: AbortSignal.timeout(6000),
          });

          if (detailsRes.ok) {
            const detailsData = await detailsRes.json();
            const items = (detailsData.items || []).map((video: any) => {
              const snippet = video.snippet || {};
              const contentDetails = video.contentDetails || {};
              const thumbnails = snippet.thumbnails || {};
              const bestThumb =
                thumbnails.maxres?.url ||
                thumbnails.standard?.url ||
                thumbnails.high?.url ||
                thumbnails.medium?.url ||
                `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;

              return {
                youtubeId: video.id,
                title: decodeHtmlEntities(snippet.title || "Unknown Title"),
                artist: decodeHtmlEntities(snippet.channelTitle || "Unknown Artist"),
                thumbnailUrl: bestThumb,
                duration: parseIsoDuration(contentDetails.duration || "PT3M30S"),
              };
            });

            if (items.length > 0) {
              const { matchedArtists, matchedPlaylists } = buildContextItems(
                query,
                items
              );
              return NextResponse.json({
                songs: items,
                items,
                artists: matchedArtists,
                playlists: matchedPlaylists,
                source: "official_youtube_api_v3",
              });
            }
          }
        }
      } else {
        console.warn(
          "[/api/search] YouTube Data API v3 returned status:",
          searchRes.status,
          "Falling back to secondary provider."
        );
      }
    } catch (apiErr: any) {
      console.warn(
        "[/api/search] YouTube API v3 error, using fallback:",
        apiErr?.message || apiErr
      );
    }
  }

  // 2. Fallback to youtube-search-api
  try {
    const data = await YoutubeSearchApi.GetListByKeyword(query, false, 20, [
      { type: "video" },
    ]);

    const items = (data.items || [])
      .filter((item: any) => item.type === "video" && item.id)
      .map((item: any) => ({
        youtubeId: item.id,
        title: decodeHtmlEntities(item.title || "Unknown Title"),
        artist: decodeHtmlEntities(item.channelTitle || "Unknown Artist"),
        thumbnailUrl:
          item.thumbnail?.thumbnails?.[item.thumbnail.thumbnails.length - 1]
            ?.url ||
          `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
        duration: item.length?.simpleText
          ? parseDuration(item.length.simpleText)
          : 210,
      }));

    const { matchedArtists, matchedPlaylists } = buildContextItems(query, items);

    return NextResponse.json({
      songs: items,
      items,
      artists: matchedArtists,
      playlists: matchedPlaylists,
      source: "search_engine_fallback",
    });
  } catch (err: any) {
    console.error("[/api/search] search error:", err?.message || err);
    return NextResponse.json(
      { songs: [], items: [], artists: [], playlists: [], error: "Search failed" },
      { status: 200 }
    );
  }
}

// Convert ISO 8601 duration string (e.g. "PT4M13S", "PT1H2M10S") to seconds
function parseIsoDuration(isoStr: string): number {
  const match = isoStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 210;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

function parseDuration(simpleText: string): number {
  const parts = simpleText.split(":").map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 210;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function buildContextItems(query: string, items: any[]) {
  const q = query.trim();
  const matchedArtists = [
    {
      id: `artist-${encodeURIComponent(q)}`,
      name: q.charAt(0).toUpperCase() + q.slice(1),
      imageUrl:
        items[0]?.thumbnailUrl ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop",
      genre: "Top Artist",
    },
  ];

  const matchedPlaylists = [
    {
      id: `pl-${encodeURIComponent(q)}`,
      title: `${q.charAt(0).toUpperCase() + q.slice(1)} Mix`,
      description: `Best of ${q} curated by Hue`,
      coverUrl:
        items[0]?.thumbnailUrl ||
        "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=500&auto=format&fit=crop",
      creator: "Hue Mix",
      songsCount: items.length,
    },
  ];

  return { matchedArtists, matchedPlaylists };
}
