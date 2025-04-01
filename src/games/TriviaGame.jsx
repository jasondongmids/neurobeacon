import React, { useState, useEffect, useContext, useRef, forwardRef, useImperativeHandle } from "react";
import triviaQuestions from "../data/final_trivia_questions.json";
import UserStateContext from "../context/UserStateContext";
import GameHxContext from "../context/GameHxContext";
import UserStatisticsContext from "../context/UserStatisticsContext";
import { invokeModel, getDiffString } from "../functions/Model";

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

    // ✅ Database: State and reference variables
  const { 
      userGameState, userCategoryState, setUserGameState, getUserState, prepareUserGameState,
      updateUserGameState, updateUserCategoryState, transactGameData 
      } = useContext(UserStateContext);
    const { addGameHx } = useContext(GameHxContext)
    const { dailyStats, setDailyStats, weeklyStats, setWeeklyStats,
      userStats, setUserStats, updateTotals, transactStatsData } = useContext(UserStatisticsContext)
    const [gameStartTime, setGameStartTime] = useState(null)
    const [sessionId, setSessionId] = useState("");

    const initGameStateRef = useRef(true)
    const gameRef = useRef("trivia")
    const prevGameStateRef = useRef(userGameState)
    const prevCategoryStateRef = useRef(userCategoryState)
 
    // ✅ Database: Functions and Effects
    const batchWrite = async (newUserState, gameData) => {
      // enable ddb writes
      if (initGameStateRef.current) {
        initGameStateRef.current = false;
      }
      try {
        // update react states
        const isCorrect = newUserState.correct
        const difficulty = newUserState.difficulty
        const newUserStats = updateTotals(userStats, isCorrect, gameRef.current, difficulty)
        setUserStats(newUserStats);
        setDailyStats(updateTotals(dailyStats, isCorrect, gameRef.current, difficulty));
        setWeeklyStats(updateTotals(weeklyStats, isCorrect, gameRef.current, difficulty)); 

        const updatedUserCategoryState = updateUserCategoryState(newUserState);
        const prepState = prepareUserGameState(newUserState, userGameState, updatedUserCategoryState);
        const primaryPrediction = await invokeModel(prepState, 'primary');
        const targetPrediction = await invokeModel(prepState, 'target');
        const finalState = {
        ...prepState,
        score: newUserState.score,
        predicted_difficulty: getDiffString(primaryPrediction),
        target_difficulty: getDiffString(targetPrediction),
        user_embedding: {
          easy_percent: newUserStats.easy.percent_correct,
          medium_percent: newUserStats.medium.percent_correct,
          hard_percent: newUserStats.hard.percent_correct,
        }
        };
        const finalGameData = {
          ...gameData,
          score: newUserState.score
        }
        updateUserGameState(finalState);
        addGameHx(finalGameData);
        return "complete"
      } catch (error) {
        console.error("Error with batch write", error)
      }
    }

    useEffect(() => {
        if (
            prevGameStateRef.current !== userGameState &&
            prevCategoryStateRef.current !== userCategoryState &&
            userGameState != null &&
            userCategoryState != null &&
            initGameStateRef.current == false
        ) {
            transactGameData(gameRef.current, questions[questionIndex].decade, userGameState, userCategoryState);
            transactStatsData(userStats, dailyStats, weeklyStats)
        }
        prevGameStateRef.current = userGameState;
        prevCategoryStateRef.current = userCategoryState;
    }, [userGameState])
    // Database: End Updates

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
        setSessionId(crypto.randomUUID()); // Database: generate new sessionId
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

        // Database: Load category totals
        getUserState(gameRef.current, randomizedQuestions[0]?.decade);
        if (initGameStateRef.current) {
          getUserState(gameRef.current, "");
        }

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

    // JLD 3/11 - think we can remove; not currently in use; or see below and redo
    // const handleSessionStart = () => {
    //     setShowDecadeModal(false); 
    //     loadFilteredQuestions();
    //     if (initStateRef) { // added session start update
    //         getUserState("trivia", ""); 
    //         getUserState("trivia", "sub");
    //     } 
    // };

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
    
        const currentQuestion = questions[questionIndex];
        const correctAnswer = currentQuestion.correct_answer;
        const totalGameTimeMs = Math.floor(Date.now() - gameStartTime)
        
        // ✅ Assign score based on difficulty level
        const difficulty = currentQuestion.difficulty || "easy";
        const scoreModifier = difficulty === "easy" ? 30 : difficulty === "medium" ? 60 : 100;
    
        let scoreEarned = 0;
        let isCorrect = selectedAnswer === correctAnswer;

        // Database: Variables for database updates
        // const difficultyInt = difficulty === "easy" ? 0 : difficulty === "medium" ? 1 : 2;
        const gameCategory = currentQuestion.decade; // perhaps create state var
        const gameData = {
          question_id: "placeholder",
          question_type: gameRef.current,
          question_category: gameCategory,
          difficulty: difficulty,
          game_time_ms: Math.min(totalGameTimeMs, 2147483647),
          session_id: sessionId,
          session_time_ms: 2000, // placeholder before implementing,
          attempt: attempts + 1,
          user_answer: selectedAnswer,
          is_correct: isCorrect,
        };
        const newUserState = {
          elapsed_time: Math.min(totalGameTimeMs, 2147483647),
          difficulty: difficulty,
          game_type: gameRef.current,
          category: gameCategory     
        };
    
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
            // 4) Do transaction to update state and game history - to do game hx

            // ✅ Database: Update user state and game hx when correct     
            newUserState.correct = true
            newUserState.score = scoreEarned
            batchWrite(newUserState, gameData)

            setGameStartTime(Date.now())
            
        } else {
            console.warn("❌ Incorrect Answer!");
            setAttempts(prev => prev + 1);
    
            if (attempts >= 2) {
                setMessage(`❌ Nice try! The correct answer was: ${correctAnswer}`);

                // ✅ Database: Update user state when incorrect after three attempts  
                newUserState.correct = false
                newUserState.score = 0
                batchWrite(newUserState, gameData)

                setGameStartTime(Date.now())

            } else {
                setMessage(`❌ Try Again! (${2 - attempts} attempts left)`);

                // Database: Update game hx per attempt
                gameData.score = 0
                addGameHx(gameData)
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

        // UPDATE DIFFICULTY LOGIC HERE
    
        const nextIndex = questionIndex + 1;
        
        // Database: Load new state if category is different
        if (questions[questionIndex]?.decade != questions[nextIndex]?.decade) {
            getUserState(gameRef.current, questions[0]?.decade);
        }
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
              {/* Added Rules Section */}
      <div style={{ color: "white", margin: "16px 0", fontSize: "1.2em" }}>
        <h3 style={{ fontSize: "1.4em" }}>Game Rules:</h3>
        <p>Answer trivia questions from your selected decades.</p>
        <p>Points are awarded based on difficulty and speed.</p>
        <p>Try to answer quickly to maximize your score!</p>
      </div>
      <h2 style={{ fontSize: "1.4em" }}>Select Decades</h2>

      <p>
        <label>
          <input
            type="checkbox"
            value="1950s"
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedDecades((prev) => [
                  ...new Set([...prev, e.target.value]),
                ]);
              } else {
                setSelectedDecades((prev) =>
                  prev.filter((val) => val !== e.target.value)
                );
              }
            }}
          />{" "}
          1950s
        </label>
      </p>

      <p>
        <label>
          <input
            type="checkbox"
            value="1960s"
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedDecades((prev) => [
                  ...new Set([...prev, e.target.value]),
                ]);
              } else {
                setSelectedDecades((prev) =>
                  prev.filter((val) => val !== e.target.value)
                );
              }
            }}
          />{" "}
          1960s
        </label>
      </p>

      <p>
        <label>
          <input
            type="checkbox"
            value="1970s"
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedDecades((prev) => [
                  ...new Set([...prev, e.target.value]),
                ]);
              } else {
                setSelectedDecades((prev) =>
                  prev.filter((val) => val !== e.target.value)
                );
              }
            }}
          />{" "}
          1970s
        </label>
      </p>

      <p>
        <label>
          <input
            type="checkbox"
            value="1980s"
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedDecades((prev) => [
                  ...new Set([...prev, e.target.value]),
                ]);
              } else {
                setSelectedDecades((prev) =>
                  prev.filter((val) => val !== e.target.value)
                );
              }
            }}
          />{" "}
          1980s
        </label>
      </p>

      <p>
        <label>
          <input
            type="checkbox"
            value="1990s"
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedDecades((prev) => [
                  ...new Set([...prev, e.target.value]),
                ]);
              } else {
                setSelectedDecades((prev) =>
                  prev.filter((val) => val !== e.target.value)
                );
              }
            }}
          />{" "}
          1990s
        </label>
      </p>

      <p>
        <label>
          <input
            type="checkbox"
            value="2000s"
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedDecades((prev) => [
                  ...new Set([...prev, e.target.value]),
                ]);
              } else {
                setSelectedDecades((prev) =>
                  prev.filter((val) => val !== e.target.value)
                );
              }
            }}
          />{" "}
          2000s
        </label>
      </p>
      <button
        onClick={() => {
          // Hide the modal
          setShowDecadeModal(false);
          // Reset the session start time
          setSessionStartTime(Date.now());
          setGameStartTime(Date.now());
          // Load the filtered questions
          loadFilteredQuestions();
          // Database: Load last game state and create sessionId
          // if (initGameStateRef) { // added session start update
          //   getUserState(gameRef.current, "");
          //   initGameStateRef.current = false 
          // }
          setSessionId(crypto.randomUUID()); 
        }}
      >
        Start Game
      </button>
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

            <p className="feedback-info"style={{ color: "black" }}>{message}</p>
        </div>
    );
    

});

export default TriviaGame;


