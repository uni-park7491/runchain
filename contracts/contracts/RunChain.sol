// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RunChain
 * @notice BNB Chain weekly running challenge with USDT prize pool
 * @dev Prize: 1st 50% / 2nd 35% / 3rd 15% / 4th+ -> treasury
 *      3 GPS warnings = disqualified, fee -> treasury
 *      Treasury >= 20 USDT -> monthly 0.5 USDT bonus to 4th-10th
 */
contract RunChain is ReentrancyGuard, Ownable {
    IERC20 public immutable usdt;
    address public verifier;

    uint256 public constant MAX_PARTICIPANTS = 30;
    uint256 public constant CHALLENGE_DURATION = 7 days;
    uint256 public constant MIN_ENTRY_FEE = 1e18; // 1 USDT (18 decimals)
    uint256 public constant WARNING_LIMIT = 3;

    // Prize distribution (basis points out of 10000)
    uint256 public constant PRIZE_1ST = 5000; // 50%
    uint256 public constant PRIZE_2ND = 3500; // 35%
    uint256 public constant PRIZE_3RD = 1500; // 15%

    // Monthly bonus
    uint256 public constant MONTHLY_BONUS_THRESHOLD = 20e18;  // 20 USDT
    uint256 public constant MONTHLY_BONUS_AMOUNT = 5e17;      // 0.5 USDT per person
    uint256 public constant MONTHLY_BONUS_MAX_RECIPIENTS = 7; // 4th to 10th place

    uint256 public treasury;
    uint256 public totalChallenges;

    enum ChallengeStatus { OPEN, ACTIVE, FINALIZED, CANCELLED }

    struct Participant {
        bool joined;
        bool disqualified;
        uint256 warnings;
        uint256 totalDistanceMeters;
        mapping(uint256 => uint256) dailyDistanceMeters;
        mapping(uint256 => bool) dailyRecordSubmitted;
    }

    struct Challenge {
        uint256 id;
        string name;
        address creator;
        uint256 entryFee;
        uint256 startTime;
        uint256 endTime;
        uint256 participantCount;
        uint256 totalPool;
        ChallengeStatus status;
        address[] participantList;
        address[3] topRunners;
    }

    mapping(uint256 => Challenge) public challenges;
    mapping(uint256 => mapping(address => Participant)) public participants;

    event ChallengeCreated(uint256 indexed challengeId, address indexed creator, uint256 entryFee, uint256 startTime);
    event ParticipantJoined(uint256 indexed challengeId, address indexed participant);
    event ChallengeActivated(uint256 indexed challengeId);
    event RecordSubmitted(uint256 indexed challengeId, address indexed participant, uint256 distanceMeters, uint256 day);
    event WarningIssued(uint256 indexed challengeId, address indexed participant, uint256 warningCount);
    event ParticipantDisqualified(uint256 indexed challengeId, address indexed participant);
    event ChallengeFinalized(uint256 indexed challengeId, address first, address second, address third);
    event PrizeDistributed(address indexed winner, uint256 amount, uint256 place);
    event TreasuryUpdated(uint256 newAmount);
    event MonthlyBonusDistributed(uint256 totalAmount, uint256 recipients);
    event VerifierUpdated(address indexed newVerifier);

    modifier onlyVerifier() {
        require(msg.sender == verifier, "Only verifier");
        _;
    }

    modifier challengeExists(uint256 challengeId) {
        require(challengeId < totalChallenges, "Challenge not found");
        _;
    }

    constructor(address _usdt, address _verifier) Ownable(msg.sender) {
        require(_usdt != address(0), "Invalid USDT address");
        require(_verifier != address(0), "Invalid verifier address");
        usdt = IERC20(_usdt);
        verifier = _verifier;
    }

    // ─────────────────────────────────────────────
    // Challenge Lifecycle
    // ─────────────────────────────────────────────

    function createChallenge(
        string calldata name,
        uint256 entryFee,
        uint256 startTime
    ) external returns (uint256 challengeId) {
        require(bytes(name).length > 0, "Name required");
        require(entryFee >= MIN_ENTRY_FEE, "Entry fee too low");
        require(startTime > block.timestamp, "Start time must be in future");

        challengeId = totalChallenges++;
        Challenge storage c = challenges[challengeId];
        c.id = challengeId;
        c.name = name;
        c.creator = msg.sender;
        c.entryFee = entryFee;
        c.startTime = startTime;
        c.endTime = startTime + CHALLENGE_DURATION;
        c.status = ChallengeStatus.OPEN;

        emit ChallengeCreated(challengeId, msg.sender, entryFee, startTime);

        // Creator joins automatically
        _joinChallenge(challengeId, msg.sender);
    }

    function joinChallenge(uint256 challengeId) external challengeExists(challengeId) nonReentrant {
        _joinChallenge(challengeId, msg.sender);
    }

    function _joinChallenge(uint256 challengeId, address participant) internal {
        Challenge storage c = challenges[challengeId];
        require(c.status == ChallengeStatus.OPEN, "Challenge not open");
        require(!participants[challengeId][participant].joined, "Already joined");
        require(c.participantCount < MAX_PARTICIPANTS, "Challenge full");

        require(usdt.transferFrom(participant, address(this), c.entryFee), "USDT transfer failed");

        participants[challengeId][participant].joined = true;
        c.participantList.push(participant);
        c.participantCount++;
        c.totalPool += c.entryFee;

        emit ParticipantJoined(challengeId, participant);
    }

    function activateChallenge(uint256 challengeId) external challengeExists(challengeId) {
        Challenge storage c = challenges[challengeId];
        require(c.status == ChallengeStatus.OPEN, "Not open");
        require(block.timestamp >= c.startTime, "Not started yet");
        c.status = ChallengeStatus.ACTIVE;
        emit ChallengeActivated(challengeId);
    }

    function withdrawFromChallenge(uint256 challengeId) external challengeExists(challengeId) nonReentrant {
        Challenge storage c = challenges[challengeId];
        require(c.status == ChallengeStatus.OPEN, "Can only withdraw before start");

        Participant storage p = participants[challengeId][msg.sender];
        require(p.joined, "Not a participant");

        p.joined = false;
        c.participantCount--;
        c.totalPool -= c.entryFee;

        for (uint256 i = 0; i < c.participantList.length; i++) {
            if (c.participantList[i] == msg.sender) {
                c.participantList[i] = c.participantList[c.participantList.length - 1];
                c.participantList.pop();
                break;
            }
        }

        require(usdt.transfer(msg.sender, c.entryFee), "Refund failed");
    }

    function cancelChallenge(uint256 challengeId) external challengeExists(challengeId) nonReentrant {
        Challenge storage c = challenges[challengeId];
        require(c.creator == msg.sender || msg.sender == owner(), "Not authorized");
        require(c.status == ChallengeStatus.OPEN, "Can only cancel open challenges");

        c.status = ChallengeStatus.CANCELLED;

        for (uint256 i = 0; i < c.participantList.length; i++) {
            address p = c.participantList[i];
            if (participants[challengeId][p].joined) {
                require(usdt.transfer(p, c.entryFee), "Refund failed");
            }
        }
    }

    // ─────────────────────────────────────────────
    // Verifier-only: Record & Warning
    // ─────────────────────────────────────────────

    function submitRecord(
        uint256 challengeId,
        address participant,
        uint256 distanceMeters,
        uint256 day
    ) external onlyVerifier challengeExists(challengeId) {
        Challenge storage c = challenges[challengeId];
        require(c.status == ChallengeStatus.ACTIVE, "Challenge not active");
        require(day < 7, "Invalid day");

        Participant storage p = participants[challengeId][participant];
        require(p.joined, "Not a participant");
        require(!p.disqualified, "Participant disqualified");
        require(!p.dailyRecordSubmitted[day], "Already submitted for this day");

        // Cap at 10km, only count if >= 3km
        uint256 capped = distanceMeters > 10000 ? 10000 : distanceMeters;
        if (capped >= 3000) {
            p.dailyDistanceMeters[day] = capped;
            p.totalDistanceMeters += capped;
        }
        p.dailyRecordSubmitted[day] = true;

        emit RecordSubmitted(challengeId, participant, capped, day);
    }

    function issueWarning(
        uint256 challengeId,
        address participant
    ) external onlyVerifier challengeExists(challengeId) {
        Challenge storage c = challenges[challengeId];
        require(c.status == ChallengeStatus.ACTIVE, "Challenge not active");

        Participant storage p = participants[challengeId][participant];
        require(p.joined, "Not a participant");
        require(!p.disqualified, "Already disqualified");

        p.warnings++;
        emit WarningIssued(challengeId, participant, p.warnings);

        if (p.warnings >= WARNING_LIMIT) {
            p.disqualified = true;
            treasury += c.entryFee;
            c.totalPool -= c.entryFee;
            emit ParticipantDisqualified(challengeId, participant);
            emit TreasuryUpdated(treasury);
        }
    }

    // ─────────────────────────────────────────────
    // Finalization & Prize Distribution
    // ─────────────────────────────────────────────

    function finalizeChallenge(
        uint256 challengeId,
        address rank1,
        address rank2,
        address rank3
    ) external onlyVerifier challengeExists(challengeId) nonReentrant {
        Challenge storage c = challenges[challengeId];
        require(c.status == ChallengeStatus.ACTIVE, "Not active");
        require(block.timestamp >= c.endTime, "Challenge not ended yet");

        c.status = ChallengeStatus.FINALIZED;

        uint256 pool = c.totalPool;
        uint256 activeCount = _countActiveParticipants(challengeId);

        if (activeCount == 0) {
            treasury += pool;
            emit TreasuryUpdated(treasury);
        } else if (activeCount == 1) {
            address winner = _findFirstActive(challengeId);
            require(usdt.transfer(winner, pool), "Transfer failed");
            emit PrizeDistributed(winner, pool, 1);
        } else if (activeCount == 2) {
            uint256 prize1 = pool / 2;
            uint256 prize2 = pool - prize1;
            if (rank1 != address(0)) {
                require(usdt.transfer(rank1, prize1), "Transfer failed");
                emit PrizeDistributed(rank1, prize1, 1);
            }
            if (rank2 != address(0)) {
                require(usdt.transfer(rank2, prize2), "Transfer failed");
                emit PrizeDistributed(rank2, prize2, 2);
            }
        } else {
            uint256 prize1 = (pool * PRIZE_1ST) / 10000;
            uint256 prize2 = (pool * PRIZE_2ND) / 10000;
            uint256 prize3 = (pool * PRIZE_3RD) / 10000;
            uint256 remainder = pool - prize1 - prize2 - prize3;

            if (rank1 != address(0)) {
                require(usdt.transfer(rank1, prize1), "Transfer failed");
                emit PrizeDistributed(rank1, prize1, 1);
                c.topRunners[0] = rank1;
            }
            if (rank2 != address(0)) {
                require(usdt.transfer(rank2, prize2), "Transfer failed");
                emit PrizeDistributed(rank2, prize2, 2);
                c.topRunners[1] = rank2;
            }
            if (rank3 != address(0)) {
                require(usdt.transfer(rank3, prize3), "Transfer failed");
                emit PrizeDistributed(rank3, prize3, 3);
                c.topRunners[2] = rank3;
            }

            if (remainder > 0) {
                treasury += remainder;
                emit TreasuryUpdated(treasury);
            }
        }

        emit ChallengeFinalized(challengeId, rank1, rank2, rank3);
    }

    function distributeMonthlyBonus(address[] calldata recipients) external onlyVerifier nonReentrant {
        require(recipients.length > 0 && recipients.length <= MONTHLY_BONUS_MAX_RECIPIENTS, "Invalid recipients count");
        require(treasury >= MONTHLY_BONUS_THRESHOLD, "Treasury below 20 USDT threshold");

        uint256 totalBonus = MONTHLY_BONUS_AMOUNT * recipients.length;
        require(treasury >= totalBonus, "Insufficient treasury for bonus");

        treasury -= totalBonus;

        for (uint256 i = 0; i < recipients.length; i++) {
            require(usdt.transfer(recipients[i], MONTHLY_BONUS_AMOUNT), "Bonus transfer failed");
        }

        emit MonthlyBonusDistributed(totalBonus, recipients.length);
        emit TreasuryUpdated(treasury);
    }

    // ─────────────────────────────────────────────
    // Admin
    // ─────────────────────────────────────────────

    function updateVerifier(address newVerifier) external onlyOwner {
        require(newVerifier != address(0), "Invalid address");
        verifier = newVerifier;
        emit VerifierUpdated(newVerifier);
    }

    // ─────────────────────────────────────────────
    // View Functions
    // ─────────────────────────────────────────────

    function getChallengeInfo(uint256 challengeId) external view challengeExists(challengeId) returns (
        uint256 id,
        string memory name,
        address creator,
        uint256 entryFee,
        uint256 startTime,
        uint256 endTime,
        uint256 participantCount,
        uint256 totalPool,
        ChallengeStatus status
    ) {
        Challenge storage c = challenges[challengeId];
        return (c.id, c.name, c.creator, c.entryFee, c.startTime, c.endTime, c.participantCount, c.totalPool, c.status);
    }

    function getParticipantInfo(uint256 challengeId, address participant) external view returns (
        bool joined,
        bool disqualified,
        uint256 warnings,
        uint256 totalDistanceMeters
    ) {
        Participant storage p = participants[challengeId][participant];
        return (p.joined, p.disqualified, p.warnings, p.totalDistanceMeters);
    }

    function getDailyDistance(uint256 challengeId, address participant, uint256 day) external view returns (uint256) {
        return participants[challengeId][participant].dailyDistanceMeters[day];
    }

    function getParticipantList(uint256 challengeId) external view challengeExists(challengeId) returns (address[] memory) {
        return challenges[challengeId].participantList;
    }

    function getTreasuryBalance() external view returns (uint256) {
        return treasury;
    }

    function getPlatformStats() external view returns (uint256 totalChallengesCount, uint256 treasuryBalance) {
        return (totalChallenges, treasury);
    }

    // ─────────────────────────────────────────────
    // Internal Helpers
    // ─────────────────────────────────────────────

    function _countActiveParticipants(uint256 challengeId) internal view returns (uint256 count) {
        address[] storage list = challenges[challengeId].participantList;
        for (uint256 i = 0; i < list.length; i++) {
            if (!participants[challengeId][list[i]].disqualified) {
                count++;
            }
        }
    }

    function _findFirstActive(uint256 challengeId) internal view returns (address) {
        address[] storage list = challenges[challengeId].participantList;
        for (uint256 i = 0; i < list.length; i++) {
            if (!participants[challengeId][list[i]].disqualified) {
                return list[i];
            }
        }
        return address(0);
    }
}
