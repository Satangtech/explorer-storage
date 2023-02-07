FROM node:18-alpine3.14

RUN addgroup -S storage && adduser -S storage -G storage
USER storage

ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin

WORKDIR /service-storage
RUN chown -R storage:storage /service-storage

COPY --chown=storage:storage ./package*.json ./
RUN npm i

COPY --chown=storage:storage . .
RUN mkdir -p /service-storage/contracts
RUN chown -R storage:storage /service-storage/contracts
RUN npm run build

EXPOSE 5555
CMD [ "npm", "run", "start" ]
