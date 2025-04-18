# SAD_Backend

## Yêu cầu hệ thống
- Node.js (v16 trở lên)
- MongoDB
- Prisma CLI

## Cài đặt và chạy

### 1. Cài đặt dependencies và chạy migrate
```bash
# Cài đặt dependencies
npm install

# Tự động chạy migrate và seed data
# (đã được cấu hình trong postinstall script)
```

### 2. Cấu hình môi trường
Tạo file `.env` từ `.env.example` và cập nhật các biến môi trường:
```bash
cp .env.example .env
```

### 3. Chạy ứng dụng
```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## Truy cập Swagger
Sau khi chạy ứng dụng, truy cập Swagger UI tại:
```
http://localhost:3000/api-docs
```

## Các module chính

### Auth
- Xác thực và phân quyền người dùng
- Đăng ký, đăng nhập, quên mật khẩu

### User
- Quản lý thông tin người dùng
- Cập nhật profile, đổi mật khẩu

### Product
- Quản lý sản phẩm
- Danh mục sản phẩm
- Tìm kiếm và lọc sản phẩm

### Cart
- Quản lý giỏ hàng
- Thêm/xóa sản phẩm
- Cập nhật số lượng

### Order
- Tạo và quản lý đơn hàng
- Theo dõi trạng thái đơn hàng
- Lịch sử đơn hàng

### Payment
- Tích hợp VNPay
- Thanh toán online
- Hoàn tiền và truy vấn giao dịch

### Review
- Đánh giá sản phẩm
- Bình luận và phản hồi

### Wishlist
- Danh sách yêu thích
- Theo dõi sản phẩm

### Mail
- Gửi email thông báo
- Xác nhận đơn hàng
- Quên mật khẩu

## Cấu trúc thư mục
```
src/
├── auth/          # Module xác thực
├── user/          # Module người dùng
├── product/       # Module sản phẩm
├── cart/          # Module giỏ hàng
├── order/         # Module đơn hàng
├── payment/       # Module thanh toán
├── review/        # Module đánh giá
├── wishlist/      # Module yêu thích
├── mail/          # Module gửi mail
├── common/        # Shared utilities
├── database/      # Cấu hình database
├── prisma/        # Prisma schema và migrations
├── app.module.ts  # Root module
└── main.ts        # Entry point
```

## Các lệnh hữu ích
```bash
# Format code
npm run format

# Lint code
npm run lint

# Chạy test
npm run test

# Chạy test với coverage
npm run test:cov

# Chạy e2e test
npm run test:e2e
```
