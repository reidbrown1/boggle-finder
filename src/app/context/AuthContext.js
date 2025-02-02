'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { 
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { useFirestore } from '../hooks/useFirestore';
import { doc, setDoc, getDocs, query, where, updateDoc, increment, collection } from 'firebase/firestore';
import { generateReferralCode } from '../utils/referralCodeGenerator';

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
      // Generate a 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      // First, send verification email
      const response = await fetch('/api/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          verificationCode,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send verification email');
      }

      // Store verification details
      setVerificationCode(verificationCode);
      setVerificationEmail(email);
      sessionStorage.setItem('pendingPassword', password);
      setVerificationPending(true);

      return { success: true };
    } catch (error) {
      console.error('Error in signup:', error);
      throw error;
    }
  };

  const verifyCode = async (inputCode, referralCode = '') => {
    try {
      if (inputCode === verificationCode) {
        const password = sessionStorage.getItem('pendingPassword');
        
        // Create user but don't change verification state yet
        const userCredential = await createUserWithEmailAndPassword(auth, verificationEmail, password);
        
        // Create the user document with referral code
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: verificationEmail,
          verificationCode,
          isVerified: false,
          tokens: 3,
          referralCode: generateReferralCode(),
        });
        
        // Only clear states after everything is successful
        sessionStorage.removeItem('pendingPassword');
        setVerificationCode('');
        setVerificationEmail('');
        setVerificationPending(false);
        
        // If there's a valid referral code, add tokens to both users
        if (referralCode) {
          const referralSnapshot = await getDocs(
            query(collection(db, 'users'), where('referralCode', '==', referralCode))
          );
          
          if (!referralSnapshot.empty) {
            const referrerDoc = referralSnapshot.docs[0];
            // Add 3 tokens to referrer
            await updateDoc(doc(db, 'users', referrerDoc.id), {
              tokens: increment(3)
            });
            // Add 3 tokens to new user
            await updateDoc(doc(db, 'users', userCredential.user.uid), {
              tokens: increment(3)
            });
          }
        }
        
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
    setVerificationPending,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 