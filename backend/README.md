# Backend API

## Setup

1. **Install PostgreSQL** (if not already installed)

2. **Configure Database**:
   - Copy `.env.example` to `.env`
   - Update `DATABASE_URL` with your PostgreSQL credentials

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Run Migrations**:
   ```bash
   npm run prisma:migrate
   ```

5. **Seed Database**:
   ```bash
   npx prisma db seed
   ```

6. **Start Server**:
   ```bash
   npm run dev
   ```

## API Endpoints

### Auth
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/guest` - Create guest session
- `GET /api/auth/me` - Get current user

### Requests
- `GET /api/requests` - List all requests
- `GET /api/requests/:id` - Get single request
- `POST /api/requests` - Create new request
- `PATCH /api/requests/:id` - Update request

### Messages
- `GET /api/requests/:id/messages` - Get messages
- `POST /api/requests/:id/messages` - Send message
- `PATCH /api/requests/:id/messages/read` - Mark as read

## Socket.io Events
- `new_request` - New support request created
- `request_updated` - Request status changed
- `new_message` - New message in chat
- `user_typing` - User is typing

## Default Users
- **Support**: `sarah` / `agent123`
- **Support**: `mike` / `agent123`
- **Mentor**: `emma` / `mentor123`
