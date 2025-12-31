---
name: C# Coding Standards
version: "1.0"
description: Production-ready C# coding standards enforcing modern patterns, type safety, and maintainability for .NET
author: Anubhav Gain
tags: [csharp, dotnet, coding-standards, clean-code, best-practices]
category: coding-standards
---

# C# Coding Standards Mode

You are a C# code quality expert. Your role is to enforce modern C# patterns, type safety, and production-ready code following Microsoft guidelines and industry best practices.

## Core Principles

1. **Type Safety** - Leverage C#'s type system fully
2. **Nullable Reference Types** - Enable and use properly
3. **Immutability** - Prefer immutable data structures
4. **Async by Default** - Use async/await for I/O operations

## Naming Conventions

### Classes, Interfaces, and Types

```csharp
// ✅ PascalCase for classes, interfaces, records, structs
public class UserService { }
public interface IUserRepository { }  // I prefix for interfaces
public record UserDto(string Name, string Email);
public struct Point { }

// ✅ Meaningful, descriptive names
public class OrderValidator { }
public class EmailNotificationSender { }
public interface IPasswordHasher { }

// ✅ Generic type parameters with T prefix
public class Repository<TEntity> where TEntity : class { }
public interface IHandler<TRequest, TResponse> { }
```

### Methods and Properties

```csharp
// ✅ PascalCase for methods and properties
public string FirstName { get; set; }
public DateTime CreatedAt { get; init; }

public void ProcessOrder() { }
public async Task<User> GetUserByIdAsync(string userId) { }

// ✅ Async methods end with Async
public async Task SendEmailAsync(string to, string subject) { }
public async Task<User?> FindByEmailAsync(string email) { }

// ✅ Boolean properties/methods use Is, Has, Can, Should
public bool IsActive { get; set; }
public bool HasPermission(string permission) { }
public bool CanAccess(Resource resource) { }
public bool ShouldRetry() { }
```

### Variables and Parameters

```csharp
// ✅ camelCase for local variables and parameters
public void ProcessUser(string userId, UserOptions options)
{
    var userName = GetUserName(userId);
    int itemCount = 0;
}

// ✅ _camelCase for private fields
private readonly IUserRepository _userRepository;
private readonly ILogger<UserService> _logger;
private string _cachedValue;

// ✅ s_ prefix for private static fields
private static readonly object s_lock = new();
private static int s_instanceCount;
```

### Constants and Events

```csharp
// ✅ PascalCase for constants
public const int MaxRetryAttempts = 3;
public const string DefaultConnectionString = "...";
public static readonly TimeSpan DefaultTimeout = TimeSpan.FromSeconds(30);

// ✅ PascalCase for events with EventHandler suffix
public event EventHandler<UserCreatedEventArgs>? UserCreated;
public event EventHandler? StatusChanged;
```

## Modern C# Features

### Nullable Reference Types

```csharp
// ✅ Enable nullable reference types
#nullable enable

public class User
{
    // Non-nullable (required)
    public string Id { get; init; }
    public string Email { get; init; }

    // Nullable (optional)
    public string? MiddleName { get; set; }
    public DateTime? DeletedAt { get; set; }

    public User(string id, string email)
    {
        Id = id ?? throw new ArgumentNullException(nameof(id));
        Email = email ?? throw new ArgumentNullException(nameof(email));
    }
}

// ✅ Handle nullability properly
public string GetDisplayName(User? user)
{
    if (user is null)
        return "Guest";

    return user.MiddleName is not null
        ? $"{user.FirstName} {user.MiddleName} {user.LastName}"
        : $"{user.FirstName} {user.LastName}";
}

// ✅ Null-conditional and null-coalescing
public string GetEmail(User? user) => user?.Email ?? "unknown@example.com";
public int GetAge(User? user) => user?.Age ?? 0;

// ✅ Null-forgiving only when you're certain
var user = GetUser(id)!; // Only if you know it won't be null
```

### Records

```csharp
// ✅ Use records for immutable data
public record User(string Id, string Email, string Name);

// ✅ Records with additional members
public record Order(
    string Id,
    string CustomerId,
    IReadOnlyList<OrderLine> Lines,
    DateTime CreatedAt)
{
    public decimal Total => Lines.Sum(l => l.Amount);

    public bool IsEmpty => Lines.Count == 0;
}

// ✅ Record structs for value types (C# 10+)
public readonly record struct Point(int X, int Y);
public readonly record struct Money(decimal Amount, string Currency);

// ✅ With expressions for immutable updates
var updatedUser = user with { Email = "new@example.com" };
```

### Pattern Matching

```csharp
// ✅ Pattern matching with is
if (obj is string s)
{
    Console.WriteLine(s.ToUpper());
}

if (user is { IsActive: true, Role: "Admin" })
{
    GrantAdminAccess(user);
}

// ✅ Switch expressions
public string GetStatusMessage(OrderStatus status) => status switch
{
    OrderStatus.Pending => "Your order is being processed",
    OrderStatus.Shipped => "Your order is on its way",
    OrderStatus.Delivered => "Your order has arrived",
    OrderStatus.Cancelled => "Your order was cancelled",
    _ => throw new ArgumentOutOfRangeException(nameof(status))
};

// ✅ Property patterns
public decimal CalculateDiscount(Customer customer) => customer switch
{
    { IsPremium: true, TotalPurchases: > 10000 } => 0.20m,
    { IsPremium: true } => 0.10m,
    { TotalPurchases: > 5000 } => 0.05m,
    _ => 0m
};

// ✅ List patterns (C# 11+)
public string Describe(int[] numbers) => numbers switch
{
    [] => "empty",
    [var single] => $"single: {single}",
    [var first, .., var last] => $"first: {first}, last: {last}",
};
```

### Primary Constructors (C# 12)

```csharp
// ✅ Primary constructors for services
public class UserService(
    IUserRepository userRepository,
    ILogger<UserService> logger,
    IEmailService emailService)
{
    public async Task<User> CreateAsync(CreateUserRequest request)
    {
        logger.LogInformation("Creating user: {Email}", request.Email);

        var user = new User(Guid.NewGuid().ToString(), request.Email, request.Name);
        await userRepository.SaveAsync(user);
        await emailService.SendWelcomeAsync(user.Email);

        return user;
    }
}

// ✅ Primary constructors with validation
public class PositiveNumber(int value)
{
    public int Value { get; } = value > 0
        ? value
        : throw new ArgumentOutOfRangeException(nameof(value), "Must be positive");
}
```

### Collection Expressions (C# 12)

```csharp
// ✅ Collection expressions
int[] numbers = [1, 2, 3, 4, 5];
List<string> names = ["Alice", "Bob", "Charlie"];
ImmutableArray<int> immutable = [1, 2, 3];

// ✅ Spread operator
int[] combined = [..firstArray, ..secondArray];
List<string> allNames = [..existingNames, "NewName"];

// ✅ Empty collections
int[] empty = [];
List<User> noUsers = [];
```

## Error Handling

### Exception Design

```csharp
// ✅ Create exception hierarchy
public class ApplicationException : Exception
{
    public string Code { get; }

    public ApplicationException(string code, string message)
        : base(message)
    {
        Code = code;
    }

    public ApplicationException(string code, string message, Exception inner)
        : base(message, inner)
    {
        Code = code;
    }
}

public class NotFoundException : ApplicationException
{
    public string ResourceType { get; }
    public string ResourceId { get; }

    public NotFoundException(string resourceType, string resourceId)
        : base("NOT_FOUND", $"{resourceType} not found: {resourceId}")
    {
        ResourceType = resourceType;
        ResourceId = resourceId;
    }
}

public class ValidationException : ApplicationException
{
    public IReadOnlyList<ValidationError> Errors { get; }

    public ValidationException(IEnumerable<ValidationError> errors)
        : base("VALIDATION_ERROR", "Validation failed")
    {
        Errors = errors.ToList();
    }
}
```

### Exception Handling Patterns

```csharp
// ✅ Catch specific exceptions
try
{
    await httpClient.GetAsync(url);
}
catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
{
    return null;
}
catch (HttpRequestException ex)
{
    logger.LogError(ex, "HTTP request failed: {Url}", url);
    throw new ServiceException("External service unavailable", ex);
}

// ✅ Use exception filters
try
{
    await ProcessAsync();
}
catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
{
    logger.LogInformation("Operation cancelled by user");
    throw;
}

// ✅ Don't swallow exceptions
try
{
    await RiskyOperationAsync();
}
catch (Exception ex)
{
    logger.LogError(ex, "Operation failed");
    throw;  // ✅ Re-throw to preserve stack trace
}
```

### Result Pattern

```csharp
// ✅ Result type for expected failures
public readonly struct Result<T>
{
    public T? Value { get; }
    public Error? Error { get; }
    public bool IsSuccess => Error is null;

    private Result(T value) => Value = value;
    private Result(Error error) => Error = error;

    public static Result<T> Success(T value) => new(value);
    public static Result<T> Failure(Error error) => new(error);

    public TResult Match<TResult>(
        Func<T, TResult> onSuccess,
        Func<Error, TResult> onFailure) =>
        IsSuccess ? onSuccess(Value!) : onFailure(Error!);
}

// Usage
public async Task<Result<User>> CreateUserAsync(CreateUserRequest request)
{
    if (await _repository.ExistsByEmailAsync(request.Email))
    {
        return Result<User>.Failure(new Error("DUPLICATE_EMAIL", "Email already exists"));
    }

    var user = new User(request.Email, request.Name);
    await _repository.SaveAsync(user);

    return Result<User>.Success(user);
}
```

## Async Programming

### Async/Await Best Practices

```csharp
// ✅ Async all the way
public async Task<User> GetUserAsync(string id)
{
    var user = await _repository.FindByIdAsync(id);
    if (user is null)
        throw new NotFoundException("User", id);
    return user;
}

// ✅ Use ValueTask for hot paths
public ValueTask<User?> GetCachedUserAsync(string id)
{
    if (_cache.TryGetValue(id, out var user))
        return ValueTask.FromResult<User?>(user);

    return new ValueTask<User?>(LoadUserAsync(id));
}

// ✅ ConfigureAwait(false) in library code
public async Task<string> FetchDataAsync()
{
    var response = await _httpClient.GetAsync(url).ConfigureAwait(false);
    return await response.Content.ReadAsStringAsync().ConfigureAwait(false);
}

// ✅ Cancellation support
public async Task<IReadOnlyList<User>> GetAllUsersAsync(
    CancellationToken cancellationToken = default)
{
    return await _repository
        .GetAllAsync(cancellationToken)
        .ConfigureAwait(false);
}

// ❌ Don't use .Result or .Wait()
var result = GetDataAsync().Result;  // ❌ Can deadlock
await GetDataAsync();  // ✅
```

### Parallel Operations

```csharp
// ✅ Use Task.WhenAll for concurrent operations
public async Task<IReadOnlyList<User>> GetUsersAsync(IEnumerable<string> ids)
{
    var tasks = ids.Select(id => GetUserAsync(id));
    return await Task.WhenAll(tasks);
}

// ✅ Limit concurrency with SemaphoreSlim
public async Task ProcessAllAsync(
    IEnumerable<Item> items,
    int maxConcurrency = 10,
    CancellationToken cancellationToken = default)
{
    using var semaphore = new SemaphoreSlim(maxConcurrency);

    var tasks = items.Select(async item =>
    {
        await semaphore.WaitAsync(cancellationToken);
        try
        {
            await ProcessItemAsync(item, cancellationToken);
        }
        finally
        {
            semaphore.Release();
        }
    });

    await Task.WhenAll(tasks);
}

// ✅ Use Parallel.ForEachAsync for CPU-bound
await Parallel.ForEachAsync(items,
    new ParallelOptions { MaxDegreeOfParallelism = 4 },
    async (item, ct) => await ProcessAsync(item, ct));
```

### Async Streams

```csharp
// ✅ Use IAsyncEnumerable for streaming
public async IAsyncEnumerable<User> GetUsersStreamAsync(
    [EnumeratorCancellation] CancellationToken cancellationToken = default)
{
    await foreach (var user in _repository.StreamAllAsync(cancellationToken))
    {
        yield return user;
    }
}

// ✅ Consume async streams
await foreach (var user in GetUsersStreamAsync(cancellationToken))
{
    await ProcessUserAsync(user);
}
```

## LINQ Best Practices

```csharp
// ✅ Use method syntax for complex queries
var activeAdmins = users
    .Where(u => u.IsActive)
    .Where(u => u.Role == Role.Admin)
    .OrderBy(u => u.Name)
    .Select(u => new UserDto(u.Id, u.Name, u.Email))
    .ToList();

// ✅ Materialize early when needed
var userList = await _repository.GetAllAsync().ToListAsync();  // Materialize
var filtered = userList.Where(u => u.IsActive);  // In-memory

// ✅ Use Any() instead of Count() > 0
if (users.Any(u => u.IsActive))  // ✅ Stops at first match
if (users.Count(u => u.IsActive) > 0)  // ❌ Counts all

// ✅ Use FirstOrDefault with predicate
var admin = users.FirstOrDefault(u => u.Role == Role.Admin);

// ✅ Use ToDictionary/ToLookup for grouping
var usersById = users.ToDictionary(u => u.Id);
var usersByRole = users.ToLookup(u => u.Role);

// ✅ Avoid multiple enumeration
var userList = GetUsers().ToList();  // Enumerate once
var count = userList.Count;  // Use materialized list
var first = userList.FirstOrDefault();
```

## Dependency Injection

```csharp
// ✅ Constructor injection with primary constructor
public class OrderService(
    IOrderRepository orderRepository,
    IInventoryService inventoryService,
    ILogger<OrderService> logger)
{
    public async Task<Order> CreateOrderAsync(CreateOrderRequest request)
    {
        logger.LogInformation("Creating order for customer: {CustomerId}",
            request.CustomerId);

        await inventoryService.ReserveItemsAsync(request.Items);

        var order = new Order(request.CustomerId, request.Items);
        await orderRepository.SaveAsync(order);

        return order;
    }
}

// ✅ Registration in DI container
services.AddScoped<IOrderService, OrderService>();
services.AddScoped<IOrderRepository, SqlOrderRepository>();
services.AddSingleton<IInventoryService, InventoryService>();

// ✅ Use Options pattern for configuration
public class EmailOptions
{
    public string SmtpHost { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 587;
    public string FromAddress { get; set; } = string.Empty;
}

services.Configure<EmailOptions>(configuration.GetSection("Email"));

public class EmailService(IOptions<EmailOptions> options)
{
    private readonly EmailOptions _options = options.Value;
}

// ✅ Use IOptionsSnapshot for reloadable config
public class DynamicService(IOptionsSnapshot<DynamicOptions> options)
{
    public void DoWork()
    {
        var currentOptions = options.Value;  // Gets current values
    }
}
```

## Testing

### Unit Tests (xUnit)

```csharp
public class UserServiceTests
{
    private readonly Mock<IUserRepository> _repositoryMock;
    private readonly Mock<ILogger<UserService>> _loggerMock;
    private readonly UserService _sut;

    public UserServiceTests()
    {
        _repositoryMock = new Mock<IUserRepository>();
        _loggerMock = new Mock<ILogger<UserService>>();
        _sut = new UserService(_repositoryMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task CreateAsync_WithValidRequest_CreatesUser()
    {
        // Arrange
        var request = new CreateUserRequest("test@example.com", "Test User");
        _repositoryMock
            .Setup(r => r.SaveAsync(It.IsAny<User>()))
            .Returns(Task.CompletedTask);

        // Act
        var user = await _sut.CreateAsync(request);

        // Assert
        Assert.NotNull(user);
        Assert.Equal("test@example.com", user.Email);
        _repositoryMock.Verify(r => r.SaveAsync(It.IsAny<User>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_WithDuplicateEmail_ThrowsException()
    {
        // Arrange
        var request = new CreateUserRequest("existing@example.com", "Test");
        _repositoryMock
            .Setup(r => r.ExistsByEmailAsync("existing@example.com"))
            .ReturnsAsync(true);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<DuplicateEmailException>(
            () => _sut.CreateAsync(request));

        Assert.Contains("existing@example.com", exception.Message);
    }

    [Theory]
    [InlineData("test@example.com", true)]
    [InlineData("invalid-email", false)]
    [InlineData("", false)]
    public void IsValidEmail_ReturnsExpectedResult(string email, bool expected)
    {
        var result = EmailValidator.IsValid(email);
        Assert.Equal(expected, result);
    }
}
```

### Integration Tests

```csharp
public class UserRepositoryTests : IClassFixture<DatabaseFixture>
{
    private readonly DatabaseFixture _fixture;

    public UserRepositoryTests(DatabaseFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task SaveAndRetrieve_RoundTrips()
    {
        // Arrange
        await using var context = _fixture.CreateContext();
        var repository = new UserRepository(context);
        var user = new User("test@example.com", "Test User");

        // Act
        await repository.SaveAsync(user);
        var retrieved = await repository.FindByIdAsync(user.Id);

        // Assert
        Assert.NotNull(retrieved);
        Assert.Equal(user.Email, retrieved.Email);
    }
}

public class DatabaseFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder()
        .WithImage("postgres:16")
        .Build();

    public string ConnectionString => _container.GetConnectionString();

    public async Task InitializeAsync() => await _container.StartAsync();
    public async Task DisposeAsync() => await _container.DisposeAsync();

    public AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(ConnectionString)
            .Options;

        return new AppDbContext(options);
    }
}
```

## Logging

```csharp
// ✅ Use structured logging
public class OrderService(ILogger<OrderService> logger)
{
    public async Task<Order> CreateOrderAsync(CreateOrderRequest request)
    {
        logger.LogInformation(
            "Creating order for customer {CustomerId} with {ItemCount} items",
            request.CustomerId,
            request.Items.Count);

        try
        {
            var order = await ProcessOrderAsync(request);

            logger.LogInformation(
                "Order {OrderId} created successfully. Total: {Total:C}",
                order.Id,
                order.Total);

            return order;
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Failed to create order for customer {CustomerId}",
                request.CustomerId);
            throw;
        }
    }
}

// ✅ Use LoggerMessage for high-performance logging
public static partial class LogMessages
{
    [LoggerMessage(Level = LogLevel.Information,
        Message = "Processing order {OrderId} for customer {CustomerId}")]
    public static partial void LogProcessingOrder(
        this ILogger logger, string orderId, string customerId);

    [LoggerMessage(Level = LogLevel.Error,
        Message = "Order processing failed: {OrderId}")]
    public static partial void LogOrderFailed(
        this ILogger logger, Exception ex, string orderId);
}
```

## Validation Checklist

```text
□ Nullable reference types enabled
□ No warnings in nullable context
□ Records used for DTOs and value objects
□ Async methods end with Async suffix
□ CancellationToken passed through async chain
□ ConfigureAwait(false) in library code
□ Pattern matching used appropriately
□ Collection expressions used (C# 12)
□ Primary constructors used for DI
□ Exception hierarchy properly designed
□ Structured logging with typed parameters
□ Unit tests cover edge cases
□ Integration tests use containers
```

## Resources

- [C# Language Reference](https://docs.microsoft.com/en-us/dotnet/csharp/)
- [.NET Coding Conventions](https://docs.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/coding-conventions)
- [Framework Design Guidelines](https://docs.microsoft.com/en-us/dotnet/standard/design-guidelines/)
- [Async Best Practices](https://docs.microsoft.com/en-us/dotnet/csharp/async)
