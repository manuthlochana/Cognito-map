# Vercel & Supabase Deployment Guide

This project is configured for a seamless deployment on Vercel (Frontend/API) and Supabase (Database).

## 1. Setup Database (Supabase)
1.  Go to [Supabase](https://supabase.com/) and create a new project.
2.  Once created, go to **Project Settings** > **Database**.
3.  Under **Connection string**, select **URI** and copy the connection string.
    *   *Important:* Replace `[YOUR-PASSWORD]` with the password you created.
    *   Example: `postgresql://postgres.xxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres`

## 2. Deploy to Vercel
1.  Go to [Vercel](https://vercel.com/) and click **"Add New..."** > **"Project"**.
2.  Import the `Cognito-map` repository.
3.  **Configure Environment Variables** (Expand the "Environment Variables" section):
    *   `DATABASE_URL`: Paste the Supabase connection string you copied.
    *   `GEMINI_API_KEY`: Paste your Google Gemini API Key.
    *   `NEXTAUTH_SECRET`: Enter a random string (e.g., `mysecret123`).
    *   `NEXTAUTH_URL`: You can leave this blank for now, Vercel sets it automatically.
4.  Click **"Deploy"**.

## 3. Automatic Setup
*   **Database Sync:** The build process is configured (`prisma db push`) to **automatically** create all necessary tables in your Supabase database during the deployment. You do not need to run any commands.
*   **Vector Support:** The application uses `pgvector`. Supabase supports this out of the box.

## 4. Success
Once the deployment finishes, your "Second Brain" application will be live and fully functional.
