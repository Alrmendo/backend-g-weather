# G-Weather Email Backend

Simple Node.js backend service for handling email subscriptions using Nodemailer and Gmail App Password.

## Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Gmail App Password

1. Enable 2-factor authentication on your Gmail account
2. Go to Google Account settings > Security > 2-Step Verification
3. Generate an App Password:
   - Select "Mail" as the app
   - Select "Other" as the device and enter "G-Weather"
   - Copy the 16-character password

### 3. Environment Configuration

Copy `env.example` to `.env` and fill in your credentials:

```bash
cp env.example .env
```

Edit `.env`:
```env
# Gmail Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password

# Server Configuration
PORT=3000
NODE_ENV=development

# App Configuration
APP_NAME=G-Weather
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:8080

# Email Templates
FROM_EMAIL=your-email@gmail.com
FROM_NAME=G-Weather Team
```

### 4. Run the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### POST `/api/send-subscription-email`
Send subscription or unsubscription confirmation email.

**Body:**
```json
{
  "email": "user@example.com",
  "type": "subscription" // or "unsubscription"
}
```

**Response:**
```json
{
  "message": "subscription email sent successfully",
  "confirmationCode": "uuid-here"
}
```

### POST `/api/confirm-subscription`
Confirm subscription or unsubscription using the code from email.

**Body:**
```json
{
  "code": "uuid-from-email-link",
  "type": "subscription" // or "unsubscription"
}
```

**Response:**
```json
{
  "message": "subscription confirmed successfully",
  "email": "user@example.com",
  "type": "subscription"
}
```

### GET `/health`
Health check endpoint.

### GET `/api/confirmation-codes` (Development only)
View all active confirmation codes for debugging.

## Features

- ✅ Gmail App Password authentication
- ✅ Beautiful HTML email templates
- ✅ Confirmation code generation and validation
- ✅ Code expiration (24 hours)
- ✅ Automatic cleanup of expired codes
- ✅ CORS support for Flutter web app
- ✅ Error handling and logging
- ✅ Development debugging endpoints

## Security Notes

- Confirmation codes expire after 24 hours
- Each code can only be used once
- Expired codes are automatically cleaned up
- Gmail App Password is more secure than regular password
- CORS is configured to allow frontend requests

## Testing

You can test the email service using curl:

```bash
# Send subscription email
curl -X POST http://localhost:3000/api/send-subscription-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","type":"subscription"}'

# Confirm subscription (use the code from the response)
curl -X POST http://localhost:3000/api/confirm-subscription \
  -H "Content-Type: application/json" \
  -d '{"code":"uuid-here","type":"subscription"}'
```

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in your environment
2. Use a process manager like PM2
3. Set up proper logging
4. Use a database instead of in-memory storage for confirmation codes
5. Set up proper domain and SSL for email links
6. Configure firewall to only allow necessary ports
