import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

// Cache stream URLs for 25 minutes (YouTube URLs expire ~6 hours but play it safe)
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
      timeout: 14000,
    });
    const parsed = JSON.parse(stdout.trim());
    if (parsed?.url?.startsWith("http")) return parsed;
  } catch (err: any) {
    console.warn("[/api/stream] yt-dlp error:", err?.message?.slice(0, 120));
  }
  return null;
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

  // 1. Check cache
  const cached = urlCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    // Proxy the request to the cached Google CDN URL, forwarding Range headers
    return proxyAudioStream(req, cached.url, cached.ext);
  }

  // 2. Extract fresh URL
  const result = await resolveStreamUrl(target);

  if (result?.url) {
    urlCache.set(cacheKey, {
      url: result.url,
      ext: result.ext,
      expiresAt: Date.now() + 25 * 60 * 1000,
    });
    return proxyAudioStream(req, result.url, result.ext);
  }

  // 3. Nothing worked
  return NextResponse.json({ error: "Stream extraction failed" }, { status: 503 });
}

/**
 * Proxy the audio stream with full Range-request support.
 * This is what allows mobile browsers to seek and play in background during screen lock.
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
    signal: AbortSignal.timeout(20000),
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
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
  };

  // Forward range-related headers from upstream
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
