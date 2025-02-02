import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { priceId, tokenAmount, userId } = await req.json();
    
    console.log('Received request:', { priceId, tokenAmount, userId });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/buy-tokens?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/buy-tokens?canceled=true`,
      metadata: {
        userId: userId,
        tokenAmount: tokenAmount.toString(),
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (err) {
    console.error('Detailed error:', err);
    return NextResponse.json(
      { error: err.message || 'Error creating checkout session' },
      { status: 500 }
    );
  }
} 