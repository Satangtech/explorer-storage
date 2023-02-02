FROM node:18-alpine3.14
WORKDIR /service-storage

COPY ./package*.json ./
RUN npm i

COPY ./service-storage ./
RUN mkdir -p /service-storage/contracts
RUN npm run build

EXPOSE 5555
CMD [ "npm", "run", "start" ]
