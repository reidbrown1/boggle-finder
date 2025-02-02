'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [dictionary, setDictionary] = useState(new Set());
  const [words, setWords] = useState([]);
  const [wordPaths, setWordPaths] = useState(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const demoLetters = "SDLYAIOBOCHNGTES";
//   "SDLYAIOBOCHNGTES"
// "DTWOLALESMAESODT";

  // Load dictionary and find words immediately
  useEffect(() => {
    setIsLoading(true);
    fetch('https://raw.githubusercontent.com/benjamincrom/scrabble/refs/heads/master/scrabble/dictionary.json')
      .then(response => response.json())
      .then(data => {
        const words = data.filter(word => word.length >= 3)
                         .map(word => word.toUpperCase());
        setDictionary(new Set(words));
        findWords(new Set(words));  // Pass dictionary directly to findWords
        setIsLoading(false);
      });
  }, []);

  const createGrid = () => {
    const grid = [];
    for (let i = 0; i < 16; i += 4) {
      const row = demoLetters.slice(i, i + 4).split('').map(letter => 
        letter === 'Q' ? 'QU' : letter
      );
      grid.push(row);
    }
    return grid;
  };

  const findWords = (dict) => {
    const board = createGrid();
    const foundWords = new Set();
    const paths = new Map();
    
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    function isValid(x, y) {
      return x >= 0 && x < 4 && y >= 0 && y < 4;
    }

    function searchWord(x, y, visited, currentWord, path) {
      const currentCell = board[x][y];
      let newWord = currentWord;
      
      if (currentCell === 'QU') {
        newWord += 'QU';
      } else {
        newWord += currentCell;
      }

      if (newWord.length >= 3 && dict.has(newWord)) {
        foundWords.add(newWord);
        paths.set(newWord, [...path]);
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
            newWord,
            [...path, { x: newX, y: newY }]
          );
          visited.delete(`${newX},${newY}`);
        }
      }
    }

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const visited = new Set([`${i},${j}`]);
        searchWord(i, j, visited, '', [{ x: i, y: j }]);
      }
    }

    const sortedWords = [...foundWords].sort((a, b) => {
      if (b.length !== a.length) return b.length - a.length;
      return a.localeCompare(b);
    });

    setWords(sortedWords);
    setWordPaths(paths);
    setCurrentWordIndex(0);
  };

  const getCellCenter = (x, y) => {
    const cellSize = 48;
    const gap = 8;
    return {
      x: (cellSize + gap) * y + cellSize / 2,
      y: (cellSize + gap) * x + cellSize / 2
    };
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="text-xl font-bold text-gray-900">
              Boggle Finder
            </div>
            <div className="flex gap-4">
              <Link
                href="/login"
                className="bg-[#1a237e] text-white px-6 py-2 rounded-lg hover:bg-[#0d1452] transition-colors"
              >
                Login
              </Link>
              <Link
                href="/login?signup=true"
                className="bg-[#1a237e] text-white px-6 py-2 rounded-lg hover:bg-[#0d1452] transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Gain Your Edge in Head-to-Head Boggle
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Experience nearly guaranteed wins in Boggle head-to-head matches. Our platform provides you with optimal word solutions, giving you a significant competitive advantage.
          </p>

          {/* Platform Section - Moved up */}
          <div className="mt-16">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* FanDuel Card */}
                <div className="bg-white rounded-xl shadow-lg p-8 transition-transform hover:scale-105">
                  <img 
                    src="/landing1.png" 
                    alt="FanDuel Faceoff" 
                    className="w-32 h-32 object-cover rounded-xl mx-auto mb-6"
                  />
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">FanDuel Faceoff</h3>
                  <div className="text-4xl font-bold text-green-600 mb-6">$20 → $16</div>
                  <a 
                    href="https://apps.apple.com/us/app/fanduel-faceoff/id1608208805"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Download App
                  </a>
                </div>

                {/* World Winner Card */}
                <div className="bg-white rounded-xl shadow-lg p-8 transition-transform hover:scale-105">
                  <img 
                    src="/landing2.png" 
                    alt="World Winner" 
                    className="w-32 h-32 object-cover rounded-xl mx-auto mb-6"
                  />
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">World Winner</h3>
                  <div className="text-4xl font-bold text-green-600 mb-6">$10 → $7</div>
                  <a 
                    href="https://apps.apple.com/us/app/worldwinner-play-cash-games/id1248993106"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Download App
                  </a>
                </div>

                {/* Word Race Card */}
                <div className="bg-white rounded-xl shadow-lg p-8 transition-transform hover:scale-105">
                  <img 
                    src="/landing3.png" 
                    alt="Word Race" 
                    className="w-32 h-32 object-cover rounded-xl mx-auto mb-6"
                  />
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Word Race</h3>
                  <div className="text-4xl font-bold text-green-600 mb-6">$6 → $4</div>
                  <a 
                    href="https://apps.apple.com/us/app/word-race-train-your-brain/id1199652148"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Download App
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Demo Section - Moved down with new header */}
          <div className="border-t border-gray-200 mt-24">
            <div className="max-w-7xl mx-auto py-24">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900">See How It Works</h2>
                <p className="mt-4 text-xl text-gray-600">
                  Our system analyzes the Boggle board and shows you every possible word, complete with visual paths. 
                  Watch this demo to see how easy it is to dominate your matches.
                </p>
              </div>

              {/* Demo Grid Section - rest stays the same */}
              <div className="flex flex-col items-center gap-8">
                {isLoading ? (
                  <div className="text-gray-600">Loading demo...</div>
                ) : (
                  <>
                    <div className="border border-gray-300 rounded-lg p-4 w-full max-w-md bg-gray-100">
                      {demoLetters}
                    </div>
                    
                    <div className="relative">
                      <div className="grid grid-cols-4 gap-2">
                        {createGrid().map((row, rowIndex) => (
                          row.map((letter, colIndex) => (
                            <div 
                              key={`${rowIndex}-${colIndex}`}
                              className="w-12 h-12 border border-gray-300 flex items-center justify-center font-bold text-lg rounded-md bg-white"
                            >
                              {letter}
                            </div>
                          ))
                        ))}
                      </div>

                      {/* Add SVG overlay for paths */}
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
                    </div>

                    {/* Current word display */}
                    <div className="text-2xl font-bold h-12 min-w-[200px] border border-gray-300 rounded-lg bg-white flex items-center justify-center">
                      {words[currentWordIndex]}
                    </div>

                    {/* Navigation buttons */}
                    <div className="flex gap-4">
                      <button
                        onClick={handlePrevious}
                        disabled={currentWordIndex === 0}
                        className="bg-gray-500 text-white px-6 py-2 rounded-lg disabled:opacity-50 transition-colors enabled:hover:bg-gray-600"
                      >
                        Prev
                      </button>

                      <button
                        onClick={handleNext}
                        disabled={currentWordIndex === words.length - 1}
                        className="bg-gray-500 text-white px-6 py-2 rounded-lg disabled:opacity-50 transition-colors enabled:hover:bg-gray-600"
                      >
                        Next
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 