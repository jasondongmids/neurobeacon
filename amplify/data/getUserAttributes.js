import { util } from '@aws-appsync/utils';

// function arguments ()
export function request(ctx) {
    const user = ctx.identity.sub;
    const pk = `ATTR#${user}`

    console.log('Context (Before):', ctx)
    // console.log('Limits', ctx.arguments.limit)
    // console.log('Limits', Boolean(ctx.arguments.limit))
    console.log("PK", pk)

    const queryParams = {
        operation: 'Query',
        query: {
            expression: "#us = :userStats" ,
            expressionNames: { "#us": "user_stats_pk" },
            expressionValues: util.dynamodb.toMapValues({ ":userStats": pk }),
        },
        scanIndexForward: false,
        limit: 1
    };

    return queryParams
}

export function response(ctx) {
    console.log('Context (After):', ctx)
    return ctx.result.items.length > 0 ? ctx.result.items : null;
}