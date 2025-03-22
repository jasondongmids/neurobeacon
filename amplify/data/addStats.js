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

    console.log("pk:", pk, typeof(pk))
    console.log("sk:", sk, typeof(sk))

    const item = {
        yyyymmdd: sk,
        current_streak: data.current_streak,
        longest_streak: data.longest_streak,
        // total_sessions: data.total_sessions,
        total: {
            total_questions: data.total.total_questions,
            total_correct: data.total.total_correct,
            percent_correct: data.total.percent_correct,
            current_total: data.total.current_total,
            current_correct: data.total.current_correct,
            current_percent: data.total.current_percent,  
        },
        math: {
            total_questions: data.math.total_questions,
            total_correct: data.math.total_correct,
            percent_correct: data.math.percent_correct,
            current_total: data.math.current_total,
            current_correct: data.math.current_correct,
            current_percent: data.math.current_percent, 
        },
        visual: {
            total_questions: data.visual.total_questions,
            total_correct: data.visual.total_correct,
            percent_correct: data.visual.percent_correct,
            current_total: data.visual.current_total,
            current_correct: data.visual.current_correct,
            current_percent: data.visual.current_percent, 
        },
        reaction: {
            total_questions: data.reaction.total_questions,
            total_correct: data.reaction.total_correct,
            percent_correct: data.reaction.percent_correct,
            current_total: data.reaction.current_total,
            current_correct: data.reaction.current_correct,
            current_percent: data.reaction.current_percent, 
        },
        memory: {
            total_questions: data.memory.total_questions,
            total_correct: data.memory.total_correct,
            percent_correct: data.memory.percent_correct,
            current_total: data.memory.current_total,
            current_correct: data.memory.current_correct,
            current_percent: data.memory.current_percent, 
        },
        trivia: {
            total_questions: data.trivia.total_questions,
            total_correct: data.trivia.total_correct,
            percent_correct: data.trivia.percent_correct,
            current_total: data.trivia.current_total,
            current_correct: data.trivia.current_correct,
            current_percent: data.trivia.current_percent, 
        },
        easy: {
            total_questions: data.easy.total_questions,
            total_correct: data.easy.total_correct,
            percent_correct: data.easy.percent_correct,
            current_total: data.easy.current_total,
            current_correct: data.easy.current_correct,
            current_percent: data.easy.current_percent, 
        },
        medium: {
            total_questions: data.medium.total_questions,
            total_correct: data.medium.total_correct,
            percent_correct: data.medium.percent_correct,
            current_total: data.medium.current_total,
            current_correct: data.medium.current_correct,
            current_percent: data.medium.current_percent, 
        },
        hard: {
            total_questions: data.hard.total_questions,
            total_correct: data.hard.total_correct,
            percent_correct: data.hard.percent_correct,
            current_total: data.hard.current_total,
            current_correct: data.hard.current_correct,
            current_percent: data.hard.current_percent, 
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