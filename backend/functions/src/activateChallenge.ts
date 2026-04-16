import * as functions from 'firebase-functions';
import { getRunChainContract } from './contractCaller';

// 매시간 실행 — 시작일 도달한 OPEN 쳄린지 활성화
export const activatePendingChallenges = functions.pubsub
  .schedule('0 * * * *') // 매 정시
  .timeZone('Asia/Seoul')
  .onRun(async () => {
    const contract = await getRunChainContract();
    const count = Number(await contract.challengeCount());
    const nowSec = Math.floor(Date.now() / 1000);

    for (let id = 1; id <= count; id++) {
      try {
        const raw = await contract.getChallengeInfo(id);
        const status = Number(raw[7]);
        const startTime = Number(raw[3]);

        if (status === 0 && nowSec >= startTime) {
          const tx = await contract.activateChallenge(id);
          await tx.wait();
          functions.logger.info(`Challenge ${id} 활성화 완료`);
        }
      } catch (err) {
        functions.logger.error(`Challenge ${id} 활성화 실패:`, err);
      }
    }
  });
