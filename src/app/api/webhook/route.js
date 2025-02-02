import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
  const body = await req.text();
  const headersList = headers();
  const sig = headersList.get('stripe-signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, tokenAmount } = session.metadata;

    try {
      // Simpler token update logic
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const currentTokens = userDoc.data().tokens || 0;
      const newTokens = currentTokens + parseInt(tokenAmount);

      await updateDoc(userRef, {
        tokens: newTokens
      });

      console.log(`Updated tokens for user ${userId}: ${currentTokens} -> ${newTokens}`);
    } catch (error) {
      console.error('Error updating tokens:', error);
      return NextResponse.json({ error: 'Error updating tokens' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

export const config = {
  api: {
    bodyParser: false,
  },
}; 