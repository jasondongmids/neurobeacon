import { util } from '@aws-appsync/utils';

export function request(ctx) {
    // const userStat = `STATE#${ctx.arguments?.user_stat}`;
    // console.log('Context:', ctx)
    // const userStat = ctx.arguments.user_stat
    const userStat = `${ctx.arguments.type}#${ctx.identity.sub}`
    const limit = ctx.arguments.limit

    // console.log('userStat:', userStat)

    return {
        operation: 'Query',
        query: {
            expression: "#us = :userStat" ,
            expressionNames: { "#us": "user_stat" },
            expressionValues: util.dynamodb.toMapValues({ ":userStat": userStat }),
        },
        scanIndexForward: false,
        limit: limit,
    };
}

export function response(ctx) {
    // console.log('Context (After):', ctx)
    return ctx.result.items.length > 0 ? ctx.result.items : null;
}