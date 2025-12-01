package util

// redis
const (
	EMAIL_VERIFY_CODE     = "code:verify"
	CODE_TTLS             = "code:TTL"
	PAID_DOWNLOAD_TASK_ID = "paid_download_task_id"
)

// minio
const (
	DATASET_BUCKET      = "datasets"
	DATASET_TEMP_BUCKET = "datasets_temp"
	USER_AVATAR_BUCKET  = "user_avatars"
)

// user
const (
	USER_PROFILE = "user:profile"
	A            = "a"
)

// dataset
const (
	DATASET_EXTENSION      = ".jsonl"
	DATASET_EXPIRE         = 60
	TOTAL_TASK_COUNT       = 4
	FINGERPRINT_GROUP_SIZE = 6
)

// admin
const (
	USERS_GROWTH_MONTH = 6
)

// home ranks
const (
	RANK_DATASET_HOT    = "rank:dataset:hot"
	RANK_DATASET_LATEST = "rank:dataset:latest"
	RANK_DEFAULT_LIMIT  = 5
)
