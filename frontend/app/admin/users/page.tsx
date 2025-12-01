"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { RoleGuard } from "@/components/guards/RoleGuard"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { getUsers, getUserDetail, updateUser, deleteUser, addUser } from "@/contexts/AdminContext"
import type { User, PaginatedResponse, UserStats } from "@/types"
import { Search, Eye, Users, Calendar, Download, Upload, Wallet, Loader2, Edit, Trash2, Mail, ArrowUpDown, ArrowUp, ArrowDown, X, CalendarIcon, ShoppingCart, Database } from 'lucide-react'
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

export default function AdminUsersPage() {
  const { user } = useAuth()
  const [allUsers, setAllUsers] = useState<User[]>([]) // 存储所有用户数据
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]) // 存储筛选后的用户
  const [paginatedUsers, setPaginatedUsers] = useState<User[]>([]) // 当前页显示的用户
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedUserStats, setSelectedUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeSearchQuery, setActiveSearchQuery] = useState("") // 实际用于筛选的搜索词
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [walletFilter, setWalletFilter] = useState<string>("all") // 钱包绑定状态筛选
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({ username: "", email: "", walletAddress: "" })
  const [addForm, setAddForm] = useState({ username: "", email: "", password: "" })

  const apiMinio = process.env.NEXT_PUBLIC_API_MINIO as string

  // 初始加载所有用户数据
  const loadAllUsers = async () => {
    setLoading(true)
    setError("")

    try {
      console.log("加载所有用户数据...")
      const response = await getUsers({
        page: 1,
        limit: 1000, 
      })

      setAllUsers(response.items)
      console.log(`成功加载 ${response.items.length} 个用户`)
    } catch (err: any) {
      console.error("加载用户列表失败:", err)
      setError(err.message || "加载用户列表失败")
      toast.error(err.message || "加载用户列表失败")
    } finally {
      setLoading(false)
    }
  }

  // 前端筛选和排序逻辑
  const filterAndSortUsers = () => {
    let filtered = [...allUsers]

    // 1. 搜索筛选（用户名或邮箱）- 使用 activeSearchQuery 而不是 searchQuery
    if (activeSearchQuery.trim()) {
      const query = activeSearchQuery.toLowerCase()
      filtered = filtered.filter(
        (u) =>
          u.username.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query)
      )
    }

    // 2. 角色筛选
    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => u.role === roleFilter)
    }

    // 3. 钱包绑定状态筛选
    if (walletFilter !== "all") {
      if (walletFilter === "bound") {
        // 已绑定钱包：walletAddress 不为 null 且不为空字符串
        filtered = filtered.filter((u) => u.walletAddress && u.walletAddress.trim() !== "")
      } else if (walletFilter === "unbound") {
        // 未绑定钱包：walletAddress 为 null 或为空字符串
        filtered = filtered.filter((u) => !u.walletAddress || u.walletAddress.trim() === "")
      }
    }

    // 4. 时间范围筛选（开始日期和结束日期）
    if (startDate || endDate) {
      filtered = filtered.filter((u) => {
        if (!u.created_at) return false
        const createdDate = new Date(u.created_at)
        
        // 如果有开始日期，检查是否在开始日期之后
        if (startDate) {
          const start = new Date(startDate)
          start.setHours(0, 0, 0, 0)
          if (createdDate < start) return false
        }
        
        // 如果有结束日期，检查是否在结束日期之前
        if (endDate) {
          const end = new Date(endDate)
          end.setHours(23, 59, 59, 999)
          if (createdDate > end) return false
        }
        
        return true
      })
    }

    // 5. 排序
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime()
      const dateB = new Date(b.created_at || 0).getTime()
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB
    })

    setFilteredUsers(filtered)

    // 5. 计算总页数
    const pages = Math.ceil(filtered.length / pageSize)
    setTotalPages(pages)

    // 6. 如果当前页超出范围，重置到第一页
    if (currentPage > pages && pages > 0) {
      setCurrentPage(1)
    }
  }

  // 分页逻辑
  const paginateUsers = () => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    setPaginatedUsers(filteredUsers.slice(startIndex, endIndex))
  }

  const loadUserDetail = async (userId: number) => {
    setDetailLoading(true)

    try {
      console.log("加载用户详情:", userId)
      const { user: userData, stats } = await getUserDetail(userId)
      setSelectedUser(userData)
      setSelectedUserStats(stats)
    } catch (err: any) {
      console.error("加载用户详情失败:", err)
      setError(err.message || "加载用户详情失败")
      toast.error(err.message || "加载用户详情失败")
    } finally {
      setDetailLoading(false)
    }
  }

  const handleEditClick = (user: User) => {
    setEditingUser(user)
    setEditForm({
      username: user.username,
      email: user.email,
      walletAddress: user.walletAddress || "",
    })
    setEditDialogOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!editingUser) return

    try {
      await updateUser(editingUser.id, {
        username: editForm.username,
        email: editForm.email,
        walletAddress: editForm.walletAddress || undefined,
      })
      toast.success("用户信息更新成功")
      setEditDialogOpen(false)
      setEditingUser(null)
      loadAllUsers() // 重新加载所有用户
    } catch (err: any) {
      console.error("更新用户信息失败:", err)
      toast.error(err.message || "更新用户信息失败")
    }
  }

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return

    try {
      await deleteUser(selectedUser.id)
      toast.success("用户删除成功")
      setDeleteDialogOpen(false)
      setSelectedUser(null)
      loadAllUsers() // 重新加载所有用户
    } catch (err: any) {
      console.error("删除用户失败:", err)
      toast.error(err.message || "删除用户失败")
    }
  }

  const handleAddUser = async () => {
    if (!addForm.username || !addForm.email || !addForm.password) {
      toast.error("请填写完整信息")
      return
    }

    try {
      await addUser(addForm)
      toast.success("用户添加成功")
      setAddDialogOpen(false)
      setAddForm({ username: "", email: "", password: "" })
      loadAllUsers() // 重新加载所有用户
    } catch (err: any) {
      console.error("添加用户失败:", err)
      toast.error(err.message || "添加用户失败")
    }
  }

  const handleSearch = () => {
    setActiveSearchQuery(searchQuery) // 点击搜索按钮时才应用搜索词
    setCurrentPage(1)
  }

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value)
    setCurrentPage(1)
  }

  const handleWalletFilterChange = (value: string) => {
    setWalletFilter(value)
    setCurrentPage(1)
  }

  const handleDateRangeChange = (start: Date | undefined, end: Date | undefined) => {
    setStartDate(start)
    setEndDate(end)
    setCurrentPage(1)
  }

  const handleSortToggle = () => {
    const newSort = sortOrder === "desc" ? "asc" : "desc"
    setSortOrder(newSort)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      user: { label: "普通用户", variant: "secondary" as const },
      seller: { label: "商家", variant: "default" as const },
      admin: { label: "管理员", variant: "outline" as const },
    }

    const config = roleConfig[role as keyof typeof roleConfig] || { label: role, variant: "secondary" as const }

    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // 初始加载所有用户
  useEffect(() => {
    loadAllUsers()
  }, [])

  // 当筛选条件或排序改变时，重新筛选（使用 activeSearchQuery 而不是 searchQuery）
  useEffect(() => {
    if (allUsers.length > 0) {
      filterAndSortUsers()
    }
  }, [allUsers, activeSearchQuery, roleFilter, walletFilter, startDate, endDate, sortOrder])

  // 当筛选结果或当前页改变时，更新分页
  useEffect(() => {
    paginateUsers()
  }, [filteredUsers, currentPage])

  return (
    <RoleGuard requiredRole="admin">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <PageHeader title="用户管理" description="查看和管理平台用户信息" />

        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-8 space-y-6">
          {/* Search and Filter Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                搜索和筛选
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="搜索用户名或邮箱..."
                      value={searchQuery}
                      onChange={(e) => {
                        const value = e.target.value
                        setSearchQuery(value)
                        // 如果输入框被清空，立即清除搜索筛选
                        if (value.trim() === "" && activeSearchQuery !== "") {
                          setActiveSearchQuery("")
                          setCurrentPage(1)
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSearch()
                        }
                      }}
                    />
                    {/* 清除按钮 */}
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => {
                          setSearchQuery("")
                          setActiveSearchQuery("")
                          setCurrentPage(1)
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {/* 开始日期选择器 */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full md:w-[200px] justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "yyyy年MM月dd日", { locale: zhCN }) : "开始日期"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => handleDateRangeChange(date, endDate)}
                        locale={zhCN}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  {/* 结束日期选择器 */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full md:w-[200px] justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "yyyy年MM月dd日", { locale: zhCN }) : "结束日期"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => handleDateRangeChange(startDate, date)}
                        locale={zhCN}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  {/* 清除日期筛选按钮 */}
                  {(startDate || endDate) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDateRangeChange(undefined, undefined)}
                      className="h-10"
                    >
                      <X className="h-4 w-4 mr-1" />
                      清除日期
                    </Button>
                  )}
                  <Button onClick={handleSearch} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    搜索
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    用户列表
                    <Badge variant="outline" className="ml-2">
                      共 {filteredUsers.length} 个用户
                    </Badge>
                  </CardTitle>
                  <CardDescription>平台所有用户的基本信息和统计数据</CardDescription>
                </div>
                <Button onClick={() => setAddDialogOpen(true)}>
                  添加用户
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">加载用户列表...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>用户</TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            角色
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0"
                                  title="筛选角色"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                                  </svg>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-40" align="start">
                                <div className="space-y-2">
                                  <button
                                    className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent ${roleFilter === "all" ? "bg-accent" : ""}`}
                                    onClick={() => handleRoleFilterChange("all")}
                                  >
                                    所有角色
                                  </button>
                                  <button
                                    className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent ${roleFilter === "user" ? "bg-accent" : ""}`}
                                    onClick={() => handleRoleFilterChange("user")}
                                  >
                                    普通用户
                                  </button>
                                  <button
                                    className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent ${roleFilter === "seller" ? "bg-accent" : ""}`}
                                    onClick={() => handleRoleFilterChange("seller")}
                                  >
                                    商家
                                  </button>
                                  <button
                                    className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent ${roleFilter === "admin" ? "bg-accent" : ""}`}
                                    onClick={() => handleRoleFilterChange("admin")}
                                  >
                                    管理员
                                  </button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            钱包
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0"
                                  title="筛选钱包状态"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                                  </svg>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-40" align="start">
                                <div className="space-y-2">
                                  <button
                                    className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent ${walletFilter === "all" ? "bg-accent" : ""}`}
                                    onClick={() => handleWalletFilterChange("all")}
                                  >
                                    全部钱包
                                  </button>
                                  <button
                                    className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent ${walletFilter === "bound" ? "bg-accent" : ""}`}
                                    onClick={() => handleWalletFilterChange("bound")}
                                  >
                                    已绑定
                                  </button>
                                  <button
                                    className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent ${walletFilter === "unbound" ? "bg-accent" : ""}`}
                                    onClick={() => handleWalletFilterChange("unbound")}
                                  >
                                    未绑定
                                  </button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            注册时间
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0"
                              onClick={handleSortToggle}
                              title={sortOrder === "desc" ? "当前降序，点击切换为升序" : "当前升序，点击切换为降序"}
                            >
                              <ArrowUpDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedUsers.length > 0 ? (
                        paginatedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={apiMinio + user.avatarUrl || "/placeholder.svg"} alt={user.username} />
                                <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{user.username}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell>
                            {user.walletAddress ? (
                              <div className="flex items-center gap-1">
                                <Wallet className="h-4 w-4 text-green-600" />
                                <span className="text-xs text-green-600">已绑定</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Wallet className="h-4 w-4 text-gray-400" />
                                <span className="text-xs text-muted-foreground">未绑定</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(user.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {/* 查看详情按钮 */}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => loadUserDetail(user.id)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>用户详情</DialogTitle>
                                    <DialogDescription>查看用户的详细信息</DialogDescription>
                                  </DialogHeader>

                                  {detailLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                      <Loader2 className="h-6 w-6 animate-spin" />
                                      <span className="ml-2">加载用户详情...</span>
                                    </div>
                                   ) : selectedUser ? (
                                     <div className="space-y-6">
                                       {/* 基本信息 */}
                                       <div className="grid grid-cols-2 gap-4">
                                         <div>
                                           <label className="text-sm font-medium text-muted-foreground">用户名</label>
                                           <p className="text-sm mt-1">{selectedUser.username}</p>
                                         </div>
                                         <div>
                                           <label className="text-sm font-medium text-muted-foreground">角色</label>
                                           <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
                                         </div>
                                         <div className="col-span-2">
                                           <label className="text-sm font-medium text-muted-foreground">邮箱</label>
                                           <p className="text-sm mt-1 flex items-center gap-1">
                                             <Mail className="h-3 w-3" />
                                             {selectedUser.email}
                                           </p>
                                         </div>
                                         <div>
                                           <label className="text-sm font-medium text-muted-foreground">注册时间</label>
                                           <p className="text-sm mt-1">{formatDate(selectedUser.created_at)}</p>
                                         </div>
                                       </div>

                                       {/* 钱包信息 */}
                                       {selectedUser.walletAddress && (
                                         <div>
                                           <label className="text-sm font-medium text-muted-foreground mb-2 block">钱包地址</label>
                                           <div className="bg-muted px-3 py-2 rounded-md">
                                             <code className="text-xs break-all">
                                               {selectedUser.walletAddress}
                                             </code>
                                           </div>
                                         </div>
                                       )}

                                       {/* 统计信息 - 根据角色显示不同布局 */}
                                       {selectedUserStats && selectedUser.role !== "admin" && (
                                         <div>
                                           <label className="text-sm font-medium text-muted-foreground mb-3 block">统计数据</label>
                                           <div className={`grid gap-3 ${selectedUser.role === "seller" ? "grid-cols-4" : "grid-cols-3"}`}>
                                             {/* 总消费 - 所有角色都显示 */}
                                             <Card>
                                               <CardContent className="py-3 px-3">
                                                 <div className="flex flex-col gap-2">
                                                   <div className="flex items-center gap-2">
                                                     <ShoppingCart className="h-4 w-4 text-green-600" />
                                                     <span className="text-xs font-medium text-muted-foreground">总消费</span>
                                                   </div>
                                                   <p className="text-base font-bold">{selectedUserStats?.total_spent?.toFixed(2) ?? "0.00"} ETH</p>
                                                 </div>
                                               </CardContent>
                                             </Card>

                                             {/* 已上传 - 只有商家显示 */}
                                             {selectedUser.role === "seller" && (
                                               <Card>
                                                 <CardContent className="py-3 px-3">
                                                   <div className="flex flex-col gap-2">
                                                     <div className="flex items-center gap-2">
                                                       <Database className="h-4 w-4 text-blue-600" />
                                                       <span className="text-xs font-medium text-muted-foreground">已上传</span>
                                                     </div>
                                                     <p className="text-base font-bold">{selectedUserStats?.total_uploads ?? 0}</p>
                                                   </div>
                                                 </CardContent>
                                               </Card>
                                             )}

                                             {/* 已购买 - 所有角色都显示 */}
                                             <Card>
                                               <CardContent className="py-3 px-3">
                                                 <div className="flex flex-col gap-2">
                                                   <div className="flex items-center gap-2">
                                                     <ShoppingCart className="h-4 w-4 text-purple-600" />
                                                     <span className="text-xs font-medium text-muted-foreground">已购买</span>
                                                   </div>
                                                   <p className="text-base font-bold">{selectedUserStats?.total_purchases ?? 0}</p>
                                                 </div>
                                               </CardContent>
                                             </Card>

                                             {/* 已下载 - 所有角色都显示 */}
                                             <Card>
                                               <CardContent className="py-3 px-3">
                                                 <div className="flex flex-col gap-2">
                                                   <div className="flex items-center gap-2">
                                                     <Download className="h-4 w-4 text-orange-600" />
                                                     <span className="text-xs font-medium text-muted-foreground">已下载</span>
                                                   </div>
                                                   <p className="text-base font-bold">{selectedUserStats?.total_downloads ?? 0}</p>
                                                 </div>
                                               </CardContent>
                                             </Card>
                                           </div>
                                         </div>
                                       )}
                                     </div>
                                   ) : null}
                                </DialogContent>
                              </Dialog>

                              {/* 编辑按钮 */}
                              <Button variant="outline" size="sm" onClick={() => handleEditClick(user)}>
                                <Edit className="h-4 w-4" />
                              </Button>

                              {/* 删除按钮 */}
                              <Button variant="outline" size="sm" onClick={() => handleDeleteClick(user)} className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12">
                            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">
                              {activeSearchQuery || roleFilter !== "all" || walletFilter !== "all" || startDate || endDate
                                ? "没有找到符合条件的用户"
                                : "暂无用户数据"}
                            </p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {paginatedUsers.length > 0 && totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        显示第 {(currentPage - 1) * pageSize + 1} -{" "}
                        {Math.min(currentPage * pageSize, filteredUsers.length)} 条， 共 {filteredUsers.length} 条记录
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage <= 1}
                          onClick={() => handlePageChange(currentPage - 1)}
                        >
                          上一页
                        </Button>
                        <span className="text-sm">
                          第 {currentPage} / {totalPages} 页
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage >= totalPages}
                          onClick={() => handlePageChange(currentPage + 1)}
                        >
                          下一页
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 编辑用户对话框 */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>编辑用户信息</DialogTitle>
              <DialogDescription>修改用户的基本信息</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-username">用户名</Label>
                <Input
                  id="edit-username"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">邮箱</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-wallet">钱包地址</Label>
                <Input
                  id="edit-wallet"
                  placeholder="0x..."
                  value={editForm.walletAddress}
                  onChange={(e) => setEditForm({ ...editForm, walletAddress: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>取消</Button>
              <Button onClick={handleEditSubmit}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 添加用户对话框 */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加用户</DialogTitle>
              <DialogDescription>创建一个新用户账户</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="add-username">用户名</Label>
                <Input
                  id="add-username"
                  placeholder="请输入用户名"
                  value={addForm.username}
                  onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="add-email">邮箱</Label>
                <Input
                  id="add-email"
                  type="email"
                  placeholder="请输入邮箱"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="add-password">密码</Label>
                <Input
                  id="add-password"
                  type="password"
                  placeholder="请输入密码"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>取消</Button>
              <Button onClick={handleAddUser}>添加</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 删除确认对话框 */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>确认删除</DialogTitle>
              <DialogDescription>
                确定要删除用户 <strong>{selectedUser?.username}</strong> 吗？此操作不可撤销。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>取消</Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>删除</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  )
}
