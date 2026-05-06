"use client"

import { useEffect, useState } from "react"
import { Smartphone } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const MOBILE_MQ = "(max-width: 767px)"
const SESSION_KEY = "easycert-generate-mobile-recommendation-dismissed"

export function MobileGenerateRecommendationDialog() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ)

    const sync = () => {
      let dismissed = false
      try {
        dismissed = sessionStorage.getItem(SESSION_KEY) === "1"
      } catch {
        /* ignore */
      }
      setOpen(mq.matches && !dismissed)
    }

    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      try {
        sessionStorage.setItem(SESSION_KEY, "1")
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="top-[42%] max-w-[min(100vw-2rem,24rem)] gap-5 border-yellow-400 bg-yellow-50 text-yellow-950 dark:border-yellow-600 dark:bg-yellow-950 dark:text-yellow-50 sm:top-[50%]">
        <DialogHeader className="space-y-3 text-center sm:text-left">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-yellow-200/80 dark:bg-yellow-900/80 sm:mx-0">
            <Smartphone className="h-5 w-5" aria-hidden />
          </div>
          <DialogTitle className="text-balance">
            Desktop or tablet recommended
          </DialogTitle>
          <DialogDescription className="text-balance text-yellow-900/90 dark:text-yellow-100/90">
            For the best experience, we recommend using EasyCert on a desktop or
            tablet.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => handleOpenChange(false)}
          >
            Continue on mobile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
