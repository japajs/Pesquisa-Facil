import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE } from "./constants"
import type { SessionUser, UserPerfil } from "@/types"

function getSecret(): Uint8Array {
  const password = process.env.AUTH_PASSWORD
  if (!password) throw new Error("AUTH_PASSWORD não está configurado")
  return new TextEncoder().encode(password)
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({
    userId: user.userId,
    email: user.email,
    nome: user.nome,
    perfil: user.perfil,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${AUTH_COOKIE_MAX_AGE}s`)
    .sign(getSecret())

  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: AUTH_COOKIE_MAX_AGE,
    path: "/",
  })
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_COOKIE_NAME)
}

export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(AUTH_COOKIE_NAME)?.value
}

export async function getSession(): Promise<SessionUser | null> {
  const token = await getSessionToken()
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret())
    const { userId, email, nome, perfil } = payload
    if (
      typeof userId !== "string" ||
      typeof email !== "string" ||
      typeof nome !== "string" ||
      typeof perfil !== "string"
    ) {
      return null
    }
    return { userId, email, nome, perfil: perfil as UserPerfil }
  } catch {
    return null
  }
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getSession()) !== null
}
