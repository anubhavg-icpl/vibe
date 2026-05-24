---
name: playwright-expert
description: Expert in Playwright for end-to-end testing, component testing, API testing, and browser automation
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: testing
  tags: [playwright, testing, e2e, automation, browser, typescript]
---

# Playwright Expert Mode

You are an expert in Playwright, the modern end-to-end testing framework. You help teams build reliable, fast, and maintainable test suites with advanced patterns and best practices.

## Configuration

### playwright.config.ts

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { open: "never" }],
    ["json", { outputFile: "test-results/results.json" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
    process.env.CI ? ["github"] : ["list"],
  ],

  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    // Setup project for authentication
    { name: "setup", testMatch: /.*\.setup\.ts/ },

    // Desktop browsers
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      dependencies: ["setup"],
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      dependencies: ["setup"],
    },

    // Mobile browsers
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
      dependencies: ["setup"],
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
      dependencies: ["setup"],
    },

    // Branded browsers
    {
      name: "Microsoft Edge",
      use: { ...devices["Desktop Edge"], channel: "msedge" },
      dependencies: ["setup"],
    },
    {
      name: "Google Chrome",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
      dependencies: ["setup"],
    },
  ],

  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

### Component Testing Configuration

```typescript
// playwright-ct.config.ts
import { defineConfig, devices } from "@playwright/experimental-ct-react";

export default defineConfig({
  testDir: "./tests/components",
  snapshotDir: "./__snapshots__",
  timeout: 10 * 1000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    trace: "on-first-retry",
    ctPort: 3100,
    ctViteConfig: {
      resolve: {
        alias: {
          "@": "./src",
        },
      },
    },
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
```

## Page Object Model

### Base Page

```typescript
// tests/pages/base.page.ts
import { Page, Locator, expect } from "@playwright/test";

export abstract class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  abstract readonly url: string;

  async goto() {
    await this.page.goto(this.url);
    await this.waitForPageLoad();
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState("networkidle");
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  }

  // Common actions
  async clickAndWait(locator: Locator, options?: { timeout?: number }) {
    await locator.click();
    await this.page.waitForLoadState("networkidle", options);
  }

  async fillAndBlur(locator: Locator, value: string) {
    await locator.fill(value);
    await locator.blur();
  }

  async selectByText(locator: Locator, text: string) {
    await locator.selectOption({ label: text });
  }

  async waitForToast(message: string) {
    await expect(this.page.getByRole("alert")).toContainText(message);
  }

  async waitForNavigation(urlPattern: string | RegExp) {
    await this.page.waitForURL(urlPattern);
  }
}
```

### Login Page

```typescript
// tests/pages/login.page.ts
import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class LoginPage extends BasePage {
  readonly url = "/login";

  // Locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;
  readonly rememberMeCheckbox: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByLabel("Email");
    this.passwordInput = page.getByLabel("Password");
    this.submitButton = page.getByRole("button", { name: "Sign in" });
    this.errorMessage = page.getByRole("alert");
    this.forgotPasswordLink = page.getByRole("link", { name: "Forgot password?" });
    this.registerLink = page.getByRole("link", { name: "Create account" });
    this.rememberMeCheckbox = page.getByLabel("Remember me");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async loginAndExpectSuccess(email: string, password: string) {
    await this.login(email, password);
    await this.page.waitForURL("/dashboard");
  }

  async loginAndExpectError(email: string, password: string, errorText: string) {
    await this.login(email, password);
    await expect(this.errorMessage).toContainText(errorText);
  }

  async assertFormValidation() {
    await this.submitButton.click();
    await expect(this.emailInput).toHaveAttribute("aria-invalid", "true");
  }
}
```

### Dashboard Page

```typescript
// tests/pages/dashboard.page.ts
import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class DashboardPage extends BasePage {
  readonly url = "/dashboard";

  // Locators
  readonly welcomeMessage: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;
  readonly sidebarNav: Locator;
  readonly mainContent: Locator;
  readonly searchInput: Locator;
  readonly notificationBell: Locator;

  constructor(page: Page) {
    super(page);
    this.welcomeMessage = page.getByTestId("welcome-message");
    this.userMenu = page.getByTestId("user-menu");
    this.logoutButton = page.getByRole("button", { name: "Logout" });
    this.sidebarNav = page.getByRole("navigation", { name: "Sidebar" });
    this.mainContent = page.getByRole("main");
    this.searchInput = page.getByPlaceholder("Search...");
    this.notificationBell = page.getByTestId("notifications");
  }

  async logout() {
    await this.userMenu.click();
    await this.logoutButton.click();
    await this.page.waitForURL("/login");
  }

  async navigateTo(section: string) {
    await this.sidebarNav.getByRole("link", { name: section }).click();
    await this.page.waitForLoadState("networkidle");
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press("Enter");
    await this.page.waitForLoadState("networkidle");
  }

  async assertUserLoggedIn(username: string) {
    await expect(this.welcomeMessage).toContainText(username);
  }
}
```

## Test Fixtures

### Extended Test Fixtures

```typescript
// tests/fixtures/index.ts
import { test as base, expect } from "@playwright/test";
import { LoginPage } from "../pages/login.page";
import { DashboardPage } from "../pages/dashboard.page";
import { ApiClient } from "../utils/api-client";

// Declare fixture types
type Fixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  apiClient: ApiClient;
  authenticatedPage: DashboardPage;
  testUser: { email: string; password: string; name: string };
};

// Extend base test with fixtures
export const test = base.extend<Fixtures>({
  // Page objects
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },

  // API client for test data setup
  apiClient: async ({ request }, use) => {
    const apiClient = new ApiClient(request);
    await use(apiClient);
  },

  // Pre-authenticated page
  authenticatedPage: async ({ page, testUser }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndExpectSuccess(testUser.email, testUser.password);
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },

  // Test user data
  testUser: async ({ apiClient }, use) => {
    // Create test user via API
    const user = await apiClient.createTestUser();
    await use(user);
    // Cleanup after test
    await apiClient.deleteUser(user.email);
  },
});

export { expect };
```

### Authentication Setup

```typescript
// tests/auth.setup.ts
import { test as setup, expect } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

setup("authenticate", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.TEST_USER_EMAIL!);
  await page.getByLabel("Password").fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();

  // Wait for authentication to complete
  await page.waitForURL("/dashboard");
  await expect(page.getByTestId("user-menu")).toBeVisible();

  // Save authentication state
  await page.context().storageState({ path: authFile });
});

setup("authenticate admin", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.ADMIN_EMAIL!);
  await page.getByLabel("Password").fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();

  await page.waitForURL("/admin");
  await page.context().storageState({ path: "playwright/.auth/admin.json" });
});
```

## Advanced Testing Patterns

### API Mocking

```typescript
// tests/mocks/api-mocks.ts
import { Page, Route } from "@playwright/test";

export async function mockUserApi(page: Page) {
  await page.route("**/api/users/**", async (route: Route) => {
    const url = route.request().url();

    if (url.endsWith("/me")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: 1,
          name: "Test User",
          email: "test@example.com",
          role: "user",
        }),
      });
    } else if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          users: [
            { id: 1, name: "User 1", email: "user1@example.com" },
            { id: 2, name: "User 2", email: "user2@example.com" },
          ],
          total: 2,
        }),
      });
    } else {
      await route.continue();
    }
  });
}

export async function mockApiError(page: Page, endpoint: string, status: number) {
  await page.route(`**${endpoint}`, async (route) => {
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({ error: "Something went wrong" }),
    });
  });
}

export async function mockSlowApi(page: Page, endpoint: string, delayMs: number) {
  await page.route(`**${endpoint}`, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.continue();
  });
}
```

### Network Interception Tests

```typescript
// tests/e2e/network.spec.ts
import { test, expect } from "../fixtures";

test.describe("Network handling", () => {
  test("handles API errors gracefully", async ({ page }) => {
    // Mock API to return error
    await page.route("**/api/data", (route) => route.fulfill({ status: 500, body: "Internal Server Error" }));

    await page.goto("/data");
    await expect(page.getByText("Something went wrong")).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
  });

  test("shows loading state during slow requests", async ({ page }) => {
    // Delay API response
    await page.route("**/api/data", async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ items: [] }),
      });
    });

    await page.goto("/data");
    await expect(page.getByTestId("loading-spinner")).toBeVisible();
    await expect(page.getByTestId("loading-spinner")).not.toBeVisible({ timeout: 5000 });
  });

  test("intercepts and modifies requests", async ({ page }) => {
    await page.route("**/api/search*", async (route) => {
      const url = new URL(route.request().url());
      // Add extra parameter
      url.searchParams.set("enhanced", "true");

      await route.continue({ url: url.toString() });
    });

    await page.goto("/search");
    await page.getByPlaceholder("Search").fill("test");
    await page.getByRole("button", { name: "Search" }).click();

    // Verify the modified request was made
    const [request] = await Promise.all([page.waitForRequest((req) => req.url().includes("enhanced=true"))]);
    expect(request).toBeTruthy();
  });

  test("captures and validates API responses", async ({ page }) => {
    const responsePromise = page.waitForResponse("**/api/users");

    await page.goto("/users");
    const response = await responsePromise;

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.users).toBeInstanceOf(Array);
    expect(data.users.length).toBeGreaterThan(0);
  });
});
```

### Data-Driven Tests

```typescript
// tests/e2e/login.spec.ts
import { test, expect } from "../fixtures";

const validCredentials = [
  { email: "admin@example.com", password: "admin123", expectedUrl: "/admin" },
  { email: "user@example.com", password: "user123", expectedUrl: "/dashboard" },
  { email: "manager@example.com", password: "manager123", expectedUrl: "/dashboard" },
];

const invalidCredentials = [
  { email: "wrong@example.com", password: "wrongpass", error: "Invalid credentials" },
  { email: "user@example.com", password: "wrongpass", error: "Invalid credentials" },
  { email: "", password: "password", error: "Email is required" },
  { email: "invalid-email", password: "password", error: "Invalid email format" },
];

test.describe("Login functionality", () => {
  for (const creds of validCredentials) {
    test(`successful login for ${creds.email}`, async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.login(creds.email, creds.password);
      await loginPage.page.waitForURL(creds.expectedUrl);
    });
  }

  for (const creds of invalidCredentials) {
    test(`shows error for ${creds.email || "empty email"}`, async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.loginAndExpectError(creds.email, creds.password, creds.error);
    });
  }
});
```

### Accessibility Testing

```typescript
// tests/e2e/accessibility.spec.ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility", () => {
  test("home page has no accessibility violations", async ({ page }) => {
    await page.goto("/");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("login form is accessible", async ({ page }) => {
    await page.goto("/login");

    const results = await new AxeBuilder({ page }).include("form").analyze();

    expect(results.violations).toEqual([]);
  });

  test("navigation is keyboard accessible", async ({ page }) => {
    await page.goto("/");

    // Tab through navigation
    await page.keyboard.press("Tab");
    const firstLink = page.getByRole("link").first();
    await expect(firstLink).toBeFocused();

    // Navigate with keyboard
    await page.keyboard.press("Enter");
    await page.waitForLoadState("networkidle");
  });

  test("modal traps focus correctly", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open Modal" }).click();

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    // Focus should be trapped in modal
    const focusableElements = modal.locator('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const count = await focusableElements.count();

    for (let i = 0; i < count + 1; i++) {
      await page.keyboard.press("Tab");
    }

    // Focus should cycle back to first element
    await expect(focusableElements.first()).toBeFocused();
  });
});
```

### Component Testing

```typescript
// tests/components/Button.spec.tsx
import { test, expect } from '@playwright/experimental-ct-react';
import { Button } from '../../src/components/Button';

test.describe('Button component', () => {
  test('renders with text', async ({ mount }) => {
    const component = await mount(<Button>Click me</Button>);
    await expect(component).toContainText('Click me');
  });

  test('handles click events', async ({ mount }) => {
    let clicked = false;
    const component = await mount(
      <Button onClick={() => (clicked = true)}>Click me</Button>
    );

    await component.click();
    expect(clicked).toBe(true);
  });

  test('applies variant styles', async ({ mount }) => {
    const primary = await mount(<Button variant="primary">Primary</Button>);
    const secondary = await mount(<Button variant="secondary">Secondary</Button>);
    const danger = await mount(<Button variant="danger">Danger</Button>);

    await expect(primary).toHaveClass(/primary/);
    await expect(secondary).toHaveClass(/secondary/);
    await expect(danger).toHaveClass(/danger/);
  });

  test('is disabled when prop is set', async ({ mount }) => {
    const component = await mount(<Button disabled>Disabled</Button>);

    await expect(component).toBeDisabled();
    await expect(component).toHaveCSS('cursor', 'not-allowed');
  });

  test('shows loading state', async ({ mount }) => {
    const component = await mount(<Button loading>Loading</Button>);

    await expect(component.locator('.spinner')).toBeVisible();
    await expect(component).toBeDisabled();
  });

  test('renders as link when href provided', async ({ mount }) => {
    const component = await mount(<Button href="/about">About</Button>);

    await expect(component).toHaveAttribute('href', '/about');
    expect(await component.evaluate((el) => el.tagName)).toBe('A');
  });
});
```

### Visual Comparison

```typescript
// tests/visual/pages.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Visual regression", () => {
  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
      `,
    });
  });

  test("homepage matches snapshot", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("homepage.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test("dashboard matches snapshot", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Mask dynamic content
    await page.locator(".timestamp").evaluateAll((els) => els.forEach((el) => (el.textContent = "XX:XX:XX")));

    await expect(page).toHaveScreenshot("dashboard.png", {
      mask: [page.locator(".user-avatar")],
    });
  });

  test("responsive layouts", async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: "mobile" },
      { width: 768, height: 1024, name: "tablet" },
      { width: 1440, height: 900, name: "desktop" },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/");

      await expect(page).toHaveScreenshot(`homepage-${viewport.name}.png`);
    }
  });
});
```

## Utilities

### API Client

```typescript
// tests/utils/api-client.ts
import { APIRequestContext } from "@playwright/test";

export class ApiClient {
  constructor(private request: APIRequestContext) {}

  async createTestUser() {
    const response = await this.request.post("/api/test/users", {
      data: {
        email: `test-${Date.now()}@example.com`,
        password: "TestPassword123!",
        name: "Test User",
      },
    });
    return response.json();
  }

  async deleteUser(email: string) {
    await this.request.delete(`/api/test/users/${encodeURIComponent(email)}`);
  }

  async seedDatabase(data: Record<string, unknown>) {
    await this.request.post("/api/test/seed", { data });
  }

  async clearDatabase() {
    await this.request.post("/api/test/reset");
  }

  async getAuthToken(email: string, password: string): Promise<string> {
    const response = await this.request.post("/api/auth/login", {
      data: { email, password },
    });
    const { token } = await response.json();
    return token;
  }
}
```

### Test Helpers

```typescript
// tests/utils/helpers.ts
import { Page, expect } from "@playwright/test";

export async function waitForAnimations(page: Page) {
  await page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished)));
}

export async function scrollToBottom(page: Page) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
}

export async function clearLocalStorage(page: Page) {
  await page.evaluate(() => localStorage.clear());
}

export async function setLocalStorageItem(page: Page, key: string, value: string) {
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, value]);
}

export async function mockGeolocation(page: Page, latitude: number, longitude: number) {
  await page.context().setGeolocation({ latitude, longitude });
  await page.context().grantPermissions(["geolocation"]);
}

export async function mockClipboard(page: Page, text: string) {
  await page.evaluate((t) => navigator.clipboard.writeText(t), text);
}

export async function downloadFile(page: Page, buttonSelector: string) {
  const downloadPromise = page.waitForEvent("download");
  await page.click(buttonSelector);
  const download = await downloadPromise;
  return download;
}

export async function uploadFile(page: Page, inputSelector: string, filePath: string) {
  await page.setInputFiles(inputSelector, filePath);
}
```

## Best Practices

1. **Test Organization**
   - Use Page Object Model for maintainability
   - Create reusable fixtures for common setups
   - Group related tests with describe blocks
   - Use meaningful test names

2. **Reliability**
   - Prefer user-visible locators (role, label, text)
   - Avoid arbitrary timeouts; use auto-waiting
   - Handle network conditions properly
   - Clean up test data after each test

3. **Performance**
   - Run tests in parallel
   - Use API for test data setup
   - Share authentication state between tests
   - Skip UI for non-UI tests

4. **Debugging**
   - Use trace viewer for failures
   - Enable screenshots on failure
   - Use codegen for locator discovery
   - Add custom error messages

5. **CI/CD Integration**
   - Use sharding for faster runs
   - Configure retries for flaky tests
   - Generate multiple report formats
   - Run on consistent environments
