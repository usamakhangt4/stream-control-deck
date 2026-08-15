import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import type { OBSSceneItem } from "@/hooks/useOBS"
import { Eye, EyeOff, Layers } from "lucide-react"

interface SourcesViewProps {
  currentScene: string
  sceneItems: OBSSceneItem[]
  onToggleItem: (sceneItemId: number, enabled: boolean) => void
  isConnected: boolean
}

export function SourcesView({
  currentScene,
  sceneItems,
  onToggleItem,
  isConnected,
}: SourcesViewProps) {
  if (!isConnected) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-6 text-center font-mono">
        <p className="text-sm font-semibold text-muted-foreground">
          OBS Disconnected
        </p>
        <p className="text-xs text-muted-foreground/60">
          Connect OBS WebSocket to view and toggle sources in your current
          scene.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h2 className="font-mono text-lg font-bold tracking-tight">
            SOURCE VISIBILITY TOGGLES
          </h2>
          <p className="text-xs text-muted-foreground">
            Toggle webcams, overlays, alerts, and captures for active scene:{" "}
            <strong className="text-foreground">{currentScene}</strong>
          </p>
        </div>
        <Badge variant="outline" className="border-border font-mono text-xs">
          <Layers className="me-1 h-3 w-3 text-purple-400" />{" "}
          {sceneItems.length} Sources
        </Badge>
      </div>

      <Card className="border-border bg-card/80">
        <CardContent className="divide-y divide-border p-0">
          {sceneItems.map((item) => (
            <div
              key={item.sceneItemId}
              className="flex items-center justify-between p-4 transition-colors hover:bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-lg p-2 ${
                    item.sceneItemEnabled
                      ? "border border-purple-500/30 bg-purple-600/20 text-purple-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {item.sceneItemEnabled ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.sourceName}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    ID: {item.sceneItemId}
                  </p>
                </div>
              </div>

              {/* Official shadcn Switch primitive */}
              <Switch
                checked={item.sceneItemEnabled}
                onCheckedChange={(enabled) =>
                  onToggleItem(item.sceneItemId, enabled)
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
