import { useState, useEffect } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Sidebar } from "@/components/Sidebar"
import type { ActiveTab } from "@/components/Sidebar"
import { Header } from "@/components/Header"
import { StatusBar } from "@/components/StatusBar"
import { ActiveHeroCard } from "@/components/ActiveHeroCard"
import { MetricsWidget } from "@/components/MetricsWidget"
import { StreamPresetCard } from "@/components/StreamPresetCard"
import { PresetModal } from "@/components/PresetModal"
import { SettingsModal } from "@/components/SettingsModal"
import { ScenesView } from "@/components/views/ScenesView"
import { AudioView } from "@/components/views/AudioView"
import { SourcesView } from "@/components/views/SourcesView"
import { useOBS } from "@/hooks/useOBS"
import type { StreamPreset } from "@/types/preset"
import { toast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { updateTwitchChannelInfo } from "@/lib/twitch"
import { updateYouTubeBroadcast } from "@/lib/youtube-auth"
import { updateKickChannelInfo } from "@/lib/kick"

export const Route = createFileRoute("/")({
  component: DashboardPage,
})

const DEFAULT_PRESETS: StreamPreset[] = [
  {
    id: "1",
    name: "🦇 Batman Playthrough",
    title: "Batman: Arkham Knight - Playthrough #1 | First Time!",
    gameCategory: "Batman: Arkham Knight",
    twitchGameId: "489322",
    isActive: true,
  },
  {
    id: "2",
    name: "⚔️ Dota 2 Ranked",
    title: "Rolling into Turbo with Earth Spirit! | Fast Matches",
    gameCategory: "Dota 2",
    twitchGameId: "29595",
    isActive: false,
  },
]

function DashboardPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("core")
  const [dir, setDir] = useState<"ltr" | "rtl">("ltr")

  // Live OBS WebSocket Hook
  const obs = useOBS()

  // Presets State
  const [presets, setPresets] = useState<StreamPreset[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("stream_presets")
      return saved ? JSON.parse(saved) : DEFAULT_PRESETS
    }
    return DEFAULT_PRESETS
  })

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [editingPreset, setEditingPreset] = useState<StreamPreset | null>(null)

  useEffect(() => {
    document.documentElement.dir = dir
  }, [dir])

  useEffect(() => {
    localStorage.setItem("stream_presets", JSON.stringify(presets))
  }, [presets])

  // Cmd+K listener for Settings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsSettingsOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleSyncTwitch = async (preset: StreamPreset) => {
    try {
      const res = await updateTwitchChannelInfo({
        title: preset.title,
        gameId: preset.twitchGameId,
        categoryName: preset.gameCategory,
      })

      toast.add({
        title: "Twitch Synced!",
        description: `Updated channel title & game for ${res.username}.`,
      })
    } catch (err: any) {
      toast.add({
        type: "error",
        title: "Twitch Sync Failed",
        description: err.message || "Check your credentials in Settings (⌘K).",
      })
    }
  }

  const handleSyncYouTube = async (preset: StreamPreset) => {
    try {
      // Fall back to the user's configured default category when the preset
      // doesn't specify one.
      const defaultCategory =
        localStorage.getItem("youtube_default_category") || ""
      const categoryName =
        preset.youtubeCategory || defaultCategory || undefined

      await updateYouTubeBroadcast({
        title: preset.title,
        categoryId: preset.youtubeCategoryId,
        categoryName,
      })

      toast.add({
        title: "YouTube Synced!",
        description: "Updated the active YouTube live broadcast.",
      })
    } catch (err: any) {
      toast.add({
        type: "error",
        title: "YouTube Sync Failed",
        description:
          err.message ||
          "YouTube must be connected and actively streaming to update.",
      })
    }
  }

  const handleSyncKick = async (preset: StreamPreset) => {
    try {
      const res = await updateKickChannelInfo({
        title: preset.title,
        categoryId: preset.kickCategoryId,
        categoryName: preset.kickCategory,
      })

      toast.add({
        title: "Kick Synced!",
        description: `Updated channel title & game for ${res.username}.`,
      })
    } catch (err: any) {
      toast.add({
        type: "error",
        title: "Kick Sync Failed",
        description: err.message || "Check your credentials in Settings (⌘K).",
      })
    }
  }

  const handleApplyPreset = async (id: string) => {
    const target = presets.find((p) => p.id === id)
    if (!target) return

    // 1. Update active preset UI state
    setPresets((prev) =>
      prev.map((p) => ({
        ...p,
        isActive: p.id === id,
      }))
    )

    // 2. Switch local OBS Scene if connected
    if (
      obs.isConnected &&
      typeof target.obsSceneName === "string" &&
      target.obsSceneName.length > 0
    ) {
      await obs.switchScene(target.obsSceneName)
    }

    // 3. Sync live metadata to Twitch Helix API
    await handleSyncTwitch(target)

    // 4. Sync live metadata to Kick (best-effort)
    await handleSyncKick(target)

    // 5. Sync live metadata to YouTube (best-effort, requires active stream)
    await handleSyncYouTube(target)
  }

  const handleSavePreset = (presetToSave: StreamPreset) => {
    setPresets((prev) => {
      const exists = prev.some((p) => p.id === presetToSave.id)
      if (exists) {
        return prev.map((p) => (p.id === presetToSave.id ? presetToSave : p))
      }
      return [...prev, presetToSave]
    })
    toast.add({
      title: editingPreset ? "Preset Updated" : "Preset Created",
      description: `Saved "${presetToSave.name}".`,
    })
  }

  const handleDeletePreset = (id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id))
    toast.add({
      type: "error",
      title: "Preset Deleted",
      description: "Preset removed.",
    })
  }

  const handleDuplicatePreset = (preset: StreamPreset) => {
    const duplicated: StreamPreset = {
      ...preset,
      id: Date.now().toString(),
      name: `${preset.name} (Copy)`,
      isActive: false,
    }
    setPresets((prev) => [...prev, duplicated])
    toast.add({
      title: "Preset Duplicated",
      description: `Copied: ${duplicated.name}`,
    })
  }

  const activePreset = presets.find((p) => p.isActive) || presets[0]

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        {/* 1. Left Vertical Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onEndStream={() => {
            obs.stopStream()
            toast.add({
              type: "error",
              title: "Broadcast Terminated",
              description: "Sent stop signal to OBS Studio.",
            })
          }}
        />

        {/* Main App Container */}
        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          {/* 2. Top Header Bar */}
          <Header
            dir={dir}
            isStreaming={obs.isStreaming}
            isConnected={obs.isConnected}
            onToggleDir={() => setDir(dir === "ltr" ? "rtl" : "ltr")}
            onToggleStream={async () => {
              if (obs.isStreaming) {
                await obs.stopStream()
                toast.add({
                  type: "error",
                  title: "Broadcast Stopped",
                  description: "Sent stop signal to OBS Studio.",
                })
              } else {
                await obs.startStream()
                toast.add({
                  title: "Broadcast Started",
                  description: "Sent Go Live signal to OBS Studio!",
                })
              }
            }}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />

          {/* 3. Main Route Content */}
          <main className="flex-1 space-y-6 overflow-y-auto p-6">
            {activeTab === "core" && (
              <div className="mx-auto max-w-7xl space-y-6">
                {/* Top Bento Row: Active Broadcast Hero + System Metrics */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <ActiveHeroCard
                      activePreset={activePreset}
                      uptime="02:14:35"
                      onSync={() => {
                        handleSyncTwitch(activePreset)
                        handleSyncKick(activePreset)
                        handleSyncYouTube(activePreset)
                      }}
                    />
                  </div>

                  {/* Inside DashboardPage core view in src/routes/index.tsx */}
                  <div className="lg:col-span-1">
                    <MetricsWidget
                      cpuUsage={obs.stats.cpuUsage}
                      ramUsageMb={obs.stats.memoryUsageMb}
                      bitrateKbps={obs.stats.bitrateKbps}
                      fps={obs.stats.fps}
                      isConnected={obs.isConnected}
                    />
                  </div>
                </div>

                {/* Bottom Bento Row: Quick Presets Deck */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <h2 className="font-mono text-lg font-bold tracking-tight">
                      QUICK PRESETS DECK
                    </h2>
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingPreset(null)
                        setIsModalOpen(true)
                      }}
                      className="gap-2 bg-purple-600 text-white hover:bg-purple-500"
                    >
                      <Plus className="h-4 w-4" /> New Preset
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {presets.map((preset) => (
                      <StreamPresetCard
                        key={preset.id}
                        preset={preset}
                        onApply={handleApplyPreset}
                        onEdit={(p) => {
                          setEditingPreset(p)
                          setIsModalOpen(true)
                        }}
                        onDelete={handleDeletePreset}
                        onDuplicate={handleDuplicatePreset}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Scenes Tab */}
            {activeTab === "scenes" && (
              <ScenesView
                scenes={obs.scenes}
                currentScene={obs.currentScene}
                onSelectScene={(s) => {
                  obs.switchScene(s)
                  toast.add({
                    title: "Scene Switched",
                    description: `Active OBS program scene set to "${s}".`,
                  })
                }}
                isConnected={obs.isConnected}
              />
            )}

            {/* Audio Tab */}
            {activeTab === "audio" && (
              <AudioView
                audioInputs={obs.audioInputs}
                onToggleMute={obs.toggleMute}
                onVolumeChange={obs.setVolumeDb}
                isConnected={obs.isConnected}
              />
            )}

            {/* Sources Tab */}
            {activeTab === "sources" && (
              <SourcesView
                currentScene={obs.currentScene}
                sceneItems={obs.sceneItems}
                onToggleItem={obs.toggleItemVisibility}
                isConnected={obs.isConnected}
              />
            )}
          </main>

          {/* 4. Bottom OBS Telemetry Status Bar */}
          <StatusBar
            isConnected={obs.isConnected}
            isStreaming={obs.isStreaming}
            bitrateKbps={obs.stats.bitrateKbps}
            skippedFrames={obs.stats.outputSkippedFrames}
            totalFrames={obs.stats.outputTotalFrames}
            onBrbToggle={() => {
              if (obs.isConnected) {
                obs.switchScene("BRB")
                toast.add({
                  title: "OBS Scene",
                  description: "Switched to BRB scene.",
                })
              }
            }}
            onMuteToggle={() => {
              if (obs.isConnected && obs.audioInputs.length > 0) {
                obs.toggleMute(obs.audioInputs[0].inputName)
                toast.add({
                  title: "Audio Toggled",
                  description: "Microphone state updated.",
                })
              }
            }}
            onUpdateInfo={() => {
              obs.connect()
              toast.add({
                title: "Refreshed",
                description: "Re-synced OBS WebSocket state.",
              })
            }}
          />
        </div>

        {/* Modals */}
        <PresetModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSavePreset}
          initialData={editingPreset}
          availableScenes={obs.scenes}
        />

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSave={() => {
            obs.connect()
            toast.add({
              title: "Credentials Saved",
              description: "Reconnecting to OBS WebSocket server...",
            })
          }}
        />
      </div>
    </SidebarProvider>
  )
}
