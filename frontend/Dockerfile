# Aşama 1: Node imajıyla bağımlılık kurulumu + üretim build'i
FROM node:24-alpine AS build
WORKDIR /app

# Önce package dosyaları: bağımlılık cache katmanı
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Aşama 2: nginx sadece statik dosyaları servis eder + /api'yi backend'e proxy'ler
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
