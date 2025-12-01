"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { mockAdminAPI } from "@/lib/api/mock"

interface SystemConfig {
  platform: {
    name: string
    description: string
    maintenanceMode: boolean
    registrationEnabled: boolean
  }
  fees: {
    serviceFeeRate: number
  }
  announcements: Array<{
    id: number
    title: string
    content: string
    type: "info" | "warning" | "success"
    isActive: boolean
    createdAt: string
  }>
  policies: {
    privacyPolicy: string
    termsOfService: string
    dataUsagePolicy: string
  }
}

interface SystemConfigContextType {
  config: SystemConfig | null
  loading: boolean
  refreshConfig: () => Promise<void>
  isMaintenanceMode: boolean
  isRegistrationEnabled: boolean
  activeAnnouncements: SystemConfig["announcements"]
}

const SystemConfigContext = createContext<SystemConfigContextType | undefined>(undefined)

export function SystemConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SystemConfig | null>(null)
  const [loading, setLoading] = useState(true)

  const loadConfig = async () => {
    try {
      console.log("[v0] Loading system configuration for app")
      const response = await mockAdminAPI.getSystemConfig()
      console.log("[v0] System config loaded:", response.data)
      console.log("[v0] Announcements in config:", response.data?.announcements)
      setConfig(response.data)
    } catch (error) {
      console.error("[v0] Failed to load system config:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  const refreshConfig = async () => {
    await loadConfig()
  }

  const isMaintenanceMode = config?.platform.maintenanceMode || false
  const isRegistrationEnabled = config?.platform.registrationEnabled ?? true
  const activeAnnouncements = config?.announcements.filter((ann) => ann.isActive) || []
  console.log("[v0] Active announcements calculated:", activeAnnouncements)

  return (
    <SystemConfigContext.Provider
      value={{
        config,
        loading,
        refreshConfig,
        isMaintenanceMode,
        isRegistrationEnabled,
        activeAnnouncements,
      }}
    >
      {children}
    </SystemConfigContext.Provider>
  )
}

export function useSystemConfig() {
  const context = useContext(SystemConfigContext)
  if (context === undefined) {
    throw new Error("useSystemConfig must be used within a SystemConfigProvider")
  }
  return context
}
