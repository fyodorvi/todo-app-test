import { randomUUID } from "crypto";
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, getTableName } from "../db/client";
import type { CreateTodoInput, Todo, UpdateTodoInput } from "../types/todo";

const TABLE_NAME = getTableName();

export async function listTodos(date?: string): Promise<Todo[]> {
  if (date) {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "date-index",
        KeyConditionExpression: "#date = :date",
        ExpressionAttributeNames: {
          "#date": "date",
        },
        ExpressionAttributeValues: {
          ":date": date,
        },
      }),
    );

    return (result.Items as Todo[] | undefined) ?? [];
  }

  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
    }),
  );

  return (result.Items as Todo[] | undefined) ?? [];
}

export async function getTodo(id: string): Promise<Todo | undefined> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { id },
    }),
  );

  return result.Item as Todo | undefined;
}

export async function createTodo(input: CreateTodoInput): Promise<Todo> {
  const todo: Todo = {
    id: randomUUID(),
    ...input,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: todo,
    }),
  );

  return todo;
}

export async function updateTodo(id: string, input: UpdateTodoInput): Promise<Todo | undefined> {
  const existing = await getTodo(id);
  if (!existing) {
    return undefined;
  }

  const updated: Todo = { ...existing, ...input };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: updated,
    }),
  );

  return updated;
}

export async function deleteTodo(id: string): Promise<boolean> {
  const existing = await getTodo(id);
  if (!existing) {
    return false;
  }

  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { id },
    }),
  );

  return true;
}

export async function isTodosTableReachable(): Promise<boolean> {
  try {
    await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        Limit: 1,
      }),
    );
    return true;
  } catch {
    return false;
  }
}
