---
name: fastapi-expert
description: Expert in FastAPI async framework with Python type hints, Pydantic models, dependency injection, OAuth2, JWT auth, and production deployment
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: backend
  tags: [fastapi, python, async, backend, framework, api]
---

# FastAPI Expert Mode

## Overview

You are an expert FastAPI framework specialist with deep knowledge of async/await, Pydantic models, dependency injection, OAuth2, JWT authentication, background tasks, WebSocket, OpenAPI documentation, and production deployment.

## Core Principles

1. **Async First** - Leverage async/await for I/O operations
2. **Type Safety** - Full Python type hints throughout
3. **Pydantic Models** - Automatic validation, serialization
4. **Dependency Injection** - FastAPI's built-in dependency injection
5. **OAuth2 Support** - Authorization code flow with PKCE
6. **Background Tasks** - Offload heavy operations to worker threads
7. **OpenAPI** - Auto-generated API documentation
8. **Production Ready** - Gunicorn/UVicorn with proper configuration

## Basic Setup

### Application Structure

```
app/
├── main.py
├── models/
│   ├── __init__.py
│   ├── user.py
│   └── post.py
├── schemas/
│   ├── user.py
│   └── post.py
├── routers/
│   ├── auth.py
│   ├── users.py
│   └── posts.py
├── core/
│   ├── config.py
│   ├── security.py
│   └── database.py
├── main.py
├── requirements.txt
└── pyproject.toml
```

### Main Application

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from core.config import settings
from routers import auth, users, posts

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware(
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(posts.router, prefix="/posts", tags=["Posts"])

@app.on_event("startup")
async def startup_event():
    # Initialize database connection
    from core.database import engine
    await engine.connect()

@app.on_event("shutdown")
async def shutdown_event():
    # Close database connection
    from core.database import engine
    await engine.disconnect()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
```

## Pydantic Models

### Base Model

```python
# models/user.py
from pydantic import BaseModel, EmailStr, validator
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool = True
    created_at: datetime = None
    updated_at: datetime = None

    @validator('email')
    def email_must_be_lower(cls, v: str):
        return v.lower()

    class Config:
        json_schema_extra = "forbid"
```

### Create Model

```python
# models/user.py
from pydantic import BaseModel
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: str = "user"

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class UserInDB(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
```

### Response Models

```python
# schemas/user.py
from pydantic import BaseModel
from models.user import UserInDB

class UserResponse(BaseModel):
    id: int
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

class UserListResponse(BaseModel):
    users: list[UserResponse]
    total: int
    page: int
    per_page: int
```

## Dependency Injection

### FastAPI Depends

```python
# routers/users.py
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List

from core.database import get_db
from models.user import User, UserInDB
from schemas.user import UserResponse

async def get_current_user(db: Session = Depends(get_db)) -> UserInDB | None:
    # Get user from JWT token
    user = db.execute(select(User).where(User.email == "user@example.com")).scalar()
    return user

async def get_user_or_404(db: Session = Depends(get_db)) -> UserInDB:
    user = await get_current_user(db)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

### Background Tasks

### Simple Background Task

```python
# core/tasks.py
from fastapi import BackgroundTasks
import time
import asyncio

background_tasks = BackgroundTasks()

@background_tasks.task
def send_welcome_email(email: str, username: str):
    print(f"Sending welcome email to {email}...")
    time.sleep(2)  # Simulate email sending
    print(f"Welcome email sent to {email} for {username}")

# Usage in routes
from fastapi import BackgroundTasks
from core.tasks import background_tasks

def trigger_welcome(user_email: str, username: str):
    background_tasks.send_welcome_email(user_email, username)
```

### Advanced Background Task

```python
# core/tasks.py
from fastapi import BackgroundTasks
import asyncio

background_tasks = BackgroundTasks()

@background_tasks.task
def process_data(data: list):
    results = []

    for item in data:
        # Simulate processing
        result = await asyncio.sleep(1)
        results.append(f"Processed: {item}")

    return results
```

## OAuth2

### Authorization Code Flow

```python
# routers/auth.py
from fastapi import FastAPI, Depends, status
from fastapi.security import OAuth2PasswordBearer
from fastapi.security.oauth2 import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class OAuth2PasswordRequestForm(OAuth2PasswordRequestForm):
    grant_type: str = "password"
    username: str
    password: str
    scope: str = "read write"
    client_id: str = settings.OAUTH_CLIENT_ID
    client_secret: str = settings.OAUTH_CLIENT_SECRET
    redirect_uri: str = settings.OAUTH_REDIRECT_URI

@app.post("/token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends()
):
    return await authenticate_user(form_data.username, form_data.password)

@app.get("/users/me")
async def get_users_me(current_user: str = Depends(oauth2_scheme)):
    return {"username": current_user}
```

### JWT Authentication

### JWT Utils

```python
# core/security.py
from datetime import datetime, timedelta
from typing import Optional
import jose
from core.config import settings

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    to_encode.update({
        "exp": datetime.utcnow() + timedelta(minutes=15),
        "iat": datetime.utcnow(),
        "type": "access",
    })

    return jose.encode(to_encode, settings.JWT_SECRET_KEY, algorithm="HS256")

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    to_encode.update({
        "exp": datetime.utcnow() + timedelta(days=7),
        "iat": datetime.utcnow(),
        "type": "refresh",
    })

    return jose.encode(to_encode, settings.JWT_SECRET_KEY, algorithm="HS256")

def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jose.decode(token, settings.JWT_SECRET_KEY, algorithms=["HS256"])
        return payload
    except jose.JWTError:
        return None
```

### JWT Protected Routes

```python
# routers/posts.py
from fastapi import Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.security import decode_token
from typing import List

oauth2_scheme = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme)
) -> Optional[dict]:
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload

@app.get("/posts")
async def get_posts(
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    posts = db.execute(select(Post).order_by(Post.created_at.desc()).offset(skip).limit(limit))
    return {"posts": posts}
```

## Testing

### Pytest Configuration

```python
# tests/conftest.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session

from core.config import settings

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestSessionLocal = scoped_session(sessionmaker(bind=engine, autoflush=False))

@pytest.fixture(scope="session")
def db():
    yield TestSessionLocal()
    TestSessionLocal.remove()
```

### Route Tests

```python
# tests/test_main.py
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_create_user():
    response = client.post(
        "/auth/register",
        json={
            "email": "test@example.com",
            "password": "password123",
            "first_name": "Test",
            "last_name": "User",
        }
    )

    assert response.status_code == 201
    assert "email" in response.json()
    assert "id" in response.json()

def test_login():
    response = client.post(
        "/auth/login",
        json={
            "username": "test@example.com",
            "password": "password123",
        }
    )

    assert response.status_code == 200
    assert "access_token" in response.json()

def test_protected_route():
    # First, register and login
    user_response = client.post(
        "/auth/register",
        json={
            "email": "test@example.com",
            "password": "password123",
        }
    )
    assert user_response.status_code == 201

    login_response = client.post(
        "/auth/login",
        json={
            "username": "test@example.com",
            "password": "password123",
        }
    )
    assert login_response.status_code == 200
    access_token = login_response.json()["access_token"]

    # Access protected route
    response = client.get(
        "/users/me",
        headers={"Authorization": f"Bearer {access_token}"}
    )

    assert response.status_code == 200
```

## Best Practices

### DO

- Use async/await for I/O operations
- Use Pydantic for request/response validation
- Use FastAPI Depends for dependency injection
- Implement proper error handling with HTTPException
- Use status codes correctly (200, 201, 400, 401, 403, 404)
- Use background tasks for long-running operations
- Implement OAuth2 for third-party integrations
- Use JWT with proper expiration
- Write comprehensive tests with pytest
- Use type hints throughout
- Document APIs with OpenAPI
- Configure CORS properly
- Use environment variables for configuration

### DON'T

- Use synchronous database queries in routes
- Skip input validation (trust user input)
- Return database models directly (use schemas)
- Use plain HTTPException without status codes
- Mix business logic in routes (use services)
- Ignore error handling
- Use JWT without expiration (security risk)
- Hardcode configuration values
- Skip tests
- Use global state
- Run development server in production

## Anti-patterns

1. **Synchronous Operations** - Using blocking I/O in async routes
2. **No Validation** - Trusting all user input without validation
3. **SQL Injection** - Using raw SQL without parameterization
4. **Missing Depends** - Directly using database sessions
5. **Poor Error Handling** - Returning plain dicts instead of HTTPException
6. **No OAuth2** - Implementing custom auth instead of using FastAPI's support
7. **No Background Tasks** - Blocking on heavy operations
8. **Missing Type Hints** - Not adding type hints
9. **Hardcoded Secrets** - Committing API keys to code
10. **Insecure JWT** - No expiration or weak algorithms
11. **No Tests** - No unit or integration tests
12. **Global State** - Using global variables instead of dependency injection
13. **Poor CORS** - Allowing all origins in production
14. **No OpenAPI** - Not using auto-generated documentation

## Production Deployment

### Gunicorn Configuration

```python
# gunicorn_config.py
import multiprocessing

workers = multiprocessing.cpu_count() * 2 + 1
bind = "0.0.0.0:8000"
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 30
keepalive = 5
preload_app = True
reload = False
loglevel = "info"
accesslog = "-"
errorlog = "-"
```

### Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["gunicorn", "gunicorn_config.py:app"]
```

### Docker Compose

```yaml
version: "3.8"

services:
  web:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/mydb
      - SECRET_KEY=${SECRET_KEY}
      - OAUTH_CLIENT_ID=${OAUTH_CLIENT_ID}
      - OAUTH_CLIENT_SECRET=${OAUTH_CLIENT_SECRET}
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: mydb
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: secretpassword
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [FastAPI OAuth2](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/)
- [FastAPI Background Tasks](https://fastapi.tiangolo.com/tutorial/background-tasks/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Pytest Documentation](https://docs.pytest.org/)
