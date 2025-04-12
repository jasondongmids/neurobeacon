import { post } from "aws-amplify/api";

// HARD CODED VALUES
const difficultyMapping = {
    easy: 0,
    medium: 1,
    hard: 2
}

const isSlowThresholds = {
    math: 5000, // review
    memory: 2000,
    reaction: 1000,
    sudoku: 100000, // review
    trivia: 10000, // review
}

const gameTypeMapping = {
    math: 0,
    memory: 1,
    reaction: 2,
    // sudoku: 6,
    // trivia: 7
    sudoku: 1,
    trivia: 2
}

const minMaxThresholds = {
    total_questions: {min: 1, max: 1750},
    total_correct: {min: 1, max: 1530},
    average_user_time: {min: 0, max: 45000000},
    }

// FUNCTIONS FOR REWARDS
export function calculateRewardWeight(difficultyStr, isCorrect) {
    if (isCorrect === true) {
        return difficultyStr === "hard" ? 3
            : difficultyStr === "medium" ? 2
            : 1;
    }
    if (isCorrect === false) {
        return difficultyStr === "hard" ? 1
            : difficultyStr === "medium" ? 2
            : 3;
    }
}

export function calculateReward(rewardWeight, isCorrect) {
    return rewardWeight * isCorrect
}

export function calculateIsSlow(gameType, elapsedTime) {
    if (elapsedTime > isSlowThresholds[gameType] ) {
        return true
    } else {
        return false
    }
}

// HELPER FUNCTIONS FOR MODEL
export function getDiffString(integer) {
    const reverseDiffMap = Object.fromEntries(Object.entries(difficultyMapping).map(([k, v]) => [v, k]))
    return String(reverseDiffMap[integer])

}

export function getDiffInt(string) {
    return difficultyMapping[string]
}

function applyMinMaxScaling(data, variable) {
    const max = minMaxThresholds[variable].max;
    const min = minMaxThresholds[variable].min;
    const value = (data > max) ? max : data
    if (value === min) {
        return 0;
    }
    return ((value - min) / (max - min))
}

// INVOKE MODEL
const prepRequest = (data, userFeatures, gameType) => {
    // console.log("PREP STATE")
    const state = [
        Number(data.prev_is_slow),
        Number(data.prev_is_correct),
        applyMinMaxScaling(data.total_questions, "total_questions"),
        applyMinMaxScaling(data.total_correct, "total_correct"),
        data.percent_correct,
        data.category.percent_correct,
        applyMinMaxScaling(data.average_user_time, "average_user_time"),
        data.total_weighted_reward,
    ]

    const userEmbed = [userFeatures.easy_percent, userFeatures.medium_percent, userFeatures.hard_percent]

    const gameTypeInt = gameTypeMapping[gameType]

    const modelInput = {
        states: state,
        user_features: userEmbed,
        game_type: gameTypeInt
    }
    // console.log("FINAL REQUEST", JSON.stringify(modelInput))
    return JSON.stringify(modelInput)

    // return JSON.stringify(modelInput)
}

const sendTargetRequest = async (modelInput) => {
    try {
        const invokeModel = post({
            apiName: "neurobeaconModel",
            path: "test/neurobeaconModel",
            region: "us-east-1",
            options: {
                body: {
                    data: JSON.parse(modelInput)
                }
            }
        });

        const { body } = await invokeModel.response;
        const response = await body.json();
        const prediction = response.body
        // console.log("Post succeeded (target):", response);
        console.log("Target prediction:", prediction)
        return prediction
    } catch (error) {
        console.log("Call failed (target):", JSON.parse(error.response))
    }
};

// const sendPrimaryRequest = async (modelInput) => {
//     try {
//         const invokeModel = post({
//             apiName: "neurobeaconModel",
//             path: "test/neurobeaconModel",
//             region: "us-east-1",
//             options: {
//                 body: {
//                     data: JSON.parse(modelInput)
//                 }
//             }
//         });

//         const { body } = await invokeModel.response;
//         const response = await body.json();
//         const prediction = response.body
//         // console.log("Post succeeded (primary):", response);
//         console.log("Primary prediction:", prediction)
//         return prediction
//     } catch (error) {
//         console.log("Call failed (primary):", JSON.parse(error.response))
//     }
// };

const sendPrimaryRequest = async (modelInput) => {
    console.log("MODEL INPUT", modelInput)
    try {
        const response = await fetch("http://neurobeaconprimarymodel-1716963321.us-east-1.elb.amazonaws.com/mod/predict", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: modelInput
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Post succeeded (primary):", data);

        return data.prediction;

    } catch (error) {
        console.log("Call failed (primary):", error.message);
        return null;
    }
};

export const initiateRetrain = async () => {
    try {
        const response = await fetch("http://neurobeaconprimarymodel-1716963321.us-east-1.elb.amazonaws.com/mod/retrain")

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Initiated Retraining:", data.Retraining)

        return data;
    } catch (error) {
        console.log("Retraining failed:", error.message)
    }
}

export const invokeModel = async (data, userFeatures, gameType, target) => {
    const modelInput = prepRequest(data, userFeatures, gameType)
    try {
        let prediction

        if (target === 'primary') {
            prediction = await sendPrimaryRequest(modelInput)
        } else {
            prediction = await sendTargetRequest(modelInput)
        }
        

        // console.log("PREDICTION:", prediction)
        return parseInt(prediction)
    } catch (error) {
        console.log("Error with invoking model.", error)
    }
};