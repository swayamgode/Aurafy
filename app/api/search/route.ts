import { NextRequest, NextResponse } from "next/server";

// youtube-search-api is a free package — no API key needed
// It queries YouTube's internal web endpoints
const YoutubeSearchApi = require("youtube-search-api");

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "";

  if (!query.trim()) {
    return NextResponse.json({ items: [] });
  }

  try {
    // GetListByKeyword(query, playlist, limit, options)
    const data = await YoutubeSearchApi.GetListByKeyword(query, false, 20, [
      { type: "video" },
    ]);

    const items = (data.items || [])
      .filter((item: any) => item.type === "video" && item.id)
      .map((item: any) => ({
        youtubeId: item.id,
        title: item.title || "Unknown Title",
        artist: item.channelTitle || "Unknown Artist",
        thumbnailUrl:
          item.thumbnail?.thumbnails?.[item.thumbnail.thumbnails.length - 1]
            ?.url ||
          `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
        duration: item.length?.simpleText
          ? parseDuration(item.length.simpleText)
          : 210,
      }));

    return NextResponse.json({ items });
  } catch (err: any) {
    console.error("[/api/search] YouTube search error:", err?.message || err);
    return NextResponse.json({ items: [], error: "Search failed" }, { status: 500 });
  }
}

function parseDuration(simpleText: string): number {
  // "3:45" -> 225 seconds
  const parts = simpleText.split(":").map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 210;
}
