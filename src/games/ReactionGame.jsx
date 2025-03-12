import React, { useRef, useEffect, useContext, useState, forwardRef, useImperativeHandle } from "react";
// import React, { useRef, useEffect, useState } from "react";
import UserStateContext from "../context/UserStateContext";
import GameHxContext from "../context/GameHxContext";

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
  const [sessionId, setSessionId] = useState("");  
  const { 
      userGameState, userCategoryState, getUserState, queryUserStates,
      updateUserGameState, updateUserCategoryState, transactGameData 
      } = useContext(UserStateContext);
  const { addGameHx } = useContext(GameHxContext)
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
    return Array.from({ length: count }, () => ({
      x: Math.random() * 600 + 50,
      y: Math.random() * 400 + 50,
      width: 50,
      height: 50,
    }));
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

    // Database: Load category totals; category = image_path 
    // console.log("NEW IMAGE:", newImage.replace(/\..*$/, ""))
    // console.log("NEW IMAGE:", newImage)
    getUserState(gameRef.current, newImage.replace(/\..*$/, ""))

    usedImagesRef.current.push(newImage);
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

  // When the current image changes, load it, apply the darkness overlay, and increment the round.
  useEffect(() => {
    if (!currentImage || !gameCanvas.current) return;

    const ctx = gameCanvas.current.getContext("2d");
    ctxRef.current = ctx;
    const canvasWidth = gameCanvas.current.width;
    const canvasHeight = gameCanvas.current.height;
    const img = new Image();
    img.src = `/images/${currentImage}`;

    img.onload = () => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

      const { darkness } = difficultyLevels[difficulty];
      ctx.fillStyle = `rgba(0, 0, 0, ${darkness / 255})`;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      drawBoxes(ctx);
      setRound(prev => prev + 1);
    };

    img.onerror = err =>
      console.error("❌ Image failed to load:", img.src, err);
  }, [currentImage, difficulty]);

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

  // ────────────────────────────────────────────────────────────────
  // DATABASE: FUNCTIONS AND EFFECTS
  useEffect(() => {
      const pGameState = prevGameStateRef.current;
      const pCategoryState = prevCategoryStateRef.current;

      if (
          pGameState !== userGameState &&
          pCategoryState !== userCategoryState &&
          userGameState != null &&
          userCategoryState != null &&
          initGameStateRef.current == false
      ) {
          // console.log("CATEGORY CHECK:", usedImagesRef.current.at(-1).replace(/\..*$/, ""))
          transactGameData(gameRef.current, usedImagesRef.current.at(-1).replace(/\..*$/, ""), userGameState, userCategoryState)
      }

      prevGameStateRef.current = userGameState;
      prevCategoryStateRef.current = userCategoryState;
  }, [userGameState, userCategoryState])

  function batchWrite(newUserState, gameData) {
    updateUserCategoryState(newUserState);
    updateUserGameState(newUserState, userCategoryState);
    addGameHx(gameData)
  }

  // ────────────────────────────────────────────────────────────────
  // HANDLE CLICK EVENTS
  function handleClick(event) {
    if (!waitingForGreen || !startTime) return;
    const { offsetX, offsetY } = event.nativeEvent;
    const isCorrectClick =
      offsetX >= targetBox.x &&
      offsetX <= targetBox.x + targetBox.width &&
      offsetY >= targetBox.y &&
      offsetY <= targetBox.y + targetBox.height;
    const reaction = (Date.now() - startTime) / 1000;

    // Database: variables for database updates
    // console.log("USED IMAGE:", usedImagesRef.current.at(-1).replace(/\..*$/, ""))
    // console.log("USED IMAGE:", usedImagesRef.current.at(-1))
    const difficultyInt = difficulty === "easy" ? 0 : difficulty === "medium" ? 1 : 2;
    const gameCategory = usedImagesRef.current.at(-1).replace(/\..*$/, "");
    const gameData = {
      question_id: gameCategory,
      question_type: gameRef.current,
      question_category: gameCategory,
      difficulty: difficultyInt,
      game_time_ms: Math.min(reaction * 1000, 2147483647),
      session_id: sessionId,
      session_time_ms: 2000, // placeholder before implementing,
      attempt: mistakes + 1,
      user_answer: "not_applicable",
      is_correct: isCorrectClick,
    }

    if (isCorrectClick) {
      setReactionTimes(prev => [...prev, reaction]);
      setCorrectClicks(prev => prev + 1);

      const timeBonus = Math.max(
        difficultyLevels[difficulty].reactionTime - reaction,
        0
      ) * 100;
      const finalScore = timeBonus * difficultyLevels[difficulty].speedFactor;
      setScore(prev => prev + finalScore);

      // Add a success message.
      setMessage(`✅ Great job! Reaction time: ${reaction.toFixed(2)} sec.`);
      setWaitingForGreen(false);
      updateStats(round);

      // Database: Update user state and game hx when correct
      const newUserState = {
        correct: true,
        elapsed_time: Math.min(reaction * 1000, 2147483647),
        score: Math.round(finalScore),
        difficulty: difficultyInt,
        category: gameCategory     
      };
      gameData.score = Math.round(finalScore);
      batchWrite(newUserState, gameData);

      // Start new round
      if (round >= maxRounds) {
        setTimeout(endGame, 700);
      } else {
        setTimeout(startNewRound, 1000);
      
      }
    } else {
      // Database: Update user state and game hx per attempt
      gameData.score = 0
      if (mistakes <= 2) {
        addGameHx(gameData)
      } else {
        const newUserState = {
          correct: false,
          elapsed_time: Math.min(reaction * 1000, 2147483647),
          score: 0,
          difficulty: difficultyInt,
          category: gameCategory     
        };
        batchWrite(newUserState, gameData)
      }

      // Incorrect click.
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
          <h2>Select Difficulty</h2>
          <div>
          <select
            value={difficulty}
            onChange={e => setDifficulty(e.target.value)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select></div>
          <h2>Select Box Color Scheme</h2>
          <div><select
            value={selectedColorScheme}
            onChange={e => setSelectedColorScheme(e.target.value)}
          >
            <option value="default">Default (Red/Green)</option>
            <option value="colorBlindFriendly">Color Blind Friendly (Blue/Orange)</option>
          </select></div>
          <button
            onClick={() => {
              setGameStarted(true);
              startNewRound();

              // Database: Load game state on initial load and generate sessionId
              if (initGameStateRef) {
                getUserState(gameRef.current, "");
                initGameStateRef.current = false
              }
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
            width={800}
            height={500}
            onClick={handleClick}
            style={{ border: "2px solid black" }}
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


