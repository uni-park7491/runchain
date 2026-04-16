const { ethers, network } = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  RunChain 스마트컨트랙트 배포");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  네트워크  : ${network.name}`);
  console.log(`  배포 주소 : ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`  잔액      : ${ethers.formatEther(balance)} BNB`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // 네트워크별 USDT 주소 설정
  const USDT_ADDRESSES = {
    bscTestnet: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd",
    bscMainnet: "0x55d398326f99059fF775485246999027B3197955",
    hardhat:    "0x0000000000000000000000000000000000000001", // 로컬 테스트용 mock
  };

  const usdtAddress = USDT_ADDRESSES[network.name];
  if (!usdtAddress) {
    throw new Error(`지원하지 않는 네트워크: ${network.name}`);
  }

  // verifier 주소 (백엔드 서버 지갑)
  const verifierAddress = process.env.VERIFIER_ADDRESS || deployer.address;

  console.log(`  USDT 주소  : ${usdtAddress}`);
  console.log(`  Verifier  : ${verifierAddress}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // 컨트랙트 배포
  console.log("\n📦 컨트랙트 배포 중...");
  const RunChain = await ethers.getContractFactory("RunChain");
  const runchain = await RunChain.deploy(usdtAddress, verifierAddress);

  await runchain.waitForDeployment();
  const contractAddress = await runchain.getAddress();

  console.log(`\n✅ 배포 완료!`);
  console.log(`   컨트랙트 주소: ${contractAddress}`);

  if (network.name === "bscTestnet") {
    console.log(`   BSCScan: https://testnet.bscscan.com/address/${contractAddress}`);
    console.log("\n📋 .env 파일에 아래 값을 추가하세요:");
    console.log(`   CONTRACT_ADDRESS_TESTNET=${contractAddress}`);
  } else if (network.name === "bscMainnet") {
    console.log(`   BSCScan: https://bscscan.com/address/${contractAddress}`);
    console.log("\n📋 .env 파일에 아래 값을 추가하세요:");
    console.log(`   CONTRACT_ADDRESS_MAINNET=${contractAddress}`);
  }

  // 컨트랙트 검증 안내
  console.log("\n📋 컨트랙트 소스코드 검증 명령어:");
  console.log(`   npx hardhat verify --network ${network.name} ${contractAddress} "${usdtAddress}" "${verifierAddress}"`);

  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ 배포 실패:", error);
    process.exit(1);
  });
