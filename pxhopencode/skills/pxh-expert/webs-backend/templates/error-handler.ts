export class AppError extends Error {
  constructor(public statusCode: number, message: string, public details?: unknown) {
    super(message);
    this.name = "AppError";
  }
}

export function handleError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: error.statusCode }
    );
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: "Dữ liệu không hợp lệ", details: error.flatten() },
      { status: 400 }
    );
  }

  console.error("[Unhandled]", error);
  return NextResponse.json({ error: "Lỗi máy chủ nội bộ" }, { status: 500 });
}
