FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter web build

FROM node:22-alpine AS runtime
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production CI=true
COPY --from=build /app .
RUN pnpm prune --prod
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["node", "server.mjs"]
