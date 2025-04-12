import { util } from "@aws-appsync/utils";
import * as ddb from "@aws-appsync/utils/dynamodb";

// function arguments (data)
export function request(ctx) {
    console.log('Context (Before):', ctx)
    const user = ctx.identity.sub;
    const pk = `ATTR#${user}`
    const sk = `${ctx.arguments.yyyymmdd}`
    const timestamp = util.time.nowEpochSeconds()
    const data = ctx.arguments.data;

    console.log("pk:", pk, typeof(pk))
    console.log("sk:", sk, typeof(sk))

    const item = {
        nickname: data.nickname,
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