---
name: elixir-coding-standards
description: Production-ready Elixir coding standards with OTP and Phoenix best practices
risk: unknown
source: community
kind: mode
category: coding-standards
tags: [elixir, otp, phoenix, standards, functional]
---

# Elixir Coding Standards

Production-ready coding standards for Elixir applications following OTP principles and community conventions.

## Naming Conventions

```elixir
# Modules: PascalCase
defmodule MyApp.Users.UserService do
end

# Functions/variables: snake_case
def get_user_by_id(user_id) do
end

# Private functions: prefixed with underscore internally referenced
defp do_process_user(user) do
end

# Atoms: snake_case
:user_not_found
:ok
:error

# Module attributes: @snake_case
@default_timeout 5000
@max_retries 3
```

## Code Organization

```elixir
defmodule MyApp.Users.User do
  @moduledoc """
  User schema and changeset functions.

  This module defines the User struct and provides functions
  for creating and validating user data.
  """

  use Ecto.Schema
  import Ecto.Changeset

  alias MyApp.Accounts.Team

  # 1. Module attributes
  @primary_key {:id, :binary_id, autogenerate: true}
  @derive {Jason.Encoder, only: [:id, :email, :name]}

  # 2. Schema definition
  schema "users" do
    field :email, :string
    field :name, :string
    field :password, :string, virtual: true, redact: true
    field :password_hash, :string, redact: true

    belongs_to :team, Team
    has_many :posts, MyApp.Content.Post

    timestamps()
  end

  # 3. Type specs
  @type t :: %__MODULE__{
    id: Ecto.UUID.t(),
    email: String.t(),
    name: String.t()
  }

  # 4. Public functions
  @doc """
  Creates a changeset for user registration.
  """
  @spec registration_changeset(t(), map()) :: Ecto.Changeset.t()
  def registration_changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :name, :password])
    |> validate_required([:email, :name, :password])
    |> validate_email()
    |> validate_password()
    |> hash_password()
  end

  # 5. Private functions
  defp validate_email(changeset) do
    changeset
    |> validate_format(:email, ~r/^[^\s]+@[^\s]+$/)
    |> validate_length(:email, max: 160)
    |> unsafe_validate_unique(:email, MyApp.Repo)
    |> unique_constraint(:email)
  end

  defp validate_password(changeset) do
    changeset
    |> validate_length(:password, min: 12, max: 72)
    |> validate_format(:password, ~r/[a-z]/, message: "must have lowercase")
    |> validate_format(:password, ~r/[A-Z]/, message: "must have uppercase")
    |> validate_format(:password, ~r/[0-9]/, message: "must have digit")
  end

  defp hash_password(changeset) do
    case get_change(changeset, :password) do
      nil -> changeset
      password -> put_change(changeset, :password_hash, Bcrypt.hash_pwd_salt(password))
    end
  end
end
```

## Pattern Matching & Guards

```elixir
# Use pattern matching over conditionals
# Good
def handle_result({:ok, value}), do: process(value)
def handle_result({:error, reason}), do: log_error(reason)

# Avoid
def handle_result(result) do
  if elem(result, 0) == :ok do
    process(elem(result, 1))
  else
    log_error(elem(result, 1))
  end
end

# Use guards for type checks
def process_data(data) when is_map(data), do: Map.keys(data)
def process_data(data) when is_list(data), do: length(data)
def process_data(_), do: {:error, :invalid_type}

# Multi-clause functions for different arities
def send_notification(user), do: send_notification(user, [])
def send_notification(user, opts) when is_list(opts) do
  # implementation
end
```

## Error Handling

```elixir
# Use tagged tuples
@spec get_user(String.t()) :: {:ok, User.t()} | {:error, :not_found | :invalid_id}
def get_user(id) do
  case Repo.get(User, id) do
    nil -> {:error, :not_found}
    user -> {:ok, user}
  end
end

# Use with for happy path
def create_order(user_id, items) do
  with {:ok, user} <- get_user(user_id),
       {:ok, validated_items} <- validate_items(items),
       {:ok, order} <- build_order(user, validated_items),
       {:ok, saved_order} <- Repo.insert(order) do
    {:ok, saved_order}
  else
    {:error, :not_found} -> {:error, "User not found"}
    {:error, :invalid_items} -> {:error, "Invalid items"}
    {:error, changeset} -> {:error, format_errors(changeset)}
  end
end

# Avoid bare rescue
# Good
try do
  risky_operation()
rescue
  e in RuntimeError -> {:error, e.message}
  e in ArgumentError -> {:error, "Invalid argument: #{e.message}"}
end

# Let it crash for unexpected errors
def process(data) do
  # If this fails, let the supervisor handle it
  do_process!(data)
end
```

## OTP Patterns

```elixir
# GenServer with proper callbacks
defmodule MyApp.Cache do
  use GenServer
  require Logger

  # Client API - Public interface
  def start_link(opts \\ []) do
    name = Keyword.get(opts, :name, __MODULE__)
    GenServer.start_link(__MODULE__, opts, name: name)
  end

  def get(key, server \\ __MODULE__) do
    GenServer.call(server, {:get, key})
  end

  def put(key, value, server \\ __MODULE__) do
    GenServer.cast(server, {:put, key, value})
  end

  # Server callbacks
  @impl true
  def init(opts) do
    ttl = Keyword.get(opts, :ttl, :timer.minutes(5))
    schedule_cleanup(ttl)
    {:ok, %{cache: %{}, ttl: ttl}}
  end

  @impl true
  def handle_call({:get, key}, _from, %{cache: cache} = state) do
    {:reply, Map.get(cache, key), state}
  end

  @impl true
  def handle_cast({:put, key, value}, %{cache: cache} = state) do
    {:noreply, %{state | cache: Map.put(cache, key, {value, System.monotonic_time()})}}
  end

  @impl true
  def handle_info(:cleanup, %{cache: cache, ttl: ttl} = state) do
    now = System.monotonic_time()
    new_cache = Enum.filter(cache, fn {_k, {_v, time}} ->
      System.convert_time_unit(now - time, :native, :millisecond) < ttl
    end) |> Map.new()

    schedule_cleanup(ttl)
    {:noreply, %{state | cache: new_cache}}
  end

  defp schedule_cleanup(ttl), do: Process.send_after(self(), :cleanup, ttl)
end
```

## Testing Standards

```elixir
defmodule MyApp.Users.UserTest do
  use MyApp.DataCase, async: true

  alias MyApp.Users
  alias MyApp.Users.User

  describe "create_user/1" do
    test "creates user with valid attributes" do
      attrs = %{email: "test@example.com", name: "Test", password: "SecurePass123"}

      assert {:ok, %User{} = user} = Users.create_user(attrs)
      assert user.email == "test@example.com"
      assert user.password_hash != nil
    end

    test "returns error with invalid email" do
      attrs = %{email: "invalid", name: "Test", password: "SecurePass123"}

      assert {:error, changeset} = Users.create_user(attrs)
      assert "has invalid format" in errors_on(changeset).email
    end
  end

  describe "get_user/1" do
    setup do
      user = insert(:user)
      %{user: user}
    end

    test "returns user when exists", %{user: user} do
      assert {:ok, found} = Users.get_user(user.id)
      assert found.id == user.id
    end

    test "returns error when not found" do
      assert {:error, :not_found} = Users.get_user(Ecto.UUID.generate())
    end
  end
end
```

## Documentation

```elixir
@moduledoc """
Handles user authentication and session management.

## Examples

    iex> MyApp.Auth.authenticate("user@example.com", "password")
    {:ok, %User{}}

    iex> MyApp.Auth.authenticate("user@example.com", "wrong")
    {:error, :invalid_credentials}

## Configuration

    config :my_app, MyApp.Auth,
      token_ttl: :timer.hours(24),
      max_sessions: 5
"""

@doc """
Authenticates a user by email and password.

Returns `{:ok, user}` on success or `{:error, reason}` on failure.

## Parameters

  * `email` - The user's email address
  * `password` - The plaintext password to verify

## Examples

    iex> authenticate("valid@email.com", "correct_password")
    {:ok, %User{email: "valid@email.com"}}

    iex> authenticate("valid@email.com", "wrong_password")
    {:error, :invalid_credentials}

"""
@spec authenticate(String.t(), String.t()) :: {:ok, User.t()} | {:error, atom()}
def authenticate(email, password) do
  # implementation
end
```

## Phoenix Specific

```elixir
# Controllers - thin, delegate to contexts
defmodule MyAppWeb.UserController do
  use MyAppWeb, :controller

  alias MyApp.Users

  action_fallback MyAppWeb.FallbackController

  def index(conn, params) do
    users = Users.list_users(params)
    render(conn, :index, users: users)
  end

  def create(conn, %{"user" => user_params}) do
    with {:ok, user} <- Users.create_user(user_params) do
      conn
      |> put_status(:created)
      |> put_resp_header("location", ~p"/api/users/#{user}")
      |> render(:show, user: user)
    end
  end
end

# LiveView - keep state minimal
defmodule MyAppWeb.UserLive.Index do
  use MyAppWeb, :live_view

  @impl true
  def mount(_params, _session, socket) do
    {:ok, stream(socket, :users, Users.list_users())}
  end

  @impl true
  def handle_event("delete", %{"id" => id}, socket) do
    user = Users.get_user!(id)
    {:ok, _} = Users.delete_user(user)
    {:noreply, stream_delete(socket, :users, user)}
  end
end
```

## Performance Guidelines

1. **Use streams for large collections**
2. **Avoid N+1 queries with preloads**
3. **Use async operations for I/O**
4. **Cache expensive computations**
5. **Use ETS for read-heavy caches**

## Credo Configuration

```elixir
# .credo.exs
%{
  configs: [
    %{
      name: "default",
      checks: [
        {Credo.Check.Readability.MaxLineLength, max_length: 120},
        {Credo.Check.Design.TagTODO, exit_status: 0},
        {Credo.Check.Refactor.Nesting, max_nesting: 3}
      ]
    }
  ]
}
```

Follow these standards for maintainable, idiomatic Elixir code.
