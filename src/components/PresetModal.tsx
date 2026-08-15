import { useState, useEffect } from "react"
import type { StreamPreset } from "@/types/preset"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Layers } from "lucide-react"
import { YOUTUBE_CATEGORIES } from "@/lib/youtube-categories"

interface PresetModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (preset: StreamPreset) => void
  initialData?: StreamPreset | null
  availableScenes?: string[]
}

export function PresetModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  availableScenes = [],
}: PresetModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    gameCategory: "",
    title: "",
    twitchGameId: "",
    youtubeCategory: "",
    youtubeCategoryId: "",
    obsSceneName: "",
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        gameCategory: initialData.gameCategory,
        title: initialData.title,
        twitchGameId: initialData.twitchGameId ?? "",
        youtubeCategory: initialData.youtubeCategory ?? "",
        youtubeCategoryId: initialData.youtubeCategoryId ?? "",
        obsSceneName: initialData.obsSceneName ?? "",
      })
    } else {
      setFormData({
        name: "",
        gameCategory: "",
        title: "",
        twitchGameId: "",
        youtubeCategory: "",
        youtubeCategoryId: "",
        obsSceneName: "",
      })
    }
  }, [initialData, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.title || !formData.gameCategory) return

    onSave({
      id: initialData?.id || Date.now().toString(),
      name: formData.name,
      title: formData.title,
      gameCategory: formData.gameCategory,
      twitchGameId: formData.twitchGameId || undefined,
      youtubeCategory: formData.youtubeCategory || undefined,
      youtubeCategoryId: formData.youtubeCategoryId || undefined,
      obsSceneName: formData.obsSceneName || undefined,
      isActive: initialData?.isActive || false,
    })

    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-border bg-card sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-mono text-lg font-bold">
              {initialData ? "Edit Stream Preset" : "Create New Stream Preset"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure metadata and pair it with an OBS scene for 1-click
              broadcast switching.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="font-mono text-xs">
                Preset Name
              </Label>
              <Input
                id="name"
                placeholder="e.g. 🦇 Batman Playthrough"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
                className="border-border bg-background"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category" className="font-mono text-xs">
                Game / Category
              </Label>
              <Input
                id="category"
                placeholder="e.g. Batman: Arkham Knight"
                value={formData.gameCategory}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    gameCategory: e.target.value,
                  }))
                }
                required
                className="border-border bg-background"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title" className="font-mono text-xs">
                Broadcast Title
              </Label>
              <Input
                id="title"
                placeholder="e.g. [DROPS ON] Returning to Gotham"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                required
                className="border-border bg-background font-mono text-xs"
              />
            </div>

            {/* YouTube Category (optional) */}
            <div className="grid gap-2">
              <Label htmlFor="youtubeCategory" className="font-mono text-xs">
                YouTube Category (Optional)
              </Label>
              <Select
                value={
                  YOUTUBE_CATEGORIES.some(
                    (c) => c.name === formData.youtubeCategory
                  )
                    ? formData.youtubeCategory
                    : "custom"
                }
                onValueChange={(val) => {
                  if (!val || val === "custom") return
                  const cat = YOUTUBE_CATEGORIES.find((c) => c.name === val)
                  setFormData((prev) => ({
                    ...prev,
                    youtubeCategory: val,
                    // Auto-fill the numeric ID so resolution isn't needed.
                    youtubeCategoryId: cat?.id ?? prev.youtubeCategoryId,
                  }))
                }}
              >
                <SelectTrigger className="border-border bg-background font-mono text-xs">
                  <SelectValue placeholder="Select a YouTube category..." />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  {YOUTUBE_CATEGORIES.map((cat) => (
                    <SelectItem
                      key={cat.id}
                      value={cat.name}
                      className="font-mono text-xs"
                    >
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="font-mono text-[10px] text-muted-foreground">
                Selecting a category auto-fills its numeric ID. Leave blank to
                skip YouTube category sync.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="youtubeCategoryId" className="font-mono text-xs">
                YouTube Category ID (Optional)
              </Label>
              <Input
                id="youtubeCategoryId"
                placeholder="e.g. 20"
                value={formData.youtubeCategoryId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    youtubeCategoryId: e.target.value,
                  }))
                }
                className="border-border bg-background font-mono text-xs"
              />
            </div>

            {/* Target OBS Scene Selector */}
            <div className="grid gap-2">
              <Label className="flex items-center gap-1.5 font-mono text-xs">
                <Layers className="h-3.5 w-3.5 text-purple-400" /> Target OBS
                Scene
              </Label>
              <Select
                value={formData.obsSceneName}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, obsSceneName: val ?? "" }))
                }
              >
                <SelectTrigger className="border-border bg-background font-mono text-xs">
                  <SelectValue placeholder="Select an OBS Scene to switch to..." />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  {availableScenes.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No OBS Scenes Found (Ensure OBS is connected)
                    </SelectItem>
                  ) : (
                    availableScenes.map((scene) => (
                      <SelectItem
                        key={scene}
                        value={scene}
                        className="font-mono text-xs"
                      >
                        {scene}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-purple-600 font-medium text-white hover:bg-purple-500"
            >
              {initialData ? "Save Changes" : "Create Preset"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
