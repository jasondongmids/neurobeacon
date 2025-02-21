import React, { useContext, useState } from "react";
import UserContext from "../context/UserContext";
import Header from "./Header";
import NavBar from "./NavBar"; // ✅ Ensure Hamburger Menu is Here
import Panel from "./Panel";
// import GameArea from "./GameArea";
import Footer from "./Footer";
import "../styles.css";
import { generateClient } from "aws-amplify/data";
import { post } from "aws-amplify/api"

// How is everything related?
// Step 1: amplify/resource.ts: define schema customType for external ddb data model. This is used for type checking for the mutations/queries for returns(a.ref()) 
// Step 2: amplify/backend.ts: define external data model. Definition adds a data source to AppSync GraphQL API to application. AppSync > select API > Data Sources
// Step 3: amplify/resource.ts: define query and mutation functions for AppSync. 
// Step 4: amplify/data/*.js: these are the custom resolver; graphQL queries which AppSync uses to query ddb. AppSync > select API > Functions
// Step 5: currently in test.tsx: further define how we want to mutate/query using resolver via javascript functions

// NOTE: 
// The idea will be to put these functions into a separate file such as /amplify/data/query.ts 
// which you can then import into your component/page. Unsure if one .ts for all functions or one .ts for
// each data model.

const client = generateClient();

async function addUserState(event, inputValue) {
    event.preventDefault();

    try {
        const { data, errors } = await client.mutations.addUserState({
            type: inputValue,
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

async function getUserState(event, setUserState, queryType, queryLimit) {
    event.preventDefault();
    try {
        const { data, errors }= await client.queries.getUserState({
            type: queryType,
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

// Test model api
async function sendModelRequest(event) {
    event.preventDefault();

    try {
        const invokeModel = post({
            apiName: "neurobeaconModel",
            path: "https://wko6ofylnd.execute-api.us-east-1.amazonaws.com/test",
            region: "us-east-1",
            options: {
                body: {
                    data: [1.0, 1.23263889, 1.24328859, 0.875, 0.78, 0.84130453, 1.0 , 0.90024824]
                }
            }
        });

        const { body } = await invokeModel.response;
        const response = await body.json();

        console.log("Post call succeeded:", response);
    } catch (error) {
        console.log("Post call failed:", JSON.parse(error.response))
    }
}


const TestPage = () => {
    const { username } = useContext(UserContext);

    const [inputValue, setInputValue] = useState('');
    const [userState, setUserState] = useState(null);
    const [queryType, setQueryType] = useState('');
    const [queryLimit, setQueryLimit] = useState('');
    const [modelInput, setModelInput] = useState('');
    const [modelPrediction, setModelPrediction] = useState('');

    return (
        <div className="game-page">
            <Header />
            <NavBar /> {/* ✅ Keeps Hamburger Menu */}
            <h2 className="greeting">Hello, {username || "Player"}! THIS IS THE TEST PAGE 🧠</h2>
            <div className="main-container">
                <Panel title="Stats/Instructions Panel" position="left" />
                <div className="flex flex-col items-center p-4 space-y-4">
                    <form onSubmit={(e) => addUserState(e, inputValue)} className="flex space-x-2">
                        <select
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="border p-2 rounded"
                        >
                            <option value="" disabled>Select an option</option>
                            <option value="STATE">STATE</option>
                            <option value="MATH">MATH</option>
                            <option value="VISUAL">VISUAL</option>
                        </select>
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
                        Add User State
                        </button>
                    </form>

                    <form onSubmit={(e) => getUserState(e, setUserState, queryType, queryLimit)} className="flex space-x-2">
                        <select
                            value={queryType}
                            onChange={(e) => setQueryType(e.target.value)}
                            className="border p-2 rounded"
                        >
                            <option value="" disabled>Select an option</option>
                            <option value="STATE">STATE</option>
                            <option value="MATH">MATH</option>
                            <option value="VISUAL">VISUAL</option>
                        </select>
                        <input
                            type="text"
                            value={queryLimit}
                            onChange={(e) => setQueryLimit(e.target.value)}
                            placeholder="# records to query"
                        />
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
                        Query User State
                        </button>
                    </form>

                    {userState && Object.keys(userState).length > 0 ? (
                        <pre>{JSON.stringify(userState, null, 2)}</pre>
                    ) : (
                        <p style={{color: "black"}}>No user state available</p>
                    )}

                    <form onSubmit={(e) => sendModelRequest(e)} className="flex space-x-2">
                        <input
                            type="text"
                            value={modelInput}
                            onChange={(e) => setModelInput(e.target.value)}
                            placeholder="Example array: [1., 1.23263889, 1.24328859, 0.875, 0.78, 0.84130453, 1. , 0.90024824]"
                        />
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
                        Invoke Model
                        </button>
                    </form>

                    {modelPrediction != '' ? (
                        <pre>{JSON.stringify(modelPrediction, null, 2)}</pre>
                    ) : (
                        <p style={{color: "black"}}>No prediction available</p>
                    )}
                </div>
                <Panel title="Hints/Feedback Panel" position="right" />
            </div>
            <Footer />
        </div>
    );
};

export default TestPage;