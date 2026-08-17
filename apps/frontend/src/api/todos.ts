type TodosApiConfig = {
  getAccessToken: () => Promise<string>;
  onUnauthorized?: () => void;
};

let apiConfig: TodosApiConfig | null = null;

export function configureTodosApi(config: TodosApiConfig): void {
  apiConfig = config;
}

function getApiUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) {
    throw new Error("VITE_API_URL is not set");
  }
  return apiUrl;
}

async function authHeaders(): Promise<HeadersInit> {
  if (!apiConfig) {
    throw new Error("Todos API is not configured");
  }

  const token = await apiConfig.getAccessToken();
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    apiConfig?.onUnauthorized?.();
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

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

export async function getAllTodos(): Promise<Todo[]> {
  const res = await fetch(`${getApiUrl()}/api/todos`, {
    headers: await authHeaders(),
  });
  return handleResponse<Todo[]>(res);
}

export async function createTodo(data: CreateTodoInput): Promise<Todo> {
  const res = await fetch(`${getApiUrl()}/api/todos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders()),
    },
    body: JSON.stringify(data),
  });
  return handleResponse<Todo>(res);
}

export async function updateTodo(id: string, data: UpdateTodoInput): Promise<Todo> {
  const res = await fetch(`${getApiUrl()}/api/todos/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders()),
    },
    body: JSON.stringify(data),
  });
  return handleResponse<Todo>(res);
}

export async function deleteTodo(id: string): Promise<void> {
  const res = await fetch(`${getApiUrl()}/api/todos/${id}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  await handleResponse<void>(res);
}
