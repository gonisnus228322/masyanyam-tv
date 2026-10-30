import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const targetUrl = request.nextUrl.searchParams.get('url');
  if (!targetUrl) return NextResponse.json({ error: 'Missing URL' }, { status: 400 });

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const body = await response.text();
    const res = new NextResponse(body, {
      headers: {
        'Content-Type': 'text/html',
      },
    });

    // Strip frame-busting security headers that cause black screens
    res.headers.delete('X-Frame-Options');
    res.headers.delete('Content-Security-Policy');
    return res;
  } catch (err) {
    return NextResponse.json({ error: 'Proxy fetch failed' }, { status: 500 });
  }
}
