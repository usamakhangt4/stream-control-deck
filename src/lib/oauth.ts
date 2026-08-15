import {generatePKCE} from "./oauth-pkce"

/** Supported streaming platforms. Kick is reserved but not implemented. */
export type Platform = "twitch" | "youtube" | "kick"

export interface PlatformTokens {
  accessToken: string
  refreshToken?: string
  clientId?: string
  clientSecret?: string
  expiresAt?: number // epoch ms
}

const TOKEN_KEYS = {
  accessToken: "access_token",
  refreshToken: "refresh_token",
  clientId: "client_id",
  clientSecret: "client_secret",
  expiresAt: "expires_at",
} as const

const SESSION_KEYS = {
  verifier: "oauth_verifier",
  state: "oauth_state",
  provider: "oauth_provider",
  clientId: "oauth_client_id",
  clientSecret: "oauth_client_secret",
} as const

function tokenKey(platform: Platform, field: string): string {
  return `oauth_${platform}_${field}`
}

/** Canonical redirect URI used by every provider. */
export function getRedirectUri(): string {
  return `${window.location.origin}/auth/callback`
}

// ---------------------------------------------------------------------------
// PKCE session lifecycle (stored in sessionStorage, cleared after exchange)
// ---------------------------------------------------------------------------

export interface OAuthSession {
  verifier: string
  state: string
  provider: Platform
  clientId: string
  clientSecret?: string
}

function persistSession(session: OAuthSession): void {
  sessionStorage.setItem(SESSION_KEYS.verifier, session.verifier)
  sessionStorage.setItem(SESSION_KEYS.state, session.state)
  sessionStorage.setItem(SESSION_KEYS.provider, session.provider)
  sessionStorage.setItem(SESSION_KEYS.clientId, session.clientId)
  if (session.clientSecret) {
    sessionStorage.setItem(SESSION_KEYS.clientSecret, session.clientSecret)
  }
}

export function readOAuthSession(): OAuthSession | null {
  const verifier = sessionStorage.getItem(SESSION_KEYS.verifier)
  const state = sessionStorage.getItem(SESSION_KEYS.state)
  const provider = sessionStorage.getItem(SESSION_KEYS.provider)
  const clientId = sessionStorage.getItem(SESSION_KEYS.clientId)

  if (!verifier || !state || !provider) return null

  return {
    verifier,
    state,
    provider: provider as Platform,
    clientId: clientId ?? "",
    clientSecret: sessionStorage.getItem(SESSION_KEYS.clientSecret) || undefined,
  }
}

export function clearOAuthSession(): void {
  Object.values(SESSION_KEYS).forEach((k) => sessionStorage.removeItem(k))
}

/**
 * Starts an authorization-code + PKCE flow for a provider.
 * Generates a fresh verifier/state, persists the session, and redirects the
 * browser to the provider's authorize URL. Returns the redirect target URL.
 */
export async function beginAuthorization(opts: {
  provider: Platform
  clientId: string
  authorizeUrl: string
  scope: string
  clientSecret?: string
  extraParams?: Record<string, string>
}): Promise<string> {
  const {verifier, challenge, state} = await generatePKCE()

  persistSession({
    verifier,
    state,
    provider: opts.provider,
    clientId: opts.clientId,
    clientSecret: opts.clientSecret,
  })

  const params = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: opts.scope,
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
    ...opts.extraParams,
  })

  return `${opts.authorizeUrl}?${params.toString()}`
}

/** Exchanges an authorization code for tokens using the stored verifier. */
export async function exchangeCode(opts: {
  tokenUrl: string
  provider: Platform
  code: string
  extraBody?: Record<string, string>
}): Promise<PlatformTokens> {
  const session = readOAuthSession()
  if (!session || !session.verifier || !session.clientId) {
    throw new Error("Missing OAuth verifier or Client ID session state.")
  }

  const body = new URLSearchParams({
    client_id: session.clientId,
    code_verifier: session.verifier,
    code: opts.code,
    grant_type: "authorization_code",
    redirect_uri: getRedirectUri(),
    ...(session.clientSecret ? {client_secret: session.clientSecret} : {}),
    ...opts.extraBody,
  })

  const res = await fetch(opts.tokenUrl, {
    method: "POST",
    headers: {"Content-Type": "application/x-www-form-urlencoded"},
    body: body.toString(),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || "Failed to exchange authorization code.")
  }

  const data = await res.json()
  const expiresAt =
    typeof data.expires_in === "number"
      ? Date.now() + data.expires_in * 1000
      : undefined

  const tokens: PlatformTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || undefined,
    clientId: session.clientId,
    clientSecret: session.clientSecret,
    expiresAt,
  }

  saveTokens(opts.provider, tokens)
  clearOAuthSession()
  return tokens
}

// ---------------------------------------------------------------------------
// Token persistence (per-platform, in localStorage)
// ---------------------------------------------------------------------------

export function saveTokens(platform: Platform, tokens: PlatformTokens): void {
  localStorage.setItem(tokenKey(platform, TOKEN_KEYS.accessToken), tokens.accessToken)
  if (tokens.refreshToken) {
    localStorage.setItem(tokenKey(platform, TOKEN_KEYS.refreshToken), tokens.refreshToken)
  }
  if (tokens.clientId) {
    localStorage.setItem(tokenKey(platform, TOKEN_KEYS.clientId), tokens.clientId)
  }
  if (tokens.clientSecret) {
    localStorage.setItem(tokenKey(platform, TOKEN_KEYS.clientSecret), tokens.clientSecret)
  }
  if (tokens.expiresAt) {
    localStorage.setItem(tokenKey(platform, TOKEN_KEYS.expiresAt), String(tokens.expiresAt))
  }
}

export function loadTokens(platform: Platform): PlatformTokens | null {
  const accessToken = localStorage.getItem(tokenKey(platform, TOKEN_KEYS.accessToken))
  if (!accessToken) return null

  const expiresAtRaw = localStorage.getItem(tokenKey(platform, TOKEN_KEYS.expiresAt))
  return {
    accessToken,
    refreshToken: localStorage.getItem(tokenKey(platform, TOKEN_KEYS.refreshToken)) || undefined,
    clientId: localStorage.getItem(tokenKey(platform, TOKEN_KEYS.clientId)) || undefined,
    clientSecret: localStorage.getItem(tokenKey(platform, TOKEN_KEYS.clientSecret)) || undefined,
    expiresAt: expiresAtRaw ? Number(expiresAtRaw) : undefined,
  }
}

export function clearTokens(platform: Platform): void {
  Object.values(TOKEN_KEYS).forEach((k) => localStorage.removeItem(tokenKey(platform, k)))
}

export function isTokenExpired(tokens: PlatformTokens): boolean {
  return typeof tokens.expiresAt === "number" && tokens.expiresAt <= Date.now()
}

/**
 * Refreshes an expired access token via the provider's token endpoint.
 * Requires an existing refresh token. Returns updated tokens and persists them.
 */
export async function refreshTokens(
  platform: Platform,
  tokenUrl: string,
  extraBody?: Record<string, string>
): Promise<PlatformTokens> {
  const current = loadTokens(platform)
  if (!current?.refreshToken) {
    throw new Error(`No refresh token available for ${platform}. Re-authenticate.`)
  }

  const body = new URLSearchParams({
    client_id: current.clientId || "",
    refresh_token: current.refreshToken,
    grant_type: "refresh_token",
    ...(current.clientSecret ? {client_secret: current.clientSecret} : {}),
    ...extraBody,
  })

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {"Content-Type": "application/x-www-form-urlencoded"},
    body: body.toString(),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || "Failed to refresh access token.")
  }

  const data = await res.json()
  const tokens: PlatformTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || current.refreshToken,
    clientId: current.clientId,
    clientSecret: current.clientSecret,
    expiresAt:
      typeof data.expires_in === "number"
        ? Date.now() + data.expires_in * 1000
        : undefined,
  }

  saveTokens(platform, tokens)
  return tokens
}
