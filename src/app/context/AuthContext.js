'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { 
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '../firebase';
import { useFirestore } from '../hooks/useFirestore';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { createUserDocument } = useFirestore();
  const [verificationPending, setVerificationPending] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email, password) => {
    try {
      // Set loading state before sending verification
      setVerificationPending(true);  // Set this first to prevent glitch
      
      const response = await fetch('/api/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (data.success) {
        setVerificationEmail(email);
        setVerificationCode(data.code.toString());
        sessionStorage.setItem('pendingPassword', password);
        return { success: true, message: 'Verification code sent' };
      } else {
        setVerificationPending(false);  // Reset if failed
        throw new Error(data.error);
      }
    } catch (error) {
      setVerificationPending(false);  // Reset if error
      console.error('Error in signup:', error);
      return { success: false, error: error.message };
    }
  };

  const verifyCode = async (inputCode, referralCode = '') => {
    try {
      if (inputCode === verificationCode) {
        const password = sessionStorage.getItem('pendingPassword');
        
        // Create user but don't change verification state yet
        const userCredential = await createUserWithEmailAndPassword(auth, verificationEmail, password);
        
        // Create the user document with referral code
        await createUserDocument(userCredential.user.uid, verificationEmail, referralCode);
        
        // Only clear states after everything is successful
        sessionStorage.removeItem('pendingPassword');
        setVerificationCode('');
        setVerificationEmail('');
        setVerificationPending(false);
        
        return { success: true };
      } else {
        return { success: false, error: 'Invalid verification code' };
      }
    } catch (error) {
      console.error('Error in verification:', error);
      return { success: false, error: error.message };
    }
  };

  const signIn = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logOut = async () => {
    setUser(null);
    await signOut(auth);
  };

  const value = {
    user,
    signUp,
    signIn,
    logOut,
    verificationPending,
    verifyCode,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 