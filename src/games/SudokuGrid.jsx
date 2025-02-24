import React, { useState } from "react";

const SudokuGame = () => {
    const [selectedCell, setSelectedCell] = useState(null);
    const [grid, setGrid] = useState([
        [5, 3, "", "", 7, "", "", "", ""],
        [6, "", "", 1, 9, 5, "", "", ""],
        ["", 9, 8, "", "", "", "", 6, ""],
        [8, "", "", "", 6, "", "", "", 3],
        [4, "", "", 8, "", 3, "", "", 1],
        [7, "", "", "", 2, "", "", "", 6],
        ["", 6, "", "", "", "", 2, 8, ""],
        ["", "", "", 4, 1, 9, "", "", 5],
        ["", "", "", "", 8, "", "", 7, 9]
    ]);

    const handleCellClick = (row, col) => {
        setSelectedCell({ row, col });
    };

    const handleNumberClick = (num) => {
        if (!selectedCell) return;

        const { row, col } = selectedCell;
        const newGrid = [...grid];
        newGrid[row][col] = num;
        setGrid(newGrid);
        setSelectedCell(null);
    };

    return (
        <div className="sudoku-container">
            <div className="sudoku-grid">
                {grid.map((row, rowIndex) => (
                    <div key={rowIndex} className="sudoku-row">
                        {row.map((cell, colIndex) => (
                            <div 
                                key={colIndex} 
                                className={`sudoku-cell ${selectedCell?.row === rowIndex && selectedCell?.col === colIndex ? "selected" : ""}`} 
                                onClick={() => handleCellClick(rowIndex, colIndex)}
                            >
                                {cell}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Number Selection Panel */}
            <div className="number-selection">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button key={num} onClick={() => handleNumberClick(num)}>{num}</button>
                ))}
            </div>
        </div>
    );
};

export default SudokuGame;

