import { useRef, useEffect, useState, forwardRef, useImperativeHandle, useContext } from "react";
import UserStateContext from "../context/UserStateContext";
import GameHxContext from "../context/GameHxContext";
import { invokeModel } from "../functions/Model";

// ─────────────────────────────────────────────────────────────────────────────
//                           HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

const getRandomDenominator = (denominatorsList) =>
  denominatorsList[Math.floor(Math.random() * denominatorsList.length)];

const getRandomNumerator = (denom) =>
  Math.floor(Math.random() * denom) + 1;

const getRandomWholeNumber = (min = 1, max = 20) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
const lcm = (a, b) => Math.floor((a / gcd(a, b)) * b);

// Simplify a fraction and return a string. If denominator becomes 1, return the whole number.
const simplifyFraction = (num, denom) => {
  const divisor = gcd(num, denom);
  const simplifiedNum = num / divisor;
  const simplifiedDenom = denom / divisor;
  return simplifiedDenom === 1 ? `${simplifiedNum}` : `${simplifiedNum}/${simplifiedDenom}`;
};

// Simplify user input fraction string so that "2/4" becomes "1/2"
const simplifyUserInput = (input) => {
  const parts = input.split("/");
  if (parts.length !== 2) return input; // not a fraction format; return as-is
  const num = parseInt(parts[0], 10);
  const denom = parseInt(parts[1], 10);
  if (isNaN(num) || isNaN(denom) || denom === 0) return input;
  return simplifyFraction(num, denom);
};

// Validate a generated problem to ensure it is mathematically valid.
function validateProblem(randomProblem, n1, d1, n2, d2) {
  if (randomProblem.scenario_type === "fraction-subtraction") {
    const commonDenom = lcm(d1, d2);
    const numerator1 = n1 * (commonDenom / d1);
    const numerator2 = n2 * (commonDenom / d2);
    if (numerator1 < numerator2) return false;
  }
  if (randomProblem.type === "whole-number" && randomProblem.operation === "/") {
    if (n2 === 0 || n1 % n2 !== 0) return false;
  }
  return true;
}

const generateNearMisses = (correctNumerator, correctDenom) => {
  const nearMisses = new Set();
  while (nearMisses.size < 3) {
    const nMiss = correctNumerator + (Math.floor(Math.random() * 3) - 1);
    const dMiss = correctDenom + (Math.floor(Math.random() * 3) - 1);
    if (nMiss <= 0 || dMiss <= 0) continue;
    if (nMiss === correctNumerator && dMiss === correctDenom) continue;
    nearMisses.add(`${nMiss}/${dMiss}`);
  }
  return Array.from(nearMisses);
};

const generateWholeNumberNearMisses = (correctAnswer) => {
  const nearMisses = new Set();
  const correctValue = parseInt(correctAnswer);
  while (nearMisses.size < 3) {
    const miss = correctValue + (Math.floor(Math.random() * 5) - 2);
    if (miss === correctValue || miss <= 0) continue;
    nearMisses.add(miss.toString());
  }
  return Array.from(nearMisses);
};

// ─────────────────────────────────────────────────────────────────────────────
//               FRACTION ADDITION GAME COMPONENT (Updated)
// ─────────────────────────────────────────────────────────────────────────────

const FractionAdditionGame = forwardRef(({ onUpdateStats }, ref) => {
  // ----- State Declarations -----
  const [problems, setProblems] = useState([]);
  const [currentProblem, setCurrentProblem] = useState(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [sessionOver, setSessionOver] = useState(false);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [sessionCorrectCount, setSessionCorrectCount] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionEndTime, setSessionEndTime] = useState("");

  // Problem values (fractions or whole numbers)
  const [n1, setNum1] = useState(0);
  const [d1, setDen1] = useState(0);
  const [n2, setNum2] = useState(0);
  const [d2, setDen2] = useState(0);
  const [f1, setF1] = useState("");
  const [f2, setF2] = useState("");
  const [lcd, setLCD] = useState(0);

  // User inputs:
  const [userNumerator, setUserNumerator] = useState("");
  const [userDenominator, setUserDenominator] = useState("");
  const [userAnswer, setUserAnswer] = useState(""); // for whole-number input

  // Game feedback and scoring:
  const [message, setMessage] = useState("");
  const [score, setScore] = useState(0);
  const [scoreModifier, setScoreModifier] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(null);
  const [scenarioText, setScenarioText] = useState("");
  const [choices, setChoices] = useState([]); // for multiple-choice mode
  const [selectedChoice, setSelectedChoice] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [inputMode, setInputMode] = useState("input"); // "input" or "multiple-choice"

  // Final stats for panel/modal:
  const [finalStats, setFinalStats] = useState({
    score: "0.00",
    accuracy: "0.00",
    avgReactionTime: "N/A",
  });

  // Difficulty and session limits:
  const [difficulty, setDifficulty] = useState("easy");
  const maxRounds = 10;

  // Flag to prevent rapid duplicate generation:
  const [isGenerating, setIsGenerating] = useState(false);

  // Database: State and reference variables
  const { 
      userGameState, userCategoryState, getUserState, prepareUserGameState,
      updateUserGameState, updateUserCategoryState, transactGameData 
      } = useContext(UserStateContext);
  const { addGameHx } = useContext(GameHxContext)
  const [sessionId, setSessionId] = useState("");  

  const initGameStateRef = useRef(true)
  const gameRef = useRef("math")
  const prevGameStateRef = useRef(userGameState)
  const prevCategoryStateRef = useRef(userCategoryState)

  // ----- Effects -----
  // 1) Fetch problems from "/problems.json" on mount, then start the session.
  useEffect(() => {
    fetch("/problems.json")
      .then((res) => res.json())
      .then((data) => {
        console.log("🔌 Loaded problems:", data);
        setProblems(data || []);
        // Start session with the loaded data.
        startNewSession(data || []);
      })
      .catch((error) => console.error("Failed to load problems:", error));
  }, []);

  // 2) Update stats for the panel/modal whenever score, correct count, or question count changes.
  useEffect(() => {
    if (onUpdateStats) {
      onUpdateStats({
        score,
        correctAnswers: sessionCorrectCount,
        questionsAnswered: questionCount,
        accuracy:
          questionCount > 0
            ? ((sessionCorrectCount / questionCount) * 100).toFixed(2)
            : 0,
      });
    }
  }, [score, sessionCorrectCount, questionCount]);

  // 3) Expose imperative functions so parent components can call them.
  useImperativeHandle(ref, () => ({
    handleSubmit,
    generateNewProblem,
    resetInputs,
  }));

  // Database: Functions and Effects
  const batchWrite = async (newUserState, gameData) => {
    // enable ddb writes
    if (initGameStateRef.current) {
      initGameStateRef.current = false;
    }
    try {
      updateUserCategoryState(newUserState);
      const prepState = prepareUserGameState(newUserState, userGameState, userCategoryState);
      const primaryPrediction = await invokeModel(prepState, 'primary');
      const targetPrediction = await invokeModel(prepState, 'target');
      const finalState = {
       ...prepState,
       score: newUserState.score,
       predicted_difficulty: primaryPrediction,
       target_difficulty: targetPrediction 
      };
      const finalGameData = {
        ...gameData,
        score: newUserState.score
      }
      updateUserGameState(finalState);
      addGameHx(finalGameData);
      return "complete"
    } catch (error) {
      console.error("Error with batch write")
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
        transactGameData(gameRef.current, currentProblem.scenario_type, userGameState, userCategoryState)
    }
    prevGameStateRef.current = userGameState;
    prevCategoryStateRef.current = userCategoryState;
}, [userGameState])

  // ----- Start New Session -----  
  // Accepts loadedData from fetch.
  const startNewSession = (loadedData) => {
    console.log("🔄 Starting New Session...");
    setSessionOver(false);
    setScore(0);
    setQuestionCount(0);
    setSessionCorrectCount(0);
    setShowSessionSummary(false);
    setSessionEndTime("");
    setUserNumerator("");
    setUserDenominator("");
    setUserAnswer("");
    setAttempts(0);
    setMessage("");
    setSessionStartTime(Date.now());
    setSessionId(crypto.randomUUID()); // Database: generate sessionId
    // Delay to allow state resets, then generate the first problem using loaded data.
    setTimeout(() => {
      console.log("🆕 Generating first problem...");
      generateNewProblem(loadedData);
    }, 200);
  };

  // ----- Generate New Problem -----
  // Accepts an optional array of loadedProblems.
  const generateNewProblem = (loadedProblems = problems) => {
    if (isGenerating) return;
    setIsGenerating(true);
    if (!loadedProblems.length || questionCount >= maxRounds) {
      setSessionOver(true);
      setIsGenerating(false);
      return;
    }
    const randomProblem = loadedProblems[Math.floor(Math.random() * loadedProblems.length)];
    // Randomly determine input mode.
    const problemType = Math.random() < 0.5 ? "multiple-choice" : "input";
    setCurrentProblem(randomProblem);
    setInputMode(problemType);
    const probDifficulty = randomProblem.difficulty || "easy";
    setDifficulty(probDifficulty);
    const scoreMod = probDifficulty === "easy" ? 30 : probDifficulty === "medium" ? 60 : 100;
    setScoreModifier(scoreMod);

    // Database: Load initial states and reload category state if next problem is different scenario
    if (initGameStateRef.current) {
      getUserState(gameRef.current, randomProblem.scenario_type)
      getUserState(gameRef.current, "");
    }
    if (userCategoryState.category.category != randomProblem.scenario_type) {
      getUserState(gameRef.current, randomProblem.scenario_type)
    }

    // Use scenario_type to drive tailored generation logic.
    switch (randomProblem.scenario_type) {
      case "fraction-addition": {
        const d1 = getRandomDenominator(randomProblem.first_val_possibilities);
        let d2 = getRandomDenominator(randomProblem.second_val_possibilities);
        if (probDifficulty === "easy") d2 = d1;
        const n1 = getRandomNumerator(d1);
        const n2 = getRandomNumerator(d2);
        const commonDenom = lcm(d1, d2);
        const resultNumerator = n1 * (commonDenom / d1) + n2 * (commonDenom / d2);
        const resultDenom = commonDenom;
        const simplified = simplifyFraction(resultNumerator, resultDenom);
        setNum1(n1); setDen1(d1); setNum2(n2); setDen2(d2);
        setF1(`${n1}/${d1}`); setF2(`${n2}/${d2}`);
        const correctAnswer = simplified;
        const nearMissesRaw = generateNearMisses(resultNumerator, resultDenom);
        const nearMisses = nearMissesRaw.map((frac) => {
          const [numStr, denomStr] = frac.split("/");
          return simplifyFraction(parseInt(numStr), parseInt(denomStr));
        });
        const allChoices = [correctAnswer, ...nearMisses].sort(() => Math.random() - 0.5);
        setChoices(allChoices);
        const scenario = randomProblem.scenario_text
          .replace("_f1_", `${n1}/${d1}`)
          .replace("_f2_", `${n2}/${d2}`);
        setScenarioText(scenario);
        break;
      }
      case "fraction-subtraction": {
        const d1 = getRandomDenominator(randomProblem.first_val_possibilities);
        let d2 = getRandomDenominator(randomProblem.second_val_possibilities);
        if (probDifficulty === "easy") d2 = d1;
        let n1 = getRandomNumerator(d1);
        let n2 = getRandomNumerator(d2);
        const commonDenom = lcm(d1, d2);
        // For fraction subtraction, ensure that f1 is not smaller than f2.
        const num1Val = n1 * (commonDenom / d1);
        const num2Val = n2 * (commonDenom / d2);
        if (num1Val < num2Val) {
          [n1, n2] = [n2, n1];
        }
        if (!validateProblem(randomProblem, n1, d1, n2, d2)) {
          console.warn("Invalid fraction subtraction; regenerating...");
          setIsGenerating(false);
          return generateNewProblem(loadedProblems);
        }
        const resultNumerator = n1 * (commonDenom / d1) - n2 * (commonDenom / d2);
        const resultDenom = commonDenom;
        const simplified = simplifyFraction(resultNumerator, resultDenom);
        setNum1(n1); setDen1(d1); setNum2(n2); setDen2(d2);
        setF1(`${n1}/${d1}`); setF2(`${n2}/${d2}`);
        const correctAnswer = simplified;
        const nearMissesRaw = generateNearMisses(resultNumerator, resultDenom);
        const nearMisses = nearMissesRaw.map((frac) => {
          const [numStr, denomStr] = frac.split("/");
          return simplifyFraction(parseInt(numStr), parseInt(denomStr));
        });
        const allChoices = [correctAnswer, ...nearMisses].sort(() => Math.random() - 0.5);
        setChoices(allChoices);
        const scenario = randomProblem.scenario_text
          .replace("_f1_", `${n1}/${d1}`)
          .replace("_f2_", `${n2}/${d2}`);
        setScenarioText(scenario);
        break;
      }
      case "whole-addition": {
        const n1 = getRandomWholeNumber(1, 20);
        const n2 = getRandomWholeNumber(1, 20);
        const correctAnswer = n1 + n2;
        setNum1(n1); setNum2(n2);
        setF1(`${n1}`); setF2(`${n2}`);
        const allChoices = problemType === "multiple-choice" ? [correctAnswer.toString(), ...generateWholeNumberNearMisses(correctAnswer)] : [];
        setChoices(allChoices);
        const scenario = randomProblem.scenario_text
          .replace("_val1_", `${n1}`)
          .replace("_val2_", `${n2}`);
        setScenarioText(scenario);
        break;
      }
      case "whole-subtraction": {
        const n1 = getRandomWholeNumber(10, 20);
        const n2 = getRandomWholeNumber(1, n1); // ensures n1 >= n2
        const correctAnswer = n1 - n2;
        setNum1(n1); setNum2(n2);
        setF1(`${n1}`); setF2(`${n2}`);
        const allChoices = problemType === "multiple-choice" ? [correctAnswer.toString(), ...generateWholeNumberNearMisses(correctAnswer)] : [];
        setChoices(allChoices);
        const scenario = randomProblem.scenario_text
          .replace("_val1_", `${n1}`)
          .replace("_val2_", `${n2}`);
        setScenarioText(scenario);
        break;
      }
      case "whole-multiplication": {
        const n1 = getRandomWholeNumber(1, 20);
        const n2 = getRandomWholeNumber(1, 20);
        const correctAnswer = n1 * n2;
        setNum1(n1); setNum2(n2);
        setF1(`${n1}`); setF2(`${n2}`);
        const allChoices = problemType === "multiple-choice" ? [correctAnswer.toString(), ...generateWholeNumberNearMisses(correctAnswer)] : [];
        setChoices(allChoices);
        const scenario = randomProblem.scenario_text
          .replace("_val1_", `${n1}`)
          .replace("_val2_", `${n2}`);
        setScenarioText(scenario);
        break;
      }
      case "whole-division": {
        // Generate numbers so that n1 is exactly divisible by n2.
        const n2 = getRandomWholeNumber(1, 10);
        const multiplier = getRandomWholeNumber(2, 10);
        const n1 = n2 * multiplier;
        const correctAnswer = Math.floor(n1 / n2);
        setNum1(n1); setNum2(n2);
        setF1(`${n1}`); setF2(`${n2}`);
        const allChoices = problemType === "multiple-choice" ? [correctAnswer.toString(), ...generateWholeNumberNearMisses(correctAnswer)] : [];
        setChoices(allChoices);
        const scenario = randomProblem.scenario_text
          .replace("_val1_", `${n1}`)
          .replace("_val2_", `${n2}`);
        setScenarioText(scenario);
        break;
      }
      default:
        console.error("Unsupported scenario_type:", randomProblem.scenario_type);
        setIsGenerating(false);
        return;
    }
    // Reset inputs and timers.
    setUserNumerator("");
    setUserDenominator("");
    setUserAnswer("");
    setMessage("");
    setElapsedTime(null);
    setAttempts(0);
    setSelectedChoice("");
    setStartTime(Date.now());
    setIsGenerating(false);
  };

  // ----- Handle Submission -----
  const handleSubmit = () => {
    console.log("📤 Submit button clicked");
    if (sessionOver) {
      console.warn("❌ Session is over, ignoring submit.");
      return;
        }
       // Check if an answer has been provided.
    if (inputMode === "multiple-choice" && !selectedChoice) {
      setMessage("❌ Please select an answer!");
      return;
    }
    if (inputMode === "input") {
      if (currentProblem.type === "fraction" && (!userNumerator || !userDenominator)) {
        setMessage("❌ Please enter both numerator and denominator!");
        return;
      }
      if (currentProblem.type === "whole-number" && !userAnswer) {
        setMessage("❌ Please enter your answer!");
        return;
      }
    }
 
    const endTime = Date.now();
    let isCorrect = false;
    let correctValue;
    let userInputValue;
  
    if (currentProblem.type === "fraction") {
      // Recompute the correct answer (already simplified when generated)
      correctValue = simplifyFraction(
        currentProblem.operation === "+"
          ? (n1 * (lcm(d1, d2) / d1) + n2 * (lcm(d1, d2) / d2))
          : (n1 * (lcm(d1, d2) / d1) - n2 * (lcm(d1, d2) / d2)),
        lcm(d1, d2)
      );
      userInputValue = `${userNumerator}/${userDenominator}`;
      // Simplify user's input so that "2/4" becomes "1/2"
      const simplifiedUserInput = simplifyUserInput(userInputValue);
      isCorrect = selectedChoice === correctValue || simplifiedUserInput === correctValue;
    } else if (currentProblem.type === "whole-number") {
      switch (currentProblem.operation) {
        case "+":
          correctValue = (n1 + n2).toString();
          break;
        case "-":
          correctValue = (n1 - n2).toString();
          break;
        case "*":
          correctValue = (n1 * n2).toString();
          break;
        case "/":
          correctValue = Math.floor(n1 / n2).toString();
          break;
        default:
          console.error("❌ Invalid operation in submission:", currentProblem.operation);
      }
      if (inputMode === "multiple-choice") {
        isCorrect = selectedChoice === correctValue;
      } else {
        userInputValue = userAnswer;
        isCorrect = userInputValue === correctValue;
      }
    }

    // Database: variables for database updates
    const difficultyInt = difficulty === "easy" ? 0 : difficulty === "medium" ? 1 : 2;
    const gameCategory = currentProblem.scenario_type;
    const gameData = {
      question_id: currentProblem.id,
      question_type: gameRef.current,
      question_category: gameCategory,
      difficulty: difficultyInt,
      // game_time_ms: 100, // placeholder
      session_id: sessionId,
      session_time_ms: 2000, // placeholder before implementing,
      attempt: attempts + 1,
      user_answer: selectedChoice,
      is_correct: isCorrect,
    }
    const newUserState = {
      // elapsed_time: Math.min(reaction * 1000, 2147483647),
      difficulty: difficultyInt,
      category: gameCategory     
    };
  
    let scoreEarned = 0;
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
      setSessionCorrectCount((prev) => prev + 1);
      setMessage(`✅ Correct! You earned ${scoreEarned} points.`);
      setElapsedTime(((endTime - startTime) / 1000).toFixed(2));
      setScore((prev) => prev + scoreEarned);
      setQuestionCount((prev) => {
        const newCount = prev + 1;
        if (newCount >= maxRounds) {
          endSession(endTime);
        } else {
          setTimeout(() => generateNewProblem(), 1500);
        }
        return newCount;
      });

      // Database: Update user state and game hx when correct
      newUserState.correct = true;
      newUserState.score = scoreEarned;
      newUserState.elapsed_time = Math.min(elapsedTime * 1000, 2147483647);
      gameData.game_time_ms = Math.min(elapsedTime * 1000, 2147483647);
      batchWrite(newUserState, gameData)

    } else {
      console.warn("❌ Incorrect Answer!");
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) {
        setMessage(`❌ Nice try! The correct answer was ${correctValue}.`);
        setElapsedTime(((endTime - startTime) / 1000).toFixed(2));

        // Database: Update user state when incorrect after three attempts
        newUserState.correct = false
        newUserState.score = 0
        newUserState.elapsed_time = Math.min(elapsedTime * 1000, 2147483647);
        gameData.game_time_ms = Math.min(elapsedTime * 1000, 2147483647);
        batchWrite(newUserState, gameData)

        setQuestionCount((prev) => {
          const newCount = prev + 1;
          if (newCount >= maxRounds) {
            endSession(endTime);
          } else {
            setTimeout(() => generateNewProblem(), 2500);
          }
          return newCount;
        });
      } else {
        setMessage(`❌ Try Again! (${3 - newAttempts} attempts left)`);

        // Database: Update game hx per attempt
        gameData.score = 0
        addGameHx(gameData)
      }
    }
  };

  // ----- End Session -----
  const endSession = (endTime) => {
    console.log("🛑 Ending session...");
    setSessionOver(true);
    if (!sessionStartTime) {
      console.error("🚨 sessionStartTime is NULL. Using current timestamp as fallback.");
      setSessionStartTime(Date.now());
      return;
    }
    const totalTimeInMs = endTime - sessionStartTime;
    if (totalTimeInMs < 0) {
      console.error("❌ Total time calculation error: Negative time detected.");
      return;
    }
    const totalTimeInSec = Math.floor(totalTimeInMs / 1000);
    const minutes = Math.floor(totalTimeInSec / 60);
    const seconds = totalTimeInSec % 60;
    setSessionEndTime(
      minutes > 0 ? `${minutes} min ${seconds} sec` : `${seconds} sec`
    );
    setTimeout(() => {
      setShowSessionSummary(true);
    }, 500);
  };

  // ----- Reset Inputs -----
  const resetInputs = () => {
    console.log("🔄 Resetting input fields...");
    setUserNumerator("");
    setUserDenominator("");
    setUserAnswer("");
    setMessage("");
    setSelectedChoice("");
  };

  // ----- Update Stats for Panel & Modal -----
  const updateStats = (updatedRound) => {
    const avgReaction = "N/A"; // Not used in math game.
    const newAccuracy =
      updatedRound > 0
        ? ((sessionCorrectCount / updatedRound) * 100).toFixed(2)
        : "0.00";
    const newScore = score.toFixed(2);
    const updatedStats = {
      score: newScore,
      accuracy: newAccuracy,
      avgReactionTime: avgReaction,
    };
    setFinalStats(updatedStats);
    if (onUpdateStats) {
      onUpdateStats({
        score: newScore,
        questionsAnswered: updatedRound,
        accuracy: newAccuracy,
      });
    }
  };

  // ----- Render -----
  return (
    <>
      <div className="fraction-game">
        <div className="scenario-text">{scenarioText}</div>

        {inputMode === "input" && currentProblem && currentProblem.type === "fraction" && (
          <div className="fraction-inputs">
            <input
              type="number"
              value={userNumerator}
              onChange={(e) => setUserNumerator(e.target.value)}
              placeholder="Numerator"
            />
            <span>/</span>
            <input
              type="number"
              value={userDenominator}
              onChange={(e) => setUserDenominator(e.target.value)}
              placeholder="Denominator"
            />
          </div>
        )}

        {inputMode === "input" && currentProblem && currentProblem.type === "whole-number" && (
          <div className="fraction-inputs">
            <input
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Answer"
            />
          </div>
        )}

        {inputMode === "multiple-choice" && (
          <div>
            <p style={{ fontSize: "40px", marginBottom: "8px", color: "#333" }}>
              Please choose one answer:
            </p>
            <div className="multiple-choice-options">
              {choices.map((choice, index) => (
                <label key={index}>
                  <input
                    type="radio"
                    name="fractionChoice"
                    value={choice}
                    checked={selectedChoice === choice}
                    onChange={(e) => setSelectedChoice(e.target.value)}
                  />
                  <span>{choice}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="fraction-feedback">
          {message && (
            <p className={`feedback ${message.includes("✅") ? "success" : "error"}`}>
              {message}
            </p>
          )}
          <p className="feedback-info">Score: {score}</p>
          {elapsedTime && (
            <p className="feedback-info">Total Time: {elapsedTime} sec</p>
          )}
        </div>
      </div>

      {showSessionSummary && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Session Summary</h2>
            <p>Questions Answered: {questionCount}</p>
            <p>Correct Answers: {sessionCorrectCount}</p>
            <p>
              Accuracy: {questionCount > 0
                ? ((sessionCorrectCount / questionCount) * 100).toFixed(2)
                : "0.00"}%
            </p>
            <p>Total Score: {score}</p>
            <p>Total Time: {sessionEndTime ? sessionEndTime : "N/A"}</p>

            <button
              onClick={() => {
                console.log("🔄 Restarting Game and Loading Next Task...");
                startNewSession();
                setTimeout(() => {
                  console.log("➡️ Loading Next Task...");
                  window.handleNextTask?.();
                }, 300);
              }}
            >
              Start New Session
            </button>

            <button
              onClick={() => {
                console.log("📌 Returning to Dashboard...");
                window.location.href = "/dashboard";
              }}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </>
  );
});

export default FractionAdditionGame;
