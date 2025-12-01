## 目标

* 用真实数据库数据替换首页 Mock。

* 新增首页排行榜：热门（score=下载量）、最近上传（score=上传时间）。

* 首页接口为公共路由，无需登录。

* 前端调用分层：`app/page.tsx → contexts → lib/api`。

* 后端注释按函数体内分点格式 `1. / 2. / 3.`，分支 `2.1 / 2.2`。

## 后端改造（全部新增，解耦AdminDAO）

### 新增 Redis 排行常量

* 文件：`internal/util/constant.go`

* 常量：

  * `RANK_DATASET_HOT = "rank:dataset:hot"`

  * `RANK_DATASET_LATEST = "rank:dataset:latest"`

### 新增 RankRedisDAO（ZSet 封装）

* 文件：`internal/dao/redis/rank.go`

* 方法：

  * `ZAddHot(datasetID uint, score int64)`；`ZIncrHot(datasetID uint, inc int64)`；`GetTopHot(limit int) ([]uint, error)`

  * `ZAddLatest(datasetID uint, ts int64)`；`GetTopLatest(limit int) ([]uint, error)`

* 使用 `ZADD`/`ZINCRBY`/`ZREVRANGE`，成员为 `datasetID` 的字符串。

### 新增 HomeDAO（MySQL，只用于首页）

* 文件：`internal/dao/mysql/home.go`

* 方法：

  * `GetPlatformStats() (totalUsers, totalDatasets, totalTransactions int, err error)`

  * `GetDatasetsByIDs(ids []uint) ([]model.DatasetListResponse, error)`（批量查询首页展示所需字段）

### 新增 HomeService

* 文件：`internal/service/home.go`

* 方法（函数体内按要求添加分点注释）：

  * `GetPlatformStats()`：聚合 MySQL 计数并返回 `{ total_users, total_datasets, total_transactions }`。

  * `GetHotRank(limit int)`：

    * <br />

      1. 从 Redis 读取 topN datasetIDs。

    * <br />

      1. 批量回表 MySQL 获取数据集详情。

    * <br />

      1. 组装返回。

  * `GetLatestRank(limit int)`：同上，但读 `latest` zset。

### 新增 HomeController（公共路由）

* 文件：`internal/controller/home.go`

* 接口（函数体加分点注释）：

  * `GET /api/home/stats` → `GetPlatformStats`（公共路由）

  * `GET /api/home/rank/hot?limit=10` → `GetHotRank`（公共路由）

  * `GET /api/home/rank/latest?limit=10` → `GetLatestRank`（公共路由）

### 路由注册（公共、无鉴权）

* 文件：`internal/router/router.go`

* 新增 `SetupHomeRouter(api, homeController)`，不要使用 `AuthMiddleware()`；路径前缀 `/home`。

### 排行榜写入时机（业务闭环）

* 文件：`internal/service/dataset.go`

* 在以下业务点写入/更新 ZSet（函数体按分点注释）：

  * 上传数据集成功后（`UploadDataset` 返回 ID 后）：`ZAddLatest(datasetID, createdAt.Unix())`。

  * 下载成功（`GetDownloadURL` 免费下载 / `DownloadPaidDataset` 付费下载成功后）：`ZIncrHot(datasetID, 1)`。

## 前端改造

### 新增 API 层

* 文件：`frontend/lib/api/home.ts`

* 方法：

  * `getHomeStatsApi()`：`GET /home/stats` → `{ total_datasets, total_users, total_transactions }`

  * `getHotRankApi(limit=10)`：`GET /home/rank/hot` → `Dataset[]`

  * `getLatestRankApi(limit=10)`：`GET /home/rank/latest` → `Dataset[]`

### 新增 Context 层

* 文件：`frontend/contexts/HomeContext.tsx`

* 暴露：`getHomeStats()`, `getHotRank(limit)`, `getLatestRank(limit)`；内部调用 `lib/api`，做轻量字段映射（snake/camel）。

### 首页替换数据源

* 文件：`frontend/app/page.tsx`

* 移除 Mock 常量，使用 `HomeContext` 获取：平台统计、热门、最近上传，驱动现有 UI。

## 数据结构与兼容

* 使用现有 `model.DatasetListResponse` 字段映射到前端 `types.Dataset`。

* 若后端返回下划线命名，Context 做统一映射。

## 注释规范

* 所有新增后端函数在函数体内添加分点注释，遇到判断分支使用 `x.y`。

* 不在函数外集中写注释。

## 编译验证

* 完成改造后使用一条命令进行编译检查：

  * 后端：`go build ./...`

## 不做的事

* 不复用 `AdminDAO`；全部首页数据访问通过新增 `HomeDAO`。

* 不提供启动服务器的命令或指导，专注代码实现与编译校验。

