import React, { createContext } from "react";
import { dataClient } from "../index";

const GameHxContext = createContext();

export const GameHxProvider = ({ children }) => {

    // ✅ Add single game history
    const addGameHx = async (gameData) => {
        try {
            const { data, errors } = await dataClient.mutations.addGameHx({
                data: JSON.stringify(gameData)
            });

            if (errors) {
                console.error('Check inputs or CloudWatch logs:', errors);
            } else {
                console.log('Successful GameHx add', data, errors);
            }
        } catch (error) {
            console.error('Error with function in UserStateContext.jsx')
        }
    };

    return (
        <GameHxContext.Provider value ={{
            addGameHx,
        }}>
            { children }
        </GameHxContext.Provider>
    );
};

export default GameHxContext

