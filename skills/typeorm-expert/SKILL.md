---
name: typeorm-expert
description: Expert in TypeORM with TypeScript, entities, repositories, migrations, query building, and production best practices
risk: unknown
source: community
kind: mode
category: backend
tags: [typeorm, orm, database, typescript, backend]
---

# TypeORM Expert Mode

## Overview

You are an expert TypeORM specialist with deep knowledge of entity modeling, repositories, migrations, query building, relations, transactions, and production database operations.

## Core Principles

1. **Decorator-Based** - Use TypeORM decorators for entities
2. **Repository Pattern** - Use repository classes, not raw queries
3. **Type Safety** - Full TypeScript support
4. **Migration Strategy** - Version-controlled schema changes
5. **Connection Pooling** - Configure pool size properly
6. **Transaction Boundaries** - Keep transactions focused and short

## Basic Setup

### DataSource Configuration

```typescript
import { DataSource, DataSourceOptions } from "typeorm";
import "reflect-metadata";
import "dotenv/config";

dotenv.config();

const options: DataSourceOptions = {
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "mydb",

  // Connection pool
  synchronize: false, // Always false in production
  logging: process.env.NODE_ENV === "development",
  entities: [__dirname + "/entity/**/*.ts"],
  migrations: [__dirname + "/migration/**/*.ts"],
  subscribers: [__dirname + "/subscriber/**/*.ts"],

  // SSL
  ssl: process.env.DB_SSL === "true" ? true : false,

  // Extra
  extra: {
    max: process.env.DB_MAX_CONNECTIONS || "20",
  },
};

export const AppDataSource = new DataSource(options);
```

### Entity Definition

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
} from "typeorm";

@Entity("users")
@Index("email")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string; // Hashed, not plain

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ default: "user" })
  role: string = "user" | "admin" | "moderator";

  @CreateDateColumn({ name: "createdAt" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updatedAt" })
  updatedAt: Date;

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];
}

@Entity("posts")
@Index(["authorId", "createdAt"])
export class Post {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column("text")
  content: string;

  @Column({ default: false })
  published: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.posts)
  author: User;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];
}

@Entity("comments")
@Index("postId")
export class Comment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Post, (post) => post.comments)
  post: Post;
}
```

## Repository Pattern

### Base Repository

```typescript
import { EntityRepository } from "typeorm";
import { QueryRunner, DeepPartial } from "typeorm";

export abstract class BaseRepository<T> {
  constructor(protected repository: EntityRepository<T>) {}

  async findById(id: string): Promise<T | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(options: { skip?: number; take?: number } = {}): Promise<T[]> {
    return this.repository.find({
      skip: options.skip,
      take: options.take,
      order: { createdAt: "DESC" },
    });
  }

  async create(entity: DeepPartial<T>): Promise<T> {
    return this.repository.save(entity);
  }

  async update(id: string, updates: DeepPartial<T>): Promise<T | null> {
    const entity = await this.findById(id);
    if (!entity) return null;

    Object.assign(entity, updates);
    return this.repository.save(entity);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }
}
```

### Specific Repository

```typescript
import { EntityRepository, IsNull, MoreThanOr, In } from "typeorm";
import { User } from "../entity/User";

export class UserRepository {
  constructor(private readonly repository: EntityRepository<User>) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  async findActiveUsers(): Promise<User[]> {
    return this.repository.find({
      where: { role: In(["user", "moderator"]) },
      order: { createdAt: "DESC" },
    });
  }

  async searchByName(name: string): Promise<User[]> {
    return this.repository
      .createQueryBuilder("user")
      .where("user.firstName ILIKE :name OR user.lastName ILIKE :name")
      .getMany();
  }

  async findWithPosts(email: string): Promise<User | null> {
    return this.repository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.posts", "post")
      .where("user.email = :email", { email })
      .orderBy("user.createdAt", "DESC")
      .getOne();
  }
}
```

## Query Builder

### Basic Query

```typescript
import { EntityRepository } from "typeorm";
import { User } from "../entity/User";

export class UserRepository {
  constructor(private readonly repository: EntityRepository<User>) {}

  async findUsersByRole(role: string): Promise<User[]> {
    return this.repository
      .createQueryBuilder("user")
      .where("user.role = :role")
      .setParameter("role", role)
      .orderBy("user.createdAt", "DESC")
      .getMany();
  }

  async findUsersCreatedAfter(date: Date): Promise<User[]> {
    return this.repository
      .createQueryBuilder("user")
      .where("user.createdAt > :date")
      .setParameter("date", date)
      .getMany();
  }
}
```

### Complex Query with Joins

```typescript
async function findPostsWithAuthorsAndComments() {
  return AppDataSource.getRepository(Post)
    .createQueryBuilder("post")
    .leftJoinAndSelect("post.author", "user")
    .leftJoinAndSelect("post.comments", "comment")
    .where("post.published = :published")
    .setParameter("published", true)
    .orderBy("post.createdAt", "DESC")
    .select(["post.id", "post.title", "user.id", "user.email", "COUNT(comment.id) as commentCount"])
    .limit(10)
    .getRawMany();
}
```

### Raw Queries

```typescript
import { AppDataSource } from "../data-source";

export class UserRepository {
  async findActiveUsersCount(): Promise<number> {
    const result = await AppDataSource.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE role IN ('user', 'moderator')
    `);

    return result[0]?.count || 0;
  }

  async updateUserLastLogin(id: string, date: Date): Promise<void> {
    await AppDataSource.query(
      `
      UPDATE users
      SET last_login = $1
      WHERE id = $2
    `,
      [date, id],
    );
  }
}
```

## Migrations

### Migration File

```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersTable0000000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "users",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "uuid",
          },
          {
            name: "email",
            type: "varchar",
            length: "255",
            isUnique: true,
          },
          {
            name: "first_name",
            type: "varchar",
            length: "150",
            isNullable: true,
          },
          {
            name: "last_name",
            type: "varchar",
            length: "150",
            isNullable: true,
          },
          {
            name: "password",
            type: "varchar",
            length: "255",
          },
          {
            name: "role",
            type: "enum",
            enum: ["user", "admin", "moderator"],
            default: "user",
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "now()",
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("users");
  }
}
```

### Migration with Data

```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedUsers0000000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.connection
      .createQueryBuilder()
      .insert()
      .into("users")
      .values([
        {
          email: "admin@example.com",
          password: await hashPassword("securePassword123"),
          role: "admin",
        },
        {
          email: "user@example.com",
          password: await hashPassword("userPassword123"),
          role: "user",
        },
      ])
      .execute();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM users WHERE email IN ('admin@example.com', 'user@example.com')`);
  }

  private async hashPassword(password: string): Promise<string> {
    const bcrypt = require("bcryptjs");
    return bcrypt.hash(password, 10);
  }
}
```

## Relations

### One-to-Many

```typescript
@Entity("posts")
export class Post {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  // Eager loading (not recommended)
  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  // Lazy loading (recommended)
  @OneToMany(() => Comment, (comment) => comment.post)
  comments!: Comment[];
}

@Entity("comments")
export class Comment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  content: string;

  // Lazy loading
  @ManyToOne(() => Post, (post) => post.comments)
  post!: Post;
}
```

### Many-to-Many

```typescript
@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  email: string;

  // Many-to-many with join table
  @ManyToMany(() => Role, (role) => role.users)
  roles: Role[];
}

@Entity("roles")
export class Role {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  name: string;

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];
}

// Join table automatically managed by TypeORM
```

### One-to-One

```typescript
@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  // Eager loading
  @OneToOne(() => Profile, (profile) => profile.user)
  profile: Profile;

  // Lazy loading (recommended)
  @OneToOne(() => Profile, (profile) => profile.user, {
    lazy: true,
    cascade: ["insert", "update"],
  })
  profile!: Profile;
}

@Entity("profiles")
export class Profile {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  bio: string;

  @OneToOne(() => User, (user) => user.profile)
  user: User;
}
```

## Transactions

### Simple Transaction

```typescript
import { AppDataSource } from "../data-source";

export class UserService {
  async transferMoney(fromUserId: string, toUserId: string, amount: number): Promise<void> {
    await AppDataSource.transaction(async (manager) => {
      const user1 = await manager.findOne(User, { where: { id: fromUserId } });
      const user2 = await manager.findOne(User, { where: { id: toUserId } });

      if (!user1 || !user2) {
        throw new Error("User not found");
      }

      user1.balance = (user1.balance || 0) - amount;
      user2.balance = (user2.balance || 0) + amount;

      await manager.save([user1, user2]);
    });
  }
}
```

### Transaction with QueryRunner

```typescript
import { AppDataSource } from "../data-source";

export class UserService {
  async createPostWithComments(postTitle: string, commentsText: string[]): Promise<void> {
    await AppDataSource.transaction(async (manager) => {
      // Create post
      const post = manager.create(Post, {
        title: postTitle,
      });

      const savedPost = await manager.save(post);

      // Create comments
      for (const text of commentsText) {
        await manager.save(Comment, {
          content: text,
          post: savedPost,
        });
      }
    });
  }
}
```

## Best Practices

### DO

- Use decorators for entities (@Entity, @Column, etc.)
- Create repository classes for data access
- Use QueryBuilder for complex queries
- Use lazy loading for relations
- Use transactions for multi-step operations
- Keep migrations version-controlled
- Use connection pooling
- Set synchronize to false in production
- Use proper types for entities
- Add indexes for frequently queried fields
- Write migration down methods for rollback

### DON'T

- Use raw queries when QueryBuilder works
- Use synchronize: true in production
- Create huge migrations (break them up)
- Skip down methods in migrations
- Use eager loading for all relations
- Mix business logic with data access
- Create transactions that are too long
- Hardcode connection strings
- Ignore query performance
- Use @OneToMany without proper indexes
- Create entities without primary keys

## Anti-patterns

1. **God Entities** - Entities with too many columns and relations
2. **No Repositories** - Directly using EntityManager everywhere
3. **Raw SQL Overuse** - Using QueryRunner when ORM works
4. **Missing Indexes** - Not indexing foreign keys and frequently queried columns
5. **Huge Transactions** - Transactions that take too long or do too much
6. **Circular Dependencies** - Entities with circular relations
7. **Synchronize: true** - In production (causes schema drift)
8. **No Relations** - Using @OneToMany on both sides
9. **Missing Migrations** - Changing schema without migration files
10. **N+1 Queries** - Fetching related data one-by-one instead of using joins

## Performance Optimization

### Select Optimization

```typescript
// ✅ Good - Select only needed fields
const users = await userRepository
  .createQueryBuilder("user")
  .select(["user.id", "user.email", "user.firstName"])
  .getMany();

// ❌ Bad - Select all fields
const users = await userRepository.find();
```

### Eager vs Lazy Loading

```typescript
// ✅ Good - Lazy loading (fetch when needed)
@Entity("users")
export class User {
  @OneToMany(() => Post, (post) => post.user, {
    lazy: true, // Lazy by default
  })
  posts: Post[];
}

// ❌ Bad - Eager loading (fetches everything)
@Entity("users")
export class User {
  @OneToMany(() => Post, (post) => post.user, {
    eager: true,
  })
  posts: Post[];
}
```

### Pagination

```typescript
// Offset pagination (simple)
const page1 = await userRepository.find({
  skip: 0,
  take: 20,
  order: { createdAt: "DESC" },
});

// Keyset pagination (faster for large datasets)
const page2 = await userRepository.find({
  skip: 20,
  take: 20,
  where: { id: MoreThan(lastId) }, // Keyset pagination
  order: { createdAt: "DESC" },
});
```

## Testing

### Unit Tests

```typescript
import { describe, it, expect, beforeEach } from "@jest/globals";
import { UserRepository } from "../repository/UserRepository";
import { User } from "../entity/User";
import { getRepository, Repository } from "typeorm";

describe("UserRepository", () => {
  let repository: Repository<User>;
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: "sqlite",
      database: ":memory:",
      entities: [User],
      synchronize: true,
    });

    repository = dataSource.getRepository(User);
    await dataSource.synchronize();
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  it("should find user by email", async () => {
    const userRepo = new UserRepository(repository);
    const user = await userRepo.findByEmail("test@example.com");

    expect(user).toBeDefined();
    expect(user.email).toBe("test@example.com");
  });

  it("should create user", async () => {
    const userRepo = new UserRepository(repository);
    const newUser = await userRepo.create({
      email: "new@example.com",
      password: "hashedPassword",
      firstName: "New",
      role: "user",
    });

    expect(newUser.id).toBeDefined();
    expect(newUser.email).toBe("new@example.com");
  });
});
```

### Integration Tests

```typescript
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken, Repository } from "typeorm";
import { User } from "../entity/User";

describe("UserService Integration", () => {
  let userRepo: Repository<User>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "sqlite",
          database: ":memory:",
          entities: [User],
          synchronize: true,
        }),
      ],
    }).compile();

    userRepo = module.get(getRepositoryToken(User));
  });

  it("should create and find user", async () => {
    const createdUser = await userRepo.save({
      email: "integration@example.com",
      password: "hashedPassword",
      role: "user",
    });

    const foundUser = await userRepo.findOne({
      where: { id: createdUser.id },
    });

    expect(foundUser).toEqual(createdUser);
  });
});
```

## Subscribers

### Before Insert Subscriber

```typescript
import { EntitySubscriberInterface, InsertEvent, DataSource } from "typeorm";

export class UserSubscriber implements EntitySubscriberInterface<User> {
  constructor(private dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  beforeInsert(event: InsertEvent<User>) {
    console.log("About to insert user:", event.entity);

    // Set default values
    if (!event.entity.createdAt) {
      event.entity.createdAt = new Date();
    }

    if (!event.entity.role) {
      event.entity.role = "user";
    }
  }
}
```

## Resources

- [TypeORM Documentation](https://typeorm.io/)
- [TypeORM Select Query Builder](https://typeorm.io/select-query-builder)
- [TypeORM Relations](https://typeorm.io/relations)
- [TypeORM Migrations](https://typeorm.io/migrations)
- [TypeORM Performance](https://typeorm.io/performance-optimization)
