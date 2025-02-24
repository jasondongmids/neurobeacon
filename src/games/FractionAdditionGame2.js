import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";

// Helper functions...
const getRandomDenominator = (denominatorsList) => {
  return denominatorsList[Math.floor(Math.random() * denominatorsList.length)];
};

const getRandomNumerator = (denominator) => {
  return Math.floor(Math.random() * denominator) + 1;
};

const getRandomWholeNumber = (min = 1, max = 100) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};


const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

const lcm = (a, b) => Math.floor((a / gcd(a, b)) * b);

const processAnswer = (user_numerator, user_denom, correct_answer_value) => {
  const user_answer_value = parseInt(user_numerator) / parseInt(user_denom);
  return user_answer_value === correct_answer_value ? "Correct" : "Incorrect";
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
  const [userAnswer, setUserAnswer] = useState("");



  const [n1, setNum1] = useState(0);
  const [d1, setDen1] = useState(0);
  const [f1, setF1] = useState("");

  const [n2, setNum2] = useState(0);
  const [d2, setDen2] = useState(0);
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
      if (sessionOver) {
          setTimeout(() => setSessionOver(false), 300);
      }
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
  
      // ✅ Use Functional Update to Reset sessionOver (Prevents React batching issues)
      setSessionOver((prev) => {
          console.log("🔄 Resetting sessionOver from:", prev, "to false");
          return false;
      });
  
      // ✅ Reset other session states
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


  const generateNearMisses = (correctAnswer) => {
    const nearMisses = new Set();

    while (nearMisses.size < 3) {
        let nearMiss;
        if (typeof correctAnswer === "number") {
            nearMiss = correctAnswer + (Math.floor(Math.random() * 5) - 2); // Range: -2 to +2
        } else {
            // If it's a fraction, parse and adjust numerator only
            const [num, denom] = correctAnswer.split("/").map(Number);
            let newNum = num + (Math.floor(Math.random() * 3) - 1); // -1, 0, or +1
            if (newNum <= 0) newNum = num + 1; // Ensure valid fraction
            nearMiss = `${newNum}/${denom}`;
        }
        
        if (!nearMisses.has(nearMiss) && nearMiss !== correctAnswer.toString()) {
            nearMisses.add(nearMiss);
        }
    }

    return Array.from(nearMisses);
};


  

  //PROBLEM GENERATOR!!!!!
  const generateNewProblem = (loadedProblems = problems) => {
    if (!loadedProblems.length || questionCount >= 10) {
      setSessionOver(true);
      return;
    }

    if (!loadedProblems || loadedProblems.length === 0) {
      console.error("🚨 No valid problems available.");
      return;
    }

    const randomIndex = Math.floor(Math.random() * loadedProblems.length);
    const randomProblem = loadedProblems[randomIndex];

    console.log("🔍 Inside generateNewProblem - randomProblem:", randomProblem); // ADD THIS LINE

    if (!randomProblem || !randomProblem.type) { // Line 230 - Error happens before this check sometimes!
      console.error("🚨 Invalid problem detected. Aborting question generation.");
      return;
    }
  


    // Determine if the problem is fraction-based or whole number-based
    const isFraction = randomProblem.type === "fraction";

    
    // Select input mode (manual or multiple choice)
    const problemType = Math.random() < 0.5 ? "multiple-choice" : "input";
    setCurrentProblem(randomProblem);
    setInputMode(problemType);

    // Set difficulty-based score modifier
    const difficulty = randomProblem.difficulty || "easy";
    const scoreMod = difficulty === "easy" ? 30 : difficulty === "medium" ? 60 : 100;
    setScoreModifier(scoreMod);

    let n1, n2, d1 = 1, d2 = 1, correctAnswer;

    if (isFraction) {
        // 🔹 FRACTION PROBLEM GENERATION
        d1 = getRandomDenominator(randomProblem.first_val_possibilities);
        d2 = getRandomDenominator(randomProblem.second_val_possibilities);
        n1 = getRandomNumerator(d1);
        n2 = getRandomNumerator(d2);

        if (difficulty === "easy") d2 = d1;
        const lcd = difficulty === "easy" ? 0 : lcm(d1, d2);
        setLCD(lcd);

        correctAnswer = `${n1 - n2}/${d1}`;
    } else {
        // 🔹 WHOLE NUMBER PROBLEM GENERATION
        n1 = getRandomWholeNumber(1, 20); // Generate a random whole number (1-20)
        n2 = getRandomWholeNumber(1, 20); 

        switch (randomProblem.operation) {
            case "+":
                correctAnswer = n1 + n2;
                break;
            case "-":
                correctAnswer = n1 - n2; // Ensure subtraction follows problem logic
                break;
            case "*":
                correctAnswer = n1 * n2;
                break;
            case "/":
                correctAnswer = (n1 % n2 === 0) ? n1 / n2 : (n1 / n2).toFixed(2);
                break;
            default:
                console.error("❌ Invalid operation:", randomProblem.operation);
                return;
        }

    }

    // Set problem values
    setNum1(n1);
    setDen1(d1);
    setNum2(n2);
    setDen2(d2);
    setF1(isFraction ? `${n1}/${d1}` : `${n1}`);
    setF2(isFraction ? `${n2}/${d2}` : `${n2}`);

    setUserNumerator("");
    setUserDenominator("");
    setMessage("");
    setElapsedTime(null);
    setAttempts(0);
    setSelectedChoice("");

        // Ensure whole number problems reset fraction inputs
    if (!isFraction) {
      setUserNumerator("null");
      setUserDenominator("null");
      setUserAnswer("");  // Ensure whole number problems use a single input field
    }

    // Generate multiple-choice options
    const nearMisses = generateNearMisses(correctAnswer, isFraction ? "fraction" : "whole-number");
    const allChoices = [correctAnswer.toString(), ...nearMisses].sort(() => Math.random() - 0.5);
    setChoices(allChoices);

    // Replace placeholders in the scenario
    const scenario = randomProblem.scenario_text
        .replace("_f1_", isFraction ? `${n1}/${d1}` : `${n1}`)
        .replace("_f2_", isFraction ? `${n2}/${d2}` : `${n2}`);
    setScenarioText(scenario);

    setStartTime(Date.now());
};

  
   // Fetch problems.json on initial load
   useEffect(() => {
    fetch("/expanded_problems.json")
        .then((response) => response.json())
        .then((data) => {
            if (!data || data.length === 0) {
                console.error("🚨 No problems loaded from JSON file.");
                return;
            }
            setProblems(data);
            console.log("✅ Problems loaded successfully:", data);
            generateNewProblem(data);
        })
        .catch((error) => console.error("Failed to load problems:", error));
    }, []);

  


    const handleSubmit = () => {
      console.log("📤 Submit button clicked");
      console.log("🔍 handleSubmit - currentProblem:", currentProblem); // ADD THIS LINE
  
      // ✅ Log sessionOver value
      console.log("🔍 Checking sessionOver before submit:", sessionOver);
  
      if (sessionOver) {
        console.warn("❌ Session is over, ignoring submit.");
        return;
      }
      if (!currentProblem) {
        console.error("🚨 Error: currentProblem is NULL. Submission aborted.");
        return;
      }
  
      console.log("✅ Processing submission...");
  
      // ... rest of your handleSubmit code
    
    const endTime = Date.now();
    
    // Construct correct answer (Fraction or Whole Number)
    let correctValue;
    if (currentProblem.type === "fraction") {
        correctValue = `${n1 - n2}/${d1}`;
    } else {
        correctValue = (parseFloat(n1) - parseFloat(n2)).toString();
    }

    // Get user input (Multiple-choice or manual)
    let userInputValue;
    if (inputMode === "multiple-choice") {
        userInputValue = selectedChoice;
    } else {
        userInputValue = currentProblem.type === "fraction" 
            ? `${userNumerator}/${userDenominator}` 
            : userAnswer;
    }

    console.log(`🔎 User Input: ${userInputValue}, Correct Answer: ${correctValue}`);

    // ✅ Check if answer is correct
    const isCorrect = userInputValue.toString().trim() === correctValue.toString().trim();
    console.log("User Answer:", userAnswer);
    console.log("Selected Choice:", selectedChoice);
    console.log("Correct Answer:", correctValue);
    

    let scoreEarned = 0;
    
    if (isCorrect) {
        console.log("✅ Correct Answer!");

        // Score Modifier: First attempt = full points, second = 50%, third = 25%, beyond = 0
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

  {inputMode === "input" && (
    <div className="input-field">
        {currentProblem && currentProblem.type === "fraction" ? (
            <>
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
            </>
        ) : currentProblem && currentProblem.type !== "fraction" ? ( // Added check here too for clarity
            <input
                type="number"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Your answer"
            />
        ) : null} {/* Render nothing if currentProblem is null */}
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
                    window.location.href = "/dashboard";  // ✅ Change this to your actual dashboard route
                }}>
                    Return to Dashboard
                </button>
            </div>
        </div>
    )}




    
    </>
  );
  
});

export default FractionAdditionGame;