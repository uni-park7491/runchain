import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getRunChainContract } from './contractCaller';

const db = admin.firestore();

// 매일 자정 실행 — 종료된 체린지 정산
export const finalizeWeeklyChallenges = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('Asia/Seoul')
  .onRun(async () => {
    const contract = await getRunChainContract();
    const count = Number(await contract.challengeCount());
    const nowSec = Math.floor(Date.now() / 1000);

    for (let id = 1; id <= count; id++) {
      try {
        const raw = await contract.getChallengeInfo(id);
        const status = Number(raw[7]);
        const endTime = Number(raw[4]);

        // ACTIVE(1) 상태이고 종료 시간 지났으면
        if (status !== 1 || nowSec < endTime) continue;

        // Firestore에서 주간 누적 기록 조회
        const participants = await contract.getParticipantList(id);
        const scores: { address: string; totalKm: number }[] = [];

        for (const addr of participants) {
          const p = await contract.getParticipantInfo(id, addr);
          if (!p[3] && !p[4]) { // disqualified=false, withdrawn=false
            scores.push({ address: addr, totalKm: Number(p[0]) });
          }
        }

        scores.sort((a, b) => b.totalKm - a.totalKm);

        const r1 = scores[0]?.address ?? ethers.ZeroAddress;
        const r2 = scores[1]?.address ?? ethers.ZeroAddress;
        const r3 = scores[2]?.address ?? ethers.ZeroAddress;

        const tx = await contract.finalizeChallenge(id, r1, r2, r3);
        await tx.wait();

        functions.logger.info(`Challenge ${id} 정산 완료: 1위 ${r1}`);

        // Firestore 상태 업데이트
        await db.collection('challenges').doc(String(id)).update({
          status: 2,
          finalizedAt: admin.firestore.FieldValue.serverTimestamp(),
          rank1: r1, rank2: r2, rank3: r3,
        });
      } catch (err) {
        functions.logger.error(`Challenge ${id} 정산 실패:`, err);
      }
    }
  });

// ethers 임포트 수정
const { ethers } = require('ethers');
