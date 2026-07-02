import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const PUBLIC_PREFIXES = ["/login", "/setup", "/v/"]

function getSecret() {
  const pw = process.env.AUTH_PASSWORD
  if (!pw) throw new Error("AUTH_PASSWORD não definido")
  return new TextEncoder().encode(pw)
}

async function isValidToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return typeof payload.userId === "string"
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
  const token = request.cookies.get("pf_session")?.value

  if (isPublic) {
    // Usuário já autenticado não precisa ficar em /login ou /setup
    if (token && (pathname.startsWith("/login") || pathname.startsWith("/setup"))) {
      if (await isValidToken(token)) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    }
    return NextResponse.next()
  }

  // Rota protegida: exige token válido
  if (!token || !(await isValidToken(token))) {
    const url = new URL("/login", request.url)
    url.searchParams.set("from", pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
}
