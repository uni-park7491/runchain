import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/lib/config';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(`${CONFIG.APP_URL}/wallet?strava=denied`);
  }

  try {
    const res = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    });
    const token = await res.json();

    // Redirect with token data (stored client-side)
    const params = new URLSearchParams({
      strava: 'connected',
      access_token: token.access_token,
      athlete_id: token.athlete?.id?.toString() || '',
      athlete_name: token.athlete?.firstname || '',
    });
    return NextResponse.redirect(`${CONFIG.APP_URL}/wallet?${params.toString()}`);
  } catch (e) {
    console.error('Strava callback error:', e);
    return NextResponse.redirect(`${CONFIG.APP_URL}/wallet?strava=error`);
  }
}
