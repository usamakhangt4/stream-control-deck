import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Settings, Languages, Radio, OctagonX } from "lucide-react"

interface HeaderProps {
  dir: "ltr" | "rtl"
  isStreaming?: boolean
  isConnected?: boolean
  onToggleDir: () => void
  onToggleStream?: () => void
  onOpenSettings?: () => void
}

export function Header({
  dir,
  isStreaming = false,
  isConnected = false,
  onToggleDir,
  onToggleStream,
  onOpenSettings,
}: HeaderProps) {
  return (
    <header className="z-10 flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/60 px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <h1 className="flex items-center gap-2 font-mono text-sm font-bold tracking-wider">
          <span>STREAM DECK OS</span>
        </h1>

        {isStreaming ? (
          <Badge className="gap-1.5 border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400 uppercase">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            LIVE
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="gap-1.5 px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
          >
            <span className="h-2 w-2 rounded-full bg-zinc-600" />
            OFFLINE
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Go Live / End Broadcast Header Action */}
        <Button
          size="sm"
          disabled={!isConnected}
          onClick={onToggleStream}
          className={`h-8 gap-2 font-mono text-xs font-bold ${
            isStreaming
              ? "bg-red-600 text-white shadow-md shadow-red-950/40 hover:bg-red-500"
              : "bg-emerald-600 text-white shadow-md shadow-emerald-950/40 hover:bg-emerald-500"
          }`}
        >
          {isStreaming ? (
            <>
              <OctagonX className="h-3.5 w-3.5" /> STOP STREAM
            </>
          ) : (
            <>
              <Radio className="h-3.5 w-3.5" /> GO LIVE
            </>
          )}
        </Button>

        <div className="hidden h-4 w-[1px] bg-border md:block" />

        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleDir}
          className="h-8 gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
        >
          <Languages className="h-3.5 w-3.5" />
          {dir.toUpperCase()}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenSettings}
          className="h-8 gap-1.5 border-border bg-muted/30 text-xs"
        >
          <Settings className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Settings</span>
          <kbd className="hidden h-4 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground select-none lg:inline-flex">
            ⌘K
          </kbd>
        </Button>
      </div>
    </header>
  )
}
