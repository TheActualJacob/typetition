# Typetition MVP

Typing training and 5-player competition platform.

## Stack

- Backend: Node.js, Express, WebSocket (`ws`)
- Frontend: React, Tailwind CSS, WebSocket API, Framer Motion

## Features

- Name-based join flow
- Training mode with 10 lessons
- Pass condition: finish in time with zero errors
- Competition mode with one global room (max 5 users)
- Same random race text for all 5 players
- Winner is fastest zero-error finisher (backspace corrections allowed)
- Always-visible virtual keyboard with keypress highlight animation
- Plain progress bar for typing completion

## Run

1. Install dependencies:

```bash
npm install --prefix backend
npm install --prefix frontend
```

2. Start backend:

```bash
npm run dev --prefix backend
```

3. Start frontend (new terminal):

```bash
npm run dev --prefix frontend
```

4. Open [http://localhost:5173](http://localhost:5173)

## API/Events Overview

- Client -> Server:
  - `join`
  - `start_training`
  - `training_input`
  - `join_competition`
  - `competition_input`
  - `leave_competition`
- Server -> Client:
  - `joined`
  - `online_count`
  - `training_state`
  - `lesson_result`
  - `competition_state`
  - `competition_full`
  - `competition_result`
# typetition
