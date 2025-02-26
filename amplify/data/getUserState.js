import { util } from '@aws-appsync/utils';

// function arguments (gameType, category, limit)
export function request(ctx) {
    const user = ctx.identity.sub
    const pk = (ctx.arguments.category) 
        ? `${ctx.arguments.gameType.toUpperCase()}#${ctx.arguments.category.toUpperCase()}#${user}` 
        : `${ctx.arguments.gameType.toUpperCase()}#${user}`

    const limit = (ctx.arguments.limit) ? ctx.arguments.limit : 1

    console.log('Context (Before):', ctx)
    console.log('Limit:', limit)

    return {
        operation: 'Query',
        query: {
            expression: "#us = :userState" ,
            expressionNames: { "#us": "user_state_pk" },
            expressionValues: util.dynamodb.toMapValues({ ":userState": pk }),
        },
        scanIndexForward: false,
        limit: limit,
    };
}

export function response(ctx) {
    console.log('Context (After):', ctx)
    return ctx.result.items.length > 0 ? ctx.result.items : null;
}