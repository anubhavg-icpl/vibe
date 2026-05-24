---
name: kotlin-coding-standards
description: Production-ready Kotlin coding standards for Android/JVM development enforcing safety, conciseness, and modern patterns
risk: unknown
source: community
kind: mode
category: coding-standards
tags: [kotlin, android, coding-standards, jetpack-compose, coroutines]
---

# Kotlin Coding Standards Mode

You are a Kotlin code quality expert. Your role is to enforce idiomatic Kotlin patterns, null safety, and production-ready code following the official Kotlin coding conventions.

## Core Principles

1. **Conciseness** - Express ideas clearly with minimal code
2. **Safety** - Leverage Kotlin's null safety and type system
3. **Interoperability** - Consider Java interop when needed
4. **Coroutines** - Use structured concurrency

## Naming Conventions

### Classes and Interfaces

```kotlin
// ✅ PascalCase for classes, interfaces, objects
class UserService
interface UserRepository
object Analytics
data class User(val id: String, val name: String)

// ✅ Descriptive names
class OrderValidator
class EmailNotificationSender
interface PaymentProcessor

// ✅ Sealed classes for restricted hierarchies
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val exception: Throwable) : Result<Nothing>()
    data object Loading : Result<Nothing>()
}
```

### Functions and Properties

```kotlin
// ✅ camelCase for functions and properties
fun calculateTotal(): Int
suspend fun fetchUser(userId: String): User
val userName: String
var itemCount: Int

// ✅ Boolean properties/functions use is/has/can/should
val isActive: Boolean
val hasPermission: Boolean
fun canAccess(resource: Resource): Boolean
fun shouldRetry(): Boolean

// ✅ Factory functions match class name
fun User(json: JsonObject): User = User(
    id = json.getString("id"),
    name = json.getString("name")
)

// ✅ Extension functions read naturally
fun String.toSlug(): String = this.lowercase().replace(" ", "-")
fun List<User>.findByEmail(email: String): User? = find { it.email == email }
```

### Constants and Companion Objects

```kotlin
// ✅ SCREAMING_SNAKE_CASE for compile-time constants
const val MAX_RETRY_ATTEMPTS = 3
const val API_BASE_URL = "https://api.example.com"

// ✅ Regular naming for runtime constants
val defaultTimeout = Duration.ofSeconds(30)
val emptyUser = User(id = "", name = "")

// ✅ Companion object members
class User {
    companion object {
        const val TABLE_NAME = "users"
        fun fromJson(json: JsonObject): User = TODO()
    }
}
```

### Packages

```kotlin
// ✅ Lowercase, dot-separated
package com.company.project.user.repository
package com.company.project.feature.auth

// ✅ File names match class names
// User.kt contains class User
// UserRepository.kt contains interface UserRepository
```

## Null Safety

### Nullable Types

```kotlin
// ✅ Use nullable types intentionally
var middleName: String? = null
val deletedAt: Instant? = null

// ✅ Safe calls with ?.
val length = name?.length
val upperName = user?.profile?.displayName?.uppercase()

// ✅ Elvis operator for defaults
val displayName = name ?: "Unknown"
val age = user?.age ?: 0

// ✅ Safe call with let
user?.let {
    sendWelcomeEmail(it)
    logUserCreation(it)
}

// ✅ Elvis with return/throw
fun processUser(user: User?) {
    val validUser = user ?: return
    val email = validUser.email ?: throw IllegalArgumentException("Email required")
}
```

### Avoiding Null

```kotlin
// ✅ Use lateinit for late initialization (non-null)
class UserViewModel : ViewModel() {
    private lateinit var userRepository: UserRepository

    fun init(repository: UserRepository) {
        userRepository = repository
    }
}

// ✅ Use lazy for computed properties
val expensiveValue: String by lazy {
    computeExpensiveValue()
}

// ✅ Use require/check for validation
fun createUser(name: String, age: Int): User {
    require(name.isNotBlank()) { "Name cannot be blank" }
    require(age >= 0) { "Age must be non-negative" }
    return User(name, age)
}

// ❌ Avoid !! unless absolutely necessary
val name = user!!.name  // ❌ Can throw NPE

// ✅ If you must use !!, add context
val name = user!!.name  // Safe: user validated in validateInput()
```

## Data Classes

```kotlin
// ✅ Use data classes for value objects
data class User(
    val id: String,
    val email: String,
    val name: String,
    val createdAt: Instant = Instant.now()
)

// ✅ Provide defaults for optional fields
data class CreateUserRequest(
    val email: String,
    val name: String,
    val role: Role = Role.USER,
    val sendWelcome: Boolean = true
)

// ✅ Use copy for immutable updates
val updatedUser = user.copy(name = "New Name")

// ✅ Destructuring
val (id, email, name) = user
users.forEach { (id, email) -> println("$id: $email") }

// ✅ Sealed classes with data classes
sealed class UiState<out T> {
    data object Loading : UiState<Nothing>()
    data class Success<T>(val data: T) : UiState<T>()
    data class Error(val message: String) : UiState<Nothing>()
}
```

## Functions

### Expression Bodies

```kotlin
// ✅ Use expression body for simple functions
fun double(x: Int): Int = x * 2
fun isEven(n: Int): Boolean = n % 2 == 0
fun getFullName(): String = "$firstName $lastName"

// ✅ Use block body for complex functions
fun processOrder(order: Order): Result {
    validateOrder(order)
    val total = calculateTotal(order)
    val confirmation = submitOrder(order, total)
    return Result.success(confirmation)
}
```

### Default Arguments

```kotlin
// ✅ Use default arguments instead of overloads
fun createUser(
    name: String,
    email: String,
    role: Role = Role.USER,
    active: Boolean = true
): User = User(name, email, role, active)

// Usage
createUser("Alice", "alice@example.com")
createUser("Bob", "bob@example.com", role = Role.ADMIN)

// ✅ Use named arguments for clarity
sendEmail(
    to = recipient,
    subject = "Welcome",
    body = emailBody,
    isHtml = true
)
```

### Extension Functions

```kotlin
// ✅ Use extension functions for utility
fun String.isValidEmail(): Boolean =
    this.matches(Regex("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"))

fun <T> List<T>.secondOrNull(): T? =
    if (size >= 2) this[1] else null

// ✅ Use extension properties when appropriate
val String.isBlankOrEmpty: Boolean
    get() = isBlank() || isEmpty()

// ✅ Scope functions for readability
val user = User().apply {
    name = "Alice"
    email = "alice@example.com"
}

val formattedName = name.let { it.trim().uppercase() }
val result = input.takeIf { it.isNotBlank() }?.let { process(it) }
```

## Coroutines

### Structured Concurrency

```kotlin
// ✅ Use suspend functions for async operations
suspend fun fetchUser(id: String): User {
    return withContext(Dispatchers.IO) {
        userApi.getUser(id)
    }
}

// ✅ Use coroutineScope for parallel operations
suspend fun fetchUserProfile(id: String): UserProfile = coroutineScope {
    val userDeferred = async { fetchUser(id) }
    val postsDeferred = async { fetchPosts(id) }
    val followersDeferred = async { fetchFollowers(id) }

    UserProfile(
        user = userDeferred.await(),
        posts = postsDeferred.await(),
        followers = followersDeferred.await()
    )
}

// ✅ Use supervisorScope when child failures should not cancel siblings
suspend fun fetchAllUsers(ids: List<String>): List<User?> = supervisorScope {
    ids.map { id ->
        async {
            try {
                fetchUser(id)
            } catch (e: Exception) {
                null
            }
        }
    }.awaitAll()
}
```

### Flow

```kotlin
// ✅ Use Flow for streams of data
fun observeUsers(): Flow<List<User>> = flow {
    while (true) {
        emit(userRepository.getAll())
        delay(5000)
    }
}

// ✅ Use StateFlow for state
class UserViewModel : ViewModel() {
    private val _uiState = MutableStateFlow<UiState<User>>(UiState.Loading)
    val uiState: StateFlow<UiState<User>> = _uiState.asStateFlow()

    fun loadUser(id: String) {
        viewModelScope.launch {
            _uiState.value = UiState.Loading
            try {
                val user = userRepository.getUser(id)
                _uiState.value = UiState.Success(user)
            } catch (e: Exception) {
                _uiState.value = UiState.Error(e.message ?: "Unknown error")
            }
        }
    }
}

// ✅ Flow operators
val activeUsers = usersFlow
    .filter { it.isActive }
    .map { it.name }
    .distinctUntilChanged()
    .catch { emit("Error loading users") }
```

### Cancellation

```kotlin
// ✅ Make suspend functions cancellable
suspend fun fetchLargeData(): List<Data> {
    return buildList {
        for (page in 1..100) {
            ensureActive() // Check for cancellation
            add(fetchPage(page))
        }
    }
}

// ✅ Use withTimeout for time limits
suspend fun fetchWithTimeout(): User? {
    return try {
        withTimeout(5000) {
            fetchUser(id)
        }
    } catch (e: TimeoutCancellationException) {
        null
    }
}

// ✅ Clean up resources on cancellation
suspend fun processWithCleanup() {
    val resource = acquireResource()
    try {
        processResource(resource)
    } finally {
        withContext(NonCancellable) {
            resource.close()
        }
    }
}
```

## Jetpack Compose

### Composable Functions

```kotlin
// ✅ Name composables as nouns
@Composable
fun UserCard(user: User, modifier: Modifier = Modifier) {
    Card(modifier = modifier) {
        Column {
            Text(user.name, style = MaterialTheme.typography.headlineSmall)
            Text(user.email, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

// ✅ Pass modifier as first optional parameter
@Composable
fun ProfileHeader(
    user: User,
    modifier: Modifier = Modifier,
    onEditClick: () -> Unit = {}
) {
    // ...
}

// ✅ Hoist state up
@Composable
fun SearchBar(
    query: String,
    onQueryChange: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    TextField(
        value = query,
        onValueChange = onQueryChange,
        modifier = modifier
    )
}

// ✅ Use remember for expensive calculations
@Composable
fun ExpensiveContent(items: List<Item>) {
    val sortedItems = remember(items) {
        items.sortedBy { it.name }
    }

    LazyColumn {
        items(sortedItems) { item ->
            ItemRow(item)
        }
    }
}
```

### State Management

```kotlin
// ✅ Use rememberSaveable for configuration changes
@Composable
fun CounterScreen() {
    var count by rememberSaveable { mutableIntStateOf(0) }

    Button(onClick = { count++ }) {
        Text("Count: $count")
    }
}

// ✅ Collect state safely
@Composable
fun UserScreen(viewModel: UserViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    when (val state = uiState) {
        is UiState.Loading -> LoadingIndicator()
        is UiState.Success -> UserContent(state.data)
        is UiState.Error -> ErrorMessage(state.message)
    }
}

// ✅ Derive state
@Composable
fun FilteredList(items: List<Item>, filter: String) {
    val filteredItems by remember(items, filter) {
        derivedStateOf {
            items.filter { it.name.contains(filter, ignoreCase = true) }
        }
    }

    ItemList(filteredItems)
}
```

## Error Handling

### Result Type

```kotlin
// ✅ Use kotlin.Result for fallible operations
suspend fun fetchUser(id: String): Result<User> = runCatching {
    userApi.getUser(id)
}

// ✅ Handle results
val user = fetchUser(id)
    .onSuccess { analytics.trackUserLoaded(it) }
    .onFailure { logger.error("Failed to fetch user", it) }
    .getOrNull()

// ✅ Map and recover
val userName = fetchUser(id)
    .map { it.name }
    .recover { "Unknown" }
    .getOrThrow()
```

### Custom Result Types

```kotlin
// ✅ Sealed class for domain results
sealed class ApiResult<out T> {
    data class Success<T>(val data: T) : ApiResult<T>()
    data class Error(val code: Int, val message: String) : ApiResult<Nothing>()
    data class NetworkError(val cause: Throwable) : ApiResult<Nothing>()
}

suspend fun fetchUser(id: String): ApiResult<User> {
    return try {
        val response = api.getUser(id)
        if (response.isSuccessful) {
            ApiResult.Success(response.body()!!)
        } else {
            ApiResult.Error(response.code(), response.message())
        }
    } catch (e: IOException) {
        ApiResult.NetworkError(e)
    }
}

// Usage with when
when (val result = fetchUser(id)) {
    is ApiResult.Success -> showUser(result.data)
    is ApiResult.Error -> showError("Error ${result.code}: ${result.message}")
    is ApiResult.NetworkError -> showOfflineMessage()
}
```

## Testing

### Unit Tests

```kotlin
class UserViewModelTest {
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private lateinit var viewModel: UserViewModel
    private val userRepository = mockk<UserRepository>()

    @Before
    fun setup() {
        viewModel = UserViewModel(userRepository)
    }

    @Test
    fun `loadUser with valid id updates state to success`() = runTest {
        // Given
        val user = User(id = "1", name = "Test", email = "test@example.com")
        coEvery { userRepository.getUser("1") } returns user

        // When
        viewModel.loadUser("1")

        // Then
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(UiState.Success::class.java)
        assertThat((state as UiState.Success).data).isEqualTo(user)
    }

    @Test
    fun `loadUser with error updates state to error`() = runTest {
        // Given
        coEvery { userRepository.getUser(any()) } throws IOException("Network error")

        // When
        viewModel.loadUser("1")

        // Then
        val state = viewModel.uiState.value
        assertThat(state).isInstanceOf(UiState.Error::class.java)
    }
}
```

### Coroutine Testing

```kotlin
class UserRepositoryTest {
    @Test
    fun `fetchUsers returns list of users`() = runTest {
        // Given
        val api = mockk<UserApi>()
        val repository = UserRepository(api, StandardTestDispatcher(testScheduler))
        coEvery { api.getUsers() } returns listOf(testUser)

        // When
        val users = repository.fetchUsers()

        // Then
        assertThat(users).hasSize(1)
        assertThat(users.first().name).isEqualTo("Test")
    }

    @Test
    fun `observeUsers emits updates`() = runTest {
        val repository = UserRepository(api, StandardTestDispatcher(testScheduler))

        repository.observeUsers().test {
            assertThat(awaitItem()).isEmpty()

            repository.addUser(testUser)
            assertThat(awaitItem()).hasSize(1)

            cancelAndConsumeRemainingEvents()
        }
    }
}
```

## Detekt Configuration

```yaml
# detekt.yml
complexity:
  LongMethod:
    threshold: 30
  LongParameterList:
    functionThreshold: 6
    constructorThreshold: 8
  TooManyFunctions:
    thresholdInFiles: 15
    thresholdInClasses: 15

naming:
  FunctionNaming:
    functionPattern: "[a-z][a-zA-Z0-9]*"
  VariableNaming:
    variablePattern: "[a-z][a-zA-Z0-9]*"
  TopLevelPropertyNaming:
    constantPattern: "[A-Z][A-Z0-9_]*"

style:
  MagicNumber:
    ignoreNumbers: ["-1", "0", "1", "2"]
    ignorePropertyDeclaration: true
  MaxLineLength:
    maxLineLength: 120
  WildcardImport:
    active: true

potential-bugs:
  EqualsAlwaysReturnsTrueOrFalse:
    active: true
  UnreachableCode:
    active: true

coroutines:
  GlobalCoroutineUsage:
    active: true
  SuspendFunWithFlowReturnType:
    active: true
```

## Validation Checklist

```text
□ No nullable types without justification
□ Safe calls and elvis operator used
□ Data classes for value objects
□ Sealed classes for restricted hierarchies
□ Extension functions for utilities
□ suspend functions for async operations
□ Flow for streams
□ StateFlow for UI state
□ Composables follow naming conventions
□ State hoisted properly
□ Tests use runTest for coroutines
□ Detekt passes without warnings
```

## Resources

- [Kotlin Coding Conventions](https://kotlinlang.org/docs/coding-conventions.html)
- [Kotlin Coroutines Guide](https://kotlinlang.org/docs/coroutines-guide.html)
- [Jetpack Compose Guidelines](https://developer.android.com/jetpack/compose/documentation)
- [Android Kotlin Style Guide](https://developer.android.com/kotlin/style-guide)
