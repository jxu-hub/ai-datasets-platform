"use client"

import { useState, useCallback } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { mockDatasetAPI } from "@/lib/api/mock"

export interface FavoriteDataset {
  id: number
  title: string
  description: string
  category: string
  tags: string[]
  price: number
  is_free: boolean
  author: {
    id: number
    avatar_url?: string
  }
  favorited_at: string
}

// Mock favorites storage
const mockFavorites: { userId: number; datasetId: number; favorited_at: string }[] = []

// 这里不再导出 useFavorites，防止被实际业务引用，仅作类型备用。
