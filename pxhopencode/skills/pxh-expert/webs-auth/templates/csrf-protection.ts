// API route CSRF check
import { cookies } from "next/headers";

export async function validateCSRF(request: Request) {
  const cookieStore = await cookies();
  const csrfCookie = cookieStore.get("csrf-token")?.value;
  const csrfHeader = request.headers.get("x-csrf-token");

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    throw new AppError(403, "Invalid CSRF token");
  }
}
