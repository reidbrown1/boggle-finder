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
  const createUserDocument = async (uid, email, referralCode = '') => {
    try {
      const userReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Initial tokens setup
      let startingTokens = 1;
      if (referralCode) {
        const q = query(
          collection(db, 'users'),
          where('referralCode', '==', referralCode)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          startingTokens = 3; // Base tokens (1) + referral bonus (2)
          
          // Add bonus tokens to the referrer
          const referrerDoc = querySnapshot.docs[0];
          await updateDoc(doc(db, 'users', referrerDoc.id), {
            tokens: increment(2)
          });
        }
      }

      await setDoc(doc(db, 'users', uid), {
        email,
        referralCode: userReferralCode,
        signUpDate: new Date().toISOString(),
        tokens: startingTokens,
        tokensUsed: 0,
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

  // Add referral code validation function
  const validateReferralCode = async (code) => {
    if (!code) return false;
    try {
      const q = query(
        collection(db, 'users'),
        where('referralCode', '==', code)
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error validating referral code:', error);
      return false;
    }
  };

  // Add function to get user's referral code
  const getUserReferralCode = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data().referralCode;
      }
      return null;
    } catch (error) {
      console.error('Error getting referral code:', error);
      throw error;
    }
  };

  return { createUserDocument, getUserTokens, decrementTokens, validateReferralCode, getUserReferralCode };
}; 