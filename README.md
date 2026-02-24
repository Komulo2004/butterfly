# Butterfly

Luxury pink handbag web experience built with a modern full-stack setup.

## Overview
Butterfly is a high-energy digital luxury app featuring:
- Secure user authentication (register/login)
- Interactive bag styling board with drag-and-drop
- Video showcase page
- Signature pink collection powered by backend API
- Global boutique location discovery

## Tech Stack
- Node.js
- Express.js
- Vanilla HTML, CSS, JavaScript
- JWT authentication
- JSON-based data storage

## Project Structure
.
|-- server.js
|-- package.json
|-- data/
|   |-- products.json
|   |-- shops.json
|   `-- users.json
`-- public/
    |-- index.html
    |-- app.html
    |-- video.html
    |-- css/
    |-- js/
    `-- media/

## Run Locally
```bash
npm install
cp .env.example .env
npm start
```

App runs at:
- Home: http://localhost:4000
- App: http://localhost:4000/app.html
- Video: http://localhost:4000/video.html

## API Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/products`
- `GET /api/shops`
- `GET /api/private/dashboard`

## GitHub Publish
```bash
git add .
git commit -m "Update Butterfly"
git push -u origin main
```

## Customize Media
Replace media files in `public/media` and update `data/products.json` image paths if needed.
