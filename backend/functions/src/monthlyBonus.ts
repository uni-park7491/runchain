import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getRunChainContract } from './contractCaller';

const db = admin.firestore();

// 매월 1일 자정 실행 — 국고 보너스 지급
export const distributeMonthlyBonus = functions.pubsub
  .schedule('0 0 1 * *') // 매월 1일 00:00
  .timeZone('Asia/Seoul')
  .onRun(async () => {
    const contract = await getRunChainContract();
    const treasury = await contract.getTreasuryInfo?.();

    // 전월도 한 달간 마감된 쳄린지 조회
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr = lastMonth.toISOString().slice(0, 7); // 'YYYY-MM'

    const snapshot = await db.collection('challenges')
      .where('status', '==', 2)
      .where('finalizedMonth', '==', lastMonthStr)
      .get();

    for (const doc of snapshot.docs) {
      const challengeId = parseInt(doc.id);
      try {
        const participants = await contract.getParticipantList(challengeId);
        const scores: { address: string; totalKm: number }[] = [];

        for (const addr of participants) {
          const p = await contract.getParticipantInfo(challengeId, addr);
          if (!p[3] && !p[4]) {
            scores.push({ address: addr, totalKm: Number(p[0]) });
          }
        }

        scores.sort((a, b) => b.totalKm - a.totalKm);

        // 4~10위 추출
        const bonusRecipients = scores
          .slice(3, 10)
          .map(s => s.address);

        if (bonusRecipients.length > 0) {
          const tx = await contract.distributeMonthlyBonus(challengeId, bonusRecipients);
          await tx.wait();
          functions.logger.info(`Challenge ${challengeId} 보너스 ${bonusRecipients.length}명 지급`);
        }
      } catch (err) {
        functions.logger.error(`Challenge ${challengeId} 보너스 실패:`, err);
      }
    }

    // 월간 국고 리셋
    try {
      const tx = await contract.resetMonthlyTreasury();
      await tx.wait();
    } catch (err) {
      functions.logger.error('월간 국고 리셋 실패:', err);
    }
  });
