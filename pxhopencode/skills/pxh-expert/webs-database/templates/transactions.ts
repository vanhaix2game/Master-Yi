async function createUserWithTodos(email: string, todoTitles: string[]) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, name: email.split("@")[0], password: "hashed" },
    });

    const todos = await Promise.all(
      todoTitles.map(title =>
        tx.todo.create({ data: { title, userId: user.id } })
      )
    );

    return { user, todos };
  });
}
