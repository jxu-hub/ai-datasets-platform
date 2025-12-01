import type React from "react"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { AuthProvider } from "@/contexts/AuthContext"
import { WalletProvider } from "@/contexts/WalletContext"
import { SystemConfigProvider } from "@/contexts/SystemConfigContext"
import { MainLayout } from "@/components/layout/MainLayout"
import { MaintenanceMode } from "@/components/system/MaintenanceMode"
import { Toaster } from "sonner"
import TopProgressBar from "@/components/system/TopProgressBar"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <TopProgressBar />
        <SystemConfigProvider>
          <AuthProvider>
            <WalletProvider>
              <MaintenanceMode />
              <MainLayout>{children}</MainLayout>
              <Toaster
                theme="system"
                className="toaster group"
                position="bottom-left"
                style={
                  {
                    "--normal-bg": "var(--popover)",
                    "--normal-text": "var(--popover-foreground)",
                    "--normal-border": "var(--border)",
                  } as React.CSSProperties
                }
              />
            </WalletProvider>
          </AuthProvider>
        </SystemConfigProvider>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.app'
    };
