import React, { useState, useEffect, useContext, forwardRef, useImperativeHandle } from "react";
import triviaQuestions from "../data/final_trivia_questions.json";
import UserStateContext from "../context/UserStateContext"

const TriviaGame = forwardRef(({ onUpdateStats }, ref) => {
    const [questionIndex, setQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState("");
    const [message, setMessage] = useState("");
    const [score, setScore] = useState(0);
    const [attempts, setAttempts] = useState(0);
    const [sessionStartTime, setSessionStartTime] = useState(null);
    const [sessionEndTime, setSessionEndTime] = useState("");
    const [sessionCorrectCount, setSessionCorrectCount] = useState(0);
    const [questionCount, setQuestionCount] = useState(0);
    const [sessionOver, setSessionOver] = useState(false);
    const [showSessionSummary, setShowSessionSummary] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [shuffledAnswers, setShuffledAnswers] = useState([]);

    // ✅ New State: Decade Selection
    const [showDecadeModal, setShowDecadeModal] = useState(true);
    const [selectedDecades, setSelectedDecades] = useState([]);

    // ✅ JLD Updates for database updates
    const { 
        userGameState, userCategoryState, getUserState, queryUserStates, updateUserGameState, updateUserCategoryState, transactGameData 
        } = useContext(UserStateContext);
    const [gameStartTime, setGameStartTime] = useState(0)

    useEffect(() => {
        console.log("🟡 TriviaGame Mounted! Starting New Session...");
        setShowDecadeModal(true);  // ✅ Show decade selection modal first
    }, []);

    useEffect(() => {
        if (onUpdateStats) {
            onUpdateStats({
                score,
                correctAnswers: sessionCorrectCount,
                questionsAnswered: questionCount,
                accuracy: questionCount > 0 ? ((sessionCorrectCount / questionCount) * 100).toFixed(2) : 0,
            });
        }
    }, [score, sessionCorrectCount, questionCount]);

    const startNewSession = () => {
        console.log("🔄 Starting New Trivia Session...");
        setSessionOver(false);
        setScore(0);
        setQuestionCount(0);
        setSessionCorrectCount(0);
        setShowSessionSummary(false);
        setSessionEndTime("");
        setSelectedAnswer("");
        setMessage("");
        setAttempts(0);
        setSessionStartTime(Date.now());
        setShowDecadeModal(true);  // ✅ Reset & Show Decade Selection Modal
        setGameStartTime(Date.now());
    };

    useImperativeHandle(ref, () => ({
        handleSubmit,
        resetInputs,
        generateNewProblem: nextQuestion,
    }));

    const resetInputs = () => {
        setSelectedAnswer("");
        setMessage("");
    };

    // ✅ Load Questions Based on Selected Decades
    const loadFilteredQuestions = () => {
        let filteredQuestions = triviaQuestions;

        if (!selectedDecades.includes("all")) {
            filteredQuestions = triviaQuestions.filter(q => selectedDecades.includes(q.decade));
        }

        const randomizedQuestions = filteredQuestions.sort(() => Math.random() - 0.5).slice(0, 35);

        console.log("✅ Final Question Set:", randomizedQuestions);
        setQuestions([...randomizedQuestions]);  // ✅ Ensures state update triggers re-render
        setQuestionIndex(0);
        setTimeout(() => shuffleAnswers(randomizedQuestions[0]), 100);
    };

        const shuffleAnswers = (question) => {
            if (question) {
                const answers = [...question.incorrect_answers, question.correct_answer];
                const shuffled = answers.sort(() => Math.random() - 0.5);
                setShuffledAnswers(shuffled);
            }
        };

    const handleAnswerSelection = (answer) => {
        setSelectedAnswer(answer);
    };

    const handleSessionStart = () => {
        setShowDecadeModal(false); 
        loadFilteredQuestions(); 
        getUserState("trivia", ""); 
        getUserState("trivia", "sub")
    }

    const endSession = (endTime) => {
        console.log("🛑 Ending session...");
    
        setSessionOver(true);
    
        const totalTimeInMs = endTime - sessionStartTime;
        const totalTimeInSec = Math.floor(totalTimeInMs / 1000);
        const minutes = Math.floor(totalTimeInSec / 60);
        const seconds = totalTimeInSec % 60;
    
        console.log(`⏳ Total time: ${minutes} min ${seconds} sec`);
        console.log("✅ Setting showSessionSummary to true");
    
        setSessionEndTime(minutes > 0 ? `${minutes} min ${seconds} sec` : `${seconds} sec`);
    
        setTimeout(() => {
            console.log("🚀 Showing Session Summary!");
            setShowSessionSummary(true);
        }, 500);
    };

    const handleSubmit = () => {
        if (!selectedAnswer) {
            setMessage("❌ Please select an answer!");
            return;
        }
    
        if (sessionOver) {
            console.warn("❌ Session is over, ignoring submit.");
            return;
        }
    
        const endTime = Date.now();
        const currentQuestion = questions[questionIndex];
        const correctAnswer = currentQuestion.correct_answer;
        
        // ✅ Assign score based on difficulty level
        const difficulty = currentQuestion.difficulty || "easy";
        const scoreModifier = difficulty === "easy" ? 30 : difficulty === "medium" ? 60 : 100;
    
        let scoreEarned = 0;
        let isCorrect = selectedAnswer === correctAnswer;
    
        if (isCorrect) {
            console.log("✅ Correct Answer!");
    
            switch (attempts) {
                case 0:
                    scoreEarned = scoreModifier;
                    break;
                case 1:
                    scoreEarned = Math.floor(scoreModifier * 0.5);
                    break;
                case 2:
                    scoreEarned = Math.floor(scoreModifier * 0.25);
                    break;
                default:
                    scoreEarned = 0;
            }
    
            setSessionCorrectCount(prev => prev + 1);
            setMessage(`✅ Correct! You earned ${scoreEarned} points.`);
            setScore(prev => prev + scoreEarned);

            // Plan of attack:
            // -1) Load last game and category state upon session; category determination - complete
            // 0) Update GameHx with each attempt - to do
            // 1) After correct, attempts=3 => Update State - complete
            // 2) Send Updated State to Model - to do
            // 3) Append prediction to updated state - to do
            // 4) Do transaction to update state and game history

            // ✅ Update states when correct            
            const totalGameTimeInSec = Math.floor((endTime - gameStartTime) / 1000)
            const newUserState = {
                correct: true,
                elapsed_time: totalGameTimeInSec
            }

            updateUserGameState(newUserState)
            updateUserCategoryState(newUserState)
            transactGameData("trivia", "sub", userGameState, userCategoryState)
            setGameStartTime(Date.now())
            
        } else {
            console.warn("❌ Incorrect Answer!");
            setAttempts(prev => prev + 1);
    
            if (attempts >= 2) {
                setMessage(`❌ Nice try! The correct answer was: ${correctAnswer}`);

                // ✅ Update states when incorrect after three attempts  
                const totalGameTimeInSec = Math.floor((endTime - gameStartTime) / 1000)
                const newUserState = {
                    correct: false,
                    elapsed_time: totalGameTimeInSec
                }

                updateUserGameState(newUserState)
                updateUserCategoryState(newUserState)
                transactGameData("trivia", "sub", userGameState, userCategoryState)
                setGameStartTime(Date.now())

            } else {
                setMessage(`❌ Try Again! (${2 - attempts} attempts left)`);
                return;
            }
        }
    
        // ✅ ONLY increase `questionCount` when an answer is submitted
        setQuestionCount(prev => {
            const newCount = prev + 1;
            console.log(`🔢 Updated Question Count: ${newCount}`);
    
            // ✅ Trigger `endSession` when 10 questions have been **answered**
            if (newCount >= 10) {
                console.log("🏁 Session Over - Calling endSession()");
                endSession(Date.now());  // ✅ Call the function with a timestamp
            } else {
                setTimeout(() => nextQuestion(), 1500);
            }
    
            return newCount;
        });
    
        // ✅ Reset attempts for next question
        setAttempts(0);
    };
    

    
    const nextQuestion = () => {
        if (questionIndex >= questions.length - 1) {
            setMessage("⚠️ No more questions available!");
            return;
        }
    
        const nextIndex = questionIndex + 1;
        setQuestionIndex(nextIndex);
        setSelectedAnswer("");
        setMessage("");
        setAttempts(0);
    
        // Ensure we shuffle the answers *after* setting the new question
        setTimeout(() => {
            shuffleAnswers(questions[nextIndex]);
        }, 100);
    };
    

    return (
        <div className="fraction-game">
            {showSessionSummary && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Session Summary</h2>
                        <p>Questions Answered: {questionCount}</p>
                        <p>Correct Answers: {sessionCorrectCount}</p>
                        <p>Total Score: {score}</p>
                        <p>Total Time: {sessionEndTime}</p>
                        <button onClick={startNewSession}>Start New Session</button>
                        <button onClick={() => window.location.href = "/dashboard"}>Return to Dashboard</button>
                    </div>
                </div>
            )}


            {/* ✅ Decade Selection Modal */}
            {showDecadeModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Select Decades</h2>
                       <p><label><input type="checkbox" value="1950s" onChange={(e) => setSelectedDecades(prev => [...prev, e.target.value])} /> 1950s</label></p>
                       <p><label><input type="checkbox" value="1960s" onChange={(e) => setSelectedDecades(prev => [...prev, e.target.value])} /> 1960s</label></p>
                       <p><label><input type="checkbox" value="1970s" onChange={(e) => setSelectedDecades(prev => [...prev, e.target.value])} /> 1970s</label></p>
                        <p><label><input type="checkbox" value="1980s" onChange={(e) => setSelectedDecades(prev => [...prev, e.target.value])} /> 1980s</label></p>
                        <p><label><input type="checkbox" value="1990s" onChange={(e) => setSelectedDecades(prev => [...prev, e.target.value])} /> 1990s</label></p>
                        <p><label><input type="checkbox" value="2000s" onChange={(e) => setSelectedDecades(prev => [...prev, e.target.value])} /> 2000s</label></p>
                        <button onClick={() => handleSessionStart()}>Start Game</button>
                    </div>
                </div>
            )}

            <div className="scenario-text">{questions[questionIndex]?.question || "⚠️ No More Questions!"}</div>

            <div className="multiple-choice-options">
                {shuffledAnswers.map((option, index) => (
                    <label key={index}>
                        <input type="radio" name="triviaChoice" value={option} checked={selectedAnswer === option} onChange={() => handleAnswerSelection(option)} />
                        <span>{option}</span>
                    </label>
                ))}
            </div>

            <p className="feedback-info">{message}</p>
        </div>
    );
    

});

export default TriviaGame;


