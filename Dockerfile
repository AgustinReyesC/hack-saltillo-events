# ---------- Etapa de build ----------
FROM public.ecr.aws/lambda/nodejs:22 AS build
WORKDIR /var/task

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------- Etapa de runtime ----------
FROM public.ecr.aws/lambda/nodejs:22
WORKDIR /var/task

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /var/task/dist ./dist
COPY src/schemas ./schemas

CMD ["dist/handler.handler"]
