"use client"

import { useState, useCallback } from "react"
import { mockDatasetAPI } from "@/lib/api/mock"
import type { Dataset, PaginatedResponse } from "@/types"

export interface DatasetFilters {
  search?: string
  category?: string
  is_free?: boolean
  author_id?: number
  page?: number
  limit?: number
}

export interface DatasetStats {
  totalDatasets: number
  totalDownloads: number
  totalRevenue: number
  averageRating: number
}

export function useDataset() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get datasets with filters
  const getDatasets = useCallback(async (filters: DatasetFilters = {}): Promise<PaginatedResponse<Dataset> | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await mockDatasetAPI.getDatasets(filters)
      if (response.success && response.data) {
        return response.data
      } else {
        setError(response.error || "Failed to fetch datasets")
        return null
      }
    } catch (err: any) {
      setError(err.message || "Network error")
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Get single dataset by ID
  const getDataset = useCallback(async (id: number): Promise<Dataset | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await mockDatasetAPI.getDatasetById(id)
      if (response.success && response.data) {
        return response.data
      } else {
        setError(response.error || "Dataset not found")
        return null
      }
    } catch (err: any) {
      setError(err.message || "Network error")
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Upload new dataset
  const uploadDataset = useCallback(async (formData: FormData): Promise<Dataset | null> => {
    setLoading(true)
    setError(null)

    try {
      // Mock upload - in production this would handle file upload
      console.log("[v0] Uploading dataset:", formData)

      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock successful response
      const mockDataset: Dataset = {
        id: Date.now(),
        title: (formData.get("title") as string) || "New Dataset",
        description: (formData.get("description") as string) || "",
        category: (formData.get("category") as string) || "other",
        tags: JSON.parse((formData.get("tags") as string) || "[]"),
        price: Number(formData.get("price")) || 0,
        is_free: formData.get("is_free") === "true",
        file_url: "/mock-file-url",
        file_size: 1024 * 1024, // 1MB mock
        file_format: "jsonl",
        preview_data: [],
        author: {
          id: 1,
          username: "current_user",
          reputation_score: 4.5,
        },
        download_count: 0,
        rating: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      return mockDataset
    } catch (err: any) {
      setError(err.message || "Upload failed")
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Update dataset
  const updateDataset = useCallback(async (id: number, data: Partial<Dataset>): Promise<Dataset | null> => {
    setLoading(true)
    setError(null)

    try {
      console.log("[v0] Updating dataset:", id, data)

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock successful update
      const updatedDataset = { ...data, id, updated_at: new Date().toISOString() } as Dataset
      return updatedDataset
    } catch (err: any) {
      setError(err.message || "Update failed")
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Delete dataset
  const deleteDataset = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      console.log("[v0] Deleting dataset:", id)

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      return true
    } catch (err: any) {
      setError(err.message || "Delete failed")
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Get user's dataset statistics
  const getDatasetStats = useCallback(async (userId: number): Promise<DatasetStats | null> => {
    setLoading(true)
    setError(null)

    try {
      console.log("[v0] Getting dataset stats for user:", userId)

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Mock stats
      const stats: DatasetStats = {
        totalDatasets: 12,
        totalDownloads: 1543,
        totalRevenue: 2.45, // ETH
        averageRating: 4.2,
      }

      return stats
    } catch (err: any) {
      setError(err.message || "Failed to fetch stats")
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Purchase dataset
  const purchaseDataset = useCallback(async (datasetId: number, userId: number): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const response = await mockDatasetAPI.purchaseDataset(userId, datasetId)
      if (response.success) {
        return true
      } else {
        setError(response.error || "Purchase failed")
        return false
      }
    } catch (err: any) {
      setError(err.message || "Purchase failed")
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Check purchase status
  const checkPurchaseStatus = useCallback(async (userId: number, datasetId: number): Promise<boolean> => {
    try {
      const response = await mockDatasetAPI.checkPurchaseStatus(userId, datasetId)
      return (response.success && response.data?.hasPurchased) || false
    } catch (err: any) {
      console.error("[v0] Check purchase status error:", err)
      return false
    }
  }, [])

  return {
    loading,
    error,
    clearError: () => setError(null),
    getDatasets,
    getDataset,
    uploadDataset,
    updateDataset,
    deleteDataset,
    getDatasetStats,
    purchaseDataset,
    checkPurchaseStatus,
  }
}
