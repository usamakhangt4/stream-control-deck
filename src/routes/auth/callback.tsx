import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { exchangeTwitchCode } from "@/lib/twitch-auth"
import { exchangeYouTubeCode } from "@/lib/youtube-auth"
import { exchangeKickCode } from "@/lib/kick-auth"
import { readOAuthSession } from "@/lib/oauth"
import type { Platform } from "@/lib/oauth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

export const Route = createFileRoute("/auth/callback")({
  component: OAuthCallbackPage,
})

async function exchangeForProvider(provider: Platform, code: string) {
  switch (provider) {
    case "twitch":
      await exchangeTwitchCode(code)
      return
    case "youtube":
      await exchangeYouTubeCode(code)
      return
    case "kick":
      await exchangeKickCode(code)
      return
  }
}

function OAuthCallbackPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  )
  const [errorMessage, setErrorMessage] = useState<string>("")

  useEffect(() => {
    const processCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get("code")
      const state = urlParams.get("state")
      const session = readOAuthSession()

      if (!code) {
        setStatus("error")
        setErrorMessage("Authorization code missing from provider callback.")
        return
      }

      if (!session || state !== session.state) {
        setStatus("error")
        setErrorMessage("Security state mismatch (CSRF protection trigger).")
        return
      }

      try {
        await exchangeForProvider(session.provider, code)
        setStatus("success")
        setTimeout(() => navigate({ to: "/" }), 1200)
      } catch (err: any) {
        setStatus("error")
        setErrorMessage(
          err.message || "Failed to complete authentication flow."
        )
      }
    }

    processCallback()
  }, [navigate])

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background p-4 font-mono">
      <Card className="w-full max-w-md border-border bg-card shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-base font-bold tracking-wider uppercase">
            Platform Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-6 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
              <p className="text-xs text-muted-foreground">
                Exchanging secure OAuth credentials...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              <p className="text-xs font-bold text-foreground">
                Account Connected Successfully!
              </p>
              <p className="text-[11px] text-muted-foreground">
                Redirecting back to Stream Deck OS...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <AlertCircle className="h-10 w-10 text-red-400" />
              <p className="text-xs font-bold text-red-400">
                Authentication Failed
              </p>
              <p className="text-[11px] text-muted-foreground">
                {errorMessage}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
