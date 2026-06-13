# Stage 1: Build source code React với Vite
FROM node:20-alpine AS build-stage
WORKDIR /app

# Copy package.json để tận dụng cache layer của Docker
COPY package*.json ./
RUN npm install

# Copy toàn bộ mã nguồn và thực hiện build
COPY . .
RUN npm run build

# Stage 2: Cấu hình Nginx gọn nhẹ cho môi trường Production
FROM nginx:1.25-alpine

# Xóa các file mặc định của Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copy thư mục build 'dist' từ Stage 1 vào thư mục gốc của Nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Cấu hình file nginx nội bộ của FE để xử lý SPA (Single Page Application) routing
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]