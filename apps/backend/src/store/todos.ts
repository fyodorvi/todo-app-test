import { randomUUID } from "crypto";
import { DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, getTableName } from "../db/client";
import type { CreateTodoInput, Todo, UpdateTodoInput } from "../types/todo";

const TABLE_NAME = getTableName();

type TodoRecord = Todo & {
  tenantId: string;
  tenantDateKey: string;
};

function toTenantDateKey(date: string, id: string): string {
  return `${date}#${id}`;
}

function toTodo(record: TodoRecord): Todo {
  const { tenantId: _tenantId, tenantDateKey: _tenantDateKey, ...todo } = record;
  return todo;
}

export async function listTodos(tenantId: string, date?: string): Promise<Todo[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "tenant-date-index",
      KeyConditionExpression: date
        ? "#tenantId = :tenantId AND begins_with(#tenantDateKey, :datePrefix)"
        : "#tenantId = :tenantId",
      ExpressionAttributeNames: {
        "#tenantId": "tenantId",
        ...(date ? { "#tenantDateKey": "tenantDateKey" } : {}),
      },
      ExpressionAttributeValues: {
        ":tenantId": tenantId,
        ...(date ? { ":datePrefix": `${date}#` } : {}),
      },
    }),
  );

  return ((result.Items as TodoRecord[] | undefined) ?? []).map(toTodo);
}

export async function getTodo(tenantId: string, id: string): Promise<Todo | undefined> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { id },
    }),
  );

  const record = result.Item as TodoRecord | undefined;
  if (!record || record.tenantId !== tenantId) {
    return undefined;
  }

  return toTodo(record);
}

export async function createTodo(tenantId: string, input: CreateTodoInput): Promise<Todo> {
  const id = randomUUID();
  const record: TodoRecord = {
    id,
    ...input,
    tenantId,
    tenantDateKey: toTenantDateKey(input.date, id),
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: record,
    }),
  );

  return toTodo(record);
}

export async function updateTodo(
  tenantId: string,
  id: string,
  input: UpdateTodoInput,
): Promise<Todo | undefined> {
  const existing = await getTodoRecord(tenantId, id);
  if (!existing) {
    return undefined;
  }

  const updated: TodoRecord = {
    ...existing,
    ...input,
    tenantDateKey: toTenantDateKey(input.date ?? existing.date, id),
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: updated,
    }),
  );

  return toTodo(updated);
}

export async function deleteTodo(tenantId: string, id: string): Promise<boolean> {
  const existing = await getTodoRecord(tenantId, id);
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

async function getTodoRecord(tenantId: string, id: string): Promise<TodoRecord | undefined> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { id },
    }),
  );

  const record = result.Item as TodoRecord | undefined;
  if (!record || record.tenantId !== tenantId) {
    return undefined;
  }

  return record;
}

export async function isTodosTableReachable(): Promise<boolean> {
  try {
    await docClient.send(
      new DescribeTableCommand({
        TableName: TABLE_NAME,
      }),
    );
    return true;
  } catch {
    return false;
  }
}
