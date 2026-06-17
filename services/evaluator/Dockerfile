FROM node:22-bookworm-slim

WORKDIR /app
ENV ENVIRONMENT=local
ENV EVALUATOR_PORT=3000
EXPOSE 3000

COPY setup/package.json setup/package-lock.json ./setup/
RUN npm --prefix setup ci \
    && ln -sfn setup/node_modules node_modules

COPY configuration ./configuration
COPY source ./source
RUN npm --prefix setup run build

CMD ["node", "build/main.js"]
