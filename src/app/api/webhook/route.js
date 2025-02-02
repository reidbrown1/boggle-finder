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
    console.log('💰 Payment completed, starting token update:', { userId, tokenAmount });

    try {
      // Simpler token update logic
      const userRef = doc(db, 'users', userId);
      console.log('📄 Getting user document for:', userId);
      
      const userDoc = await getDoc(userRef);
      console.log('📊 Current user data:', userDoc.data());
      
      if (!userDoc.exists()) {
        console.error('❌ User document not found:', userId);
        throw new Error('User not found');
      }

      const currentTokens = userDoc.data().tokens || 0;
      const newTokens = currentTokens + parseInt(tokenAmount);
      console.log('🔄 Token update calculation:', { currentTokens, newTokens });

      await updateDoc(userRef, {
        tokens: newTokens
      });
      console.log('✅ Tokens successfully updated in database');

    } catch (error) {
      console.error('❌ Error in token update process:', error);
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