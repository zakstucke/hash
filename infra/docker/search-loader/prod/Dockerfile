FROM node:22.12-alpine AS builder

WORKDIR /app

# Ensure that the node module layer can be cached
COPY package.json .
COPY yarn.lock .
RUN yarn install --immutable --production --ignore-scripts

# Also ensure that api node modules can be cached
COPY apps/hash-api/package.json apps/hash-api/
COPY apps/hash-search-realtime/package.json apps/hash-search-realtime/
COPY libs/@local/hash-backend-utils/package.json libs/@local/hash-backend-utils/
COPY libs/@local/hash-isomorphic-utils/package.json libs/@local/hash-isomorphic-utils/
COPY libs/@local/tsconfig/package.json libs/@local/tsconfig/
RUN yarn workspace @apps/hash-search-loader install --immutable --ignore-scripts

COPY apps/hash-api/codegen.config.ts apps/hash-api/codegen.config.ts
COPY apps/hash-api/src/collab/graphql/queries apps/hash-api/src/collab/graphql/queries
COPY apps/hash-api/src/graphql/type-defs apps/hash-api/src/graphql/type-defs
COPY libs/@local/hash-isomorphic-utils libs/@local/hash-isomorphic-utils

RUN yarn workspace @apps/hash-api codegen

COPY apps/hash-api apps/hash-api
COPY apps/hash-search-realtime apps/hash-search-realtime
COPY libs/@local/hash-backend-utils libs/@local/hash-backend-utils
COPY libs/@local/hash-isomorphic-utils libs/@local/hash-isomorphic-utils
COPY libs/@local/tsconfig libs/@local/tsconfig


#########################################################################################

FROM node:22.12-alpine

# Run as a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder --chown=appgroup:appuser /app /app

WORKDIR /app

USER appuser
ENV NODE_ENV production

CMD ["yarn", "workspace","@apps/hash-search-loader", "start"]
