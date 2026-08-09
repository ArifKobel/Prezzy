FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter api build

FROM node:22-alpine AS runtime
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production CI=true
COPY --from=build /app .
RUN pnpm prune --prod
EXPOSE 3001
CMD ["sh", "-c", "pnpm --dir apps/api db:push && node apps/api/dist/main"]
