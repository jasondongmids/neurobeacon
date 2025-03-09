import React, { createContext, useState } from "react";
import { post } from "aws-amplify/api";

// update lambda function
// update IAM roles / permissions

const ModelContext = createContext();

export const ModelProvider = ({ children }) => {
    const [modelPrediction, setModelPrediction] = useState('');
    const [modelInput, setModelInput] = useState('');

    const sendModelRequest = async (modelInput) => {
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
            console.log("Post call succeeded:", response);
            // console.log("Prediction:", prediction)
            return prediction
        } catch (error) {
            console.log("Post call failed:", JSON.parse(error.response))
        }
    };

    return (
        <ModelContext.Provider value ={{
            modelPrediction,
            setModelPrediction,
            modelInput,
            setModelInput,
            sendModelRequest,
        }}>
            { children }
        </ModelContext.Provider>
    );  
};

export default ModelContext;