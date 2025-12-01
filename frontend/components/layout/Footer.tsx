import ProgressLink from "@/components/system/ProgressLink"
import { Database, Github, Twitter, Mail } from "lucide-react"
import { useSystemConfig } from '@/contexts/SystemConfigContext'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog'

/**
 * 页面底部组件
 */
export function Footer() {
  const { config } = useSystemConfig()
  const [policyDialog, setPolicyDialog] = useState<'privacy' | 'terms' | null>(null)
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Database className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">AI数据集平台</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              连接数据提供者与AI开发者，推动人工智能技术发展的专业数据集交易平台。
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">快速链接</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <ProgressLink href="/free-datasets" className="text-muted-foreground hover:text-foreground transition-colors">
                  免费数据集
                </ProgressLink>
              </li>
              <li>
                <ProgressLink href="/paid-datasets" className="text-muted-foreground hover:text-foreground transition-colors">
                  付费数据集
                </ProgressLink>
              </li>
              <li>
                <ProgressLink href="/upload" className="text-muted-foreground hover:text-foreground transition-colors">
                  上传数据集
                </ProgressLink>
              </li>
              <li>
                <ProgressLink href="/profile" className="text-muted-foreground hover:text-foreground transition-colors">
                  个人中心
                </ProgressLink>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="font-semibold">数据集分类</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <ProgressLink
                  href="/free-datasets?category=计算机视觉"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  计算机视觉
                </ProgressLink>
              </li>
              <li>
                <ProgressLink
                  href="/free-datasets?category=自然语言处理"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  自然语言处理
                </ProgressLink>
              </li>
              <li>
                <ProgressLink
                  href="/free-datasets?category=金融数据"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  金融数据
                </ProgressLink>
              </li>
              <li>
                <ProgressLink
                  href="/free-datasets?category=文本分类"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  文本分类
                </ProgressLink>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold">联系我们</h3>
            <div className="flex space-x-4">
              <ProgressLink href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </ProgressLink>
              <ProgressLink href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </ProgressLink>
              <ProgressLink href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="h-5 w-5" />
                <span className="sr-only">邮箱</span>
              </ProgressLink>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>邮箱: support@aidataset.com</p>
              <p>电话: +86 400-123-4567</p>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">© 2025 AI数据集平台. 保留所有权利.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <button
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
              onClick={() => setPolicyDialog('privacy')}
              type="button"
            >
              隐私政策
            </button>
            <button
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
              onClick={() => setPolicyDialog('terms')}
              type="button"
            >
              服务条款
            </button>
            <ProgressLink href="/favorites" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              帮助中心
            </ProgressLink>
          </div>
        </div>
      </div>
      {/* 弹窗显示政策内容 */}
      <Dialog open={!!policyDialog} onOpenChange={() => setPolicyDialog(null)}>
        <DialogContent className="max-w-xl p-0 overflow-hidden">
          <DialogHeader className="sticky top-0 z-10 bg-background px-6 pt-6 pb-2 border-b">
            <DialogTitle className="text-xl font-bold">
              {policyDialog === 'privacy' ? '隐私政策' : '服务条款'}
            </DialogTitle>
            <DialogClose className="absolute right-4 top-6 text-lg text-muted-foreground hover:text-foreground focus:outline-none">
              ×
            </DialogClose>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto px-6 pb-6 pt-2 text-base leading-7 whitespace-pre-line" style={{ wordBreak: 'break-all' }}>
            {(() => {
              const raw = policyDialog === 'privacy'
                ? config?.policies.privacyPolicy || '暂无隐私政策内容'
                : config?.policies.termsOfService || '暂无服务条款内容';
              // 按“1.”、“2.”、“3.”等分段，自动换行
              const parts = raw.split(/(?=\d+\.)/g)
              return parts.map((part, idx) => (
                <div key={idx} className="mb-3 pl-2">
                  {part.trim()}
                </div>
              ))
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </footer>
  )
}
