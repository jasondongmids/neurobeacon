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
    const [groupedQuestions, setGroupedQuestions] = useState({});
    const [usedQuestionIds, setUsedQuestionIds] = useState(new Set());
    const [currentDifficulty, setCurrentDifficulty] = useState("easy");

    
    // ✅ New State: Decade Selection
    const [showDecadeModal, setShowDecadeModal] = useState(true);
    const [selectedDecades, setSelectedDecades] = useState([]);
    const [decadeError, setDecadeError] = useState("");


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
        const isCorrect = newUserState.correct;
        const difficulty = newUserState.difficulty;
    
        // 🧠 Update local React stats
        const newUserStats = updateTotals(userStats, isCorrect, gameRef.current, difficulty);
        setUserStats(newUserStats);
        setDailyStats(updateTotals(dailyStats, isCorrect, gameRef.current, difficulty));
        setWeeklyStats(updateTotals(weeklyStats, isCorrect, gameRef.current, difficulty));
    
        // 🧠 Prepare updated state and get predictions
        const updatedUserCategoryState = updateUserCategoryState(newUserState);
        const prepState = prepareUserGameState(newUserState, userGameState, updatedUserCategoryState);
    
        const primaryPrediction = await invokeModel(prepState, "primary");
        const targetPrediction = await invokeModel(prepState, "target");
    
        const predictedDifficulty = getDiffString(primaryPrediction);
        const targetDiff = getDiffString(targetPrediction);
    
        // ✅ Build final state including actual new difficulty to use
        const finalState = {
          ...prepState,
          difficulty: predictedDifficulty, // 👈 This line makes dynamic difficulty WORK!
          score: newUserState.score,
          predicted_difficulty: predictedDifficulty,
          target_difficulty: targetDiff,
          user_embedding: {
            easy_percent: newUserStats.easy.percent_correct,
            medium_percent: newUserStats.medium.percent_correct,
            hard_percent: newUserStats.hard.percent_correct,
          },
        };
    
        const finalGameData = {
          ...gameData,
          score: newUserState.score,
        };
    
        updateUserGameState(finalState);
        setCurrentDifficulty(predictedDifficulty); // ✅ this updates the difficulty for nextQuestion()
        console.log(`📈 Model predicted: ${predictedDifficulty} | Setting difficulty to: ${finalState.difficulty}`);
        addGameHx(finalGameData);
    
        return "complete";
      } catch (error) {
        console.error("Error with batch write", error);
      }
    };


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
        setGameStartTime(Date.now());
        setSessionId(crypto.randomUUID()); // Database: generate new sessionId
        setQuestions([]);
        setQuestionIndex(0);
        setSelectedDecades([]); // ✅ Reset selected decades
        setShowDecadeModal(true); // 👈 keep this last to ensure a clean modal

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
    
      // 🟡 Debug: log the currently selected decades
      console.log("📅 Decades filter applied:", selectedDecades);
    
      if (selectedDecades.length === 0 || selectedDecades.includes("all")) {
        console.warn("⚠️ No decades selected or 'all' selected — using full question set.");
      } else {
        filteredQuestions = triviaQuestions.filter(q => selectedDecades.includes(q.decade));
      }
    
      // Ensure IDs and difficulty tags
      filteredQuestions = filteredQuestions.map((q, index) => ({
        ...q,
        id: q.id || index,
        difficulty: q.difficulty || "easy",
      }));
    
      const randomized = filteredQuestions.sort(() => Math.random() - 0.5);
      const grouped = groupQuestionsByDecadeAndDifficulty(randomized);
    
      // 🔍 Existing logs (keep!)
      console.log("✅ Loaded questions:", randomized.length);
      console.log("📊 Grouped counts:");
      console.log("Easy:", grouped.easy?.length || 0);
      console.log("Medium:", grouped.medium?.length || 0);
      console.log("Hard:", grouped.hard?.length || 0);
    
      setGroupedQuestions(grouped);
      setUsedQuestionIds(new Set());
    
      if (randomized.length > 0) {
        getUserState(gameRef.current, randomized[0]?.decade);
      }
      if (initGameStateRef.current) {
        getUserState(gameRef.current, "");
      }
    };


    // 👁️ Watch for groupedQuestions being populated, then launch first question
    useEffect(() => {
      if (Object.keys(groupedQuestions).length > 0) {
        console.log("✅ Grouped questions ready — calling nextQuestion()");
        nextQuestion();
      }
    }, [groupedQuestions]);

      
    function groupQuestionsByDecadeAndDifficulty(questions) {
        return questions.reduce((acc, q) => {
          const decade = q.decade || "unknown";
          const difficulty = q.difficulty || "easy";
      
          if (!acc[decade]) acc[decade] = {};
          if (!acc[decade][difficulty]) acc[decade][difficulty] = [];
      
          acc[decade][difficulty].push(q);
          return acc;
        }, {});
      }
      
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
        console.log("➡️ Submitting with difficulty:", difficulty);

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
        console.log("🎯 Using predicted difficulty:", currentDifficulty);
        const currentDecade = questions[questionIndex]?.decade || selectedDecades[0] || "unknown";
        console.log("🎯 Using difficulty:", currentDifficulty);
        
        const decadeGroup = groupedQuestions[currentDecade] || {};
        const pool = decadeGroup[currentDifficulty] || [];
      
        const available = pool.filter(q => !usedQuestionIds.has(q.id));
      
        console.log("🎯 Requested:", currentDecade, "/", currentDifficulty);
        console.log("📚 Available:", available.length);
        console.log("🧠 used IDs:", [...usedQuestionIds]);
      
        if (available.length === 0) {
          // Fallback: try any question in same decade
          const fallbackPool = Object.values(decadeGroup).flat().filter(q => !usedQuestionIds.has(q.id));
          if (fallbackPool.length === 0) {
            setMessage("✅ All questions answered for this decade! Well done.");
            return;
          }
          const fallback = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
          addToUsedAndSet(fallback);
        } else {
          const next = available[Math.floor(Math.random() * available.length)];
          addToUsedAndSet(next);
        }
      
        setSelectedAnswer("");
        setMessage("");
        setAttempts(0);
      };
      
      
      const addToUsedAndSet = (question) => {
        setUsedQuestionIds(prev => new Set(prev).add(question.id));
        setQuestions(prev => [...prev, question]);
        setQuestionIndex(questions.length);
        setTimeout(() => shuffleAnswers(question), 100);
      };
      
    useEffect(() => {
  if (!showDecadeModal) {
    console.log("📦 Decade modal closed — loading filtered questions for:", selectedDecades);
    loadFilteredQuestions();
  }
}, [showDecadeModal, selectedDecades]);


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
      {/* 🧠 Game Rules */}
      <div style={{ color: "white", margin: "16px 0", fontSize: "1.2em" }}>
        <h2 style={{ fontSize: "1.4em" }}>Game Rules:</h2>
        <p>Answer trivia questions from your selected decades by clicking on the answer followed by the Submit Answer Button.</p>
        <p>Points are awarded based on difficulty and speed. Test 13</p>
        <p>Try to answer quickly to maximize your score!</p>
        <p>Feel free to click the Skip Question button to get a new question with no scoring penalty!</p>
      </div>

      <h2 style={{ fontSize: "1.4em" }}>Select Decades</h2>

      {["1950s", "1960s", "1970s", "1980s", "1990s", "2000s"].map((decade) => (
        <p key={decade}>
          <label>
            <input
              type="checkbox"
              value={decade}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedDecades((prev) => [...new Set([...prev, e.target.value])]);
                } else {
                  setSelectedDecades((prev) => prev.filter((val) => val !== e.target.value));
                }
                setDecadeError(""); // Clear any error on checkbox interaction
              }}
            />{" "}
            {decade}
          </label>
        </p>
      ))}

      {/* ⚠️ Error Message */}
      {decadeError && (
        <p style={{ color: "yellow", fontWeight: "bold", marginBottom: "10px" }}>
          {decadeError}
        </p>
      )}

      <button
        onClick={() => {
          if (selectedDecades.length === 0) {
            setDecadeError("⚠️ Please select at least one decade to begin.");
            return;
          }

          // ✅ Reset full state and reload
          setShowDecadeModal(false);
          setSessionStartTime(Date.now());
          setGameStartTime(Date.now());
          setGroupedQuestions({});
          setUsedQuestionIds(new Set());
          setQuestions([]);
          setQuestionIndex(0);
          setSessionId(crypto.randomUUID());
          setDecadeError(""); // Clear error
          loadFilteredQuestions();
        }}
      >
        Start Game
      </button>
    </div>
  </div>
)}


            <div className="scenario-text">{questions[questionIndex]?.question || "⚠️ No More Questions!"}</div>
            {/* 🔍 Debug-only Difficulty Display */}
            <p style={{ color: "gray", fontSize: "0.9em" }}>
              Difficulty: <strong>{currentDifficulty}</strong> | 
              Decade: <strong>{questions[questionIndex]?.decade || "unknown"}</strong>
            </p>
            
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
