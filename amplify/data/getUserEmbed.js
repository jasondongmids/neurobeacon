import { util } from '@aws-appsync/utils';
import * as ddb from "@aws-appsync/utils/dynamodb";

// function arguments () - none
export function request(ctx) {
    const user = ctx.identity.sub
    const pk = `USER#${user}`

    // const limit = (ctx.arguments.limit) ? ctx.arguments.limit : 1

    console.log('Context (Before):', ctx)
    // console.log('Limit:', limit)

    // return {
    //     operation: 'Query',
    //     query: {
    //         expression: "#us = :user" ,
    //         expressionNames: { "#us": "user_pk" },
    //         expressionValues: util.dynamodb.toMapValues({ ":user": pk }),
    //     },
    //     // scanIndexForward: false,
    //     // limit: limit,
    // };
    // return {
    //     operation: 'GetItem',
    //     key: util.dynamodb.toMapValues({ pk }),
    //     consistentRead: true
    // }

    return ddb.get({ key: { user_pk: pk }});
}

// export function response(ctx) {
//     console.log('Context (After):', ctx)
//     return ctx.result.items.length > 0 ? ctx.result.items : null;
// }

export const response = (ctx) => ctx.result;