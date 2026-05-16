FROM node:22-bookworm-slim

WORKDIR /app
ENV ENVIRONMENT=local
ENV EVALUATOR_PORT=3000
EXPOSE 3000

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

CMD ["npm", "start"]
