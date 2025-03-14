import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";

// Helper functions...
const getRandomDenominator = (denominatorsList) => {
  return denominatorsList[Math.floor(Math.random() * denominatorsList.length)];
};

const getRandomNumerator = (denominator) => {
  return Math.floor(Math.random() * denominator) + 1;
};

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

const lcm = (a, b) => Math.floor((a / gcd(a, b)) * b);

const processAnswer = (user_numerator, user_denom, correct_answer_value) => {
  const user_answer_value = parseInt(user_numerator) / parseInt(user_denom);
  return user_answer_value === correct_answer_value ? "Correct" : "Incorrect";
};
const generateWholeNumberNearMisses = (correctAnswer) => {
    const nearMisses = new Set();
    const correctValue = parseInt(correctAnswer); // Ensure correctAnswer is treated as a number

    while (nearMisses.size < 3) {
        const miss = correctValue + (Math.floor(Math.random() * 5) - 2); // Near misses within +/- 2 range
        if (miss === correctValue || miss <= 0) continue; // Avoid correct answer and negative/zero values
        nearMisses.add(miss.toString()); // Add as string to match choices array type
    }
    return Array.from(nearMisses);
};
const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
  let words = text.split(" ");
  let line = "";
  let testLine = "";
  let lineArray = [];

  for (let n = 0; n < words.length; n++) {
    testLine += `${words[n]} `;
    let metrics = ctx.measureText(testLine);
    let testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      lineArray.push([line, x, y]);
      y += lineHeight;
      line = `${words[n]} `;
      testLine = `${words[n]} `;
    } else {
      line += `${words[n]} `;
    }

    if (n === words.length - 1) {
      lineArray.push([line, x, y]);
    }
  }
  return lineArray;
};


  const FractionAdditionGame = forwardRef(({ onUpdateStats }, ref) => {

  const [problems, setProblems] = useState([]);
  const [currentProblem, setCurrentProblem] = useState(null);

  const [questionCount, setQuestionCount] = useState(0); // Track the number of questions
  const [sessionOver, setSessionOver] = useState(false); // Track whether the session has ended
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [sessionCorrectCount, setSessionCorrectCount] = useState(0); // Track number of correct answers
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionEndTime, setSessionEndTime] = useState("");



  const [n1, setNum1] = useState(0);
  const [d1, setDen1] = useState(0);
  const [n1_lcd, setN1LCD] = useState(0);
  const [f1, setF1] = useState("");

  const [n2, setNum2] = useState(0);
  const [d2, setDen2] = useState(0);
  const [n2_lcd, setN2LCD] = useState(0);
  const [f2, setF2] = useState("");
 

  const [lcd, setLCD] = useState(0);
  const [userNumerator, setUserNumerator] = useState("");
  const [userDenominator, setUserDenominator] = useState("");
  const [message, setMessage] = useState("");
  const [score, setScore] = useState(0);
  const [scoreModifier, setScoreModifier] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(null);
  const [scenarioText, setScenarioText] = useState("");
  const [choices, setChoices] = useState([]); // Multiple-choice options (4)
  const [selectedChoice, setSelectedChoice] = useState(""); // User's selection
  const [attempts, setAttempts] = useState(0); // Track attempts per problem
  const [inputMode, setInputMode] = useState("input"); // 'input' | 'multiple-choice'

    // ✅ Automatically Start a New Session on Component Mount
    useEffect(() => {
        console.log("🛠 Automatically starting a new session on mount...");
        startNewSession(); 
    }, []);
    useEffect(() => {
        console.log("🔄 sessionOver changed:", sessionOver);
    }, [sessionOver]);
    useEffect(() => {
        if (onUpdateStats) {
            onUpdateStats({
                score,
                correctAnswers: sessionCorrectCount,
                questionsAnswered: questionCount,
                accuracy: questionCount > 0 
                    ? ((sessionCorrectCount / questionCount) * 100).toFixed(2) 
                    : 0,
            });
        } else {
            console.error("❌ onUpdateStats is undefined in FractionAdditionGame.js");
        }
    }, [score, sessionCorrectCount, questionCount]);  // ✅ Re-run when stats change
    
    
    
    const startNewSession = () => {
        console.log("🔄 Starting New Session...");
    
        // ✅ Use Functional Update to Force Reset
        setSessionOver((prev) => {
            console.log("🔄 Resetting sessionOver from:", prev, "to false");
            return false;
        });
    
        // ✅ Reset other state variables
        setScore(0);
        setQuestionCount(0);
        setSessionCorrectCount(0);
        setShowSessionSummary(false);
        setSessionEndTime("");
    
        setUserNumerator(""); 
        setUserDenominator("");
        setAttempts(0);
        setMessage("");
    
        // ✅ Reset session timer
        const newStartTime = Date.now();
        setSessionStartTime(newStartTime);
        console.log("🕒 Session Start Time Set:", newStartTime);
    
        // ✅ Delay problem generation slightly to let state updates apply
        setTimeout(() => {
            console.log("🆕 Generating New Problem...");
            generateNewProblem();
        }, 200);
    };
    
    
    


 


  useImperativeHandle(ref, () => ({
    handleSubmit,
    generateNewProblem,
    resetInputs,
  }));


  const generateNearMisses = (correctNumerator, correctDenominator) => {
    const nearMisses = new Set();
  
    while (nearMisses.size < 3) {
      const nMiss = correctNumerator + (Math.floor(Math.random() * 3) - 1); // -1, 0, or +1
      const dMiss = correctDenominator + (Math.floor(Math.random() * 3) - 1); // -1, 0, or +1
  
      if (nMiss <= 0 || dMiss <= 0) continue;
      if (nMiss === correctNumerator && dMiss === correctDenominator) continue;
  
      nearMisses.add(`${nMiss}/${dMiss}`);
    }
  
    return Array.from(nearMisses);
  };
  

  ///GENERATE NEW PROBLEM
  const generateNewProblem = (loadedProblems = problems) => {
    if (!loadedProblems.length || questionCount >= 10) {
      setSessionOver(true);
      return;
    }
  
    const randomProblem = loadedProblems[Math.floor(Math.random() * loadedProblems.length)];
  
    const problemType = Math.random() < 0.5 ? "multiple-choice" : "free-input";
    setCurrentProblem(randomProblem);
    setInputMode(problemType === "multiple-choice" ? "multiple-choice" : "input");
  
    let val1, val2, operation, correctAnswerValue, displayText;

    if (randomProblem.type === "fraction") {
        // Fraction Problem Logic (Existing logic with slight modifications)
        let d1 = getRandomDenominator(randomProblem.first_val_possibilities);
        let d2 = getRandomDenominator(randomProblem.second_val_possibilities);

        if (difficulty === "easy") d2 = d1;
        const lcd = difficulty === "easy" ? 0 : lcm(d1, d2);

        let n1 = getRandomNumerator(d1);
        let n2 = getRandomNumerator(d2);
        let tempD1 = d1;
        let tempD2 = d2;

        if (n1 / d1 < n2 / d2 && randomProblem.operation === '-') { // Only swap for subtraction to ensure positive result initially for subtraction
            [n1, n2] = [n2, n1];
            [tempD1, tempD2] = [tempD2, tempD1];
        }

        val1 = { n: n1, d: d1 };
        val2 = { n: n2, d: d2 };
        operation = randomProblem.operation;

        setNum1(n1);
        setDen1(d1);
        setNum2(n2);
        setDen2(d2);
        setF1(`${n1}/${d1}`);
        setF2(`${n2}/${d2}`);
        setLCD(lcd);

        if (operation === '+') {
            correctAnswerValue = (n1/d1) + (n2/d2);
            displayText = `${n1}/${d1} + ${n2}/${d2}`;
        } else if (operation === '-') {
            correctAnswerValue = (n1/d1) - (n2/d2);
            displayText = `${n1}/${d1} - ${n2}/${d2}`;
        }


    } else if (randomProblem.type === "whole-number") {
        // Whole Number Problem Logic
        val1 = getRandomDenominator(randomProblem.first_val_possibilities); // Reusing getRandomDenominator for whole numbers from possibilities
        val2 = getRandomDenominator(randomProblem.second_val_possibilities);
        operation = randomProblem.operation;

        if (operation === "+") {
            correctAnswerValue = val1 + val2;
            displayText = `${val1} + ${val2}`;
        } else if (operation === "-") {
            correctAnswerValue = val1 - val2;
            displayText = `${val1} - ${val2}`;
        } else if (operation === "*") {
            correctAnswerValue = val1 * val2;
            displayText = `${val1} x ${val2}`; // Or use * symbol if you prefer: `${val1} * ${val2}`
        } else if (operation === "/") {
            correctAnswerValue = val1 / val2;
            displayText = `${val1} ÷ ${val2}`; // Or use / symbol if you prefer: `${val1} / ${val2}`
             correctAnswerValue = Math.floor(correctAnswerValue); // For whole number division, take the integer part
        }
    }


    setUserNumerator("");
    setUserDenominator("");
    setMessage("");
    setElapsedTime(null);
    setAttempts(0);
    setSelectedChoice("");

    let correctAnswerDisplay;
    if (randomProblem.type === "fraction") {
        correctAnswerDisplay = `${n1 - n2}/${d1}`; // Assuming subtraction is still the main operation for fractions, adjust as needed.
    } else {
        correctAnswerDisplay = correctAnswerValue.toString(); // For whole numbers, just the value
    }


    let nearMisses = [];
    if (randomProblem.type === "fraction") {
         nearMisses = generateNearMisses(n1 - n2, d1); // Keep near misses for fraction for now, can be adjusted later for whole number.
    } else {
        // Generate near misses for whole numbers - you can customize this.
        nearMisses = generateWholeNumberNearMisses(correctAnswerValue); // Function to create near misses for whole numbers. We'll define this below.
    }


    const allChoices = [correctAnswerDisplay, ...nearMisses].sort(() => Math.random() - 0.5);
    setChoices(allChoices);


    let scenario = randomProblem.scenario_text;
    if (randomProblem.type === "fraction") {
        scenario = scenario
            .replace("_f1_", `${val1.n}/${val1.d}`)
            .replace("_f2_", `${val2.n}/${val2.d}`);
    } else if (randomProblem.type === "whole-number") {
        scenario = scenario
            .replace("_val1_", `${val1}`)
            .replace("_val2_", `${val2}`);
    }
    setScenarioText(scenario);
    setStartTime(Date.now());
    };
  
   // Fetch problems.json on initial load
   useEffect(() => {
    fetch("/adv_problems.json")
      .then((response) => response.json())
      .then((data) => {
        setProblems(data);
        generateNewProblem(data);
      })
      .catch((error) => console.error("Failed to load problems:", error));
  }, []); 
  




  const handleSubmit = () => {
    console.log("📤 Submit button clicked");
    console.log("🔍 Checking sessionOver before submit:", sessionOver);

    if (sessionOver) {
        console.warn("❌ Session is over, ignoring submit.");
        return;
    }

    console.log("✅ Processing submission...");

    const endTime = Date.now();
    let isCorrect = false;
    let correctValue;
    let userInputValue;

    if (currentProblem.type === "fraction") {
        correctValue = `${n1 - n2}/${d1}`; // Assuming subtraction for fraction as before, adjust if needed
        userInputValue = `${userNumerator}/${userDenominator}`;
        isCorrect = selectedChoice === correctValue || userInputValue === correctValue;
    } else if (currentProblem.type === "whole-number") {
        correctValue = correctAnswerValue.toString(); // correctAnswerValue is already calculated in generateNewProblem
        if (inputMode === 'multiple-choice') {
            isCorrect = selectedChoice === correctValue;
        } else if (inputMode === 'input') {
            userInputValue = userNumerator; // For whole numbers, we'll use only numerator input (you can adapt if you decide to use denominator input for whole numbers for some reason)
            isCorrect = userInputValue === correctValue;
        }
    }


    let scoreEarned = 0;

    if (isCorrect) {
        console.log("✅ Correct Answer!");
        // Score logic - same as before
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
        setScore((prevScore) => prevScore + scoreEarned);

        setQuestionCount((prevCount) => {
            const newCount = prevCount + 1;
            console.log(`🔢 New Question Count: ${newCount}`);

            if (newCount >= 10) {
                console.log("🏁 Session Over - Triggering endSession()");
                endSession(endTime);
            } else {
                setTimeout(() => generateNewProblem(), 1500);
            }
            return newCount;
        });

    } else {
        console.warn("❌ Incorrect Answer!");
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= 3) {
            setMessage(`❌ Nice try! The correct answer was ${correctValue}.`);
            setElapsedTime(((endTime - startTime) / 1000).toFixed(2));

            setQuestionCount((prevCount) => {
                const newCount = prevCount + 1;
                console.log(`🔢 New Question Count: ${newCount}`);

                if (newCount >= 10) {
                    console.log("🏁 Session Over - Triggering endSession()");
                    endSession(endTime);
                } else {
                    setTimeout(() => generateNewProblem(), 2500);
                }
                return newCount;
            });

        } else {
            setMessage(`❌ Try Again! (${3 - newAttempts} attempts left)`);
        }
      }
    };




const endSession = (endTime) => {
    console.log("🛑 Ending session...");
    setSessionOver(true);

    // ✅ Ensure sessionStartTime is valid
    if (!sessionStartTime) {
        console.error("🚨 sessionStartTime is NULL. Using current timestamp as fallback.");
        setSessionStartTime(Date.now()); // Assign a fallback time
        return;
    }

    // ✅ Fix total time calculation
    const totalTimeInMs = endTime - sessionStartTime;
    if (totalTimeInMs < 0) {
        console.error("❌ Total time calculation error: Negative time detected.");
        return;
    }

    const totalTimeInSec = Math.floor(totalTimeInMs / 1000);
    const minutes = Math.floor(totalTimeInSec / 60);
    const seconds = totalTimeInSec % 60;

    console.log(`⏳ Total time: ${minutes} min ${seconds} sec`);

    setSessionEndTime(
        minutes > 0
            ? `${minutes} min ${seconds} sec`
            : `${seconds} sec`
    );

    // ✅ Ensure modal actually opens
    setTimeout(() => {
        console.log("🚀 Showing Session Summary");
        setShowSessionSummary(true);
    }, 500);

    };      


    const resetInputs = () => {
        console.log("🔄 Resetting input fields...");
        setUserNumerator("");
        setUserDenominator("");
        setMessage("");
        setSelectedChoice("");
    };


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
                            value={userNumerator}
                            onChange={(e) => setUserNumerator(e.target.value)}
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
    
                {/*  ✅ Place fraction-feedback and showSessionSummary WITHIN the fraction-game div */}
                <div className="fraction-feedback">
                    {message && (
                        <p
                            className={`feedback ${
                                message.includes("✅") ? "success" : "error"
                            }`}
                        >
                            {message}
                        </p>
                    )}
                    <p className="feedback-info">Score: {score}</p>
                    {elapsedTime && (
                        <p className="feedback-info">Elapsed Time: {elapsedTime} sec</p>
                    )}
                </div>
    
    
                {showSessionSummary && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2>Session Summary</h2>
                            <p>Questions Answered: {questionCount}</p>
                            <p>Correct Answers: {sessionCorrectCount}</p>
                            <p>
                                Accuracy: {((sessionCorrectCount / questionCount) * 100).toFixed(2)}%
                            </p>
                            <p>Total Score: {score}</p>
                            <p>Total Time: {sessionEndTime ? sessionEndTime : "N/A"}</p>
    
                            {/* ✅ Start New Session AND Load Next Task */}
                            <button onClick={() => {
                                console.log("🔄 Restarting Game and Ensuring Next Task Loads...");
                                startNewSession();
    
                                // 🕒 Wait for session reset to complete, then load next task
                                setTimeout(() => {
                                    console.log("➡️ Loading Next Task...");
                                    window.handleNextTask();
                                }, 300); // Small delay to ensure session state updates first
                            }}>
                                Start New Session
                            </button>
    
    
                            {/* ✅ Redirect to Dashboard */}
                            <button onClick={() => {
                                console.log("📌 Returning to Dashboard...");
                                window.location.href = "/dashboard"; // ✅ Change this to your actual dashboard route
                            }}>
                                Return to Dashboard
                            </button>
                        </div>
                    </div>
                )}
        </div>
        </>
     );
  });

export default FractionAdditionGame;