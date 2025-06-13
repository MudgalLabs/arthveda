FROM node:23-alpine

WORKDIR /app

COPY ./web/package.json .

RUN npm install

RUN npm i -g serve

COPY ./web .

COPY ./.env ./.env

RUN npm run build

EXPOSE 6969

CMD [ "serve", "-s", "dist", "-p", "6969" ]
