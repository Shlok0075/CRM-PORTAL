FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm run prisma:generate || true
RUN pnpm run build

FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install -g pnpm && pnpm install --production
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "dist/main.js"]
