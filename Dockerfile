# Production Dockerfile

ARG NODE_VERSION=22.11.0
ARG RELEASE=unknown
ARG VITE_API_BASE_URL=none
ARG NODE_OPTIONS="--max-old-space-size=1024"

FROM node:${NODE_VERSION}-slim AS base

WORKDIR /app
ARG NODE_OPTIONS
ARG RELEASE
ARG VITE_API_BASE_URL
ENV RELEASE=$RELEASE
ENV NODE_ENV=production
ENV NODE_OPTIONS=$NODE_OPTIONS
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY scripts /app/scripts
RUN chmod +x /app/scripts/execute.sh
RUN corepack enable && ./scripts/execute.sh docker-install

COPY package.json yarn.lock .yarnrc.yml nest-cli.json /app/
COPY resources/ /app/resources
COPY packages /app/packages

FROM base AS build

WORKDIR /app
ARG RELEASE
ARG NODE_OPTIONS
ARG VITE_API_BASE_URL
ENV RELEASE=$RELEASE
ENV NODE_ENV=production
ENV NODE_OPTIONS=$NODE_OPTIONS
ENV YARN_ENABLE_GLOBAL_CACHE=false
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# copy sources and dependencies
COPY . /app

# ensure script is executable (COPY may not preserve execute bit on Windows)
RUN chmod +x /app/scripts/execute.sh

# install all packages
RUN yarn install --immutable

# build the application
RUN ./scripts/execute.sh build

FROM base AS final

WORKDIR /app
ARG RELEASE
ARG NODE_OPTIONS
ARG VITE_API_BASE_URL
ENV RELEASE=$RELEASE
ENV NODE_ENV=production
ENV NODE_OPTIONS=$NODE_OPTIONS
ENV YARN_ENABLE_GLOBAL_CACHE=false
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# install only production dependencies
RUN yarn workspaces focus --production

# copy the built application
COPY --from=build /app/dist /app/dist
COPY --from=build /app/node_modules/.prisma /app/node_modules/.prisma
COPY .config /app/.config

EXPOSE 3000

# run the application
ENTRYPOINT ["./scripts/execute.sh","docker-start"]
