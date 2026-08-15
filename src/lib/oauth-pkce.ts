export interface PKCEPair {
  verifier: string
  challenge: string
  state: string
}

/** Generates a random PKCE verifier, SHA-256 challenge, and CSRF state string */
export async function generatePKCE(): Promise<PKCEPair> {
  // 1. Generate random 32-byte verifier
  const verifierArray = new Uint8Array(32)
  window.crypto.getRandomValues(verifierArray)
  const verifier = Array.from(verifierArray, (b) =>
    b.toString(16).padStart(2, "0")
  ).join("")

  // 2. Hash verifier with SHA-256
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await window.crypto.subtle.digest("SHA-256", data)

  // 3. Base64URL encode the SHA-256 digest
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")

  // 4. Generate random CSRF state string
  const stateArray = new Uint8Array(16)
  window.crypto.getRandomValues(stateArray)
  const state = Array.from(stateArray, (b) =>
    b.toString(16).padStart(2, "0")
  ).join("")

  return {verifier, challenge, state}
}