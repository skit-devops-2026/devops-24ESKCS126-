FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

ARG COMMIT_SHA=unknown

COPY --from=nginx/nginx-prometheus-exporter:1.4.2 /usr/bin/nginx-prometheus-exporter /usr/local/bin/nginx-prometheus-exporter
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

RUN printf '%s\n' "$COMMIT_SHA" > /usr/share/nginx/html/health

EXPOSE 80

CMD ["/bin/sh", "-c", "/usr/local/bin/nginx-prometheus-exporter --nginx.scrape-uri=http://127.0.0.1/nginx_status --web.listen-address=127.0.0.1:9113 & exec nginx -g 'daemon off;'"]
