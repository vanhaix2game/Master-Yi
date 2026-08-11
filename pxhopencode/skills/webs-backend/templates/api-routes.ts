// app/api/todos/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateTodoSchema = z.object({
  title: z.string().min(1).max(200),
  completed: z.boolean().optional().default(false),
});

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")));

  const [todos, total] = await Promise.all([
    prisma.todo.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.todo.count(),
  ]);

  return NextResponse.json({
    data: todos,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON không hợp lệ" }, { status: 400 });
  }

  const result = CreateTodoSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ", details: result.error.flatten() }, { status: 400 });
  }

  const todo = await prisma.todo.create({ data: result.data });
  return NextResponse.json(todo, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });

  await prisma.todo.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
