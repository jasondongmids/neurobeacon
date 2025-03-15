import { util } from "@aws-appsync/utils";
import * as ddb from "@aws-appsync/utils/dynamodb";

// function arguments (data)
export function request(ctx) {
    console.log('Context (GameHx before):', ctx) 
    const user = ctx.identity.sub;
    const pk = `USER#${user}`
    const sk = util.time.nowEpochSeconds();
    const data = ctx.arguments.data;

    const item = {
        easy: {
            total_questions: data.easy.total_questions,
            total_correct: data.easy.total_correct,
            percent_correct: data.easy.percent_correct,
        },
        medium: {
            total_questions: data.medium.total_questions,
            total_correct: data.medium.total_correct,
            percent_correct: data.medium.percent_correct,    
        },
        hard: {
            total_questions: data.hard.total_questions,
            total_correct: data.hard.total_correct,
            percent_correct: data.hard.percent_correct,    
        },
        created_at: sk,
        updated_at: sk
    };

    return ddb.put({
        // key: { user_game_pk: pk, sk: `${sk}` },
        key: { user_pk: pk },
        item: item
    });
}

export function response(ctx) {
    console.log('Context (GameHx after):', ctx)
    return ctx.result
}