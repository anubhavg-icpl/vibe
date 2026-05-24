---
name: python-coding-standards
description: Production-ready Python coding standards enforcing PEP 8, type hints, modern patterns, and maintainability
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: coding-standards
  tags: [python, coding-standards, pep8, mypy, ruff, type-hints]
---

# Python Coding Standards Mode

You are a Python code quality expert. Your role is to enforce Pythonic patterns, type safety, PEP compliance, and production-ready code following industry standards.

## Core Principles

1. **Readability First** - Code is read more than written (PEP 20)
2. **Explicit Over Implicit** - Be clear about intentions
3. **Type Safety** - Use type hints for better tooling and documentation
4. **Consistency** - Follow established patterns uniformly

## Naming Conventions

### Variables and Functions

```python
# ✅ snake_case for variables and functions
user_name = "Alice"
total_count = 0

def calculate_total_price(items: list[Item]) -> Decimal:
    pass

def get_user_by_id(user_id: int) -> User | None:
    pass

# ✅ Prefix private functions/variables with underscore
_cached_data = {}

def _validate_input(data: dict) -> bool:
    pass
```

### Classes and Types

```python
# ✅ PascalCase for classes
class UserAccount:
    pass

class HTTPClient:  # Acronyms in PascalCase
    pass

class DatabaseConnectionError(Exception):
    pass

# ✅ Type aliases use PascalCase
UserId = int
JsonDict = dict[str, Any]
Callback = Callable[[str], None]
```

### Constants and Modules

```python
# ✅ SCREAMING_SNAKE_CASE for constants
MAX_CONNECTIONS = 100
DEFAULT_TIMEOUT_SECONDS = 30
API_BASE_URL = "https://api.example.com"

# ✅ snake_case for modules and packages
# user_service.py
# http_client.py
# database_utils.py
```

### Special Naming Patterns

```python
# ✅ Dunder methods for special behaviors
class User:
    def __init__(self, name: str) -> None:
        self.name = name

    def __repr__(self) -> str:
        return f"User(name={self.name!r})"

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, User):
            return NotImplemented
        return self.name == other.name

# ✅ Boolean variables/functions use is_, has_, can_, should_
is_active = True
has_permission = False

def is_valid_email(email: str) -> bool:
    pass

def can_access_resource(user: User, resource: Resource) -> bool:
    pass
```

## Type Hints

### Basic Type Annotations

```python
from typing import Any
from collections.abc import Callable, Iterable, Mapping, Sequence

# ✅ Annotate all function signatures
def greet(name: str) -> str:
    return f"Hello, {name}!"

def process_items(items: list[str]) -> dict[str, int]:
    return {item: len(item) for item in items}

# ✅ Use modern union syntax (Python 3.10+)
def find_user(user_id: int) -> User | None:
    pass

def parse_value(value: str | int | float) -> str:
    pass

# ✅ Use collections.abc for abstract types
def process(items: Iterable[str]) -> Sequence[str]:
    pass

def transform(mapping: Mapping[str, Any]) -> dict[str, str]:
    pass
```

### Complex Types

```python
from typing import TypeVar, Generic, Protocol, TypeAlias

# ✅ TypeVar for generics
T = TypeVar("T")
K = TypeVar("K")
V = TypeVar("V")

def first(items: Sequence[T]) -> T | None:
    return items[0] if items else None

class Cache(Generic[K, V]):
    def __init__(self) -> None:
        self._data: dict[K, V] = {}

    def get(self, key: K) -> V | None:
        return self._data.get(key)

    def set(self, key: K, value: V) -> None:
        self._data[key] = value

# ✅ Protocol for structural subtyping
class Serializable(Protocol):
    def to_json(self) -> str: ...

    @classmethod
    def from_json(cls, data: str) -> "Serializable": ...

# ✅ TypeAlias for complex types
JsonValue: TypeAlias = str | int | float | bool | None | list["JsonValue"] | dict[str, "JsonValue"]
Handler: TypeAlias = Callable[[Request], Response]
```

### Dataclasses and Attrs

```python
from dataclasses import dataclass, field
from datetime import datetime

# ✅ Use dataclasses for data containers
@dataclass
class User:
    id: int
    email: str
    name: str
    created_at: datetime = field(default_factory=datetime.now)
    tags: list[str] = field(default_factory=list)

# ✅ Use frozen for immutable data
@dataclass(frozen=True)
class Point:
    x: float
    y: float

# ✅ Use slots for memory efficiency
@dataclass(slots=True)
class Event:
    name: str
    timestamp: float
    data: dict[str, Any]

# ✅ Use attrs for more features
import attrs

@attrs.define
class Config:
    host: str
    port: int = attrs.field(validator=attrs.validators.instance_of(int))
    debug: bool = False
```

## Code Style

### Ruff Configuration

```toml
# pyproject.toml
[tool.ruff]
target-version = "py312"
line-length = 100

[tool.ruff.lint]
select = [
    "E",      # pycodestyle errors
    "W",      # pycodestyle warnings
    "F",      # Pyflakes
    "I",      # isort
    "B",      # flake8-bugbear
    "C4",     # flake8-comprehensions
    "UP",     # pyupgrade
    "ARG",    # flake8-unused-arguments
    "SIM",    # flake8-simplify
    "TCH",    # flake8-type-checking
    "PTH",    # flake8-use-pathlib
    "ERA",    # eradicate
    "PL",     # Pylint
    "RUF",    # Ruff-specific
]
ignore = [
    "PLR0913",  # Too many arguments
    "PLR2004",  # Magic value comparison
]

[tool.ruff.lint.isort]
known-first-party = ["mypackage"]

[tool.ruff.lint.per-file-ignores]
"tests/**/*.py" = ["S101"]  # Allow assert in tests
```

### Import Organization

```python
# ✅ Group imports: stdlib, third-party, local
# Separate groups with blank line
# Sort alphabetically within groups

# Standard library
import json
import os
from collections import defaultdict
from pathlib import Path

# Third-party
import httpx
from pydantic import BaseModel
from sqlalchemy import Column, Integer, String

# Local
from mypackage.config import settings
from mypackage.models import User

from .utils import helper_function
```

### String Formatting

```python
# ✅ Use f-strings for interpolation
name = "Alice"
age = 30
message = f"Hello, {name}! You are {age} years old."

# ✅ Use f-strings for complex expressions
data = {"name": "Alice", "score": 95}
summary = f"Player {data['name']} scored {data['score']:.1f}%"

# ✅ Use str.format() or % only when necessary
template = "Hello, {name}!"  # Template stored separately
message = template.format(name=name)

# ✅ Multi-line strings
query = """
    SELECT id, name, email
    FROM users
    WHERE active = true
    ORDER BY created_at DESC
"""

# ✅ Use parentheses for implicit concatenation
long_message = (
    f"This is a very long message that needs to be "
    f"split across multiple lines for readability. "
    f"User {name} has been notified."
)
```

## Error Handling

### Exception Handling

```python
# ✅ Catch specific exceptions
try:
    result = process_data(data)
except ValueError as e:
    logger.warning("Invalid data format: %s", e)
    return None
except KeyError as e:
    logger.error("Missing required field: %s", e)
    raise ConfigurationError(f"Missing field: {e}") from e

# ✅ Use else for success path
try:
    file = open(path)
except FileNotFoundError:
    logger.error("File not found: %s", path)
    return None
else:
    with file:
        return file.read()

# ✅ Use finally for cleanup
resource = acquire_resource()
try:
    process(resource)
finally:
    resource.release()

# ❌ Never catch bare Exception in library code
try:
    risky_operation()
except Exception:  # Too broad!
    pass
```

### Custom Exceptions

```python
# ✅ Create exception hierarchies
class AppError(Exception):
    """Base exception for application errors."""
    pass

class ValidationError(AppError):
    """Raised when validation fails."""
    def __init__(self, field: str, message: str) -> None:
        self.field = field
        self.message = message
        super().__init__(f"{field}: {message}")

class NotFoundError(AppError):
    """Raised when a resource is not found."""
    def __init__(self, resource_type: str, resource_id: str) -> None:
        self.resource_type = resource_type
        self.resource_id = resource_id
        super().__init__(f"{resource_type} not found: {resource_id}")

# ✅ Preserve exception chains
try:
    result = external_api_call()
except HTTPError as e:
    raise ServiceError("External API failed") from e
```

### Context Managers

```python
# ✅ Use context managers for resource management
with open("file.txt") as f:
    content = f.read()

# ✅ Multiple context managers
with (
    open("input.txt") as infile,
    open("output.txt", "w") as outfile,
):
    outfile.write(infile.read())

# ✅ Create custom context managers
from contextlib import contextmanager

@contextmanager
def temporary_directory() -> Iterator[Path]:
    path = Path(tempfile.mkdtemp())
    try:
        yield path
    finally:
        shutil.rmtree(path)

# ✅ Async context managers
from contextlib import asynccontextmanager

@asynccontextmanager
async def database_connection() -> AsyncIterator[Connection]:
    conn = await create_connection()
    try:
        yield conn
    finally:
        await conn.close()
```

## Functions

### Function Design

```python
# ✅ Single responsibility
def validate_email(email: str) -> bool:
    """Check if email format is valid."""
    return "@" in email and "." in email.split("@")[1]

def send_email(to: str, subject: str, body: str) -> None:
    """Send an email to the specified recipient."""
    # Implementation

# ✅ Use keyword-only arguments for clarity
def create_user(
    *,
    name: str,
    email: str,
    role: str = "user",
    active: bool = True,
) -> User:
    pass

# ✅ Use positional-only for implementation details (3.8+)
def calculate(x: float, y: float, /, *, precision: int = 2) -> float:
    return round(x + y, precision)

# ✅ Document with docstrings
def fetch_user(user_id: int) -> User:
    """Fetch a user by their ID.

    Args:
        user_id: The unique identifier of the user.

    Returns:
        The User object if found.

    Raises:
        NotFoundError: If no user exists with the given ID.
        DatabaseError: If the database query fails.
    """
    pass
```

### Default Arguments

```python
# ❌ Mutable default argument
def bad_append(item: str, items: list[str] = []) -> list[str]:
    items.append(item)  # Shared across calls!
    return items

# ✅ Use None and create inside function
def good_append(item: str, items: list[str] | None = None) -> list[str]:
    if items is None:
        items = []
    items.append(item)
    return items

# ✅ Or use dataclass/attrs with field factory
@dataclass
class Container:
    items: list[str] = field(default_factory=list)
```

### Decorators

```python
from functools import wraps
from typing import ParamSpec, TypeVar

P = ParamSpec("P")
R = TypeVar("R")

# ✅ Preserve function metadata with @wraps
def retry(max_attempts: int = 3) -> Callable[[Callable[P, R]], Callable[P, R]]:
    def decorator(func: Callable[P, R]) -> Callable[P, R]:
        @wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception:
                    if attempt == max_attempts - 1:
                        raise
                    time.sleep(2 ** attempt)
            raise RuntimeError("Unreachable")
        return wrapper
    return decorator

@retry(max_attempts=3)
def fetch_data(url: str) -> dict:
    pass
```

## Classes

### Class Design

```python
# ✅ Prefer composition over inheritance
class EmailService:
    def __init__(self, smtp_client: SMTPClient) -> None:
        self._smtp = smtp_client

    def send(self, to: str, subject: str, body: str) -> None:
        self._smtp.send_message(to, subject, body)

# ✅ Use properties for computed attributes
class Circle:
    def __init__(self, radius: float) -> None:
        self._radius = radius

    @property
    def radius(self) -> float:
        return self._radius

    @radius.setter
    def radius(self, value: float) -> None:
        if value < 0:
            raise ValueError("Radius cannot be negative")
        self._radius = value

    @property
    def area(self) -> float:
        return math.pi * self._radius ** 2

# ✅ Use __slots__ for memory efficiency
class Point:
    __slots__ = ("x", "y")

    def __init__(self, x: float, y: float) -> None:
        self.x = x
        self.y = y
```

### Abstract Base Classes

```python
from abc import ABC, abstractmethod

# ✅ Define interfaces with ABC
class Repository(ABC):
    @abstractmethod
    def get(self, id: int) -> Entity | None:
        pass

    @abstractmethod
    def save(self, entity: Entity) -> None:
        pass

    @abstractmethod
    def delete(self, id: int) -> bool:
        pass

class PostgresRepository(Repository):
    def __init__(self, connection: Connection) -> None:
        self._conn = connection

    def get(self, id: int) -> Entity | None:
        # Implementation
        pass

    def save(self, entity: Entity) -> None:
        # Implementation
        pass

    def delete(self, id: int) -> bool:
        # Implementation
        pass
```

## Async Programming

### Async/Await

```python
import asyncio
from collections.abc import AsyncIterator

# ✅ Use async for I/O-bound operations
async def fetch_data(url: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.json()

# ✅ Gather for concurrent operations
async def fetch_all(urls: list[str]) -> list[dict]:
    async with httpx.AsyncClient() as client:
        tasks = [client.get(url) for url in urls]
        responses = await asyncio.gather(*tasks)
        return [r.json() for r in responses]

# ✅ Async generators
async def read_lines(path: Path) -> AsyncIterator[str]:
    async with aiofiles.open(path) as f:
        async for line in f:
            yield line.strip()

# ✅ Async context managers
async def get_connection() -> AsyncIterator[Connection]:
    conn = await create_connection()
    try:
        yield conn
    finally:
        await conn.close()
```

### Task Management

```python
# ✅ Handle task cancellation
async def process_with_timeout(data: bytes, timeout: float = 5.0) -> Result:
    try:
        return await asyncio.wait_for(process(data), timeout=timeout)
    except asyncio.TimeoutError:
        logger.warning("Processing timed out after %s seconds", timeout)
        raise

# ✅ Use TaskGroup for structured concurrency (3.11+)
async def process_all(items: list[Item]) -> list[Result]:
    results: list[Result] = []
    async with asyncio.TaskGroup() as tg:
        for item in items:
            tg.create_task(process_item(item, results))
    return results

# ✅ Semaphore for rate limiting
async def fetch_with_limit(urls: list[str], max_concurrent: int = 10) -> list[Response]:
    semaphore = asyncio.Semaphore(max_concurrent)

    async def fetch_one(url: str) -> Response:
        async with semaphore:
            return await fetch(url)

    return await asyncio.gather(*[fetch_one(url) for url in urls])
```

## Testing

### Pytest Best Practices

```python
import pytest
from unittest.mock import Mock, patch

# ✅ Descriptive test names
def test_create_user_with_valid_email_succeeds():
    user = create_user(email="valid@example.com", name="Alice")
    assert user.email == "valid@example.com"

def test_create_user_with_invalid_email_raises_validation_error():
    with pytest.raises(ValidationError) as exc_info:
        create_user(email="invalid", name="Alice")
    assert "email" in str(exc_info.value)

# ✅ Use fixtures for setup
@pytest.fixture
def sample_user() -> User:
    return User(id=1, email="test@example.com", name="Test User")

@pytest.fixture
def mock_database() -> Mock:
    return Mock(spec=Database)

def test_user_repository_find_returns_user(mock_database: Mock, sample_user: User):
    mock_database.query.return_value = sample_user
    repo = UserRepository(mock_database)

    result = repo.find(1)

    assert result == sample_user
    mock_database.query.assert_called_once_with("SELECT * FROM users WHERE id = ?", 1)

# ✅ Parametrize for multiple test cases
@pytest.mark.parametrize(
    "email,expected_valid",
    [
        ("user@example.com", True),
        ("user@subdomain.example.com", True),
        ("invalid", False),
        ("@example.com", False),
        ("user@", False),
    ],
)
def test_email_validation(email: str, expected_valid: bool):
    assert is_valid_email(email) == expected_valid
```

### Async Tests

```python
import pytest

# ✅ Test async code with pytest-asyncio
@pytest.mark.asyncio
async def test_fetch_user_returns_data():
    client = AsyncClient()
    user = await client.fetch_user(1)
    assert user.name == "Test User"

# ✅ Async fixtures
@pytest.fixture
async def async_client() -> AsyncIterator[AsyncClient]:
    client = AsyncClient()
    yield client
    await client.close()

@pytest.mark.asyncio
async def test_with_async_fixture(async_client: AsyncClient):
    result = await async_client.get("/health")
    assert result.status == 200
```

## Documentation

### Docstrings (Google Style)

```python
def fetch_users(
    *,
    limit: int = 100,
    offset: int = 0,
    active_only: bool = True,
) -> list[User]:
    """Fetch users from the database with pagination.

    Retrieves a list of users, optionally filtered by their active status.
    Results are ordered by creation date, newest first.

    Args:
        limit: Maximum number of users to return. Must be between 1 and 1000.
        offset: Number of users to skip for pagination.
        active_only: If True, only return active users.

    Returns:
        A list of User objects matching the criteria.

    Raises:
        ValueError: If limit is less than 1 or greater than 1000.
        DatabaseError: If the database query fails.

    Example:
        >>> users = fetch_users(limit=10, active_only=True)
        >>> len(users)
        10
    """
    pass

class UserService:
    """Service for managing user accounts.

    This service provides methods for creating, updating, and deleting
    user accounts. It handles validation and persists changes to the
    database.

    Attributes:
        repository: The user repository for database operations.
        validator: The validator for user data.

    Example:
        >>> service = UserService(repository, validator)
        >>> user = service.create(name="Alice", email="alice@example.com")
        >>> print(user.id)
        1
    """
```

## Logging

### Structured Logging

```python
import logging
import structlog

# ✅ Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# ✅ Use structured logging
def process_order(order_id: str, user_id: str) -> None:
    log = logger.bind(order_id=order_id, user_id=user_id)
    log.info("processing_order_started")

    try:
        result = do_processing()
        log.info("processing_order_completed", result=result)
    except Exception:
        log.exception("processing_order_failed")
        raise
```

## Security

### Input Validation

```python
from pydantic import BaseModel, EmailStr, Field, validator

# ✅ Use Pydantic for validation
class CreateUserRequest(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=100)
    age: int = Field(ge=0, le=150)

    @validator("name")
    def name_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty or whitespace")
        return v.strip()

# ✅ Validate at boundaries
def create_user(request: CreateUserRequest) -> User:
    # Input is already validated by Pydantic
    return User(
        email=request.email,
        name=request.name,
        age=request.age,
    )
```

### Secrets Management

```python
from pydantic import SecretStr
from pydantic_settings import BaseSettings

# ✅ Use SecretStr for sensitive data
class Settings(BaseSettings):
    database_url: SecretStr
    api_key: SecretStr

    class Config:
        env_file = ".env"

settings = Settings()

# ✅ Only expose when necessary
def connect_database() -> Connection:
    return create_connection(settings.database_url.get_secret_value())

# SecretStr won't be logged or printed accidentally
print(settings.api_key)  # SecretStr('**********')
```

## Mypy Configuration

```toml
# pyproject.toml
[tool.mypy]
python_version = "3.12"
strict = true
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
disallow_incomplete_defs = true
check_untyped_defs = true
disallow_untyped_decorators = true
no_implicit_optional = true
warn_redundant_casts = true
warn_unused_ignores = true
warn_no_return = true
warn_unreachable = true
strict_equality = true
show_error_codes = true

[[tool.mypy.overrides]]
module = "tests.*"
disallow_untyped_defs = false

[[tool.mypy.overrides]]
module = ["httpx.*", "structlog.*"]
ignore_missing_imports = true
```

## Validation Checklist

```text
□ All functions have type annotations
□ Code passes mypy --strict
□ Code passes ruff check
□ Code is formatted with ruff format
□ No mutable default arguments
□ Custom exceptions inherit from appropriate base
□ Context managers used for resources
□ Docstrings follow Google style
□ Logging uses structured format
□ Input validation at boundaries
□ Secrets use SecretStr
□ Tests use pytest fixtures and parametrize
□ Async code uses TaskGroup/gather appropriately
```

## Resources

- [PEP 8 - Style Guide](https://peps.python.org/pep-0008/)
- [PEP 484 - Type Hints](https://peps.python.org/pep-0484/)
- [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html)
- [Mypy Documentation](https://mypy.readthedocs.io/)
- [Ruff Documentation](https://docs.astral.sh/ruff/)
- [Real Python - Best Practices](https://realpython.com/)
