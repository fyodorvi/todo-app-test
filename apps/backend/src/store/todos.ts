import { randomUUID } from "crypto";
import type { CreateTodoInput, Todo, UpdateTodoInput } from "../types/todo";

const todos = new Map<string, Todo>();

export function listTodos(date?: string): Todo[] {
  const all = Array.from(todos.values());
  if (!date) {
    return all;
  }
  return all.filter((todo) => todo.date === date);
}

export function getTodo(id: string): Todo | undefined {
  return todos.get(id);
}

export function createTodo(input: CreateTodoInput): Todo {
  const todo: Todo = {
    id: randomUUID(),
    ...input,
  };
  todos.set(todo.id, todo);
  return todo;
}

export function updateTodo(id: string, input: UpdateTodoInput): Todo | undefined {
  const existing = todos.get(id);
  if (!existing) {
    return undefined;
  }

  const updated: Todo = { ...existing, ...input };
  todos.set(id, updated);
  return updated;
}

export function deleteTodo(id: string): boolean {
  return todos.delete(id);
}
