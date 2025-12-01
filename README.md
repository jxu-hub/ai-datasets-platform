# AI 数据集平台

一个支持区块链支付的 AI 数据集交易平台，后端使用 Go + Gin，前端使用 Next.js，支付系统基于 Hardhat 本地链与自定义 Solidity 合约（ethers v6）。本文档面向首次接触本项目的开发者，提供从零到可运行的完整步骤与细节。

## 特性
- 区块链支付：基于 Hardhat 本地链，前端通过 MetaMask 进行链上交易（购买数据集）。
- 数据集全流程：预览上传、分片上传、合并、删除、下载（含付费与鉴权）。
- 排行榜与首页：Redis ZSet 存储热门/最新上传排行榜，公共首页接口无需登录。
- 管理端：异常任务处理（Outbox）、MinIO 桶管理、用户与数据集管理。
- 存储与缓存：MinIO（对象存储）、Redis（缓存与排行榜）、MySQL（业务数据）。

## 技术栈
- 后端：Go 1.23 + Gin、GORM、MongoDB Driver、Redis v8、MinIO SDK、Zap
- 前端：Next.js 15、React 19、TypeScript、Tailwind
- 合约与链：Hardhat、Solidity、ethers v6、MetaMask（BrowserProvider）

## 目录结构（关键路径）
- `backend/`
  - `cmd/main.go` 服务入口
  - `config/config.yaml` 服务配置（端口、DB、Redis、MinIO 等）
  - `internal/router/router.go` 路由注册与定时任务（排行刷新/临时桶清理）
  - `internal/controller/` 控制器层（HTTP）
  - `internal/service/` 服务层（业务逻辑）
  - `internal/dao/mysql|mongo|redis|minio` 数据访问层
  - `internal/util/` 工具（日志、JWT、响应封装、常量）
- `frontend/`
  - `app/` 页面路由与 UI
  - `contexts/` 业务上下文（如 `TransactionContext.tsx`）
  - `lib/api/` API 封装
  - `contract/contractABI/abi.json` 合约 ABI（部署脚本自动写入）
  - `contract/contractConnect.ts` ethers 连接与 `getWritableContract()`
- `hardhat/`
  - `scripts/deploy.js` 部署脚本（写入 ABI 与前端 .env）
  - `contracts/AiDatasets.sol`（位于 `frontend/contract/AiDatasets.sol`，部署脚本读取编译产物）
  - `package.json`、`README.md`、`test/`

## 快速开始
本项目的支付系统基于区块链，Hardhat 是必选。启动顺序如下：

1. 启动 Hardhat 本地节点（必须）
2. 部署合约并写入前端 `.env` 与 ABI
3. 启动后端（假定数据库/MinIO 已可用）
4. 启动前端并用钱包连接到 Hardhat 本地链

### 1) Hardhat 本地链与合约部署
- 进入 Hardhat 项目：
  - `cd hardhat`
  - `npm install`
  - `npx hardhat compile`
- 启动本地链：
  - `npx hardhat node`
  - 本地 RPC：`http://127.0.0.1:8545`，ChainId：`31337`
- 在新终端部署合约（会自动写入前端 ABI 与 .env）：
  - `npx hardhat run scripts/deploy.js --network localhost`
  - 成功后将：
    - 生成 ABI 至 `frontend/contract/contractABI/abi.json`
    - 更新 `frontend/.env` 中：
      - `NEXT_PUBLIC_CONTRACT_ADDRESS=<部署后的合约地址>`
      - `NEXT_PUBLIC_DEPLOYER_ADDRESS=<部署者地址>`
- MetaMask 网络设置：
  - 网络名称：`Hardhat Local`
  - RPC URL：`http://127.0.0.1:8545`
  - Chain ID：`31337`
  - 货币符号：`ETH`
- 导入测试账户：
  - 从 `npx hardhat node` 控制台输出的私钥任意选择一个导入 MetaMask（仅用于本地开发）。

### 2) 后端启动（Go 服务）
- 进入后端：
  - `cd backend`
  - `go mod download`
  - `go run ./cmd`
- 配置文件：`backend/config/config.yaml`（已设置到可用的 DB/Redis/MinIO；无需指导其启动方式，只需保证连通）
- 健康检查：`http://localhost:5000/health`

### 3) 前端启动（Next.js）
- 进入前端：
  - `cd frontend`
  - `npm install`
- 确认 `.env`（部署脚本已更新）：
  - `NEXT_PUBLIC_CONTRACT_ADDRESS=...`
  - `NEXT_PUBLIC_DEPLOYER_ADDRESS=...`
  - `NEXT_PUBLIC_API_BASE="http://localhost:5000/api"`
  - `NEXT_PUBLIC_API_MINIO="http://<minio-host>:9000/"`
- 启动开发模式：
  - `npm run dev`（默认 `http://localhost:3000`）
- 在站点中“连接钱包”：
  - 确保钱包网络为 `Hardhat Local (31337)`，然后执行上传/购买流程。

## 环境变量
- 前端（`frontend/.env`）：
  - `NEXT_PUBLIC_CONTRACT_ADDRESS` 合约地址（部署脚本自动写入）
  - `NEXT_PUBLIC_DEPLOYER_ADDRESS` 部署者地址（自动写入）
  - `NEXT_PUBLIC_API_BASE` 后端 API 基准地址（默认 `http://localhost:5000/api`）
  - `NEXT_PUBLIC_API_MINIO` MinIO 访问基准（如 `http://localhost:9000/`）
- 后端（`backend/config/config.yaml`）：
  - `server.port`、`mysql`、`mongodb`、`redis`、`minio`、`email`（按已有服务地址配置）

## 关键交互路径
- 前端调用链上交易：
  - `frontend/contract/contractConnect.ts`
    - `getProvider()` 返回 `ethers.BrowserProvider`
    - `getWritableContract()` 请求钱包授权，返回带 `Signer` 的合约实例
  - `frontend/contexts/TransactionContext.tsx`
    - `purchaseDataset(datasetId, amount)` 调用合约方法并将交易哈希等信息回填后端
- 后端数据集流程：
  - `internal/controller/dataset.go` 上传/下载/删除接口
  - `internal/service/dataset.go` 分片上传、合并、MinIO 操作
  - `internal/dao/*` MySQL/Mongo/Redis/MinIO 的 DAO 封装

## 常见问题与排错
- `eth_sendTransaction Failed to fetch`
  - 原因：钱包网络与前端 `BrowserProvider` 不一致或本地 RPC 不可达。
  - 处理：将钱包切换到 `http://127.0.0.1:8545`（ChainId 31337），确保 Hardhat 节点处于运行状态。
- ABI 不匹配或合约地址错误
  - 处理：重新编译合约 `npx hardhat compile` 并重新部署 `npx hardhat run scripts/deploy.js --network localhost`，该脚本会更新前端 ABI 与 `.env`。
- CORS 或跨源访问
  - 若前端不在 `http://localhost:3000`，需在后端跨域配置中添加对应源（见 `cmd/main.go` 中 CORS 设置）。
- Next.js 构建缓存异常
  - 清理 `.next` 目录后重试；或删除 `.next/cache` 文件锁。

## 生产与测试网说明（扩展）
- 本地开发使用 Hardhat 节点；迁移到测试网（如 Sepolia）时：
  - 在 Hardhat 配置网络并使用部署私钥；
  - 部署完成后将 `NEXT_PUBLIC_CONTRACT_ADDRESS` 改为测试网地址；
  - 前端钱包网络需切到同一链；
  - 后端无需变更区块链配置（链上交付由前端/钱包完成）。

## 许可
本项目仅用于学习与毕业设计演示，生产使用请评估安全性、风控与合规。
