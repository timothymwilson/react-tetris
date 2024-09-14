import React, { useState, useEffect, useCallback } from 'react';

const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const INITIAL_POSITION = { x: 3, y: 0 };

const tetrominoes = [
  { name: 'I', matrix: [[1, 1, 1, 1]] },
  { name: 'O', matrix: [[1, 1], [1, 1]] },
  { name: 'T', matrix: [[0, 1, 0], [1, 1, 1]] },
  { name: 'S', matrix: [[0, 1, 1], [1, 1, 0]] },
  { name: 'Z', matrix: [[1, 1, 0], [0, 1, 1]] },
  { name: 'J', matrix: [[1, 0, 0], [1, 1, 1]] },
  { name: 'L', matrix: [[0, 0, 1], [1, 1, 1]] },
];

const rotateMatrix = (matrix) => {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rotatedMatrix = Array.from({ length: cols }, () => Array(rows).fill(0));

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      rotatedMatrix[col][rows - 1 - row] = matrix[row][col];
    }
  }

  return rotatedMatrix;
};

const randomTetromino = () => {
  return tetrominoes[Math.floor(Math.random() * tetrominoes.length)].matrix;
};

const Tetris = () => {
  const [grid, setGrid] = useState(Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(0)));
  const [tetromino, setTetromino] = useState(randomTetromino());
  const [position, setPosition] = useState(INITIAL_POSITION);
  const [gameOver, setGameOver] = useState(false);
  const [speed, setSpeed] = useState(1000);

  const moveTetromino = useCallback((direction) => {
    let newPosition = { ...position };
    if (direction === 'left') newPosition.x -= 1;
    if (direction === 'right') newPosition.x += 1;
    if (direction === 'down') newPosition.y += 1;

    if (!checkCollision(newPosition.x, newPosition.y, tetromino)) {
      setPosition(newPosition);
    } else if (direction === 'down') {
      lockTetromino();
    }
  }, [position, tetromino]);

  const rotateTetromino = useCallback(() => {
    const rotated = rotateMatrix(tetromino);

    if (!checkCollision(position.x, position.y, rotated)) {
      setTetromino(rotated);
    } else {
      const tryPositions = [
        { x: position.x, y: position.y },
        { x: position.x - 1, y: position.y },
        { x: position.x + 1, y: position.y },
        { x: position.x, y: position.y - 1 },
      ];

      for (const newPos of tryPositions) {
        if (!checkCollision(newPos.x, newPos.y, rotated)) {
          setTetromino(rotated);
          setPosition(newPos);
          return;
        }
      }
    }
  }, [position, tetromino]);

  const checkCollision = (x, y, matrix) => {
    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (matrix[row][col] && (grid[y + row] && grid[y + row][x + col]) !== 0) {
          return true;
        }
      }
    }
    return false;
  };

  const clearFullLines = (grid) => {
    const newGrid = grid.filter(row => row.some(cell => cell === 0));
    const clearedLines = GRID_HEIGHT - newGrid.length;

    for (let i = 0; i < clearedLines; i++) {
      newGrid.unshift(new Array(GRID_WIDTH).fill(0));
    }

    return newGrid;
  };

  const lockTetromino = () => {
    const newGrid = grid.map(row => row.slice());

    tetromino.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const gridX = position.x + x;
          const gridY = position.y + y;
          if (gridY >= 0 && gridX >= 0 && gridY < GRID_HEIGHT && gridX < GRID_WIDTH) {
            newGrid[gridY][gridX] = 1;
          }
        }
      });
    });

    const updatedGrid = clearFullLines(newGrid);
    setGrid(updatedGrid);

    const newTetromino = randomTetromino();
    setTetromino(newTetromino);
    setPosition(INITIAL_POSITION);

    if (checkCollision(INITIAL_POSITION.x, INITIAL_POSITION.y, newTetromino)) {
      setGameOver(true);
    }
  };

  const resetGame = () => {
    setGrid(Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(0)));
    setTetromino(randomTetromino());
    setPosition(INITIAL_POSITION);
    setGameOver(false);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!gameOver) {
        moveTetromino('down');
      }
    }, speed);

    return () => clearInterval(interval);
  }, [position, tetromino, gameOver, speed, moveTetromino]);

  const handleKeyDown = useCallback((event) => {
    if (gameOver) return;

    if (event.key === 'ArrowLeft') {
      moveTetromino('left');
    } else if (event.key === 'ArrowRight') {
      moveTetromino('right');
    } else if (event.key === 'ArrowDown') {
      moveTetromino('down');
    } else if (event.key === 'ArrowUp') {
      rotateTetromino();
    }
  }, [gameOver, moveTetromino, rotateTetromino]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const displayGrid = grid.map((row, rowIndex) => (
    row.map((cell, colIndex) => {
      const isActiveTetromino = tetromino.some((tRow, tRowIndex) =>
        tRow.some((tCell, tColIndex) =>
          tCell && rowIndex === position.y + tRowIndex && colIndex === position.x + tColIndex
        )
      );

      return (
        <div
          className='cell'
          key={`${rowIndex}-${colIndex}`}
          style={{
            backgroundColor: isActiveTetromino ? 'black' : (cell ? 'green' : '#d9d9d9'),

          }}
        />
      );
    })
  ));

  return (
    <div>
      <div style={{ marginTop: '10px' }}>
        <label>
          Speed (s):
          <input
            type="number"
            min="0.5"
            step="0.5"
            value={speed / 1000}
            onChange={(e) => setSpeed(Number(e.target.value) * 1000)}
            style={{ marginLeft: '10px', padding: '5px', width: '80px' }}
          />
        </label>
      </div>
      {gameOver && <div>Game Over</div>}
      <button onClick={resetGame} style={{ marginTop: '10px', padding: '10px' }}>Reset Game</button>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_WIDTH}, 20px)` }}>
        {displayGrid}
      </div>

      <div className="mobileButtons">
        <div className="topButton"><button onClick={rotateTetromino} className="mobileControlButton">Rotate</button></div>
        <div className="middleButtons"><button onClick={() => moveTetromino('left')} className="mobileControlButton">Left</button>
          <button onClick={() => moveTetromino('right')} className="mobileControlButton">Right</button></div>
        <div className="bottomButtons"><button onClick={() => moveTetromino('down')} className="mobileControlButton">Down</button></div>

      </div>

    </div>
  );
};



export default Tetris;
