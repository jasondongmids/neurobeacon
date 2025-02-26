import React, { useContext, useState } from "react";
import UserContext from "../context/UserContext";
import Header from "./Header";
import NavBar from "./NavBar"; // ✅ Ensure Hamburger Menu is Here
import Panel from "./Panel";
// import GameArea from "./GameArea";
import Footer from "./Footer";
import "../styles.css";
import ModelContext from "../context/ModelContext"
import UserStateContext from "../context/UserStateContext"

// How is everything related?
// Step 1: amplify/resource.ts: define schema customType for external ddb data model. This is used for type checking for the mutations/queries for returns(a.ref()) 
// Step 2: amplify/backend.ts: define external data model. Definition adds a data source to AppSync GraphQL API to application. AppSync > select API > Data Sources
// Step 3: amplify/resource.ts: define query and mutation functions for AppSync. 
// Step 4: amplify/data/*.js: these are the custom resolver graphQL queries which AppSync uses to query ddb. AppSync > select API > Functions
// Step 5: Customized functions using graphQL API are located in context/UserStateContext.jsx (Entity/ReturnTypeName.jsx)
// Step 6: load those functions by importing the context and wrap them around another function if additional changes are needed (see handleAddUserState)

// Test model api
// async function sendModelRequest(event, modelInput, setModelPrediction) {
//     event.preventDefault();

//     try {
//         const invokeModel = post({
//             apiName: "neurobeaconModel",
//             path: "test/neurobeaconModel",
//             region: "us-east-1",
//             options: {
//                 body: {
//                     data: JSON.parse(modelInput)
//                 }
//             }
//         });

//         const { body } = await invokeModel.response;
//         const response = await body.json();
//         const prediction = response.body
//         console.log("Post call succeeded:", response);
//         setModelPrediction(prediction)
//     } catch (error) {
//         console.log("Post call failed:", JSON.parse(error.response))
//     }
// }


const TestPage = () => {
    const { username } = useContext(UserContext);
    const [gameType, setGameType] = useState('');
    const [category, setCategory] = useState(null);
    const [queryType, setQueryType] = useState('');
    const [queryCategory, setQueryCategory] = useState('');
    const [queryLimit, setQueryLimit] = useState('');
    // const [modelInput, setModelInput] = useState('');
    // const [modelPrediction, setModelPrediction] = useState('');
    const [transactType, setTransactType] = useState('')
    const [transactCategory, setTransactCategory] = useState('')
    const { userState, addUserState, getUserState, transactGameData } = useContext(UserStateContext)
    const { modelPrediction, setModelPrediction, modelInput, setModelInput, sendModelRequest } = useContext(ModelContext)

    const handleAddUserState = (event, gameType, category) => {
        event.preventDefault()
        const data = JSON.stringify({
            prev_is_slow: 1,
            prev_is_correct: 1,
            total_questions: 1,
            total_correct: 1,
            percent_correct: 1,
            total_elapsed_time: 100,
            average_user_time: 100,      
        })

        addUserState(gameType, category, data)
    }

    const handleGetUserState = (event, gameType, category, limit) => {
        event.preventDefault()
        console.log(gameType)
        getUserState(gameType, category, limit)
    }

    const handleTransactGameData = (transactType, transactCategory) => {
        console.log('transact_type', !transactType)
        const gameStateData = {
            prev_is_slow: true,
            prev_is_correct: true,
            total_questions: 1,
            total_correct: 1,
            percent_correct: 1.0,
            total_elapsed_time: 1,
            average_user_time: 1.0,
            // difficulty: 'easy',
            // predicted_difficulty: 'easy'
        }

        const categoryStateData = {
            total_questions: 1,
            total_correct: 1,
            percent_correct: 1,
        }

        transactGameData(transactType, transactCategory, gameStateData, categoryStateData)
    }

    const handleSendModelRequest = (event, modelInput) => {
        event.preventDefault()
        prediction = sendModelRequest(modelInput)
        setModelPrediction(prediction)
    }
    return (
        <div className="game-page">
            <Header />
            <NavBar /> {/* ✅ Keeps Hamburger Menu */}
            <h2 className="greeting">Hello, {username || "Player"}! THIS IS THE TEST PAGE 🧠</h2>
            <div className="main-container">
                <Panel title="Stats/Instructions Panel" position="left" />
                <div className="flex flex-col items-center p-4 space-y-4">
                    {/* ✅ Test addUserState */}
                    <form onSubmit={(e) => handleAddUserState(e, gameType, category)} className="flex space-x-2">
                        <select
                            value={gameType}
                            onChange={(e) => setGameType(e.target.value)}
                            className="border p-2 rounded">
                            <option value="" disabled>Select an option</option>
                            <option value="math">MATH</option>
                            <option value="trivia">TRIVIA</option>
                            <option value="visual">VISUAL</option>
                        </select>
                        <select
                            value={category || ""}
                            onChange={(e) => setCategory(e.target.value)}
                            className="border p-2 rounded">
                            <option value="">Optional: Select an option</option>
                            <option value="sub">SUB</option>
                            <option value="add">ADD</option>
                            <option value="minus">MINUS</option>
                        </select>
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
                        Add User State
                        </button>
                    </form>
                    {/* ✅ Test getUserState */}
                    <form onSubmit={(e) => handleGetUserState(e, queryType, queryCategory, queryLimit)} className="flex space-x-2">
                        <select
                            value={queryType}
                            onChange={(e) => setQueryType(e.target.value)}
                            className="border p-2 rounded">
                            <option value="" disabled>Select an option</option>
                            <option value="math">MATH</option>
                            <option value="trivia">TRIVIA</option>
                            <option value="visual">VISUAL</option>
                        </select>
                        <select
                            value={queryCategory || ""}
                            onChange={(e) => setQueryCategory(e.target.value)}
                            className="border p-2 rounded">
                            <option value="">Optional: Select an option</option>
                            <option value="sub">SUB</option>
                            <option value="add">ADD</option>
                            <option value="minus">MINUS</option>
                        </select>
                        <input
                            type="text"
                            value={queryLimit}
                            onChange={(e) => setQueryLimit(e.target.value)}
                            onBlur={() => setQueryLimit(queryLimit || "")}
                            placeholder="# records to query"
                        />
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
                        Query User State
                        </button>
                    </form>
                    {userState != "" ? (
                        <pre>{JSON.stringify(userState, null, 2)}</pre>
                    ) : (
                        <p style={{color: "black"}}>No user state available</p>
                    )}
                    {/* ✅ Test model endpoint */}
                    <p style={{color: "black"}}>
                        Example State: [1, 1.23263889, 1.24328859, 0.875, 0.78, 0.84130453, 1 , 0.90024824]
                    </p>
                    <form onSubmit={(e) => handleSendModelRequest(e, modelInput)} className="flex space-x-2">
                        <input
                            type="text"
                            value={modelInput}
                            onChange={(e) => setModelInput(e.target.value)}
                            placeholder="Example array: [1, 1.23263889, 1.24328859, 0.875, 0.78, 0.84130453, 1, 0.90024824]"
                        />
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
                        Invoke Model
                        </button>
                    </form>
                    {modelPrediction != "" ? (
                        <pre>Prediction: {JSON.stringify(modelPrediction, null, 2)}</pre>
                    ) : (
                        <p style={{color: "black"}}>Endpoint is not live!</p>
                    )}

                    {/* ✅ Test transactGameData */}
                    <label htmlFor="dropdown1">Choose a gameType: </label>
                    <select id="dropdown1" value={transactType} onChange={(e) => setTransactType(e.target.value)}>
                        <option value="" disabled>Required: Select an option</option>
                        <option value="math">MATH</option>
                        <option value="trivia">TRIVIA</option>
                        <option value="visual">VISUAL</option>
                    </select>
                    <br></br>
                    <label htmlFor="dropdown2">Choose a categoryType: </label>
                    <select id="dropdown2" value={transactCategory} onChange={(e) => setTransactCategory(e.target.value)}>
                        <option value="" disabled>Required: Select an option</option>
                        <option value="sub">SUB</option>
                        <option value="add">ADD</option>
                        <option value="minus">MINUS</option>
                    </select>
                    <br></br>
                    <button className="nav-btn" onClick={() => handleTransactGameData(transactType, transactCategory)} disabled={!transactType}>
                        Test Transact Function
                    </button> 
                </div>
                <Panel title="Hints/Feedback Panel" position="right" />
            </div>
            <Footer />
        </div>
    );
};

export default TestPage;