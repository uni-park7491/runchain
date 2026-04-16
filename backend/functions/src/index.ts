import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export { submitRunRecord } from './submitRunRecord';
export { finalizeWeeklyChallenges } from './finalizeChallenge';
export { activatePendingChallenges } from './activateChallenge';
export { distributeMonthlyBonus } from './monthlyBonus';
