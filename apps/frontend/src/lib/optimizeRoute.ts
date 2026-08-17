import type { Todo } from "@/api/todos";
import { haversineMeters } from "@/lib/geo";

function greedyFromStart(todos: Todo[], startId: string): { order: string[]; total: number } {
  const byId = new Map(todos.map((todo) => [todo.id, todo]));
  const unvisited = new Set(todos.map((todo) => todo.id));
  const order = [startId];
  unvisited.delete(startId);

  let total = 0;
  let current = byId.get(startId)!;

  while (unvisited.size > 0) {
    let nearestId: string | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const id of unvisited) {
      const distance = haversineMeters(current.location, byId.get(id)!.location);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestId = id;
      }
    }

    order.push(nearestId!);
    unvisited.delete(nearestId!);
    total += nearestDistance;
    current = byId.get(nearestId!)!;
  }

  return { order, total };
}

export function greedyRouteOrder(todos: Todo[]): string[] {
  if (todos.length <= 1) {
    return todos.map((todo) => todo.id);
  }

  let bestOrder = todos.map((todo) => todo.id);
  let bestTotal = Number.POSITIVE_INFINITY;

  for (const todo of todos) {
    const { order, total } = greedyFromStart(todos, todo.id);
    if (total < bestTotal) {
      bestTotal = total;
      bestOrder = order;
    }
  }

  return bestOrder;
}

export function legDistancesForOrder(todos: Todo[], order: string[]): number[] {
  const byId = new Map(todos.map((todo) => [todo.id, todo]));
  const distances: number[] = [];

  for (let index = 0; index < order.length - 1; index += 1) {
    const from = byId.get(order[index]!);
    const to = byId.get(order[index + 1]!);
    if (!from || !to) {
      continue;
    }
    distances.push(haversineMeters(from.location, to.location));
  }

  return distances;
}
