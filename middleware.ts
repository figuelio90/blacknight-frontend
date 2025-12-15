import { NextResponse, NextRequest } from "next/server";

function decodeJWT(token: string) {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(Buffer.from(payload, "base64").toString());
    return decoded;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  // Si no hay token => login
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Decodificar token SIN librerías (compatible Edge)
  const decoded = decodeJWT(token);

  if (!decoded) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Verificar expiración (si existe)
  if (decoded.exp && decoded.exp * 1000 < Date.now()) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Verificar rol ADMIN
  if (decoded.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
