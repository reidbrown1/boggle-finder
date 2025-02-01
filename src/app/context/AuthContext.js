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

  const signUp = async (email, password, referralCode = '') => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Create the user document in Firestore with referral code
      await createUserDocument(userCredential.user.uid, email, referralCode);
      return userCredential;
    } catch (error) {
      console.error('Error in signup:', error);
      throw error;
    }
  };

  const signIn = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logOut = async () => {
    setUser(null);
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, signUp, signIn, logOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 