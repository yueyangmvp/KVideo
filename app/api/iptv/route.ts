/**
 * IPTV Proxy API Route
 * Fetches M3U playlist files to avoid CORS issues
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'okHttp/Mod-1.5.0.0',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch: ${response.status}` },
        { status: response.status }
      );
    }

        const text = await response.text();
    const origin = new URL(request.url).origin;

    // 强制代理补丁：把列表里的链接全部重定向到我们的 stream 接口
    const proxiedText = text.split('\n').map(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('http')) {
        return `${origin}/api/iptv/stream?url=${encodeURIComponent(trimmedLine)}`;
      }
      return line;
    }).join('\n');

    return new NextResponse(proxiedText, {

      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to fetch M3U playlist' },
      { status: 500 }
    );
  }
}
