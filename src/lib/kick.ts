import {getKickAccessToken} from "./kick-auth"

const KICK_API_URL = "https://api.kick.com"

export interface KickChannel {
  id: number
  user_id: number
  slug: string
  name: string
  description?: string
  profile_picture_url?: string
  category?: {
    id: number
    name: string
  }
}

/**
 * Fetches the currently-authenticated Kick user's channel. Kick's
 * "Get Channels" endpoint returns the current user's channel when called
 * with no parameters.
 */
export async function getKickChannel(accessToken: string): Promise<KickChannel> {
  const res = await fetch(`${KICK_API_URL}/public/v1/channels`, {
    headers: {Authorization: `Bearer ${accessToken}`},
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      (err as {message?: string}).message || "Failed to fetch Kick channel."
    )
  }

  const body = await res.json()
  const channel = body?.data?.[0]
  if (!channel) {
    throw new Error("No Kick channel found for this token.")
  }

  return channel
}

export interface KickSyncParams {
  title: string
  categoryId?: string
  categoryName?: string
}

/**
 * Resolves a Kick category ID from its name (e.g. "Dota 2" -> "2").
 * Uses the public Categories endpoint, which requires only a valid token.
 */
export async function searchKickCategoryId(
  accessToken: string,
  categoryName: string
): Promise<string | null> {
  const url = new URL(`${KICK_API_URL}/public/v1/categories`)
  url.searchParams.set("name", categoryName)

  const res = await fetch(url.toString(), {
    headers: {Authorization: `Bearer ${accessToken}`},
  })
  if (!res.ok) return null

  const body = await res.json()
  const match = body?.data?.find(
    (c: {name?: string}) =>
      c.name?.toLowerCase() === categoryName.toLowerCase()
  )
  return match?.id != null ? String(match.id) : null
}

/**
 * Updates the livestream metadata (title + category) for the current
 * Kick channel via PATCH /public/v1/channels/{channel_id}.
 */
export async function updateKickChannelInfo({
  title,
  categoryId,
  categoryName,
}: KickSyncParams): Promise<{username: string}> {
  const accessToken = await getKickAccessToken()

  // Resolve a numeric category ID from a name if one wasn't provided
  let resolvedCategoryId = categoryId
  if (!resolvedCategoryId && categoryName) {
    resolvedCategoryId =
      (await searchKickCategoryId(accessToken, categoryName)) || undefined
  }

  // Fetch the current user's channel to get the channel_id and slug.
  const channel = await getKickChannel(accessToken)

  const payload: Record<string, unknown> = {title}
  if (resolvedCategoryId) {
    payload.category_id = Number(resolvedCategoryId)
  }

  const res = await fetch(
    `${KICK_API_URL}/public/v1/channels/${channel.id}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      (err as {message?: string}).message ||
        "Failed to update Kick channel metadata."
    )
  }

  return {username: channel.slug || channel.name}
}
