import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import type { OBSAudioInput } from "@/hooks/useOBS"
import { Volume2, VolumeX, Mic, Activity } from "lucide-react"

interface AudioViewProps {
  audioInputs: OBSAudioInput[]
  onToggleMute: (inputName: string) => void
  onVolumeChange: (inputName: string, db: number) => void
  isConnected: boolean
}

export function AudioView({
  audioInputs,
  onToggleMute,
  onVolumeChange,
  isConnected,
}: AudioViewProps) {
  if (!isConnected) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-6 text-center font-mono">
        <p className="text-sm font-semibold text-muted-foreground">
          OBS Disconnected
        </p>
        <p className="text-xs text-muted-foreground/60">
          Connect OBS WebSocket to adjust live audio levels and monitor VU
          meters.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="border-b border-border pb-3">
        <h2 className="font-mono text-lg font-bold tracking-tight">
          LIVE AUDIO MIXER & VU METERS
        </h2>
        <p className="text-xs text-muted-foreground">
          Real-time audio telemetry feeds directly from local OBS audio
          channels.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {audioInputs.map((input) => {
          const peak = input.inputMuted ? 0 : input.peakLevel || 0

          // Determine VU Bar Color Segmenting
          let barColorClass =
            "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
          if (peak > 85) {
            barColorClass = "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]"
          } else if (peak > 65) {
            barColorClass = "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
          }

          return (
            <Card key={input.inputName} className="border-border bg-card/80">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2 font-mono text-sm">
                  <Mic className="h-4 w-4 text-purple-400" />
                  <span>{input.inputName}</span>
                </CardTitle>

                <Badge
                  variant={input.inputMuted ? "destructive" : "outline"}
                  className="font-mono text-[10px]"
                >
                  {input.inputMuted ? "MUTED" : "LIVE"}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Real-time Peak VU Meter */}
                <div className="space-y-1 rounded-lg border border-border/80 bg-background/80 p-2.5">
                  <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Activity className="h-3 w-3 text-purple-400" /> Signal
                      Peak
                    </span>
                    <span
                      className={`font-bold ${
                        peak > 85
                          ? "text-red-400"
                          : peak > 65
                            ? "text-amber-400"
                            : "text-emerald-400"
                      }`}
                    >
                      {peak}%
                    </span>
                  </div>

                  {/* VU Progress Meter Track */}
                  <div className="relative flex h-2.5 w-full items-center overflow-hidden rounded-full border border-border/40 bg-zinc-900 p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-75 ${barColorClass}`}
                      style={{ width: `${peak}%` }}
                    />
                  </div>
                </div>

                {/* Fader & Mute Control */}
                <div className="flex items-center gap-3">
                  <Button
                    size="icon"
                    variant={input.inputMuted ? "destructive" : "secondary"}
                    onClick={() => onToggleMute(input.inputName)}
                    className="h-9 w-9 shrink-0"
                  >
                    {input.inputMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
                      <span>Volume Fader</span>
                      <span className="font-bold text-foreground">
                        {input.inputVolumeDb} dB
                      </span>
                    </div>
                    <Slider
                      min={-60}
                      max={0}
                      step={1}
                      value={[input.inputVolumeDb]}
                      onValueChange={(val) =>
                        onVolumeChange(
                          input.inputName,
                          Array.isArray(val) ? val[0] : val
                        )
                      }
                      disabled={input.inputMuted}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
