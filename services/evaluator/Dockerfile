FROM node:22-bookworm-slim

WORKDIR /app
ENV ENVIRONMENT=local
ENV EVALUATOR_PORT=3000
EXPOSE 3000

COPY package.json package-lock.json ./
RUN npm ci

COPY configuration ./configuration
COPY source ./source
RUN npm run build

CMD ["node", "build/main.js"]
