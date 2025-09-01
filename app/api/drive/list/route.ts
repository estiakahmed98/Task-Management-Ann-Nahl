// app/api/drive/list/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GOOGLE_API = "https://www.googleapis.com/drive/v3";

function viewUrl(fileId: string) {
  // Drive image view (public) - <img src=...> এ কাজ করে
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get("folderId");

    if (!folderId) {
      return NextResponse.json({ error: "Missing folderId" }, { status: 400 });
    }

    const key = process.env.GOOGLE_DRIVE_API_KEY;
    if (!key) {
      return NextResponse.json(
        { error: "Server misconfigured: missing GOOGLE_DRIVE_API_KEY" },
        { status: 500 }
      );
    }

    // 1) Folder metadata আনুন (ভ্যালিডেশন)
    const metaRes = await fetch(
      `${GOOGLE_API}/files/${folderId}?fields=id,name,mimeType&supportsAllDrives=true&key=${key}`,
      { cache: "no-store" }
    );

    if (!metaRes.ok) {
      const text = await metaRes.text();
      return NextResponse.json(
        {
          error:
            "Folder is not public or not found. Make sure link-sharing is 'Anyone with the link: Viewer'.",
          details: text,
        },
        { status: metaRes.status }
      );
    }

    const metadata = (await metaRes.json()) as {
      id: string;
      name: string;
      mimeType: string;
    };

    if (metadata.mimeType !== "application/vnd.google-apps.folder") {
      return NextResponse.json(
        { error: "The provided ID is not a Google Drive folder." },
        { status: 400 }
      );
    }

    // 2) ফোল্ডারের ভিতরের image/* ফাইলগুলো লিস্ট করুন (pagination সহ)
    const files: any[] = [];
    let pageToken: string | undefined = undefined;
    const fields =
      "nextPageToken,files(id,name,mimeType,webViewLink,thumbnailLink,hasThumbnail)";

    do {
      const params = new URLSearchParams({
        q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
        fields,
        pageSize: "1000",
        includeItemsFromAllDrives: "true",
        supportsAllDrives: "true",
        key,
      });
      if (pageToken) params.set("pageToken", String(pageToken));

      const listRes = await fetch(`${GOOGLE_API}/files?${params}`, {
        cache: "no-store",
      });
      if (!listRes.ok) {
        const text = await listRes.text();
        return NextResponse.json(
          { error: "Failed to list files", details: text },
          { status: listRes.status }
        );
      }

      const data = await listRes.json();
      files.push(...(data.files || []));
      pageToken = data.nextPageToken;
    } while (pageToken);

    const images = files.map((f) => ({
      id: f.id as string,
      name: f.name as string,
      mimeType: f.mimeType as string,
      webViewLink:
        f.webViewLink ?? `https://drive.google.com/file/d/${f.id}/view`,
      // thumbnailLink কখনও auth চাইতে পারে, তাই ফ্যালব্যাক দিলাম
      thumbnail:
        f.thumbnailLink ??
        `https://drive.google.com/thumbnail?sz=w400&id=${f.id}`,
      viewUrl: viewUrl(f.id),
    }));

    return NextResponse.json({
      folder: { id: metadata.id, name: metadata.name },
      count: images.length,
      images,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Unexpected error", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
