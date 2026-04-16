import { NextResponse } from 'next/server';
import { CONFIG } from '@/lib/config';

export async function GET() {
  const clientId = process.env.STRAVA_CLIENT_ID || CONFIG.STRAVA_CLIENT_ID;
  const redirectUri = `${CONFIG.APP_URL}/api/strava/callback`;

  if (!clientId) {
    return NextResponse.json({ error: 'Strava Client ID가 설정되지 않았습니다.' }, { status: 400 });
  }

  const stravaAuthUrl = new URL('https://www.strava.com/oauth/authorize');
  stravaAuthUrl.searchParams.set('client_id', clientId);
  stravaAuthUrl.searchParams.set('response_type', 'code');
  stravaAuthUrl.searchParams.set('redirect_uri', redirectUri);
  stravaAuthUrl.searchParams.set('approval_prompt', 'force');
  stravaAuthUrl.searchParams.set('scope', 'read,activity:read_all');

  return NextResponse.redirect(stravaAuthUrl.toString());
}
