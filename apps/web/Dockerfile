# Build the Next.js app in the monorepo. Build context = repo root.
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable

FROM base AS build
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @goodfood/db db:generate
RUN pnpm --filter @goodfood/web build

FROM base AS run
WORKDIR /repo
COPY --from=build /repo ./
EXPOSE 3000
CMD ["pnpm", "--filter", "@goodfood/web", "start"]
