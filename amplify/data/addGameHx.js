import { util } from "@aws-appsync/utils";
import * as ddb from "@aws-appsync/utils/dynamodb";

// function arguments (data)
export function request(ctx) {
    console.log('Context (GameHx before):', ctx) 
    const user = ctx.identity.sub;
    const pk = `UGHX#${user}`
    const sk = util.time.nowEpochSeconds();
    const data = ctx.arguments.data;

    const item = {
        question_id: data.question_id,
        question_type: data.question_type,
        question_category: data.question_category,
        difficulty: data.difficulty,
        game_time_ms: data.game_time_ms,
        session_id: data.session_id,
        session_time_ms: data.session_time_ms,
        attempt: data.attempt,
        user_answer: data.user_answer,
        is_correct: data.is_correct,
        score: data.score,
        created_at: sk,
        updated_at: sk
    };

    return ddb.put({
        key: { user_game_pk: pk, sk: `${sk}` },
        item: item
    });
}

export function response(ctx) {
    console.log('Context (GameHx after):', ctx)
    return ctx.result
}