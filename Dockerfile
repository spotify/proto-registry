FROM node:10.11

WORKDIR /home/node/app
COPY config-overrides.js package.json tsconfig.json tslint.json yarn.lock /home/node/app/
RUN yarn
COPY public/ /home/node/app/public/
COPY src/ /home/node/app/src/
COPY build-proto-registry /home/node/app/
ENTRYPOINT ["/home/node/app/build-proto-registry"]
