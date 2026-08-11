import { QueryClient, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

interface Todo { id: string; title: string; completed: boolean; }

function useTodos(page = 1) {
  return useQuery({
    queryKey: ["todos", "list", page],
    queryFn: async ({ signal }) => {
      const res = await fetch(`/api/todos?page=${page}`, { signal });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<{ data: Todo[]; total: number }>;
    },
    placeholderData: keepPreviousData,
  });
}

function useCreateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json() as Promise<Todo>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}
