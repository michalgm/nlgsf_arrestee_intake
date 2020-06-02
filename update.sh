#!/bin/bash

cd ${pwd}/frontend
npm run build

cd ../backend
./node_modules/.bin/pm2 restart processes.js
./node_modules/.bin/pm2 status