'use client';
import { useAuth } from '../context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useFirestore } from '../hooks/useFirestore';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function BuyTokens() {
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
      console.log('Payment successful, attempting to refresh tokens');
      setMessage('Payment successful! Your tokens have been added to your account.');
      
      const refreshTokens = async () => {
        try {
          console.log('Getting updated token count...');
          const newTokenCount = await getUserTokens(user.uid);
          console.log('New token count:', newTokenCount);
        } catch (error) {
          console.error('Error refreshing tokens:', error);
        }
      };
      refreshTokens();
    }
    if (searchParams.get('canceled')) {
      console.log('Payment was canceled');
      setMessage('Payment canceled.');
    }
  }, [user, router, searchParams]);

  const tokenPackages = [
    { amount: 3, price: 4 },
    { amount: 10, price: 12 },
    { amount: 25, price: 20 },
  ];

  const handlePurchase = async (amount, price) => {
    console.log('Starting purchase process:', { amount, price, userId: user.uid });
    
    try {
      console.log('Creating checkout session...');
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          price,
          userId: user.uid,
        }),
      });

      console.log('Checkout session response received');
      const data = await response.json();
      console.log('Session data:', data);

      if (data.error) {
        console.error('Error in session data:', data.error);
        setMessage('Failed to create checkout session');
        return;
      }

      const { sessionId } = data;
      console.log('Got session ID:', sessionId);

      console.log('Loading Stripe...');
      const stripe = await stripePromise;
      console.log('Redirecting to checkout...');
      
      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        console.error('Stripe redirect error:', error);
        setMessage(error.message);
      }
    } catch (error) {
      console.error('Purchase process error:', error);
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Get More Tokens
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Each token lets you solve one Boggle board
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {tokenPackages.map(({ amount, price }) => (
            <div
              key={amount}
              className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-all hover:scale-105"
            >
              <div className="px-6 py-8">
                <div className="text-center">
                  <div className="mt-4 flex items-baseline justify-center">
                    <span className="text-5xl font-extrabold text-blue-600">{amount}</span>
                    <span className="ml-1 text-2xl font-medium text-gray-500">
                      tokens
                    </span>
                  </div>
                  <div className="mt-4 text-3xl font-bold text-gray-900">
                    ${price}
                  </div>
                  <div className="mt-2 text-gray-500">
                    ${(price/amount).toFixed(2)} per token
                  </div>
                </div>
              </div>
              <div className="px-6 pb-8">
                <button
                  onClick={() => handlePurchase(amount, price)}
                  className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold transform hover:scale-105"
                >
                  Buy Now
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-blue-500 hover:text-blue-600 font-semibold"
          >
            ← Back to Game
          </button>
        </div>

        {message && (
          <div className="mt-8 text-center text-gray-700">
            {message}
          </div>
        )}
      </div>
    </div>
  );
} 