#!/bin/bash
git pull
cd frontend
npm run build

cd ../backend
./node_modules/.bin/pm2 restart ecosystem.config.js
./node_modules/.bin/pm2 status
