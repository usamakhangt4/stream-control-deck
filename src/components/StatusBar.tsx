import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Coffee, MicOff, RefreshCw, AlertTriangle } from "lucide-react"

interface StatusBarProps {
  onUpdateInfo?: () => void
  onBrbToggle?: () => void
  onMuteToggle?: () => void
  isConnected?: boolean
  isStreaming?: boolean
  bitrateKbps?: number
  skippedFrames?: number
  totalFrames?: number
}

export function StatusBar({
  onUpdateInfo,
  onBrbToggle,
  onMuteToggle,
  isConnected = false,
  isStreaming = false,
  bitrateKbps = 0,
  skippedFrames = 0,
  totalFrames = 0,
}: StatusBarProps) {
  const [isBrb, setIsBrb] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  const droppedPercent =
    totalFrames > 0 ? ((skippedFrames / totalFrames) * 100).toFixed(1) : "0.0"
  const hasDroppedFrames = parseFloat(droppedPercent) > 1.0

  const handleBrbClick = () => {
    setIsBrb((prev) => !prev)
    onBrbToggle?.()
  }

  const handleMuteClick = () => {
    setIsMuted((prev) => !prev)
    onMuteToggle?.()
  }

  return (
    <footer className="z-10 flex h-12 shrink-0 items-center justify-between border-t border-border bg-card/80 px-6 font-mono text-xs">
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              isConnected ? "animate-pulse bg-emerald-400" : "bg-red-500"
            }`}
          />
          <span className="font-semibold text-foreground">
            {isConnected ? "OBS Connected" : "OBS Disconnected"}
          </span>
        </div>

        <span className="text-border">|</span>

        {isStreaming ? (
          <div className="flex items-center gap-3">
            <span className="font-bold text-emerald-400">
              {bitrateKbps.toLocaleString()} kbps
            </span>
            <span className="text-border">|</span>
            <Badge
              variant={hasDroppedFrames ? "destructive" : "outline"}
              className="gap-1 px-2 py-0 font-mono text-[10px]"
            >
              {hasDroppedFrames && <AlertTriangle className="h-3 w-3" />}
              Dropped: {droppedPercent}% ({skippedFrames})
            </Badge>
          </div>
        ) : (
          <span>1080p60 • Standby</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={isBrb ? "default" : "outline"}
          size="sm"
          onClick={handleBrbClick}
          className={`h-7 gap-1.5 text-[11px] ${
            isBrb
              ? "bg-amber-600 text-white hover:bg-amber-500"
              : "border-border bg-muted/20"
          }`}
        >
          <Coffee className="h-3.5 w-3.5" />
          BRB
        </Button>

        <Button
          variant={isMuted ? "destructive" : "outline"}
          size="sm"
          onClick={handleMuteClick}
          className={`h-7 gap-1.5 text-[11px] ${
            isMuted ? "bg-red-600 text-white" : "border-border bg-muted/20"
          }`}
        >
          <MicOff className="h-3.5 w-3.5" />
          MUTE
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onUpdateInfo}
          className="h-7 gap-1.5 border-border bg-muted/20 text-[11px]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Update Info
        </Button>
      </div>
    </footer>
  )
}
