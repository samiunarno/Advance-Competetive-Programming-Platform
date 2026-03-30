# How to Host Locally and Share via Ngrok

This guide explains how to run the application on your local machine and share it with others using `ngrok`.

## Prerequisites

1.  **Node.js**: Install Node.js (version 18 or higher) from [nodejs.org](https://nodejs.org/).
2.  **MongoDB**: You need a MongoDB database.
    *   **Option A (Cloud)**: Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas/database).
    *   **Option B (Local)**: Install MongoDB Community Edition locally.
3.  **Ngrok**: Sign up for a free account at [ngrok.com](https://ngrok.com/) and install the ngrok CLI.

## Step 1: Setup the Project Locally

1.  **Download/Clone the Code**: Download the project files to your computer.
2.  **Install Dependencies**: Open your terminal (Command Prompt, PowerShell, or Terminal) in the project folder and run:
    ```bash
    npm install
    ```
3.  **Configure Environment Variables**:
    *   Create a file named `.env` in the root folder.
    *   Add the following content (replace values with your own):
        ```env
        MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/my-database
        JWT_SECRET=your_super_secret_key
        PORT=3000
        ```

## Step 2: Run the Application

1.  Start the development server:
    ```bash
    npm run dev
    ```
2.  Open your browser and go to `http://localhost:3000`. You should see the application running.

## Step 3: Share with Ngrok

1.  **Install Ngrok**: If you haven't already, download and install ngrok.
2.  **Authenticate**: Run the command provided in your ngrok dashboard to connect your account:
    ```bash
    ngrok config add-authtoken <your_auth_token>
    ```
3.  **Expose the Port**: Run the following command to share your local port 3000 to the internet:
    ```bash
    ngrok http 3000
    ```
4.  **Get the URL**: Ngrok will provide a "Forwarding" URL (e.g., `https://a1b2-c3d4.ngrok-free.app`).
5.  **Share**: Copy that URL and send it to your friends. They can now access your local application from their devices!

## Troubleshooting

*   **"Invalid Host Header"**: If you see this error, it's usually fine with the current setup.
*   **Database Connection Error**: Ensure your IP address is whitelisted in MongoDB Atlas (Network Access -> Add IP Address -> Allow Access from Anywhere).
