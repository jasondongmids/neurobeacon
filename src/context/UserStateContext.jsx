import React, { createContext, useState, useEffect } from "react";
import { dataClient } from "../index";

const UserStateContext = createContext();


// user_stat: a.string().required(), // all user data set in function
// stat: a.string().required(), // created in function
// current_streak: a.integer(), // create state variable
// total_questions: a.integer(), // create state variable
// state: a.integer(), // ?
// prev_is_slow: a.integer(), // is_slow?
// prev_is_correct: a.integer(),  is_correct
// elapsed_time_total: a.integer(), in game
// timestamp_created: a.datetime() created in function

export const UserStateProvider = ({ children }) => {
    // ✅ Load stored user state data
    const [userState, setUserState] = useState("");
    // const [prevCorrect, setPrevCorrect] = useState("")
    const [totalQuestions, setTotalQuestions] = useState("") // questions_roll_ct
    const [totalCorrect, setTotalCorrect] = useState("") // correct_answers_roll_sum
    const [totalElapsedTime, setTotalElapsedTime] = useState("")
    const [gameCorrect, setGameCorrect] = useState("")
    const [gameQuestions, setGameQuestions] = useState("")


    // ✅ Save user state when updated // to be updated!
    useEffect(() => {
        localStorage.setItem("userState", userState);
    }, [userState]);    

    // ✅ Add user state // to be updated!
    const addUserState = async (gameType, category, inputData) => {
        try {
            console.log('data:', inputData)
            // const prefix = (category) ? `${gameType}#${category}`.toUpperCase() : `${gameType}`.toUpperCase()

            // console.log('Prefix:', prefix)
            console.log('inputData:', inputData, typeof inputData)

            const { data, errors } = await dataClient.mutations.addUserState({
                // prefix: prefix,
                gameType: gameType,
                category: category,
                data: inputData
            });
    
            if (errors) {
                console.error('Error from GraphQL mutation:', errors);
            } else {
                console.log('User state added successfully!', data);
            }
        } catch (error) {
            console.error('Error adding user state:', error);
        } 
    };

    // ✅ Get user state // to be updated!
    const getUserState = async (gameType, category, queryLimit) => {
        try {
            // const prefix = (category) ? `${gameType}#${category}` : `${gameType}`

            // console.log('Prefix:', prefix)
            console.log('queryLimit:', queryLimit)

            const { data, errors }= await dataClient.queries.getUserState({
                // prefix: prefix,
                gameType: gameType,
                category: category,
                limit: parseInt(queryLimit)
            });
    
            if (errors) {
                console.error('Error from GraphQL mutation:', errors);
            } else {
                console.log('User query successful', data);
                // if data == null;
                //     do something // initiate state
                setTotalQuestions(data.total_questions)
                setTotalCorrect(data.total_correct)
                setTotalElapsedTime(data.totalElapsedTime)

                // setUserState(data)
            }
        } catch (error) {
            console.error('Error querying user state:', error)
        }
    };

    return (
        <UserStateContext.Provider value ={{
            userState,
            setUserState,
            addUserState,
            getUserState,
        }}>
            { children }
        </UserStateContext.Provider>
    );
};

export default UserStateContext;