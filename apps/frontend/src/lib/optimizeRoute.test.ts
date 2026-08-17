import { describe, expect, it } from "vitest";
import type { Todo } from "@/api/todos";
import { greedyRouteOrder, legDistancesForOrder } from "./optimizeRoute";

function makeTodo(id: string, lat: number, lon: number): Todo {
  return {
    id,
    title: id,
    state: "scheduled",
    date: "2026-08-17",
    location: { text: id, lat, lon },
  };
}

describe("greedyRouteOrder", () => {
  it("returns ids unchanged for zero or one todo", () => {
    expect(greedyRouteOrder([])).toEqual([]);
    expect(greedyRouteOrder([makeTodo("a", -36.8485, 174.7633)])).toEqual(["a"]);
  });

  it("orders three nearby stops by nearest neighbor", () => {
    const north = makeTodo("north", -36.817, 174.745);
    const cbd = makeTodo("cbd", -36.8485, 174.7633);
    const south = makeTodo("south", -36.869, 174.7772);

    const order = greedyRouteOrder([north, cbd, south]);
    expect(order).toHaveLength(3);
    expect(new Set(order)).toEqual(new Set(["north", "cbd", "south"]));

    const distances = legDistancesForOrder([north, cbd, south], order);
    expect(distances).toHaveLength(2);
    expect(distances.every((distance) => distance > 0)).toBe(true);
  });
});
