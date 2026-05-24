---
name: phoenix-project-architect
description: Production-ready Phoenix/Elixir project structure with contexts, LiveView, and OTP patterns
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: project-structure
  tags: [phoenix, elixir, liveview, otp, project-structure, functional]
---

# Phoenix Project Architect Mode

You are an expert in structuring production-ready Phoenix applications with proper contexts, LiveView patterns, and OTP supervision trees.

## Project Structure

```text
phoenix_project/
├── lib/
│   ├── phoenix_project/
│   │   ├── application.ex           # OTP Application
│   │   ├── repo.ex                   # Ecto Repo
│   │   ├── mailer.ex                 # Swoosh Mailer
│   │   │
│   │   ├── accounts/                 # Accounts context
│   │   │   ├── accounts.ex           # Context module
│   │   │   ├── user.ex               # User schema
│   │   │   ├── user_token.ex         # Token schema
│   │   │   └── user_notifier.ex      # Email notifications
│   │   │
│   │   ├── catalog/                  # Catalog context
│   │   │   ├── catalog.ex
│   │   │   ├── product.ex
│   │   │   └── category.ex
│   │   │
│   │   ├── orders/                   # Orders context
│   │   │   ├── orders.ex
│   │   │   ├── order.ex
│   │   │   └── line_item.ex
│   │   │
│   │   └── workers/                  # Background jobs
│   │       ├── email_worker.ex
│   │       └── cleanup_worker.ex
│   │
│   └── phoenix_project_web/
│       ├── endpoint.ex
│       ├── router.ex
│       ├── telemetry.ex
│       ├── gettext.ex
│       │
│       ├── components/
│       │   ├── core_components.ex    # Core UI components
│       │   ├── layouts.ex            # Layout components
│       │   └── layouts/
│       │       ├── root.html.heex
│       │       └── app.html.heex
│       │
│       ├── controllers/
│       │   ├── page_controller.ex
│       │   ├── page_html.ex
│       │   ├── user_session_controller.ex
│       │   └── api/
│       │       └── v1/
│       │           ├── user_controller.ex
│       │           ├── product_controller.ex
│       │           └── fallback_controller.ex
│       │
│       ├── live/
│       │   ├── user_live/
│       │   │   ├── index.ex
│       │   │   ├── show.ex
│       │   │   └── form_component.ex
│       │   ├── product_live/
│       │   │   ├── index.ex
│       │   │   └── show.ex
│       │   └── dashboard_live.ex
│       │
│       ├── channels/
│       │   ├── user_socket.ex
│       │   └── room_channel.ex
│       │
│       └── plugs/
│           ├── auth.ex
│           └── api_auth.ex
│
├── priv/
│   ├── repo/
│   │   ├── migrations/
│   │   └── seeds.exs
│   ├── static/
│   │   └── images/
│   └── gettext/
│
├── test/
│   ├── support/
│   │   ├── conn_case.ex
│   │   ├── data_case.ex
│   │   └── fixtures/
│   │       ├── accounts_fixtures.ex
│   │       └── catalog_fixtures.ex
│   ├── phoenix_project/
│   │   ├── accounts_test.exs
│   │   └── catalog_test.exs
│   └── phoenix_project_web/
│       ├── controllers/
│       └── live/
│
├── config/
│   ├── config.exs
│   ├── dev.exs
│   ├── prod.exs
│   ├── runtime.exs
│   └── test.exs
│
├── assets/
│   ├── js/
│   │   └── app.js
│   ├── css/
│   │   └── app.css
│   └── tailwind.config.js
│
├── .formatter.exs
├── .gitignore
├── mix.exs
├── mix.lock
└── README.md
```

## Core Files

```elixir
# lib/phoenix_project/application.ex
defmodule PhoenixProject.Application do
  use Application

  @impl true
  def start(_type, _args) do
    children = [
      PhoenixProjectWeb.Telemetry,
      PhoenixProject.Repo,
      {DNSCluster, query: Application.get_env(:phoenix_project, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: PhoenixProject.PubSub},
      {Finch, name: PhoenixProject.Finch},
      # Background job processor
      {Oban, Application.fetch_env!(:phoenix_project, Oban)},
      PhoenixProjectWeb.Endpoint
    ]

    opts = [strategy: :one_for_one, name: PhoenixProject.Supervisor]
    Supervisor.start_link(children, opts)
  end

  @impl true
  def config_change(changed, _new, removed) do
    PhoenixProjectWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
```

```elixir
# lib/phoenix_project/accounts/accounts.ex
defmodule PhoenixProject.Accounts do
  @moduledoc """
  The Accounts context - handles user management and authentication.
  """
  import Ecto.Query, warn: false
  alias PhoenixProject.Repo
  alias PhoenixProject.Accounts.{User, UserToken, UserNotifier}

  ## User queries

  def list_users(opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)

    User
    |> order_by(desc: :inserted_at)
    |> limit(^per_page)
    |> offset(^((page - 1) * per_page))
    |> Repo.all()
  end

  def get_user!(id), do: Repo.get!(User, id)

  def get_user_by_email(email) when is_binary(email) do
    Repo.get_by(User, email: email)
  end

  def get_user_by_email_and_password(email, password)
      when is_binary(email) and is_binary(password) do
    user = get_user_by_email(email)
    if User.valid_password?(user, password), do: user
  end

  ## User registration

  def register_user(attrs) do
    %User{}
    |> User.registration_changeset(attrs)
    |> Repo.insert()
  end

  def change_user_registration(%User{} = user, attrs \\ %{}) do
    User.registration_changeset(user, attrs, hash_password: false, validate_email: false)
  end

  ## User updates

  def update_user(%User{} = user, attrs) do
    user
    |> User.update_changeset(attrs)
    |> Repo.update()
  end

  def delete_user(%User{} = user) do
    Repo.delete(user)
  end

  ## Session management

  def generate_user_session_token(user) do
    {token, user_token} = UserToken.build_session_token(user)
    Repo.insert!(user_token)
    token
  end

  def get_user_by_session_token(token) do
    {:ok, query} = UserToken.verify_session_token_query(token)
    Repo.one(query)
  end

  def delete_user_session_token(token) do
    Repo.delete_all(UserToken.by_token_and_context_query(token, "session"))
    :ok
  end
end
```

```elixir
# lib/phoenix_project/accounts/user.ex
defmodule PhoenixProject.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset

  @derive {Jason.Encoder, only: [:id, :email, :name, :role, :inserted_at]}

  schema "users" do
    field :email, :string
    field :name, :string
    field :password, :string, virtual: true, redact: true
    field :hashed_password, :string, redact: true
    field :role, Ecto.Enum, values: [:user, :admin], default: :user
    field :confirmed_at, :naive_datetime

    has_many :orders, PhoenixProject.Orders.Order

    timestamps(type: :utc_datetime)
  end

  def registration_changeset(user, attrs, opts \\ []) do
    user
    |> cast(attrs, [:email, :name, :password])
    |> validate_email(opts)
    |> validate_password(opts)
  end

  def update_changeset(user, attrs) do
    user
    |> cast(attrs, [:name, :role])
    |> validate_required([:name])
  end

  defp validate_email(changeset, opts) do
    changeset
    |> validate_required([:email])
    |> validate_format(:email, ~r/^[^\s]+@[^\s]+$/, message: "must be a valid email")
    |> validate_length(:email, max: 160)
    |> maybe_validate_unique_email(opts)
  end

  defp validate_password(changeset, opts) do
    changeset
    |> validate_required([:password])
    |> validate_length(:password, min: 8, max: 72)
    |> maybe_hash_password(opts)
  end

  defp maybe_hash_password(changeset, opts) do
    hash_password? = Keyword.get(opts, :hash_password, true)
    password = get_change(changeset, :password)

    if hash_password? && password && changeset.valid? do
      put_change(changeset, :hashed_password, Bcrypt.hash_pwd_salt(password))
    else
      changeset
    end
  end

  defp maybe_validate_unique_email(changeset, opts) do
    if Keyword.get(opts, :validate_email, true) do
      changeset
      |> unsafe_validate_unique(:email, PhoenixProject.Repo)
      |> unique_constraint(:email)
    else
      changeset
    end
  end

  def valid_password?(%__MODULE__{hashed_password: hashed}, password)
      when is_binary(hashed) and byte_size(password) > 0 do
    Bcrypt.verify_pass(password, hashed)
  end

  def valid_password?(_, _), do: Bcrypt.no_user_verify()
end
```

```elixir
# lib/phoenix_project_web/live/product_live/index.ex
defmodule PhoenixProjectWeb.ProductLive.Index do
  use PhoenixProjectWeb, :live_view

  alias PhoenixProject.Catalog
  alias PhoenixProject.Catalog.Product

  @impl true
  def mount(_params, _session, socket) do
    if connected?(socket), do: Catalog.subscribe()

    {:ok,
     socket
     |> assign(:page_title, "Products")
     |> stream(:products, Catalog.list_products())}
  end

  @impl true
  def handle_params(params, _url, socket) do
    {:noreply, apply_action(socket, socket.assigns.live_action, params)}
  end

  defp apply_action(socket, :edit, %{"id" => id}) do
    socket
    |> assign(:page_title, "Edit Product")
    |> assign(:product, Catalog.get_product!(id))
  end

  defp apply_action(socket, :new, _params) do
    socket
    |> assign(:page_title, "New Product")
    |> assign(:product, %Product{})
  end

  defp apply_action(socket, :index, _params) do
    socket
    |> assign(:page_title, "Products")
    |> assign(:product, nil)
  end

  @impl true
  def handle_info({PhoenixProjectWeb.ProductLive.FormComponent, {:saved, product}}, socket) do
    {:noreply, stream_insert(socket, :products, product)}
  end

  @impl true
  def handle_info({:product_created, product}, socket) do
    {:noreply, stream_insert(socket, :products, product, at: 0)}
  end

  @impl true
  def handle_info({:product_updated, product}, socket) do
    {:noreply, stream_insert(socket, :products, product)}
  end

  @impl true
  def handle_event("delete", %{"id" => id}, socket) do
    product = Catalog.get_product!(id)
    {:ok, _} = Catalog.delete_product(product)

    {:noreply, stream_delete(socket, :products, product)}
  end
end
```

```elixir
# lib/phoenix_project_web/controllers/api/v1/user_controller.ex
defmodule PhoenixProjectWeb.API.V1.UserController do
  use PhoenixProjectWeb, :controller

  alias PhoenixProject.Accounts
  alias PhoenixProject.Accounts.User

  action_fallback PhoenixProjectWeb.API.V1.FallbackController

  def index(conn, params) do
    page = Map.get(params, "page", 1)
    users = Accounts.list_users(page: page)
    render(conn, :index, users: users)
  end

  def show(conn, %{"id" => id}) do
    user = Accounts.get_user!(id)
    render(conn, :show, user: user)
  end

  def create(conn, %{"user" => user_params}) do
    with {:ok, %User{} = user} <- Accounts.register_user(user_params) do
      conn
      |> put_status(:created)
      |> put_resp_header("location", ~p"/api/v1/users/#{user}")
      |> render(:show, user: user)
    end
  end

  def update(conn, %{"id" => id, "user" => user_params}) do
    user = Accounts.get_user!(id)

    with {:ok, %User{} = user} <- Accounts.update_user(user, user_params) do
      render(conn, :show, user: user)
    end
  end

  def delete(conn, %{"id" => id}) do
    user = Accounts.get_user!(id)

    with {:ok, %User{}} <- Accounts.delete_user(user) do
      send_resp(conn, :no_content, "")
    end
  end
end
```

```elixir
# mix.exs
defmodule PhoenixProject.MixProject do
  use Mix.Project

  def project do
    [
      app: :phoenix_project,
      version: "0.1.0",
      elixir: "~> 1.15",
      elixirc_paths: elixirc_paths(Mix.env()),
      start_permanent: Mix.env() == :prod,
      aliases: aliases(),
      deps: deps()
    ]
  end

  def application do
    [
      mod: {PhoenixProject.Application, []},
      extra_applications: [:logger, :runtime_tools]
    ]
  end

  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  defp deps do
    [
      {:phoenix, "~> 1.7.10"},
      {:phoenix_ecto, "~> 4.4"},
      {:ecto_sql, "~> 3.10"},
      {:postgrex, ">= 0.0.0"},
      {:phoenix_html, "~> 4.0"},
      {:phoenix_live_reload, "~> 1.2", only: :dev},
      {:phoenix_live_view, "~> 0.20.0"},
      {:phoenix_live_dashboard, "~> 0.8.2"},
      {:swoosh, "~> 1.5"},
      {:finch, "~> 0.13"},
      {:telemetry_metrics, "~> 0.6"},
      {:telemetry_poller, "~> 1.0"},
      {:gettext, "~> 0.20"},
      {:jason, "~> 1.2"},
      {:dns_cluster, "~> 0.1.1"},
      {:bandit, "~> 1.0"},
      {:bcrypt_elixir, "~> 3.0"},
      {:oban, "~> 2.17"}
    ]
  end

  defp aliases do
    [
      setup: ["deps.get", "ecto.setup", "assets.setup", "assets.build"],
      "ecto.setup": ["ecto.create", "ecto.migrate", "run priv/repo/seeds.exs"],
      "ecto.reset": ["ecto.drop", "ecto.setup"],
      test: ["ecto.create --quiet", "ecto.migrate --quiet", "test"]
    ]
  end
end
```

## Best Practices

- Use contexts to organize business logic
- Keep controllers thin, logic in contexts
- Use LiveView for real-time features
- Implement PubSub for live updates
- Use Oban for background jobs
- Write comprehensive tests with fixtures
- Use changesets for data validation
