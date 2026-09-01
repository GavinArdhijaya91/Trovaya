FROM node:22-alpine AS build
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/contracts packages/contracts
COPY packages/protocol-sdk packages/protocol-sdk
COPY services/event-indexer services/event-indexer
RUN pnpm install --frozen-lockfile --filter @trovaya/event-indexer... --ignore-scripts
RUN pnpm --filter @trovaya/contracts build && pnpm --filter @trovaya/protocol-sdk build && pnpm --filter @trovaya/event-indexer build

FROM node:22-alpine
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /repo
COPY --from=build /repo ./
USER node
CMD ["pnpm", "--filter", "@trovaya/event-indexer", "start"]
