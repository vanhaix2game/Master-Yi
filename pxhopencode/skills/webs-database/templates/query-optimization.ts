// ❌ Bad: N+1 query
const users = await prisma.user.findMany();
for (const user of users) {
  const todos = await prisma.todo.findMany({ where: { userId: user.id } });
}

// ✅ Good: include
const users = await prisma.user.findMany({
  include: { todos: true },
});

// ✅ Good: batch (nếu chỉ cần count)
const usersWithCount = await prisma.user.findMany({
  include: { _count: { select: { todos: true } } },
});

// ✅ Good: raw query cho complex case
const results = await prisma.$queryRaw`
  SELECT u.*, COUNT(t.id) as todo_count
  FROM "User" u
  LEFT JOIN "Todo" t ON t."userId" = u.id
  GROUP BY u.id
  HAVING COUNT(t.id) > $1
`, 5;
