#!/bin/bash

cd $(pwd)/frontend
npm run build

cd ../backend
./node_modules/.bin/pm2 restart ecosystem.config.js
./node_modules/.bin/pm2 status
