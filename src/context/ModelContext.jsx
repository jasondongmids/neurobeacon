// If time, to be decremented as context is not needed; update TestPage.jsx

import React, { createContext, useState, useEffect } from "react";
import { post } from "aws-amplify/api";

// update lambda function
// update IAM roles / permissions

const ModelContext = createContext();

export const ModelProvider = ({ children }) => {
    const [primaryPrediction, setPrimaryPrediction] = useState('');
    const [targetPrediction, setTargetPrediction] = useState('');

    useEffect(() => {
        console.log("Primary model prediction:", primaryPrediction);
    }, [primaryPrediction]);    

    useEffect(() => {
        console.log("Target model prediction:", targetPrediction);
    }, [targetPrediction])

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
            console.log("Post succeeded (target):", response);
            // console.log("Prediction:", prediction)
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
            console.log("Post succeeded (primary):", response);
            // console.log("Prediction:", prediction)
            return prediction
        } catch (error) {
            console.log("Call failed (primary):", JSON.parse(error.response))
        }
    };

    const invokeModel = async (data, target) => {
        const modelInput = prepRequest(data)
        try {
            let prediction

            if (target === 'primary') {
                prediction = await sendPrimaryRequest(modelInput, target)
                const predInt = parseInt(prediction)
                setPrimaryPrediction(predInt)
                return predInt
            } else {
                prediction = await sendTargetRequest(modelInput, target)
                const predInt = parseInt(prediction)
                setTargetPrediction(predInt)
                return predInt
            }
        } catch (error) {
            console.log("Error with invoking model.", error)
        }
    };

    return (
        <ModelContext.Provider value ={{
            primaryPrediction,
            setPrimaryPrediction,
            targetPrediction,
            setTargetPrediction,
            invokeModel,
        }}>
            { children }
        </ModelContext.Provider>
    );  
};

export default ModelContext;