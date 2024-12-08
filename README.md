# Pitch Perfect
Quick and dirty AI chatbot built on OpenAI and WellSaid to challenge the user on their pitch.


## Setup
First open `/backend/.env` and add the following variables:
```
OPENAI_API_KEY=<your-openai-api-key>
WELLSAID_API_KEY=<your-wellsaid-api-key>
PORT=<port-number>
```

```bash
cd frontend && yarn && yarn dev
```
... and,
```bash
cd backend && yarn && yarn dev
```

## Usage
Navigate to the frontend URL, paste a link to the public twitter/X profile you want to challenge, and start chatting!

## TODO
- Add login (use Google / MS)
- Add payment/subscription
- Add a way to save transcripts
- Add more challenges (sales pitch, VC pitch, resume pitch)
- Add different voices
- Add a scoring system based on performance