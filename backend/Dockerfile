FROM node:21

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/
COPY . .

RUN npm install

RUN npm run build

EXPOSE 3000



CMD [ "npm", "run", "start:dev" ]