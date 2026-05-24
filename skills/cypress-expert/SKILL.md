---
name: cypress-expert
description: Expert in Cypress for end-to-end testing, component testing, and modern web application testing. Use when writing, running, or improving tests with cypress.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: testing
  tags: [cypress, testing, e2e, automation, javascript, typescript]
---

# Cypress Expert Mode

You are an expert in Cypress, the JavaScript end-to-end testing framework. You help teams build fast, reliable tests with best practices for modern web applications.

## Configuration

### cypress.config.ts

```typescript
import { defineConfig } from "cypress";

export default defineConfig({
  projectId: "your-project-id",

  e2e: {
    baseUrl: "http://localhost:3000",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/e2e.ts",
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 30000,
    retries: {
      runMode: 2,
      openMode: 0,
    },
    experimentalRunAllSpecs: true,

    setupNodeEvents(on, config) {
      // Task registration
      on("task", {
        log(message) {
          console.log(message);
          return null;
        },
        seedDatabase(data) {
          // Seed database logic
          return null;
        },
        clearDatabase() {
          // Clear database logic
          return null;
        },
      });

      // Code coverage
      require("@cypress/code-coverage/task")(on, config);

      return config;
    },
  },

  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
    specPattern: "src/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/component.ts",
  },

  env: {
    apiUrl: "http://localhost:3001/api",
    coverage: true,
  },
});
```

### Support Files

```typescript
// cypress/support/e2e.ts
import "./commands";
import "@cypress/code-coverage/support";

// Handle uncaught exceptions
Cypress.on("uncaught:exception", (err, runnable) => {
  // Return false to prevent test failure on uncaught exceptions
  if (err.message.includes("ResizeObserver loop")) {
    return false;
  }
  return true;
});

// Log API calls for debugging
beforeEach(() => {
  cy.intercept("**/*").as("apiCall");
});
```

```typescript
// cypress/support/commands.ts
import "@testing-library/cypress/add-commands";

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      logout(): Chainable<void>;
      apiLogin(email: string, password: string): Chainable<void>;
      dataCy(value: string): Chainable<JQuery<HTMLElement>>;
      getByRole(role: string, options?: { name?: string | RegExp }): Chainable<JQuery<HTMLElement>>;
      shouldBeVisible(): Chainable<JQuery<HTMLElement>>;
      shouldNotExist(): Chainable<JQuery<HTMLElement>>;
      waitForApi(alias: string): Chainable<void>;
      mockApi(method: string, url: string, response: object): Chainable<void>;
    }
  }
}

// Login via UI
Cypress.Commands.add("login", (email: string, password: string) => {
  cy.visit("/login");
  cy.get("[data-cy=email-input]").type(email);
  cy.get("[data-cy=password-input]").type(password);
  cy.get("[data-cy=submit-button]").click();
  cy.url().should("include", "/dashboard");
});

// Login via API (faster for setup)
Cypress.Commands.add("apiLogin", (email: string, password: string) => {
  cy.request({
    method: "POST",
    url: `${Cypress.env("apiUrl")}/auth/login`,
    body: { email, password },
  }).then((response) => {
    window.localStorage.setItem("token", response.body.token);
  });
});

// Logout
Cypress.Commands.add("logout", () => {
  cy.window().then((win) => {
    win.localStorage.removeItem("token");
  });
  cy.visit("/login");
});

// Data-cy selector shorthand
Cypress.Commands.add("dataCy", (value: string) => {
  return cy.get(`[data-cy="${value}"]`);
});

// Get by role
Cypress.Commands.add("getByRole", (role: string, options?: { name?: string | RegExp }) => {
  if (options?.name) {
    return cy.get(`[role="${role}"]`).filter(`:contains("${options.name}")`);
  }
  return cy.get(`[role="${role}"]`);
});

// Visibility assertions
Cypress.Commands.add("shouldBeVisible", { prevSubject: true }, (subject) => {
  cy.wrap(subject).should("be.visible");
});

Cypress.Commands.add("shouldNotExist", { prevSubject: true }, (subject) => {
  cy.wrap(subject).should("not.exist");
});

// Wait for API with assertion
Cypress.Commands.add("waitForApi", (alias: string) => {
  cy.wait(`@${alias}`).its("response.statusCode").should("be.oneOf", [200, 201]);
});

// Mock API helper
Cypress.Commands.add("mockApi", (method: string, url: string, response: object) => {
  cy.intercept(method, url, response).as("mockedApi");
});
```

## Page Objects

### Base Page

```typescript
// cypress/pages/BasePage.ts
export class BasePage {
  visit(url: string) {
    cy.visit(url);
    return this;
  }

  getByTestId(testId: string) {
    return cy.get(`[data-testid="${testId}"]`);
  }

  getByDataCy(dataCy: string) {
    return cy.get(`[data-cy="${dataCy}"]`);
  }

  clickButton(name: string) {
    cy.contains("button", name).click();
    return this;
  }

  fillInput(label: string, value: string) {
    cy.contains("label", label).parent().find("input").clear().type(value);
    return this;
  }

  selectOption(label: string, option: string) {
    cy.contains("label", label).parent().find("select").select(option);
    return this;
  }

  assertUrl(expectedUrl: string) {
    cy.url().should("include", expectedUrl);
    return this;
  }

  assertToast(message: string) {
    cy.get('[role="alert"]').should("contain", message);
    return this;
  }

  waitForPageLoad() {
    cy.get('[data-loading="true"]').should("not.exist");
    return this;
  }
}
```

### Login Page

```typescript
// cypress/pages/LoginPage.ts
import { BasePage } from "./BasePage";

export class LoginPage extends BasePage {
  // Selectors
  private selectors = {
    emailInput: '[data-cy="email-input"]',
    passwordInput: '[data-cy="password-input"]',
    submitButton: '[data-cy="submit-button"]',
    errorMessage: '[data-cy="error-message"]',
    forgotPasswordLink: '[data-cy="forgot-password"]',
    rememberMeCheckbox: '[data-cy="remember-me"]',
  };

  visit() {
    super.visit("/login");
    return this;
  }

  typeEmail(email: string) {
    cy.get(this.selectors.emailInput).clear().type(email);
    return this;
  }

  typePassword(password: string) {
    cy.get(this.selectors.passwordInput).clear().type(password);
    return this;
  }

  clickSubmit() {
    cy.get(this.selectors.submitButton).click();
    return this;
  }

  checkRememberMe() {
    cy.get(this.selectors.rememberMeCheckbox).check();
    return this;
  }

  login(email: string, password: string) {
    this.typeEmail(email);
    this.typePassword(password);
    this.clickSubmit();
    return this;
  }

  assertError(message: string) {
    cy.get(this.selectors.errorMessage).should("contain", message);
    return this;
  }

  assertLoginSuccess() {
    cy.url().should("include", "/dashboard");
    return this;
  }

  clickForgotPassword() {
    cy.get(this.selectors.forgotPasswordLink).click();
    return this;
  }
}

export const loginPage = new LoginPage();
```

### Dashboard Page

```typescript
// cypress/pages/DashboardPage.ts
import { BasePage } from "./BasePage";

export class DashboardPage extends BasePage {
  private selectors = {
    welcomeMessage: '[data-cy="welcome-message"]',
    userMenu: '[data-cy="user-menu"]',
    logoutButton: '[data-cy="logout-button"]',
    statsCard: '[data-cy="stats-card"]',
    recentActivity: '[data-cy="recent-activity"]',
    searchInput: '[data-cy="search-input"]',
    notificationBell: '[data-cy="notification-bell"]',
  };

  visit() {
    super.visit("/dashboard");
    return this;
  }

  assertWelcomeMessage(name: string) {
    cy.get(this.selectors.welcomeMessage).should("contain", name);
    return this;
  }

  openUserMenu() {
    cy.get(this.selectors.userMenu).click();
    return this;
  }

  logout() {
    this.openUserMenu();
    cy.get(this.selectors.logoutButton).click();
    cy.url().should("include", "/login");
    return this;
  }

  getStatsCards() {
    return cy.get(this.selectors.statsCard);
  }

  assertStatsValue(cardName: string, value: string) {
    cy.get(this.selectors.statsCard).contains(cardName).parent().should("contain", value);
    return this;
  }

  search(query: string) {
    cy.get(this.selectors.searchInput).type(query).type("{enter}");
    return this;
  }

  getNotificationCount() {
    return cy.get(this.selectors.notificationBell).find(".badge");
  }
}

export const dashboardPage = new DashboardPage();
```

## Test Patterns

### Authentication Tests

```typescript
// cypress/e2e/auth/login.cy.ts
import { loginPage } from "../../pages/LoginPage";
import { dashboardPage } from "../../pages/DashboardPage";

describe("Login", () => {
  beforeEach(() => {
    cy.task("clearDatabase");
    cy.task("seedDatabase", { users: [{ email: "test@example.com", password: "password123" }] });
    loginPage.visit();
  });

  it("should login with valid credentials", () => {
    loginPage.login("test@example.com", "password123").assertLoginSuccess();

    dashboardPage.assertWelcomeMessage("Test User");
  });

  it("should show error with invalid credentials", () => {
    loginPage.login("wrong@example.com", "wrongpassword").assertError("Invalid email or password");
  });

  it("should validate required fields", () => {
    loginPage.clickSubmit();

    cy.get('[data-cy="email-input"]').should("have.attr", "aria-invalid", "true");
    cy.get('[data-cy="password-input"]').should("have.attr", "aria-invalid", "true");
  });

  it("should persist session with remember me", () => {
    loginPage.checkRememberMe().login("test@example.com", "password123");

    // Clear session storage but not local storage
    cy.window().then((win) => win.sessionStorage.clear());
    cy.reload();

    // Should still be logged in
    dashboardPage.assertWelcomeMessage("Test User");
  });
});
```

### API Mocking Tests

```typescript
// cypress/e2e/dashboard/data.cy.ts
describe("Dashboard Data", () => {
  beforeEach(() => {
    cy.apiLogin("test@example.com", "password123");
  });

  it("should display data from API", () => {
    cy.intercept("GET", "/api/dashboard/stats", {
      statusCode: 200,
      body: {
        totalUsers: 100,
        activeUsers: 85,
        revenue: 50000,
      },
    }).as("getStats");

    cy.visit("/dashboard");
    cy.wait("@getStats");

    cy.dataCy("stats-total-users").should("contain", "100");
    cy.dataCy("stats-active-users").should("contain", "85");
    cy.dataCy("stats-revenue").should("contain", "$50,000");
  });

  it("should handle API errors gracefully", () => {
    cy.intercept("GET", "/api/dashboard/stats", {
      statusCode: 500,
      body: { error: "Internal Server Error" },
    }).as("getStatsError");

    cy.visit("/dashboard");
    cy.wait("@getStatsError");

    cy.dataCy("error-message").should("be.visible");
    cy.dataCy("retry-button").should("be.visible");
  });

  it("should show loading state", () => {
    cy.intercept("GET", "/api/dashboard/stats", (req) => {
      req.on("response", (res) => {
        res.setDelay(2000);
      });
    }).as("getStatsSlow");

    cy.visit("/dashboard");
    cy.dataCy("loading-spinner").should("be.visible");
    cy.wait("@getStatsSlow");
    cy.dataCy("loading-spinner").should("not.exist");
  });

  it("should refresh data on button click", () => {
    let callCount = 0;
    cy.intercept("GET", "/api/dashboard/stats", (req) => {
      callCount++;
      req.reply({
        body: { totalUsers: callCount * 10 },
      });
    }).as("getStats");

    cy.visit("/dashboard");
    cy.wait("@getStats");
    cy.dataCy("stats-total-users").should("contain", "10");

    cy.dataCy("refresh-button").click();
    cy.wait("@getStats");
    cy.dataCy("stats-total-users").should("contain", "20");
  });
});
```

### Form Testing

```typescript
// cypress/e2e/forms/user-form.cy.ts
describe("User Form", () => {
  beforeEach(() => {
    cy.apiLogin("admin@example.com", "adminpass");
    cy.visit("/users/new");
  });

  it("should create a new user", () => {
    cy.intercept("POST", "/api/users", {
      statusCode: 201,
      body: { id: 1, name: "New User", email: "new@example.com" },
    }).as("createUser");

    cy.dataCy("name-input").type("New User");
    cy.dataCy("email-input").type("new@example.com");
    cy.dataCy("role-select").select("Editor");
    cy.dataCy("submit-button").click();

    cy.wait("@createUser").its("request.body").should("deep.include", {
      name: "New User",
      email: "new@example.com",
      role: "editor",
    });

    cy.url().should("include", "/users/1");
    cy.get('[role="alert"]').should("contain", "User created successfully");
  });

  it("should validate email format", () => {
    cy.dataCy("email-input").type("invalid-email");
    cy.dataCy("submit-button").click();

    cy.dataCy("email-error").should("contain", "Please enter a valid email");
  });

  it("should prevent duplicate emails", () => {
    cy.intercept("POST", "/api/users", {
      statusCode: 409,
      body: { error: "Email already exists" },
    }).as("createUser");

    cy.dataCy("name-input").type("Test User");
    cy.dataCy("email-input").type("existing@example.com");
    cy.dataCy("submit-button").click();

    cy.wait("@createUser");
    cy.dataCy("form-error").should("contain", "Email already exists");
  });

  it("should handle file upload", () => {
    cy.dataCy("avatar-input").selectFile("cypress/fixtures/avatar.png");
    cy.dataCy("avatar-preview").should("be.visible");
  });
});
```

### Data-Driven Testing

```typescript
// cypress/e2e/data-driven/validation.cy.ts
interface TestCase {
  description: string;
  input: { email: string; password: string };
  expectedError?: string;
  shouldSucceed?: boolean;
}

const testCases: TestCase[] = [
  {
    description: "valid credentials",
    input: { email: "user@example.com", password: "ValidPass123!" },
    shouldSucceed: true,
  },
  {
    description: "empty email",
    input: { email: "", password: "password123" },
    expectedError: "Email is required",
  },
  {
    description: "invalid email format",
    input: { email: "invalid-email", password: "password123" },
    expectedError: "Please enter a valid email",
  },
  {
    description: "short password",
    input: { email: "user@example.com", password: "123" },
    expectedError: "Password must be at least 8 characters",
  },
  {
    description: "password without uppercase",
    input: { email: "user@example.com", password: "password123!" },
    expectedError: "Password must contain an uppercase letter",
  },
];

describe("Form Validation", () => {
  beforeEach(() => {
    cy.visit("/register");
  });

  testCases.forEach(({ description, input, expectedError, shouldSucceed }) => {
    it(`handles ${description}`, () => {
      if (input.email) {
        cy.dataCy("email-input").type(input.email);
      }
      if (input.password) {
        cy.dataCy("password-input").type(input.password);
      }

      cy.dataCy("submit-button").click();

      if (shouldSucceed) {
        cy.url().should("include", "/dashboard");
      } else if (expectedError) {
        cy.get('[role="alert"]').should("contain", expectedError);
      }
    });
  });
});
```

### Component Testing

```typescript
// src/components/Button/Button.cy.tsx
import { Button } from './Button';

describe('Button Component', () => {
  it('renders with default props', () => {
    cy.mount(<Button>Click me</Button>);
    cy.get('button').should('have.text', 'Click me');
  });

  it('handles click events', () => {
    const onClick = cy.stub().as('onClick');
    cy.mount(<Button onClick={onClick}>Click</Button>);

    cy.get('button').click();
    cy.get('@onClick').should('have.been.calledOnce');
  });

  it('applies variant classes', () => {
    cy.mount(<Button variant="primary">Primary</Button>);
    cy.get('button').should('have.class', 'btn-primary');

    cy.mount(<Button variant="secondary">Secondary</Button>);
    cy.get('button').should('have.class', 'btn-secondary');
  });

  it('shows loading state', () => {
    cy.mount(<Button loading>Loading</Button>);
    cy.get('button').should('be.disabled');
    cy.get('[data-cy="spinner"]').should('be.visible');
  });

  it('renders as a link when href is provided', () => {
    cy.mount(<Button href="/about">About</Button>);
    cy.get('a').should('have.attr', 'href', '/about');
  });

  it('is accessible', () => {
    cy.mount(<Button aria-label="Submit form">Submit</Button>);
    cy.get('button').should('have.attr', 'aria-label', 'Submit form');
  });
});
```

```typescript
// src/components/Modal/Modal.cy.tsx
import { Modal } from './Modal';

describe('Modal Component', () => {
  it('opens and closes correctly', () => {
    const onClose = cy.stub().as('onClose');
    cy.mount(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    cy.get('[role="dialog"]').should('be.visible');
    cy.get('[data-cy="modal-title"]').should('have.text', 'Test Modal');
    cy.contains('Modal content').should('be.visible');

    cy.get('[data-cy="close-button"]').click();
    cy.get('@onClose').should('have.been.calledOnce');
  });

  it('closes on escape key', () => {
    const onClose = cy.stub().as('onClose');
    cy.mount(
      <Modal isOpen={true} onClose={onClose} title="Test">
        Content
      </Modal>
    );

    cy.get('body').type('{esc}');
    cy.get('@onClose').should('have.been.calledOnce');
  });

  it('closes on backdrop click', () => {
    const onClose = cy.stub().as('onClose');
    cy.mount(
      <Modal isOpen={true} onClose={onClose} title="Test">
        Content
      </Modal>
    );

    cy.get('[data-cy="modal-backdrop"]').click({ force: true });
    cy.get('@onClose').should('have.been.calledOnce');
  });

  it('traps focus within modal', () => {
    cy.mount(
      <Modal isOpen={true} onClose={() => {}} title="Test">
        <input data-cy="input-1" />
        <input data-cy="input-2" />
        <button data-cy="button">Submit</button>
      </Modal>
    );

    cy.dataCy('input-1').focus();
    cy.dataCy('button').focus();
    cy.realPress('Tab');
    cy.focused().should('have.attr', 'data-cy', 'close-button');
  });
});
```

## CI/CD Integration

```yaml
# .github/workflows/cypress.yml
name: Cypress Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  cypress-run:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        containers: [1, 2, 3, 4]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Start server
        run: npm run start &

      - name: Cypress run
        uses: cypress-io/github-action@v6
        with:
          wait-on: "http://localhost:3000"
          record: true
          parallel: true
          group: "E2E Tests"
        env:
          CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SPLIT: ${{ strategy.job-total }}
          SPLIT_INDEX: ${{ strategy.job-index }}

      - name: Upload screenshots
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: cypress-screenshots-${{ matrix.containers }}
          path: cypress/screenshots

      - name: Upload videos
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: cypress-videos-${{ matrix.containers }}
          path: cypress/videos
```

## Best Practices

1. **Selectors**
   - Use data-cy/data-testid attributes
   - Avoid CSS classes and complex selectors
   - Use Testing Library queries when possible

2. **Commands**
   - Create reusable custom commands
   - Use API for test setup (faster than UI)
   - Keep commands focused and composable

3. **Waits**
   - Never use arbitrary cy.wait(ms)
   - Wait for specific elements or API calls
   - Use retry-ability built into commands

4. **Test Isolation**
   - Reset state before each test
   - Don't rely on test order
   - Mock external services

5. **Performance**
   - Use API login instead of UI login
   - Parallelize test runs
   - Use fixtures for large data sets
