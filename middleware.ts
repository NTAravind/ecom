import { checkpass } from "@/lib/adminauth";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  // Hash generator: runs once if HASHED_ADMIN_PASSWORD is unset.
  // After copying the hash, remove ADMIN_PASSWORD from Dokploy env vars.
  if (!process.env.HASHED_ADMIN_PASSWORD && process.env.ADMIN_PASSWORD) {
    const generatedHash = await generateHashForPassword(process.env.ADMIN_PASSWORD);
    console.log("[SETUP] Set HASHED_ADMIN_PASSWORD to:", generatedHash);
    console.log("[SETUP] Then delete ADMIN_PASSWORD from your env vars.");
  }

  if ((await isauthenticated(req)) === false) {
    return new NextResponse("UnAuthorized", { 
      status: 401, 
      headers: { "WWW-Authenticate": "Basic" } 
    });
  }
}

async function isauthenticated(req: NextRequest) {
  const authhead = req.headers.get("authorization") || req.headers.get("Authorization");
  
  if (authhead == null) {
    return false;
  }
  
  try {
    const [username, pass] = Buffer.from(authhead.split(" ")[1], "base64").toString().split(":");
    const usernameMatch = username === process.env.ADMIN_USERNAME;
    const passwordMatch = await checkpass(pass, process.env.HASHED_ADMIN_PASSWORD as string);
    return usernameMatch && passwordMatch;
  } catch (error) {
    console.error("Error parsing admin auth header:", error);
    return false;
  }
}

// Helper function to generate hash in the same environment
async function generateHashForPassword(password: string) {
  const arrayBuffer = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(password));
  return Buffer.from(arrayBuffer).toString("base64");
}

export const config = {
  matcher: "/admin/:path*",
};