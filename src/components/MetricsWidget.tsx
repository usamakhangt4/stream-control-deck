import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Cpu, HardDrive, Activity, Gauge } from "lucide-react"

interface MetricsWidgetProps {
  cpuUsage?: number
  ramUsageMb?: number
  bitrateKbps?: number
  fps?: number
  isConnected?: boolean
}

export function MetricsWidget({
  cpuUsage = 0,
  ramUsageMb = 0,
  bitrateKbps = 0,
  fps = 60,
  isConnected = false,
}: MetricsWidgetProps) {
  const ramPercent = Math.min((ramUsageMb / 2048) * 100, 100) // Percentage relative to 2GB allocation window

  return (
    <Card className="flex h-full flex-col justify-between border-border bg-card/90">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 font-mono text-xs tracking-wider text-muted-foreground uppercase">
          <Activity className="h-4 w-4 text-purple-400" /> System Metrics
        </CardTitle>
        <Badge
          variant="outline"
          className="gap-1 border-border font-mono text-[10px]"
        >
          <Gauge className="h-3 w-3 text-emerald-400" /> {fps} FPS
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {/* CPU Load */}
          <div className="space-y-2 rounded-lg border border-border/80 bg-background/80 p-3">
            <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Cpu className="h-3.5 w-3.5 text-blue-400" /> CPU Load
              </span>
              <span className="font-bold text-foreground">{cpuUsage}%</span>
            </div>
            <Progress value={cpuUsage} className="h-1.5 bg-zinc-800" />
          </div>

          {/* OBS RAM Usage */}
          <div className="space-y-2 rounded-lg border border-border/80 bg-background/80 p-3">
            <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <HardDrive className="h-3.5 w-3.5 text-purple-400" /> OBS RAM
              </span>
              <span className="font-bold text-foreground">{ramUsageMb} MB</span>
            </div>
            <Progress value={ramPercent} className="h-1.5 bg-zinc-800" />
          </div>
        </div>

        {/* Streaming Bitrate Meter */}
        <div
          className={`flex items-center justify-between rounded-lg border p-3 font-mono transition-colors ${
            isConnected
              ? "border-emerald-500/20 bg-emerald-500/5"
              : "border-border bg-muted/30"
          }`}
        >
          <div className="space-y-0.5">
            <div className="text-[10px] font-semibold tracking-wider text-emerald-400/80 uppercase">
              Output Bitrate
            </div>
            <div className="text-xl font-extrabold tracking-tight text-emerald-400">
              {bitrateKbps.toLocaleString()}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                kbps
              </span>
            </div>
          </div>
          <span
            className={`h-3 w-3 rounded-full ${
              isConnected
                ? "animate-pulse bg-emerald-400 shadow-[0_0_10px_#53FC18]"
                : "bg-zinc-600"
            }`}
          />
        </div>
      </CardContent>
    </Card>
  )
}
