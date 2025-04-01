import React, { useRef, useEffect, useContext, useState } from "react";
// import React, { useRef, useEffect, useState } from "react";
import UserStateContext from "../context/UserStateContext";
import UserStatisticsContext from "../context/UserStatisticsContext";
import GameHxContext from "../context/GameHxContext";
import { invokeModel, getDiffString } from "../functions/Model";
// import ModelContext from "../context/ModelContext"

// Difficulty configuration remains the same.
const difficultyLevels = {
  easy: { reactionTime: 3, distractions: 2, darkness: 0, speedFactor: 0.8 },
  medium: { reactionTime: 2, distractions: 4, darkness: 50, speedFactor: 1.0 },
  hard: { reactionTime: 1.5, distractions: 6, darkness: 100, speedFactor: 1.2 },
};

// Define color schemes for the boxes.
const boxColorSchemes = {
  default: { distractor: "red", target: "green" },
  colorBlindFriendly: { distractor: "blue", target: "orange" },
};

// Map color names to RGB values.
const colorMap = {
  red: "255,0,0",
  green: "0,255,0",
  blue: "0,0,255",
  orange: "255,165,0",
};

const ReactionGame = ({ onUpdateStats }) => {
  // State variables.
  const [imageFiles, setImageFiles] = useState([]);
  const [currentImage, setCurrentImage] = useState(null);
  const [targetBox, setTargetBox] = useState(null);
  const [boxes, setBoxes] = useState([]);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [correctClicks, setCorrectClicks] = useState(0);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [waitingForGreen, setWaitingForGreen] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [round, setRound] = useState(0);
  const [showEndModal, setShowEndModal] = useState(false);
  const [difficulty, setDifficulty] = useState("medium");
  const [maxScore, setMaxScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(500);
  const [pointerDownPos, setPointerDownPos] = useState(null);


  // We'll only use message for mistake warnings.
  const [message, setMessage] = useState("");
  // New state for color scheme selection.
  const [selectedColorScheme, setSelectedColorScheme] = useState("default");

  const maxRounds = 10;
  const gameCanvas = useRef(null);
  const ctxRef = useRef(null);
  // Persist used images across rounds.
  const usedImagesRef = useRef([]);
  const [finalStats, setFinalStats] = useState({
    score: "0.00",
    accuracy: "0.00",
    avgReactionTime: "N/A"
  });

  // Database: State and reference variables
  const { 
      userGameState, userCategoryState, getUserState, prepareUserGameState,
      updateUserGameState, updateUserCategoryState, transactGameData 
      } = useContext(UserStateContext);
  const { addGameHx } = useContext(GameHxContext)
  const { dailyStats, setDailyStats, weeklyStats, setWeeklyStats,
    userStats, setUserStats, updateTotals, transactStatsData } = useContext(UserStatisticsContext)
  const [sessionId, setSessionId] = useState("");  

  const initGameStateRef = useRef(true)
  const gameRef = useRef("reaction")
  const prevGameStateRef = useRef(userGameState)
  const prevCategoryStateRef = useRef(userCategoryState)

  // ────────────────────────────────────────────────────────────────
  // HELPER FUNCTIONS (using function declarations)

  function updateStats(updatedRound) {
    const validTimes = reactionTimes.filter(time => !isNaN(time));
    const avgReaction =
      validTimes.length > 0
        ? (validTimes.reduce((a, b) => a + b, 0) / validTimes.length).toFixed(2)
        : "N/A";

    const newAccuracy =
      updatedRound > 0
        ? ((correctClicks / updatedRound) * 100).toFixed(2)
        : "0.00";

    const newScore = score.toFixed(2);

    const updatedStats = {
      score: newScore,
      accuracy: newAccuracy,
      avgReactionTime: avgReaction
    };

    setFinalStats(updatedStats);

    if (onUpdateStats) {
      onUpdateStats({
        score: newScore,
        questionsAnswered: updatedRound,
        accuracy: newAccuracy,
        reactionTime: avgReaction,
        maxRounds
      });
    }
  }

  function endGame() {
    setShowEndModal(true);
    const { reactionTime, speedFactor } = difficultyLevels[difficulty];
    const potentialMaxScore = maxRounds * (reactionTime * 50) * speedFactor;
    setMaxScore(potentialMaxScore);
    updateStats(round);
  }

function generateRandomBoxes(count) {
  // Set box dimensions based on current difficulty.
  let boxWidth, boxHeight;
  switch (difficulty) {
    case "easy":
      boxWidth = 50;
      boxHeight = 50;
      break;
    case "medium":
      boxWidth = 40;
      boxHeight = 40;
      break;
    case "hard":
      boxWidth = 30;
      boxHeight = 30;
      break;
    default:
      boxWidth = 50;
      boxHeight = 50;
  }

  // Define margins relative to canvas size, ensuring boxes stay fully within canvas bounds.
  const margin = 10; // fixed margin in pixels
  const maxX = canvasWidth - boxWidth - margin;
  const maxY = canvasHeight - boxHeight - margin;
  const minX = margin;
  const minY = margin;

  return Array.from({ length: count }, () => ({
    x: Math.floor(Math.random() * (maxX - minX + 1)) + minX,
    y: Math.floor(Math.random() * (maxY - minY + 1)) + minY,
    width: boxWidth,
    height: boxHeight,
  }));
}



function handlePointerMove(event) {
  if (!pointerDownPos) return;
  const dx = event.clientX - pointerDownPos.x;
  const dy = event.clientY - pointerDownPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const threshold = 10; // same threshold as before
  if (distance >= threshold) {
    // Cancel the tap if movement exceeds threshold
    setPointerDownPos(null);
  }
}


  function startNewRound() {
    if (round >= maxRounds) {
      endGame();
      return;
    }

    // Reset per-round states.
    setStartTime(null);
    setWaitingForGreen(false);
    setMistakes(0);
    setMessage("");

    // Load new image.
    setCurrentImage(getNextImage());

    // Generate boxes and pick target.
    const boxPositions = generateRandomBoxes(difficultyLevels[difficulty].distractions);
    setBoxes(boxPositions);
    const target = boxPositions[Math.floor(Math.random() * boxPositions.length)];
    setTargetBox(target);

    // Activate green box after a delay.
    const delay = Math.random() * 3000 + 2000;
    setTimeout(() => {
      setWaitingForGreen(true);
      setStartTime(Date.now());
    }, delay);
  }

  function startNewSession() {
    setGameStarted(false);
    setScore(0);
    setRound(0);
    setReactionTimes([]);
    setStartTime(null);
    setShowEndModal(false);
    setMaxScore(0);
    setMistakes(0);
    setCorrectClicks(0);
    setMessage("");
    usedImagesRef.current = [];

  }

  function getNextImage() {
    if (usedImagesRef.current.length === imageFiles.length) {
      usedImagesRef.current = [];
    }

    const availableImages = imageFiles.filter(img => !usedImagesRef.current.includes(img));
    const newImage = availableImages[Math.floor(Math.random() * availableImages.length)];

    usedImagesRef.current.push(newImage);

    // Database: Load category totals; category = image_path and enable ddb updates
    getUserState(gameRef.current, newImage.replace(/\..*$/, ""))
    if (initGameStateRef.current) {
      getUserState(gameRef.current, "");
    }

    return newImage;
  }

  function drawBoxes(ctx) {
    const darknessAlpha = 1 - (difficultyLevels[difficulty].darkness / 255);
    const distractorColorRGB = colorMap[boxColorSchemes[selectedColorScheme].distractor];
    const targetColorRGB = colorMap[boxColorSchemes[selectedColorScheme].target];

    boxes.forEach(box => {
      ctx.strokeStyle = `rgba(${distractorColorRGB}, ${darknessAlpha})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(box.x, box.y, box.width, box.height);
    });

    if (waitingForGreen && targetBox) {
      ctx.strokeStyle = `rgba(${targetColorRGB}, ${darknessAlpha})`;
      ctx.lineWidth = 4;
      ctx.strokeRect(targetBox.x, targetBox.y, targetBox.width, targetBox.height);
    }
  }

  // ────────────────────────────────────────────────────────────────
  // LOAD IMAGE LIST ON MOUNT
  useEffect(() => {
    fetch("/images/image_list.json")
      .then(response => response.json())
      .then(data => setImageFiles(data))
      .catch(error => console.error("❌ Failed to load image list", error));
  }, []);

  // UPDATE DIFFICULTY
    useEffect(() => {
        console.log("Updated difficulty", difficulty);
    }, [difficulty]);

  // When the current image changes, load it, apply the darkness overlay, and increment the round.
  useEffect(() => {
    if (!currentImage || !gameCanvas.current) return;
    
    const ctx = gameCanvas.current.getContext("2d");
    ctxRef.current = ctx;
    
    // Clear using dynamic dimensions
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    const img = new Image();
    img.src = `/images/${currentImage}`;
    
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
      
      const { darkness } = difficultyLevels[difficulty];
      ctx.fillStyle = `rgba(0, 0, 0, ${darkness / 255})`;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      drawBoxes(ctx);
      setRound(prev => prev + 1);
    };
    
    img.onerror = err =>
      console.error("❌ Image failed to load:", img.src, err);
  }, [currentImage, difficulty, canvasWidth, canvasHeight]);


  // Redraw boxes when waitingForGreen, boxes, or targetBox change.
  useEffect(() => {
    if (!gameCanvas.current) return;
    const ctx = gameCanvas.current.getContext("2d");
    drawBoxes(ctx);
  }, [waitingForGreen, boxes, targetBox]);

  // Update stats when round, correctClicks, reactionTimes, or score change.
  useEffect(() => {
    updateStats(round);
  }, [round, correctClicks, reactionTimes, score]);

  //Dynamic resizer for the image canvas
useEffect(() => {
  function handleResize() {
    if (!gameCanvas.current) return;
    const parentRect = gameCanvas.current.parentElement.getBoundingClientRect();
    // Use the container's width or window width (whichever is smaller)
    const availableWidth = Math.min(parentRect.width, window.innerWidth);
    const newWidth = Math.min(availableWidth, 800); // never exceed 800px
    const newHeight = (newWidth * 500) / 800; // maintain aspect ratio
    setCanvasWidth(newWidth);
    setCanvasHeight(newHeight);
  }
  window.addEventListener("resize", handleResize);
  handleResize(); // run on mount
  return () => window.removeEventListener("resize", handleResize);
}, []);



  // ────────────────────────────────────────────────────────────────
  // DATABASE: FUNCTIONS AND EFFECTS
  // useEffect(() => {
  //     console.log("Updated category state:", userCategoryState);
  // }, [userCategoryState])

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
      setWeeklyStats(updateTotals(weeklyStats, isCorrect, gameRef.current, difficulty))     

      const updatedUserCategoryState = updateUserCategoryState(newUserState);
      const prepState = prepareUserGameState(newUserState, userGameState, updatedUserCategoryState);
      const primaryPrediction = await invokeModel(prepState, 'primary');
      const targetPrediction = await invokeModel(prepState, 'target');
      const pPredStr = getDiffString(primaryPrediction)
      const finalState = {
       ...prepState,
       score: newUserState.score,
       predicted_difficulty: pPredStr,
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
      setDifficulty(pPredStr)
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
          transactGameData(gameRef.current, usedImagesRef.current.at(-1).replace(/\..*$/, ""), userGameState, userCategoryState)
          transactStatsData(userStats, dailyStats, weeklyStats)
      }
      prevGameStateRef.current = userGameState;
      prevCategoryStateRef.current = userCategoryState;
  }, [userGameState])

  // ────────────────────────────────────────────────────────────────
// Step 1: handlePointerDown
function handlePointerDown(event) {
  const rect = gameCanvas.current.getBoundingClientRect();
  const offsetX = event.clientX - rect.left;
  const offsetY = event.clientY - rect.top;

  if (
    offsetX >= 0 &&
    offsetY >= 0 &&
    offsetX <= rect.width &&
    offsetY <= rect.height
  ) {
    setPointerDownPos({ x: event.clientX, y: event.clientY });
  } else {
    setPointerDownPos(null);
  }
}

// Step 2: handlePointerMove
function handlePointerMove(event) {
  if (!pointerDownPos) return;
  
  const dx = event.clientX - pointerDownPos.x;
  const dy = event.clientY - pointerDownPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  const scrollThreshold = 15; // pixels
  if (distance >= scrollThreshold) {
    setPointerDownPos(null);
  }
}

// Step 3: handlePointerUp
function handlePointerUp(event) {
  if (!pointerDownPos) return;

  const rect = gameCanvas.current.getBoundingClientRect();
  const offsetX = event.clientX - rect.left;
  const offsetY = event.clientY - rect.top;

  const insideCanvas =
    offsetX >= 0 &&
    offsetY >= 0 &&
    offsetX <= rect.width &&
    offsetY <= rect.height;

  const dx = event.clientX - pointerDownPos.x;
  const dy = event.clientY - pointerDownPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const clickThreshold = 15;

  if (insideCanvas && distance < clickThreshold) {
    processClick(offsetX, offsetY);
  }

  setPointerDownPos(null);
}



// Step 4: Refactor Click Processing
function processClick(offsetX, offsetY) {
  if (!waitingForGreen || !startTime) return;

  const isCorrectClick =
    offsetX >= targetBox.x &&
    offsetX <= targetBox.x + targetBox.width &&
    offsetY >= targetBox.y &&
    offsetY <= targetBox.y + targetBox.height;
  const reaction = (Date.now() - startTime) / 1000;

  // Database: variables for database updates remain unchanged
  // const difficultyInt = difficulty === "easy" ? 0 : difficulty === "medium" ? 1 : 2;
  const gameCategory = usedImagesRef.current.at(-1).replace(/\..*$/, "");
  const gameData = {
    question_id: gameCategory,
    question_type: gameRef.current,
    question_category: gameCategory,
    difficulty: difficulty,
    game_time_ms: Math.min(reaction * 1000, 2147483647),
    session_id: sessionId,
    session_time_ms: 2000, // placeholder before implementing,
    attempt: mistakes + 1,
    user_answer: "not_applicable",
    is_correct: isCorrectClick,
  };
  const newUserState = {
    elapsed_time: Math.min(reaction * 1000, 2147483647),
    difficulty: difficulty,
    game_type: gameRef.current,
    category: gameCategory     
  };

  if (isCorrectClick) {
    setReactionTimes(prev => [...prev, reaction]);
    setCorrectClicks(prev => prev + 1);

    const timeBonus = Math.max(
      difficultyLevels[difficulty].reactionTime - reaction,
      0
    ) * 100;
    const finalScore = timeBonus * difficultyLevels[difficulty].speedFactor;
    setScore(prev => prev + finalScore);

    setMessage(`✅ Great job! Reaction time: ${reaction.toFixed(2)} sec.`);
    setWaitingForGreen(false);
    updateStats(round);

    // Database: Update user state and game hx when correct
    newUserState.correct = true;
    newUserState.score = Math.round(finalScore);
    batchWrite(newUserState, gameData);

    if (round >= maxRounds) {
      setTimeout(endGame, 700);
    } else {
      setTimeout(startNewRound, 1000);
    }
  } else {
    if (mistakes < 2) {
      gameData.score = 0;
      addGameHx(gameData);
    } else {
      newUserState.correct = false;
      newUserState.score = 0;
      batchWrite(newUserState, gameData);
    }

    setMistakes(prev => {
      const newMistakes = prev + 1;
      setScore(prevScore => Math.max(prevScore - 50, 0));
      if (newMistakes >= 3) {
        console.warn("🚨 3 Mistakes! Moving to next round.");
        setMessage("❌ Round ended due to 3 mistakes.");
        setTimeout(() => {
          if (round >= maxRounds) {
            endGame();
          } else {
            startNewRound();
          }
        }, 1000);
        return 0;
      } else if (newMistakes === 1) {
        setMessage("❌ Incorrect click. Try again!");
      } else if (newMistakes === 2) {
        setMessage("⚠️ One more mistake and the round ends!");
      }
      return newMistakes;
    });
  }
}


  // ────────────────────────────────────────────────────────────────
  // RENDER
  return (
    <div className="reaction-game">
      {!gameStarted ? (
        <div>
          {/* <h2>Select Difficulty</h2>
           <div>
          <select
            value={difficulty}
            onChange={e => setDifficulty(e.target.value)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select></div> */}
          <h2 style={{ color: "white"}}>Select Box Color Scheme</h2>
          <div><select
            value={selectedColorScheme}
            onChange={e => setSelectedColorScheme(e.target.value)}
          >
            <option value="default">Default (Red/Green)</option>
            <option value="colorBlindFriendly">Color Blind Friendly (Blue/Orange)</option>
          </select></div>
       {/* Added Rules Section */}
      <div style={{ color: "white", margin: "16px 0", fontSize: "1.2em" }}>
        <h3 style={{ fontSize: "1.4em" }}>Game Rules:</h3>
        <ul>
          <li>Wait for the box to change color.</li>
          <li>Click as quickly as possible once the box changes color.</li>
          <li>Your reaction time will be measured and added to your score.</li>
          <li>Try to achieve a fast reaction to earn more points.</li>
        </ul>
      </div>
          <button
            onClick={() => {
              setGameStarted(true);
              startNewRound();

              // Database: Load game state on initial load and generate sessionId
              setSessionId(crypto.randomUUID());
            }}
          >
            Start Reaction Game!
          </button>
        </div>
      ) : (
        <div>
        <canvas
          ref={gameCanvas}
          width={canvasWidth}
          height={canvasHeight}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerMove={handlePointerMove}
          style={{
            border: "2px solid black",
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`
          }}
        />

          {/* Display only the round number below the canvas */}
          <p>Round: {round}/{maxRounds}</p>
          {/* Show any warning or mistake messages immediately */}
          {message && <p className="warning">{message}</p>}
        </div>
      )}

      {showEndModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Session Summary</h2>
            <p><strong>Rounds Completed:</strong> {round}/{maxRounds}</p>
            <p><strong>Final Score:</strong> {finalStats.score}</p>
            <p>
              <strong>Average Reaction Time:</strong>{" "}
              {finalStats.avgReactionTime !== "N/A"
                ? `${finalStats.avgReactionTime}s`
                : "N/A"}
            </p>
            <p>Accuracy: {finalStats.accuracy}%</p>
            <button onClick={startNewSession}>Start New Session</button>
            <button onClick={() => window.location.href = "/dashboard"}>
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReactionGame;
