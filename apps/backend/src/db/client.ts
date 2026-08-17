import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

function getTableName(): string {
  const tableName = process.env.DYNAMODB_TABLE_NAME;
  if (!tableName) {
    throw new Error("DYNAMODB_TABLE_NAME is not set");
  }
  return tableName;
}

function createDynamoDbClient(): DynamoDBDocumentClient {
  const region = process.env.AWS_REGION ?? "ap-southeast-2";
  const endpoint = process.env.DYNAMODB_ENDPOINT;

  const client = new DynamoDBClient({
    region,
    ...(endpoint
      ? {
          endpoint,
          credentials: {
            accessKeyId: "local",
            secretAccessKey: "local",
          },
        }
      : {}),
  });

  return DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  });
}

const docClient = createDynamoDbClient();

export { docClient, getTableName };
