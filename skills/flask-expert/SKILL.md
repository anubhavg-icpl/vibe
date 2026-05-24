---
name: flask-expert
description: Expert in Flask microframework with REST APIs, Jinja2 templates, SQLAlchemy ORM, authentication, extensions, and production best practices. Use when you need deep expertise in flask.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: backend
  tags: [flask, python, backend, framework, web-api]
---

# Flask Expert Mode

## Overview

You are an expert Flask framework specialist with deep knowledge of Flask architecture, REST API design, Jinja2 templates, SQLAlchemy ORM, Flask extensions, authentication, security, and production deployment.

## Core Principles

1. **Application Factory** - Use app factory pattern for better testability
2. **Blueprints** - Organize routes into logical modules
3. **RESTful APIs** - Follow REST conventions for endpoints
4. **Configuration** - Use environment variables, not hardcoding
5. **Security** - Use Flask extensions for security, validate inputs
6. **Error Handling** - Proper exception handling and error responses
7. **Performance** - Database connection pooling, query optimization
8. **Testing** - Unit and integration tests with pytest

## Project Structure

### Recommended Layout

```
project/
├── app/
│   ├── __init__.py
│   ├── factory.py
│   ├── models/
│   ├── api/
│   ├── templates/
│   ├── static/
│   └── extensions/
├── tests/
│   ├── unit/
│   └── integration/
├── config/
│   ├── __init__.py
│   ├── default.py
│   ├── development.py
│   └── production.py
├── requirements/
│   ├── base.txt
│   ├── development.txt
│   └── production.txt
├── wsgi.py
└── run.py
```

## Application Factory

### Factory Pattern

```python
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from config.settings import Config

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    from .extensions import db, migrate, jwt, cors

    # Register blueprints
    from .api import api_bp
    from .api.users import users_bp
    app.register_blueprint(api_bp)
    app.register_blueprint(users_bp)

    # Error handling
    from .exceptions import register_error_handlers
    register_error_handlers(app)

    return app
```

### Configuration Classes

```python
# config/settings.py
import os

class Config:
    DEBUG = False
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///app.db')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False

class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_ECHO = True
    SQLALCHEMY_TRACK_MODIFICATIONS = True

class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')

    @staticmethod
    def init_app(app):
        from .extensions import init_db_for_production
        init_db_for_production(app)
```

## REST API Design

### Resource-Based Routes

```python
# api/users.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

users_bp = Blueprint('users', __name__)

@users_bp.route('/', methods=['GET'])
def get_users():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    users = User.query.paginate(page=page, per_page=per_page)
    return jsonify({
        'data': [user.to_dict() for user in users.items],
        'total': users.total,
        'page': page,
        'per_page': per_page
    })

@users_bp.route('/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())

@users_bp.route('/', methods=['POST'])
def create_user():
    data = request.get_json()

    user = User(
        email=data.get('email'),
        password=bcrypt.generate_password_hash(data.get('password'))
    )

    db.session.add(user)
    db.session.commit()

    return jsonify(user.to_dict()), 201

@users_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    current_user = get_jwt_identity()

    if current_user['id'] != user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()

    user.email = data.get('email', user.email)
    if 'password' in data:
        user.password = bcrypt.generate_password_hash(data['password'])

    db.session.commit()

    return jsonify(user.to_dict())
```

### Request Validation

```python
# utils/validation.py
from functools import wraps
from flask import request, jsonify

def validate_json(schema):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if not request.is_json:
                return jsonify({'error': 'Content-Type must be application/json'}), 400

            data = request.get_json()
            errors = schema.validate(data)

            if errors:
                return jsonify({'error': 'Validation failed', 'details': errors}), 400

            return f(*args, **kwargs)
        return wrapper

    return decorator

# Example usage
from marshmallow import Schema, fields, validate

class UserSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=Length(min=8))
    name = fields.Str(validate=Length(max=100))

@api.route('/users', methods=['POST'])
@validate_json(UserSchema())
def create_user():
    data = request.get_json()
    # Process data
    return jsonify({'message': 'User created'})
```

## Database Models

### SQLAlchemy Models

```python
# models/__init__.py
from app import db
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import bcrypt

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(128), nullable=False)
    first_name = db.Column(db.String(50), nullable=True)
    last_name = db.Column(db.String(50), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password)

    def check_password(self, password):
        return bcrypt.check_password_hash(password, self.password_hash)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }
```

### Relationships

```python
# models/__init__.py
from app import db

class Post(db.Model):
    __tablename__ = 'posts'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    author = db.relationship('User', backref='posts', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'created_at': self.created_at.isoformat(),
        }
```

## Jinja2 Templates

### Base Template

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{% block title %}My App</title>
    <link rel="stylesheet" href="{{ url_for('static', filename='style.css') }}" />
  </head>
  <body>
    <header>
      <nav>
        <a href="{{ url_for('main.index') }}">Home</a>
        <a href="{{ url_for('main.about') }}">About</a>
      </nav>
    </header>

    <main>{% block content %}{% endblock %}</main>

    <footer>
      <p>&copy; 2024 My App</p>
    </footer>
  </body>
</html>
```

### Template Inheritance

```html
<!-- templates/users.html -->
{% extends "base.html" %} {% block title %}Users - {% endblock %} {% block content %}
<div class="users-list">
  <h1>Users</h1>

  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Email</th>
        <th>Name</th>
        <th>Created</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {% for user in users %}
      <tr>
        <td>{{ user.id }}</td>
        <td>{{ user.email }}</td>
        <td>{{ user.first_name or '' }} {{ user.last_name or '' }}</td>
        <td>{{ user.created_at.strftime('%Y-%m-%d %H:%M') }}</td>
        <td>
          <a href="{{ url_for('users.get_user', user_id=user.id) }}">View</a>
          <a href="{{ url_for('users.delete_user', user_id=user.id) }}" onclick="return confirm('Are you sure?')"
            >Delete</a
          >
        </td>
      </tr>
      {% endfor %}
    </tbody>
  </table>
</div>
{% endblock %}
```

## Flask Extensions

### Authentication with JWT

```python
# extensions/jwt.py
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
)
from datetime import timedelta
from app import create_app

jwt = JWTManager()

def init_jwt(app):
    app.config['JWT_SECRET_KEY'] = app.config['SECRET_KEY']
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=7)

    @jwt.user_identity_loader
    def load_user(user_id):
        from models import User
        return User.query.get(user_id)

# Usage in routes
from extensions.jwt import jwt_required, get_jwt_identity

@api.route('/protected')
@jwt_required()
def protected_route():
    current_user = get_jwt_identity()
    return jsonify({'user_id': current_user.id, 'email': current_user.email})
```

### CORS

```python
# extensions/cors.py
from flask_cors import CORS

def init_cors(app):
    cors = CORS(
        app,
        resources={
            r"/api/*": {
                "origins": ["http://localhost:3000", "https://example.com"],
                "methods": ["GET", "POST", "PUT", "DELETE"],
                "allow_headers": ["Content-Type", "Authorization"],
            }
        },
    )
    return cors
```

### Database Initialization

```python
# extensions/db.py
from flask_sqlalchemy import SQLAlchemy
from app import create_app

db = SQLAlchemy()

def init_db(app):
    with app.app_context():
        db.create_all()
```

## Error Handling

### Custom Exceptions

```python
# exceptions.py
class APIError(Exception):
    def __init__(self, message, status_code=400, payload=None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.payload = payload

class NotFoundError(APIError):
    def __init__(self, message, payload=None):
        super().__init__(message, 404, payload)

class ValidationError(APIError):
    def __init__(self, message, payload=None):
        super().__init__(message, 400, payload)
```

### Error Handlers

```python
# exceptions.py
from flask import jsonify
from .exceptions import APIError

def register_error_handlers(app):
    @app.errorhandler(APIError)
    def handle_api_error(error):
        response = {
            'error': error.message,
            'status': 'error',
        }
        if error.payload:
            response['details'] = error.payload

        return jsonify(response), error.status_code

    @app.errorhandler(404)
    def handle_not_found(error):
        return jsonify({'error': 'Resource not found'}), 404

    @app.errorhandler(500)
    def handle_internal_error(error):
        app.logger.error(f'Internal error: {error}')
        return jsonify({'error': 'Internal server error'}), 500
```

## Performance

### Database Query Optimization

```python
# models/user.py
from app import db

class User(db.Model):
    # ... fields ...

    @staticmethod
    def get_active_users():
        # ✅ Good - Indexed query
        return User.query.filter_by(is_active=True).all()

    @staticmethod
    def get_user_by_email(email):
        # ✅ Good - Using index
        return User.query.filter_by(email=email).first()

    @staticmethod
    def get_users_with_posts():
        # ✅ Good - Eager loading with joinedload
        from sqlalchemy.orm import joinedload

        return User.query.options(
            joinedload('posts')
        ).all()
```

### Connection Pooling

```python
# config/settings.py
class ProductionConfig:
    SQLALCHEMY_ENGINE = 'postgresql'
    SQLALCHEMY_POOL_SIZE = 20
    SQLALCHEMY_MAX_OVERFLOW = 10
    SQLALCHEMY_POOL_RECYCLE = 3600
    SQLALCHEMY_POOL_PRE_PING = 60
```

## Security

### Input Validation

```python
# utils/validation.py
from marshmallow import Schema, fields, validates, ValidationError

class UserCreateSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=Length(min=8, max=128))
    first_name = fields.Str(validate=Length(max=50))
    last_name = fields.Str(validate=Length(max=50))

    @validates('password')
    def validate_password(self, value):
        if not any(c.isupper() for c in value):
            raise ValidationError('Password must contain at least one uppercase letter')
        if not any(c.isdigit() for c in value):
            raise ValidationError('Password must contain at least one digit')
        if not any(c.islower() for c in value):
            raise ValidationError('Password must contain at least one lowercase letter')
```

### Password Hashing

```python
from app import db
import bcrypt

def hash_password(password):
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode(), salt)
    return hashed

def check_password(password, hashed):
    return bcrypt.checkpw(password.encode(), hashed)
```

## Testing

### Unit Tests

```python
# tests/unit/test_user_model.py
import pytest
from app import create_app
from models import User

@pytest.fixture
def app():
    return create_app()

def test_create_user(app):
    with app.app_context():
        user = User(
            email='test@example.com',
            password='hashed_password'
        )
        db.session.add(user)
        db.session.commit()

        assert user.id is not None
        assert user.email == 'test@example.com'

def test_user_to_dict(app):
    with app.app_context():
        user = User(
            email='test@example.com',
            first_name='Test'
        )

        result = user.to_dict()
        assert result['email'] == 'test@example.com'
        assert 'first_name' in result
```

### Integration Tests

```python
# tests/integration/test_api.py
import pytest
from app import create_app

@pytest.fixture
def client():
    return create_app().test_client()

def test_create_user(client):
    response = client.post('/api/users', json={
        'email': 'test@example.com',
        'password': 'Password123'
    })

    assert response.status_code == 201
    assert 'email' in response.json

def test_get_users(client):
    response = client.get('/api/users')

    assert response.status_code == 200
    assert 'data' in response.json
```

## Best Practices

### DO

- Use application factory pattern
- Organize routes into blueprints
- Use environment-specific configuration
- Implement proper error handling
- Use Flask extensions for common tasks
- Validate all user inputs
- Use SQLAlchemy ORM effectively
- Write unit and integration tests
- Use connection pooling in production
- Keep sensitive data in environment variables
- Use HTTPS in production

### DON'T

- Create global app instance
- Hardcode configuration values
- Skip input validation
- Use raw SQL queries without ORM
- Return database models directly (use to_dict())
- Ignore error handling
- Store passwords in plain text
- Skip tests
- Use deprecated Flask features
- Mix business logic with data access in routes

## Anti-patterns

1. **Global State** - Using global app or db instances
2. **No Validation** - Trusting all user input without validation
3. **SQL Injection** - Using raw SQL with string formatting
4. **No Error Handling** - Letting exceptions propagate
5. **Monolithic Routes** - All routes in one file instead of blueprints
6. **Hardcoded Secrets** - Committing API keys or passwords to code
7. **Missing Tests** - No unit or integration tests
8. **Synchronous Operations** - Blocking requests with slow operations
9. **No Pagination** - Returning all results without limits
10. **Poor Separation of Concerns** - Business logic in routes

## Production Deployment

### Gunicorn WSGI

```python
# gunicorn_config.py
import multiprocessing

workers = multiprocessing.cpu_count() * 2 + 1
bind = '0.0.0.0:8000'
worker_class = 'sync'
worker_connections = 1000
timeout = 30
keepalive = 5
max_requests = 1000
max_requests_jitter = 50
preload_app = True
```

### Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN pip install .

EXPOSE 8000

CMD ["gunicorn", "-c", "gunicorn_config.py", "run:app"]
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
      - FLASK_ENV=production
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: secretpassword
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

## Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [Flask-SQLAlchemy](https://flask-sqlalchemy.palletsprojects.com/)
- [Flask-JWT-Extended](https://flask-jwt-extended.readthedocs.io/)
- [Flask-CORS](https://flask-cors.readthedocs.io/)
- [Marshmallow](https://marshmallow.readthedocs.io/)
- [Pytest Documentation](https://docs.pytest.org/)
