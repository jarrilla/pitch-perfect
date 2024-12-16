# Pitch Perfect

AI chatbot to help you practice your pitch!

Build with OpenAI Realtime API.

## Setup

First open `/backend/.env` and add the following variables:

```
GOOGLE_CLIENT_ID=<google oauth2.0 client id>
GOOGLE_CLIENT_SECRET=<google oauth2.0 client secret>
SESSION_SECRET=<cookie secret>
FRONTEND_URL=<frontend url>
MONGODB_URI=<mongodb uri for user profile>
OPENAI_API_KEY=<your openai api key>
PORT=<port number (optional)>
```

Next, open `/frontend/.env` and add the following variables:

```
VITE_API_BASE_URL=<backend urL>
```

```bash
cd frontend && yarn && yarn dev
```

... and,

```bash
cd backend && yarn && yarn dev
```

## Usage

Navigate to the frontend URL, select the interaction profile, and start chatting!
