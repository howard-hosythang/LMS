# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_WS_URL=/ws
ARG VITE_API_TIMEOUT=10000
ARG VITE_PUBLIC_SITE_URL=https://library74.uk
ARG VITE_GA_MEASUREMENT_ID=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_API_TIMEOUT=$VITE_API_TIMEOUT
ENV VITE_PUBLIC_SITE_URL=$VITE_PUBLIC_SITE_URL
ENV VITE_GA_MEASUREMENT_ID=$VITE_GA_MEASUREMENT_ID
RUN npm run build

# Stage 2: Serve static files
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx-fe.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
