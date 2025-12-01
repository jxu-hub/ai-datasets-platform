"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Settings, Clock, TrendingUp, X } from "lucide-react"

interface AdvancedSearchBarProps {
  onSearch: (query: string, options?: AdvancedSearchOptions) => void
  placeholder?: string
  className?: string
}

interface AdvancedSearchOptions {
  searchIn: string[]
  exactMatch: boolean
  excludeWords: string
  fileFormat: string
  dateRange: string
}

// Mock data for suggestions and popular searches
const mockSuggestions = ["中文文本分类", "图像识别数据集", "自然语言处理", "推荐系统数据", "金融时间序列"]

const mockPopularSearches = ["NLP数据集", "计算机视觉", "情感分析", "机器学习", "深度学习", "推荐算法"]

const mockSearchHistory = ["中文新闻分类数据集", "电商用户评论", "图像标注数据", "语音识别训练集"]

export function AdvancedSearchBar({ onSearch, placeholder = "搜索数据集...", className }: AdvancedSearchBarProps) {
  const [query, setQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [searchHistory, setSearchHistory] = useState<string[]>(mockSearchHistory)
  const [advancedOptions, setAdvancedOptions] = useState<AdvancedSearchOptions>({
    searchIn: ["title", "description"],
    exactMatch: false,
    excludeWords: "",
    fileFormat: "all",
    dateRange: "all",
  })

  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Handle input change and show suggestions
  const handleInputChange = (value: string) => {
    setQuery(value)

    if (value.length > 0) {
      // Filter suggestions based on input
      const filteredSuggestions = mockSuggestions.filter((suggestion) =>
        suggestion.toLowerCase().includes(value.toLowerCase()),
      )
      setSuggestions(filteredSuggestions)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }

  // Handle search execution
  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query
    if (finalQuery.trim()) {
      // Add to search history
      const newHistory = [finalQuery, ...searchHistory.filter((h) => h !== finalQuery)].slice(0, 5)
      setSearchHistory(newHistory)

      // Execute search
      onSearch(finalQuery, advancedOptions)
      setShowSuggestions(false)
    }
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    handleSearch(suggestion)
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }

  // Clear search
  const clearSearch = () => {
    setQuery("")
    setShowSuggestions(false)
    onSearch("", advancedOptions)
  }

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className={`relative ${className}`}>
      <div className="flex gap-2">
        {/* Main Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => query.length > 0 && setShowSuggestions(true)}
            className="pl-10 pr-10"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Search Button */}
        <Button onClick={() => handleSearch()}>
          <Search className="h-4 w-4 mr-2" />
          搜索
        </Button>

        {/* Advanced Search Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>高级搜索</DialogTitle>
              <DialogDescription>设置详细的搜索条件以获得更精确的结果</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Search In */}
              <div className="space-y-2">
                <Label>搜索范围</Label>
                <div className="space-y-2">
                  {[
                    { id: "title", label: "标题" },
                    { id: "description", label: "描述" },
                    { id: "tags", label: "标签" },
                    { id: "author", label: "作者" },
                  ].map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.id}
                        checked={advancedOptions.searchIn.includes(option.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setAdvancedOptions({
                              ...advancedOptions,
                              searchIn: [...advancedOptions.searchIn, option.id],
                            })
                          } else {
                            setAdvancedOptions({
                              ...advancedOptions,
                              searchIn: advancedOptions.searchIn.filter((item) => item !== option.id),
                            })
                          }
                        }}
                      />
                      <Label htmlFor={option.id} className="text-sm">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exact Match */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="exactMatch"
                  checked={advancedOptions.exactMatch}
                  onCheckedChange={(checked) => setAdvancedOptions({ ...advancedOptions, exactMatch: !!checked })}
                />
                <Label htmlFor="exactMatch" className="text-sm">
                  精确匹配
                </Label>
              </div>

              {/* Exclude Words */}
              <div className="space-y-2">
                <Label htmlFor="excludeWords">排除词汇</Label>
                <Input
                  id="excludeWords"
                  placeholder="输入要排除的词汇，用空格分隔"
                  value={advancedOptions.excludeWords}
                  onChange={(e) => setAdvancedOptions({ ...advancedOptions, excludeWords: e.target.value })}
                />
              </div>

              {/* File Format */}
              <div className="space-y-2">
                <Label>文件格式</Label>
                <Select
                  value={advancedOptions.fileFormat}
                  onValueChange={(value) => setAdvancedOptions({ ...advancedOptions, fileFormat: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有格式</SelectItem>
                    <SelectItem value="jsonl">JSONL</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="txt">TXT</SelectItem>
                    <SelectItem value="parquet">Parquet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label>发布时间</Label>
                <Select
                  value={advancedOptions.dateRange}
                  onValueChange={(value) => setAdvancedOptions({ ...advancedOptions, dateRange: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有时间</SelectItem>
                    <SelectItem value="week">最近一周</SelectItem>
                    <SelectItem value="month">最近一月</SelectItem>
                    <SelectItem value="quarter">最近三月</SelectItem>
                    <SelectItem value="year">最近一年</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={() => handleSearch()} className="w-full">
                应用高级搜索
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg" ref={suggestionsRef}>
          <CardContent className="p-0">
            {/* Search Suggestions */}
            {suggestions.length > 0 && (
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">搜索建议</span>
                </div>
                <div className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search History */}
            {searchHistory.length > 0 && (
              <>
                {suggestions.length > 0 && <Separator />}
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">搜索历史</span>
                  </div>
                  <div className="space-y-1">
                    {searchHistory.slice(0, 3).map((historyItem, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(historyItem)}
                        className="w-full text-left px-2 py-1 text-sm hover:bg-muted rounded transition-colors text-muted-foreground"
                      >
                        {historyItem}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Popular Searches */}
            <Separator />
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">热门搜索</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {mockPopularSearches.slice(0, 6).map((popular, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                    onClick={() => handleSuggestionClick(popular)}
                  >
                    {popular}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
