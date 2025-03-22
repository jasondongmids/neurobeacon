import { post } from "aws-amplify/api";

// HARD CODED VALUES
const difficultyMapping = {
    easy: 0,
    medium: 1,
    hard: 2
}

const isSlowThresholds = {
    math: 1000,
    memory: 1000,
    reaction: 1000,
    sudoku: 1000,
    trivia: 1000
}

const gameTypeEmbed = {
    math: 3,
    memory: 4,
    reaction: 5,
    sudoku: 6,
    trivia: 7
}

const minMaxThresholds = {
    total_questions: {min: 1, max: 1750},
    total_correct: {min: 1, max: 1530},
    average_user_time: {min: 0, max: 45000000}
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
const prepRequest = (data) => {
    const modelInput = [
        Number(0), // placeholder for prev_is_slow
        Number(data.prev_is_correct),
        applyMinMaxScaling(data.total_questions, "total_questions"), // placeholder
        applyMinMaxScaling(data.total_correct, "total_correct"), // placeholder
        data.percent_correct,
        data.category.percent_correct,
        applyMinMaxScaling(data.average_user_time, "average_user_time"), // placeholder
        1 // placeholder for reward
    ]

    console.log("MODEL INPUT", modelInput)
    return JSON.stringify(modelInput)
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

const sendPrimaryRequest = async (modelInput) => {
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
        // console.log("Post succeeded (primary):", response);
        console.log("Primary prediction:", prediction)
        return prediction
    } catch (error) {
        console.log("Call failed (primary):", JSON.parse(error.response))
    }
};

export const invokeModel = async (data, target) => {
    const modelInput = prepRequest(data)
    try {
        let prediction

        if (target === 'primary') {
            prediction = await sendPrimaryRequest(modelInput, target)
        } else {
            prediction = await sendTargetRequest(modelInput, target)
        }
        
        // console.log("Prediction:", parseInt(prediction))
        return parseInt(prediction)
    } catch (error) {
        console.log("Error with invoking model.", error)
    }
};