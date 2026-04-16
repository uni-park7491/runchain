import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { points, totalDistance, durationSeconds } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ suspicious: false, reason: 'AI 분석 미설정' });
    }

    const avgSpeed = totalDistance / durationSeconds;
    const speedKmh = (avgSpeed * 3.6).toFixed(1);
    const distKm = (totalDistance / 1000).toFixed(2);

    const prompt = `러닝 데이터를 분석해 사기 달리기인지 판단해주세요.

- 전체 거리: ${distKm}km
- 소요 시간: ${Math.round(durationSeconds / 60)}분
- 평균 속도: ${speedKmh}km/h
- GPS 포인트 수: ${points.length}개

의심스러운 점이 있으면 suspicious: true를, 정상이면 false를 JSON으로만 응답하세요.
형식: {"suspicious": boolean, "reason": "이유 (30자 이내)", "confidence": 0-100}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 100,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return NextResponse.json(result);
  } catch (e) {
    console.error('AI fraud check error:', e);
    return NextResponse.json({ suspicious: false, reason: 'AI 분석 실패' }, { status: 200 });
  }
}
