FROM --platform=linux/amd64 node:16-alpine

RUN apk add --no-cache dumb-init

WORKDIR /usr/app/

COPY --chown=node:node . .

ENV NODE_ENV production
ENV HOST=0.0.0.0
ENV PORT=5608

RUN yarn --frozen-lockfile --no-bin-links --ignore-engines

EXPOSE 5608

USER node

CMD [ "dumb-init", "node", "server.js" ]
