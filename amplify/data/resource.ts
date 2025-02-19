import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Todo: a
    .model({
      content: a.string(),
    })
    .authorization((allow) => [allow.guest()]),

  // Define UserStateHx
  UserStateHx: a.customType({
      user_stat: a.string().required(),
      stat: a.string().required(),
      current_streak: a.integer(),
      total_questions: a.integer(),
      state: a.integer(),
      prev_is_slow: a.integer(),
      prev_is_correct: a.integer(),
      elapsed_time_total: a.integer(),
      timestamp_created: a.datetime()
    }),  

  addUserState: a
    .mutation()
    .arguments({
      type: a.string().required(),
      current_streak: a.integer(),
    })
    .returns(a.ref("UserStateHx")) // how to return an array .returns([a.ref("UserStateHx")])
    .authorization(allow => [allow.authenticated()])
    .handler(
      a.handler.custom({
        dataSource: "UserStateHxTable",
        entry: "./addUserState.js", // linked with resolver file in AWS AppSync API
      })
    ),

  getUserState: a
    .query()
    .arguments({
      type: a.string().required(),
      // user_stat: a.string().required(),
      limit: a.integer(),
    })
    .returns(a.ref("UserStateHx").array())
    .authorization(allow => [allow.authenticated()])
    .handler(
      a.handler.custom({
        dataSource: "UserStateHxTable",
        entry: "./getUserState.js"
      })
    ),    
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
