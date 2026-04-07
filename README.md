# ESL Materials Hub

A web app for generating customized ESL teaching materials using Claude AI.

---

## DEPLOYMENT GUIDE (Step by step)

### Step 1: Create a GitHub account (if you don't have one)

1. Go to **github.com** and sign up (free)
2. Verify your email

### Step 2: Create a new repository

1. Once logged into GitHub, click the **+** button (top right) → **New repository**
2. Name it `esl-materials-hub`
3. Leave it as **Public** (Vercel free tier needs this, or you can use Private with Vercel Pro)
4. Check **"Add a README file"**
5. Click **Create repository**

### Step 3: Upload the app code

1. On your new repository page, click **"Add file"** → **"Upload files"**
2. Drag the entire contents of the `esl-hub` folder into the upload area:
   - `package.json`
   - `next.config.js`
   - `app/` folder (with all files inside)
   - `lib/` folder (with all files inside)
3. Click **"Commit changes"**

**Important:** The file structure should look like this in your repo:
```
esl-materials-hub/
  package.json
  next.config.js
  app/
    layout.js
    page.js
    globals.css
    api/
      generate/
        route.js
  lib/
    constants.js
    prompt.js
```

### Step 4: Connect to Vercel

1. Go to **vercel.com** and click **"Sign Up"**
2. Choose **"Continue with GitHub"** and authorize Vercel
3. Once logged in, click **"Add New..."** → **"Project"**
4. You should see your `esl-materials-hub` repo listed. Click **"Import"**
5. Under **Framework Preset**, make sure it says **Next.js**
6. Expand **"Environment Variables"** and add:
   - **Key:** `ANTHROPIC_API_KEY`
   - **Value:** paste your API key (the one starting with `sk-ant-...`)
7. Click **"Deploy"**

### Step 5: Wait ~60 seconds

Vercel will build and deploy your app. When it says **"Congratulations!"**, click **"Go to Dashboard"** and then **"Visit"** to open your live app.

Your app will be at something like: `esl-materials-hub.vercel.app`

---

## HOW TO USE

1. **Add a student** — Click "+ Add student", fill in what you know. You can always come back and add more later.
2. **After a class** — Click "Materials" next to the student, paste your class notes, select what you want generated, click "Generate materials."
3. **Save/Print** — Click "Print / Save as PDF" to get a clean document.

---

## COSTS

- **Vercel hosting:** Free
- **Claude API:** ~$0.05–0.10 per generation (a few dollars per month for typical use)

---

## UPDATING THE APP

If you want changes to the app later:
1. Edit files on GitHub (or upload new versions)
2. Vercel automatically redeploys when you push changes

---

## DATA NOTE

Student profiles are stored in your browser's localStorage. This means:
- They persist between sessions on the same computer/browser
- They are NOT synced across devices
- Clearing browser data will erase them

For a future upgrade, we can add a database (Supabase, free tier) for cross-device access.
