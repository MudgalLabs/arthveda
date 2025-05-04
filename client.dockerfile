FROM node:23-alpine

WORKDIR /app

COPY ./client/package.json .

RUN npm install

RUN npm i -g serve

COPY ./client .

COPY ./.env ./.env

RUN npm run build

EXPOSE 6969

CMD [ "serve", "-s", "dist", "-p", "6969" ]
