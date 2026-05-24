---
name: dart-coding-standards
description: Production-ready Dart and Flutter coding standards. Use when enforcing dart coding conventions and style rules.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: coding-standards
  tags: [dart, flutter, standards, mobile, cross-platform]
---

# Dart Coding Standards

Production-ready coding standards for Dart and Flutter applications following Effective Dart guidelines.

## Naming Conventions

```dart
// Classes, enums, typedefs, type parameters: UpperCamelCase
class UserRepository {}
enum UserRole { admin, member, guest }
typedef UserCallback = void Function(User user);

// Variables, functions, parameters: lowerCamelCase
final userName = 'John';
void processUser(User user) {}

// Constants: lowerCamelCase (not SCREAMING_CAPS)
const defaultTimeout = Duration(seconds: 30);
const maxRetries = 3;

// Libraries, packages, directories, source files: lowercase_with_underscores
// user_repository.dart
// lib/src/user_service.dart

// Private members: prefix with underscore
class User {
  final String _password;
  String get _internalId => _generateId();
}
```

## Code Organization

```dart
// lib/src/domain/user.dart

/// Represents a user in the system.
///
/// Users can have different [UserRole]s that determine their permissions.
class User {
  /// Creates a new user with the given properties.
  const User({
    required this.id,
    required this.email,
    required this.name,
    this.role = UserRole.member,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  /// Creates a user from a JSON map.
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String,
      role: UserRole.values.byName(json['role'] as String),
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  final String id;
  final String email;
  final String name;
  final UserRole role;
  final DateTime createdAt;

  /// Returns true if the user is an admin.
  bool get isAdmin => role == UserRole.admin;

  /// Converts this user to a JSON map.
  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'name': name,
        'role': role.name,
        'created_at': createdAt.toIso8601String(),
      };

  /// Creates a copy of this user with the given fields replaced.
  User copyWith({
    String? id,
    String? email,
    String? name,
    UserRole? role,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      name: name ?? this.name,
      role: role ?? this.role,
      createdAt: createdAt,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is User && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() => 'User(id: $id, email: $email, role: $role)';
}
```

## Null Safety

```dart
// Use null safety properly
class UserService {
  final UserRepository _repository;
  User? _currentUser;

  UserService(this._repository);

  // Nullable return type when value may not exist
  Future<User?> findById(String id) async {
    return _repository.findById(id);
  }

  // Non-nullable with assertion when we're certain
  User get currentUser {
    assert(_currentUser != null, 'No user logged in');
    return _currentUser!;
  }

  // Use late for deferred initialization
  late final Logger _logger = Logger('UserService');

  // Null-aware operators
  String getDisplayName(User? user) {
    return user?.name ?? 'Anonymous';
  }

  // Collection null safety
  List<User> filterActive(List<User>? users) {
    return users?.where((u) => u.isActive).toList() ?? [];
  }
}
```

## Error Handling

```dart
// Custom exceptions
class UserException implements Exception {
  const UserException(this.message, {this.code});

  final String message;
  final String? code;

  @override
  String toString() => 'UserException: $message${code != null ? ' ($code)' : ''}';
}

class UserNotFoundException extends UserException {
  const UserNotFoundException(String id) : super('User not found: $id', code: 'USER_NOT_FOUND');
}

// Result type pattern
sealed class Result<T> {
  const Result();
}

class Success<T> extends Result<T> {
  const Success(this.value);
  final T value;
}

class Failure<T> extends Result<T> {
  const Failure(this.error, [this.stackTrace]);
  final Object error;
  final StackTrace? stackTrace;
}

// Usage
Future<Result<User>> createUser(UserInput input) async {
  try {
    final user = await _repository.create(input);
    return Success(user);
  } on ValidationException catch (e) {
    return Failure(e);
  } catch (e, st) {
    return Failure(e, st);
  }
}

// Pattern matching with sealed classes
void handleResult(Result<User> result) {
  switch (result) {
    case Success(:final value):
      print('Created user: ${value.name}');
    case Failure(:final error):
      print('Failed: $error');
  }
}
```

## Async Patterns

```dart
class DataService {
  // Use async/await
  Future<List<User>> fetchUsers() async {
    final response = await _client.get('/users');
    return response.data.map((json) => User.fromJson(json)).toList();
  }

  // Stream for real-time data
  Stream<User> watchUser(String id) async* {
    await for (final snapshot in _database.watch('users/$id')) {
      yield User.fromJson(snapshot.data);
    }
  }

  // Parallel execution
  Future<Dashboard> loadDashboard() async {
    final results = await Future.wait([
      fetchUsers(),
      fetchStats(),
      fetchRecentActivity(),
    ]);

    return Dashboard(
      users: results[0] as List<User>,
      stats: results[1] as Stats,
      activity: results[2] as List<Activity>,
    );
  }

  // Timeout and retry
  Future<T> withRetry<T>(
    Future<T> Function() operation, {
    int maxAttempts = 3,
    Duration timeout = const Duration(seconds: 10),
  }) async {
    for (var attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation().timeout(timeout);
      } on TimeoutException {
        if (attempt == maxAttempts) rethrow;
        await Future.delayed(Duration(seconds: attempt));
      }
    }
    throw StateError('Unreachable');
  }
}
```

## Flutter Widgets

```dart
// Stateless widget
class UserCard extends StatelessWidget {
  const UserCard({
    super.key,
    required this.user,
    this.onTap,
  });

  final User user;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              CircleAvatar(child: Text(user.name[0])),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(user.name, style: theme.textTheme.titleMedium),
                    Text(user.email, style: theme.textTheme.bodySmall),
                  ],
                ),
              ),
              _RoleBadge(role: user.role),
            ],
          ),
        ),
      ),
    );
  }
}

// Stateful widget with proper lifecycle
class UserListPage extends StatefulWidget {
  const UserListPage({super.key});

  @override
  State<UserListPage> createState() => _UserListPageState();
}

class _UserListPageState extends State<UserListPage> {
  late final UserController _controller;
  late final ScrollController _scrollController;

  @override
  void initState() {
    super.initState();
    _controller = context.read<UserController>();
    _scrollController = ScrollController();
    _controller.loadUsers();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Users')),
      body: ListenableBuilder(
        listenable: _controller,
        builder: (context, _) {
          if (_controller.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (_controller.error != null) {
            return _ErrorView(
              error: _controller.error!,
              onRetry: _controller.loadUsers,
            );
          }

          return ListView.builder(
            controller: _scrollController,
            itemCount: _controller.users.length,
            itemBuilder: (context, index) {
              final user = _controller.users[index];
              return UserCard(
                user: user,
                onTap: () => _navigateToDetail(user),
              );
            },
          );
        },
      ),
    );
  }

  void _navigateToDetail(User user) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => UserDetailPage(userId: user.id),
      ),
    );
  }
}
```

## Testing Standards

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockUserRepository extends Mock implements UserRepository {}

void main() {
  group('UserService', () {
    late UserService service;
    late MockUserRepository repository;

    setUp(() {
      repository = MockUserRepository();
      service = UserService(repository);
    });

    group('createUser', () {
      test('returns user on success', () async {
        final input = UserInput(email: 'test@test.com', name: 'Test');
        final expectedUser = User(id: '1', email: 'test@test.com', name: 'Test');

        when(() => repository.create(input)).thenAnswer((_) async => expectedUser);

        final result = await service.createUser(input);

        expect(result, isA<Success<User>>());
        expect((result as Success).value, equals(expectedUser));
        verify(() => repository.create(input)).called(1);
      });

      test('returns failure on repository error', () async {
        final input = UserInput(email: 'test@test.com', name: 'Test');

        when(() => repository.create(input)).thenThrow(Exception('DB Error'));

        final result = await service.createUser(input);

        expect(result, isA<Failure<User>>());
      });
    });
  });

  group('UserCard', () {
    testWidgets('displays user information', (tester) async {
      final user = User(id: '1', email: 'test@test.com', name: 'Test User');

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: UserCard(user: user)),
        ),
      );

      expect(find.text('Test User'), findsOneWidget);
      expect(find.text('test@test.com'), findsOneWidget);
    });

    testWidgets('calls onTap when tapped', (tester) async {
      var tapped = false;
      final user = User(id: '1', email: 'test@test.com', name: 'Test');

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: UserCard(user: user, onTap: () => tapped = true),
          ),
        ),
      );

      await tester.tap(find.byType(UserCard));
      expect(tapped, isTrue);
    });
  });
}
```

## Analysis Options

```yaml
# analysis_options.yaml
include: package:flutter_lints/flutter.yaml

analyzer:
  errors:
    missing_return: error
    missing_required_param: error
  language:
    strict-casts: true
    strict-inference: true
    strict-raw-types: true

linter:
  rules:
    - always_declare_return_types
    - avoid_dynamic_calls
    - avoid_print
    - avoid_returning_null_for_future
    - cancel_subscriptions
    - close_sinks
    - prefer_const_constructors
    - prefer_const_declarations
    - prefer_final_locals
    - prefer_single_quotes
    - sort_constructors_first
    - unawaited_futures
    - unnecessary_await_in_return
    - use_super_parameters
```

Follow these standards for maintainable, type-safe Dart and Flutter code.
