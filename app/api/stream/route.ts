import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

// Force dynamic — never cache at Next.js edge level (audio URLs are time-limited)
export const dynamic = "force-dynamic";

// Cache extracted YouTube CDN URLs for 50 minutes (they expire ~6h, so this is safe)
const urlCache = new Map<string, { url: string; ext: string; expiresAt: number }>();

const PYTHON_EXTRACT = `
import yt_dlp, sys, json
target = sys.argv[1]
ydl_opts = {
    'format': 'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best',
    'quiet': True,
    'no_warnings': True,
}
with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    info = ydl.extract_info(target, download=False)
    if 'entries' in info and len(info['entries']) > 0:
        info = info['entries'][0]
    url = info.get('url') or ''
    ext = info.get('ext') or 'm4a'
    print(json.dumps({'url': url, 'ext': ext}))
`;

async function resolveStreamUrl(
  target: string
): Promise<{ url: string; ext: string } | null> {
  try {
    const { stdout } = await execFileAsync("python", ["-c", PYTHON_EXTRACT, target], {
      timeout: 20000,
    });
    const parsed = JSON.parse(stdout.trim());
    if (parsed?.url?.startsWith("http")) return parsed;
  } catch (err: any) {
    console.warn("[/api/stream] yt-dlp error:", err?.message?.slice(0, 120));
  }
  return null;
}

// CORS preflight handler
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Range, Content-Type",
    },
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || "";
  const title = searchParams.get("title") || "";
  const artist = searchParams.get("artist") || "";

  if (!id && !title) {
    return NextResponse.json({ error: "Missing id or title" }, { status: 400 });
  }

  // Build the yt-dlp target
  const isVideoId = /^[a-zA-Z0-9_-]{11}$/.test(id);
  const target = isVideoId
    ? `https://www.youtube.com/watch?v=${id}`
    : `ytsearch1:${[artist, title, id].filter(Boolean).join(" ")}`;

  const cacheKey = isVideoId ? id : `${artist}-${title}`;

  // 1. Check cache (saves a yt-dlp call when auto-buffer fetches the same track)
  const cached = urlCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return proxyAudioStream(req, cached.url, cached.ext);
  }

  // 2. Extract fresh URL via yt-dlp
  const result = await resolveStreamUrl(target);

  if (result?.url) {
    urlCache.set(cacheKey, {
      url: result.url,
      ext: result.ext,
      expiresAt: Date.now() + 50 * 60 * 1000,
    });
    return proxyAudioStream(req, result.url, result.ext);
  }

  return NextResponse.json({ error: "Stream extraction failed" }, { status: 503 });
}

/**
 * Proxy audio from YouTube CDN with full Range-request support.
 * This endpoint serves TWO purposes:
 *   1. Real-time streaming for initial playback
 *   2. Full-blob fetch by the auto-buffer engine (for lock-screen-safe playback)
 */
async function proxyAudioStream(
  req: NextRequest,
  streamUrl: string,
  ext: string
): Promise<NextResponse> {
  const rangeHeader = req.headers.get("range") || undefined;

  const upstream = await fetch(streamUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
      ...(rangeHeader ? { Range: rangeHeader } : {}),
    },
    signal: AbortSignal.timeout(30000),
  });

  const contentType =
    ext === "m4a" || ext === "mp4"
      ? "audio/mp4"
      : ext === "webm"
      ? "audio/webm"
      : "audio/mpeg";

  const responseHeaders: Record<string, string> = {
    "Content-Type": upstream.headers.get("content-type") || contentType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=0, must-revalidate",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Range",
  };

  const contentRange = upstream.headers.get("content-range");
  const contentLength = upstream.headers.get("content-length");
  if (contentRange) responseHeaders["Content-Range"] = contentRange;
  if (contentLength) responseHeaders["Content-Length"] = contentLength;

  const status = upstream.status === 206 ? 206 : rangeHeader ? 206 : 200;

  return new NextResponse(upstream.body, {
    status,
    headers: responseHeaders,
  });
}
