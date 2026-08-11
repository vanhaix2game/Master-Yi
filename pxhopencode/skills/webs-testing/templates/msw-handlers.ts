// src/test/mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/todos", () => {
    return HttpResponse.json({
      data: [
        { id: "1", title: "Việc cần làm", completed: false },
      ],
      total: 1,
    });
  }),

  http.post("/api/todos", async ({ request }) => {
    const body = await request.json() as { title: string };
    return HttpResponse.json(
      { id: "2", title: body.title, completed: false },
      { status: 201 }
    );
  }),
];
