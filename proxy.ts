import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"
import { AUTH_COOKIE_NAME } from "@/lib/constants"

const PROTECTED_PREFIXES = ["/dashboard", "/condominios", "/configuracoes"]

function getSecret(): Uint8Array | null {
  const password = process.env.AUTH_PASSWORD
  if (!password) return null
  return new TextEncoder().encode(password)
}

async function isValidSession(token: string): Promise<boolean> {
  const secret = getSecret()
  if (!secret) return false
  try {
    await jwtVerify(token, secret)
    return true
  } catch {
    return false
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  if (!isProtected) return NextResponse.next()

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value

  if (!token || !(await isValidSession(token))) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("from", pathname)
    const response = NextResponse.redirect(loginUrl)
    response.cookies.delete(AUTH_COOKIE_NAME)
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|s/|v/).*)"],
}
