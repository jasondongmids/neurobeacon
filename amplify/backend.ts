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

// UserStateHx
const userStateHxTable = aws_dynamodb.Table.fromTableName(
  extDataSourcesStack,
  "UserStateHxName",
  "UserStateHxPrd",
  // "UserStateHx",
)
backend.data.addDynamoDbDataSource(
  "UserStateHxTable",
  userStateHxTable
)

// Games - not in use
const gamesTable = aws_dynamodb.Table.fromTableName(
  extDataSourcesStack,
  "GamesName",
  "math-game-questions-v1",
)
backend.data.addDynamoDbDataSource(
  "GamesTable",
  gamesTable
)

// UserGameHx
const userGameHxTable = aws_dynamodb.Table.fromTableName(
  extDataSourcesStack,
  "UserGameHxName",
  "UserGameHxPrd",
  // "UserGameHxTest",
)
backend.data.addDynamoDbDataSource(
  "UserGameHxTable",
  userGameHxTable
)

// User
const userTable = aws_dynamodb.Table.fromTableName(
  extDataSourcesStack,
  "UserStatsName",
  "UserStatsPrd",
  // "UserStatsTest"
)
backend.data.addDynamoDbDataSource(
  "UserTable",
  userTable
)