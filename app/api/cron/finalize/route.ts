import { NextRequest, NextResponse } from 'next/server';
import { getRunChainContract } from '@/lib/contract';
import { getSigner } from '@/lib/wallet';

// Vercel Cron: 매시간 실행 — 마감된 챌린지 자동 정산
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const verifierKey = process.env.VERIFIER_PRIVATE_KEY;
  if (!verifierKey) {
    return NextResponse.json({ error: 'Verifier key not configured' }, { status: 500 });
  }

  try {
    const contract = getRunChainContract(verifierKey);
    const count = Number(await contract.challengeCount());
    const now = Math.floor(Date.now() / 1000);
    const finalized: number[] = [];

    for (let i = 0; i < count; i++) {
      try {
        const raw = await contract.getChallenge(i);
        const endTime = Number(raw[6] ?? raw.endTime);
        const active = raw[7] ?? raw.active;
        const isFinalized = raw[8] ?? raw.finalized;

        if (active && !isFinalized && endTime < now) {
          const tx = await contract.finalizeChallenge(i);
          await tx.wait();
          finalized.push(i);
        }
      } catch (e) {
        console.error(`Finalize challenge ${i} error:`, e);
      }
    }

    return NextResponse.json({
      success: true,
      finalized,
      checked: count,
      timestamp: new Date().toISOString(),
    });
  } catch (e: unknown) {
    const err = e as { message?: string };
    return NextResponse.json({ error: err?.message || 'Cron failed' }, { status: 500 });
  }
}
