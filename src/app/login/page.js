'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { useFirestore } from '../hooks/useFirestore';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp, verificationPending, verifyCode, setVerificationPending } = useAuth();
  const router = useRouter();
  const [verificationInput, setVerificationInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isReferralValid, setIsReferralValid] = useState(null);
  const { validateReferralCode } = useFirestore();
  const [showVerification, setShowVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if we should show signup form
    if (searchParams.get('signup') === 'true') {
      setIsSignUp(true);
    }
  }, [searchParams]);

  useEffect(() => {
    setIsPasswordValid(
      password.length >= 6 && 
      (!isSignUp || password === confirmPassword) && 
      password !== ''
    );
  }, [password, confirmPassword, isSignUp]);

  useEffect(() => {
    const validateCode = async () => {
      if (referralCode.length === 6) {
        const isValid = await validateReferralCode(referralCode);
        setIsReferralValid(isValid);
      } else {
        setIsReferralValid(null);
      }
    };
    validateCode();
  }, [referralCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password, referralCode);
        // The verification form will show automatically because
        // signUp function sets verificationPending to true
        setVerificationInput(''); // Clear any previous verification input
      } else {
        await signIn(email, password);
        router.push('/');
      }
    } catch (error) {
      console.error('Error in signup:', error);
      setError(error.message || 'Failed to create account');
    }

    setLoading(false);
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    const result = await verifyCode(verificationInput, referralCode);
    if (result.success) {
      router.push('/');
    } else {
      setIsVerifying(false);
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Link
        href="/landing"
        className="absolute top-4 left-4 text-gray-600 hover:text-gray-800 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Landing</span>
      </Link>

      <div className="p-8 bg-white rounded-lg shadow-md max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isSignUp ? 'Create Account' : 'Login to Boggle Finder'}
        </h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {!verificationPending ? (
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
                    Referral Code (+3 tokens)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Enter referral code"
                      maxLength={6}
                    />
                    {referralCode.length > 0 && (
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {isReferralValid ? (
                          <FaCheck className="text-green-500" />
                        ) : (
                          <FaTimes className="text-red-500" />
                        )}
                      </span>
                    )}
                  </div>
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
        ) : (
          <form onSubmit={handleVerification} className="space-y-4">
            <h2 className="text-2xl font-bold">Verify Your Email</h2>
            <p className="text-gray-600">
              Enter the verification code sent to your email
            </p>
            <p className="text-orange-600 font-semibold border border-orange-200 bg-orange-50 p-3 rounded">
              Please check your spam folder if you don't see the email in your inbox
            </p>
            <input
              type="text"
              value={verificationInput}
              onChange={(e) => setVerificationInput(e.target.value)}
              placeholder="Enter verification code"
              className="w-full p-2 border rounded"
              disabled={isVerifying}
            />
            <button
              type="submit"
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 flex items-center justify-center"
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </button>
          </form>
        )}

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