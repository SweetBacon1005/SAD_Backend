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
- **Đăng ký**: `POST /auth/register` - Đăng ký tài khoản mới
- **Đăng nhập**: `POST /auth/login` - Đăng nhập và nhận JWT token
- **Quên mật khẩu**: `POST /auth/forgot-password` - Yêu cầu đặt lại mật khẩu
- **Đặt lại mật khẩu**: `POST /auth/reset-password` - Cập nhật mật khẩu mới

### User
- **Lấy thông tin**: `GET /users/profile` - Lấy thông tin người dùng đã đăng nhập
- **Cập nhật thông tin**: `PUT /users/profile` - Cập nhật thông tin cá nhân
- **Đổi mật khẩu**: `PUT /users/change-password` - Thay đổi mật khẩu
- **Quản lý địa chỉ**: `GET/POST/PUT/DELETE /users/addresses` - Quản lý địa chỉ giao hàng

### Product
- **Danh sách sản phẩm**: `POST /products/all` - Lấy danh sách sản phẩm có phân trang và lọc
- **Tìm kiếm**: `POST /products/search` - Tìm kiếm sản phẩm theo từ khóa
- **So sánh sản phẩm**: `POST /products/compare` - So sánh thông tin giữa các sản phẩm
- **So sánh giá**: `POST /products/price-comparison` - So sánh giá sản phẩm giữa các cửa hàng
- **Chi tiết sản phẩm**: `GET /products/:id` hoặc `GET /products/slug/:slug` - Lấy thông tin chi tiết
- **Quản lý sản phẩm**: `POST/PUT/DELETE /products` - Thêm/sửa/xóa sản phẩm (Admin/Manager)

### Cart
- **Lấy giỏ hàng**: `GET /cart` - Xem giỏ hàng hiện tại
- **Thêm vào giỏ**: `POST /cart/items` - Thêm sản phẩm vào giỏ hàng
- **Cập nhật số lượng**: `PUT /cart/items/:id` - Cập nhật số lượng sản phẩm trong giỏ
- **Xóa khỏi giỏ**: `DELETE /cart/items/:id` - Xóa sản phẩm khỏi giỏ hàng
- **Xóa giỏ hàng**: `DELETE /cart` - Xóa toàn bộ giỏ hàng

### Order
- **Danh sách đơn hàng**: `GET /orders` (Admin) hoặc `GET /orders/my-orders` - Xem danh sách đơn hàng
- **Chi tiết đơn hàng**: `GET /orders/:id` - Xem chi tiết một đơn hàng
- **Kiểm tra voucher**: `POST /orders/check-voucher` - Kiểm tra tính hợp lệ của voucher
- **Tạo đơn hàng**: `POST /orders` - Tạo đơn hàng mới
- **Tạo đơn từ giỏ hàng**: `POST /orders/from-cart` - Tạo đơn hàng từ giỏ hàng
- **Cập nhật trạng thái**: `PUT /orders/:id/status` - Cập nhật trạng thái đơn hàng (Admin)
- **Cập nhật thanh toán**: `PUT /orders/:id/payment` - Cập nhật trạng thái thanh toán (Admin)
- **Hủy đơn hàng**: `PUT /orders/:id/cancel` - Hủy đơn hàng

### Payment
- **Thông tin thanh toán**: `GET /payments/:id` - Xem thông tin thanh toán
- **Thanh toán theo đơn hàng**: `GET /payments/order/:orderId` - Xem thanh toán của đơn hàng
- **Tạo thanh toán**: `POST /payments` - Tạo thanh toán mới
- **Xử lý VNPay**: Các endpoint `GET /payments/vnpay-return`, `POST /payments/vnpay-ipn`, v.v. để xử lý giao dịch VNPAY

### Review
- **Danh sách đánh giá**: `GET /reviews` - Xem tất cả đánh giá
- **Đánh giá theo sản phẩm**: `GET /reviews/product/:productId` - Xem đánh giá của sản phẩm
- **Tạo đánh giá**: `POST /reviews` - Thêm đánh giá sản phẩm
- **Cập nhật đánh giá**: `PUT /reviews/:id` - Cập nhật đánh giá đã tạo
- **Xóa đánh giá**: `DELETE /reviews/:id` - Xóa đánh giá

### Wishlist
- **Xem wishlist**: `GET /wishlist` - Lấy hoặc tạo mới wishlist của người dùng hiện tại
- **Thêm sản phẩm**: `POST /wishlist/add-item` - Thêm sản phẩm vào wishlist
- **Xóa sản phẩm**: `DELETE /wishlist/items/:productId` - Xóa sản phẩm khỏi wishlist
- **Xóa tất cả sản phẩm**: `DELETE /wishlist/items` - Xóa tất cả sản phẩm trong wishlist

### Voucher
- **Danh sách voucher**: `GET /vouchers` - Xem tất cả voucher
- **Voucher công khai**: `GET /vouchers/public` - Xem voucher công khai
- **Chi tiết voucher**: `GET /vouchers/:id` - Xem chi tiết voucher
- **Tạo voucher**: `POST /vouchers` - Tạo voucher mới (Admin)
- **Cập nhật voucher**: `PUT /vouchers/:id` - Cập nhật voucher (Admin)
- **Xóa voucher**: `DELETE /vouchers/:id` - Xóa voucher (Admin)

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
├── voucher/       # Module voucher
├── mail/          # Module gửi mail
├── common/        # Shared utilities và decorators
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

## Deployment
### Với Docker
```bash
# Build Docker image
docker build -t sad-backend .

# Chạy container
docker run -p 3000:3000 --env-file .env sad-backend
```

### Với PM2
```bash
# Cài đặt PM2
npm install -g pm2

# Chạy ứng dụng với PM2
pm2 start dist/main.js --name "sad-backend"

# Khởi động lại
pm2 restart sad-backend

# Xem logs
pm2 logs sad-backend
```
