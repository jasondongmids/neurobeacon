import React, { createContext, useState, useEffect } from "react";
import { dataClient } from "../index";

const UserStateContext = createContext();

export const UserStateProvider = ({ children }) => {
    // ✅ Create react states
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

    const [queryStates, setQueryStates] = useState('')

    // ✅ Save user state when updated // to be updated!
    useEffect(() => {
        console.log("Updated game state:", userGameState);
    }, [userGameState]);    

    useEffect(() => {
        console.log("Updated category state:", userCategoryState);
    }, [userCategoryState])

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

    // ✅ Get GAME#, GAME#CATEGORY#, or GAME#STATISTICS# state and Update react state
    const getUserState = async (gameType, category) => {
        try {
            const { data, errors } = await dataClient.queries.getUserState({
                gameType: gameType,
                category: category,
                limit: 1
            });
    
            if (errors) {
                console.error('Check inputs or CloudWatch logs:', errors);
                return; // Exit function early if there are errors
            }
    
            if (!data) {
                console.warn("No user state data returned.");
                return;
            }
    
            if (category) {
                setUserCategoryState({
                    total_questions: data[0].total_questions,
                    total_correct: data[0].total_correct,
                });
            } else {
                setUserGameState({
                    prev_is_slow: data[0].prev_is_slow,
                    prev_is_correct: data[0].prev_is_correct,
                    total_questions: data[0].total_questions,
                    total_correct: data[0].total_correct,
                    percent_correct: data[0].percent_correct,
                    total_elapsed_time: data[0].total_elapsed_time,
                    average_user_time: data[0].average_user_time,
                });
            }
        } catch (error) {
            console.error('Error with function in UserStateContext.jsx:', error);
        }
    };

    // ✅ Query GAME#, GAME#CATEGORY#, or GAME#STATISTICS# state(s)
    const queryUserStates = async (gameType, category, queryLimit) => {
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
                setQueryStates(data)
            }
        } catch (error) {
            console.error('Error with function in UserStateContext.jsx:', error)
        }
    };

    // ✅ Update GAME# react state during game submit
    const updateUserGameState = (newUserState) => {
        // newState = {correct, elapsed_time}
        const { correct, elapsed_time } = newUserState;

        setUserGameState(prevState => {
            const totalQuestions = prevState.total_questions + 1;
            const totalCorrect = correct ? prevState.total_correct + 1 : prevState.total_correct;
            const totalElapsedTime = prevState.total_elapsed_time + elapsed_time;
    
            return {
                ...prevState,
                prev_is_correct: correct,
                total_questions: totalQuestions,
                total_correct: totalCorrect,
                percent_correct: totalQuestions > 0 ? totalCorrect / totalQuestions : 0,
                total_elapsed_time: totalElapsedTime,
                average_user_time: totalQuestions > 0 ? totalElapsedTime / totalQuestions : 0,
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
                percent_correct: totalQuestions > 0 ? totalCorrect / totalQuestions : 0,
            }
        })
    };

    // ✅ Add GAME#, GAME#CATEGORY#, GAME#STAT, GAMEHX# dynamodb tables
    const transactGameData = async (gameType, category, gameStateData, categoryStateData) => {
        // transactData = total_questions, 
        try {
            const gameData = JSON.stringify({
                ...gameStateData // reminder to add prediction
            })
            
            const categoryData = JSON.stringify(categoryStateData)

            // console.log('GameData', gameData)
            // console.log('Type', typeof gameData)

            const gameStateResult = await addUserState(gameType, "", gameData)
            const categoryStateResult = await addUserState(gameType, category, categoryData)

            return { gameStateResult, categoryStateResult }

            // const result = await dataClient.mutations.transactData({
            //     gameType: gameType,
            //     category: category,
            //     gameData: gameData,
            //     categoryData: categoryData,
            // })
            // console.log(result)
            // return result

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
            queryStates,
            setQueryStates,
            addUserState,
            getUserState,
            queryUserStates,
            updateUserGameState,
            updateUserCategoryState,
            transactGameData,
        }}>
            { children }
        </UserStateContext.Provider>
    );
};

export default UserStateContext;