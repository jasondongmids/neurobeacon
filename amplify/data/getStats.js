import { util } from '@aws-appsync/utils';

// function arguments (frequency, limit)
export function request(ctx) {
    const user = ctx.identity.sub;
    const pk = ctx.arguments.frequency === 'daily' ? `DAILY#${user}`
        : ctx.arguments.frequency === 'weekly' ? `WEEKLY#${user}`
        : `STATS#${user}`

    console.log('Context (Before):', ctx)
    // console.log('Limits', ctx.arguments.limit)
    // console.log('Limits', Boolean(ctx.arguments.limit))

    const queryParams = {
        operation: 'Query',
        query: {
            expression: "#us = :userStats" ,
            expressionNames: { "#us": "user_stats_pk" },
            expressionValues: util.dynamodb.toMapValues({ ":userStats": pk }),
        },
        scanIndexForward: false,
    };

    if (ctx.arguments.limit > 0) {
        queryParams.limit = ctx.arguments.limit;
    }

    return queryParams
}

export function response(ctx) {
    console.log('Context (After):', ctx)
    return ctx.result.items.length > 0 ? ctx.result.items : null;
}