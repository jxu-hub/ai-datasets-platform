const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("部署账户:", deployer.address);
  console.log("账户余额:", balance.toString());

  const AiDatasets = await ethers.getContractFactory("aiDatasets");
  const aiDatasets = await AiDatasets.deploy();
  await aiDatasets.waitForDeployment();

  const contractAddress = aiDatasets.target;
  console.log("aiDatasets 合约已部署到:", contractAddress);

  // 1. 写入 ABI
  const artifactPath = path.join(__dirname, "../artifacts/contracts/AiDatasets.sol/aiDatasets.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const abi = artifact.abi;
  const abiDir = path.join(__dirname, "../../frontend/contract/contractABI");
  if (!fs.existsSync(abiDir)) fs.mkdirSync(abiDir);
  fs.writeFileSync(path.join(abiDir, "abi.json"), JSON.stringify(abi, null, 2), "utf8");
  console.log("ABI 已写入 contractABI/abi.json");

  // 2. 更新或追加到 .env
  const envPath = path.join(__dirname, "../../frontend/.env");
  let envLines = [];
  if (fs.existsSync(envPath)) {
    envLines = fs.readFileSync(envPath, "utf8").split("\n");
  }

  const updates = {
    NEXT_PUBLIC_CONTRACT_ADDRESS: contractAddress,
    NEXT_PUBLIC_DEPLOYER_ADDRESS: deployer.address,
  };

  for (const key in updates) {
    const idx = envLines.findIndex((line) => line.startsWith(key + "="));
    if (idx !== -1) {
      envLines[idx] = `${key}=${updates[key]}`;
    } else {
      envLines.push(`${key}=${updates[key]}`);
    }
  }

  fs.writeFileSync(envPath, envLines.join("\n"), "utf8");
  console.log(".env 文件已更新合约地址和部署者地址");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
