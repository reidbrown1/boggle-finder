'use client';
import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useRouter } from 'next/navigation';
import { useFirestore } from './hooks/useFirestore';
import { FaBars, FaTimes } from 'react-icons/fa';

export default function Home() {
  const { user, logOut } = useAuth();
  const router = useRouter();
  const { saveGame, getUserHistory, getUserTokens, decrementTokens, getUserReferralCode } = useFirestore();
  const [letters, setLetters] = useState('');
  const [words, setWords] = useState([]);
  const [dictionary, setDictionary] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordPaths, setWordPaths] = useState(new Map());
  const [loadingDots, setLoadingDots] = useState('');
  const [tokens, setTokens] = useState(0);
  const [error, setError] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [showWhyThisExists, setShowWhyThisExists] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);

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

  // Add this effect to check authentication
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Add this effect to load tokens
  useEffect(() => {
    if (user) {
      loadUserTokens();
    }
  }, [user]);

  const loadUserTokens = async () => {
    try {
      const userTokens = await getUserTokens(user.uid);
      setTokens(userTokens);
    } catch (error) {
      console.error('Error loading tokens:', error);
    }
  };

  const handleInput = (e) => {
    // Only allow letters
    const lettersOnly = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
    // Limit to 16 characters (4x4 grid)
    setLetters(lettersOnly.slice(0, 16));
  };

  const createGrid = () => {
    const grid = [];
    for (let i = 0; i < 16; i += 4) {
      const row = letters.slice(i, i + 4).padEnd(4, ' ').split('').map(letter => 
        letter === 'Q' ? 'QU' : letter
      );
      grid.push(row);
    }
    return grid;
  };

  const toggleTestMode = () => {
    setIsTestMode(!isTestMode);
    if (isTestMode) {
      // Clear board when turning test mode off
      handleClear();
    }
  };

  const findWords = async () => {
    if (letters.length !== 16) return;
    if (!isTestMode && tokens <= 0) return;
    
    setIsLoading(true);
    
    try {
      if (!isTestMode) {
        await decrementTokens(user.uid);
        setTokens(prev => prev - 1);
      }
      
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
        
        // If we find a Q, automatically add U
        if (currentCell === 'QU') {
          newWord += 'QU';
        } else {
          newWord += currentCell;
        }

        if (newWord.length >= 3 && dictionary.has(newWord)) {
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

      // Limit words in test mode
      setWords(isTestMode ? sortedWords.slice(0, 2) : sortedWords);
      setWordPaths(paths);
      setCurrentWordIndex(0);
      setIsLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to use token');
      setIsLoading(false);
      return;
    }
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

  // Add logout functionality
  const handleLogout = async () => {
    try {
      await logOut();
      router.push('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  // Add the Instructions Modal component
  const InstructionsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full">
        <h2 className="text-2xl font-bold mb-4">How to Use Boggle Finder</h2>
        
        <div className="text-gray-700 space-y-4">
          <div className="bg-yellow-50 p-4 rounded-lg text-sm">
            <p className="font-bold text-yellow-800">Disclaimer:</p>
            <p>This application is best utilized on a laptop with your phone in hand.
            Your token will be utilized upon clicking, so take care in entering the correct letters.</p>
          </div>

          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li>Begin your game of boggle on your phone</li>
            <li>Enter the 16 letters for the round</li>
            <li>Press "Find Words"</li>
            <li>All words available will appear and in the order in which you must connect the letters</li>
        </ol>

          <p className="text-sm text-gray-600 mt-4">
            Each search costs 1 token. Make sure to enter the letters correctly before searching!
          </p>
        </div>

        <button
          onClick={() => setShowInstructions(false)}
          className="mt-6 w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Got it!
        </button>
      </div>
    </div>
  );

  // Add this new modal component after InstructionsModal
  const WhyThisExistsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full">
        <h2 className="text-2xl font-bold mb-4">Why Does This Site Exist?</h2>
        
        <div className="text-gray-700 space-y-4">
          <p className="font-bold text-lg">This site offers you a RISK FREE edge. If utilized correctly, you can print money.</p>

          <p>Currently, there is an opportunity to take advantage of head to head wagering, specifically with the game Boggle. Using this site will give you an edge over any opponent, guaranteeing risk free profit.</p>

          <div className="space-y-3">
            <h3 className="font-bold">Available Platforms:</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div>
                <span className="font-semibold">FanDuel Faceoff:</span> $20 to win $16
                <a href="https://apps.apple.com/us/app/fanduel-faceoff/id1608208805" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="text-blue-500 hover:text-blue-600 block text-sm">
                  Download App →
                </a>
              </div>
              <div>
                <span className="font-semibold">Word Race:</span> $6 to win $4
                <a href="https://apps.apple.com/us/app/word-race-train-your-brain/id1199652148" 
            target="_blank"
            rel="noopener noreferrer"
                   className="text-blue-500 hover:text-blue-600 block text-sm">
                  Download App →
                </a>
              </div>
              <div>
                <span className="font-semibold">World Winner:</span> $10 to win $7
                <a href="https://apps.apple.com/us/app/worldwinner-play-cash-games/id1248993106" 
            target="_blank"
            rel="noopener noreferrer"
                   className="text-blue-500 hover:text-blue-600 block text-sm">
                  Download App →
                </a>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg mt-4">
            <p className="font-semibold">Advice:</p>
            <p>FanDuel Faceoff has the most liquidity and highest return. From experience, aim for about 1000-1200 points to secure a win. Any higher scores may slow down opponent matching due to the skill-based matchmaking system.</p>
          </div>

          <button
            onClick={() => setShowWhyThisExists(false)}
            className="mt-4 w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );

  const handleReferralCode = async () => {
    if (!showCode && user) {
      const code = await getUserReferralCode(user.uid);
      setReferralCode(code);
    }
    setShowCode(!showCode);
  };

  // Add useEffect to load referral code when sidebar opens
  useEffect(() => {
    const loadReferralCode = async () => {
      if (isSidebarOpen && user && !referralCode) {
        const code = await getUserReferralCode(user.uid);
        setReferralCode(code);
      }
    };
    loadReferralCode();
  }, [isSidebarOpen, user]);

  // Update the Sidebar component to include email display
  const Sidebar = () => (
    <div 
      className={`fixed top-0 left-0 h-full w-64 bg-gray-50 shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="p-4">
        <div className="flex justify-end">
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <FaTimes className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="space-y-4 mt-4">
          <button
            onClick={() => {
              router.push('/buy-tokens');
              setIsSidebarOpen(false);
            }}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-left"
          >
            Buy Tokens
          </button>

          <button
            onClick={() => {
              setShowInstructions(true);
              setIsSidebarOpen(false);
            }}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-left"
          >
            How to Use
          </button>

          <button
            onClick={() => {
              setShowWhyThisExists(true);
              setIsSidebarOpen(false);
            }}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-left"
          >
            Why This Exists?
          </button>

          <button
            onClick={() => {
              handleLogout();
              setIsSidebarOpen(false);
            }}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-left"
          >
            Logout
          </button>

          {/* Referral Code Card */}
          <div className="bg-white p-4 rounded-lg shadow-md mt-4">
            <p className="text-sm text-gray-600">Your Referral Code:</p>
            <p className="text-xl font-bold text-blue-600">{referralCode}</p>
            <p className="text-xs text-gray-500 mt-2">
              Share this code with friends! When they sign up using your code, 
              you both get 2 extra tokens!
            </p>
          </div>

          {/* Email Card */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <p className="text-sm text-gray-600">Your Email:</p>
            <p className="text-sm text-gray-900">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative">
      {/* Hamburger menu button */}
      <div className="absolute top-4 left-4">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <FaBars className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      {/* Updated tokens display with larger text */}
      <div className="absolute top-4 right-4 flex items-center gap-4">
        {/* Test mode button with disabled state */}
        <button
          onClick={toggleTestMode}
          disabled={words.length > 0}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg disabled:opacity-50 transition-colors enabled:hover:bg-gray-300"
        >
          Test Mode {isTestMode ? 'On' : 'Off'}
        </button>
        <div className="bg-gray-100 px-5 py-3 rounded-lg font-bold text-lg">
          Tokens: {tokens}
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar />

      {/* Modals */}
      {showInstructions && <InstructionsModal />}
      {showWhyThisExists && <WhyThisExistsModal />}

      {/* Main content */}
      <div className="min-h-screen flex flex-col items-center pt-32 gap-8 p-8">
        {words.length === 0 ? (
          <input 
            type="text" 
            value={letters}
            onChange={handleInput}
            className="border border-gray-300 rounded-lg p-4 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter exactly 16 letters..."
            maxLength={16}
          />
        ) : (
          <div className="border border-gray-300 rounded-lg p-4 w-full max-w-md bg-gray-100">
            {letters}
          </div>
        )}
        
        <div className="relative">
          <div className="grid grid-cols-4 gap-2">
            {createGrid().map((row, rowIndex) => (
              row.map((letter, colIndex) => (
                <div 
                  key={`${rowIndex}-${colIndex}`}
                  className="w-12 h-12 border border-gray-300 flex items-center justify-center font-bold text-lg rounded-md"
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

        {/* Current word display */}
        <div className="text-2xl font-bold h-12 min-w-[200px] border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
          {words.length > 0 ? words[currentWordIndex] : ''}
        </div>

        {/* Button container and test mode message */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-4 items-center">
            <button
              onClick={handleClear}
              disabled={letters.length === 0}
              className="bg-red-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 transition-colors enabled:hover:bg-red-800"
            >
              Clear
            </button>

            <button
              onClick={findWords}
              disabled={letters.length !== 16 || isLoading || tokens <= 0 || words.length > 0}
              className="bg-green-500 text-white px-6 py-2 rounded-lg disabled:opacity-50 transition-colors w-33 enabled:hover:bg-green-600"
            >
              {tokens <= 0 ? 'Buy Tokens' : 
                isLoading ? `Loading${loadingDots}` : 'Search'}
            </button>

            <button
              onClick={handlePrevious}
              disabled={currentWordIndex === 0 || words.length === 0}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg disabled:opacity-50 transition-colors enabled:hover:bg-gray-600"
            >
              Prev
            </button>

            <button
              onClick={handleNext}
              disabled={currentWordIndex === words.length - 1 || words.length === 0}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg disabled:opacity-50 transition-colors enabled:hover:bg-gray-600"
            >
              Next
            </button>
          </div>

          {/* Test mode disclaimer */}
          {isTestMode && (
            <div className="text-center text-sm text-gray-600 mt-4 max-w-md">
              <p>This is test mode - you will only be shown the top two words. This is so you can see how this software functions. To see all available words you must use a token.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}