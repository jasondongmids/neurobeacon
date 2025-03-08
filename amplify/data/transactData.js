// Amplify does not recognize operation...
import { util } from "@aws-appsync/utils";
import * as ddb from "@aws-appsync/utils/dynamodb";

export function request(ctx) {
    console.log('Context (Before):', ctx)
    console.log('DDB functions', ddb)

    const timestamp = util.time.nowEpochSeconds();
    const timestamp_str = `${timestamp}`;
    const user = ctx.identity.sub;
    const game_state_pk = `${ctx.arguments.gameType.toUpperCase()}#${user}`;
    const category_state_pk = `${ctx.arguments.gameType.toUpperCase()}#${ctx.arguments.category.toUpperCase()}#${user}`;
    const gameData = ctx.arguments.gameData;
    const categoryData = ctx.arguments.categoryData;

    return {
        version: "2018-05-29",
        operation: 'BatchWriteItem',
        tables: {
            UserStateHx: [
            // Add GAME# state data    
                util.dynamodb.toMapValues({
                    user_state_pk: game_state_pk,
                    sk: timestamp_str ,
                    prev_is_slow: gameData.prev_is_slow,
                    prev_is_correct: gameData.prev_is_correct,
                    total_questions: gameData.total_questions,
                    total_correct: gameData.total_correct,
                    percent_correct: gameData.percent_correct,
                    total_elapsed_time: gameData.total_elapsed_time,
                    average_user_time: gameData.average_user_time,
                    created_at: timestamp,
                    updated_at: timestamp            
                }),
            // Add GAME#CATEGORY state data
                util.dynamodb.toMapValues({
                    user_state_pk: category_state_pk,
                    sk: timestamp_str,
                    total_questions: categoryData.total_questions,
                    total_correct: categoryData.total_correct,
                    percent_correct: categoryData.percent_correct,
                    created_at: timestamp,
                    updated_at: timestamp
                }),
            ]
        }
    }
}

export function response(ctx) {
    if (ctx.error) {
        return util.error("Transaction failed", ctx.error);
    }
    return {message: "Transaction completed"}
}