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

    return ddb.update({
        key: { user_stats_pk: pk, sk: `${sk}` },
        // condition: { total_questions: { lt: data.total.total_questions }}, // comment out for testing
        // can add another condition to check sum(data.game.total_questions) == data.total_questions
        update: { 
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
            updated_at: timestamp
         }
    })
}

export function response(ctx) {
    console.log('Context (After):', ctx)
    const { error, result } = ctx;
    if (error) {
      util.appendError(error.message, error.type);
    }
    return result;
  }