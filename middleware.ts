import { checkpass } from "@/lib/adminauth";
import { NextRequest, NextResponse } from "next/server";
export async function middleware(req: NextRequest) {
  if ((await isauthenticated(req)) === false) {
    return new NextResponse("UnAuthorized", { status: 401, headers: { "WWW-Authenticate": "Basic" }, })
  }
}

async function isauthenticated(req: NextRequest) {
  const authhead = req.headers.get("authorization") || req.headers.get("Authorization")

  if (authhead == null) return false

  const [username, pass] = Buffer.from(authhead.split(" ")[1], "base64").toString().split(":")
  return username === process.env.ADMIN_USERNAME && (await checkpass(pass, process.env.HASHED_ADMIN_PASSWORD as string))
}

export const config = {
  matcher: "/admin/:path*",
}
