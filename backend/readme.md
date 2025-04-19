# 🛠️ E-Commerce Backend (Serverless, TypeScript, AWS)

This is the **backend** codebase for a serverless e-commerce platform built with:

- ✅ **AWS Lambda** (Node.js 22 LTS)
- ✅ **DynamoDB** as the primary NoSQL database
- ✅ **Cognito** for authentication
- ✅ **SNS** for email notifications
- ✅ **API Gateway** for HTTP routing
- ✅ **Terraform** for infrastructure as code
- ✅ **TypeScript** for strong typing and clean code

---

## 📁 Project Structure

```
backend/
├── admin/              # Admin-only product/order/user management
├── cart/               # Persistent cart handling
├── order/              # Placing and retrieving orders
├── product/            # Browsing, searching, recommending products
├── review/             # Submitting product reviews
├── user/               # User preferences and Cognito post-confirmation
├── shared/             # Reusable AWS clients and utilities
├── types/              # Shared TS types and interfaces
├── tsconfig.json       # TypeScript config
├── package.json        # Backend dependencies and scripts
└── .env                # Local environment config
```

---

## 🚀 Features Implemented

### 👤 User APIs
- `GET /me` - Fetch user profile
- `PUT /me/preferences` - Update preferred categories
- `Cognito PostConfirmation` - Auto-create user record in DynamoDB on signup

### 🛒 Cart APIs
- `GET /cart` - Retrieve user's cart
- `POST /cart` - Save/update cart items

### 📦 Order APIs
- `POST /orders` - Place order, update product popularity, trigger SNS email
- `GET /orders` - Get user's order history
- `GET /orders/{id}` - Get specific order detail

### 🛍️ Product APIs
- `GET /products` - List products (with filters)
- `GET /products/{id}` - Product detail
- `GET /products/popular` - Top N most ordered products
- `GET /products/{id}/similar` - Same-category recommendations

### ⭐ Review API
- `POST /reviews/{productId}` - Submit a product review

### 🔐 Admin APIs
- `POST /admin/products` - Add new product
- `PUT /admin/products/{id}` - Update product
- `DELETE /admin/products/{id}` - Deactivate or delete product
- `GET /admin/orders` - View all orders
- `GET /admin/users` - View all users

---

## ⚙️ AWS SDK Clients (in `shared/`)

- `dynamodbClient.ts` - Reusable DynamoDB client
- `snsClient.ts` - SNS client for order confirmations
- `helpers.ts` - Common utilities (e.g., response formatter)

---

## 🧪 Local Development

Install dependencies:

```bash
cd backend
npm install
```

Bundle functions with `tsup` or `esbuild`:

```bash
npm run bundle    # One function
npm run bundle:all
```

---

## 🌐 Environment Variables (`.env`)

```env
PRODUCTS_TABLE=Products
ORDERS_TABLE=Orders
USERS_TABLE=Users
CART_TABLE=Cart
REVIEWS_TABLE=Reviews
SNS_TOPIC_ARN=arn:aws:sns:us-east-1:xxxx:OrderTopic
AWS_REGION=us-east-1
STAGE=dev
```

> These should also be defined in your Terraform `lambda_environment` blocks.

---

## 🧠 Contributor Notes

- All Lambdas use `APIGatewayProxyHandler` from `aws-lambda`.
- TypeScript strict mode is enforced via `tsconfig.json`.
- Cognito user ID is extracted from:  
  `event.requestContext.authorizer.claims.sub`

---

## 📦 Future Enhancements

- Add unit tests using `vitest`
- Rate limiting or abuse protection
- Middleware wrappers for auth/error handling

---

Happy shipping 🚀
