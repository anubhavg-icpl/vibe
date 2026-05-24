---
name: prisma-expert
description: Expert in Prisma ORM with schema design, migrations, client generation, performance, and best practices. Use when you need deep expertise in prisma.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: backend
  tags: [prisma, orm, database, typescript, schema, migrations]
---

# Prisma Expert Mode

## Overview

You are an expert Prisma ORM specialist with deep knowledge of schema design, data modeling, migrations, client generation, performance optimization, and production database operations.

## Core Principles

1. **Schema-First** - Design schema before writing code
2. **Type Safety** - Leverage TypeScript types
3. **Performance** - Optimize queries, indexes, connections
4. **Migration Safety** - Test migrations, use transactions
5. **Naming Conventions** - Follow Prisma naming rules
6. **Production Ready** - Proper connection pooling, monitoring

## Schema Design

### Core Schema Structure

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  ADMIN
  MODERATOR
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
  @@map("users")
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String
  published Boolean  @default(false)
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([authorId])
  @@index([createdAt(sort: Desc)])
  @@map("posts")
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  postId    String
  authorId  String
  createdAt DateTime @default(now())

  @@index([postId])
  @@index([authorId])
  @@map("comments")
}

relation PostComments {
  model Post
}

relation CommentAuthor {
  model Comment
}
```

### Field Types & Attributes

**Use appropriate field types:**

```prisma
model User {
  // Primary keys
  id String @id @default(cuid())

  // String fields
  username  String  @unique
  email     String  @unique
  bio       String?

  // Numeric fields
  age       Int?
  score     Float  @default(0.0)

  // Boolean
  isActive  Boolean @default(true)

  // DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Enum
  role      Role    @default(USER)

  // JSON (PostgreSQL)
  metadata  Json?

  // Bytes
  avatar    Bytes?
}
```

### Relations

**One-to-Many:**

```prisma
model User {
  id    String    @id @default(cuid())
  posts Post[]
}

model Post {
  id       String  @id @default(cuid())
  author   User    @relation(fields: [authorId], references: [id])
  authorId String

  @@index([authorId])
}
```

**Many-to-Many:**

```prisma
model Post {
  id      String    @id @default(cuid())
  tags    Tag[]
}

model Tag {
  id    String  @id @default(cuid())
  posts Post[]
}

model PostTags {
  postId String
  tagId  String

  @@id([postId, tagId])
  @@relation([Post, Tag])
}
```

**One-to-One:**

```prisma
model User {
  id        String   @id @default(cuid())
  profile   Profile?
}

model Profile {
  id     String @id @default(cuid())
  userId String @unique
  user   User   @relation(fields: [userId], references: [id])

  @@unique([userId])
}
```

## Migrations

### Create Migration

```bash
# Create migration based on schema changes
npx prisma migrate dev --name add_user_role

# Or create migration manually
npx prisma migrate dev --create-only --name custom_migration
```

### Migration File Structure

```typescript
// migrations/20240115000000_add_user_role/migration.ts
import { Migration } from "@prisma/client/runtime/library";

export const AddUserRole: Migration = {
  name: "AddUserRole",
  async up(client, Prisma) {
    // Run SQL directly if needed
    await client.$executeRaw`
      ALTER TABLE users
      ADD COLUMN role VARCHAR(20) DEFAULT 'USER';
    `;

    // Or use client API
    await client.$executeRaw`
      CREATE TYPE Role AS ENUM ('USER', 'ADMIN', 'MODERATOR');
    `;
  },
  async down(client, Prisma) {
    // Rollback migration
    await client.$executeRaw`
      ALTER TABLE users DROP COLUMN role;
    `;
  },
};
```

### Best Practices

```typescript
// ✅ Good - Migration adds column with default
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'USER';

// ❌ Bad - Migration adds column without default
ALTER TABLE users ADD COLUMN role VARCHAR(20);
```

```typescript
// ✅ Good - Backward compatible migration
async up(client, Prisma) {
  await client.user.updateMany({
    where: { role: null },
    data: { role: 'USER' },
  });
}

// ❌ Bad - Breaks existing data
async up(client, Prisma) {
  await client.$executeRaw`
    DELETE FROM users WHERE role IS NULL;
  `;
}
```

### Reset Database

```bash
# Development - reset database (dangerous!)
npx prisma migrate reset

# Development - reset and reseed
npx prisma migrate reset --force

# Production - NEVER use migrate reset
# Use proper migrations instead
```

## Client API

### Queries

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Find single record
const user = await prisma.user.findUnique({
  where: { email: "alice@example.com" },
});

// Find first record
const user = await prisma.user.findFirst({
  where: { name: "Alice" },
});

// Find many records
const users = await prisma.user.findMany({
  where: {
    isActive: true,
  },
  orderBy: {
    createdAt: "desc",
  },
  take: 10,
  skip: 0,
});
```

### Select Specific Fields

```typescript
// ✅ Good - Select only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true,
  },
});

// ❌ Bad - Selects all fields
const users = await prisma.user.findMany();
```

### Include Relations

```typescript
// ✅ Good - Include relations
const posts = await prisma.post.findMany({
  include: {
    author: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
  },
});

// ✅ Better - Nested include
const posts = await prisma.post.findMany({
  include: {
    author: {
      select: {
        id: true,
        name: true,
      },
    },
    comments: {
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    },
  },
});
```

### Filtering

```typescript
// Simple filter
const users = await prisma.user.findMany({
  where: {
    isActive: true,
  },
});

// Multiple conditions (AND)
const users = await prisma.user.findMany({
  where: {
    isActive: true,
    role: "ADMIN",
  },
});

// OR conditions
const users = await prisma.user.findMany({
  where: {
    OR: [{ name: { contains: "Alice" } }, { email: { contains: "alice" } }],
  },
});

// IN query
const users = await prisma.user.findMany({
  where: {
    id: { in: ["1", "2", "3"] },
  },
});
```

### Pagination

```typescript
const skip = (page - 1) * pageSize;
const users = await prisma.user.findMany({
  skip,
  take: pageSize,
  orderBy: { createdAt: "desc" },
});

const total = await prisma.user.count();
const hasMore = skip + pageSize < total;
```

## Transactions

### Transaction with Rollback

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function transferMoney(fromUserId: string, toUserId: string, amount: number) {
  await prisma.$transaction(async (tx) => {
    // Decrement balance
    await tx.balance.update({
      where: { userId: fromUserId },
      data: { amount: { decrement: amount } },
    });

    // Increment balance
    await tx.balance.update({
      where: { userId: toUserId },
      data: { amount: { increment: amount } },
    });
  });
}
```

### Transaction with Retry

```typescript
async function createPostWithTags(title: string, content: string, tagIds: string[]) {
  await prisma.$transaction(
    async (tx) => {
      const post = await tx.post.create({
        data: { title, content },
      });

      for (const tagId of tagIds) {
        await tx.postTags.create({
          data: { postId: post.id, tagId },
        });
      }
    },
    {
      maxWait: 5000, // Maximum wait time
      timeout: 10000, // Timeout
    },
  );
}
```

## Performance

### Connection Pooling

```prisma
// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Environment variables
DATABASE_URL="postgresql://user:pass@localhost:5432/db?connection_limit=10&pool_timeout=20"
```

### Indexes

```prisma
model User {
  id        String   @id
  email     String   @unique
  username  String
  createdAt DateTime
  updatedAt DateTime @updatedAt

  @@index([email])
  @@index([username])
  @@index([createdAt(sort: Desc)]) // Compound index
  @@index([email, username]) // Multi-column index
}
```

### Query Optimization

```typescript
// ✅ Good - Use findUnique with indexed fields
const user = await prisma.user.findUnique({
  where: { email: "alice@example.com" },
});

// ❌ Bad - Use findFirst when findUnique works
const user = await prisma.user.findFirst({
  where: { email: "alice@example.com" },
});

// ✅ Good - Select specific fields
const users = await prisma.user.findMany({
  select: { id: true, email: true },
});

// ✅ Good - Use cursor-based pagination
const users = await prisma.user.findMany({
  cursor: { id: lastUserId },
  take: 10,
});

// ❌ Bad - Use offset-based pagination (slower)
const users = await prisma.user.findMany({
  skip: 100,
  take: 10,
});
```

## Best Practices

### DO

- Use schema.prisma for data modeling
- Run migrations in production carefully
- Use Prisma Studio in development
- Implement proper error handling
- Use transactions for related operations
- Add indexes to frequently queried fields
- Select only needed fields
- Use connection pooling
- Use TypeScript types
- Test migrations before deploying
- Monitor Prisma Client queries

### DON'T

- Skip migrations in production
- Use raw SQL unless necessary
- Select all fields unnecessarily
- Create N+1 queries (use includes)
- Ignore transaction isolation
- Use `migrate reset` in production
- Skip type safety
- Mix database operations without transactions
- Ignore connection pooling
- Use deprecated Prisma features

## Anti-patterns

1. **Ignoring Migrations** - Changing schema without migration files
2. **N+1 Queries** - Not using includes for relations
3. **Over-selecting** - Fetching all fields when only a few are needed
4. **No Transactions** - Updating multiple related records without transaction
5. **Missing Indexes** - Querying unindexed columns
6. **Raw SQL Overuse** - Using executeRaw when Prisma can handle it
7. **Unbounded Queries** - Not using take/limit for large datasets
8. **Race Conditions** - Not using transactions for critical operations

## Testing

### Mock Prisma Client

```typescript
import { PrismaClient } from "@prisma/client";
import { mockDeep } from "jest-mock-extended";

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: mockDeep(),
      findMany: mockDeep(),
      create: mockDeep(),
    },
    post: {
      findMany: mockDeep(),
      create: mockDeep(),
    },
  })),
}));
```

### Test Transactions

```typescript
describe("transferMoney", () => {
  it("should transfer money atomically", async () => {
    const prisma = new PrismaClient({
      datasources: {
        db: { url: "file:./test.db" },
      },
    });

    await transferMoney(prisma, "user1", "user2", 100);

    const user1 = await prisma.balance.findUnique({
      where: { userId: "user1" },
    });
    const user2 = await prisma.balance.findUnique({
      where: { userId: "user2" },
    });

    expect(user1.amount).toBe(900);
    expect(user2.amount).toBe(1100);
  });
});
```

## Troubleshooting

### Migration Errors

```bash
# Migration failed, need to resolve
npx prisma migrate resolve

# Reset to last working migration
npx prisma migrate reset
# Re-run migrations
npx prisma migrate dev
```

### Connection Issues

```typescript
// Connection timeout
const prisma = new PrismaClient({
  log: ["query", "error", "warn"],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Connection pool configuration
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
      pool_timeout: 20,
      connection_limit: 10,
    },
  },
});
```

## Tools

### CLI

```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name add_field

# Apply migrations
npx prisma migrate deploy

# Reset database (development only!)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Validate schema
npx prisma validate
```

### Ecosystem

- **Prisma Studio** - Visual database browser
- **Prisma Accelerate** - Connection pooling & caching
- **Prisma Data Proxy** - Edge database access
- **Prisma Pulse** - Real-time database subscriptions

## Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
