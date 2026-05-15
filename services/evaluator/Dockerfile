FROM node:22-bookworm-slim

WORKDIR /app

ENV OPENAI_API_KEY=""

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

CMD ["npm", "start"]
