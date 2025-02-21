import React, { createContext, useState, useEffect } from "react";
import { dataClient } from "../index";

const UserStateContext = createContext();

export const UserStateProvider = ({ children }) => {
    // ✅ Load stored user state data
    const [userState, setUserState] = useState(localStorage.getItem("userState") || "");


    // ✅ Save user state when updated // to be updated!
    useEffect(() => {
        localStorage.setItem("userState", userState);
    }, [userState]);    

    // ✅ Add user state // to be updated!
    const addUserState = async (stateType) => {
        try {
            const { data, errors } = await dataClient.mutations.addUserState({
                type: stateType,
                current_streak: 1
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
    const getUserState = async (stateType, queryLimit) => {
        try {
            const { data, errors }= await dataClient.queries.getUserState({
                type: stateType,
                limit: parseInt(queryLimit)
            });
    
            if (errors) {
                console.error('Error from GraphQL mutation:', errors);
            } else {
                console.log('User query successful', data);
                setUserState(data)
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