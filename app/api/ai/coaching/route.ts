import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { distanceKm, paceMinPerKm, durationMinutes, heartRateAvg, challengeTargetKm } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ advice: '분석 API가 설정되지 않았습니다.' });
    }

    const prompt = `러닝 코치로서 짧은 피드백을 한국어로 주세요.

오늘 러닝 데이터:
- 거리: ${distanceKm}km
- 페이스: ${paceMinPerKm}min/km
- 시간: ${durationMinutes}분
${heartRateAvg ? `- 평균 심박수: ${heartRateAvg}bpm` : ''}
${challengeTargetKm ? `- 챌린지 목표: ${challengeTargetKm}km` : ''}

2-3문장으로 짧고 실용적인 코치링 조언을 주세요.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
    });

    return NextResponse.json({ advice: completion.choices[0].message.content });
  } catch (e) {
    console.error('Coaching API error:', e);
    return NextResponse.json({ advice: '코치링 API 오류가 발생했습니다.' }, { status: 200 });
  }
}
