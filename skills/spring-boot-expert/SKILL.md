---
name: spring-boot-expert
description: Expert in Spring Boot framework with REST APIs, security, testing, performance, dependency injection, and production deployment. Use when you need deep expertise in spring boot.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: backend
  tags: [spring-boot, java, backend, framework, microservices]
---

# Spring Boot Expert Mode

## Overview

You are an expert Spring Boot framework specialist with deep knowledge of Spring configuration, REST APIs, Spring Security, testing, dependency injection, performance tuning, and production deployment.

## Core Principles

1. **Spring Way** - Follow Spring conventions, don't fight the framework
2. **Configuration Externalization** - Use profiles, not hardcode values
3. **Security First** - Enable Spring Security, validate inputs
4. **Dependency Injection** - Use constructor injection over field injection
5. **Testing** - Write unit and integration tests with Spring Boot Test
6. **Production Ready** - Use proper actuator, logging, and monitoring

## Project Structure

### Recommended Layout

```
project/
├── src/main/java/com/example/app/
│   ├── App.java                    # Main application
│   ├── config/                     # Configuration classes
│   ├── controller/                 # REST controllers
│   ├── service/                    # Business logic
│   ├── repository/                  # Data access layer
│   ├── model/                      # Entity models
│   ├── dto/                        # Data transfer objects
│   ├── security/                    # Security config
│   └── exception/                   # Custom exceptions
├── src/test/java/com/example/app/  # Tests
├── src/main/resources/
│   ├── application.yml              # Configuration
│   ├── application-dev.yml          # Dev profile
│   ├── application-prod.yml         # Prod profile
│   └── logback.xml                 # Logging
└── pom.xml                          # Maven configuration
```

## Configuration

### application.yml

```yaml
spring:
  application:
    name: myapp

  profiles:
    active: ${SPRING_PROFILES_ACTIVE:dev}

  # Datasource configuration
  datasource:
    url: jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}
    username: ${DB_USER}
    password: ${DB_PASSWORD}
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000

  # JPA/Hibernate
  jpa:
    hibernate:
      ddl-auto: update
      show-sql: false
      dialect: org.hibernate.dialect.PostgreSQLDialect
      properties:
        hibernate:
          format_sql: true
          use_sql_comments: false

  # Jackson JSON
  jackson:
    default-property-inclusion: non_null
    serialization:
      write-dates-as-timestamps: false
    deserialization:
      fail-on-unknown-properties: false

  # Actuator
  management:
    endpoints:
      web:
        exposure:
          include: health,info,metrics
    endpoint:
      health:
        show-details: always
        show-components: always
```

### Profiles

```yaml
# application-dev.yml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
  jpa:
    show-sql: true

# application-prod.yml
spring:
  datasource:
    url: jdbc:postgresql://prod-db:5432/prod_db
    hikari:
      maximum-pool-size: 50

# application-test.yml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
  jpa:
    hibernate:
      ddl-auto: create-drop
```

## REST API

### Controller with Validations

```java
@RestController
@RequestMapping("/api/v1/users")
@Validated
public class UserController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<UserResponse> createUser(
        @Valid @RequestBody UserRequest request
    ) {
        User user = userService.createUser(request);

        URI location = URI.create(String.format("/api/v1/users/%d", user.getId()));

        return ResponseEntity
            .created(location)
            .body(UserResponse.from(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
        User user = userService.findById(id);

        if (user == null) {
            throw new UserNotFoundException(id);
        }

        return ResponseEntity.ok(UserResponse.from(user));
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> getUsers(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        Page<User> users = userService.findAll(page, size);

        return ResponseEntity.ok(UserResponse.fromList(users));
    }
}
```

### DTOs

```java
public class UserRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 128, message = "Password must be between 8 and 128 characters")
    private String password;

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;
}

public class UserResponse {

    private Long id;
    private String email;
    private String name;
    private String role;
    private LocalDateTime createdAt;

    public static UserResponse from(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setName(user.getName());
        response.setRole(user.getRole());
        response.setCreatedAt(user.getCreatedAt());
        return response;
    }

    public static List<UserResponse> fromList(Page<User> users) {
        return users.getContent()
            .stream()
            .map(UserResponse::from)
            .collect(Collectors.toList());
    }
}
```

## Spring Security

### Security Configuration

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // For REST APIs
            .authorizeHttpRequests(AntMatchersRequestMatcher.whiteList())
                .permitAll()
            .anyRequest()
                .authenticated()
            .and()
            .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .exceptionHandling()
                .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                .accessDeniedHandler(customAccessDeniedHandler);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

### JWT Authentication Filter

```java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain
    ) throws ServletException, IOException {

        String authorizationHeader = request.getHeader("Authorization");

        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = authorizationHeader.substring(7);

        try {
            // Validate token and get authentication
            Authentication authentication = tokenProvider.getAuthentication(token);

            // Set authentication in security context
            SecurityContextHolder.getContext().setAuthentication(authentication);

            chain.doFilter(request, response);
        } catch (AuthenticationException e) {
            // Handle invalid token
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, e.getMessage());
        }
    }
}
```

### User Details Service

```java
@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        User user = userRepository.findByEmail(username);

        if (user == null) {
            throw new UsernameNotFoundException("User not found with email: " + username);
        }

        return User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .roles(user.getRoles().stream()
                        .map(role -> new SimpleGrantedAuthority(role.getName()))
                        .collect(Collectors.toSet()))
                .build();
    }
}
```

## Dependency Injection

### Constructor Injection (Recommended)

```java
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    // Constructor injection (preferred)
    @Autowired
    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }
}
```

### Optional Injection

```java
@Service
public class NotificationService {

    @Autowired
    private EmailService emailService; // Required

    @Autowired(required = false)
    private SMSService smsService; // Optional

    public void sendNotification(String message) {
        if (smsService != null) {
            smsService.sendSMS(message);
        }

        emailService.sendEmail(message);
    }
}
```

## Data Access

### Repository Interface

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.email = :email")
    Optional<User> findByEmailIgnoreCase(@Param("email") String email);

    @Query("SELECT u FROM User u WHERE u.createdAt > :date")
    Page<User> findByCreatedAtAfter(@Param("date") LocalDateTime date, Pageable pageable);

    @Modifying
    @Query("UPDATE User u SET u.lastLogin = :lastLogin WHERE u.id = :id")
    void updateLastLogin(@Param("id") Long id, @Param("lastLogin") LocalDateTime lastLogin);
}
```

### Entity Relationships

```java
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt DESC")
    private List<OrderItem> items;

    // N+1 query optimization
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id")
    private Product product; // Always fetch product with order
}
```

## Testing

### Unit Tests

```java
@SpringBootTest
@AutoConfigureMockMvc
public class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Test
    public void createUser_ShouldReturn201() throws Exception {
        UserRequest request = new UserRequest();
        request.setEmail("test@example.com");
        request.setPassword("password123");
        request.setName("Test User");

        User mockUser = new User();
        mockUser.setId(1L);
        when(userService.createUser(any(UserRequest.class))).thenReturn(mockUser);

        mockMvc.perform(post("/api/v1/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.email", is("test@example.com")));
    }

    @Test
    public void createUser_WithInvalidEmail_ShouldReturn400() throws Exception {
        UserRequest request = new UserRequest();
        request.setEmail("invalid-email");

        mockMvc.perform(post("/api/v1/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
```

### Integration Tests

```java
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class UserServiceIntegrationTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Test
    @Transactional
    public void createUser_ShouldPersistToDatabase() {
        UserRequest request = new UserRequest();
        request.setEmail("integration@example.com");
        request.setPassword("password123");
        request.setName("Integration User");

        User createdUser = userService.createUser(request);

        User foundUser = userRepository.findById(createdUser.getId());

        assertNotNull(foundUser);
        assertEquals(createdUser.getEmail(), foundUser.getEmail());
    }
}
```

## Performance

### Database Query Optimization

```java
@Entity
@Table(name = "users")
@NamedQuery(
    name = "User.findByEmail",
    query = "SELECT u FROM User u WHERE u.email = :email"
)
public class User {

    @Column(unique = true, nullable = false)
    @Index
    private String email;

    @Column(nullable = false, length = 512)
    private String password;

    // ✅ Good - Lazy loading for relationships
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private List<Order> orders;

    // ✅ Good - Batch fetching
    @BatchSize(size = 50)
    @Query("SELECT u FROM User u WHERE u.id IN :ids")
    List<User> findByIds(@Param("ids") List<Long> ids);
}
```

### Caching

```java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(
            "users", // Default cache name
            Caffeine.newBuilder()
                    .expireAfterWrite(10, TimeUnit.MINUTES)
                    .maximumSize(1000)
                    .build()
        );
    }
}

@Service
public class UserService {

    @Cacheable(value = "users", key = "#email")
    public User findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}
```

## Exception Handling

### Global Exception Handler

```java
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUserNotFound(UserNotFoundException ex) {
        ErrorResponse error = new ErrorResponse(
            "User Not Found",
            ex.getMessage()
        );

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex) {
        List<String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(field -> field.getDefaultMessage())
                .collect(Collectors.toList());

        ErrorResponse error = new ErrorResponse("Validation Failed", errors);

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        ErrorResponse error = new ErrorResponse("Internal Server Error", ex.getMessage());

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(error);
    }
}
```

### Custom Exceptions

```java
public class UserNotFoundException extends RuntimeException {

    public UserNotFoundException(Long userId) {
        super(String.format("User not found with id: %d", userId));
    }
}

public class DuplicateUserException extends RuntimeException {

    public DuplicateUserException(String email) {
        super(String.format("User with email %s already exists", email));
    }
}
```

## Best Practices

### DO

- Use @RestController for REST APIs
- Implement proper validation with @Valid
- Use constructor injection over field injection
- Enable Spring Security with proper configuration
- Write unit and integration tests
- Use profiles for environment-specific config
- Implement proper exception handling
- Use DTOs for request/response
- Follow RESTful conventions
- Use proper HTTP methods and status codes

### DON'T

- Use @Controller for REST APIs (use @RestController)
- Skip validation (always validate inputs)
- Use field injection (prefer constructor injection)
- Hardcode configuration values (use profiles)
- Disable Spring Security (enable with proper config)
- Skip testing (write comprehensive tests)
- Return entities directly (use DTOs)
- Use @Autowired on fields (prefer constructor injection)
- Ignore proper exception handling
- Use synchronous blocking calls (use async/reactive)

## Anti-patterns

1. **Controller Logic** - Business logic in controllers instead of services
2. **No Transactions** - Not using @Transactional for multi-step operations
3. **SQL Injection** - Using raw SQL without proper parameterization
4. **God Services** - Services doing too much (violate SRP)
5. **DTO Violations** - Returning entities instead of DTOs
6. **Caching Issues** - Caching everything or not caching at all
7. **N+1 Queries** - Not using entity graphs or batch fetching
8. **No Security** - Disabling Spring Security or using weak configurations
9. **Hardcoded Config** - Environment-specific values in code
10. **Exception Swallowing** - Catching exceptions without proper handling

## Production Deployment

### Docker Configuration

```dockerfile
# Multi-stage build
FROM maven:3.8-eclipse-temurin AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn clean package

# Runtime
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar

# JVM options
ENV JAVA_OPTS="-Xms512m -Xmx1024m"

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spring-boot-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: spring-boot-app
  template:
    metadata:
      labels:
        app: spring-boot-app
    spec:
      containers:
        - name: app
          image: myregistry/spring-boot-app:1.0.0
          ports:
            - containerPort: 8080
          env:
            - name: SPRING_PROFILES_ACTIVE
              value: "prod"
            - name: SPRING_DATASOURCE_URL
              valueFrom:
                secretKeyRef:
                  name: db-secrets
                  key: url
          resources:
            requests:
              memory: "512Mi"
              cpu: "500m"
            limits:
              memory: "1Gi"
              cpu: "1000m"
          livenessProbe:
            httpGet:
              path: /actuator/health
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
```

## Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Spring Framework Documentation](https://spring.io/projects/spring-framework)
- [Spring Security Documentation](https://spring.io/projects/spring-security)
- [Spring Data JPA](https://spring.io/projects/spring-data-jpa)
- [Spring Boot Actuator](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator/)
- [Baeldung Tutorials](https://www.baeldung.com/)
- [Spring Boot Initializr](https://start.spring.io/)
