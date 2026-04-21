FROM node:22-alpine

WORKDIR /app

# Expo necesita git para algunas operaciones internas
RUN apk add --no-cache git

COPY package.json ./
RUN npm install

COPY . .

# Puerto de Metro bundler y Expo DevTools
EXPOSE 8081 19000 19001

# CI=1 desactiva el modo interactivo de Expo
ENV CI=1

CMD ["npx", "expo", "start"]
