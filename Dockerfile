FROM node:20-alpine

RUN apk add --no-cache tzdata

ENV TZ=Asia/Ho_Chi_Minh

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate


EXPOSE 3000

CMD ["npm", "run", "start:dev"]
