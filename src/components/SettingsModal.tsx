import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { getTwitchUser } from "@/lib/twitch"
import type { TwitchUser } from "@/lib/twitch"
import { startTwitchOAuth } from "@/lib/twitch-auth"
import { startYouTubeOAuth, getYouTubeChannel } from "@/lib/youtube-auth"
import type { YouTubeChannel } from "@/lib/youtube-auth"
import { getKickChannel } from "@/lib/kick"
import type { KickChannel } from "@/lib/kick"
import { startKickOAuth } from "@/lib/kick-auth"
import { loadTokens, clearTokens } from "@/lib/oauth"
import { YOUTUBE_CATEGORIES } from "@/lib/youtube-categories"
import {
  Tv,
  Radio,
  KeyRound,
  CheckCircle2,
  LogOut,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Clapperboard,
} from "lucide-react"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function SettingsModal({ isOpen, onClose, onSave }: SettingsModalProps) {
  const [obsHost, setObsHost] = useState("localhost")
  const [obsPort, setObsPort] = useState("4455")
  const [obsPassword, setObsPassword] = useState("")

  const [twitchUser, setTwitchUser] = useState<TwitchUser | null>(null)

  const [youtubeUser, setYoutubeUser] = useState<YouTubeChannel | null>(null)
  const [defaultYoutubeCategory, setDefaultYoutubeCategory] = useState("")

  const [kickUser, setKickUser] = useState<KickChannel | null>(null)

  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  // Developer credentials come from the VITE_* env vars. When present, the
  // per-platform "Connect" buttons are enabled and drive the OAuth flow.
  const hasTwitchClient = Boolean(import.meta.env.VITE_TWITCH_CLIENT_ID)
  const hasKickCreds = Boolean(
    import.meta.env.VITE_KICK_CLIENT_ID &&
      import.meta.env.VITE_KICK_CLIENT_SECRET
  )
  const hasYouTubeClient = Boolean(import.meta.env.VITE_YOUTUBE_CLIENT_ID)

  useEffect(() => {
    if (typeof window === "undefined") return

    setObsHost(localStorage.getItem("obs_host") || "localhost")
    setObsPort(localStorage.getItem("obs_port") || "4455")
    setObsPassword(localStorage.getItem("obs_password") || "")
    setDefaultYoutubeCategory(
      localStorage.getItem("youtube_default_category") || ""
    )

    // Twitch — verify any stored token
    const twitchTokens = loadTokens("twitch")
    if (twitchTokens?.accessToken) {
      const twitchClientId =
        twitchTokens.clientId || import.meta.env.VITE_TWITCH_CLIENT_ID || ""
      verifyTwitch(twitchClientId, twitchTokens.accessToken)
    }

    // YouTube — verify any stored token
    const ytTokens = loadTokens("youtube")
    if (ytTokens?.accessToken) {
      verifyYouTube(ytTokens.accessToken)
    }

    // Kick — verify any stored token
    const kickTokens = loadTokens("kick")
    if (kickTokens?.accessToken) {
      verifyKick(kickTokens.accessToken)
    }
  }, [isOpen])

  const verifyTwitch = async (clientId: string, token: string) => {
    if (!clientId || !token) return
    setIsVerifying(true)
    setVerifyError(null)
    try {
      const user = await getTwitchUser(clientId, token)
      setTwitchUser(user)
    } catch (err: any) {
      setTwitchUser(null)
      setVerifyError(err.message || "Failed to verify Twitch token.")
    } finally {
      setIsVerifying(false)
    }
  }

  const verifyYouTube = async (token: string) => {
    if (!token) return
    setIsVerifying(true)
    setVerifyError(null)
    try {
      const channel = await getYouTubeChannel(token)
      setYoutubeUser(channel)
    } catch (err: any) {
      setYoutubeUser(null)
      setVerifyError(err.message || "Failed to verify YouTube token.")
    } finally {
      setIsVerifying(false)
    }
  }

  const verifyKick = async (token: string) => {
    if (!token) return
    setIsVerifying(true)
    setVerifyError(null)
    try {
      const channel = await getKickChannel(token)
      setKickUser(channel)
    } catch (err: any) {
      setKickUser(null)
      setVerifyError(err.message || "Failed to verify Kick token.")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleDisconnectTwitch = () => {
    clearTokens("twitch")
    setTwitchUser(null)
  }

  const handleDisconnectKick = () => {
    clearTokens("kick")
    setKickUser(null)
  }

  const handleDisconnectYouTube = () => {
    clearTokens("youtube")
    setYoutubeUser(null)
  }

  const handleStartTwitchOAuth = async () => {
    setVerifyError(null)
    try {
      const url = await startTwitchOAuth()
      window.location.href = url
    } catch (err: any) {
      setVerifyError(err.message || "Failed to start Twitch authorization.")
    }
  }

  const handleStartYouTubeOAuth = async () => {
    setVerifyError(null)
    try {
      const url = await startYouTubeOAuth()
      window.location.href = url
    } catch (err: any) {
      setVerifyError(err.message || "Failed to start YouTube authorization.")
    }
  }

  const handleStartKickOAuth = async () => {
    setVerifyError(null)
    try {
      const url = await startKickOAuth()
      window.location.href = url
    } catch (err: any) {
      setVerifyError(err.message || "Failed to start Kick authorization.")
    }
  }

  const handleSave = () => {
    localStorage.setItem("obs_host", obsHost)
    localStorage.setItem("obs_port", obsPort)
    localStorage.setItem("obs_password", obsPassword)
    localStorage.setItem("youtube_default_category", defaultYoutubeCategory)
    onSave()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-border bg-card sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono text-lg font-bold">
            <KeyRound className="h-5 w-5 text-purple-400" /> Studio Integrations
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure local OBS WebSocket and connect platform accounts.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="twitch" className="w-full py-2">
          <TabsList className="grid w-full grid-cols-4 border border-border bg-muted/50">
            <TabsTrigger value="obs" className="gap-2 font-mono text-xs">
              <Radio className="h-3.5 w-3.5 text-emerald-400" /> OBS
            </TabsTrigger>
            <TabsTrigger value="twitch" className="gap-2 font-mono text-xs">
              <Tv className="h-3.5 w-3.5 text-purple-400" /> Twitch
            </TabsTrigger>
            <TabsTrigger value="kick" className="gap-2 font-mono text-xs">
              <Radio className="h-3.5 w-3.5 text-lime-400" /> Kick
            </TabsTrigger>
            <TabsTrigger value="youtube" className="gap-2 font-mono text-xs">
              <Clapperboard className="h-3.5 w-3.5 text-red-400" /> YouTube
            </TabsTrigger>
          </TabsList>

          {/* OBS Tab */}
          <TabsContent value="obs" className="space-y-4 pt-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="obsHost" className="font-mono text-xs">
                  WebSocket Host
                </Label>
                <Input
                  id="obsHost"
                  value={obsHost}
                  onChange={(e) => setObsHost(e.target.value)}
                  className="border-border bg-background font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="obsPort" className="font-mono text-xs">
                  Port
                </Label>
                <Input
                  id="obsPort"
                  value={obsPort}
                  onChange={(e) => setObsPort(e.target.value)}
                  className="border-border bg-background font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="obsPassword" className="font-mono text-xs">
                Server Password
              </Label>
              <Input
                id="obsPassword"
                type="password"
                placeholder="Leave blank if unauthenticated"
                value={obsPassword}
                onChange={(e) => setObsPassword(e.target.value)}
                className="border-border bg-background font-mono text-xs"
              />
            </div>
          </TabsContent>

          {/* Twitch Account Tab */}
          <TabsContent value="twitch" className="space-y-4 pt-3">
            {!hasTwitchClient && (
              <div className="flex min-w-0 items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 font-mono text-xs text-amber-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
                <span className="min-w-0 break-words">
                  No Twitch Client ID configured. Add{" "}
                  <code className="break-all text-purple-400">
                    VITE_TWITCH_CLIENT_ID
                  </code>{" "}
                  to your <code className="break-all text-purple-400">.env</code>{" "}
                  file to enable connecting.
                </span>
              </div>
            )}

            {isVerifying && (
              <div className="flex items-center gap-2 p-2 font-mono text-xs text-purple-400">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Verifying
                credentials with Twitch...
              </div>
            )}

            {twitchUser ? (
              <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src={twitchUser.profile_image_url}
                    alt={twitchUser.display_name}
                    className="h-8 w-8 rounded-full border border-emerald-500/50"
                  />
                  <div>
                    <div className="flex items-center gap-1 font-mono text-xs font-bold text-foreground">
                      {twitchUser.display_name}
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      Connected & Ready to Sync Broadcast
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnectTwitch}
                  className="h-8 gap-1.5 font-mono text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <LogOut className="h-3.5 w-3.5" /> Disconnect
                </Button>
              </div>
            ) : verifyError ? (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 font-mono text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                {verifyError}
              </div>
            ) : (
              <div className="pt-1">
                <Button
                  onClick={handleStartTwitchOAuth}
                  disabled={!hasTwitchClient}
                  className="h-9 w-full gap-2 bg-purple-600 font-mono text-xs font-bold text-white hover:bg-purple-500"
                >
                  <Tv className="h-4 w-4" /> Connect Twitch{" "}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                  You'll be redirected to Twitch, then returned automatically.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Kick Account Tab */}
          <TabsContent value="kick" className="space-y-4 pt-3">
            {!hasKickCreds && (
              <div className="flex min-w-0 items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 font-mono text-xs text-amber-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
                <span className="min-w-0 break-words">
                  No Kick credentials configured. Add{" "}
                  <code className="break-all text-lime-400">VITE_KICK_CLIENT_ID</code>{" "}
                  and{" "}
                  <code className="break-all text-lime-400">VITE_KICK_CLIENT_SECRET</code>{" "}
                  to your <code className="break-all text-lime-400">.env</code>{" "}
                  file to enable connecting.
                </span>
              </div>
            )}

            {isVerifying && (
              <div className="flex items-center gap-2 p-2 font-mono text-xs text-lime-400">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Verifying
                credentials with Kick...
              </div>
            )}

            {kickUser ? (
              <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src={kickUser.profile_picture_url}
                    alt={kickUser.name}
                    className="h-8 w-8 rounded-full border border-emerald-500/50"
                  />
                  <div>
                    <div className="flex items-center gap-1 font-mono text-xs font-bold text-foreground">
                      {kickUser.name}
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      Connected & Ready to Sync Broadcast
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnectKick}
                  className="h-8 gap-1.5 font-mono text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <LogOut className="h-3.5 w-3.5" /> Disconnect
                </Button>
              </div>
            ) : verifyError ? (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 font-mono text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                {verifyError}
              </div>
            ) : (
              <div className="pt-1">
                <Button
                  onClick={handleStartKickOAuth}
                  disabled={!hasKickCreds}
                  className="h-9 w-full gap-2 bg-lime-600 font-mono text-xs font-bold text-white hover:bg-lime-500"
                >
                  <Radio className="h-4 w-4" /> Connect Kick{" "}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                  You'll be redirected to Kick, then returned automatically.
                </p>
              </div>
            )}
          </TabsContent>

          {/* YouTube Account Tab */}
          <TabsContent value="youtube" className="space-y-4 pt-3">
            {!hasYouTubeClient && (
              <div className="flex min-w-0 items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 font-mono text-xs text-amber-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
                <span className="min-w-0 break-words">
                  No YouTube Client ID configured. Add{" "}
                  <code className="break-all text-red-400">VITE_YOUTUBE_CLIENT_ID</code>{" "}
                  to your <code className="break-all text-red-400">.env</code>{" "}
                  file to enable connecting.
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="font-mono text-xs">
                Default YouTube Category
              </Label>
              <Select
                value={defaultYoutubeCategory}
                onValueChange={(val) => {
                  if (!val) return
                  setDefaultYoutubeCategory(val === "none" ? "" : val)
                  setVerifyError(null)
                }}
              >
                <SelectTrigger className="border-border bg-background font-mono text-xs">
                  <SelectValue placeholder="No default — use preset's category" />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  <SelectItem value="none" className="font-mono text-xs">
                    No default (use preset's category)
                  </SelectItem>
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
                Used as the YouTube category for presets that don't specify one.
                Choose "No default" to disable this fallback.
              </p>
            </div>

            {isVerifying && (
              <div className="flex items-center gap-2 p-2 font-mono text-xs text-red-400">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Verifying
                credentials with YouTube...
              </div>
            )}

            {youtubeUser ? (
              <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src={youtubeUser.thumbnails?.default?.url}
                    alt={youtubeUser.title}
                    className="h-8 w-8 rounded-full border border-emerald-500/50"
                  />
                  <div>
                    <div className="flex items-center gap-1 font-mono text-xs font-bold text-foreground">
                      {youtubeUser.title}
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      Connected & Ready to Sync Broadcast
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnectYouTube}
                  className="h-8 gap-1.5 font-mono text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <LogOut className="h-3.5 w-3.5" /> Disconnect
                </Button>
              </div>
            ) : verifyError ? (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 font-mono text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                {verifyError}
              </div>
            ) : (
              <div className="pt-1">
                <Button
                  onClick={handleStartYouTubeOAuth}
                  disabled={!hasYouTubeClient}
                  className="h-9 w-full gap-2 bg-red-600 font-mono text-xs font-bold text-white hover:bg-red-500"
                >
                  <Clapperboard className="h-4 w-4" /> Connect YouTube{" "}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-border font-mono text-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-purple-600 font-mono text-xs text-white hover:bg-purple-500"
          >
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
