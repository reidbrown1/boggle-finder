'use client';
import { useAuth } from '../context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useFirestore } from '../hooks/useFirestore';
import { FaArrowLeft } from 'react-icons/fa';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const BuyTokens = () => {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('');
  const { getUserTokens } = useFirestore();

  useEffect(() => {
    if (!user) {
      console.log('No user found, redirecting to login');
      router.push('/login');
    }

    // Check for success/canceled status
    if (searchParams.get('success')) {
      console.log('🎉 Payment successful, starting token refresh');
      setMessage('Payment successful! Your tokens have been added to your account.');
      
      const refreshTokens = async () => {
        try {
          console.log('📊 Getting updated token count...');
          const beforeTokens = await getUserTokens(user.uid);
          console.log('Before refresh token count:', beforeTokens);
          
          const newTokenCount = await getUserTokens(user.uid);
          console.log('✅ After refresh token count:', newTokenCount);
        } catch (error) {
          console.error('❌ Error refreshing tokens:', error);
        }
      };
      refreshTokens();
    }
    if (searchParams.get('canceled')) {
      console.log('Payment was canceled');
      setMessage('Payment canceled.');
    }
  }, [user, router, searchParams]);

  const handlePurchase = async (priceId, tokenAmount) => {
    try {
      const stripe = await stripePromise;
      
      // First create the checkout session on your server
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          tokenAmount,
          userId: user.uid, // Add user ID to track the purchase
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const { sessionId } = await response.json();

      if (!sessionId) {
        throw new Error('No session ID returned from server');
      }

      // Redirect to Stripe checkout
      const result = await stripe.redirectToCheckout({
        sessionId: sessionId
      });

      if (result.error) {
        console.error('Stripe redirect error:', result.error);
        throw new Error(result.error.message);
      }
    } catch (err) {
      console.error('Purchase error:', err);
      setMessage('Error processing purchase. Please try again.');
    }
  };

  const tokenPackages = [
    { 
      amount: 3, 
      price: 4, 
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_3_TOKENS
    },
    { 
      amount: 10, 
      price: 12, 
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_10_TOKENS
    },
    { 
      amount: 25, 
      price: 20, 
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_25_TOKENS
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">Buy Tokens</h1>
          <button
            onClick={() => router.push('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Return
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tokenPackages.map((pkg) => (
            <button
              key={pkg.amount}
              onClick={() => handlePurchase(pkg.priceId, pkg.amount)}
              className="relative bg-white rounded-xl shadow-md p-8 transition-transform hover:scale-105 text-left h-48 flex items-center justify-between"
            >
              <div className="flex flex-col items-start">
                <h2 className="text-2xl font-bold text-gray-900">{pkg.amount} Tokens</h2>
              </div>
              <div className="text-4xl font-bold text-blue-600">
                ${pkg.price}
              </div>
              <div className="absolute top-4 right-4 text-sm text-gray-500">
                ${(pkg.price / pkg.amount).toFixed(2)}/token
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 text-center text-gray-700">
          <p>Each token grants one use of the Boggle word detection system. For a guaranteed victory, it is recommended to use 3 tokens per game.</p>
        </div>

        {message && (
          <div className="mt-8 text-center text-gray-700">
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyTokens; 