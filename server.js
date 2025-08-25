const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for confirmation codes (in production, use Redis or database)
const confirmationCodes = new Map();

// Create Nodemailer transporter with Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Nodemailer configuration error:', error);
  } else {
    console.log('Nodemailer is ready to send emails');
  }
});

// Email templates
const getEmailTemplate = (type, confirmationUrl, email) => {
  const templates = {
    subscription: {
      subject: 'Confirm your G-Weather subscription',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirm Your G-Weather Subscription</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌤️ G-Weather</h1>
            <p>Welcome to personalized weather forecasts!</p>
          </div>
          <div class="content">
            <h2>Confirm Your Subscription</h2>
            <p>Hi there!</p>
            <p>Thank you for subscribing to G-Weather daily forecasts. To complete your subscription, please click the button below:</p>
            <p style="text-align: center;">
              <a href="${confirmationUrl}" class="button">Confirm Subscription</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 5px;">${confirmationUrl}</p>
            <p><strong>What happens next?</strong></p>
            <ul>
              <li>You'll receive daily weather forecasts for your most recent searched location</li>
              <li>Emails are sent every morning with detailed weather information</li>
              <li>You can unsubscribe at any time</li>
            </ul>
            <p>If you didn't request this subscription, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 G-Weather. All rights reserved.</p>
            <p>This email was sent to ${email}</p>
          </div>
        </body>
        </html>
      `
    },
    unsubscription: {
      subject: 'Confirm your G-Weather unsubscription',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirm Your G-Weather Unsubscription</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌤️ G-Weather</h1>
            <p>We're sorry to see you go!</p>
          </div>
          <div class="content">
            <h2>Confirm Your Unsubscription</h2>
            <p>Hi there!</p>
            <p>We received a request to unsubscribe your email from G-Weather daily forecasts. To confirm this action, please click the button below:</p>
            <p style="text-align: center;">
              <a href="${confirmationUrl}" class="button">Confirm Unsubscription</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 5px;">${confirmationUrl}</p>
            <p>After confirmation, you will no longer receive weather forecast emails from us.</p>
            <p>If you didn't request this unsubscription, you can safely ignore this email and your subscription will remain active.</p>
          </div>
          <div class="footer">
            <p>© 2024 G-Weather. All rights reserved.</p>
            <p>This email was sent to ${email}</p>
          </div>
        </body>
        </html>
      `
    }
  };

  return templates[type] || templates.subscription;
};

// Helper function to auto-detect frontend URL from request
const getFrontendUrl = (req) => {
  // Try to get from Origin header first (most reliable for CORS requests)
  if (req.headers.origin) {
    console.log(`Detected frontend URL from Origin header: ${req.headers.origin}`);
    return req.headers.origin;
  }
  
  // Try to get from Referer header as fallback
  if (req.headers.referer) {
    try {
      const url = new URL(req.headers.referer);
      const detectedUrl = `${url.protocol}//${url.host}`;
      console.log(`Detected frontend URL from Referer header: ${detectedUrl}`);
      return detectedUrl;
    } catch (e) {
      console.warn('Failed to parse Referer header:', req.headers.referer);
    }
  }
  
  // Fallback to environment config
  const fallbackUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
  console.log(`Using fallback frontend URL: ${fallbackUrl}`);
  return fallbackUrl;
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'G-Weather Email Service is running' });
});

// Send subscription/unsubscription email
app.post('/api/send-subscription-email', async (req, res) => {
  try {
    const { email, type } = req.body;

    if (!email || !type) {
      return res.status(400).json({ error: 'Email and type are required' });
    }

    if (!['subscription', 'unsubscription'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be subscription or unsubscription' });
    }

    // Generate confirmation code
    const confirmationCode = uuidv4();
    
    // Auto-detect frontend URL from request headers
    const frontendUrl = getFrontendUrl(req);
    const confirmationUrl = `${frontendUrl}/confirm?code=${confirmationCode}&type=${type}`;

    // Store confirmation code with email and type
    confirmationCodes.set(confirmationCode, {
      email,
      type,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    // Get email template
    const template = getEmailTemplate(type, confirmationUrl, email);

    // Send email
    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: email,
      subject: template.subject,
      html: template.html,
    };

    await transporter.sendMail(mailOptions);

    console.log(`${type} email sent to ${email} with code ${confirmationCode}`);
    res.json({ 
      message: `${type} email sent successfully`,
      confirmationCode: confirmationCode // For testing purposes only
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Confirm subscription/unsubscription
app.post('/api/confirm-subscription', (req, res) => {
  try {
    const { code, type } = req.body;

    if (!code || !type) {
      return res.status(400).json({ error: 'Code and type are required' });
    }

    // Check if confirmation code exists
    const confirmation = confirmationCodes.get(code);
    if (!confirmation) {
      return res.status(404).json({ error: 'Invalid or expired confirmation code' });
    }

    // Check if code is expired
    if (new Date() > confirmation.expiresAt) {
      confirmationCodes.delete(code);
      return res.status(400).json({ error: 'Confirmation code has expired' });
    }

    // Check if type matches
    if (confirmation.type !== type) {
      return res.status(400).json({ error: 'Type mismatch' });
    }

    // Remove confirmation code (can only be used once)
    confirmationCodes.delete(code);

    console.log(`${type} confirmed for ${confirmation.email}`);
    res.json({ 
      message: `${type} confirmed successfully`,
      email: confirmation.email,
      type: confirmation.type
    });

  } catch (error) {
    console.error('Error confirming subscription:', error);
    res.status(500).json({ error: 'Failed to confirm subscription' });
  }
});

// Get confirmation status (for debugging)
app.get('/api/confirmation-codes', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Not available in production' });
  }
  
  const codes = Array.from(confirmationCodes.entries()).map(([code, data]) => ({
    code,
    email: data.email,
    type: data.type,
    createdAt: data.createdAt,
    expiresAt: data.expiresAt,
    isExpired: new Date() > data.expiresAt
  }));
  
  res.json({ codes });
});

// Debug endpoint to test frontend URL detection
app.get('/api/debug/frontend-url', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Not available in production' });
  }
  
  const detectedUrl = getFrontendUrl(req);
  res.json({
    detectedFrontendUrl: detectedUrl,
    headers: {
      origin: req.headers.origin,
      referer: req.headers.referer,
      'user-agent': req.headers['user-agent']
    },
    fallbackUrl: process.env.FRONTEND_URL || 'http://localhost:8080'
  });
});

// Clean up expired codes periodically
setInterval(() => {
  const now = new Date();
  for (const [code, data] of confirmationCodes.entries()) {
    if (now > data.expiresAt) {
      confirmationCodes.delete(code);
      console.log(`Cleaned up expired confirmation code for ${data.email}`);
    }
  }
}, 60 * 60 * 1000); // Run every hour

// Start server
app.listen(PORT, () => {
  console.log(`G-Weather Email Service running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Gmail User: ${process.env.GMAIL_USER || 'Not configured'}`);
});

module.exports = app;
