import {
  beginAuthorization,
  exchangeCode,
  refreshTokens,
  loadTokens,
  isTokenExpired,
} from "./oauth"
import type {PlatformTokens} from "./oauth"

const YOUTUBE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
const YOUTUBE_TOKEN_URL = "https://oauth2.googleapis.com/token"

const YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.force-ssl",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/userinfo.profile",
].join(" ")

/** Starts the YouTube (Google) OAuth browser redirect. Returns the redirect URL. */
export async function startYouTubeOAuth(
  customClientId?: string,
  customClientSecret?: string
): Promise<string> {
  const clientId =
    customClientId ||
    localStorage.getItem("oauth_youtube_client_id") ||
    import.meta.env.VITE_YOUTUBE_CLIENT_ID ||
    ""
  const clientSecret =
    customClientSecret ||
    localStorage.getItem("oauth_youtube_client_secret") ||
    import.meta.env.VITE_YOUTUBE_CLIENT_SECRET ||
    ""

  if (!clientId) {
    throw new Error("YouTube Client ID is missing.")
  }

  return beginAuthorization({
    provider: "youtube",
    clientId,
    clientSecret,
    authorizeUrl: YOUTUBE_AUTHORIZE_URL,
    scope: YOUTUBE_SCOPES,
    extraParams: {
      access_type: "offline", // required to receive a refresh token
      prompt: "consent", // force a fresh consent so a refresh token is issued
    },
  })
}

/** Exchanges the authorization code for YouTube tokens and persists them. */
export async function exchangeYouTubeCode(code: string): Promise<PlatformTokens> {
  return exchangeCode({
    provider: "youtube",
    tokenUrl: YOUTUBE_TOKEN_URL,
    code,
  })
}

/** Refreshes an expired YouTube access token. */
export async function refreshYouTubeToken(): Promise<PlatformTokens> {
  return refreshTokens("youtube", YOUTUBE_TOKEN_URL)
}

/**
 * Returns a valid YouTube access token, refreshing first if expired.
 * Throws if no token exists or it cannot be refreshed.
 */
export async function getYouTubeAccessToken(): Promise<string> {
  const tokens = loadTokens("youtube")
  if (!tokens) throw new Error("YouTube not connected.")

  if (isTokenExpired(tokens)) {
    const refreshed = await refreshYouTubeToken()
    return refreshed.accessToken
  }
  return tokens.accessToken
}

export interface YouTubeChannel {
  id: string
  title: string
  thumbnails?: {
    default?: {url?: string}
  }
}

/** Fetches the authenticated YouTube channel profile. */
export async function getYouTubeChannel(accessToken: string): Promise<YouTubeChannel> {
  const res = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    {headers: {Authorization: `Bearer ${accessToken}`}}
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || "Failed to verify YouTube token.")
  }

  const data = await res.json()
  const channel = data.items?.[0]
  if (!channel) throw new Error("No YouTube channel found for this account.")

  return {
    id: channel.id,
    title: channel.snippet?.title,
    thumbnails: channel.snippet?.thumbnails,
  }
}

export interface LiveBroadcast {
  id: string
  title: string
}

/**
 * Finds the current or most-recent live broadcast for the channel, which is
 * required before updating title/category. Returns null if nothing is live.
 */
export async function getCurrentLiveBroadcast(
  accessToken: string
): Promise<LiveBroadcast | null> {
  const url = new URL("https://www.googleapis.com/youtube/v3/liveBroadcasts")
  url.searchParams.set("part", "snippet")
  url.searchParams.set("broadcastStatus", "active")
  url.searchParams.set("mine", "true")
  url.searchParams.set("maxResults", "1")

  const res = await fetch(url.toString(), {
    headers: {Authorization: `Bearer ${accessToken}`},
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || "Failed to fetch YouTube live broadcast.")
  }

  const data = await res.json()
  const item = data.items?.[0]
  return item ? {id: item.id, title: item.snippet?.title} : null
}

export interface YouTubeSyncParams {
  title: string
  categoryId?: string
  categoryName?: string
}

/**
 * Resolves a YouTube video category ID from its name (e.g. "Gaming" -> "20").
 * Uses the YouTube videoCategories endpoint, which requires an active/valid
 * token but not a live broadcast.
 */
export async function searchYouTubeCategoryId(
  accessToken: string,
  categoryName: string
): Promise<string | null> {
  const url = new URL("https://www.googleapis.com/youtube/v3/videoCategories")
  url.searchParams.set("part", "snippet")
  url.searchParams.set("regionCode", "US")

  const res = await fetch(url.toString(), {
    headers: {Authorization: `Bearer ${accessToken}`},
  })
  if (!res.ok) return null

  const data = await res.json()
  const match = (data.items || []).find(
    (item: {snippet?: {title?: string}}) =>
      item.snippet?.title?.toLowerCase() === categoryName.toLowerCase()
  )
  return match?.id || null
}

/**
 * Updates the title (and optionally category) of the active YouTube live
 * broadcast. Requires the user to be actively streaming on YouTube.
 */
export async function updateYouTubeBroadcast({
  title,
  categoryId,
  categoryName,
}: YouTubeSyncParams): Promise<void> {
  const accessToken = await getYouTubeAccessToken()
  const broadcast = await getCurrentLiveBroadcast(accessToken)
  if (!broadcast) {
    throw new Error("No active YouTube live broadcast found to update.")
  }

  // Resolve a numeric category ID from a name if one wasn't provided
  let resolvedCategoryId = categoryId
  if (!resolvedCategoryId && categoryName) {
    resolvedCategoryId =
      (await searchYouTubeCategoryId(accessToken, categoryName)) || undefined
  }

  const payload: Record<string, unknown> = {
    id: broadcast.id,
    snippet: {title},
  }
  if (resolvedCategoryId) {
    payload.snippet = {...(payload.snippet as object), categoryId: resolvedCategoryId}
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/liveBroadcasts")
  url.searchParams.set("part", "snippet")

  const res = await fetch(url.toString(), {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || "Failed to update YouTube broadcast.")
  }
}
