FROM node:18-alpine3.14 as builder

WORKDIR /service-storage

COPY ./package*.json ./
RUN npm i

COPY . .
RUN mkdir -p /service-storage/contracts
RUN npm run build

FROM node:18-alpine3.14

RUN addgroup -S storage && adduser -S storage -G storage
USER storage

WORKDIR /service-storage

COPY --chown=storage:storage --from=builder /service-storage .

EXPOSE 5555
CMD [ "npm", "run", "start" ]
