# Browser Chatting App

A small live chat app you can run in a browser. It supports rooms, display names, live message updates, and local message history.

## Run On Your Computer

```bash
npm start
```

Then open:

```text
http://localhost:5173
```

## Put It Online With Render

1. Create a GitHub repository and upload this folder.
2. Go to Render and create a new **Web Service** from that repository.
3. Use these settings:
   - Runtime: `Node`
   - Build command: leave empty
   - Start command: `npm start`
   - Health check path: `/api/health`
4. Deploy it.

Render will give you a public URL you can share.

## Put It Online With Railway

1. Create a GitHub repository and upload this folder.
2. Create a new Railway project from the repository.
3. Railway should detect the Node app automatically.
4. If it asks for a start command, use:

```bash
npm start
```

## Notes

Messages are saved to `data/messages.json`. On many free hosting plans, this storage can reset when the app redeploys or restarts. For a permanent public chat app, the next upgrade would be a real online database.
