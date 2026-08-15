import type { StreamPreset } from "@/types/preset"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { RefreshCw, Eye, Users, Radio, Edit3 } from "lucide-react"

interface ActiveHeroCardProps {
  activePreset: StreamPreset
  uptime: string
  viewerCount?: number
  subGoal?: { current: number; total: number }
  onSync: () => void
}

export function ActiveHeroCard({
  activePreset,
  uptime,
  viewerCount = 1245,
  subGoal = { current: 12, total: 20 },
  onSync,
}: ActiveHeroCardProps) {
  return (
    <Card className="relative overflow-hidden border-purple-500/40 bg-card/90 shadow-[0_0_30px_rgba(145,70,255,0.12)]">
      {/* Top Ambient Glow Bar */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400" />

      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Badge className="gap-1.5 border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-red-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            ACTIVE BROADCAST
          </Badge>
          <Badge
            variant="outline"
            className="border-border bg-muted/40 font-mono text-xs"
          >
            {activePreset.gameCategory}
          </Badge>
        </div>

        {/* Live Uptime Counter */}
        <div className="rounded-md border border-border/80 bg-background/80 px-3 py-1 font-mono text-lg font-bold tracking-wider text-foreground">
          {uptime}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-4">
          {/* Cover Art using official AspectRatio component */}
          <div className="w-full max-w-[120px] overflow-hidden rounded-lg border border-border shadow-md sm:max-w-none">
            <AspectRatio ratio={3 / 4}>
              <img
                src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop"
                alt={activePreset.gameCategory}
                className="h-full w-full object-cover"
              />
            </AspectRatio>
          </div>

          {/* Title & Metadata Details */}
          <div className="space-y-3 sm:col-span-3">
            {/* Styled Code Terminal Title Box */}
            <div className="relative rounded-lg border border-border/80 bg-background/90 p-3 font-mono text-xs">
              <div className="mb-1.5 flex items-center justify-between border-b border-border/40 pb-1 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Radio className="h-3 w-3 text-purple-400" /> stream_title.txt
                </span>
                <Edit3 className="h-3 w-3 cursor-pointer hover:text-foreground" />
              </div>
              <p className="leading-relaxed font-semibold text-foreground">
                {activePreset.title}
              </p>
            </div>

            {/* Live Metrics Row (Viewers & Sub Goal Progress) */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Viewer Counter */}
              <div className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/30 p-2 font-mono">
                <Eye className="h-4 w-4 text-purple-400" />
                <div>
                  <div className="text-[10px] text-muted-foreground">
                    Viewers
                  </div>
                  <div className="text-xs font-bold">
                    {viewerCount.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Sub Goal Progress using official Progress component */}
              <div className="space-y-1 rounded-md border border-border/50 bg-muted/30 p-2 font-mono">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-emerald-400" /> Sub Goal
                  </span>
                  <span className="font-bold text-foreground">
                    {subGoal.current}/{subGoal.total}
                  </span>
                </div>
                <Progress
                  value={(subGoal.current / subGoal.total) * 100}
                  className="h-1.5 bg-zinc-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Button using Tooltip primitive */}
        <div className="flex justify-end border-t border-border/40 pt-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  onClick={onSync}
                  className="gap-2 bg-purple-600 font-medium text-white shadow-md shadow-purple-950/50 hover:bg-purple-500"
                >
                  <RefreshCw className="h-4 w-4" /> Sync Platforms Now
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  Pushes title & category updates to Twitch, Kick & YouTube
                  simultaneously.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  )
}
