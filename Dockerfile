# ---------- Etapa de build ----------
# Corre en la plataforma de la máquina que construye ($BUILDPLATFORM): en una Mac con Apple Silicon
# el npm ci no se emula. Las dependencias son JavaScript puro, así que node_modules y dist sirven
# igual en la imagen final de otra arquitectura.
FROM --platform=$BUILDPLATFORM public.ecr.aws/lambda/nodejs:22 AS build
WORKDIR /var/task

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev && npm cache clean --force

# ---------- Etapa de runtime ----------
# Solo copia archivos: no hay RUN que emular al construir para linux/amd64.
FROM public.ecr.aws/lambda/nodejs:22
WORKDIR /var/task

COPY package.json package-lock.json ./
COPY --from=build /var/task/node_modules ./node_modules
COPY --from=build /var/task/dist ./dist
COPY src/schemas ./schemas

CMD ["dist/handler.handler"]
