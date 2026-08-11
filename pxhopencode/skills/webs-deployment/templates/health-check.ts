// app/api/health/route.ts
export async function GET() {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage().heapUsed,
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    return NextResponse.json({ ...health, status: "degraded", db: "down" }, { status: 503 });
  }

  return NextResponse.json(health);
}
