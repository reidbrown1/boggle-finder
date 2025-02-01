'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { FaCheck, FaTimes } from 'react-icons/fa';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setIsPasswordValid(
      password.length >= 6 && 
      (!isSignUp || password === confirmPassword) && 
      password !== ''
    );
  }, [password, confirmPassword, isSignUp]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError('Please ensure passwords match and are at least 6 characters');
      return;
    }

    try {
      if (isSignUp) {
        await signUp(email, password, referralCode);
      } else {
        await signIn(email, password);
      }
      router.push('/');
    } catch (err) {
      console.error(err);
      setError(isSignUp ? 'Failed to create account.' : 'Invalid email or password.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-md max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isSignUp ? 'Create Account' : 'Login to Boggle Finder'}
        </h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
                minLength={6}
              />
              {password.length > 0 && (
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {password.length >= 6 ? (
                    <FaCheck className="text-green-500" />
                  ) : (
                    <FaTimes className="text-red-500" />
                  )}
                </span>
              )}
            </div>
            {password.length > 0 && password.length < 6 && (
              <p className="text-sm text-red-500 mt-1">
                Password must be at least 6 characters
              </p>
            )}
          </div>
          {isSignUp && (
            <>
              <div>
                <label className="block text-gray-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                  {confirmPassword.length > 0 && (
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {password === confirmPassword && password.length >= 6 ? (
                        <FaCheck className="text-green-500" />
                      ) : (
                        <FaTimes className="text-red-500" />
                      )}
                    </span>
                  )}
                </div>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="text-sm text-red-500 mt-1">
                    Passwords do not match
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  Referral Code (Optional)
                </label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Enter referral code"
                  maxLength={6}
                />
              </div>
            </>
          )}
          <button
            type="submit"
            disabled={!isPasswordValid}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSignUp ? 'Sign Up' : 'Login'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setReferralCode('');
            }}
            className="text-blue-500 hover:text-blue-600"
          >
            {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
} 