FROM node:18-alpine

WORKDIR /app

COPY package.json .

RUN npm install

RUN npm i -g serve

COPY . .

RUN npm run build

EXPOSE 1337

CMD [ "serve", "-s", "dist", "-p", "1337" ]
