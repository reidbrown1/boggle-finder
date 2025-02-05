'use client';
import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useRouter } from 'next/navigation';
import { useFirestore } from './hooks/useFirestore';
import { FaBars, FaTimes } from 'react-icons/fa';
import Link from 'next/link';
import dictionaryData from '../../dictionary.json';  // Go up two levels to reach root
console.log("Dictionary size:", dictionaryData.length);
console.log("Sample words:", dictionaryData.slice(0, 10));

export default function Home() {
  const { user, logOut } = useAuth();
  const router = useRouter();
  const { saveGame, getUserHistory, getUserTokens, decrementTokens, getUserReferralCode } = useFirestore();
  const [letters, setLetters] = useState('');
  const [words, setWords] = useState([]);
  const [dictionary] = useState(new Set(dictionaryData.filter(word => word.length >= 3)
                                                    .map(word => word.toUpperCase())));
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
  const [isSignUp, setIsSignUp] = useState(false);
  const [isBonusAchieved, setIsBonusAchieved] = useState(false);
  const [coveredPositions, setCoveredPositions] = useState(new Set());
  const [usedPositions, setUsedPositions] = useState(new Set());
  const [usedWords, setUsedWords] = useState(new Set());
  const [showWordList, setShowWordList] = useState(false);

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
      router.push('/landing');
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
        
        if (currentCell === 'QU') {
          newWord += 'QU';
        } else {
          newWord += currentCell;
        }

        // Early exit if word can't be in dictionary
        // Only check dictionary when word is 3+ letters
        if (newWord.length >= 3) {
          if (dictionary.has(newWord)) {
            foundWords.add(newWord);
            paths.set(newWord, [...path]);
          }
        }

        // Only continue searching if path length is less than longest possible word (e.g., 8)
        if (path.length >= 8) return;

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

      // Convert foundWords to an array of objects with word and path
      const wordObjects = [...foundWords].map(word => ({
        word,
        path: paths.get(word)
      }));

      // Sort words by length initially
      const sortedWords = wordObjects.sort((a, b) => b.word.length - a.word.length);

      setWords(sortedWords);
      setWordPaths(paths);
      setCurrentWordIndex(0);
      setIsLoading(false);
    } catch (error) {
      console.error('Error finding words:', error);
      setError('Failed to use token');
      setIsLoading(false);
      return;
    }
  };

  const handleNext = () => {
    if (currentWordIndex < words.length - 1) {
      const currentWordObj = words[currentWordIndex];
      const path = currentWordObj.path;
      const newUsedPositions = new Set(usedPositions);
      const newUsedWords = new Set(usedWords);

      // Mark current word as used
      newUsedWords.add(currentWordObj.word);
      path.forEach(pos => newUsedPositions.add(`${pos.x},${pos.y}`));

      setUsedWords(newUsedWords);
      setUsedPositions(newUsedPositions);

      // Check if all positions are covered
      if (newUsedPositions.size === 16) {
        setIsBonusAchieved(true);
        // Find the longest unused word from the entire list
        const unusedWords = words.filter(wordObj => 
          !newUsedWords.has(wordObj.word)
        );
        if (unusedWords.length > 0) {
          // Sort unused words by length and take the longest one
          const nextWord = unusedWords.sort((a, b) => b.word.length - a.word.length)[0];
          const nextIndex = words.indexOf(nextWord);
          setCurrentWordIndex(nextIndex);
        } else {
          setCurrentWordIndex(prev => prev + 1);
        }
      } else if (currentWordIndex >= 10) {
        // After 10 words, find the longest word that covers an unused position
        const unusedPositions = Array.from({ length: 4 }, (_, i) =>
          Array.from({ length: 4 }, (_, j) => `${i},${j}`)
        ).flat().filter(pos => !newUsedPositions.has(pos));

        if (unusedPositions.length > 0) {
          // Try to find a word that covers an unused position
          const nextWord = words.find(wordObj =>
            !newUsedWords.has(wordObj.word) && 
            wordObj.path.some(pos => unusedPositions.includes(`${pos.x},${pos.y}`))
          );
          
          if (nextWord) {
            const nextIndex = words.indexOf(nextWord);
            setCurrentWordIndex(nextIndex);
          } else {
            // If no word can cover the remaining positions, revert to longest word strategy
            const unusedWords = words.filter(wordObj => !newUsedWords.has(wordObj.word));
            if (unusedWords.length > 0) {
              const nextWord = unusedWords.sort((a, b) => b.word.length - a.word.length)[0];
              const nextIndex = words.indexOf(nextWord);
              setCurrentWordIndex(nextIndex);
            } else {
              setCurrentWordIndex(prev => prev + 1);
            }
          }
        }
      } else {
        setCurrentWordIndex(prev => prev + 1);
      }
    }
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
    setUsedPositions(new Set());
    setUsedWords(new Set());
    setIsBonusAchieved(false);
    // Wait for React to re-render the input
    setTimeout(() => {
      document.querySelector('input[type="text"]')?.focus();
    }, 0);
  };

  // Calculate cell center positions for SVG lines
  const getCellCenter = (x, y) => {
    const cellSize = 64; // w-16 = 64px
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
      <div className="bg-white rounded-lg p-6 max-w-lg w-full relative">
        {/* Close button */}
        <button
          onClick={() => setShowInstructions(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold mb-4">How to Use Boggle Finder</h2>
        
        <div className="text-gray-700 space-y-4">
          <ol className="list-decimal list-inside space-y-3 ml-2">
            <li>Launch your Boggle game on your mobile device</li>
            <li>
              <span className="font-semibold">Input the 16 letters with absolute precision</span> - 
              accuracy and speed are crucial here as the game timer continues to run
            </li>
            <li>Click the "Search" button to generate all possible words and their paths</li>
            <li>The optimal words will appear in descending order by length</li>
            <li>
              <span className="font-semibold">Maximize Efficiency:</span> Keep your focus on Boggle Finder's 
              display while your finger traces the paths on your phone. Your device will vibrate upon 
              successful word completion, eliminating the need to constantly look at your screen
            </li>
          </ol>

          <div className="bg-yellow-50 p-4 rounded-lg text-sm mt-6">
            <p className="font-bold text-yellow-800 mb-2">Important Notes:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li className="text-yellow-800">For optimal performance, use this application on a laptop/desktop while having your mobile device ready for gameplay</li>
              <li className="text-yellow-800">Each search consumes one token - ensure letter accuracy before initiating the search</li>
              <li className="text-yellow-800">As your skill level increases, matchmaking times may extend. However, matches are typically filled within 24 hours - feel free to play multiple games and check back later for results</li>
              <li className="text-red-600 font-medium">The majority of high-stakes players utilize assistance tools. Boggle Finder simply provides the most sophisticated and efficient solution available. As a result, you will eventually be matched with opponents at your skill level. Play with urgency!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  // Add this new modal component after InstructionsModal
  const WhyThisExistsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full relative">
        {/* Close button */}
        <button
          onClick={() => setShowWhyThisExists(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold mb-6">Why Does This Site Exist?</h2>
        
        <p className="text-gray-700 mb-8">
          Currently, there is an opportunity to take advantage of head-to-head wagering, 
          specifically with the game Boggle. Using this site will give you an edge over any opponent, 
          guaranteeing risk-free profit.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* FanDuel Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 transition-transform hover:scale-105 text-center">
            <img 
              src="/landing1.png" 
              alt="FanDuel Faceoff" 
              className="w-32 h-32 object-cover rounded-xl mx-auto mb-6"
            />
            <h3 className="text-xl font-bold text-gray-900 mb-4">FanDuel Faceoff</h3>
            <div className="text-3xl font-bold text-green-600 mb-6">$20 → $16</div>
            <a 
              href="https://apps.apple.com/us/app/fanduel-faceoff/id1608208805"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors w-full text-center"
            >
              Download App
            </a>
          </div>

          {/* World Winner Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 transition-transform hover:scale-105 text-center">
            <img 
              src="/landing2.png" 
              alt="World Winner" 
              className="w-32 h-32 object-cover rounded-xl mx-auto mb-6"
            />
            <h3 className="text-xl font-bold text-gray-900 mb-4">World Winner</h3>
            <div className="text-3xl font-bold text-green-600 mb-6">$10 → $7</div>
            <a 
              href="https://apps.apple.com/us/app/worldwinner-play-cash-games/id1248993106"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors w-full text-center"
            >
              Download App
            </a>
          </div>

          {/* Word Race Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 transition-transform hover:scale-105 text-center">
            <img 
              src="/landing3.png" 
              alt="Word Race" 
              className="w-32 h-32 object-cover rounded-xl mx-auto mb-6"
            />
            <h3 className="text-xl font-bold text-gray-900 mb-4">Word Race</h3>
            <div className="text-3xl font-bold text-green-600 mb-6">$6 → $4</div>
            <a 
              href="https://apps.apple.com/us/app/word-race-train-your-brain/id1199652148"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors w-full text-center"
            >
              Download App
            </a>
          </div>
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

  // Update the Sidebar component
  const Sidebar = () => (
    <div 
      className={`fixed top-0 left-0 h-full w-64 bg-gray-50 shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="p-4 flex flex-col h-full">
        <div className="flex justify-end">
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <FaTimes className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="space-y-4 mt-4 flex-grow">
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
              you both get 3 extra tokens!
            </p>
          </div>

          {/* Email Card */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <p className="text-sm text-gray-600">Your Email:</p>
            <p className="text-sm text-gray-900">{user?.email}</p>
          </div>
        </div>

        {/* Contact Information - Added at bottom */}
        <div className="mt-auto pt-4 text-center text-sm text-gray-500">
          <p>Questions or concerns?</p>
          <a 
            href="mailto:bogglefinder.help@gmail.com"
            className="text-blue-600 hover:text-blue-700"
          >
            bogglefinder.help@gmail.com
          </a>
        </div>
      </div>
    </div>
  );

  // Add this landing page component
  const LandingPage = () => (
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
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/login"
                onClick={() => setIsSignUp(true)}
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
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
          <div className="mt-10">
            <Link
              href="/login"
              onClick={() => setIsSignUp(true)}
              className="bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  // Add this function near your other handlers
  const handleKeyDown = (e) => {
    // Handle Enter for search
    if (e.key === 'Enter' && letters.length === 16) {
      if (tokens <= 0) {
        router.push('/buy-tokens');
      } else {
        findWords();
      }
    }
    
    // Handle 'f' for next word
    if (e.key.toLowerCase() === 'f') {
      if (words.length > 0 && currentWordIndex < words.length - 1) {
        handleNext();
      }
    }
    
    // Handle 's' for previous word
    if (e.key.toLowerCase() === 's') {
      if (words.length > 0 && currentWordIndex > 0) {
        handlePrevious();
      }
    }

    // Handle '1' for clearing the board
    if (e.key === '1') {
      if (letters.length > 0) {
        handleClear();
      }
    }
  };

  // Add this useEffect near your other effects
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [words, currentWordIndex, tokens, letters]); // Include dependencies

  return (
    <>
      {!user ? (
        <LandingPage />
      ) : (
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
                onKeyDown={handleKeyDown}
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
                  row.map((letter, colIndex) => {
                    const isUsed = usedPositions.has(`${rowIndex},${colIndex}`);
                    return (
                      <div 
                        key={`${rowIndex}-${colIndex}`}
                        className="w-16 h-16 border border-gray-300 flex items-center justify-center font-bold text-xl rounded-md bg-white"
                      >
                        {letter}
                      </div>
                    );
                  })
                ))}
              </div>

              {words.length > 0 && (
                <svg 
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  style={{ transform: 'translate(-2px, -2px)' }}
                >
                  {wordPaths.get(words[currentWordIndex].word)?.[0] && (
                    <circle
                      cx={getCellCenter(
                        wordPaths.get(words[currentWordIndex].word)[0].x,
                        wordPaths.get(words[currentWordIndex].word)[0].y
                      ).x}
                      cy={getCellCenter(
                        wordPaths.get(words[currentWordIndex].word)[0].x,
                        wordPaths.get(words[currentWordIndex].word)[0].y
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

                  {wordPaths.get(words[currentWordIndex].word)?.map((point, index, path) => {
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
              {words.length > 0 ? words[currentWordIndex].word : ''}
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
                  onClick={tokens <= 0 ? () => router.push('/buy-tokens') : findWords}
                  disabled={letters.length !== 16 || isLoading || words.length > 0}
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

                {/* Checkmark icon */}
                <svg
                  className={`w-6 h-6 ${isBonusAchieved ? 'text-green-500' : 'text-gray-300'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {/* Test mode disclaimer */}
              {isTestMode && (
                <div className="text-center text-sm text-gray-600 mt-4 max-w-md bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                  <p>This is test mode - you will only be shown the top two words. This is so you can see how this software functions. No tokens will be used. To see all available words you must turn off test mode.</p>
                </div>
              )}
            </div>

            {/* Word list with toggle */}
            <div className="mt-8 w-full max-w-md">
              <button
                onClick={() => setShowWordList(!showWordList)}
                className="w-full flex items-center justify-center p-2 bg-yellow-100 hover:bg-yellow-200 rounded-lg transition-colors"
              >
                <svg
                  className={`w-6 h-6 transform transition-transform ${showWordList ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showWordList && (
                <div className="h-48 overflow-y-auto border border-yellow-200 rounded-lg bg-yellow-50 p-4 mt-2">
                  <ul className="text-sm">
                    {words.map((word, index) => (
                      <li key={index} className={index === currentWordIndex ? 'font-bold' : ''}>
                        {word.word}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}