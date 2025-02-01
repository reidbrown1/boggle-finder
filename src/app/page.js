'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [letters, setLetters] = useState('');
  const [words, setWords] = useState([]);
  const [dictionary, setDictionary] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordPaths, setWordPaths] = useState(new Map());
  const [loadingDots, setLoadingDots] = useState('');

  // Load Scrabble dictionary when component mounts
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/benjamincrom/scrabble/refs/heads/master/scrabble/dictionary.json')
      .then(response => response.json())
      .then(data => {
        // Filter for words 3+ letters and convert to uppercase
        const words = data.filter(word => word.length >= 3)
                         .map(word => word.toUpperCase());
        setDictionary(new Set(words));
      });
  }, []);

  // Add this effect to animate the loading dots
  useEffect(() => {
    if (!isLoading) return;
    
    const interval = setInterval(() => {
      setLoadingDots(dots => dots.length >= 3 ? '' : dots + '.');
    }, 500);

    return () => clearInterval(interval);
  }, [isLoading]);

  const handleInput = (e) => {
    // Only allow letters
    const lettersOnly = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
    // Limit to 16 characters (4x4 grid)
    setLetters(lettersOnly.slice(0, 16));
  };

  const createGrid = () => {
    const grid = [];
    for (let i = 0; i < 16; i += 4) {
      const row = letters.slice(i, i + 4).padEnd(4, ' ').split('');
      grid.push(row);
    }
    return grid;
  };

  const findWords = () => {
    if (letters.length !== 16) return;
    setIsLoading(true);
    
    const board = createGrid();
    const foundWords = new Set();
    const paths = new Map(); // Store paths for each word
    
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    function isValid(x, y) {
      return x >= 0 && x < 4 && y >= 0 && y < 4;
    }

    function searchWord(x, y, visited, currentWord, path) {
      if (currentWord.length >= 3 && dictionary.has(currentWord)) {
        foundWords.add(currentWord);
        paths.set(currentWord, [...path]);
      }

      for (const [dx, dy] of directions) {
        const newX = x + dx;
        const newY = y + dy;

        if (isValid(newX, newY) && !visited.has(`${newX},${newY}`)) {
          visited.add(`${newX},${newY}`);
          searchWord(
            newX, 
            newY, 
            visited, 
            currentWord + board[newX][newY],
            [...path, { x: newX, y: newY }]
          );
          visited.delete(`${newX},${newY}`);
        }
      }
    }

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const visited = new Set([`${i},${j}`]);
        searchWord(i, j, visited, board[i][j], [{ x: i, y: j }]);
      }
    }

    const sortedWords = [...foundWords].sort((a, b) => {
      if (b.length !== a.length) return b.length - a.length;
      return a.localeCompare(b);
    });

    setWords(sortedWords);
    setWordPaths(paths);
    setCurrentWordIndex(0);
    setIsLoading(false);
  };

  const handleNext = () => {
    setCurrentWordIndex(prev => 
      prev < words.length - 1 ? prev + 1 : prev
    );
  };

  const handlePrevious = () => {
    setCurrentWordIndex(prev => 
      prev > 0 ? prev - 1 : prev
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && letters.length === 16) {
      findWords();
    }
  };

  const handleClear = () => {
    setLetters('');
    setWords([]);
    setCurrentWordIndex(0);
    setWordPaths(new Map());
  };

  // Calculate cell center positions for SVG lines
  const getCellCenter = (x, y) => {
    const cellSize = 48; // w-12 = 48px
    const gap = 8; // gap-2 = 8px
    return {
      x: (cellSize + gap) * y + cellSize / 2,
      y: (cellSize + gap) * x + cellSize / 2
    };
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <input 
        type="text" 
        value={letters}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        className="border border-gray-300 rounded-lg p-4 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Enter exactly 16 letters..."
        maxLength={16}
      />
      
      <div className="relative">
        <div className="grid grid-cols-4 gap-2">
          {createGrid().map((row, rowIndex) => (
            row.map((letter, colIndex) => (
              <div 
                key={`${rowIndex}-${colIndex}`}
                className="w-12 h-12 border border-gray-300 flex items-center justify-center font-bold text-lg"
              >
                {letter}
              </div>
            ))
          ))}
        </div>

        {words.length > 0 && (
          <svg 
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{ transform: 'translate(-2px, -2px)' }}
          >
            {wordPaths.get(words[currentWordIndex])?.[0] && (
              <circle
                cx={getCellCenter(
                  wordPaths.get(words[currentWordIndex])[0].x,
                  wordPaths.get(words[currentWordIndex])[0].y
                ).x}
                cy={getCellCenter(
                  wordPaths.get(words[currentWordIndex])[0].x,
                  wordPaths.get(words[currentWordIndex])[0].y
                ).y}
                r="8"
                fill="#22C55E"
                opacity="0.8"
              >
                <animate
                  attributeName="r"
                  values="8;12;8"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.8;0.2;0.8"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </circle>
            )}

            {wordPaths.get(words[currentWordIndex])?.map((point, index, path) => {
              if (index === path.length - 1) return null;
              const start = getCellCenter(point.x, point.y);
              const end = getCellCenter(path[index + 1].x, path[index + 1].y);
              return (
                <line
                  key={index}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke="#3B82F6"
                  strokeWidth="3"
                  strokeLinecap="round"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="100"
                    to="0"
                    dur="0.5s"
                    fill="freeze"
                  />
                </line>
              );
            })}
          </svg>
        )}
      </div>

      <div className="flex gap-4">
        {words.length === 0 && (  // Only show Find Words button if no words found
          <button
            onClick={findWords}
            disabled={letters.length !== 16 || isLoading}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg disabled:opacity-50 hover:bg-blue-600 transition-colors"
          >
            {isLoading ? `Loading${loadingDots}` : 'Find All Words'}
          </button>
        )}

        <button
          onClick={handleClear}
          className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
        >
          Clear Board
        </button>
      </div>

      {words.length > 0 && (
        <div className="w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={handlePrevious}
              disabled={currentWordIndex === 0}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-gray-600 transition-colors"
            >
              Previous
            </button>
            <div className="text-xl font-bold">
              {words[currentWordIndex]} ({currentWordIndex + 1}/{words.length})
            </div>
            <button
              onClick={handleNext}
              disabled={currentWordIndex === words.length - 1}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-gray-600 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
