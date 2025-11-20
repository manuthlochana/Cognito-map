# Cognito-Map Walkthrough

## Prerequisites
- **Docker**: Ensure Docker Desktop is installed and running.
- **Node.js**: You have Node.js installed (v18+).
- **OpenAI API Key**: You need a valid API key.

## Setup Instructions

1.  **Configure Environment Variables**
    - Open `.env` in the `cognito-map` directory.
    - Ensure `GEMINI_API_KEY` is set (it should be pre-filled).

2.  **Start the Database**
    - Open a terminal in `cognito-map`.
    - Run: `docker-compose up -d`
    - This starts PostgreSQL with the `pgvector` extension.

3.  **Initialize Database Schema**
    - Run: `npx prisma db push`
    - This creates the tables in your local database.

4.  **Start the Application**
    - Run: `npm run dev`
    - Open [http://localhost:3000](http://localhost:3000).

## Usage Guide

### 1. Ingesting Memories
- In the chat box, ensure "Ingest" mode is selected.
- Type a memory, e.g., "I met a new friend named Alice who is a Chess Grandmaster."
- Click Send.
- **Result**: You should see nodes for "Alice" and "Chess Grandmaster" appear on the graph.

### 2. Querying Your Brain
- Switch to "Query" mode.
- Ask: "Who plays chess?"
- Click Send.
- **Result**: The system will answer "Alice" and the "Alice" node on the graph will highlight and zoom in.

## Troubleshooting
- **Database Connection Error**: Ensure Docker is running and the `DATABASE_URL` in `.env` matches the docker-compose settings.
- **Gemini Error**: Check your API key and quota.
