import React, { useState, useEffect, useRef, useCallback, useContext } from "react";
import UserStateContext from "../context/UserStateContext";
import GameHxContext from "../context/GameHxContext";
import UserStatisticsContext from "../context/UserStatisticsContext";
import { invokeModel, getDiffString } from "../functions/Model";

// ---------- Pre-generated puzzles for each difficulty level ----------


// Utility to deep copy a 2D grid.
const deepCopyGrid = (grid) => grid.map(row => [...row]);

const SudokuGrid = ({ onUpdateStats }) => {
  // Game control states.
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState("easy");

  // Puzzle and game state.
  const [grid, setGrid] = useState([]);
  const [immutableCells, setImmutableCells] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [timer, setTimer] = useState(0);
  const [isSolved, setIsSolved] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [score, setScore] = useState(1000);
  const [isPaused, setIsPaused] = useState(false);
  const [validNumbers, setValidNumbers] = useState([]);
  const [conflictCells, setConflictCells] = useState([]);
  const [showEndModal, setShowEndModal] = useState(false);
  const [bonusAward, setBonusAward] = useState(0);
  const [boardsData, setBoardsData] = useState(null);

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
  const gameRef = useRef("sudoku")
  const categoryRef = useRef("def")
  const prevGameStateRef = useRef(userGameState)
  const prevCategoryStateRef = useRef(userCategoryState)

  // Add a mount/unmount log.
  useEffect(() => {
    console.log("SudokuGrid mounted");
    return () => {
      console.log("SudokuGrid unmounted");
    };
  }, []);
  // Define a difficulty multiplier.
  const difficultyMultiplier =
    difficulty === "easy" ? 1 : difficulty === "medium" ? 1.5 : 2;

  // Load a puzzle based on the chosen difficulty.
  const loadPuzzle = (difficultyLevel) => {
    if (!boardsData) return []; // wait until data is loaded
    const boards = boardsData[difficultyLevel];
    if (!boards || boards.length === 0) return [];
    const board = boards[Math.floor(Math.random() * boards.length)];
    return board.map(row => row.map(cell => (cell === 0 ? "" : cell)));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // If no cell is selected or game is paused, ignore
      if (!selectedCell || isPaused) return;
  
      // Only accept digits 1 through 9 (keyCode 49 to 57)
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9) {
        handleNumberClick(num);
      }
      // Optionally, add support for Backspace to erase.
      if (e.key === "Backspace") {
        handleErase();
      }
    };
  
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCell, isPaused]);
  

  // Initialize board when game starts or difficulty changes.
  useEffect(() => {
    if (gameStarted) {
      const newGrid = loadPuzzle(difficulty);
      setGrid(newGrid);
      setImmutableCells(newGrid.map(row => row.map(cell => cell !== "")));
      setTimer(0);
      setIsSolved(false);
      setMistakes(0);
      setScore(1000);
      setBonusAward(0);
      setSelectedCell(null);
      setErrorMessage("");
      setValidNumbers([]);
      setConflictCells([]);
      setShowEndModal(false);
      setIsPaused(false);
      setSessionId(crypto.randomUUID()); // Database: generate sessionId

      // Database: Load initial states
      if (initGameStateRef.current) {
        getUserState(gameRef.current, categoryRef.current)
        getUserState(gameRef.current, "");
      }
    }
  }, [gameStarted, difficulty, boardsData]);

  // Timer effect.
  useEffect(() => {
    if (!gameStarted) return;
    const interval = setInterval(() => {
      if (!isSolved && !isPaused && !showEndModal) {
        setTimer(prev => prev + 1);
        if (onUpdateStats) onUpdateStats({ score, mistakes, timer: timer + 1 });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameStarted, isSolved, isPaused, showEndModal, timer, score, mistakes, onUpdateStats]);
  

  // Validate move.
  const isValidMove = (grid, row, col, value) => {
    for (let c = 0; c < 9; c++) {
      if (c !== col && grid[row][c] === value) return false;
    }
    for (let r = 0; r < 9; r++) {
      if (r !== row && grid[r][col] === value) return false;
    }
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let r = startRow; r < startRow + 3; r++) {
      for (let c = startCol; c < startCol + 3; c++) {
        if ((r !== row || c !== col) && grid[r][c] === value) return false;
      }
    }
    return true;
  };
  useEffect(() => {
    fetch("/sudoku_boards.json")
      .then(res => res.json())
      .then(data => {
        console.log("Loaded sudoku boards:", data);
        setBoardsData(data);
      })
      .catch(error => console.error("Error loading sudoku boards:", error));
  }, []);

  const togglePause = () => {
    console.log("togglePause clicked. Current isPaused:", isPaused);
    setIsPaused(prev => !prev);
  };

  // Early quit: end the game with current state (no bonus awarded).
  const handleEarlyQuit = () => {
    setIsPaused(false); //
    setShowEndModal(true);
  };

  
  // Compute valid numbers for a selected cell.
  const computeValidNumbers = (row, col) => {
    const valid = [];
    for (let num = 1; num <= 9; num++) {
      if (isValidMove(grid, row, col, num)) {
        valid.push(num);
      }
    }
    return valid;
  };
  const resetBoard = useCallback(() => {
    console.log("resetBoard called");
    setIsSolved(false);
    setShowEndModal(false);
    console.log("grid.length:", grid.length);
    console.log("immutableCells.length:", immutableCells.length);
    if (!grid || grid.length === 0 || !immutableCells || immutableCells.length === 0) return;
    setTimer(0);
    setMistakes(0);
    setScore(1000);
    setErrorMessage("");
    setSelectedCell(null);
    setValidNumbers([]);
    setConflictCells([]);
    setGrid(prevGrid =>
      prevGrid.map((row, i) =>
        row.map((cell, j) => (immutableCells[i] && immutableCells[i][j] ? cell : ""))
      )
    );
  }, [grid, immutableCells, difficultyMultiplier]);
  
  
  useEffect(() => {
    window.handleSudokuPause = togglePause;
    window.handleSudokuRestart = resetBoard;
    window.handleSudokuQuit = handleEarlyQuit;
  }, [resetBoard, togglePause, handleEarlyQuit]);
  
  // Compute conflicting cells.
  const getConflictCells = (grid, row, col, value) => {
    const conflicts = [];
    for (let c = 0; c < 9; c++) {
      if (c !== col && grid[row][c] === value) {
        conflicts.push({ row, col: c });
      }
    }
    for (let r = 0; r < 9; r++) {
      if (r !== row && grid[r][col] === value) {
        conflicts.push({ row: r, col });
      }
    }
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let r = startRow; r < startRow + 3; r++) {
      for (let c = startCol; c < startCol + 3; c++) {
        if ((r !== row || c !== col) && grid[r][c] === value) {
          conflicts.push({ row: r, col: c });
        }
      }
    }
    return conflicts;
  };

  // When a cell is selected, compute conflicts.
  useEffect(() => {
    if (selectedCell) {
      const { row, col } = selectedCell;
      const value = grid[row][col];
      if (value !== "") {
        const conflicts = getConflictCells(grid, row, col, value);
        setConflictCells(conflicts);
      } else {
        setConflictCells([]);
      }
    } else {
      setConflictCells([]);
    }
  }, [selectedCell, grid]);

  // Handle cell selection.
  const handleCellClick = (row, col) => {
    if (isPaused) return; // Prevent clicks when paused.
    if (immutableCells[row][col]) return;
    setSelectedCell({ row, col });
    setErrorMessage("");
    if (difficulty === "easy") {
      const valid = computeValidNumbers(row, col);
      setValidNumbers(valid);
    } else {
      setValidNumbers([]);
    }
  };

  // Database: Functions and Effects
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
      setDifficulty(getDiffString(primaryPrediction))
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
        transactGameData(gameRef.current, categoryRef.current, userGameState, userCategoryState);
        transactStatsData(userStats, dailyStats, weeklyStats)
    }
    prevGameStateRef.current = userGameState;
    prevCategoryStateRef.current = userCategoryState;
  }, [userGameState])  

  // Handle number input.
  const handleNumberClick = (num) => {
    if (isPaused) return; // Prevent number inputs when paused.
    if (!selectedCell || isSolved) return;
    const { row, col } = selectedCell;
    if (immutableCells[row][col]) return;
    if (!isValidMove(grid, row, col, num)) {
      setErrorMessage(`Number ${num} conflicts with existing entries!`);
      setMistakes(prev => prev + 1);
      setScore(prev => Math.max(prev - 10 * difficultyMultiplier, 0));
      const conflicts = getConflictCells(grid, row, col, num);
      setConflictCells(conflicts);
      return;
    }
    const newGrid = deepCopyGrid(grid);
    newGrid[row][col] = num;
    setGrid(newGrid);
    setSelectedCell(null);
    setValidNumbers([]);
    setErrorMessage("");
    setScore(prev => prev + 5 * difficultyMultiplier);
    if (checkSolved(newGrid)) {
      setIsSolved(true);
      // Award a bonus if the puzzle is completed.
      const bonus = 50 * difficultyMultiplier;
      setBonusAward(bonus);
      setScore(prev => prev + bonus);

      // Database: variables for database updates
      const finalTime = timer * 1000
      const gameData = {
        question_id: "placeholder",
        question_type: gameRef.current,
        question_category: categoryRef.current,
        difficulty: difficulty,
        session_id: sessionId,
        session_time_ms: 2000, // placeholder before implementing,
        attempt: 1,
        user_answer: selectedChoice,
        is_correct: isCorrect,
        game_time_ms: Math.min(finalTime, 2147483647),
      }
      const newUserState = {
        // elapsed_time: Math.min(reaction * 1000, 2147483647),
        difficulty: difficulty,
        game_type: gameRef.current,
        category: categoryRef.current,
        correct: true,
        score: score,
        elapsed_time: Math.min(finalTime, 2147483647),   
      };
      
      // Database: Update user state and game hx when correct
      batchWrite(newUserState, gameData)

      setTimeout(() => {
        setShowEndModal(true);
      }, 500);
    }
  };

  // Erase the selected cell's value.
  const handleErase = () => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    if (immutableCells[row][col]) return;
    const newGrid = deepCopyGrid(grid);
    newGrid[row][col] = "";
    setGrid(newGrid);
    setSelectedCell(null);
    setValidNumbers([]);
    setErrorMessage("");
    setConflictCells([]);
  };

  // Check if puzzle is solved.
  const checkSolved = (grid) => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cellValue = grid[row][col];
        if (cellValue === "" || !isValidMove(grid, row, col, cellValue)) {
          return false;
        }
      }
    }
    return true;
  };

  // Render the start screen if game hasn't started.
  if (!gameStarted) {
    return (
      <div className="sudoku-start-screen">
        <h2 style={{ color: "white", fontSize: "1.4em" }}>Select Difficulty</h2>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select><br />
      <div style={{ color: "white", margin: "16px 0" }}>
      <h3 style={{ fontSize: "1.4em" }}>Game Rules:</h3>
        <p>Solve the Sudoku puzzle by filling in the missing numbers.</p>
        <p>Each row, column, and 3x3 block must contain numbers 1 through 9 without repeats.</p>
        <p>Use logic to deduce the correct placement as quickly as possible.</p>
    </div>
        <button onClick={() => setGameStarted(true)}>Start Game</button>
      </div>
    );
  }

  return (
    <div className="sudoku-container">
      {/* End-of-Game Modal */}
      {showEndModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{isSolved ? "Puzzle Solved!" : "Puzzle Ended"}</h2>
            {isSolved && (
              <p>
                Bonus Awarded: {bonusAward} points
              </p>
            )}
            <p class="modal">Time Elapsed: {timer} sec</p>
            <p class="modal">Score: {score}</p>
            <p class="modal">Mistakes: {mistakes}</p>
            <button onClick={() => setGameStarted(false)}>
              Start New Game
            </button>
            <button onClick={() => window.location.href = "/dashboard"}>
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    {/* Pause Overlay */}
    {isPaused && !showEndModal && (
  <div className="paused-overlay">
    <div className="paused-message">
      <p>Game Paused</p>
      <button className="nav-btn" onClick={togglePause}>
        Unpause
      </button>
    </div>
  </div>
)}

      <div className="sudoku-grid">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="sudoku-row">
            {row.map((cell, colIndex) => {
              const isConflict = conflictCells.some(
                conflict => conflict.row === rowIndex && conflict.col === colIndex
              );
              return (
                <div
                  key={colIndex}
                  className={`sudoku-cell ${
                    selectedCell &&
                    selectedCell.row === rowIndex &&
                    selectedCell.col === colIndex
                      ? "selected"
                      : ""
                  } ${immutableCells[rowIndex][colIndex] ? "immutable" : ""} ${
                    isConflict ? "conflict" : ""
                  }`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  {cell || ""}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="number-selection">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          const isHint = difficulty === "easy" && validNumbers.includes(num);
          return (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              className={isHint ? "hint" : ""}
            >
              {num}
            </button>
          );
        })}
      </div>


      {errorMessage && (
  <>
    <p className="error-message" style={{ marginBottom: "2px", color:"red" }}>
      {errorMessage}
      <br />
    </p>
  </>
)}
<p style={{ marginTop: "2px" }}>
  Time Elapsed: {timer} sec<br />
  Mistakes: {mistakes}
</p>


    </div>
  );
};

export default SudokuGrid;


