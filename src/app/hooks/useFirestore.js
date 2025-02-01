import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment
} from 'firebase/firestore';

export const useFirestore = () => {
  const createUserDocument = async (userId, email, referralCode = '') => {
    try {
      // Generate a random 6-character referral code for the new user
      const userReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // If a referral code was provided, verify it and give bonus tokens
      let bonusTokens = 0;
      if (referralCode) {
        const q = query(
          collection(db, 'users'),
          where('referralCode', '==', referralCode)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          bonusTokens = 5; // Bonus tokens for using a referral code
        }
      }
      
      await setDoc(doc(db, 'users', userId), {
        email,
        tokens: 10 + bonusTokens, // Starting tokens + bonus
        tokensUsed: 0,
        referralCode: userReferralCode,
        signUpDate: new Date(),
        usedReferralCode: referralCode || null
      });
    } catch (error) {
      console.error('Error creating user document:', error);
      throw error;
    }
  };

  const getUserTokens = async (userId) => {
    try {
      const userDoc = await doc(db, 'users', userId);
      const docSnap = await getDoc(userDoc);
      if (docSnap.exists()) {
        return docSnap.data().tokens;
      }
      return 0;
    } catch (error) {
      console.error('Error getting user tokens:', error);
      throw error;
    }
  };

  const decrementTokens = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        tokens: increment(-1),
        tokensUsed: increment(1)
      });
    } catch (error) {
      console.error('Error updating tokens:', error);
      throw error;
    }
  };

  return { createUserDocument, getUserTokens, decrementTokens };
}; 