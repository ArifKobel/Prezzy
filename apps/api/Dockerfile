FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app
ENV CI=true
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter api build
RUN pnpm --filter api --prod deploy --legacy /prod/api

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /prod/api .
EXPOSE 3001
CMD ["sh", "-c", "./node_modules/.bin/drizzle-kit push && node dist/main"]
