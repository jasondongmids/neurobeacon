import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // ✅ UserStateHx schema, mutations, and queries
  UserStateHx: a.customType({
      user_state_pk: a.string().required(),
      sk: a.string().required(),
      prev_is_slow: a.boolean(),
      prev_is_correct: a.boolean(),
      total_questions: a.integer(),
      total_correct: a.integer(),
      percent_correct: a.float(),
      total_elapsed_time: a.integer(),
      average_user_time: a.float(),
      // difficulty: a.string(),
      // predicted_difficulty: a.string(),
      created_at: a.integer(),
      updated_at: a.integer()
    }),  

  addUserState: a
    .mutation()
    .arguments({
      // prefix: a.string().required(),
      gameType: a.string().required(),
      category: a.string(),
      data: a.json(),
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
      gameType: a.string().required(),
      category: a.string(),
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

  // ✅ UserStats schema, mutations, and queries; same ddb table as UserStateHx
  UserStats: a.customType({
    user_state_pk: a.string().required(),
    sk: a.string().required(),
    // current_streak: a.integer(),
    // days_on_platform: a.integer(),
    total_sessions: a.integer(),
    total: a.json(),
    math: a.json(),
    visual: a.json(),
    reaction: a.json(),
    created_at: a.integer(),
    updated_at: a.integer()
  }),  

  addStats: a
    .mutation()
    .arguments({
      frequency: a.string(),
      yyyymmdd: a.string(), // yyyymmdd for current day or sunday
      data: a.json(),
    })
    .returns(a.ref("UserStats"))
    .authorization(allow => [allow.authenticated()])
    .handler(
      a.handler.custom({
        dataSource: "UserStateHxTable",
        entry: "./addStats.js",
      })
    ),

  getStats: a
    .query()
    .arguments({
      frequency: a.string(),
      limit: a.integer(),
    })
    .returns(a.ref("UserStats").array())
    .authorization(allow => [allow.authenticated()])
    .handler(
      a.handler.custom({
        dataSource: "UserStateHxTable",
        entry: "./getStats.js",
      })
    ),

  updateStats: a
    .mutation()
    .arguments({
      frequency: a.string(),
      yyyymmdd: a.string(),
      data: a.json(),
    })
    .returns(a.ref("UserStats"))
    .authorization(allow => [allow.authenticated()])
    .handler(
      a.handler.custom({
        dataSource: "UserStateHxTable",
        entry: "./updateStats.js"
      })
    ),

  // ✅ UserGameHx schema, mutations, and queries
  UserGameHx: a.customType({
    user_game_pk: a.string().required(),
    sk: a.string().required(),
    question_id: a.string(),
    question_type: a.string(),
    question_category: a.string(),
    difficulty: a.integer(),
    game_time_ms: a.integer(),
    session_id: a.string(),
    session_time_ms: a.integer(),
    attempt: a.integer(),
    user_answer: a.string(),
    is_correct: a.boolean(),
    created_at: a.integer(),
    updated_at: a.integer()
  }),

  // addGameHx: a
  // .mutation()
  // .arguments({
  //   data: a.json(),
  // })
  // .returns(a.ref("UserGameHx"))
  // .authorization(allow => [allow.authenticated()])
  // .handler(
  //   a.handler.custom({
  //     dataSource: "UserGameHxTable",
  //     entry: "./addGameHx.js",
  //   })
  // ),

//   transactData: a
//   .mutation()
//   .arguments({
//     gameType: a.string().required(),
//     category: a.string(),
//     gameData: a.json(),
//     categoryData: a.json(),
//   })
//   .returns(a.string())
//   .authorization(allow => [allow.authenticated()])
//   .handler(
//     a.handler.custom({
//       entry: "./transactData.js"
//     })
//   ),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});