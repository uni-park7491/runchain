import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { validateGPSTrack, Coordinate } from './gpsValidator';
import { getVerifierWallet, getRunChainContract } from './contractCaller';

const db = admin.firestore();

export const submitRunRecord = functions.https.onCall(async (data, context) => {
  // 인증 확인
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', '로그인 필요');

  const { challengeId, walletAddress, coordinates } = data as {
    challengeId: number;
    walletAddress: string;
    coordinates: Coordinate[];
  };

  if (!challengeId || !walletAddress || !coordinates?.length) {
    throw new functions.https.HttpsError('invalid-argument', '필수 데이터 누락');
  }

  // 1. GPS 검증
  const validation = validateGPSTrack(coordinates);

  // 2. 오늘 이미 제출했는지 확인
  const today = new Date().toISOString().split('T')[0];
  const recordRef = db
    .collection('challenges').doc(String(challengeId))
    .collection('records').doc(`${walletAddress}_${today}`);

  const existing = await recordRef.get();
  if (existing.exists) {
    throw new functions.https.HttpsError('already-exists', '오늘은 이미 기록했습니다');
  }

  // 3. Firestore에 기록 저장
  const kmX100 = Math.round(validation.distanceKm * 100);
  await recordRef.set({
    walletAddress,
    challengeId,
    date: today,
    distanceKm: validation.distanceKm,
    kmX100,
    durationSec: validation.durationSec,
    avgPaceSecPerKm: validation.avgPaceSecPerKm,
    warn: validation.warn,
    warnReason: validation.warnReason ?? null,
    valid: validation.valid,
    submittedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 4. 유효한 기록인 경우 스마트컨트랙트에 제출
  if (validation.valid) {
    try {
      const contract = await getRunChainContract();
      const tx = await contract.submitRecord(
        challengeId,
        walletAddress,
        kmX100,
        validation.warn
      );
      await tx.wait();
    } catch (err) {
      functions.logger.error('Contract submitRecord 실패:', err);
    }
  }

  return {
    success: true,
    distanceKm: validation.distanceKm,
    warn: validation.warn,
    warnReason: validation.warnReason,
    valid: validation.valid,
  };
});
