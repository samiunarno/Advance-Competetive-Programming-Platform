# Deployment Guide (Render & Ngrok)

## Option 1: Render.com (Recommended)
1. Push code to GitHub.
2. Create "Web Service" on Render.
3. Build Command: `npm run build`
4. Start Command: `npm start`
5. Add Environment Variables: `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`.

## Option 2: Ngrok (For Local Hosting)
1. Run app locally: `npm install`, `npm run build`, `npm start`.
2. Install Ngrok on your PC.
3. Run: `ngrok http 3000`.
4. Copy the `https://...` URL provided by Ngrok. This is your live site.
