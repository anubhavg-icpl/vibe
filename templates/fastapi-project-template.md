---
name: FastAPI Project Template
version: "1.0"
category: templates
description: Production-ready FastAPI project structure with best practices
author: Anubhav Gain
tags: [fastapi, python, api, template, project-structure]
---

# FastAPI Project Template

A production-ready FastAPI project structure following best practices.

## Project Structure

```
my-fastapi-project/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py               # Configuration management
│   ├── database.py             # Database connection
│   ├── dependencies.py         # Dependency injection
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── router.py       # API v1 router
│   │   │   └── endpoints/
│   │   │       ├── __init__.py
│   │   │       ├── users.py
│   │   │       ├── auth.py
│   │   │       └── items.py
│   │   └── deps.py             # API dependencies
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── security.py         # JWT, password hashing
│   │   ├── exceptions.py       # Custom exceptions
│   │   └── middleware.py       # Custom middleware
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py             # SQLAlchemy base
│   │   ├── user.py
│   │   └── item.py
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── item.py
│   │   └── common.py           # Shared schemas
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── user_service.py
│   │   └── item_service.py
│   │
│   └── utils/
│       ├── __init__.py
│       └── helpers.py
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py             # pytest fixtures
│   ├── test_api/
│   │   ├── __init__.py
│   │   ├── test_users.py
│   │   └── test_items.py
│   └── test_services/
│       └── test_user_service.py
│
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│
├── scripts/
│   ├── start.sh
│   └── seed_data.py
│
├── .env.example
├── .gitignore
├── .pre-commit-config.yaml
├── alembic.ini
├── docker-compose.yml
├── Dockerfile
├── pyproject.toml
├── README.md
└── requirements.txt
```

## Key Files

### main.py
```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.v1.router import api_router
from app.database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
async def health():
    return {"status": "healthy"}
```

### config.py
```python
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    PROJECT_NAME: str = "FastAPI Project"
    VERSION: str = "1.0.0"
    DEBUG: bool = False

    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379"

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"

@lru_cache
def get_settings():
    return Settings()

settings = get_settings()
```

### Dockerfile
```dockerfile
FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY requirements.txt .
RUN uv pip install --system --no-cache -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### docker-compose.yml
```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://user:pass@db:5432/app
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - .:/app

  db:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: app
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

volumes:
  postgres_data:
```

## Usage

```bash
# Create project
cookiecutter gh:myorg/fastapi-template

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload

# Run tests
pytest -v
```
