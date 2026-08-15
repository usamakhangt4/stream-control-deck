import type { StreamPreset } from "@/types/preset"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Gamepad2,
  Check,
  Play,
  MoreVertical,
  Pencil,
  Trash2,
  Copy,
} from "lucide-react"

interface StreamPresetCardProps {
  preset: StreamPreset
  onApply: (id: string) => void
  onEdit?: (preset: StreamPreset) => void
  onDelete?: (id: string) => void
  onDuplicate?: (preset: StreamPreset) => void
}

export function StreamPresetCard({
  preset,
  onApply,
  onEdit,
  onDelete,
  onDuplicate,
}: StreamPresetCardProps) {
  const { id, name, title, gameCategory, isActive } = preset

  return (
    <Card
      className={`relative overflow-hidden border transition-all duration-200 ${
        isActive
          ? "border-purple-500/60 bg-card/90 shadow-[0_0_25px_rgba(145,70,255,0.15)] ring-1 ring-purple-500/50"
          : "border-border bg-card/40 hover:border-zinc-700 hover:bg-card/80"
      }`}
    >
      {/* Active Top Gradient Line */}
      {isActive && (
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400" />
      )}

      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-center justify-between gap-2">
          {/* Game Category Badge */}
          <Badge
            variant="outline"
            className="gap-1.5 border-border bg-muted/40 px-2.5 py-0.5 font-mono text-xs"
          >
            <Gamepad2 className="h-3.5 w-3.5 text-purple-400" />
            <span>{gameCategory}</span>
          </Badge>

          <div className="flex items-center gap-1.5">
            {/* Active Status Indicator */}
            {isActive && (
              <Badge className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Active
              </Badge>
            )}

            {/* Context Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(preset)}>
                    <Pencil className="me-2 h-4 w-4" />
                    Edit Preset
                  </DropdownMenuItem>
                )}
                {onDuplicate && (
                  <DropdownMenuItem onClick={() => onDuplicate(preset)}>
                    <Copy className="me-2 h-4 w-4" />
                    Duplicate
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="me-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Preset Name */}
        <CardTitle className="text-lg font-bold tracking-tight text-foreground">
          {name}
        </CardTitle>
      </CardHeader>

      {/* Stream Title Preview */}
      <CardContent className="pb-4">
        <div className="rounded-md border border-border/60 bg-background/60 p-3">
          <p className="line-clamp-2 font-mono text-xs leading-relaxed text-muted-foreground">
            "{title}"
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-3">
        {/* Platform Targets */}
        <div className="flex items-center gap-1.5">
          <Badge className="border-[#9146FF]/20 bg-[#9146FF]/10 px-1.5 py-0 text-[10px] font-semibold text-[#9146FF]">
            Twitch
          </Badge>
          <Badge className="border-[#53FC18]/20 bg-[#53FC18]/10 px-1.5 py-0 text-[10px] font-semibold text-[#53FC18]">
            Kick
          </Badge>
          <Badge className="border-red-500/20 bg-red-500/10 px-1.5 py-0 text-[10px] font-semibold text-red-400">
            YouTube
          </Badge>
        </div>

        {/* Apply Preset Button */}
        <Button
          size="sm"
          disabled={isActive}
          onClick={() => onApply(id)}
          className={
            isActive
              ? "cursor-not-allowed border border-border bg-muted text-muted-foreground"
              : "bg-purple-600 font-medium text-white shadow-md shadow-purple-950/40 hover:bg-purple-500"
          }
        >
          {isActive ? (
            <>
              <Check className="me-1.5 h-4 w-4 text-emerald-400" /> Applied
            </>
          ) : (
            <>
              <Play className="me-1.5 h-3.5 w-3.5 fill-current" /> Apply
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
