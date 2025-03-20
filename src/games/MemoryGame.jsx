import React, {
  useState,
  useEffect,
  useContext,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import UserStateContext from "../context/UserStateContext";
import GameHxContext from "../context/GameHxContext";
import { invokeModel } from "../functions/Model";

const possibleIngredients = [
  "Apple",
  "Avocado",
  "Bananas",
  "Beef",
  "Cherries",
  "Cucumber",
  "Eggs",
  "Grapes",
  "Honey",
  "Lettuce",
  "Milk",
  "Onion",
  "Strawberries",
  "Tomato",
];

const getRandomIngredients = (diff) => {
  let num;
  if (diff === 0) {
    num = 3; // Easy: 3 ingredients
  } else if (diff === 1) {
    num = Math.floor(Math.random() * 3) + 3; // Medium: 3–5 ingredients
  } else if (diff === 2) {
    num = Math.floor(Math.random() * 4) + 5; // Hard: 5–8 ingredients
  }
  return Array.from({ length: num }, () =>
    possibleIngredients[Math.floor(Math.random() * possibleIngredients.length)]
  );
};

/* LazyBackground Component
   Preloads a background image off-screen and only displays it when loaded.
   It accepts a src prop (e.g., "url('/memory-images/Fridge.jpg')")
   and any style overrides.
*/
const LazyBackground = ({ src, style, placeholderColor = "#ccc", transitionDuration = "0.5s" }) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!src || src === "none") {
      setLoaded(true);
      return;
    }
    // Remove the "url(...)" wrapper if present.
    const matches = src.match(/url\(["']?(.*?)["']?\)/);
    const imageUrl = matches ? matches[1] : src;
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => setLoaded(true);
  }, [src]);

  return (
    <div
      style={{
        backgroundColor: placeholderColor,
        backgroundImage: loaded ? src : "none",
        transition: `background-image ${transitionDuration} ease-in-out`,
        ...style,
      }}
    />
  );
};

const IngredientItem = ({ name }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      style={{
        margin: "10px",
        position: "relative",
        backgroundColor: "#eee",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {!loaded && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "150px",
            height: "150px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#888",
          }}
        >
          Loading...
        </div>
      )}
      <img
        src={`/memory-images/${name}.png`}
        alt={name}
        width="150"
        height="150"
        onLoad={() => setLoaded(true)}
        style={{
          display: loaded ? "block" : "none",
          objectFit: "cover",
        }}

      />
      <span style={{ marginTop: "4px" }}>{name}</span>
    </div>
  );
};

const IngredientGrid = ({ ingredients }) => {
  const gridItems = [...ingredients];
  while (gridItems.length < 9) gridItems.push(null);
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "10px",
        justifyContent: "center",
        alignItems: "center",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      {gridItems.map((item, index) => (
        <div key={index} style={{ minWidth: "100px", display: "flex", justifyContent: "center", alignItems: "center" }}>
          {item && <IngredientItem name={item} />}
        </div>
      ))}
    </div>
  );
};

const MemoryGame = forwardRef(({ onUpdateStats }, ref) => {
  const [maxRounds] = useState(10);
  const [difficulty] = useState(1); // 0: easy, 1: medium, 2: hard
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [scoreModifier, setScoreModifier] = useState(30);

  const [kitchen, setKitchen] = useState(getRandomIngredients(difficulty));
  const [fridge, setFridge] = useState(getRandomIngredients(difficulty));
  const [target, setTarget] = useState(
    possibleIngredients[Math.floor(Math.random() * possibleIngredients.length)]
  );
  const [showFridge, setShowFridge] = useState(false);
  const [showKitchen, setShowKitchen] = useState(false);
  const [gamePhase, setGamePhase] = useState("intro");

  // Rename input state to selectedChoice
  const [selectedChoice, setSelectedChoice] = useState("");
  const [message, setMessage] = useState("");
  const [correctAns, setCorrectAns] = useState("");

  // Time control: startTime marks the start of the current attempt.
  const [startTime, setStartTime] = useState(null);
  // We keep "elapsedTime" for the last attempt (for display), but we'll compute averages separately.
  const [elapsedTime, setElapsedTime] = useState(0);

  // Track correct answers for accuracy
  const [sessionCorrectCount, setSessionCorrectCount] = useState(0);

  // Track attempts (0-based so three wrong attempts are allowed)
  const [numAttempts, setNumAttempts] = useState(0);

  // NEW: Global state for storing all attempt times (each element is an array of numbers for one question)
  const [allAttemptTimes, setAllAttemptTimes] = useState([]);
  // Use a ref to store attempt times for the current question
  const attemptTimesRef = useRef([]);

  // Database: State and reference variables:
  const { 
      userGameState, userCategoryState, setUserGameState, getUserState, prepareUserGameState,
      updateUserGameState, updateUserCategoryState, transactGameData 
      } = useContext(UserStateContext);
    const { addGameHx } = useContext(GameHxContext)
    // const [gameStartTime, setGameStartTime] = useState(0)
    const [sessionId, setSessionId] = useState(crypto.randomUUID()); // set immediately

    const initGameStateRef = useRef(true)
    const gameRef = useRef("trivia")
    const prevGameStateRef = useRef(userGameState)
    const prevCategoryStateRef = useRef(userCategoryState)

  // Database: Functions and effects:
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
        is_correct: newUserState.correct,
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
          transactGameData(gameRef.current, "def", userGameState, userCategoryState)
      }
      prevGameStateRef.current = userGameState;
      prevCategoryStateRef.current = userCategoryState;
  }, [userGameState])

  const correctAnswer = kitchen.includes(target) && fridge.includes(target)
    ? "Both"
    : kitchen.includes(target)
    ? "Kitchen"
    : fridge.includes(target)
    ? "Fridge"
    : "Neither";

    useEffect(() => {
      // Preload ingredient images
      possibleIngredients.forEach((name) => {
        const img = new Image();
        img.src = `/memory-images/${name}.png`;
      });
      // Preload background images
      const fridgeImg = new Image();
      fridgeImg.src = "/memory-images/Fridge.jpg";
      const kitchenImg = new Image();
      kitchenImg.src = "/memory-images/Kitchen.jpg";
    }, []);
    
  useEffect(() => {
    let newScore;
    if (difficulty === 0) newScore = 30;
    else if (difficulty === 1) newScore = 50;
    else if (difficulty === 2) newScore = 80;
    else newScore = 30;
    setScoreModifier(newScore);
  }, [difficulty]);

  // Sync session stats with the parent panel.
  // Here we also compute the average time across all attempts.
  const lastStatsRef = useRef(null);
  useEffect(() => {
    if (onUpdateStats) {
      // Compute average time over all attempt times
      const flatTimes = allAttemptTimes.flat();
      const avgTime = flatTimes.length > 0 ? flatTimes.reduce((a, b) => a + b, 0) / flatTimes.length : 0;
      const newStats = {
        score: score.toFixed(2),
        questionsAnswered: round,
        maxRounds,
        accuracy: round > 0 ? ((sessionCorrectCount / round) * 100).toFixed(2) : "0.00",
        // We'll show average time here:
        averageTime: avgTime.toFixed(2) + " sec",
      };
      if (JSON.stringify(newStats) !== JSON.stringify(lastStatsRef.current)) {
        onUpdateStats(newStats);
        lastStatsRef.current = newStats;
      }
    }
  }, [score, round, sessionCorrectCount, allAttemptTimes, onUpdateStats]);

  // Phase transitions for image display
  useEffect(() => {
    if (gamePhase === "showFridge") {
      setTimeout(() => {
        setShowFridge(true);
        setTimeout(() => {
          setShowFridge(false);
          setGamePhase("showKitchen");
        }, 100000);
      }, 1000);
    } else if (gamePhase === "showKitchen") {
      setTimeout(() => {
        setShowKitchen(true);
        setTimeout(() => {
          setShowKitchen(false);
          setGamePhase("question");
          setStartTime(Date.now());
          // Reset attemptTimes for this question.
          attemptTimesRef.current = [];
        }, 1000000);
      }, 1000);
    }
  }, [gamePhase]);

  const handleGameStart = () => {
    setGamePhase("showFridge");

    // Database: Load game and category state
    if (initGameStateRef.current) {
      getUserState(gameRef.current, "");
      getUserState(gameRef.current, "def");
    }

    // handle difficulty changes here?
  }

  const handleSubmit = () => {
      // Check if the user has selected an answer.
    if (!selectedChoice) {
      setMessage("❌ Please select an answer!");
      return;
    }
    // Calculate time for this attempt
    const endTime = Date.now();
    const currentAttemptTime = (endTime - startTime) / 1000; // in seconds
    // Record the attempt time
    attemptTimesRef.current.push(currentAttemptTime);
    // Update startTime for subsequent attempts
    setStartTime(endTime);

    const newAttempts = numAttempts + 1;
    setNumAttempts(newAttempts);

    // Database: Variables for database updates
    // const difficultyInt = difficulty === "easy" ? 0 : difficulty === "medium" ? 1 : 2;
    // const gameCategory = currentQuestion.decade; // perhaps create state var
    const gameData = {
      question_id: "placeholder",
      question_type: gameRef.current,
      question_category: "default",
      difficulty: difficulty, // already int
      game_time_ms: Math.min(currentAttemptTime * 1000, 2147483647),
      session_id: sessionId,
      session_time_ms: 2000, // placeholder before implementing,
      attempt: newAttempts,
      user_answer: selectedChoice,
      // is_correct: isCorrect,
    };
    const newUserState = {
      elapsed_time: Math.min(currentAttemptTime * 1000, 2147483647),
      difficulty: difficulty,
      category: "default"
    };

    if (selectedChoice === correctAnswer) {
      setScore((prev) => prev + Math.max(scoreModifier - 10 * numAttempts, 0));
      setElapsedTime(currentAttemptTime.toFixed(2));
      setMessage(`✅ Correct! Time: ${currentAttemptTime.toFixed(2)} sec`);
      setCorrectAns("Correct!");
      setSessionCorrectCount((prev) => prev + 1);
      // When the question is complete, record the attempt times for this question.
      setAllAttemptTimes((prev) => [...prev, attemptTimesRef.current]);
      setTimeout(() => nextRound(), 1500);

      // Database: Update user state and game hx when correct
      newUserState.correct = true
      newUserState.score = score
      batchWrite(newUserState, gameData)

    } else {
      if (newAttempts >= 3) {
        setMessage(`❌ Nice try! The correct answer was ${correctAnswer}.`);
        setAllAttemptTimes((prev) => [...prev, attemptTimesRef.current]);
        setTimeout(() => nextRound(), 2500);

        // Database: Update user state when incorrect after three attempts
        newUserState.correct = false
        newUserState.score = 0
        batchWrite(newUserState, gameData)

      } else {
        setMessage(
          `❌ Try Again! (${3 - newAttempts} attempt${3 - newAttempts === 1 ? "" : "s"} left)`
        );

        // Database: Update game hx per attempt
        gameData.score = 0
        addGameHx(gameData)
      }
    }
  };

  const nextRound = () => {
    setCorrectAns("");
    if (round < maxRounds) {
      setRound((prev) => prev + 1);
      setKitchen(getRandomIngredients(difficulty));
      setFridge(getRandomIngredients(difficulty));
      setTarget(possibleIngredients[Math.floor(Math.random() * possibleIngredients.length)]);
      setGamePhase("intro");
      setSelectedChoice("");
      setMessage("");
      setNumAttempts(0);
    } else {
      setGamePhase("end");
    }
  };

  const restartGame = () => {
    // Reset all state to the initial values without incrementing round.
    setGamePhase("intro");
    setRound(1);
    setScore(0);
    setSessionCorrectCount(0);
    setElapsedTime(0);
    setAllAttemptTimes([]);
    setKitchen(getRandomIngredients(difficulty));
    setFridge(getRandomIngredients(difficulty));
    setTarget(possibleIngredients[Math.floor(Math.random() * possibleIngredients.length)]);
    setSelectedChoice("");
    setMessage("");
    setNumAttempts(0);
    // No call to nextRound here.

    // Database: Create new session id
    setSessionId(crypto.randomUUID());
  };
  

  const getBackgroundImage = () => {
    switch (gamePhase) {
      case "showFridge":
        return "url('/memory-images/Fridge.jpg')";
      case "showKitchen":
        return "url('/memory-images/Kitchen.jpg')";
      default:
        return "none";
    }
  };

  useImperativeHandle(ref, () => ({
    handleSubmit,
    generateNewProblem: nextRound,
    resetInputs: () => setSelectedChoice(""),
  }));

  // Compute overall average time from allAttemptTimes for display (if any)
  let flatTimes = allAttemptTimes.flat();
  let overallAvg = flatTimes.length > 0 ? (flatTimes.reduce((a, b) => a + b, 0) / flatTimes.length).toFixed(2) : "0.00";

  return (
    <div style={{ position: "relative", minHeight: "100%", height: "auto" }}>
    <LazyBackground
      src={getBackgroundImage()}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        /* backgroundcolor:"white",*/
        height: "20vh", // ensures it fills the viewport
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        zIndex: -1,
      }}
      /* placeholderColor="white" */
      transitionDuration="0.4s"
    />
    <div style={{ textAlign: "center", padding: "20px" }}>
      {/* Your existing game content goes here */}
      {gamePhase === "intro" && (
        <div>
          <h2 style={{ color: "white" }}>
            Round {round}/{maxRounds}: It's time to see what ingredients you have!
            Click start when you are ready.
          </h2>
          <button className="btn next" onClick={() => handleGameStart()}>Start</button>
        </div>
      )}
      {showFridge && (
        <div>
          <h2 style={{ color: "white" }}>The Fridge:</h2>
          <IngredientGrid ingredients={fridge} />
        </div>
      )}
      {showKitchen && (
        <div>
          <h2 style={{ color: "white" }}>The Kitchen:</h2>
          <IngredientGrid ingredients={kitchen} />
        </div>
      )}
      {gamePhase === "question" && (
        <div>
          <h2 style={{ color: "white" }}>Where did you see {target}?</h2>
          <IngredientItem name={target} />
          <div className="multiple-choice-options">
            {["Fridge", "Kitchen", "Both", "Neither"].map((option, index) => (
              <label key={index}>
                <input
                  type="radio"
                  name="memoryChoice"
                  value={option}
                  checked={selectedChoice === option}
                  onChange={(e) => setSelectedChoice(e.target.value)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
          {message && (
            <div>
              <p className="feedback-info">{message}</p>
            </div>
          )}
        </div>
      )}

      {gamePhase === "end" && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Game Over!</h2>
            <p>Questions Answered: {round}</p>
            <p>Correct Answers: {sessionCorrectCount}</p>
            <p>
              Accuracy: {round > 0 ? ((sessionCorrectCount / round) * 100).toFixed(2) : "0.00"}%
            </p>
            <p>Total Score: {score}</p>
            <p>Last Question Time: {elapsedTime} sec</p>
            <p>Average Time per Attempt: {overallAvg} sec</p>
            <button onClick={restartGame}>Play Again</button>
            <button onClick={() => (window.location.href = "/dashboard")}>
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
});

MemoryGame.displayName = "MemoryGame";

export default MemoryGame;
