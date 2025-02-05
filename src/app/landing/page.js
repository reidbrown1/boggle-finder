'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const demoLetters = "SDLYAIOBOCHNGTES";
  
  // Hardcoded demo data with just the longest/most interesting words and their paths
  const [words] = useState([
    'ACHIOTES', 'ACHIOTE', 'BODICES', 'CTENOID', 'ETHIONS', 'LICHENS', 'TECHILY',
    'ACIDLY', 'BOCHES', 'BODICE', 'BODILY', 'COILON', 'ENOLIC', 'ETHION', 'GOTHIC',
    'ICONES', 'LICHEN', 'LICHES', 'LIONET', 'LOCHIA', 'OCHONE', 'SACHET', 'SAICES',
    'SETHIC', 'TECHNO'  // Limited to 25 longest words for demo
  ]);

  const [wordPaths] = useState(new Map([
    ['ACHIOTES', [{"x":1,"y":0},{"x":2,"y":1},{"x":2,"y":2},{"x":1,"y":1},{"x":2,"y":0},{"x":3,"y":1},{"x":3,"y":2},{"x":3,"y":3}]],
    ['ACHIOTE', [{"x":1,"y":0},{"x":2,"y":1},{"x":2,"y":2},{"x":1,"y":1},{"x":2,"y":0},{"x":3,"y":1},{"x":3,"y":2}]],
    ['BODICES', [{"x":1,"y":3},{"x":1,"y":2},{"x":0,"y":1},{"x":1,"y":1},{"x":2,"y":1},{"x":3,"y":2},{"x":3,"y":3}]],
    ['CTENOID', [{"x":2,"y":1},{"x":3,"y":1},{"x":3,"y":2},{"x":2,"y":3},{"x":1,"y":2},{"x":1,"y":1},{"x":0,"y":1}]],
    ['ETHIONS', [{"x":3,"y":2},{"x":3,"y":1},{"x":2,"y":2},{"x":1,"y":1},{"x":1,"y":2},{"x":2,"y":3},{"x":3,"y":3}]],
    ['LICHENS', [{"x":0,"y":2},{"x":1,"y":1},{"x":2,"y":1},{"x":2,"y":2},{"x":3,"y":2},{"x":2,"y":3},{"x":3,"y":3}]],
    ['TECHILY', [{"x":3,"y":1},{"x":3,"y":2},{"x":2,"y":1},{"x":2,"y":2},{"x":1,"y":1},{"x":0,"y":2},{"x":0,"y":3}]],
    ['ACIDLY', [{"x":1,"y":0},{"x":2,"y":1},{"x":1,"y":1},{"x":0,"y":1},{"x":0,"y":2},{"x":0,"y":3}]],
    ['BOCHES', [{"x":1,"y":3},{"x":1,"y":2},{"x":2,"y":1},{"x":2,"y":2},{"x":3,"y":2},{"x":3,"y":3}]],
    ['BODICE', [{"x":1,"y":3},{"x":1,"y":2},{"x":0,"y":1},{"x":1,"y":1},{"x":2,"y":1},{"x":3,"y":2}]],
    ['BODILY', [{"x":1,"y":3},{"x":1,"y":2},{"x":0,"y":1},{"x":1,"y":1},{"x":0,"y":2},{"x":0,"y":3}]],
    ['COILON', [{"x":2,"y":1},{"x":2,"y":0},{"x":1,"y":1},{"x":0,"y":2},{"x":1,"y":2},{"x":2,"y":3}]],
    ['ENOLIC', [{"x":3,"y":2},{"x":2,"y":3},{"x":1,"y":2},{"x":0,"y":2},{"x":1,"y":1},{"x":2,"y":1}]],
    ['ETHION', [{"x":3,"y":2},{"x":3,"y":1},{"x":2,"y":2},{"x":1,"y":1},{"x":1,"y":2},{"x":2,"y":3}]],
    ['GOTHIC', [{"x":3,"y":0},{"x":2,"y":0},{"x":3,"y":1},{"x":2,"y":2},{"x":1,"y":1},{"x":2,"y":1}]],
    ['ICONES', [{"x":1,"y":1},{"x":2,"y":1},{"x":1,"y":2},{"x":2,"y":3},{"x":3,"y":2},{"x":3,"y":3}]],
    ['LICHEN', [{"x":0,"y":2},{"x":1,"y":1},{"x":2,"y":1},{"x":2,"y":2},{"x":3,"y":2},{"x":2,"y":3}]],
    ['LICHES', [{"x":0,"y":2},{"x":1,"y":1},{"x":2,"y":1},{"x":2,"y":2},{"x":3,"y":2},{"x":3,"y":3}]],
    ['LIONET', [{"x":0,"y":2},{"x":1,"y":1},{"x":1,"y":2},{"x":2,"y":3},{"x":3,"y":2},{"x":3,"y":1}]],
    ['LOCHIA', [{"x":0,"y":2},{"x":1,"y":2},{"x":2,"y":1},{"x":2,"y":2},{"x":1,"y":1},{"x":1,"y":0}]],
    ['OCHONE', [{"x":2,"y":0},{"x":2,"y":1},{"x":2,"y":2},{"x":1,"y":2},{"x":2,"y":3},{"x":3,"y":2}]],
    ['SACHET', [{"x":0,"y":0},{"x":1,"y":0},{"x":2,"y":1},{"x":2,"y":2},{"x":3,"y":2},{"x":3,"y":1}]],
    ['SAICES', [{"x":0,"y":0},{"x":1,"y":0},{"x":1,"y":1},{"x":2,"y":1},{"x":3,"y":2},{"x":3,"y":3}]],
    ['SETHIC', [{"x":0,"y":0},{"x":3,"y":2},{"x":3,"y":1},{"x":2,"y":2},{"x":1,"y":1},{"x":2,"y":1}]],
    ['TECHNO', [{"x":3,"y":1},{"x":3,"y":2},{"x":2,"y":1},{"x":2,"y":2},{"x":2,"y":3},{"x":1,"y":2}]]
  ]));

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

  const getDictionary = async () => {
    // Check localStorage first
    const cached = localStorage.getItem('boggleDictionary');
    if (cached) {
      return JSON.parse(cached);
    }

    // If not in cache, fetch and store
    try {
      const response = await fetch('https://raw.githubusercontent.com/benjamincrom/scrabble/refs/heads/master/scrabble/dictionary.json');
      const dictionary = await response.json();
      
      // Cache for future use
      localStorage.setItem('boggleDictionary', JSON.stringify(dictionary));
      
      return dictionary;
    } catch (error) {
      console.error('Error fetching dictionary:', error);
      return []; // Return empty array as fallback
    }
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 