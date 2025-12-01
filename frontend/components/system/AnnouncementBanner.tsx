"use client"

import { useSystemConfig } from "@/contexts/SystemConfigContext"
import { Info, AlertTriangle, CheckCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function AnnouncementBanner() {
  const { activeAnnouncements } = useSystemConfig()
  const [dismissedIds, setDismissedIds] = useState<number[]>([])
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("dismissed-announcements")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setDismissedIds(Array.isArray(parsed) ? parsed : [])
      } catch (e) {
        setDismissedIds([])
      }
    }
    setIsLoaded(true)
  }, [])

  const visibleAnnouncements = activeAnnouncements.filter((ann) => !dismissedIds.includes(ann.id))

  useEffect(() => {
    if (isLoaded && visibleAnnouncements.length > 0) {
      setIsOpen(true)
      setCurrentAnnouncementIndex(0)
    }
  }, [visibleAnnouncements.length, isLoaded])

  if (!isLoaded || visibleAnnouncements.length === 0) {
    return null
  }

  const currentAnnouncement = visibleAnnouncements[currentAnnouncementIndex]

  const handleClose = () => {
    const newDismissedIds = [...dismissedIds, currentAnnouncement.id]
    setDismissedIds(newDismissedIds)

    localStorage.setItem("dismissed-announcements", JSON.stringify(newDismissedIds))

    if (currentAnnouncementIndex < visibleAnnouncements.length - 1) {
      setCurrentAnnouncementIndex(currentAnnouncementIndex + 1)
    } else {
      setIsOpen(false)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getIconBgColor = (type: string) => {
    switch (type) {
      case "warning":
        return "bg-orange-50"
      case "success":
        return "bg-green-50"
      default:
        return "bg-blue-50"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${getIconBgColor(currentAnnouncement.type)}`}>
              {getIcon(currentAnnouncement.type)}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-left">{currentAnnouncement.title}</DialogTitle>
            </div>
          </div>
        </DialogHeader>
        <DialogDescription className="text-left text-sm text-gray-600 leading-relaxed">
          {currentAnnouncement.content}
        </DialogDescription>

        {visibleAnnouncements.length > 1 && (
          <div className="flex justify-center pt-4 border-t">
            <span className="text-xs text-gray-500">
              {currentAnnouncementIndex + 1} / {visibleAnnouncements.length}
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
