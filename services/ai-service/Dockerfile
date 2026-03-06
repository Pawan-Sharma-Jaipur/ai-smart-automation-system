FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN mkdir -p /app/models

EXPOSE 3002

CMD ["node", "src/server.js"]
