// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ╔══════════════════════════════════════════════════════╗
 * ║           RUN CHAIN — Smart Contract v1.0           ║
 * ║         BNB Chain (BSC) · USDT BEP-20 기반          ║
 * ║                                                      ║
 * ║  · 운영자 수수료 0%                                   ║
 * ║  · 완전 탈중앙화 자동 분배                             ║
 * ║  · 국고 완전 자동 관리                                 ║
 * ╚══════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────
// IERC20 인터페이스 (USDT BEP-20)
// ─────────────────────────────────────────────
interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

// ─────────────────────────────────────────────
// RunChain 메인 컨트랙트
// ─────────────────────────────────────────────
contract RunChain {

    // ── 상수 ──────────────────────────────────
    uint256 public constant MAX_PARTICIPANTS  = 30;
    uint256 public constant CHALLENGE_DURATION = 7 days;
    uint256 public constant MIN_ENTRY_FEE     = 1 * 1e6;   // 1 USDT (6 decimals)
    uint256 public constant MIN_KM_PER_DAY    = 3;          // 최소 3km
    uint256 public constant MAX_KM_PER_DAY    = 10;         // 최대 10km
    uint256 public constant BONUS_PER_RANK    = 5 * 1e5;    // 0.5 USDT
    uint256 public constant TREASURY_THRESHOLD = 20 * 1e6;  // 20 USDT (보너스 발동 기준)

    // 상금 분배 비율 (basis points, 10000 = 100%)
    uint256 public constant PRIZE_1ST = 5000; // 50%
    uint256 public constant PRIZE_2ND = 3500; // 35%
    uint256 public constant PRIZE_3RD = 1500; // 15%

    // ── USDT 토큰 주소 (BSC Mainnet) ──────────
    // 테스트넷: 0x337610d27c682E347C9cD60BD4b3b107C9d34dDd
    // 메인넷:   0x55d398326f99059fF775485246999027B3197955
    IERC20 public immutable usdt;

    // ── 백엔드 서버 주소 (기록 검증 후 submitRecord 호출) ──
    address public immutable verifier;

    // ── 국고 ──────────────────────────────────
    uint256 public treasury;
    uint256 public monthlyTreasury;      // 이번달 적립액
    uint256 public lastBonusMonth;       // 마지막 보너스 지급 월
    uint256 public totalDistributed;     // 누적 상금 지급액
    uint256 public totalChallenges;      // 누적 챌린지 수
    uint256 public totalParticipations;  // 누적 참가 수

    // ── 데이터 구조 ───────────────────────────

    enum ChallengeStatus { OPEN, ACTIVE, FINALIZED, CANCELLED }

    struct Participant {
        address wallet;
        uint256 totalKm;       // 주간 누적 거리 (km * 100, 소수점 2자리)
        uint256 dailyKm;       // 오늘 기록 (km * 100)
        uint256 lastRecordDay; // 마지막 기록 날짜 (unix timestamp / 86400)
        uint8   warnings;      // 경고 횟수
        bool    disqualified;  // 실격 여부
        bool    withdrawn;     // 기권 여부
        bool    exists;
    }

    struct Challenge {
        uint256 id;
        string  name;
        address creator;
        uint256 entryFee;      // USDT (6 decimals)
        uint256 startTime;
        uint256 endTime;
        uint256 totalPool;     // 총 상금 풀
        uint256 participantCount;
        ChallengeStatus status;
        address[30] participantList;
        mapping(address => Participant) participants;
        // 최종 순위 (백엔드가 finalizeChallenge 호출 시 입력)
        address rank1;
        address rank2;
        address rank3;
        bool finalized;
    }

    // ── 스토리지 ──────────────────────────────
    uint256 public challengeCount;
    mapping(uint256 => Challenge) public challenges;
    mapping(address => uint256[]) public userChallenges; // 유저별 챌린지 목록

    // ── 이벤트 ────────────────────────────────
    event ChallengeCreated(uint256 indexed id, address indexed creator, uint256 entryFee, uint256 startTime);
    event ParticipantJoined(uint256 indexed challengeId, address indexed participant);
    event RecordSubmitted(uint256 indexed challengeId, address indexed participant, uint256 kmX100);
    event WarningIssued(uint256 indexed challengeId, address indexed participant, uint8 warningCount);
    event ParticipantDisqualified(uint256 indexed challengeId, address indexed participant);
    event ChallengeFinalized(uint256 indexed challengeId, address rank1, address rank2, address rank3);
    event PrizeDistributed(uint256 indexed challengeId, address indexed recipient, uint256 amount, uint8 rank);
    event TreasuryDeposit(uint256 indexed challengeId, uint256 amount, string reason);
    event BonusDistributed(uint256 indexed challengeId, address indexed recipient, uint256 amount);
    event MonthlyBonusActivated(uint256 month, uint256 amount);

    // ── 접근 제어 ─────────────────────────────
    modifier onlyVerifier() {
        require(msg.sender == verifier, "RunChain: caller is not verifier");
        _;
    }

    modifier challengeExists(uint256 _id) {
        require(_id > 0 && _id <= challengeCount, "RunChain: challenge not found");
        _;
    }

    // ─────────────────────────────────────────
    // 생성자
    // ─────────────────────────────────────────
    constructor(address _usdt, address _verifier) {
        require(_usdt != address(0), "RunChain: invalid USDT address");
        require(_verifier != address(0), "RunChain: invalid verifier address");
        usdt = IERC20(_usdt);
        verifier = _verifier;
    }

    // ═════════════════════════════════════════
    // 1. 챌린지 생성
    // ═════════════════════════════════════════
    /**
     * @dev 새 챌린지 생성. 생성자도 자동으로 참가자에 포함됨.
     * @param _name 챌린지 이름
     * @param _entryFee 참가비 (USDT, 6 decimals 기준)
     */
    function createChallenge(
        string calldata _name,
        uint256 _entryFee
    ) external returns (uint256) {
        require(bytes(_name).length > 0, "RunChain: name required");
        require(_entryFee >= MIN_ENTRY_FEE, "RunChain: entry fee too low");

        // 참가비 수령
        require(
            usdt.transferFrom(msg.sender, address(this), _entryFee),
            "RunChain: USDT transfer failed"
        );

        challengeCount++;
        uint256 id = challengeCount;
        Challenge storage c = challenges[id];

        c.id              = id;
        c.name            = _name;
        c.creator         = msg.sender;
        c.entryFee        = _entryFee;
        c.startTime       = block.timestamp + 1 days; // 익일 00:00 자동 시작
        c.endTime         = c.startTime + CHALLENGE_DURATION;
        c.status          = ChallengeStatus.OPEN;
        c.totalPool       = _entryFee;
        c.participantCount = 1;

        // 생성자 자동 참가
        c.participantList[0] = msg.sender;
        c.participants[msg.sender] = Participant({
            wallet:        msg.sender,
            totalKm:       0,
            dailyKm:       0,
            lastRecordDay: 0,
            warnings:      0,
            disqualified:  false,
            withdrawn:     false,
            exists:        true
        });

        userChallenges[msg.sender].push(id);
        totalChallenges++;

        emit ChallengeCreated(id, msg.sender, _entryFee, c.startTime);
        emit ParticipantJoined(id, msg.sender);

        return id;
    }

    // ═════════════════════════════════════════
    // 2. 챌린지 참가
    // ═════════════════════════════════════════
    /**
     * @dev 챌린지에 참가. USDT 참가비를 컨트랙트에 잠금.
     * @param _challengeId 참가할 챌린지 ID
     */
    function joinChallenge(uint256 _challengeId)
        external
        challengeExists(_challengeId)
    {
        Challenge storage c = challenges[_challengeId];

        require(c.status == ChallengeStatus.OPEN, "RunChain: challenge not open");
        require(block.timestamp < c.startTime, "RunChain: challenge already started");
        require(c.participantCount < MAX_PARTICIPANTS, "RunChain: challenge is full");
        require(!c.participants[msg.sender].exists, "RunChain: already joined");

        // 참가비 수령
        require(
            usdt.transferFrom(msg.sender, address(this), c.entryFee),
            "RunChain: USDT transfer failed"
        );

        // 참가자 등록
        c.participantList[c.participantCount] = msg.sender;
        c.participants[msg.sender] = Participant({
            wallet:        msg.sender,
            totalKm:       0,
            dailyKm:       0,
            lastRecordDay: 0,
            warnings:      0,
            disqualified:  false,
            withdrawn:     false,
            exists:        true
        });

        c.participantCount++;
        c.totalPool += c.entryFee;
        userChallenges[msg.sender].push(_challengeId);
        totalParticipations++;

        emit ParticipantJoined(_challengeId, msg.sender);
    }

    // ═════════════════════════════════════════
    // 3. 기록 제출 (백엔드 서버만 호출 가능)
    // ═════════════════════════════════════════
    /**
     * @dev GPS + AI 검증 완료된 기록을 백엔드 서버가 제출.
     *      경고 3회 누적 시 자동 실격.
     * @param _challengeId 챌린지 ID
     * @param _participant 참가자 지갑 주소
     * @param _kmX100 오늘 거리 (km * 100, 예: 5.32km → 532)
     * @param _warn 경고 발동 여부
     */
    function submitRecord(
        uint256 _challengeId,
        address _participant,
        uint256 _kmX100,
        bool _warn
    ) external onlyVerifier challengeExists(_challengeId) {
        Challenge storage c = challenges[_challengeId];
        Participant storage p = c.participants[_participant];

        require(c.status == ChallengeStatus.ACTIVE, "RunChain: not active");
        require(p.exists, "RunChain: participant not found");
        require(!p.disqualified, "RunChain: participant disqualified");
        require(!p.withdrawn, "RunChain: participant withdrawn");

        uint256 today = block.timestamp / 1 days;
        require(p.lastRecordDay < today, "RunChain: already recorded today");

        // 일일 최대 10km 캡
        uint256 maxKmX100 = MAX_KM_PER_DAY * 100;
        uint256 minKmX100 = MIN_KM_PER_DAY * 100;
        uint256 validKm   = 0;

        // 최소 3km 이상일 때만 기록 인정
        if (_kmX100 >= minKmX100) {
            validKm = _kmX100 > maxKmX100 ? maxKmX100 : _kmX100;
        }

        // 경고 처리
        if (_warn) {
            p.warnings++;
            emit WarningIssued(_challengeId, _participant, p.warnings);

            if (p.warnings >= 3) {
                // 실격 처리
                p.disqualified = true;
                // 참가비 → 국고
                _depositToTreasury(_challengeId, c.entryFee, "disqualification");
                c.totalPool -= c.entryFee;
                emit ParticipantDisqualified(_challengeId, _participant);
                return;
            }
        }

        // 기록 업데이트
        p.totalKm      += validKm;
        p.dailyKm       = validKm;
        p.lastRecordDay = today;

        emit RecordSubmitted(_challengeId, _participant, validKm);
    }

    // ═════════════════════════════════════════
    // 4. 기권 처리
    // ═════════════════════════════════════════
    /**
     * @dev 자발적 기권. 참가비 환불 불가 → 국고 적립.
     */
    function withdraw(uint256 _challengeId)
        external
        challengeExists(_challengeId)
    {
        Challenge storage c = challenges[_challengeId];
        Participant storage p = c.participants[msg.sender];

        require(p.exists, "RunChain: not a participant");
        require(!p.withdrawn, "RunChain: already withdrawn");
        require(!p.disqualified, "RunChain: disqualified");
        require(c.status != ChallengeStatus.FINALIZED, "RunChain: already finalized");

        p.withdrawn = true;
        _depositToTreasury(_challengeId, c.entryFee, "withdrawal");
        c.totalPool -= c.entryFee;
    }

    // ═════════════════════════════════════════
    // 5. 챌린지 활성화 (시작일 도달 시)
    // ═════════════════════════════════════════
    function activateChallenge(uint256 _challengeId)
        external
        onlyVerifier
        challengeExists(_challengeId)
    {
        Challenge storage c = challenges[_challengeId];
        require(c.status == ChallengeStatus.OPEN, "RunChain: not open");
        require(block.timestamp >= c.startTime, "RunChain: not started yet");
        c.status = ChallengeStatus.ACTIVE;
    }

    // ═════════════════════════════════════════
    // 6. 챌린지 종료 및 상금 자동 분배
    // ═════════════════════════════════════════
    /**
     * @dev 7일 종료 후 백엔드가 최종 순위를 입력하고 자동 분배.
     *      순위는 백엔드에서 집계 후 검증된 값만 전달.
     */
    function finalizeChallenge(
        uint256 _challengeId,
        address _rank1,
        address _rank2,
        address _rank3
    ) external onlyVerifier challengeExists(_challengeId) {
        Challenge storage c = challenges[_challengeId];

        require(c.status == ChallengeStatus.ACTIVE, "RunChain: not active");
        require(block.timestamp >= c.endTime, "RunChain: not ended yet");
        require(!c.finalized, "RunChain: already finalized");

        c.status    = ChallengeStatus.FINALIZED;
        c.finalized = true;
        c.rank1     = _rank1;
        c.rank2     = _rank2;
        c.rank3     = _rank3;

        uint256 pool = c.totalPool;

        // ── 참가자 수에 따른 분배 로직 ──────────

        uint256 activeCount = _getActiveCount(_challengeId);

        if (activeCount == 0) {
            // 전원 실격/기권 → 이미 국고 처리됨
            emit ChallengeFinalized(_challengeId, address(0), address(0), address(0));
            return;
        }

        if (activeCount == 1) {
            // 1명: 참가비 100% 환급
            address sole = _rank1;
            require(usdt.transfer(sole, pool), "RunChain: transfer failed");
            emit PrizeDistributed(_challengeId, sole, pool, 1);

        } else if (activeCount == 2) {
            // 2명: 1등 50%, 2등 35%, 나머지 15% → 국고
            uint256 prize1 = pool * PRIZE_1ST / 10000;
            uint256 prize2 = pool * PRIZE_2ND / 10000;
            uint256 toTreasury = pool - prize1 - prize2;

            require(usdt.transfer(_rank1, prize1), "RunChain: transfer rank1 failed");
            require(usdt.transfer(_rank2, prize2), "RunChain: transfer rank2 failed");

            _depositToTreasury(_challengeId, toTreasury, "2-player remainder");

            emit PrizeDistributed(_challengeId, _rank1, prize1, 1);
            emit PrizeDistributed(_challengeId, _rank2, prize2, 2);

        } else {
            // 3명 이상: 1등 50%, 2등 35%, 3등 15%, 4등 이하 → 국고
            uint256 prize1 = pool * PRIZE_1ST / 10000;
            uint256 prize2 = pool * PRIZE_2ND / 10000;
            uint256 prize3 = pool * PRIZE_3RD / 10000;

            // 3개 합이 pool과 정확히 맞도록 조정 (반올림 오차 방지)
            prize3 = pool - prize1 - prize2;

            require(usdt.transfer(_rank1, prize1), "RunChain: transfer rank1 failed");
            require(usdt.transfer(_rank2, prize2), "RunChain: transfer rank2 failed");
            require(usdt.transfer(_rank3, prize3), "RunChain: transfer rank3 failed");

            emit PrizeDistributed(_challengeId, _rank1, prize1, 1);
            emit PrizeDistributed(_challengeId, _rank2, prize2, 2);
            emit PrizeDistributed(_challengeId, _rank3, prize3, 3);
        }

        totalDistributed += pool;
        emit ChallengeFinalized(_challengeId, _rank1, _rank2, _rank3);
    }

    // ═════════════════════════════════════════
    // 7. 월간 국고 보너스 지급 (4~10등)
    // ═════════════════════════════════════════
    /**
     * @dev 매월 말 백엔드가 호출. 국고 ≥ 20 USDT 조건 충족 시
     *      해당 챌린지의 4~10등에게 0.5 USDT씩 자동 지급.
     */
    function distributeMonthlyBonus(
        uint256 _challengeId,
        address[] calldata _recipients // 4~10등 주소 배열
    ) external onlyVerifier challengeExists(_challengeId) {
        require(treasury >= TREASURY_THRESHOLD, "RunChain: treasury below threshold");
        require(_recipients.length > 0 && _recipients.length <= 7, "RunChain: invalid recipient count");

        uint256 totalBonus = BONUS_PER_RANK * _recipients.length;
        require(treasury >= totalBonus, "RunChain: insufficient treasury");

        uint256 currentMonth = block.timestamp / 30 days;
        require(currentMonth > lastBonusMonth, "RunChain: bonus already distributed this month");

        lastBonusMonth = currentMonth;
        treasury -= totalBonus;

        for (uint256 i = 0; i < _recipients.length; i++) {
            require(usdt.transfer(_recipients[i], BONUS_PER_RANK), "RunChain: bonus transfer failed");
            emit BonusDistributed(_challengeId, _recipients[i], BONUS_PER_RANK);
        }

        emit MonthlyBonusActivated(currentMonth, totalBonus);
    }

    // ═════════════════════════════════════════
    // 8. 내부 함수
    // ═════════════════════════════════════════

    function _depositToTreasury(
        uint256 _challengeId,
        uint256 _amount,
        string memory _reason
    ) internal {
        treasury += _amount;
        monthlyTreasury += _amount;
        emit TreasuryDeposit(_challengeId, _amount, _reason);
    }

    function _getActiveCount(uint256 _challengeId) internal view returns (uint256) {
        Challenge storage c = challenges[_challengeId];
        uint256 count = 0;
        for (uint256 i = 0; i < c.participantCount; i++) {
            address addr = c.participantList[i];
            Participant storage p = c.participants[addr];
            if (!p.disqualified && !p.withdrawn) {
                count++;
            }
        }
        return count;
    }

    // ═════════════════════════════════════════
    // 9. 조회 함수 (View)
    // ═════════════════════════════════════════

    function getChallengeInfo(uint256 _id) external view returns (
        string memory name,
        address creator,
        uint256 entryFee,
        uint256 startTime,
        uint256 endTime,
        uint256 totalPool,
        uint256 participantCount,
        ChallengeStatus status
    ) {
        Challenge storage c = challenges[_id];
        return (
            c.name,
            c.creator,
            c.entryFee,
            c.startTime,
            c.endTime,
            c.totalPool,
            c.participantCount,
            c.status
        );
    }

    function getParticipantInfo(uint256 _challengeId, address _participant)
        external view returns (
            uint256 totalKm,
            uint256 dailyKm,
            uint8   warnings,
            bool    disqualified,
            bool    withdrawn
        )
    {
        Participant storage p = challenges[_challengeId].participants[_participant];
        return (
            p.totalKm,
            p.dailyKm,
            p.warnings,
            p.disqualified,
            p.withdrawn
        );
    }

    function getTreasuryInfo() external view returns (
        uint256 total,
        uint256 monthly,
        bool    bonusReady
    ) {
        return (treasury, monthlyTreasury, treasury >= TREASURY_THRESHOLD);
    }

    function getPlatformStats() external view returns (
        uint256 _totalChallenges,
        uint256 _totalParticipations,
        uint256 _totalDistributed,
        uint256 _treasury
    ) {
        return (totalChallenges, totalParticipations, totalDistributed, treasury);
    }

    function getUserChallenges(address _user)
        external view returns (uint256[] memory)
    {
        return userChallenges[_user];
    }

    function getParticipantList(uint256 _challengeId)
        external view returns (address[] memory)
    {
        Challenge storage c = challenges[_challengeId];
        address[] memory list = new address[](c.participantCount);
        for (uint256 i = 0; i < c.participantCount; i++) {
            list[i] = c.participantList[i];
        }
        return list;
    }

    // ── 월간 초기화 (매월 1일 백엔드가 호출) ──
    function resetMonthlyTreasury() external onlyVerifier {
        monthlyTreasury = 0;
    }
}
