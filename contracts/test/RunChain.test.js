const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RunChain", function () {
  let runchain;
  let mockUSDT;
  let owner, verifier, user1, user2, user3, user4;

  const ENTRY_FEE = ethers.parseUnits("5", 6);  // 5 USDT
  const ONE_USDT  = ethers.parseUnits("1", 6);

  // MockERC20 배포 (테스트용 USDT)
  async function deployMockUSDT() {
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    return MockERC20.deploy("Mock USDT", "USDT", 6);
  }

  beforeEach(async function () {
    [owner, verifier, user1, user2, user3, user4] = await ethers.getSigners();

    // Mock USDT 배포
    mockUSDT = await deployMockUSDT();

    // RunChain 배포
    const RunChain = await ethers.getContractFactory("RunChain");
    runchain = await RunChain.deploy(await mockUSDT.getAddress(), verifier.address);

    // 각 유저에게 테스트 USDT 지급
    const mintAmount = ethers.parseUnits("1000", 6);
    for (const user of [user1, user2, user3, user4]) {
      await mockUSDT.mint(user.address, mintAmount);
      await mockUSDT.connect(user).approve(await runchain.getAddress(), mintAmount);
    }
  });

  // ─────────────────────────────────────────
  describe("챌린지 생성", function () {
    it("챌린지 생성 및 생성자 자동 참가", async function () {
      await runchain.connect(user1).createChallenge("서울 러너즈", ENTRY_FEE);

      const info = await runchain.getChallengeInfo(1);
      expect(info.name).to.equal("서울 러너즈");
      expect(info.creator).to.equal(user1.address);
      expect(info.entryFee).to.equal(ENTRY_FEE);
      expect(info.participantCount).to.equal(1n);
    });

    it("최소 참가비 미달 시 실패", async function () {
      const tooLow = ethers.parseUnits("0.5", 6);
      await expect(
        runchain.connect(user1).createChallenge("테스트", tooLow)
      ).to.be.revertedWith("RunChain: entry fee too low");
    });
  });

  // ─────────────────────────────────────────
  describe("챌린지 참가", function () {
    beforeEach(async function () {
      await runchain.connect(user1).createChallenge("서울 러너즈", ENTRY_FEE);
    });

    it("다른 유저 참가 성공", async function () {
      await runchain.connect(user2).joinChallenge(1);
      const info = await runchain.getChallengeInfo(1);
      expect(info.participantCount).to.equal(2n);
    });

    it("중복 참가 실패", async function () {
      await runchain.connect(user2).joinChallenge(1);
      await expect(
        runchain.connect(user2).joinChallenge(1)
      ).to.be.revertedWith("RunChain: already joined");
    });
  });

  // ─────────────────────────────────────────
  describe("기록 제출 및 경고 시스템", function () {
    beforeEach(async function () {
      await runchain.connect(user1).createChallenge("서울 러너즈", ENTRY_FEE);
      await runchain.connect(user2).joinChallenge(1);
      // 챌린지 활성화 (시간 조작)
      await ethers.provider.send("evm_increaseTime", [86400]);
      await ethers.provider.send("evm_mine");
      await runchain.connect(verifier).activateChallenge(1);
    });

    it("정상 기록 제출 (5km)", async function () {
      await runchain.connect(verifier).submitRecord(1, user1.address, 500, false);
      const p = await runchain.getParticipantInfo(1, user1.address);
      expect(p.totalKm).to.equal(500n);
    });

    it("일일 최대 10km 캡 적용", async function () {
      await runchain.connect(verifier).submitRecord(1, user1.address, 1500, false); // 15km 시도
      const p = await runchain.getParticipantInfo(1, user1.address);
      expect(p.totalKm).to.equal(1000n); // 10km 캡
    });

    it("경고 3회 누적 시 자동 실격", async function () {
      for (let i = 0; i < 3; i++) {
        // 각 날짜로 시간 이동
        await ethers.provider.send("evm_increaseTime", [86400]);
        await ethers.provider.send("evm_mine");
        await runchain.connect(verifier).submitRecord(1, user1.address, 500, true);
      }
      const p = await runchain.getParticipantInfo(1, user1.address);
      expect(p.disqualified).to.equal(true);
    });
  });

  // ─────────────────────────────────────────
  describe("상금 분배", function () {
    async function setupAndFinalize(participants, ranks) {
      // 챌린지 생성
      await runchain.connect(participants[0]).createChallenge("테스트 챌린지", ENTRY_FEE);
      for (let i = 1; i < participants.length; i++) {
        await runchain.connect(participants[i]).joinChallenge(1);
      }
      // 시작 + 7일 경과
      await ethers.provider.send("evm_increaseTime", [86400]);
      await ethers.provider.send("evm_mine");
      await runchain.connect(verifier).activateChallenge(1);
      await ethers.provider.send("evm_increaseTime", [7 * 86400]);
      await ethers.provider.send("evm_mine");
      // 종료
      await runchain.connect(verifier).finalizeChallenge(
        1,
        ranks[0] || ethers.ZeroAddress,
        ranks[1] || ethers.ZeroAddress,
        ranks[2] || ethers.ZeroAddress
      );
    }

    it("1명: 전액 환급", async function () {
      const before = await mockUSDT.balanceOf(user1.address);
      await setupAndFinalize([user1], [user1.address]);
      const after = await mockUSDT.balanceOf(user1.address);
      expect(after).to.equal(before); // 낸 만큼 돌려받음
    });

    it("3명+: 50/35/15 분배", async function () {
      const before1 = await mockUSDT.balanceOf(user1.address);
      const before2 = await mockUSDT.balanceOf(user2.address);
      const before3 = await mockUSDT.balanceOf(user3.address);

      await setupAndFinalize(
        [user1, user2, user3],
        [user1.address, user2.address, user3.address]
      );

      const pool = ENTRY_FEE * 3n;
      const after1 = await mockUSDT.balanceOf(user1.address);
      const after2 = await mockUSDT.balanceOf(user2.address);
      const after3 = await mockUSDT.balanceOf(user3.address);

      expect(after1 - before1 + ENTRY_FEE).to.equal(pool * 5000n / 10000n); // +5 -5 fee
      expect(after2 - before2 + ENTRY_FEE).to.equal(pool * 3500n / 10000n);
      expect(after3 - before3 + ENTRY_FEE).to.equal(pool * 1500n / 10000n);
    });
  });

  // ─────────────────────────────────────────
  describe("국고 시스템", function () {
    it("기권 시 국고 적립", async function () {
      await runchain.connect(user1).createChallenge("테스트", ENTRY_FEE);
      await runchain.connect(user2).joinChallenge(1);
      await runchain.connect(user2).withdraw(1);

      const treasury = await runchain.getTreasuryInfo();
      expect(treasury.total).to.equal(ENTRY_FEE);
    });
  });
});
