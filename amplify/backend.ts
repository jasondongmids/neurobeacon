import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { aws_dynamodb } from "aws-cdk-lib"

export const backend = defineBackend({
  auth,
  data,
});

// ✅ Connect external dynamodb tables
const extDataSourcesStack = backend.createStack("ExternalDataSources");

const userStateHxTable = aws_dynamodb.Table.fromTableName(
  extDataSourcesStack,
  "UserStateHxName",
  "UserStateHx",
)

backend.data.addDynamoDbDataSource(
  "UserStateHxTable",
  userStateHxTable
)

const gamesTable = aws_dynamodb.Table.fromTableName(
  extDataSourcesStack,
  "GamesName",
  "math-game-questions-v1",
)

backend.data.addDynamoDbDataSource(
  "GamesTable",
  gamesTable
)

const userGameHxTable = aws_dynamodb.Table.fromTableName(
  extDataSourcesStack,
  "UserGameHxName",
  "UserGameHxTest",
)

backend.data.addDynamoDbDataSource(
  "UserGameHxTable",
  userGameHxTable
)