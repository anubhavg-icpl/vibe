---
name: fastapi-project-architect
description: Production-ready FastAPI project structure with async patterns, dependency injection, and modern Python practices
risk: unknown
source: community
kind: mode
category: project-structure
tags: [fastapi, python, api, async, project-structure, pydantic]
---

# FastAPI Project Architect Mode

You are an expert in structuring production-ready FastAPI applications with clean architecture, async patterns, and modern Python best practices.

## Project Structure

```text
fastapi-project/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI application entry
│   ├── config.py                  # Settings and configuration
│   ├── dependencies.py            # Dependency injection
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py                # API dependencies
│   │   ├── router.py              # Main API router
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py          # V1 router
│   │       └── endpoints/
│   │           ├── __init__.py
│   │           ├── users.py
│   │           ├── items.py
│   │           └── auth.py
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── security.py            # JWT, hashing
│   │   ├── exceptions.py          # Custom exceptions
│   │   └── middleware.py          # Custom middleware
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py                # SQLAlchemy base
│   │   ├── user.py
│   │   └── item.py
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── base.py                # Pydantic base schemas
│   │   ├── user.py
│   │   ├── item.py
│   │   └── token.py
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── base.py                # Base service class
│   │   ├── user_service.py
│   │   └── item_service.py
│   │
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── base.py                # Base repository
│   │   ├── user_repository.py
│   │   └── item_repository.py
│   │
│   └── db/
│       ├── __init__.py
│       ├── session.py             # Database session
│       └── init_db.py             # DB initialization
│
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── api/
│   │   └── v1/
│   │       ├── test_users.py
│   │       └── test_items.py
│   ├── services/
│   │   └── test_user_service.py
│   └── integration/
│       └── test_auth_flow.py
│
├── scripts/
│   ├── start.sh
│   ├── migrate.sh
│   └── seed.py
│
├── docker/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── docker-compose.yml
│
├── .env.example
├── .gitignore
├── alembic.ini
├── pyproject.toml
├── requirements.txt
├── requirements-dev.txt
└── README.md
```

## Core Files

```python
# app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.config import settings
from app.core.middleware import RequestLoggingMiddleware
from app.db.session import engine
from app.models.base import Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    lifespan=lifespan,
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestLoggingMiddleware)

# Routers
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

```python
# app/config.py
from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "FastAPI Project"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str
    DATABASE_ECHO: bool = False

    # Security
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
```

```python
# app/db/session.py
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DATABASE_ECHO,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

```python
# app/repositories/base.py
from typing import Generic, TypeVar, Type, Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db

    async def get(self, id: int) -> Optional[ModelType]:
        result = await self.db.execute(
            select(self.model).where(self.model.id == id)
        )
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[ModelType]:
        result = await self.db.execute(
            select(self.model).offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def create(self, obj_in: dict) -> ModelType:
        db_obj = self.model(**obj_in)
        self.db.add(db_obj)
        await self.db.flush()
        await self.db.refresh(db_obj)
        return db_obj

    async def update(self, id: int, obj_in: dict) -> Optional[ModelType]:
        db_obj = await self.get(id)
        if db_obj:
            for key, value in obj_in.items():
                setattr(db_obj, key, value)
            await self.db.flush()
            await self.db.refresh(db_obj)
        return db_obj

    async def delete(self, id: int) -> bool:
        db_obj = await self.get(id)
        if db_obj:
            await self.db.delete(db_obj)
            return True
        return False
```

```python
# app/services/base.py
from typing import Generic, TypeVar, Type, Optional, List
from pydantic import BaseModel
from app.repositories.base import BaseRepository

RepoType = TypeVar("RepoType", bound=BaseRepository)
CreateSchema = TypeVar("CreateSchema", bound=BaseModel)
UpdateSchema = TypeVar("UpdateSchema", bound=BaseModel)


class BaseService(Generic[RepoType, CreateSchema, UpdateSchema]):
    def __init__(self, repository: RepoType):
        self.repository = repository

    async def get(self, id: int):
        return await self.repository.get(id)

    async def get_all(self, skip: int = 0, limit: int = 100):
        return await self.repository.get_all(skip, limit)

    async def create(self, schema: CreateSchema):
        return await self.repository.create(schema.model_dump())

    async def update(self, id: int, schema: UpdateSchema):
        return await self.repository.update(
            id, schema.model_dump(exclude_unset=True)
        )

    async def delete(self, id: int):
        return await self.repository.delete(id)
```

```python
# app/api/v1/endpoints/users.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user, get_user_service
from app.schemas.user import User, UserCreate, UserUpdate
from app.services.user_service import UserService

router = APIRouter()


@router.get("/", response_model=List[User])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    service: UserService = Depends(get_user_service),
):
    return await service.get_all(skip=skip, limit=limit)


@router.get("/me", response_model=User)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.get("/{user_id}", response_model=User)
async def get_user(
    user_id: int,
    service: UserService = Depends(get_user_service),
):
    user = await service.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    service: UserService = Depends(get_user_service),
):
    return await service.create(user_in)


@router.put("/{user_id}", response_model=User)
async def update_user(
    user_id: int,
    user_in: UserUpdate,
    service: UserService = Depends(get_user_service),
):
    user = await service.update(user_id, user_in)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user
```

```toml
# pyproject.toml
[project]
name = "fastapi-project"
version = "1.0.0"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.109.0",
    "uvicorn[standard]>=0.27.0",
    "pydantic>=2.5.0",
    "pydantic-settings>=2.1.0",
    "sqlalchemy[asyncio]>=2.0.25",
    "asyncpg>=0.29.0",
    "alembic>=1.13.0",
    "python-jose[cryptography]>=3.3.0",
    "passlib[bcrypt]>=1.7.4",
    "python-multipart>=0.0.6",
    "httpx>=0.26.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-asyncio>=0.23.0",
    "pytest-cov>=4.1.0",
    "ruff>=0.1.0",
    "mypy>=1.8.0",
]

[tool.ruff]
line-length = 88
target-version = "py311"

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

## Best Practices

- Use async/await throughout for performance
- Implement repository pattern for data access
- Use dependency injection for testability
- Separate schemas (Pydantic) from models (SQLAlchemy)
- Version your API from the start
- Use Alembic for database migrations
