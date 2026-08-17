export type TodoState = "todo" | "scheduled" | "done";

export interface TodoLocation {
  text: string;
  shortText?: string;
  lat: number;
  lon: number;
}

export interface Todo {
  id: string;
  title: string;
  state: TodoState;
  location: TodoLocation;
  date: string;
}

export interface CreateTodoInput {
  title: string;
  state: TodoState;
  location: TodoLocation;
  date: string;
}

export type UpdateTodoInput = Partial<CreateTodoInput>;

function getApiUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) {
    throw new Error("VITE_API_URL is not set");
  }
  return apiUrl;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export async function getAllTodos(): Promise<Todo[]> {
  const res = await fetch(`${getApiUrl()}/api/todos`);
  return handleResponse<Todo[]>(res);
}

export async function createTodo(data: CreateTodoInput): Promise<Todo> {
  const res = await fetch(`${getApiUrl()}/api/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<Todo>(res);
}

export async function updateTodo(id: string, data: UpdateTodoInput): Promise<Todo> {
  const res = await fetch(`${getApiUrl()}/api/todos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<Todo>(res);
}

export async function deleteTodo(id: string): Promise<void> {
  const res = await fetch(`${getApiUrl()}/api/todos/${id}`, {
    method: "DELETE",
  });
  await handleResponse<void>(res);
}
