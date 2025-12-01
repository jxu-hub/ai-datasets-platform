## 关键点调整
- 默认展示条数使用常量 `RANK_DEFAULT_LIMIT = 5`（可随时改为 10 等），前端逻辑不变，返回多少由后端决定。
- Redis ZSet 成员存最小字段 JSON；热门每 5 分钟批量刷新，最近上传在上传成功后实时写入。

## 实施方案
### 常量
- `internal/util/constant.go`：新增 `RANK_DEFAULT_LIMIT = 5`（可改）。

### MySQL DAO（HomeDAO）
- 新增：`GetTopByDownloads(limit int)`、`GetLatestByCreatedAt(limit int)`。

### Redis DAO（RankRedisDAO）
- 批量刷新：`RefreshHotRank(datasets)`、`RefreshLatestRank(datasets)`（成员为最小字段 JSON；score=下载量/上传时间戳；使用 pipeline）。
- 读取：`GetTopHotJSON(limit)`、`GetTopLatestJSON(limit)`（`ZRevRange` + 反序列化）。

### Service（HomeService）
- 刷新：`RefreshHotRank(limit int)` 与 `RefreshLatestRank(limit int)` 根据传入 `limit`（默认使用 `RANK_DEFAULT_LIMIT`）。
- 查询：`GetHotRank(limit)`、`GetLatestRank(limit)`，limit 来自请求参数，默认使用 `RANK_DEFAULT_LIMIT`；若 Redis 为空则触发一次刷新再返回。

### 上传实时更新（仅最近上传）
- 在 `DatasetService.UploadDataset` 成功后：组装最小字段 JSON，`ZAdd rank:dataset:latest`，score=当前时间戳；可用 `ZRemRangeByRank` 保持容量上限（用常量）。

### 定时任务（5分钟）
- `InitRouter` 中新增 ticker：每 5 分钟执行 `homeService.RefreshHotRank(RANK_DEFAULT_LIMIT)`；
- 可选：同步执行 `RefreshLatestRank(RANK_DEFAULT_LIMIT)` 以防止数据缺失。

### 控制器
- 接口不变；函数体内注释遵循 1./2./3. 与 2.1/2.2。

### 验证
- 完成后执行一次 `go build ./...` 检查编译。