FROM node:20-alpine

WORKDIR /app

RUN apk update && apk add --no-cache openssl

RUN npm install yarn
RUN rm package-lock.json

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

EXPOSE 3000

RUN yarn prisma generate

RUN yarn build

CMD [ "yarn", "start" ]