// change plan and calculate sort key in front end due to
// 1) Appsync VTL does not support Date functions
// 2) Users what their day and weekly stats based on local time

import { util } from "@aws-appsync/utils";
import * as ddb from "@aws-appsync/utils/dynamodb";

// function arguments (frequency, yyyymmdd, data)
export function request(ctx) {
    console.log('Context (Before):', ctx)
    const user = ctx.identity.sub;
    const pk = ctx.arguments.frequency === 'daily' ? `DAILY#${user}`
        : ctx.arguments.frequency === 'weekly' ? `WEEKLY#${user}`
        : `STATS#${user}`
    const sk = `${ctx.arguments.yyyymmdd}`
    const timestamp = util.time.nowEpochSeconds()
    const data = ctx.arguments.data;

    console.log("pk:", pk)
    console.log("sk:", sk)

    const item = {
        current_streak: data.current_streak,
        longest_streak: data.longest_streak,
        // total_sessions: data.total_sessions,
        total: {
            total_questions: data.total.total_questions,
            total_correct: data.total.total_correct,
            percent_correct: data.total.percent_correct,
        },
        math: {
            total_questions: data.math.total_questions,
            total_correct: data.math.total_correct,
            percent_correct: data.math.percent_correct,
        },
        visual: {
            total_questions: data.visual.total_questions,
            total_correct: data.visual.total_correct,
            percent_correct: data.visual.percent_correct,
        },
        reaction: {
            total_questions: data.reaction.total_questions,
            total_correct: data.reaction.total_correct,
            percent_correct: data.reaction.percent_correct,
        },
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
        created_at: timestamp,
        updated_at: timestamp
    };

    return ddb.put({
        key: { user_stats_pk: pk, sk: sk },
        item: item
    });
}

export function response(ctx) {
    console.log('Context (After):', ctx)
    return ctx.result
}