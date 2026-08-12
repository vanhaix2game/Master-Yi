// middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

const roles = {
  admin: ["read", "write", "delete", "manage"],
  editor: ["read", "write"],
  user: ["read"],
} as const;

type Role = keyof typeof roles;

async function requireRole(req: NextRequest, role: Role) {
  const session = await auth();
  if (!session?.user) return NextResponse.redirect(new URL("/login", req.url));
  if (!roles[session.user.role as Role]?.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export default auth((req) => {
  if (!req.auth?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
});
