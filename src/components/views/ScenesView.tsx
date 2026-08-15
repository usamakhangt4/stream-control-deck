import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Layers, Check } from "lucide-react"

interface ScenesViewProps {
  scenes: string[]
  currentScene: string
  onSelectScene: (scene: string) => void
  isConnected: boolean
}

export function ScenesView({
  scenes,
  currentScene,
  onSelectScene,
  isConnected,
}: ScenesViewProps) {
  if (!isConnected) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-6 text-center font-mono">
        <p className="text-sm font-semibold text-muted-foreground">
          OBS Disconnected
        </p>
        <p className="text-xs text-muted-foreground/60">
          Ensure OBS Studio is running and WebSocket Server is enabled in Tools
          → WebSocket Server Settings.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h2 className="font-mono text-lg font-bold tracking-tight">
            OBS SCENE SELECTOR
          </h2>
          <p className="text-xs text-muted-foreground">
            Click any card to switch active broadcast scene in OBS.
          </p>
        </div>
        <Badge
          variant="outline"
          className="border-purple-500/40 font-mono text-xs text-purple-400"
        >
          Active: {currentScene || "None"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {scenes.map((sceneName) => {
          const isActive = sceneName === currentScene
          return (
            <Card
              key={sceneName}
              onClick={() => onSelectScene(sceneName)}
              className={`relative cursor-pointer overflow-hidden border transition-all duration-200 ${
                isActive
                  ? "border-purple-500 bg-purple-600/10 shadow-[0_0_20px_rgba(145,70,255,0.2)] ring-1 ring-purple-500/50"
                  : "border-border bg-card/60 hover:border-zinc-700 hover:bg-card"
              }`}
            >
              {isActive && (
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-purple-500 to-emerald-400" />
              )}
              <CardContent className="flex min-h-[120px] flex-col items-center justify-center gap-3 p-5">
                <div
                  className={`rounded-xl p-3 ${
                    isActive
                      ? "bg-purple-500 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Layers className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold tracking-tight">
                    {sceneName}
                  </p>
                  {isActive && (
                    <span className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] text-emerald-400">
                      <Check className="h-3 w-3" /> Live Program
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
