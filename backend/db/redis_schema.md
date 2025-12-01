# Redis 缓存结构设计

本文档定义了AI数据集平台的Redis缓存结构，用于提高系统性能和用户体验。

## 1. 用户会话缓存

### 用户登录会话
```redis
# Key格式：session:{session_id}
# 类型：Hash
# TTL：24小时 (86400秒)

HSET session:abc123def456 
  user_id 1001
  username "john_doe"
  email "john@example.com"
  role "buyer"
  wallet_address "0x742d35Cc6634C0532925a3b8D4C9db96590c4C5d"
  login_time "2024-03-15T10:30:00Z"
  last_activity "2024-03-15T14:20:00Z"
  ip_address "192.168.1.100"
  user_agent "Mozilla/5.0..."

EXPIRE session:abc123def456 86400
