# "我的数据集"页面重构文档

## 📋 重构概述

将商家"我的数据集"页面从Mock数据切换到真实数据库数据，遵循三层架构模式。

---

## 🏗️ 三层架构实现

### **第一层：API层** (`lib/api/dataset.ts`)

负责与后端接口通信，处理HTTP请求。

```typescript
// 获取指定作者的所有数据集（免费+付费）
export async function getDatasetsByAuthorApi(authorWalletAddress: string, page = 1, limit = 1000) {
  const res = await axios.get(`${BASE_URL}/dataset/list`, {
    params: { 
      author_wallet_address: authorWalletAddress, 
      page, 
      limit 
    },
    withCredentials: true,
  });
  return res.data.data;
}

// 获取作者数据集统计信息
export async function getAuthorDatasetStatsApi(authorWalletAddress: string) {
  const datasetsRes = await axios.get(`${BASE_URL}/dataset/list`, {
    params: { 
      author_wallet_address: authorWalletAddress,
      page: 1,
      limit: 1000
    },
    withCredentials: true,
  });
  
  const datasets = datasetsRes.data.data?.items || [];
  
  // 计算统计数据
  const totalDatasets = datasets.length;
  const totalDownloads = datasets.reduce((sum: number, d: any) => sum + (d.downloadCount || d.download_count || 0), 0);
  const totalRevenue = datasets.reduce((sum: number, d: any) => {
    if (!d.isFree && !d.is_free) {
      return sum + (d.price || 0) * (d.downloadCount || d.download_count || 0);
    }
    return sum;
  }, 0);
  
  return { totalDatasets, totalDownloads, totalRevenue };
}
```

**职责**：
- ✅ 发送HTTP请求
- ✅ 处理响应数据
- ✅ 处理错误
- ✅ 返回标准化数据

---

### **第二层：Context层** (`contexts/AuthContext.tsx`)

业务逻辑层，提供可复用的函数。

```typescript
// 获取作者的所有数据集（需要钱包地址）
export async function getAuthorDatasets(authorWalletAddress: string, page = 1, limit = 1000) {
  const { getDatasetsByAuthorApi } = await import('@/lib/api/dataset');
  return await getDatasetsByAuthorApi(authorWalletAddress, page, limit);
}

// 获取作者数据集统计信息（需要钱包地址）
export async function getAuthorDatasetStats(authorWalletAddress: string) {
  const { getAuthorDatasetStatsApi } = await import('@/lib/api/dataset');
  return await getAuthorDatasetStatsApi(authorWalletAddress);
}
```

**职责**：
- ✅ 封装API调用
- ✅ 提供业务逻辑
- ✅ 统一导出接口
- ✅ 可以在多个页面复用

**注意**：
- 使用 `export` 导出函数，而不是通过Context提供
- 页面通过 `import` 直接导入使用

---

### **第三层：Page层** (`app/my-datasets/page.tsx`)

UI展示层，处理用户交互和数据展示。

```typescript
import { getAuthorDatasets, getAuthorDatasetStats } from "@/contexts/AuthContext"

export default function MyDatasetsPage() {
  const { user } = useAuth()
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [stats, setStats] = useState<DatasetStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 加载用户的数据集
  const loadMyDatasets = async () => {
    if (!user || !user.walletAddress) {
      setError("用户未绑定钱包地址")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await getAuthorDatasets(user.walletAddress, 1, 1000)
      if (result && result.items) {
        const formattedDatasets = result.items.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          category: item.category,
          tags: item.tags ? (typeof item.tags === 'string' ? item.tags.split(',') : item.tags) : [],
          price: item.price || 0,
          isFree: item.isFree || item.is_free || false,
          fileSize: item.fileSize || item.file_size || 0,
          authorWalletAddress: item.authorWalletAddress || item.author_wallet_address || '',
          downloadCount: item.downloadCount || item.download_count || 0,
          license: item.license || '',
          createdAt: item.createdAt || item.created_at || '',
          updatedAt: item.updatedAt || item.updated_at || '',
          objectName: item.objectName || item.object_name || '',
        }))
        setDatasets(formattedDatasets)
      } else {
        setDatasets([])
      }
    } catch (err: any) {
      setError(err.message || "加载数据集失败")
      setDatasets([])
    } finally {
      setLoading(false)
    }
  }

  // 加载统计信息
  const loadStats = async () => {
    if (!user || !user.walletAddress) return

    try {
      const result = await getAuthorDatasetStats(user.walletAddress)
      if (result) {
        setStats(result)
      }
    } catch (err: any) {
      console.error("加载统计信息失败:", err)
    }
  }

  useEffect(() => {
    loadMyDatasets()
    loadStats()
  }, [user])

  // ... UI渲染
}
```

**职责**：
- ✅ 管理组件状态
- ✅ 处理用户交互
- ✅ 数据格式转换（后端→前端）
- ✅ UI渲染
- ✅ 错误处理和显示

---

## 🔄 数据流

```
用户访问页面
    ↓
Page层：useEffect 触发
    ↓
Context层：getAuthorDatasets(walletAddress)
    ↓
API层：axios.get('/dataset/list?author_wallet_address=...')
    ↓
后端：返回数据集列表
    ↓
API层：返回 res.data.data
    ↓
Context层：返回数据
    ↓
Page层：格式化数据 + 更新状态
    ↓
UI：展示数据
```

---

## 🗑️ 删除的Mock代码

### **删除的导入**
```typescript
- import { useDataset } from "@/hooks/useDataset"
```

### **删除的Hook使用**
```typescript
- const { getDatasets, getDatasetStats, deleteDataset, loading, error } = useDataset()
```

### **删除的调用**
```typescript
- const result = await getDatasets({
-   author_id: user.id,
-   limit: 1000,
- })

- const result = await getDatasetStats(user.id)
```

---

## 🆕 新增的类型定义

### **DatasetStats**
```typescript
// frontend/types/index.ts
export interface DatasetStats {
  totalDatasets: number;
  totalDownloads: number;
  totalRevenue: number;
}
```

---

## 🔧 关键变更

### **1. 使用钱包地址查询**

**修改前**：
```typescript
author_id: user.id  // ❌ 使用用户ID
```

**修改后**：
```typescript
author_wallet_address: user.walletAddress  // ✅ 使用钱包地址
```

### **2. 数据格式统一**

后端返回的数据可能是 `snake_case`，前端使用 `camelCase`：

```typescript
const formattedDatasets = result.items.map((item: any) => ({
  fileSize: item.fileSize || item.file_size || 0,
  isFree: item.isFree || item.is_free || false,
  downloadCount: item.downloadCount || item.download_count || 0,
  // ...
}))
```

### **3. 统计数据计算**

前端自己计算统计数据，而不是依赖后端：

```typescript
const totalRevenue = datasets.reduce((sum, d) => {
  if (!d.isFree) {
    return sum + d.price * d.downloadCount;
  }
  return sum;
}, 0);
```

### **4. 删除评分相关代码**

系统没有评分功能，移除了所有评分显示：

```typescript
- <span className="flex items-center gap-1">
-   <Star className="h-3 w-3" />
-   {dataset.rating}
- </span>
```

### **5. 价格单位改为ETH**

```typescript
- {dataset.isFree ? "免费" : `¥${dataset.price}`}
+ {dataset.isFree ? "免费" : `${dataset.price} ETH`}
```

---

## ✅ 测试检查清单

### **功能测试**
- [ ] 页面加载时自动获取数据集列表
- [ ] 统计卡片显示正确的数字
- [ ] 免费/付费筛选功能正常
- [ ] 分页功能正常
- [ ] 数据集卡片显示完整信息
- [ ] 编辑、删除按钮正常工作

### **边界情况**
- [ ] 用户未绑定钱包时显示错误提示
- [ ] 没有数据集时显示空状态
- [ ] 网络错误时显示错误信息
- [ ] 数据格式异常时兼容处理

### **性能测试**
- [ ] 大量数据集（100+）加载正常
- [ ] 筛选和分页响应快速
- [ ] 无内存泄漏

---

## 🎯 优点

### **1. 符合三层架构**
- API层专注网络请求
- Context层提供可复用函数
- Page层只负责UI

### **2. 易于维护**
- 职责清晰
- 层次分明
- 代码复用性高

### **3. 易于测试**
- 每一层可以独立测试
- Mock数据方便
- 错误处理完善

### **4. 类型安全**
- TypeScript类型完整
- 避免运行时错误
- IDE智能提示

---

## 📝 后续改进建议

### **1. 添加缓存**
```typescript
// 避免重复请求
const cache = new Map()
export async function getAuthorDatasets(walletAddress: string) {
  if (cache.has(walletAddress)) {
    return cache.get(walletAddress)
  }
  const result = await getDatasetsByAuthorApi(walletAddress)
  cache.set(walletAddress, result)
  return result
}
```

### **2. 添加轮询**
```typescript
// 定时刷新统计数据
useEffect(() => {
  const interval = setInterval(() => {
    loadStats()
  }, 60000) // 每分钟刷新一次
  return () => clearInterval(interval)
}, [])
```

### **3. 添加乐观更新**
```typescript
// 删除时立即更新UI，不等待后端
const handleDelete = async (datasetId: number) => {
  // 先更新UI
  setDatasets(prev => prev.filter(d => d.id !== datasetId))
  try {
    // 再调用后端
    await deleteDataset(datasetId)
  } catch (err) {
    // 失败时回滚
    loadMyDatasets()
  }
}
```

---

## 🎉 总结

✅ **完成了从Mock数据到真实数据的迁移**  
✅ **遵循了三层架构模式**  
✅ **使用钱包地址而不是用户ID**  
✅ **删除了所有Mock代码痕迹**  
✅ **添加了完善的错误处理**  
✅ **统一了数据格式**  
✅ **移除了不存在的功能（评分）**  

**重构完成！** 🚀

