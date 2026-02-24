# Butterfly

Luxury pink handbag full-stack web app with:
- Frontend landing page + protected app page + dedicated video page
- Backend API with register/login (JWT auth)
- Drag-and-drop bag board (move one bag next to another)
- Famous luxury boutique locations with map links

## Tech Stack
- Node.js + Express
- JSON file storage
- Vanilla HTML/CSS/JS frontend

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Start server:
```bash
npm start
```

4. Open:
- Home: http://localhost:4000
- Video page: http://localhost:4000/video.html
- Protected app: http://localhost:4000/app.html

## API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token)
- `GET /api/products`
- `GET /api/shops`
- `GET /api/private/dashboard` (Bearer token)

## Publish To Your GitHub

If your repo is `butterfly` under `DIYA73`:

```bash
git init
git add .
git commit -m "Initial commit: Butterfly full-stack app"
git branch -M main
git remote add origin https://github.com/DIYA73/butterfly.git
git push -u origin main
```

If the remote already exists, run:
```bash
git remote set-url origin https://github.com/DIYA73/butterfly.git
```

## Customize Your Video

Replace the video source in `public/video.html` with your own `.mp4` campaign video for handbag runway content.
