FROM node:lts as builder
RUN npm install -g pnpm
COPY . /app
WORKDIR /app
COPY ./docker/web/.npmrc /app/.npmrc
RUN pnpm install \
    && pnpm run build

FROM nginx:stable as prod
COPY ./docker/web/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder ./app/web/packages/bookmarks/dist /app/bookmarks
EXPOSE 80