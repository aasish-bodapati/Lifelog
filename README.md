# Lifelog

A fitness and nutrition tracking app designed for busy professionals who need efficient tracking without complexity.

## Tech Stack

- **Frontend**: React Native
- **Backend**: FastAPI
- **Database**: SQLite
- **Target Audience**: Busy professionals

## Project Structure

```
Lifelog/
├── frontend/          # React Native app
├── backend/           # FastAPI server
├── shared/            # Shared types and utilities
└── docs/              # Documentation
```

## Features (MVP)

- Workout logging (exercises, sets, reps, weight)
- Nutrition tracking (meals, macros)
- Body stats tracking (weight, measurements)
- Progress dashboard
- Offline-first with sync
- Simple, fast UI for busy professionals

## Getting Started

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npx react-native run-android  # or run-ios
```

## Development Philosophy

- **Speed over complexity**: 1-tap logging, auto-fill defaults
- **Offline-first**: Local SQLite with API sync
- **Minimal friction**: Clean UI, simple navigation
- **Professional focus**: Built for busy schedules
