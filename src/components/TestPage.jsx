import React, { useContext, useState, useRef, useEffect } from "react";
import UserContext from "../context/UserContext";
import Header from "./Header";
import NavBar from "./NavBar"; // ✅ Ensure Hamburger Menu is Here
import Panel from "./Panel";
// import GameArea from "./GameArea";
import Footer from "./Footer";
import "../styles.css";
import ModelContext from "../context/ModelContext"
import UserStateContext from "../context/UserStateContext"
import UserStatisticsContext from "../context/UserStatisticsContext"
import GameHxContext from "../context/GameHxContext"

// How is everything related?
// Step 1: amplify/resource.ts: define schema customType for external ddb data model. This is used for type checking for the mutations/queries for returns(a.ref()) 
// Step 2: amplify/backend.ts: define external data model. Definition adds a data source to AppSync GraphQL API to application. AppSync > select API > Data Sources
// Step 3: amplify/resource.ts: define query and mutation functions for AppSync. 
// Step 4: amplify/data/*.js: these are the custom resolver graphQL queries which AppSync uses to query ddb. AppSync > select API > Functions
// Step 5: Customized functions using graphQL API are located in context/UserStateContext.jsx (Entity/ReturnTypeName.jsx)
// Step 6: load those functions by importing the context and wrap them around another function if additional changes are needed (see handleAddUserState)

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
    const [frequency, setFrequency] = useState('');
    const [queryFrequency, setQueryFrequency] = useState('');
    const [updateFrequency, setUpdateFrequency] = useState('');
    const [queryStatsLimit, setQueryStatsLimit] = useState('');
    const [gameHxType, setGameHxType] = useState('');
    const { userGameState, userCategoryState, queryStates, addUserState, queryUserStates, transactGameData } = useContext(UserStateContext);
    const { modelPrediction, setModelPrediction, modelInput, setModelInput, sendModelRequest } = useContext(ModelContext);
    const { queryStatistics, queryStats, addStats, updateStats } = useContext(UserStatisticsContext);
    const { addGameHx } = useContext(GameHxContext);
    const initStateRef = useRef(true)
    const prevGameStateRef = useRef(userGameState)
    const prevCategoryStateRef = useRef(userCategoryState)

    useEffect(() => {
        const pGameState = prevGameStateRef.current;
        const pCategoryState = prevCategoryStateRef.current;

        if (
            pGameState !== userGameState &&
            pCategoryState !== userCategoryState &&
            userGameState != null &&
            userCategoryState != null &&
            initStateRef == false
        ) {
            transactGameData("trivia", "sub", userGameState, userCategoryState)
        }

        prevGameStateRef.current = userGameState;
        prevCategoryStateRef.current = userCategoryState;
    }, [userGameState, userCategoryState])

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
            score: 30,
            difficulty: 0,
            predicted_difficulty: 0,
            category: {
                category: category, // not an issue for production
                total_questions: 1,
                total_correct: 1,
                percent_correct: 1
            }
        })

        addUserState(gameType, category, data)
    };

    const handleQueryUserStates = async (event, gameType, category, limit) => {
        try {
            event.preventDefault();
            await queryUserStates(gameType, category, limit);
            console.log("Query Successful.");
        } catch (error) {
            console.error("Error fetching user state:", error);
        }
    };

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
            score: 30,
            difficulty: 0,
            predicted_difficulty: 0,
            category: {
                category: transactCategory,
                total_questions: 1,
                total_correct: 1,
                percent_correct: 1
            }
        }

        const categoryStateData = {
            category: {
                category: transactCategory,
                total_questions: 1,
                total_correct: 1,
                percent_correct: 1,
            }

        }

        transactGameData(transactType, transactCategory, gameStateData, categoryStateData)
    };

    const handleSendModelRequest = async (event, modelInput) => {
        event.preventDefault()
        const prediction = await sendModelRequest(modelInput)
        console.log("Prediction:", prediction)
        setModelPrediction(prediction)
    };

    const handleAddStats = (event, frequency) => {
        event.preventDefault()
        const data = JSON.stringify({
            total_sessions: 5,
            total: {
                    total_questions: 12,
                    total_correct: 10,
                    percent_correct: 0.833,            
                },
            math: {
                    total_questions: 2,
                    total_correct: 1,
                    percent_correct: 0.5, 
                },
            visual: {
                    total_questions: 2,
                    total_correct: 1,
                    percent_correct: 0.5, 
                },
            reaction: {
                    total_questions: 2,
                    total_correct: 2,
                    percent_correct: 1.0,                            
                },
        })

        addStats(frequency, data)
    };

    const handleUpdateStats = (event, frequency) => {
        event.preventDefault()
        const data = JSON.stringify({
            total_sessions: 6,
            total: {
                    total_questions: 13,
                    total_correct: 10,
                    percent_correct: 0.769,            
                },
            math: {
                    total_questions: 3,
                    total_correct: 1,
                    percent_correct: 0.333, 
                },
            visual: {
                    total_questions: 2,
                    total_correct: 1,
                    percent_correct: 0.5, 
                },
            reaction: {
                    total_questions: 2,
                    total_correct: 2,
                    percent_correct: 1.0,                            
                },
        })

        updateStats(frequency, data)
    };

    const handleQueryStats = async (event, frequency, limit) => {
        try {
            event.preventDefault();
            await queryStats(frequency, limit);
            console.log("Query Successful.");
        } catch (error) {
            console.error("Error fetching user state:", error);
        }
    };

    const handleAddGameHx = async (event, gameHxType) => {
        try {
            event.preventDefault();
            const data = {
                question_id: 'test',
                question_type: gameHxType,
                question_category: '1950',
                difficulty: 2,
                game_time_ms: 5000,
                session_id: 'test', // perhaps just generate here??
                session_time_ms: 30,
                attempt: 1,
                user_answer: 'a',
                is_correct: false,
                score: 30,
            }

            await addGameHx(data)
        } catch (error) {
            console.error("Error adding GameHx:", error)
        }
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
                    <h3>Test User States (UserStateHx)</h3>
                    <form onSubmit={(e) => handleAddUserState(e, gameType, category)} className="flex space-x-2">
                        <select
                            value={gameType}
                            onChange={(e) => setGameType(e.target.value)}
                            className="border p-2 rounded">
                            <option value="" disabled>Select an option</option>
                            <option value="math">MATH</option>
                            <option value="trivia">TRIVIA</option>
                            <option value="visual">VISUAL</option>
                            <option value="reaction">REACTION</option>
                        </select>
                        <select
                            value={category || ""}
                            onChange={(e) => setCategory(e.target.value)}
                            className="border p-2 rounded">
                            <option value="">Optional: Select an option</option>
                            <option value="sub">SUB</option>
                            <option value="add">ADD</option>
                            <option value="minus">MINUS</option>
                            <option value="def">DEFAULT</option>
                        </select>
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
                        Add User State
                        </button>
                    </form>
                    {/* ✅ Test query/getUserState */}
                    <form onSubmit={(e) => handleQueryUserStates(e, queryType, queryCategory, queryLimit)} className="flex space-x-2">
                        <select
                            value={queryType}
                            onChange={(e) => setQueryType(e.target.value)}
                            className="border p-2 rounded">
                            <option value="" disabled>Select an option</option>
                            <option value="math">MATH</option>
                            <option value="trivia">TRIVIA</option>
                            <option value="visual">VISUAL</option>
                            <option value="reaction">REACTION</option>
                        </select>
                        <select
                            value={queryCategory || ""}
                            onChange={(e) => setQueryCategory(e.target.value)}
                            className="border p-2 rounded">
                            <option value="">Optional: Select an option</option>
                            <option value="sub">SUB</option>
                            <option value="add">ADD</option>
                            <option value="minus">MINUS</option>
                            <option value="def">DEFAULT</option>
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
                    {queryStates != "" ? (
                        <pre>{JSON.stringify(queryStates, null, 2)}</pre>
                    ) : (
                        <p style={{color: "black"}}>No user state available</p>
                    )}
                    {/* ✅ Test model endpoint */}
                    <h3>Test Model Inference</h3>
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
                        <p style={{color: "black"}}>No Prediction</p>
                    )}
                    {/* ✅ Test addGameStats */}
                    <h3>Test User Statistics (UserStateHx)</h3>
                    <form onSubmit={(e) => handleAddStats(e, frequency)} className="flex space-x-2">
                        <select
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value)}
                            className="border p-2 rounded">
                            <option value="" disabled>Select an option</option>
                            <option value="daily">DAILY</option>
                            <option value="weekly">WEEKLY</option>
                            <option value="">OVERALL</option>
                        </select>
                        <button type="submit">
                        Add Statistic
                        </button>
                    </form>
                    {/* ✅ Test updateGameStats */}                   
                    <form onSubmit={(e) => handleUpdateStats(e, updateFrequency)} className="flex space-x-2">
                        <select
                            value={updateFrequency}
                            onChange={(e) => setUpdateFrequency(e.target.value)}
                        >
                            <option value="" disabled>Select an option</option>
                            <option value="daily">DAILY</option>
                            <option value="weekly">WEEKLY</option>
                            <option value="">OVERALL</option>
                        </select>
                        <button type="submit">
                        Update Statistics
                        </button>
                    </form>
                    {/* ✅ Test queryGameStats */}                   
                    <form onSubmit={(e) => handleQueryStats(e, queryFrequency, queryStatsLimit)} className="flex space-x-2">
                        <select
                            value={queryFrequency}
                            onChange={(e) => setQueryFrequency(e.target.value)}
                            className="border p-2 rounded">
                            <option value="" disabled>Select an option</option>
                            <option value="daily">DAILY</option>
                            <option value="weekly">WEEKLY</option>
                            <option value="">OVERALL</option>
                        </select>
                        <input
                            type="text"
                            value={queryStatsLimit}
                            onChange={(e) => setQueryStatsLimit(e.target.value)}
                            onBlur={() => setQueryStatsLimit(queryStatsLimit || "")}
                            placeholder="# records to query"
                        />
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
                        Query Statistics
                        </button>
                    </form>
                    {queryStatistics != "" ? (
                        <pre>{JSON.stringify(queryStatistics, null, 2)}</pre>
                    ) : (
                        <p style={{color: "black"}}>No statistics available</p>
                    )}
                    {/* ✅ Test addGameHx */}
                    <h3>Test GameHx (UserGameHx)</h3>
                    <form onSubmit={(e) => handleAddGameHx(e, gameHxType)} className="flex space-x-2">
                        <select
                            value={gameHxType}
                            onChange={(e) => setGameHxType(e.target.value)}
                            className="border p-2 rounded">
                            <option value="" disabled>Select an option</option>
                            <option value="math">MATH</option>
                            <option value="trivia">TRIVIA</option>
                            <option value="visual">VISUAL</option>
                        </select>
                        <button type="submit">
                        Add Game Hx
                        </button>
                    </form>
                    {/* ✅ Test transactGameData */}
                    <h3>Test Transaction</h3>
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