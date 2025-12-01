## 文档目标
- 编写 README.md，聚焦“后端、前端、Hardhat 本地链与合约部署”的完整启动步骤与联调流程。
- 明确区块链是必选项，给出 Hardhat 启动与部署脚本用法，确保新人可复现支付流程。

## 启动顺序
1. 启动 Hardhat 本地节点（必选）
2. 部署合约并写入前端 .env 与 ABI
3. 启动后端（配置已指向现成数据库，无需指导 DB 启动）
4. 启动前端并用钱包连接到 Hardhat 本地链

## 先决条件
- Node.js 18+（Hardhat/前端）
- Go 1.23+（后端）
- 浏览器钱包（MetaMask）

## Hardhat 本地链与合约部署
- 进入 `hardhat`：
  - `cd hardhat`
  - `npm install`
  - `npx hardhat compile`
- 启动本地链：
  - `npx hardhat node`
  - 记录本地 RPC：`http://127.0.0.1:8545`，ChainId：`31337`
- 部署合约（新终端）：
  - `npx hardhat run scripts/deploy.js --network localhost`
  - 自动执行：
    - 写入 `frontend/contract/contractABI/abi.json`
    - 更新 `frontend/.env` 中 `NEXT_PUBLIC_CONTRACT_ADDRESS` 与 `NEXT_PUBLIC_DEPLOYER_ADDRESS`
- 在 MetaMask 添加网络：
  - 网络名称：`Hardhat Local`
  - RPC URL：`http://127.0.0.1:8545`
  - Chain ID：`31337`
  - 货币符号：`ETH`
- 导入测试账户：从 `npx hardhat node` 输出的私钥中任选导入 MetaMask（仅本地开发）。

## 后端启动
- 进入后端：
  - `cd backend`
  - `go mod download`
  - `go run ./cmd`
- 说明：`backend/config/config.yaml` 已指向现成数据库与 MinIO，无需指导 DB 的启动；只需保证这些服务可连通。

## 前端启动
- 进入前端：
  - `cd frontend`
  - `npm install`
- 确认环境变量（部署脚本已写入）：
  - `NEXT_PUBLIC_CONTRACT_ADDRESS=...`
  - `NEXT_PUBLIC_DEPLOYER_ADDRESS=...`
  - `NEXT_PUBLIC_API_BASE="http://localhost:5000/api"`
  - `NEXT_PUBLIC_API_MINIO="http://<minio-host>:9000/"`
- 启动：`npm run dev`（默认 `http://localhost:3000`）
- 在站点中点击“连接钱包”，确保钱包网络为 `Hardhat Local (31337)`，然后执行上传/购买流程。

## 常见联调与排错
- `eth_sendTransaction Failed to fetch`：钱包网络必须是 `localhost:8545 / chainId 31337`，与前端 `BrowserProvider` 一致；若钱包连接到其他链（如 Sepolia），写交易会失败。
- ABI 不匹配：重新 `npx hardhat compile`，再 `npx hardhat run scripts/deploy.js --network localhost` 更新前端 ABI 与合约地址。
- 切换后端端口或跨域：若前端不在 `http://localhost:3000`，需在后端 CORS 配置中添加对应源。

## README 内容结构
- 项目简介与架构总览（后端 Gin + DAO/Service/Controller；前端 Next.js；支付合约 ethers v6）
- 快速开始（上述四步启动顺序与命令）
- 环境变量说明（前端/后端关键项）
- 合约与前端交互路径（`frontend/contract/contractConnect.ts`、`contexts/TransactionContext.tsx`）
- 常见问题与排错（网络不一致、ABI 更新、CORS）

如果同意，我将创建 README.md 并写入上述结构与命令，确保小白可按文档部署运行。