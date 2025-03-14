// functions required for model inference
import { post } from "aws-amplify/api";

const prepRequest = (data) => {
    const modelInput = [
        Number(0), // placeholder for prev_is_slow
        Number(data.prev_is_correct),
        data.total_questions / 300, // placeholder
        data.total_correct / 300, // placeholder
        data.percent_correct,
        data.category.percent_correct,
        data.average_user_time / 1000, // placeholder
        1 // placeholder for reward
    ]
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