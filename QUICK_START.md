# Quick Start Guide

Get your frontend running in 3 minutes!

## Prerequisites

Make sure you have installed:
- Node.js (v14 or higher) - [Download here](https://nodejs.org/)
- A code editor (VS Code recommended)

## Setup Steps

### 1. Extract the Project

Unzip `pothole-detection-frontend` to your desired location.

### 2. Open in VS Code

```bash
cd pothole-detection-frontend
code .
```

Or just open VS Code and select the folder.

### 3. Install Dependencies

Open the integrated terminal in VS Code (`` Ctrl+` `` or `View → Terminal`) and run:

```bash
npm install
```

This will install all required packages (React, Tailwind CSS, etc.). It takes about 1-2 minutes.

### 4. Start Development Server

```bash
npm start
```

The app will automatically open in your browser at `http://localhost:3000`

If it doesn't open automatically, manually go to: **http://localhost:3000**

### 5. Test the App

1. Click on "Detection" in the navigation
2. Upload any road image (you can find test images online by searching "pothole road")
3. Click "Run Detection"
4. See mock results with bounding boxes!

## What You're Seeing

Currently, the app uses **mock/dummy data**. The detections you see are hardcoded for demonstration purposes.

## Next Steps

### For Development (Now):

1. **Customize the UI**: Edit components in `src/components/`
2. **Change colors**: Edit `tailwind.config.js`
3. **Add features**: Create new components or pages
4. **Test with different images**: Upload various road images

### For Integration (Later):

When your backend teammate has the API ready:

1. Read `INTEGRATION_GUIDE.md` (detailed instructions)
2. Update `src/services/detectionService.js` with the real API endpoint
3. Test with actual YOLOv12 detections!

## File Structure

```
pothole-detection-frontend/
├── src/
│   ├── components/          ← Reusable UI components
│   ├── pages/              ← Home and Detection pages
│   ├── services/           ← API service (UPDATE THIS for backend)
│   ├── utils/              ← Helper functions
│   ├── App.js              ← Main app
│   └── index.css           ← Styles
├── public/
├── package.json
└── README.md               ← Full documentation
```

## Push to GitHub

### First Time Setup:

```bash
git init
git add .
git commit -m "Initial frontend commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### After Making Changes:

```bash
git add .
git commit -m "Describe your changes"
git push
```

## Common Commands

```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests (if any)
```

## Troubleshooting

**Port 3000 already in use?**
```
Kill the process or the app will suggest using port 3001
```

**npm command not found?**
```
Install Node.js from nodejs.org
```

**Dependencies error?**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Changes not showing?**
```
Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
```

## Development Tips

1. **Hot Reload**: The app automatically reloads when you save files
2. **Browser Console**: Press F12 to see console logs and errors
3. **React DevTools**: Install the React DevTools browser extension
4. **Tailwind Classes**: Use the [Tailwind docs](https://tailwindcss.com/docs) for styling

## Ready to Integrate Backend?

See **INTEGRATION_GUIDE.md** for detailed instructions on connecting to your team's Python backend API.

---

**Need help?** Check README.md for comprehensive documentation!
