FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
COPY apps/http-api ./apps/http-api
COPY packages ./packages
RUN npm ci
WORKDIR /app/apps/http-api
CMD ["npm", "start"]