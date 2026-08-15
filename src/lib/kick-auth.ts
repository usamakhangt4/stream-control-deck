import {
  beginAuthorization,
  exchangeCode,
  refreshTokens,
  getRedirectUri,
  loadTokens,
  isTokenExpired,
} from "./oauth"
import type {PlatformTokens} from "./oauth"

const KICK_AUTHORIZE_URL = "https://id.kick.com/oauth/authorize"
const KICK_TOKEN_URL = "https://id.kick.com/oauth/token"

/**
 * Scopes required to read the user's channel and update its livestream
 * metadata (title + category). Kick always requires a client secret during
 * the code exchange, even with PKCE.
 */
const KICK_SCOPES = ["user:read", "channel:read", "channel:write"].join(" ")

/** Empty sentinel — users must register their own Kick App credentials. */
export const DEFAULT_KICK_CLIENT_ID = ""

/**
 * Starts the Kick OAuth browser redirect. Returns the redirect URL.
 * Kick requires both a Client ID and Client Secret (sent client-side, but
 * only ever stored in localStorage and used directly by this client).
 */
export async function startKickOAuth(
  customClientId?: string,
  customClientSecret?: string
): Promise<string> {
  const clientId =
    customClientId ||
    localStorage.getItem("oauth_kick_client_id") ||
    import.meta.env.VITE_KICK_CLIENT_ID ||
    DEFAULT_KICK_CLIENT_ID
  const clientSecret =
    customClientSecret ||
    localStorage.getItem("oauth_kick_client_secret") ||
    import.meta.env.VITE_KICK_CLIENT_SECRET ||
    ""

  if (!clientId) {
    throw new Error("Kick Client ID is missing.")
  }

  return beginAuthorization({
    provider: "kick",
    clientId,
    clientSecret,
    authorizeUrl: KICK_AUTHORIZE_URL,
    scope: KICK_SCOPES,
  })
}

/** Exchanges the authorization code for Kick tokens and persists them. */
export async function exchangeKickCode(code: string): Promise<PlatformTokens> {
  return exchangeCode({
    provider: "kick",
    tokenUrl: KICK_TOKEN_URL,
    code,
  })
}

/** Refreshes an expired Kick access token. */
export async function refreshKickToken(): Promise<PlatformTokens> {
  return refreshTokens("kick", KICK_TOKEN_URL)
}

/**
 * Returns a valid Kick access token, refreshing first if expired.
 * Throws if no token exists or it cannot be refreshed.
 */
export async function getKickAccessToken(): Promise<string> {
  const tokens = loadTokens("kick")
  if (!tokens) throw new Error("Kick not connected.")

  if (isTokenExpired(tokens)) {
    const refreshed = await refreshKickToken()
    return refreshed.accessToken
  }
  return tokens.accessToken
}

export {getRedirectUri}
