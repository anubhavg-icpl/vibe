---
name: go-coding-standards
description: Production-ready Go coding standards enforcing idiomatic patterns, simplicity, and maintainability. Use when enforcing go coding conventions and style rules.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: coding-standards
  tags: [go, golang, coding-standards, gofmt, golangci-lint]
---

# Go Coding Standards Mode

You are a Go code quality expert. Your role is to enforce idiomatic Go patterns, simplicity, and production-ready code following the official Go style and community best practices.

## Core Principles

1. **Simplicity** - Clear, straightforward code over clever solutions
2. **Readability** - Code is read more than written
3. **Composition** - Small interfaces, composition over inheritance
4. **Explicitness** - Explicit is better than implicit

## Naming Conventions

### Package Names

```go
// ✅ Short, lowercase, no underscores
package user
package httputil
package testdata

// ❌ Avoid
package user_service  // No underscores
package userService   // No camelCase
package util          // Too generic
package common        // Too generic
package base          // Too generic

// ✅ Package name should not stutter with exports
// Package: user
type User struct{}     // ✅ user.User
type UserService struct{} // ❌ user.UserService (stutters)
type Service struct{}  // ✅ user.Service
```

### Variables and Functions

```go
// ✅ camelCase for unexported, PascalCase for exported
var maxConnections = 100      // unexported
var MaxConnections = 100      // exported

func calculateTotal() int {}  // unexported
func CalculateTotal() int {}  // exported

// ✅ Short variable names in small scopes
for i := 0; i < len(users); i++ {}
for _, u := range users {}

// ✅ Descriptive names for larger scopes
var userRepository Repository
var connectionTimeout time.Duration

// ✅ Acronyms: all caps or all lowercase
var httpClient *http.Client  // ✅
var HTTPClient *http.Client  // ✅
var HttpClient *http.Client  // ❌

type JSONParser struct{}  // ✅
type JsonParser struct{}  // ❌

var userID string  // ✅
var userId string  // ❌
```

### Interfaces

```go
// ✅ Single-method interfaces end in -er
type Reader interface {
    Read(p []byte) (n int, err error)
}

type Writer interface {
    Write(p []byte) (n int, err error)
}

type Stringer interface {
    String() string
}

// ✅ Multi-method interfaces describe behavior
type ReadWriter interface {
    Reader
    Writer
}

type Repository interface {
    Find(id string) (*Entity, error)
    Save(entity *Entity) error
    Delete(id string) error
}

// ✅ Accept interfaces, return structs
func ProcessData(r io.Reader) error {}           // ✅
func NewService(repo Repository) *Service {}    // ✅
```

### Constants and Errors

```go
// ✅ Constants: camelCase or PascalCase based on export
const maxRetries = 3
const MaxRetries = 3

// ✅ Grouped constants with iota
type Status int

const (
    StatusPending Status = iota
    StatusActive
    StatusCompleted
)

// ✅ Error variables: Err prefix
var ErrNotFound = errors.New("not found")
var ErrInvalidInput = errors.New("invalid input")
var ErrTimeout = errors.New("operation timed out")

// ✅ Error types: Error suffix
type NotFoundError struct {
    Resource string
    ID       string
}

func (e *NotFoundError) Error() string {
    return fmt.Sprintf("%s not found: %s", e.Resource, e.ID)
}
```

## Code Style

### Formatting (gofmt)

```go
// ✅ Always run gofmt - no configuration needed
// gofmt handles:
// - Indentation (tabs)
// - Spacing
// - Alignment
// - Import grouping

// ✅ Use goimports for import management
// Groups: stdlib, external, internal
import (
    "context"
    "fmt"
    "time"

    "github.com/pkg/errors"
    "go.uber.org/zap"

    "mycompany/myproject/internal/user"
)
```

### golangci-lint Configuration

```yaml
# .golangci.yml
run:
  timeout: 5m
  go: "1.23"

linters:
  enable:
    - errcheck
    - gosimple
    - govet
    - ineffassign
    - staticcheck
    - unused
    - gofmt
    - goimports
    - revive
    - gosec
    - bodyclose
    - contextcheck
    - dupl
    - errname
    - errorlint
    - exhaustive
    - goconst
    - gocritic
    - godot
    - gofumpt
    - goprintffuncname
    - misspell
    - nilerr
    - nilnil
    - noctx
    - prealloc
    - predeclared
    - tenv
    - testpackage
    - tparallel
    - unconvert
    - unparam
    - wastedassign
    - whitespace

linters-settings:
  revive:
    rules:
      - name: exported
        arguments:
          - checkPrivateReceivers
          - sayRepetitiveInsteadOfStutters
  gocritic:
    enabled-tags:
      - diagnostic
      - style
      - performance
  gosec:
    excludes:
      - G104 # Audit errors not checked
  errorlint:
    errorf: true
    asserts: true
    comparison: true
```

### Line Length and Wrapping

```go
// ✅ Break long function signatures
func CreateUserWithOptions(
    ctx context.Context,
    name string,
    email string,
    options CreateUserOptions,
) (*User, error) {
    // ...
}

// ✅ Break long struct literals
user := &User{
    ID:        uuid.New(),
    Name:      name,
    Email:     email,
    CreatedAt: time.Now(),
    UpdatedAt: time.Now(),
}

// ✅ Break long chains
result := data.
    Filter(isValid).
    Map(transform).
    Reduce(combine)
```

## Error Handling

### Error Creation

```go
// ✅ Use errors.New for simple errors
var ErrNotFound = errors.New("user not found")

// ✅ Use fmt.Errorf with %w for wrapping
func FindUser(id string) (*User, error) {
    user, err := db.Query(id)
    if err != nil {
        return nil, fmt.Errorf("finding user %s: %w", id, err)
    }
    if user == nil {
        return nil, fmt.Errorf("user %s: %w", id, ErrNotFound)
    }
    return user, nil
}

// ✅ Custom error types for rich errors
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation failed on %s: %s", e.Field, e.Message)
}

// ✅ Implement Is/As for error matching
func (e *ValidationError) Is(target error) bool {
    _, ok := target.(*ValidationError)
    return ok
}
```

### Error Handling Patterns

```go
// ✅ Handle errors immediately
file, err := os.Open(path)
if err != nil {
    return fmt.Errorf("opening file: %w", err)
}
defer file.Close()

// ✅ Use errors.Is for sentinel errors
if errors.Is(err, ErrNotFound) {
    return nil, nil // Not found is acceptable
}

// ✅ Use errors.As for error types
var validationErr *ValidationError
if errors.As(err, &validationErr) {
    log.Printf("validation failed: field=%s", validationErr.Field)
}

// ✅ Don't ignore errors
result, _ := doSomething() // ❌ Never do this

result, err := doSomething() // ✅
if err != nil {
    // Handle or return
}

// ✅ Use errgroup for concurrent error handling
import "golang.org/x/sync/errgroup"

func fetchAll(ctx context.Context, urls []string) error {
    g, ctx := errgroup.WithContext(ctx)

    for _, url := range urls {
        url := url // capture
        g.Go(func() error {
            return fetch(ctx, url)
        })
    }

    return g.Wait()
}
```

## Concurrency

### Goroutines

```go
// ✅ Always pass context for cancellation
func processItems(ctx context.Context, items []Item) error {
    for _, item := range items {
        select {
        case <-ctx.Done():
            return ctx.Err()
        default:
            if err := process(item); err != nil {
                return err
            }
        }
    }
    return nil
}

// ✅ Use WaitGroup for goroutine synchronization
func processAll(items []Item) {
    var wg sync.WaitGroup

    for _, item := range items {
        wg.Add(1)
        go func(item Item) {
            defer wg.Done()
            process(item)
        }(item)
    }

    wg.Wait()
}

// ✅ Limit concurrency with semaphore
func processWithLimit(items []Item, limit int) {
    sem := make(chan struct{}, limit)
    var wg sync.WaitGroup

    for _, item := range items {
        wg.Add(1)
        sem <- struct{}{} // acquire
        go func(item Item) {
            defer wg.Done()
            defer func() { <-sem }() // release
            process(item)
        }(item)
    }

    wg.Wait()
}
```

### Channels

```go
// ✅ Use buffered channels appropriately
jobs := make(chan Job, 100)    // Buffer if producer shouldn't block
results := make(chan Result)   // Unbuffered for synchronization

// ✅ Close channels from sender side
func producer(ch chan<- int) {
    defer close(ch)
    for i := 0; i < 10; i++ {
        ch <- i
    }
}

// ✅ Use select for multiple channels
func worker(ctx context.Context, jobs <-chan Job, results chan<- Result) {
    for {
        select {
        case <-ctx.Done():
            return
        case job, ok := <-jobs:
            if !ok {
                return
            }
            results <- process(job)
        }
    }
}

// ✅ Use done channel or context for shutdown
func startWorker(ctx context.Context) <-chan Result {
    results := make(chan Result)

    go func() {
        defer close(results)
        for {
            select {
            case <-ctx.Done():
                return
            default:
                results <- doWork()
            }
        }
    }()

    return results
}
```

### Mutexes

```go
// ✅ Embed mutex in struct
type SafeCounter struct {
    mu    sync.Mutex
    value int
}

func (c *SafeCounter) Increment() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.value++
}

func (c *SafeCounter) Value() int {
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.value
}

// ✅ Use RWMutex for read-heavy workloads
type Cache struct {
    mu   sync.RWMutex
    data map[string]string
}

func (c *Cache) Get(key string) (string, bool) {
    c.mu.RLock()
    defer c.mu.RUnlock()
    val, ok := c.data[key]
    return val, ok
}

func (c *Cache) Set(key, value string) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.data[key] = value
}

// ✅ Use sync.Once for one-time initialization
var (
    instance *Service
    once     sync.Once
)

func GetService() *Service {
    once.Do(func() {
        instance = &Service{}
        instance.init()
    })
    return instance
}
```

## Structs and Methods

### Struct Design

```go
// ✅ Group related fields
type User struct {
    // Identification
    ID        string
    Email     string

    // Profile
    FirstName string
    LastName  string
    Bio       string

    // Timestamps
    CreatedAt time.Time
    UpdatedAt time.Time
}

// ✅ Use constructor functions
func NewUser(email string) *User {
    now := time.Now()
    return &User{
        ID:        uuid.NewString(),
        Email:     email,
        CreatedAt: now,
        UpdatedAt: now,
    }
}

// ✅ Validate in constructors
func NewEmail(value string) (Email, error) {
    if !strings.Contains(value, "@") {
        return "", errors.New("invalid email format")
    }
    return Email(value), nil
}
```

### Method Receivers

```go
// ✅ Use pointer receiver when:
// - Method modifies the receiver
// - Receiver is large
// - Consistency (if any method uses pointer, all should)

func (u *User) UpdateEmail(email string) {
    u.Email = email
    u.UpdatedAt = time.Now()
}

func (u *User) FullName() string {
    return u.FirstName + " " + u.LastName
}

// ✅ Use value receiver when:
// - Receiver is small and cheap to copy
// - Method doesn't modify receiver
// - Receiver is a map, chan, or func (already references)

func (p Point) Distance(other Point) float64 {
    dx := p.X - other.X
    dy := p.Y - other.Y
    return math.Sqrt(dx*dx + dy*dy)
}
```

## Interfaces

### Interface Design

```go
// ✅ Keep interfaces small
type Reader interface {
    Read(p []byte) (n int, err error)
}

// ✅ Define interfaces where used (consumer side)
// In user package:
type UserStore interface {
    Find(id string) (*User, error)
    Save(user *User) error
}

type UserService struct {
    store UserStore
}

func NewUserService(store UserStore) *UserService {
    return &UserService{store: store}
}

// ✅ Embed interfaces for composition
type ReadWriteCloser interface {
    Reader
    Writer
    Closer
}

// ❌ Don't over-abstract
type Service interface {
    DoEverything()  // Too broad
}
```

### Interface Assertions

```go
// ✅ Type assertions with ok check
if stringer, ok := val.(fmt.Stringer); ok {
    fmt.Println(stringer.String())
}

// ✅ Type switch for multiple types
func printValue(val interface{}) {
    switch v := val.(type) {
    case string:
        fmt.Printf("string: %s\n", v)
    case int:
        fmt.Printf("int: %d\n", v)
    case fmt.Stringer:
        fmt.Printf("stringer: %s\n", v.String())
    default:
        fmt.Printf("unknown: %v\n", v)
    }
}

// ✅ Compile-time interface check
var _ io.Reader = (*MyReader)(nil)
var _ http.Handler = (*MyHandler)(nil)
```

## Testing

### Test Organization

```go
// ✅ Table-driven tests
func TestAdd(t *testing.T) {
    tests := []struct {
        name     string
        a, b     int
        expected int
    }{
        {"positive", 1, 2, 3},
        {"negative", -1, -2, -3},
        {"zero", 0, 0, 0},
        {"mixed", -1, 2, 1},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := Add(tt.a, tt.b)
            if result != tt.expected {
                t.Errorf("Add(%d, %d) = %d; want %d",
                    tt.a, tt.b, result, tt.expected)
            }
        })
    }
}

// ✅ Use testify for assertions (optional)
func TestUser(t *testing.T) {
    user := NewUser("test@example.com")

    assert.NotEmpty(t, user.ID)
    assert.Equal(t, "test@example.com", user.Email)
    assert.WithinDuration(t, time.Now(), user.CreatedAt, time.Second)
}

// ✅ Parallel tests
func TestConcurrent(t *testing.T) {
    t.Parallel()

    tests := []struct {
        name string
        // ...
    }{
        // ...
    }

    for _, tt := range tests {
        tt := tt // capture
        t.Run(tt.name, func(t *testing.T) {
            t.Parallel()
            // test logic
        })
    }
}
```

### Mocking

```go
// ✅ Interface-based mocking
type mockUserStore struct {
    users map[string]*User
    err   error
}

func (m *mockUserStore) Find(id string) (*User, error) {
    if m.err != nil {
        return nil, m.err
    }
    return m.users[id], nil
}

func TestUserService_GetUser(t *testing.T) {
    store := &mockUserStore{
        users: map[string]*User{
            "1": {ID: "1", Email: "test@example.com"},
        },
    }

    service := NewUserService(store)
    user, err := service.GetUser("1")

    assert.NoError(t, err)
    assert.Equal(t, "test@example.com", user.Email)
}

// ✅ Use testify/mock for complex mocking
type MockUserStore struct {
    mock.Mock
}

func (m *MockUserStore) Find(id string) (*User, error) {
    args := m.Called(id)
    if args.Get(0) == nil {
        return nil, args.Error(1)
    }
    return args.Get(0).(*User), args.Error(1)
}
```

### Test Helpers

```go
// ✅ Use t.Helper() for test helpers
func assertUserEqual(t *testing.T, expected, actual *User) {
    t.Helper()
    if expected.ID != actual.ID {
        t.Errorf("ID mismatch: got %s, want %s", actual.ID, expected.ID)
    }
    if expected.Email != actual.Email {
        t.Errorf("Email mismatch: got %s, want %s", actual.Email, expected.Email)
    }
}

// ✅ Use t.Cleanup for cleanup
func TestWithDatabase(t *testing.T) {
    db := setupTestDB(t)
    t.Cleanup(func() {
        db.Close()
    })

    // Use db...
}
```

## Documentation

### Comments

```go
// ✅ Package comment (doc.go or main file)
// Package user provides functionality for managing user accounts.
//
// The package includes types and functions for creating, updating,
// and querying user data. It supports both in-memory and database
// storage backends.
package user

// ✅ Exported type/function comments start with name
// User represents a user account in the system.
// It contains the user's profile information and authentication data.
type User struct {
    // ID is the unique identifier for the user.
    ID string

    // Email is the user's email address, used for authentication.
    Email string
}

// NewUser creates a new User with the given email address.
// It generates a unique ID and sets creation timestamps.
func NewUser(email string) *User {
    // ...
}

// ✅ Use examples in documentation
// FindByEmail searches for a user by their email address.
// It returns nil if no user is found.
//
// Example:
//
// user, err := store.FindByEmail("user@example.com")
// if err != nil {
//     log.Fatal(err)
// }
// if user == nil {
//     log.Println("User not found")
// }
func (s *Store) FindByEmail(email string) (*User, error) {
    // ...
}
```

## Context

```go
// ✅ Context is first parameter
func ProcessRequest(ctx context.Context, req *Request) (*Response, error) {
    // ...
}

// ✅ Use context for cancellation
func fetchWithTimeout(ctx context.Context, url string) ([]byte, error) {
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()

    req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
    if err != nil {
        return nil, err
    }

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    return io.ReadAll(resp.Body)
}

// ✅ Pass context values appropriately
type contextKey string

const userIDKey contextKey = "userID"

func WithUserID(ctx context.Context, userID string) context.Context {
    return context.WithValue(ctx, userIDKey, userID)
}

func UserIDFromContext(ctx context.Context) (string, bool) {
    userID, ok := ctx.Value(userIDKey).(string)
    return userID, ok
}
```

## Performance

### Allocation Optimization

```go
// ✅ Pre-allocate slices when size is known
users := make([]User, 0, len(ids))
for _, id := range ids {
    user, err := fetch(id)
    if err == nil {
        users = append(users, user)
    }
}

// ✅ Use sync.Pool for frequent allocations
var bufferPool = sync.Pool{
    New: func() interface{} {
        return new(bytes.Buffer)
    },
}

func processData(data []byte) {
    buf := bufferPool.Get().(*bytes.Buffer)
    defer func() {
        buf.Reset()
        bufferPool.Put(buf)
    }()

    buf.Write(data)
    // Use buffer...
}

// ✅ Use strings.Builder for string concatenation
func buildQuery(conditions []string) string {
    var sb strings.Builder
    sb.WriteString("SELECT * FROM users WHERE ")
    for i, cond := range conditions {
        if i > 0 {
            sb.WriteString(" AND ")
        }
        sb.WriteString(cond)
    }
    return sb.String()
}
```

## Validation Checklist

```text
□ gofmt/goimports applied
□ golangci-lint passes
□ No exported symbols without documentation
□ Errors wrapped with context
□ Context passed as first parameter
□ Goroutines have proper lifecycle management
□ Mutexes protect shared state
□ Interfaces defined at consumer side
□ Table-driven tests for logic
□ No panic in library code
□ Defer used for cleanup
□ Resources closed properly
```

## Resources

- [Effective Go](https://go.dev/doc/effective_go)
- [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments)
- [Go Proverbs](https://go-proverbs.github.io/)
- [Uber Go Style Guide](https://github.com/uber-go/guide/blob/master/style.md)
- [Standard Go Project Layout](https://github.com/golang-standards/project-layout)
