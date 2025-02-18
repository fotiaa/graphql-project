# GraphQL Advanced API

A production-ready GraphQL API implementation with authentication, real-time subscriptions, caching, and REST compatibility.

## Problem Statement

Build an industry-standard GraphQL API that includes:

### 1. User Authentication & Authorization
- User registration and login with JWT-based authentication
- Role-based access control (Admin, Moderator, User)
- Secure route protection
- Token-based API access

### 2. Posts Management
- CRUD operations for posts
- Pagination support
- Author information integration
- Access control based on user roles

### 3. Comments System
- Nested comments functionality
- Real-time updates
- Author tracking
- Post-comment relationships

### 4. Real-Time Features
- Live updates for new posts
- Instant comment notifications
- WebSocket integration
- Subscription support

### 5. Performance Optimization
- Data batching with DataLoader
- Redis caching
- Query complexity analysis
- Rate limiting

### 6. REST API Compatibility
- Hybrid GraphQL/REST approach
- External integration support
- Legacy system compatibility

## Solution

### Prerequisites

- Node.js (v18 or later)
- MongoDB
- Redis
- npm or yarn

### Tech Stack

- **Backend Framework**: Node.js + Express.js
- **GraphQL Server**: Apollo Server
- **Database**: MongoDB
- **Caching**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: WebSocket (GraphQL Subscriptions)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd graphql-advanced-api
```

2. Install dependencies:
```bash
npm install
```

3. Install MongoDB (MacOS):
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community
```

4. Install Redis (MacOS):
```bash
# Using Homebrew
brew install redis

# Start Redis service
brew services start redis
```

5. Create `.env` file:
```env
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/graphql-advanced-api
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
REDIS_URL=redis://localhost:6379
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Project Structure

```
graphql-advanced-api/
├── package.json
├── .env
├── .gitignore
├── src/
│   ├── server.js                  # Main server setup
│   ├── schema.js                  # GraphQL schema definitions
│   ├── context.js                 # Authentication and context setup 
│   ├── models/
│   │   └── index.js              # MongoDB models
│   ├── resolvers/
│   │   └── index.js              # GraphQL resolvers
│   ├── rest/
│   │   └── index.js              # REST API endpoints
│   ├── utils/
│   │   └── test-utils.js         # Test utilities
│   └── __tests__/
│       └── auth.test.js          # Authentication tests
```

### Key Features Implementation

#### 1. Authentication
- JWT-based token authentication
- Secure password hashing with bcrypt
- Role-based authorization middleware
- Token refresh mechanism

#### 2. Data Management
- MongoDB models with Mongoose
- DataLoader for efficient data batching
- Redis caching for frequently accessed data
- Pagination implementation

#### 3. Real-time Features
- GraphQL subscriptions setup
- WebSocket configuration
- Real-time updates for posts and comments
- Event publishing system

#### 4. Performance
- Query batching
- Response caching
- Rate limiting
- Query complexity analysis

### API Examples

1. User Registration:
```graphql
mutation {
  register(
    email: "user@example.com"
    password: "password123"
    username: "testuser"
  ) {
    token
    user {
      id
      username
    }
  }
}
```

2. Create Post:
```graphql
mutation {
  createPost(
    title: "My First Post"
    content: "This is the content"
  ) {
    id
    title
    author {
      username
    }
  }
}
```

3. Query Posts with Comments:
```graphql
query {
  posts(skip: 0, limit: 10) {
    id
    title
    content
    author {
      username
    }
    comments {
      content
      author {
        username
      }
    }
  }
}
```

### REST Endpoints

- `GET /api/posts/latest`: Get latest posts
- `GET /api/posts/:id`: Get specific post

### Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

Run tests:
```bash
npm test
```

### Monitoring & Maintenance

1. MongoDB monitoring:
```bash
# View MongoDB logs
tail -f /usr/local/var/log/mongodb/mongo.log

# MongoDB shell
mongosh
```

2. Redis monitoring:
```bash
# Redis CLI
redis-cli

# Monitor Redis commands
redis-cli monitor
```

### Security Considerations

1. Authentication:
- Use strong JWT secrets
- Implement token expiration
- Secure password hashing

2. Authorization:
- Role-based access control
- Resource ownership validation
- Request rate limiting

3. Data Protection:
- Input validation
- Query complexity limits
- Error handling

### Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Testing

The project includes:
- Unit tests
- Integration tests
- Authentication tests
- API endpoint tests

Run tests with:
```bash
npm test
```

