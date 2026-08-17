import { Router } from "express";
import {
  createTodo,
  deleteTodo,
  getTodo,
  listTodos,
  updateTodo,
} from "../store/todos";
import { isValidDate, validateCreateInput, validateUpdateInput } from "../types/todo";

const router = Router();

router.get("/", (req, res) => {
  const { date } = req.query;

  if (date !== undefined) {
    if (typeof date !== "string" || !isValidDate(date)) {
      res.status(400).json({ error: "date query must be YYYY-MM-DD" });
      return;
    }
    res.json(listTodos(date));
    return;
  }

  res.json(listTodos());
});

router.get("/:id", (req, res) => {
  const todo = getTodo(req.params.id);
  if (!todo) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }
  res.json(todo);
});

router.post("/", (req, res) => {
  const result = validateCreateInput(req.body);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }

  const todo = createTodo(result.data);
  res.status(201).json(todo);
});

router.patch("/:id", (req, res) => {
  const result = validateUpdateInput(req.body);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }

  const todo = updateTodo(req.params.id, result.data);
  if (!todo) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }

  res.json(todo);
});

router.delete("/:id", (req, res) => {
  const deleted = deleteTodo(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }

  res.status(204).send();
});

export default router;
