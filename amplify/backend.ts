import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { aws_dynamodb } from "aws-cdk-lib"

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
export const backend = defineBackend({
  auth,
  data,
});

// Link external ddb tables to App
const extDataSourcesStack = backend.createStack("ExternalDataSources");

const userStateHxTable = aws_dynamodb.Table.fromTableName(
  extDataSourcesStack,
  "UserStateHxName",
  "UserStatsTest",
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