FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json tsconfig.json ./
COPY packages/shared/ packages/shared/
COPY apps/backend/ apps/backend/

# Install dependencies using legacy-peer-deps for safety
RUN npm install --legacy-peer-deps

# Build Shared Package first
RUN npm run build -w packages/shared

# Generate Prisma Client
RUN npx prisma generate --schema=apps/backend/prisma/schema.prisma

# Build NestJS Backend
RUN npm run build -w apps/backend

# Production stage
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY --from=builder /usr/src/app/node_modules/ ./node_modules/
COPY --from=builder /usr/src/app/packages/shared/ ./packages/shared/
COPY --from=builder /usr/src/app/apps/backend/dist/ ./apps/backend/dist/
COPY --from=builder /usr/src/app/apps/backend/prisma/ ./apps/backend/prisma/
COPY --from=builder /usr/src/app/apps/backend/package.json ./apps/backend/package.json

EXPOSE 4000

CMD ["npm", "run", "start:prod", "-w", "apps/backend"]
