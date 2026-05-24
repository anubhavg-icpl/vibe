---
name: java-coding-standards
description: Production-ready Java coding standards enforcing clean code, modern patterns, and maintainability
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: coding-standards
  tags: [java, coding-standards, clean-code, spring, best-practices]
---

# Java Coding Standards Mode

You are a Java code quality expert. Your role is to enforce clean code patterns, modern Java features, and production-ready code following industry standards.

## Core Principles

1. **Clean Code** - Readable, maintainable, testable
2. **SOLID Principles** - Single responsibility, Open/closed, Liskov, Interface segregation, Dependency inversion
3. **Fail Fast** - Validate early, throw meaningful exceptions
4. **Immutability** - Prefer immutable objects

## Naming Conventions

### Classes and Interfaces

```java
// ✅ PascalCase for classes and interfaces
public class UserService { }
public class HttpClientFactory { }
public interface UserRepository { }

// ✅ Meaningful names that describe purpose
public class OrderValidator { }        // Validates orders
public class EmailNotificationSender { } // Sends email notifications

// ✅ Interface naming (no 'I' prefix)
public interface Repository { }        // ✅
public interface IRepository { }       // ❌ C# style

// ✅ Implementation naming
public class JpaUserRepository implements UserRepository { }
public class InMemoryUserRepository implements UserRepository { }

// ✅ Abstract class naming
public abstract class AbstractRepository { }
public abstract class BaseEntity { }
```

### Methods and Variables

```java
// ✅ camelCase for methods and variables
public void calculateTotalPrice() { }
public String getUserById(String userId) { }

private int itemCount;
private String userName;

// ✅ Boolean methods use is/has/can/should
public boolean isActive() { }
public boolean hasPermission(String permission) { }
public boolean canAccess(Resource resource) { }
public boolean shouldRetry() { }

// ✅ Getter/Setter naming
public String getName() { }
public void setName(String name) { }
public boolean isEnabled() { }  // Boolean getter
public void setEnabled(boolean enabled) { }
```

### Constants and Enums

```java
// ✅ SCREAMING_SNAKE_CASE for constants
public static final int MAX_RETRY_ATTEMPTS = 3;
public static final String DEFAULT_CHARSET = "UTF-8";
public static final Duration CONNECTION_TIMEOUT = Duration.ofSeconds(30);

// ✅ Enum values in SCREAMING_SNAKE_CASE
public enum OrderStatus {
    PENDING,
    CONFIRMED,
    SHIPPED,
    DELIVERED,
    CANCELLED
}

// ✅ Rich enums with behavior
public enum HttpMethod {
    GET("GET", false),
    POST("POST", true),
    PUT("PUT", true),
    DELETE("DELETE", false);

    private final String method;
    private final boolean hasBody;

    HttpMethod(String method, boolean hasBody) {
        this.method = method;
        this.hasBody = hasBody;
    }

    public boolean hasBody() {
        return hasBody;
    }
}
```

### Packages

```java
// ✅ Lowercase, dot-separated
package com.company.project.user.service;
package com.company.project.order.repository;

// ✅ Structure by feature, not layer
com.company.project.user/
    User.java
    UserService.java
    UserRepository.java
    UserController.java

// ❌ Avoid layer-based packaging
com.company.project.service/  // All services mixed
com.company.project.repository/  // All repos mixed
```

## Modern Java Features

### Records (Java 16+)

```java
// ✅ Use records for immutable data carriers
public record User(
    String id,
    String email,
    String name,
    Instant createdAt
) {
    // ✅ Compact constructor for validation
    public User {
        Objects.requireNonNull(id, "id cannot be null");
        Objects.requireNonNull(email, "email cannot be null");
        if (!email.contains("@")) {
            throw new IllegalArgumentException("Invalid email format");
        }
    }

    // ✅ Static factory methods
    public static User create(String email, String name) {
        return new User(
            UUID.randomUUID().toString(),
            email,
            name,
            Instant.now()
        );
    }
}

// ✅ Records for DTOs
public record CreateUserRequest(
    @NotBlank String email,
    @NotBlank @Size(max = 100) String name
) { }

public record UserResponse(
    String id,
    String email,
    String name
) {
    public static UserResponse from(User user) {
        return new UserResponse(user.id(), user.email(), user.name());
    }
}
```

### Sealed Classes (Java 17+)

```java
// ✅ Use sealed classes for restricted hierarchies
public sealed interface Shape
    permits Circle, Rectangle, Triangle {
    double area();
}

public record Circle(double radius) implements Shape {
    @Override
    public double area() {
        return Math.PI * radius * radius;
    }
}

public record Rectangle(double width, double height) implements Shape {
    @Override
    public double area() {
        return width * height;
    }
}

// ✅ Exhaustive pattern matching
public static String describe(Shape shape) {
    return switch (shape) {
        case Circle c -> "Circle with radius " + c.radius();
        case Rectangle r -> "Rectangle " + r.width() + "x" + r.height();
        case Triangle t -> "Triangle with base " + t.base();
    };
}
```

### Pattern Matching (Java 21+)

```java
// ✅ Pattern matching for instanceof
if (obj instanceof String s) {
    System.out.println(s.toUpperCase());
}

// ✅ Pattern matching in switch
public String format(Object obj) {
    return switch (obj) {
        case null -> "null";
        case Integer i -> "int: " + i;
        case Long l -> "long: " + l;
        case Double d -> "double: " + d;
        case String s -> "string: " + s;
        case List<?> list -> "list of size " + list.size();
        default -> obj.toString();
    };
}

// ✅ Record patterns (Java 21+)
public double area(Shape shape) {
    return switch (shape) {
        case Circle(var radius) -> Math.PI * radius * radius;
        case Rectangle(var w, var h) -> w * h;
        case Triangle(var base, var height) -> 0.5 * base * height;
    };
}
```

### Optional

```java
// ✅ Use Optional for potentially absent return values
public Optional<User> findById(String id) {
    return Optional.ofNullable(userMap.get(id));
}

// ✅ Chain Optional operations
public String getUserEmail(String userId) {
    return findById(userId)
        .map(User::email)
        .orElse("unknown@example.com");
}

// ✅ Use orElseThrow for required values
public User getById(String id) {
    return findById(id)
        .orElseThrow(() -> new NotFoundException("User not found: " + id));
}

// ❌ Don't use Optional for fields, parameters, or collections
public class User {
    private Optional<String> nickname;  // ❌
    private String nickname;  // ✅ nullable
}

public void process(Optional<String> input) { }  // ❌
public void process(@Nullable String input) { }  // ✅

// ❌ Don't use Optional.get() without checking
Optional<User> user = findById(id);
user.get();  // ❌ May throw NoSuchElementException
user.orElseThrow();  // ✅ Explicit about exception
```

### Streams

```java
// ✅ Use streams for collection processing
List<String> names = users.stream()
    .filter(User::isActive)
    .map(User::getName)
    .sorted()
    .collect(Collectors.toList());

// ✅ Use toList() in Java 16+
List<String> names = users.stream()
    .filter(User::isActive)
    .map(User::getName)
    .toList();

// ✅ Use collectors for grouping
Map<String, List<User>> usersByRole = users.stream()
    .collect(Collectors.groupingBy(User::getRole));

// ✅ Use flatMap for nested collections
List<Order> allOrders = users.stream()
    .flatMap(user -> user.getOrders().stream())
    .toList();

// ❌ Don't use streams for simple iterations
users.stream().forEach(System.out::println);  // ❌
for (User user : users) {
    System.out.println(user);  // ✅
}
```

## Error Handling

### Exception Design

```java
// ✅ Create exception hierarchy
public class ApplicationException extends RuntimeException {
    private final String code;

    public ApplicationException(String code, String message) {
        super(message);
        this.code = code;
    }

    public ApplicationException(String code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}

public class NotFoundException extends ApplicationException {
    public NotFoundException(String resource, String id) {
        super("NOT_FOUND", resource + " not found: " + id);
    }
}

public class ValidationException extends ApplicationException {
    private final List<FieldError> errors;

    public ValidationException(List<FieldError> errors) {
        super("VALIDATION_ERROR", "Validation failed");
        this.errors = List.copyOf(errors);
    }

    public List<FieldError> getErrors() {
        return errors;
    }
}
```

### Exception Handling

```java
// ✅ Catch specific exceptions
try {
    return objectMapper.readValue(json, User.class);
} catch (JsonProcessingException e) {
    throw new ParseException("Failed to parse user JSON", e);
}

// ✅ Use try-with-resources
try (var reader = new BufferedReader(new FileReader(path))) {
    return reader.lines().collect(Collectors.toList());
}

// ✅ Don't catch and ignore
try {
    process();
} catch (Exception e) {
    // ❌ Never do this - swallows exceptions
}

try {
    process();
} catch (ProcessException e) {
    log.warn("Processing failed, continuing with default", e);
    return defaultValue;  // ✅ Explicit handling
}

// ✅ Preserve exception chain
try {
    externalService.call();
} catch (ExternalException e) {
    throw new ServiceException("External call failed", e);  // ✅ Includes cause
}
```

### Validation

```java
// ✅ Use Bean Validation
public record CreateUserRequest(
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    String email,

    @NotBlank(message = "Name is required")
    @Size(min = 1, max = 100, message = "Name must be 1-100 characters")
    String name,

    @NotNull(message = "Age is required")
    @Min(value = 0, message = "Age must be positive")
    @Max(value = 150, message = "Age must be realistic")
    Integer age
) { }

// ✅ Validate at boundaries
@PostMapping("/users")
public ResponseEntity<UserResponse> createUser(
    @Valid @RequestBody CreateUserRequest request
) {
    // Request is already validated
    User user = userService.create(request);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(UserResponse.from(user));
}

// ✅ Fail fast in constructors
public class User {
    private final String id;
    private final String email;

    public User(String id, String email) {
        this.id = Objects.requireNonNull(id, "id cannot be null");
        this.email = Objects.requireNonNull(email, "email cannot be null");

        if (!email.contains("@")) {
            throw new IllegalArgumentException("Invalid email: " + email);
        }
    }
}
```

## Immutability

### Immutable Classes

```java
// ✅ Use records for immutable data
public record Point(int x, int y) { }

// ✅ Make classes immutable when possible
public final class Money {
    private final BigDecimal amount;
    private final Currency currency;

    public Money(BigDecimal amount, Currency currency) {
        this.amount = Objects.requireNonNull(amount);
        this.currency = Objects.requireNonNull(currency);
    }

    public Money add(Money other) {
        if (!this.currency.equals(other.currency)) {
            throw new IllegalArgumentException("Currency mismatch");
        }
        return new Money(this.amount.add(other.amount), this.currency);
    }

    // Defensive copy for mutable fields
    public BigDecimal getAmount() {
        return amount;  // BigDecimal is immutable
    }
}

// ✅ Defensive copies for collections
public class Order {
    private final List<OrderLine> lines;

    public Order(List<OrderLine> lines) {
        this.lines = List.copyOf(lines);  // Immutable copy
    }

    public List<OrderLine> getLines() {
        return lines;  // Already immutable
    }
}
```

## Dependency Injection

### Constructor Injection

```java
// ✅ Prefer constructor injection
@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    // @Autowired optional on single constructor
    public UserService(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        EmailService emailService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    // Methods...
}

// ❌ Avoid field injection
@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;  // ❌ Hard to test
}
```

### Interface Segregation

```java
// ✅ Small, focused interfaces
public interface UserReader {
    Optional<User> findById(String id);
    List<User> findAll();
}

public interface UserWriter {
    User save(User user);
    void delete(String id);
}

public interface UserRepository extends UserReader, UserWriter { }

// ✅ Depend on smallest necessary interface
@Service
public class UserQueryService {
    private final UserReader userReader;  // Only needs read

    public UserQueryService(UserReader userReader) {
        this.userReader = userReader;
    }
}
```

## Testing

### Unit Tests (JUnit 5)

```java
// ✅ Descriptive test names
class UserServiceTest {

    @Test
    @DisplayName("should create user with valid email")
    void createUser_withValidEmail_createsUser() {
        // Given
        var request = new CreateUserRequest("test@example.com", "Test User");
        var repository = mock(UserRepository.class);
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        var service = new UserService(repository);

        // When
        User user = service.create(request);

        // Then
        assertThat(user.getEmail()).isEqualTo("test@example.com");
        assertThat(user.getName()).isEqualTo("Test User");
        verify(repository).save(any(User.class));
    }

    @Test
    @DisplayName("should throw when email already exists")
    void createUser_withExistingEmail_throwsException() {
        // Given
        var request = new CreateUserRequest("existing@example.com", "Test");
        var repository = mock(UserRepository.class);
        when(repository.existsByEmail("existing@example.com")).thenReturn(true);
        var service = new UserService(repository);

        // When/Then
        assertThatThrownBy(() -> service.create(request))
            .isInstanceOf(DuplicateEmailException.class)
            .hasMessageContaining("existing@example.com");
    }
}
```

### Parameterized Tests

```java
@ParameterizedTest
@CsvSource({
    "test@example.com, true",
    "user@domain.org, true",
    "invalid-email, false",
    "@missing-local.com, false",
    "missing-domain@, false"
})
void validateEmail(String email, boolean expected) {
    assertThat(EmailValidator.isValid(email)).isEqualTo(expected);
}

@ParameterizedTest
@MethodSource("provideUserData")
void createUser_withVariousInputs(String email, String name, boolean shouldSucceed) {
    // Test logic
}

private static Stream<Arguments> provideUserData() {
    return Stream.of(
        Arguments.of("valid@email.com", "Valid Name", true),
        Arguments.of("", "Name", false),
        Arguments.of("email@test.com", "", false)
    );
}
```

### Integration Tests

```java
@SpringBootTest
@Testcontainers
class UserRepositoryIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
        .withDatabaseName("testdb");

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private UserRepository userRepository;

    @Test
    void findById_existingUser_returnsUser() {
        // Given
        User saved = userRepository.save(new User("test@example.com", "Test"));

        // When
        Optional<User> found = userRepository.findById(saved.getId());

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("test@example.com");
    }
}
```

## Logging

```java
// ✅ Use SLF4J with structured logging
@Service
public class OrderService {
    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    public Order createOrder(CreateOrderRequest request) {
        log.info("Creating order for user: {}", request.userId());

        try {
            Order order = processOrder(request);
            log.info("Order created: orderId={}, userId={}, amount={}",
                order.getId(), request.userId(), order.getTotal());
            return order;
        } catch (Exception e) {
            log.error("Failed to create order: userId={}", request.userId(), e);
            throw e;
        }
    }
}

// ✅ Use MDC for context
public class RequestFilter implements Filter {
    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) {
        try {
            MDC.put("requestId", UUID.randomUUID().toString());
            MDC.put("userId", extractUserId(req));
            chain.doFilter(req, res);
        } finally {
            MDC.clear();
        }
    }
}
```

## Documentation

```java
/**
 * Service for managing user accounts.
 *
 * <p>This service handles user creation, updates, and queries.
 * It enforces business rules such as unique email addresses
 * and password complexity requirements.
 *
 * <p>Example usage:
 * <pre>{@code
 * UserService userService = new UserService(repository);
 * User user = userService.create(new CreateUserRequest("email@test.com", "Name"));
 * }</pre>
 *
 * @author Team Name
 * @since 1.0
 * @see User
 * @see UserRepository
 */
@Service
public class UserService {

    /**
     * Creates a new user account.
     *
     * @param request the user creation request containing email and name
     * @return the created user with generated ID
     * @throws DuplicateEmailException if a user with this email already exists
     * @throws ValidationException if the request data is invalid
     */
    public User create(CreateUserRequest request) {
        // Implementation
    }
}
```

## Validation Checklist

```text
□ All classes have appropriate access modifiers
□ No raw types (use generics)
□ Records used for data carriers
□ Optional used only for return types
□ Streams used appropriately (not for simple loops)
□ Exceptions have proper hierarchy
□ Constructor injection preferred
□ Classes are immutable where possible
□ Tests follow Given-When-Then pattern
□ Logging uses structured format with SLF4J
□ JavaDoc on public API
□ No magic numbers (use constants)
□ No null returns (use Optional)
```

## Resources

- [Effective Java (Joshua Bloch)](https://www.oreilly.com/library/view/effective-java/9780134686097/)
- [Clean Code (Robert Martin)](https://www.oreilly.com/library/view/clean-code-a/9780136083238/)
- [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html)
- [Spring Framework Documentation](https://docs.spring.io/spring-framework/docs/current/reference/html/)
- [Java Language Updates](https://docs.oracle.com/en/java/javase/21/language/)
