# RunChain — 프로젝트 컨텍스트

## 서비스 개요
BNB Chain 기반 주간 러닝 챌린지 플랫폼.
유저가 챌린지를 생성하고, USDT를 걸고, 가장 많이 뛴 사람이 상금을 가져가는 구조.
모든 자금은 스마트컨트랙트가 자동 관리. 운영자 수수료 0%.

## 기술 스택
- **앱**: React Native (Expo) — iOS + Android 동시
- **블록체인**: BNB Chain (BSC)
- **토큰**: USDT BEP-20
- **지갑**: 인앱 지갑 (ethers.js, 프라이빗 키 기기 내 암호화 보관)
- **인증**: 비밀번호(영문+숫자) + Face ID(iOS) / 지문(Android)
- **스마트컨트랙트**: Solidity 0.8.20 + Hardhat
- **백엔드**: Firebase (Firestore + Cloud Functions)
- **GPS 검증**: 자체 GPS + AI 페이스 이상 탐지
- **외부 연동**: Strava 공식 OAuth API + Apple Health / Google Fit

## 프로젝트 구조
```
runchain/
├── CLAUDE.md
├── contracts/           # 스마트컨트랙트 (Hardhat)
│   ├── RunChain.sol
│   ├── hardhat.config.js
│   ├── package.json
│   ├── .env.example
│   ├── scripts/deploy.js
│   └── test/RunChain.test.js
├── app/                 # React Native 앱 (Expo)
│   ├── App.tsx
│   ├── package.json
│   └── src/
│       ├── screens/
│       ├── components/
│       ├── services/
│       ├── store/
│       ├── navigation/
│       ├── constants/
│       └── utils/
├── backend/             # Firebase Cloud Functions
│   └── functions/
│       └── src/
└── design/              # UI 목업
    └── runchain_ui_v4.html
```

## 챌린지 핵심 룰
- 기간: 고정 7일
- 정원: 최대 30명, 전체 공개
- 참가비: 최소 1 USDT (유저가 설정)
- 하루 인정: 최소 3km ~ 최대 10km
- 랭킹 기준: 주간 누적 거리 합산

## 상금 분배
- 1명: 참가비 100% 환급
- 2명: 1등 50% / 2등 35% / 잔여 15% → 국고
- 3명+: 1등 50% / 2등 35% / 3등 15% / 4등 이하 → 국고

## 국고 시스템
- 스마트컨트랙트 완전 자동 관리 (누구도 인출 불가)
- 매월 국고 ≥ 20 USDT 시 다음 달 4~10등에게 0.5 USDT 보너스

## 러닝 검증
- GPS 궤적 이상 탐지
- AI 페이스 검증 (km당 2분 30초 이하 → 경고)
- 경고 3회 누적 → 자동 실격 + 참가비 국고 편입
- Strava OAuth 연동 (선택적 강화)

## 컨트랙트 주소
- BSC Testnet USDT: `0x337610d27c682E347C9cD60BD4b3b107C9d34dDd`
- BSC Mainnet USDT: `0x55d398326f99059fF775485246999027B3197955`

## 현재 진행 상태
- [x] 스펙 확정
- [x] UI 목업 (design/runchain_ui_v4.html)
- [x] 스마트컨트랙트 초안 (contracts/RunChain.sol)
- [ ] Hardhat 배포 환경
- [ ] React Native 앱 개발
- [ ] Firebase 백엔드
- [ ] BSC 테스트넷 배포

## 다음 작업
1. `cd contracts && npm install` — Hardhat 패키지 설치
2. `.env` 파일 생성 (.env.example 복사 후 값 입력)
3. `npx hardhat compile` — 컨트랙트 컴파일
4. `npx hardhat run scripts/deploy.js --network bscTestnet` — 테스트넷 배포
