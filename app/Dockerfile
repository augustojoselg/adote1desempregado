# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY app/package*.json ./
RUN npm ci --no-audit --no-fund
COPY app/ ./
ENV VITE_API_URL=/api
RUN npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime
ENV PORT=8080 API_UPSTREAM=http://api:3001 NGINX_ENVSUBST_OUTPUT_DIR=/tmp
COPY deploy/nginx/nginx.conf /etc/nginx/nginx.conf
COPY deploy/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
COPY site.html divulgacao.html /usr/share/nginx/html/
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/healthz" || exit 1
CMD ["nginx", "-g", "daemon off;"]
