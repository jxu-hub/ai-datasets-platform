"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth, getUserStats } from "@/contexts/AuthContext"
import { useRole } from "@/hooks/useRole"
import { RoleGuard } from "@/components/guards/RoleGuard"
import { PageHeader } from "@/components/layout/PageHeader"
import { WalletConnect } from "@/components/wallet/WalletConnect"
import type { UserStats } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Mail,
  Calendar,
  Star,
  Upload,
  Download,
  Wallet,
  Settings,
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle,
  Loader2,
  PieChart as PieChartIcon,
  Download as DownloadIcon,
  ShoppingCart,
  ArrowRight,
} from "lucide-react"
import { getWritableContract } from '@/contract/contractConnect'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ResetPasswordForm, UserUpdate } from "@/types"
import { useWallet } from '@/contexts/WalletContext'

export default function ProfilePage() {
  const { user, updateUser, upgradeToSeller, logout, resetPassword, sendVerificationCode, checkWalletBind, downgradeToUser } = useAuth()
  const { getRoleDisplayName, isUser, isSeller, isAdmin } = useRole()
  const { verifyWalletAddress, wallet } = useWallet()
  const router = useRouter()

  const apiMinio = process.env.NEXT_PUBLIC_API_MINIO as string

  // 用户统计数据本地状态
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
    avatarUrl: user?.avatarUrl || "",
    avatarPreview: user?.avatarUrl ? apiMinio + user.avatarUrl : ""
  })
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [editSuccess, setEditSuccess] = useState("")

  // 修改密码弹窗相关状态
  const [changePwdOpen, setChangePwdOpen] = useState(false)
  const [pwdForm, setPwdForm] = useState<ResetPasswordForm>({
    email: user?.email || "",
    verificationCode: "",
    newPassword: "",
  })
  const [pwdLoading, setPwdLoading] = useState(false)

  const [walletBound, setWalletBound] = useState(true);
  const [isUpgradeBtnHovered, setIsUpgradeBtnHovered] = useState(false);
  const [walletConsistent, setWalletConsistent] = useState(true);

  // 页面加载时获取用户统计数据
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user) return;
      
      setStatsLoading(true);
      try {
        const stats = await getUserStats();
        setUserStats(stats);
      } catch (error) {
        console.error("获取用户统计数据失败:", error);
        toast.error("获取统计数据失败");
      } finally {
        setStatsLoading(false);
      }
    };

    fetchUserStats();
  }, [user?.id]);

  const handlePwdChange = (field: keyof ResetPasswordForm, value: string) => {
    setPwdForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSendCode = async () => {
    if (!pwdForm.email) return toast.error("请先填写邮箱")
    const res = await sendVerificationCode(pwdForm.email)
    if (res.success) {
      toast.success(res.msg)
    } else {
      toast.error(res.msg)
    }
  }

  const handlePwdSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwdLoading(true)
    try {
      const res = await resetPassword(pwdForm)
      if (res.success) {
        toast.success("密码修改成功，请重新登录")
        setChangePwdOpen(false)
        logout()
        router.push("/login")
      } else {
        toast.error(res.error || "密码修改失败")
      }
    } catch (err) {
      toast.error("网络错误，请稍后重试")
    } finally {
      setPwdLoading(false)
    }
  }

  // 处理个人信息编辑
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditErrors({})
    setEditSuccess("")

    // 简单验证
    const errors: Record<string, string> = {}
    if (!editForm.username.trim()) {
      errors.username = "用户名不能为空"
    }
    if (!editForm.email.trim()) {
      errors.email = "邮箱不能为空"
    } else if (!/\S+@\S+\.\S+/.test(editForm.email)) {
      errors.email = "请输入有效的邮箱地址"
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors)
      return
    }

    try {
      const updatedUser: UserUpdate = {
        username: editForm.username,
        email: editForm.email,
        avatarUrl: editForm.avatarUrl,
      };
      const res: any = await updateUser(updatedUser);
      if (res && res.success) {
        toast.success("个人信息更新成功");
        setIsEditing(false);
      } else {
        toast.error(res?.error || "更新失败，请稍后重试");
      }

    } catch (error) {
      toast.error("更新失败，请稍后重试")
    }
  }

  // 处理角色升级
  const handleRoleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      // 1. 先后端升级
      const res = await upgradeToSeller();
      if (!res.success) {
        toast.error(res.error || '后端升级失败');
        setIsUpgrading(false);
        return;
      }
      // 2. 再链上升级
      try {
        const writableContract = await getWritableContract();
        const tx = await writableContract.upgradeToSeller();
        await tx.wait();
        toast.success('升级为商家成功，请重新登录！');
        setUpgradeDialogOpen(false);
        // 自动登出并跳转首页
        await logout();
        router.push("/");
        return;
      } catch (error: any) {
        // 3. 链上失败，回滚后端
        await downgradeToUser();
        console.error('链上升级失败，已回滚为普通用户', error);
        toast.error('链上升级失败，已回滚为普通用户');
      }
    } catch (error: any) {
      toast.error('升级失败: ' + (error?.reason || error?.message || '链上操作失败'));
    } finally {
      setIsUpgrading(false);
    }
  };

  // 监听升级模态框打开时检查钱包绑定和钱包一致性
  useEffect(() => {
    if (upgradeDialogOpen) {
      checkWalletBind().then(res => setWalletBound(res.bound));
      
      // 检查钱包地址一致性
      if (user?.walletAddress && wallet.address) {
        const isConsistent = user.walletAddress.toLowerCase() === wallet.address.toLowerCase();
        setWalletConsistent(isConsistent);
      } else {
        setWalletConsistent(true); // 如果没有绑定钱包或没有连接钱包，则不进行一致性检查
      }
    }
  }, [upgradeDialogOpen, user?.walletAddress, wallet.address]);

  if (!user) {
    return (
      <RoleGuard requireAuth>
        <div>Loading...</div>
      </RoleGuard>
    )
  }

  return (
    <RoleGuard requireAuth>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <PageHeader title="个人中心" description="管理您的账户信息和平台设置" />

        <div className="mt-8">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className={`grid w-full ${isAdmin() ? 'grid-cols-2' : 'grid-cols-3'}`}>
              <TabsTrigger value="profile">个人信息</TabsTrigger>
              {!isAdmin() && <TabsTrigger value="wallet">钱包管理</TabsTrigger>}
              <TabsTrigger value="settings">账户设置</TabsTrigger>
            </TabsList>

            {/* 个人信息标签页 */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>基本信息</CardTitle>
                      <CardDescription>查看和编辑您的个人资料</CardDescription>
                    </div>
                    <Button
                      variant={isEditing ? "outline" : "default"}
                      onClick={() => {
                        if (isEditing) {
                          setEditForm({
                            username: user.username,
                            email: user.email,
                            avatarUrl: user.avatarUrl || "",
                            avatarPreview: user.avatarUrl ? apiMinio + user.avatarUrl : ""
                          })
                          setEditErrors({})
                          setEditSuccess("")
                        }
                        setIsEditing(!isEditing)
                      }}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      {isEditing ? "取消编辑" : "编辑资料"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* 成功提示改为 toast，不再页面内显示 */}
                  {/* {editSuccess && (
                    <Alert className="mb-4">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>{editSuccess}</AlertDescription>
                    </Alert>
                  )} */}

                  {editErrors.general && (
                    <div className="alert alert-destructive mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{editErrors.general}</span>
                    </div>
                  )}

                  {isEditing ? (
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="username">用户名</Label>
                          <Input
                            id="username"
                            value={editForm.username}
                            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                            className={editErrors.username ? "border-destructive" : ""}
                          />
                          {editErrors.username && <p className="text-sm text-destructive">{editErrors.username}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">邮箱</Label>
                          <Input
                            id="email"
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            className={editErrors.email ? "border-destructive" : ""}
                          />
                          {editErrors.email && <p className="text-sm text-destructive">{editErrors.email}</p>}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="avatar">头像</Label>
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={editForm.avatarPreview || (typeof editForm.avatarUrl === 'string' ? (apiMinio + editForm.avatarUrl) : undefined) || "/placeholder.svg"} alt="头像预览" />
                            <AvatarFallback>{editForm.username.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-2">
                            <Input
                              id="avatar"
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const previewUrl = URL.createObjectURL(file);
                                  setEditForm((prev) => ({ ...prev, avatarUrl: file as any, avatarPreview: previewUrl }));
                                }
                              }}
                            />
                            <p className="text-xs text-muted-foreground">支持 JPG、PNG 格式，建议尺寸 200x200px</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit">保存更改</Button>
                        <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                          取消
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={user.avatarUrl ? (apiMinio + user.avatarUrl) : "/placeholder.svg"} alt={user.username} />
                          <AvatarFallback className="text-lg">{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2"> 
                            <h3 className="text-2xl font-semibold">{user.username}</h3>
                            <Badge variant="outline">{getRoleDisplayName()}</Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Mail className="h-4 w-4" />
                              <span>{user.email}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>加入于 {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {!isAdmin() && (
                          <>
                            <div className="text-center">
                              <div className="flex items-center justify-center space-x-1 text-2xl font-bold">
                                <Wallet className="h-6 w-6 text-yellow-500" />
                                <span>{statsLoading ? "..." : (userStats?.total_spent?.toFixed(2) || 0)} ETH</span>
                              </div>
                              <p className="text-sm text-muted-foreground">已消费金额</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center space-x-1 text-2xl font-bold">
                                {isSeller() ? (
                                  <Upload className="h-6 w-6 text-blue-500" />
                                ) : (
                                  <Download className="h-6 w-6 text-blue-500" />
                                )}
                                <span>{statsLoading ? "..." : (isSeller() ? userStats?.total_uploads : userStats?.total_purchases || 0)}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {isSeller() ? "您已上传的数据集数量" : "已购买数据集"}
                              </p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center space-x-1 text-2xl font-bold">
                                <Download className="h-6 w-6 text-green-500" />
                                <span>{statsLoading ? "..." : (userStats?.total_downloads || 0)}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">下载数据集</p>
                            </div>
                          </>
                        )}
                        {isAdmin() && (
                          <>
                            <div className="text-center">
                              <div className="flex items-center justify-center space-x-1 text-2xl font-bold">
                                <Shield className="h-6 w-6 text-blue-500" />
                                <span>管理员</span>
                              </div>
                              <p className="text-sm text-muted-foreground">系统管理权限</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center space-x-1 text-2xl font-bold">
                                <CheckCircle className="h-6 w-6 text-green-500" />
                                <span>正常</span>
                              </div>
                              <p className="text-sm text-muted-foreground">系统状态</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center space-x-1 text-2xl font-bold">
                                <TrendingUp className="h-6 w-6 text-purple-500" />
                                <span>活跃</span>
                              </div>
                              <p className="text-sm text-muted-foreground">管理状态</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 角色升级卡片 - 仅普通用户可见 */}
              {isUser() && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>成为商家</span>
                    </CardTitle>
                    <CardDescription>升级为商家，开始上传和销售您的数据集</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <h4 className="font-medium">商家权限：</h4>
                          <ul className="space-y-1 text-muted-foreground">
                            <li>• 上传和发布数据集</li>
                            <li>• 设置数据集价格</li>
                            <li>• 查看销售统计</li>
                            <li>• 管理数据集分类</li>
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-medium">注意事项：</h4>
                          <ul className="space-y-1 text-muted-foreground">
                            <li>• 升级后需要重新登录</li>
                            <li>• 保留所有普通用户权限</li>
                            <li>• 可以继续购买数据集</li>
                            <li>• 升级过程不可逆</li>
                            <li>• 已绑定的钱包将保持绑定状态</li>
                          </ul>
                        </div>
                      </div>

                      {editErrors.upgrade && (
                        <div className="alert alert-destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <span>{editErrors.upgrade}</span>
                        </div>
                      )}

                      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="w-full md:w-auto">
                            <TrendingUp className="mr-2 h-4 w-4" />
                            成为商家
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>确认升级为商家</DialogTitle>
                            <DialogDescription>
                              升级后您将获得上传和销售数据集的权限。升级成功后需要重新登录以获得完整权限。
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setUpgradeDialogOpen(false)}
                              disabled={isUpgrading}
                            >
                              取消
                            </Button>
                            <div
                              className="relative flex items-center"
                              onMouseEnter={() => setIsUpgradeBtnHovered(true)}
                              onMouseLeave={() => setIsUpgradeBtnHovered(false)}
                            >
                              <Button
                                onClick={handleRoleUpgrade}
                                disabled={!walletBound || !walletConsistent || isUpgrading}
                              >
                                {isUpgrading ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    升级中...
                                  </>
                                ) : (
                                  "确认升级"
                                )}
                              </Button>
                              {/* Tooltip-like气泡提示 */}
                              {!walletBound && isUpgradeBtnHovered && (
                                <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1 bg-white border border-destructive text-destructive rounded shadow z-20 text-xs whitespace-nowrap">
                                  请先绑定钱包才能成为商家
                                </span>
                              )}
                              {walletBound && !walletConsistent && isUpgradeBtnHovered && (
                                <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1 bg-white border border-destructive text-destructive rounded shadow z-20 text-xs whitespace-nowrap">
                                  当前连接的钱包地址与绑定的钱包地址不一致
                                </span>
                              )}
                            </div>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* 钱包管理标签页 - 管理员不显示 */}
            {!isAdmin() && (
              <TabsContent value="wallet" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Wallet className="h-5 w-5" />
                      <span>钱包管理</span>
                    </CardTitle>
                    <CardDescription>管理您的区块链钱包连接，绑定钱包后可购买付费数据集</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <WalletConnect showBindOption={true} />
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* 账户设置标签页 */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>账户安全</span>
                  </CardTitle>
                  <CardDescription>管理您的账户安全设置</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">修改密码</h4>
                      <p className="text-sm text-muted-foreground">定期更新密码以保护账户安全</p>
                    </div>
                    <Button variant="outline" onClick={() => setChangePwdOpen(true)}>修改密码</Button>
                  </div>

                  <Separator />

                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Dialog open={changePwdOpen} onOpenChange={setChangePwdOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改密码</DialogTitle>
            <DialogDescription>请输入新密码和邮箱验证码</DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePwdSubmit} className="space-y-4">
            <div>
              <Label htmlFor="newPassword">新密码</Label>
              <Input
                id="newPassword"
                type="password"
                value={pwdForm.newPassword}
                onChange={e => handlePwdChange("newPassword", e.target.value)}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Label htmlFor="verificationCode">邮箱验证码</Label>
                <Input
                  id="verificationCode"
                  value={pwdForm.verificationCode}
                  onChange={e => handlePwdChange("verificationCode", e.target.value)}
                  required
                />
              </div>
              <Button type="button" variant="secondary" onClick={handleSendCode} disabled={pwdLoading}>发送验证码</Button>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={pwdLoading}>
                {pwdLoading ? "处理中..." : "确认修改"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </RoleGuard>
  )
}

// 工具函数和配色
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28BFE", "#FF6699", "#33CC99", "#FFB347"];
function getCategoryStats(categories: string[]): { category: string; value: number }[] {
  if (!categories || categories.length === 0) return [];
  const stats: Record<string, number> = {};
  categories.forEach((category: string) => {
    if (category) {
      stats[category] = (stats[category] || 0) + 1;
    }
  });
  return Object.entries(stats).map(([category, value]) => ({ category, value }));
}

