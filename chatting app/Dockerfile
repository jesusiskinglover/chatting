FROM node:22-alpine

WORKDIR /app
COPY package.json ./
COPY server.js ./server.js
COPY public ./public
COPY data ./data

ENV NODE_ENV=production
EXPOSE 5173

CMD ["node", "server.js"]
