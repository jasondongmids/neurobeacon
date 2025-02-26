import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Todo: a
    .model({
      content: a.string(),
    })
    .authorization((allow) => [allow.guest()]),

  // Define UserStateHx
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
    
    // Define Game Table
    // Game: a.customType({
    //   Difficulty: a.string().required(),
    //   "Scenario_ID": a.string().required(),
    //   "First_Val Possibilities": a.string(),
    //   "Scenario Operation": a.string(),
    //   "Scenario Text": a.string(),
    //   "Second Val Possibilities": a.string()
    // }),

    // getGame: a
    //   .query()
    //   .arguments({
    //     difficulty: a.string().required(),
    //     recent_games: a.string(),
    //     limit: a.integer()
    //   })
    //   .returns(a.ref("Game").array())
    //   .authorization(allow => [allow.authenticated()])
    //   .handler(
    //     a.handler.custom({
    //       dataSource: "GamesTable",
    //       entry: "./getGame.js"
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