import { setupServer } from "msw/node";
import { handlers } from "./mocks/handlers";

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("TodoPage", () => {
  it("loads and displays todos", async () => {
    render(<TodoPage />);
    await waitFor(() => {
      expect(screen.getByText("Việc cần làm")).toBeInTheDocument();
    });
  });

  it("creates a new todo", async () => {
    render(<TodoPage />);
    await userEvent.type(screen.getByPlaceholderText("Thêm việc..."), "Việc mới{enter}");
    await waitFor(() => {
      expect(screen.getByText("Việc mới")).toBeInTheDocument();
    });
  });
});
