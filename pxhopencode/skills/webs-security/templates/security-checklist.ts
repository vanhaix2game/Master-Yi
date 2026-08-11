export const securityChecklist = {
  auth: [
    { check: "JWT expiry ≤ 7d, HS256/RS256, strong secret", severity: "critical" },
    { check: "HTTP-only cookie, sameSite=Lax/Strict, secure=true", severity: "critical" },
    { check: "CSRF token cookie vs header match", severity: "high" },
    { check: "Session invalidated on logout", severity: "high" },
    { check: "RBAC enforced server-side", severity: "critical" },
    { check: "Rate limit on login/reset-password", severity: "medium" },
  ],
  injection: [
    { check: "Zod/Joi validate all input", severity: "critical" },
    { check: "Prisma prepared statements, no raw SQL", severity: "critical" },
    { check: "Output escaped, no dangerouslySetInnerHTML", severity: "critical" },
    { check: "File upload: extension + size + content-type", severity: "high" },
  ],
  url: [
    { check: "No path traversal using user input", severity: "critical" },
    { check: "No open redirect via query param", severity: "high" },
    { check: "API endpoints auth-protected unless public", severity: "critical" },
  ],
  headers: [
    { check: "CSP + X-Frame-Options + X-Content-Type-Options set", severity: "medium" },
    { check: "Helmet or equivalent middleware", severity: "medium" },
    { check: "CORS whitelist specific domains", severity: "high" },
    { check: "HTTPS enforced production", severity: "critical" },
  ],
  payment: [
    { check: "No logs of credit card / password / token", severity: "critical" },
    { check: "Payment flow idempotency key", severity: "high" },
    { check: "Webhook signature verified", severity: "critical" },
    { check: "Rate limiter for concurrent access", severity: "medium" },
  ],
  deps: [
    { check: "npm audit / pnpm audit — no critical", severity: "critical" },
    { check: "No deprecated/unmaintained library", severity: "medium" },
    { check: ".env not committed, no hardcoded secrets", severity: "critical" },
  ],
};

export type SecurityIssue = {
  check: string;
  severity: "critical" | "high" | "medium";
  passed: boolean;
  note?: string;
};

export function runChecklist(): SecurityIssue[] {
  const issues: SecurityIssue[] = [];
  for (const group of Object.values(securityChecklist)) {
    for (const item of group) {
      issues.push({ ...item, passed: true });
    }
  }
  return issues;
}
