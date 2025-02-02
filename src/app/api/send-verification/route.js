import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Create a transporter using Gmail
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  headers: {
    'X-Priority': '1',
    'X-MSMail-Priority': 'High',
    'Importance': 'high'
  }
});

export async function POST(req) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ 
        error: 'Email is required' 
      }, { status: 400 });
    }

    // Verify transporter
    await transporter.verify();
    
    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    
    // Email content
    const mailOptions = {
      from: {
        name: 'Boggle Finder',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Verify your Boggle Finder account',
      priority: 'high',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Welcome to Boggle Finder!</h1>
          <p>Thank you for signing up! Please verify your email address to complete your registration.</p>
          <p>Your verification code is:</p>
          <h2 style="color: #1f2937; background: #f3f4f6; padding: 10px; text-align: center; font-size: 24px;">
            ${verificationCode}
          </h2>
          <p>Enter this code to complete your registration.</p>
          <p style="color: #6b7280; font-size: 14px;">
            If you didn't request this code, you can safely ignore this email.
          </p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
            This is an automated message from Boggle Finder. Please do not reply to this email.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);

    return NextResponse.json({ 
      success: true, 
      code: verificationCode 
    });
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json({ 
      error: 'Failed to send verification email',
      details: error.message
    }, { status: 500 });
  }
} 