import {loadTokens, isTokenExpired, refreshTokens} from "./oauth"

export interface TwitchUser {
  id: string
  login: string
  display_name: string
  profile_image_url: string
}

export interface TwitchSyncParams {
  title: string
  gameId?: string
  categoryName?: string
}

/** Sanitizes OAuth tokens (removes 'oauth:' prefix if present) */
function cleanToken(token: string): string {
  return token.replace(/^oauth:/i, "").trim()
}

/** Loads Twitch credentials, refreshing the token first if it has expired. */
export async function getTwitchCredentials(): Promise<{
  clientId: string
  accessToken: string
}> {
  let tokens = loadTokens("twitch")
  if (!tokens || !tokens.clientId) {
    throw new Error(
      "Twitch not connected. Authorize in Settings (⌘K) first."
    )
  }

  if (isTokenExpired(tokens)) {
    tokens = await refreshTokens("twitch", "https://id.twitch.tv/oauth2/token")
  }

  // `refreshTokens` preserves the clientId; safe to assert after the guard.
  return {
    clientId: tokens.clientId as string,
    accessToken: tokens.accessToken,
  }
}

/** Fetches current authenticated Twitch user info */
export async function getTwitchUser(clientId: string, accessToken: string): Promise<TwitchUser> {
  const token = cleanToken(accessToken)
  const res = await fetch("https://api.twitch.tv/helix/users", {
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || "Invalid Twitch Client ID or Access Token.")
  }

  const data = await res.json()
  if (!data.data || data.data.length === 0) {
    throw new Error("No user found for given Twitch access token.")
  }

  return data.data[0]
}

/** Searches Twitch for a Category ID by name (e.g. "Dota 2" -> "29595") */
export async function searchTwitchGameId(
  clientId: string,
  accessToken: string,
  categoryName: string
): Promise<string | null> {
  const token = cleanToken(accessToken)
  const res = await fetch(
    `https://api.twitch.tv/helix/games?name=${encodeURIComponent(categoryName)}`,
    {
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (!res.ok) return null
  const data = await res.json()
  return data.data?.[0]?.id || null
}

/** Updates live Twitch title and game category */
export async function updateTwitchChannelInfo({
  title,
  gameId,
  categoryName,
}: TwitchSyncParams): Promise<{username: string; resolvedGameId?: string}> {
  const {clientId, accessToken} = await getTwitchCredentials()

  // 1. Verify token & get Broadcaster User ID
  const user = await getTwitchUser(clientId, accessToken)
  const broadcasterId = user.id

  // 2. Resolve Game ID if missing
  let resolvedGameId = gameId
  if (!resolvedGameId && categoryName) {
    resolvedGameId = (await searchTwitchGameId(clientId, accessToken, categoryName)) || undefined
  }

  // 3. Patch Channel Info on Twitch Helix
  const token = cleanToken(accessToken)
  const patchRes = await fetch(
    `https://api.twitch.tv/helix/channels?broadcaster_id=${broadcasterId}`,
    {
      method: "PATCH",
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        ...(resolvedGameId ? {game_id: resolvedGameId} : {}),
      }),
    }
  )

  if (!patchRes.ok) {
    const err = await patchRes.json().catch(() => ({}))
    throw new Error(err.message || "Failed to update Twitch channel information.")
  }

  return {username: user.display_name, resolvedGameId}
}