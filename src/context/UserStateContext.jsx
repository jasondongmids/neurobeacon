import React, { createContext, useState, useEffect } from "react";
import { dataClient } from "../index";

const UserStateContext = createContext();

export const UserStateProvider = ({ children }) => {
    // ✅ Load stored user state data
    const [userGameState, setUserGameState] = useState({
        prev_is_slow: "",
        prev_is_correct: "",
        total_questions: "",
        total_correct: "",
        percent_correct: "",
        total_elapsed_time: "",
        average_user_time: "",
    });

    const [userCategoryState, setUserCategoryState] = useState({
        total_questions: "",
        total_correct: ""
    });

    // ✅ Save user state when updated // to be updated!
    useEffect(() => {
        localStorage.setItem("userGameState", userGameState);
    }, [userGameState]);    

    // ✅ Add single GAME#, GAME#CATEGORY#, or GAME#STATISTICS# state
    const addUserState = async (gameType, category, inputData) => {
        try {
            const { data, errors } = await dataClient.mutations.addUserState({
                gameType: gameType,
                category: category,
                data: inputData
            });
    
            if (errors) {
                console.error('Check inputs or CloudWatch logs:', errors);
            } else {
                console.log('Successful add', data);
            }
        } catch (error) {
            console.error('Error with function in UserStateContext.jsx:', error);
        } 
    };

    // ✅ Query GAME#, GAME#CATEGORY#, or GAME#STATISTICS# state(s)
    const getUserState = async (gameType, category, queryLimit) => {
        try {
            const { data, errors }= await dataClient.queries.getUserState({
                gameType: gameType,
                category: category,
                limit: parseInt(queryLimit)
            });
    
            if (errors) {
                console.error('Check inputs or CloudWatch logs:', errors);
            } else {
                console.log('Successful query', data);
                setTotalQuestions(data.total_questions)
                setTotalCorrect(data.total_correct)
                setTotalElapsedTime(data.totalElapsedTime)
            }
        } catch (error) {
            console.error('Error with function in UserStateContext.jsx:', error)
        }
    };

    // ✅ Update GAME# react state during game submit
    const updateUserGameState = (newUserState) => {
        // newState = {correct, elapsed_time}
        const { correct, elapsed_time } = newUserState;

        setGameState(prevState => {
            const totalQuestions = prevState.total_questions + 1;
            const totalCorrect = correct ? prevState.total_correct + 1 : prevState.total_correct;
            const totalElapsedTime = prevState.total_elapsed_time + elapsed_time;
    
            return {
                ...prevState,
                prev_is_correct: correct,
                total_questions: totalQuestions,
                total_correct: totalCorrect,
                percent_correct: totalCorrect / totalQuestions,
                total_elapsed_time: totalElapsedTime,
                average_user_time: totalElapsedTime / totalQuestions,
            };
        })
    };

    // ✅ Update GAME#CATEGORY# react state during game submit
    const updateUserCategoryState = (newUserState) => {
        setUserCategoryState(prevState => {
            const totalQuestions = prevState.total_questions + 1;
            const totalCorrect = newUserState.correct ? prevState.total_correct + 1 : prevState.total_correct;

            return {
                ...prevState,
                total_questions: totalQuestions,
                total_correct: totalCorrect,
                percent_correct: totalCorrect / totalQuestions,
            }
        })
    }

    // ✅ Add GAME#, GAME#CATEGORY#, GAME#STAT, GAMEHX# dynamodb tables
    const transactGameData = async (gameType, category, gameStateData, categoryStateData) => {
        // transactData = total_questions, 
        try {
            const gameData = JSON.stringify({
                ...gameStateData // reminder to add prediction
            })
            
            const categoryData = JSON.stringify(categoryStateData)

            console.log('GameData', gameData)
            console.log('Type', typeof gameData)

            //
            const gameStateResult = await addUserState(gameType, "", gameData)
            const categoryStateResult = await addUserState(gameType, category, categoryData)

            return { gameStateResult, categoryStateResult }

        } catch (error) {
            console.error('Error with function in UserStateContext.jsx:', error)
        }
    };

    return (
        <UserStateContext.Provider value ={{
            userGameState,
            setUserGameState,
            userCategoryState,
            setUserCategoryState,
            addUserState,
            getUserState,
            updateUserGameState,
            updateUserCategoryState,
            transactGameData,
        }}>
            { children }
        </UserStateContext.Provider>
    );
};

export default UserStateContext;