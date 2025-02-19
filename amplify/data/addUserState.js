import { util } from "@aws-appsync/utils";
import * as ddb from "@aws-appsync/utils/dynamodb";

// ctx objects: https://docs.aws.amazon.com/appsync/latest/devguide/resolver-context-reference-js.html
export function request(ctx) {
    // const userStat = ctx.arguments.user_stat;
    const userStat = ctx.identity.sub // example: 94f8f458-7011-70fc-7929-0f5ea032f122::94f8f458-7011-70fc-7929-0f5ea032f122
    const type = ctx.arguments.type
    // const userStat = ctx.identity.username // example: seems to be same as above
    const stat = util.time.nowISO8601(); // https://docs.aws.amazon.com/appsync/latest/devguide/time-helpers-in-util-time-js.html
    // console.log('Context:', ctx)
    const item = {
        current_streak: ctx.arguments.current_streak,
    };

    return ddb.put({
        key: { user_stat: `${type}#${userStat}`, stat },
        item: item
    });
}

export function response(ctx) {
    // console.log('Context:', ctx)
    return ctx.result
}