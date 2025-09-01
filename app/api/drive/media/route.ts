import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GOOGLE_API = "https://www.googleapis.com/drive/v3";

function contentDisposition(filename: string, fallbackId: string) {
  const ascii = filename.replace(/[^\x20-\x7E]+/g, "_");
  const safe = ascii.length ? ascii : `file-${fallbackId}`;
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${safe}"; filename*=UTF-8''${encoded}`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const filename = searchParams.get("filename") || "";

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const key = process.env.GOOGLE_DRIVE_API_KEY;
    if (!key) {
      return NextResponse.json(
        { error: "Server misconfigured: missing GOOGLE_DRIVE_API_KEY" },
        { status: 500 }
      );
    }

    const upstream = await fetch(
      `${GOOGLE_API}/files/${id}?alt=media&supportsAllDrives=true&key=${key}`,
      { cache: "no-store" }
    );

    if (!upstream.ok) {
      const text = await upstream.text();
      return NextResponse.json(
        { error: "Failed to fetch media", details: text },
        { status: upstream.status }
      );
    }

    const contentType =
      upstream.headers.get("content-type") ?? "application/octet-stream";
    const contentLength = upstream.headers.get("content-length") ?? undefined;

    return new Response(upstream.body, {
      headers: {
        "Content-Type": contentType,
        ...(contentLength ? { "Content-Length": contentLength } : {}),
        "Cache-Control": "no-store",
        "Content-Disposition": contentDisposition(filename, id),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Unexpected error", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
