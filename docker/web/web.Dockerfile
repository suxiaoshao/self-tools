FROM node:lts-alpine as builder
RUN npm config set registry https://registry.npm.taobao.org \
    && npm install -g pnpm
COPY ./web /app
WORKDIR /app
COPY ./docker/web/.npmrc /app/.npmrc
RUN pnpm install \
    && pnpm run build

FROM nginx:stable-alpine as prod
COPY ./docker/web/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder ./app/packages/auth/dist /app/auth
COPY --from=builder ./app/packages/bookmarks/dist /app/bookmarks
EXPOSE 80