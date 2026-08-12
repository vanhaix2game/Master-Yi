async function paginateTodos(cursor?: string, limit = 10) {
  const todos = await prisma.todo.findMany({
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, completed: true, createdAt: true },
  });

  const hasMore = todos.length > limit;
  if (hasMore) todos.pop();

  return {
    data: todos,
    nextCursor: hasMore ? todos[todos.length - 1].id : null,
  };
}
