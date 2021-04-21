FROM node:12-alpine as builder

WORKDIR /usr/src/app

COPY . .

RUN HUSKY_SKIP_INSTALL=true npm install

RUN npm run build

FROM node:12-alpine

WORKDIR /usr/app

COPY --from=builder /usr/src/app/dist .
COPY --from=builder /usr/src/app/package.json .
COPY --from=builder /usr/src/app/package-lock.json .

RUN npm ci --only=production --remove-dev
RUN ls

CMD ["node", "src/index.js"]