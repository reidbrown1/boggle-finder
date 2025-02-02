import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Add GET method handler
export async function GET() {
  return NextResponse.json({ status: 'webhook endpoint active' });
}

export async function POST(req) {
  console.log('🎯 Webhook endpoint hit');
  try {
    const body = await req.text();
    const headersList = headers();
    const sig = headersList.get('stripe-signature');
    
    if (!sig) {
      console.error('No stripe signature found');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    console.log('Event type received:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { userId, tokenAmount } = session.metadata;
      console.log('Processing payment completion:', { userId, tokenAmount });

      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const currentTokens = userDoc.data().tokens || 0;
      const newTokens = currentTokens + parseInt(tokenAmount);
      
      await updateDoc(userRef, {
        tokens: newTokens,
        lastUpdated: new Date().toISOString(),
        lastPurchase: {
          amount: tokenAmount,
          timestamp: new Date().toISOString()
        }
      });
      
      console.log('Success:', { userId, oldTokens: currentTokens, newTokens });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}; 