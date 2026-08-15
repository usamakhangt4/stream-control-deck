import {
  beginAuthorization,
  exchangeCode,
  refreshTokens,
  getRedirectUri,
} from "./oauth"
import type {PlatformTokens} from "./oauth"

const TWITCH_AUTHORIZE_URL = "https://id.twitch.tv/oauth2/authorize"
const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token"

const TWITCH_SCOPES = [
  "channel:manage:broadcast",
  "user:read:email",
  "channel:read:subscriptions",
].join(" ")

/** Empty sentinel — users must register their own Client ID. */
export const DEFAULT_TWITCH_CLIENT_ID = ""

/** Starts the Twitch OAuth browser redirect. Returns the redirect URL. */
export async function startTwitchOAuth(customClientId?: string): Promise<string> {
  const clientId =
    customClientId ||
    localStorage.getItem("oauth_twitch_client_id") ||
    import.meta.env.VITE_TWITCH_CLIENT_ID ||
    DEFAULT_TWITCH_CLIENT_ID

  if (!clientId) {
    throw new Error("Twitch Client ID is missing.")
  }

  return beginAuthorization({
    provider: "twitch",
    clientId,
    authorizeUrl: TWITCH_AUTHORIZE_URL,
    scope: TWITCH_SCOPES,
  })
}

/** Exchanges the authorization code for Twitch tokens and persists them. */
export async function exchangeTwitchCode(code: string): Promise<PlatformTokens> {
  return exchangeCode({
    provider: "twitch",
    tokenUrl: TWITCH_TOKEN_URL,
    code,
  })
}

/** Refreshes an expired Twitch access token. */
export async function refreshTwitchToken(): Promise<PlatformTokens> {
  return refreshTokens("twitch", TWITCH_TOKEN_URL)
}

export {getRedirectUri}
