import { util } from "@aws-appsync/utils";
import * as ddb from "@aws-appsync/utils/dynamodb";

// ctx objects: https://docs.aws.amazon.com/appsync/latest/devguide/resolver-context-reference-js.html
// function arguments (gameType, category, data)
export function request(ctx) {
    console.log('Context (Before):', ctx) 
    const user = ctx.identity.sub; // example: 94f8f458-7011-70fc-7929-0f5ea032f122::94f8f458-7011-70fc-7929-0f5ea032f122
    // const pk = `${ctx.arguments.prefix}#${user}`
    const pk = (ctx.arguments.category) 
        ? `${ctx.arguments.gameType.toUpperCase()}#${ctx.arguments.category.toUpperCase()}#${user}` 
        : `${ctx.arguments.gameType.toUpperCase()}#${user}`;
    const sk = util.time.nowEpochSeconds(); // https://docs.aws.amazon.com/appsync/latest/devguide/time-helpers-in-util-time-js.html
    const data = ctx.arguments.data;
// review logs in CloudWatch
    // console.log("USER EMBEDDING", data.user_embedding)

    const item = (ctx.arguments.category) 
        ? {
        state_type: "category",
        game: data.game,
        category: {
            category: data.category.category,
            total_questions: data.category.total_questions,
            total_correct: data.category.total_correct,
            percent_correct: data.category.percent_correct,
        },
        created_at: sk,
        updated_at: sk
        } 
        : {
        state_type: "state",
        prev_is_slow: data.prev_is_slow,
        prev_is_correct: data.prev_is_correct,
        total_questions: data.total_questions,
        total_correct: data.total_correct,
        percent_correct: data.percent_correct,
        total_elapsed_time: data.total_elapsed_time,
        average_user_time: data.average_user_time,
        score: data.score,
        reward_weight: data.reward_weight,
        reward: data.reward,
        reward_weight_cumulative: data.reward_weight_cumulative,
        reward_cumulative: data.reward_cumulative,
        total_weighted_reward: data.total_weighted_reward,
        difficulty: data.difficulty,
        predicted_difficulty: data.predicted_difficulty,
        target_difficulty: data.target_difficulty,
        game_type: data.game_type,
        category: {
            category: data.category.category,
            total_questions: data.category.total_questions,
            total_correct: data.category.total_correct,
            percent_correct: data.category.percent_correct,
        },
        user_embedding: {
            easy_percent: data.user_embedding.easy_percent,
            medium_percent: data.user_embedding.medium_percent,
            hard_percent: data.user_embedding.hard_percent,
        },
        created_at: sk,
        updated_at: sk
        };

    return ddb.put({
        key: { user_state_pk: pk, sk: `${sk}` },
        item: item
    });
}

export function response(ctx) {
    console.log('Context (After):', ctx)
    return ctx.result
}