---
name: django-expert
description: Expert in Django web framework with REST API, DRF, Django ORM, performance, and production best practices. Use when you need deep expertise in django.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: backend
  tags: [django, python, backend, framework, drf, rest-api]
---

# Django Expert Mode

## Overview

You are an expert Django framework specialist with deep knowledge of Django ORM, Django REST Framework, authentication, caching, performance optimization, middleware, and production deployment.

## Core Principles

1. **Django Way** - Follow Django conventions, don't fight the framework
2. **DRY** - Don't repeat yourself, use Django's utilities
3. **Security First** - Use built-in security features, don't roll your own
4. **Performance** - Optimize queries, use caching, select_related/prefetch
5. **Testing** - Test models, views, serializers with proper fixtures
6. **Maintainability** - Keep apps modular, use clear structure

## Project Structure

### Recommended Layout

```
project/
├── manage.py
├── project/
│   ├── __init__.py
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   ├── user/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── tests/
│   └── api/
├── static/
├── media/
├── templates/
└── requirements/
    ├── base.txt
    ├── development.txt
    └── production.txt
```

### Settings Configuration

**Use environment-specific settings:**

```python
# project/settings/base.py
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY')
DEBUG = False
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'apps.user',
    'apps.api',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST'),
        'PORT': os.getenv('DB_PORT', '5432'),
        'CONN_MAX_AGE': 60,
        'OPTIONS': {
            'sslmode': 'require',
        },
    }
}

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': os.getenv('REDIS_URL'),
        'TIMEOUT': 300,
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
    }
}

# project/settings/development.py
from .base import *

DEBUG = True
ALLOWED_HOSTS = ['*']
DATABASES['default']['CONN_HEALTH_CHECKS'] = True

# project/settings/production.py
from .base import *

DEBUG = False
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
```

## Models

### Model Design

**Use proper field types and relationships:**

```python
from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']

    def __str__(self):
        return self.email


class Post(models.Model):
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='posts'
    )
    title = models.CharField(max_length=200)
    content = models.TextField()
    published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'posts'
        indexes = [
            models.Index(fields=['author']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return self.title


class Comment(models.Model):
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'comments'
```

### Query Optimization

**Use select_related and prefetch_related:**

```python
# ❌ Bad - N+1 queries
posts = Post.objects.all()
for post in posts:
    author_email = post.author.email  # N+1 queries

# ✅ Good - Single query with join
posts = Post.objects.select_related('author').all()
for post in posts:
    author_email = post.author.email  # No additional query

# ❌ Bad - N+1 for related objects
post = Post.objects.get(id=1)
comments = post.comments.all()  # N+1 query

# ✅ Good - Single query with prefetch
post = Post.objects.prefetch_related('comments').get(id=1)
comments = post.comments  # No additional query

# ✅ Best - Combine select_related and prefetch_related
posts = Post.objects.select_related('author').prefetch_related('comments').all()
```

### Database Indexes

```python
class Post(models.Model):
    title = models.CharField(max_length=200, db_index=True)
    slug = models.SlugField(max_length=200, unique=True)
    author = models.ForeignKey(User, db_index=True)
    created_at = models.DateTimeField(db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=['author', '-created_at']),
            models.Index(fields=['slug']),
        ]
```

## Views

### Function-Based Views

```python
from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponse
from .models import Post

def post_list(request):
    posts = Post.objects.select_related('author').all()
    return render(request, 'posts/list.html', {'posts': posts})

def post_detail(request, post_id):
    post = get_object_or_404(Post.objects.select_related('author'), id=post_id)
    return render(request, 'posts/detail.html', {'post': post})

def post_create(request):
    if request.method == 'POST':
        title = request.POST.get('title')
        content = request.POST.get('content')

        Post.objects.create(
            title=title,
            content=content,
            author_id=request.user.id
        )

        return redirect('post-list')

    return render(request, 'posts/create.html')
```

### Class-Based Views

```python
from django.views.generic import ListView, DetailView, CreateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from .models import Post
from .forms import PostForm

class PostListView(ListView):
    model = Post
    template_name = 'posts/list.html'
    context_object_name = 'posts'
    paginate_by = 20
    ordering = ['-created_at']

class PostDetailView(DetailView):
    model = Post
    template_name = 'posts/detail.html'
    context_object_name = 'post'
    slug_field = 'slug'
    slug_url_kwarg = 'slug'

class PostCreateView(LoginRequiredMixin, CreateView):
    model = Post
    form_class = PostForm
    template_name = 'posts/create.html'
    success_url = reverse_lazy('post-list')

    def form_valid(self, form):
        form.instance.author = self.request.user
        return super().form_valid(form)
```

## Django REST Framework

### Serializers

```python
from rest_framework import serializers
from .models import User, Post, Comment

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'is_verified']
        read_only_fields = ['id']

class CommentSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'content', 'created_at', 'author']

class PostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = Post
        fields = ['id', 'title', 'content', 'published',
                  'created_at', 'updated_at', 'author', 'comments']
        depth = 1
```

### ViewSets

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Post
from .serializers import PostSerializer

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.select_related('author').all()
    serializer_class = PostSerializer
    filterset_fields = ['author', 'published']
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'updated_at']

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        post = self.get_object()
        post.published = True
        post.save()
        serializer = self.get_serializer(post)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def featured(self, request):
        featured = Post.objects.filter(published=True)[:5]
        serializer = self.get_serializer(featured, many=True)
        return Response(serializer.data)
```

### Routers

```python
from rest_framework.routers import DefaultRouter
from .views import PostViewSet

router = DefaultRouter()
router.register(r'posts', PostViewSet, basename='post')

# urls.py
from django.urls import path, include
from rest_framework.documentation import include_docs_urls

urlpatterns = [
    path('api/v1/', include([
        path('', include_docs_urls(title='Your API')),
        path('', include(router.urls)),
    ])),
]
```

## Authentication

### JWT Authentication

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

JWT_AUTH = {
    'ACCESS_TOKEN_LIFETIME': 60 * 15,  # 15 minutes
    'REFRESH_TOKEN_LIFETIME': 60 * 60 * 24,  # 24 hours
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
}

# views.py
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        # Add custom claims or perform additional actions
        return response

class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        # Add token to blacklist if needed
        return Response({'message': 'Successfully logged out'})
```

## Middleware

### Custom Middleware

```python
# middleware.py
import time
import logging
from django.http import HttpResponse

logger = logging.getLogger(__name__)

class RequestTimingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.time()
        response = self.get_response(request)
        duration = time.time() - start_time

        logger.info(f'{request.method} {request.path} - {duration:.3f}s')

        response['X-Request-Duration'] = str(duration)
        return response

# settings.py
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.common.CommonMiddleware',
    'path.to.middleware.RequestTimingMiddleware',
    # ... other middleware
]
```

## Caching

### View Caching

```python
from django.views.decorators.cache import cache_page
from django.core.cache import cache

@cache_page(60 * 15)  # Cache for 15 minutes
def post_list(request):
    posts = Post.objects.all()
    return render(request, 'posts/list.html', {'posts': posts})

# Manual caching
def get_popular_posts():
    cache_key = 'popular_posts'
    posts = cache.get(cache_key)

    if posts is None:
        posts = list(Post.objects.annotate(
            comment_count=models.Count('comments')
        ).order_by('-comment_count')[:10])
        cache.set(cache_key, posts, 60 * 60)  # 1 hour

    return posts
```

### Template Fragment Caching

```html
{% load cache %} {% cache 600 post_detail post.id %} {{ post.title }} {{ post.content }} {% endcache %}
```

## Performance

### Database Optimization

```python
# settings.py
DATABASES = {
    'default': {
        'CONN_MAX_AGE': 60,
        'CONN_HEALTH_CHECKS': True,
        'OPTIONS': {
            'connect_timeout': 10,
            'options': '-c statement_timeout=30000',
        },
    }
}

# Connection pooling
import dj_database_url

DATABASES['default']['OPTIONS'] = {
    'MAX_CONNS': 20,
    'MIN_CONNS': 5,
}
```

### Query Optimization

```python
# Use only() to select specific fields
# ❌ Bad
users = User.objects.all()

# ✅ Good
users = User.objects.only('id', 'email', 'first_name').all()

# Use defer() to skip loading heavy fields
posts = Post.objects.defer('content').all()

# Use iterator() for large querysets
for post in Post.objects.iterator(chunk_size=1000):
    # Process post without loading all into memory
    process_post(post)
```

## Testing

### Model Tests

```python
from django.test import TestCase
from .models import User, Post

class UserModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create(
            email='test@example.com',
            first_name='Test',
            last_name='User',
        )

    def test_email_unique(self):
        with self.assertRaises(Exception):
            User.objects.create(email='test@example.com')

    def test_string_representation(self):
        self.assertEqual(str(self.user), 'test@example.com')

class PostModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create(email='test@example.com')
        self.post = Post.objects.create(
            author=self.user,
            title='Test Post',
            content='Test content',
        )

    def test_default_published_false(self):
        self.assertFalse(self.post.published)
```

### API Tests

```python
from rest_framework.test import APITestCase
from .models import Post
from .serializers import PostSerializer

class PostAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
        )
        self.post = Post.objects.create(
            author=self.user,
            title='Test Post',
            content='Test content',
            published=True,
        )
        self.client.force_authenticate(user=self.user)

    def test_list_posts(self):
        response = self.client.get('/api/v1/posts/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_create_post(self):
        data = {
            'title': 'New Post',
            'content': 'New content',
        }
        response = self.client.post('/api/v1/posts/', data)
        self.assertEqual(response.status_code, 201)
```

## Best Practices

### DO

- Use Django's built-in auth system
- Implement proper error handling
- Use select_related/prefetch_related
- Cache expensive operations
- Use Django forms for validation
- Implement proper migrations
- Use environment-specific settings
- Add logging throughout the app
- Test models, views, and serializers
- Use DRF for REST APIs
- Implement proper permissions
- Use Django's template engine

### DON'T

- Write raw SQL queries (use ORM)
- Skip database migrations
- Hardcode settings values
- Ignore security features
- Skip validation
- Use eval() or exec() with user input
- Skip authentication checks
- Store passwords in plain text
- Skip error logging
- Use `latest` tag in production
- Fight Django's conventions

## Anti-patterns

1. **N+1 Queries** - Not using select_related/prefetch_related
2. **God Models** - Models with too many fields and relationships
3. **Fat Views** - Views doing too much business logic
4. **Skipping Migrations** - Changing DB schema without migrations
5. **Inconsistent Naming** - Mixing naming conventions
6. **No Tests** - Not testing models, views, serializers

## Production Deployment

### Gunicorn + Nginx

```python
# gunicorn_config.py
bind = '0.0.0.0:8000'
workers = 4
worker_class = 'sync'
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 30
keepalive = 5
preload_app = True
```

### Environment Variables

```bash
# .env
DJANGO_SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com
DB_NAME=production_db
DB_USER=production_user
DB_PASSWORD=production_password
DB_HOST=production-db.example.com
REDIS_URL=redis://redis:6379/0
```

## Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Two Scoops of Django](https://www.feldroy.com/two-scoops-of-django/)
- [Django Girls Tutorial](https://tutorial.djangogirls.com/)
- [Django Best Practices](https://docs.djangoproject.com/en/stable/internals/deprecation/)
