FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl python3 make g++

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn prisma generate
RUN yarn build

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package.json yarn.lock ./

EXPOSE 3000

CMD ["node", "dist/main.js"]