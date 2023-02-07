FROM node:18-alpine3.14

USER node
WORKDIR /home/node/service-storage
RUN chown -R node:node /home/node/service-storage

COPY --chown=node:node ./package*.json ./
RUN npm i

COPY --chown=node:node . .
RUN mkdir -p /home/node/service-storage/contracts
RUN npm run build

EXPOSE 5555
CMD [ "npm", "run", "start" ]
