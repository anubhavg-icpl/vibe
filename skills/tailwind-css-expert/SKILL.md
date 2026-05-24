---
name: tailwind-css-expert
description: Expert in Tailwind CSS utility-first framework with custom configurations, component patterns, responsive design, and performance optimization. Use when building applications with the tailwind css framework.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: frameworks
  tags: [tailwind, css, frontend, design, utility-first, responsive]
---

# Tailwind CSS Expert Mode

## Overview

You are an expert Tailwind CSS specialist with deep knowledge of utility-first CSS, custom configurations, design system architecture, component patterns, responsive design, dark mode, and performance optimization.

## Core Principles

1. **Utility-First** - Leverage Tailwind's utility classes for rapid development
2. **Customization** - Extend Tailwind when utilities aren't enough
3. **Responsive** - Mobile-first design with responsive modifiers
4. **Dark Mode** - Always implement dark mode support
5. **Performance** - Optimize bundle size with JIT and purging
6. **Accessibility** - Ensure WCAG compliance with semantic HTML

## Configuration

### Tailwind Config Best Practices

**Use `tailwind.config.js` with sensible defaults:**

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}", "./public/index.html"],
  darkMode: "class", // or 'media' for system preference
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f9ff",
          500: "#3b82f6",
          900: "#1e3a8a",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      spacing: {
        128: "32rem",
        144: "36rem",
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography"), require("@tailwindcss/aspect-ratio")],
};
```

**Configuration DOs and DON'Ts:**

- ✅ Use `content` array to specify template files
- ✅ Extend theme, don't override entirely
- ✅ Use `darkMode: 'class'` for manual toggle control
- ✅ Add custom utilities in `theme.extend`
- ❌ Don't hardcode values (use theme values)
- ❌ Don't override core Tailwind utilities
- ❌ Don't use arbitrary values when theme values work

## Component Patterns

### Card Component

```tsx
interface CardProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function Card({ title, description, action }: CardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-shadow duration-300 hover:shadow-xl">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

### Button Component

```tsx
type ButtonVariant = "primary" | "secondary" | "danger";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
}

export function Button({ variant = "primary", isLoading, children, className, ...props }: ButtonProps) {
  const baseStyles =
    "px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-blue-500 hover:bg-blue-600 text-white focus:ring-2 focus:ring-blue-500",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-500",
    danger: "bg-red-500 hover:bg-red-600 text-white focus:ring-2 focus:ring-red-500",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className || ""}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <LoadingSpinner />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
```

### Responsive Navigation

```tsx
export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm">
      {/* Desktop */}
      <div className="hidden md:flex items-center justify-between px-6 py-4">
        <Logo />
        <DesktopNavLinks />
      </div>

      {/* Mobile */}
      <div className="md:hidden px-4 py-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-600 dark:text-gray-300"
          aria-label="Toggle navigation"
        >
          {isOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        {isOpen && (
          <div className="mt-4 space-y-2">
            <MobileNavLinks />
          </div>
        )}
      </div>
    </nav>
  );
}
```

## Responsive Design

### Mobile-First Approach

**Always start with mobile, add breakpoints:**

```tsx
<div className="w-full md:w-1/2 lg:w-1/3">
  {/* Mobile: full width */}
  {/* Tablet: half width */}
  {/* Desktop: third width */}
</div>

<div className="text-sm md:text-base lg:text-lg">
  {/* Mobile: 14px */}
  {/* Tablet: 16px */}
  {/* Desktop: 18px */}
</div>
```

### Breakpoint Strategy

**Use these breakpoints:**

```javascript
// Tailwind default breakpoints
sm: '640px',   // Small phones to tablets
md: '768px',   // Tablets
lg: '1024px',  // Small laptops
xl: '1280px',   // Desktops
2xl: '1536px',  // Large screens
```

**Custom breakpoint example:**

```javascript
module.exports = {
  theme: {
    screens: {
      "3xl": "1920px", // Ultra-wide displays
    },
  },
};
```

## Dark Mode

### Implementation Pattern

**Use `class` strategy for manual toggle:**

```tsx
export function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
      aria-label="Toggle dark mode"
    >
      {darkMode ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
```

**Dark mode utility classes:**

```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  {/* Light: white bg, dark text */}
  {/* Dark: gray-900 bg, light text */}
</div>
```

**Prefer `dark:` modifier over media queries:**

```tsx
// ✅ Good - Tailwind dark mode
<div className="text-gray-800 dark:text-gray-200">

// ❌ Bad - Custom media query
<div className="text-gray-800" style={{ '@media (prefers-color-scheme: dark)': { color: '#e5e7eb' } }}>
```

## Performance Optimization

### Bundle Size Reduction

**Enable JIT for smallest bundle:**

```javascript
module.exports = {
  mode: "jit", // or 'classics' in older versions
  content: ["./src/**/*.{html,js,jsx,tsx}"],
  purging: {
    enabled: true, // Only production
  },
};
```

**Avoid arbitrary values:**

```tsx
// ❌ Bad - arbitrary value creates new class
<div className="w-[373px]">

// ✅ Good - use theme value
<div className="w-[theme('spacing.128')]">

// ✅ Even better - add to theme
<div className="w-[144]"> // after adding '144' to spacing
```

### Optimization Techniques

1. **Purge unused styles** - Use `content` array correctly
2. **Group modifiers** - `hover:focus` vs `hover:` + `focus:`
3. **Use built-in colors** - Before creating custom colors
4. **Enable JIT** - Smaller bundles
5. **Minimize `@apply`** - Prefer inline utilities

## Custom Utilities

### Adding to Config

```javascript
module.exports = {
  theme: {
    extend: {
      // Custom spacing
      spacing: {
        128: "32rem",
      },

      // Custom colors
      colors: {
        brand: {
          light: "#e0f2fe",
          DEFAULT: "#3b82f6",
          dark: "#1e40af",
        },
      },

      // Custom box shadows
      boxShadow: {
        glow: "0 0 20px rgba(59, 130, 246, 0.5)",
      },

      // Custom animations
      animation: {
        "spin-slow": "spin 3s linear infinite",
        "bounce-slow": "bounce 2s infinite",
      },
    },
  },
};
```

### Using @apply Directive

**Use sparingly, only for repeated patterns:**

```css
/* ✅ Good - for reusable button base */
@layer components {
  .btn-base {
    @apply px-4 py-2 rounded-lg font-medium transition-colors duration-200;
  }
}

/* ❌ Bad - defeats purpose of utility classes */
.btn-custom {
  @apply bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl;
}
```

## Accessibility

### ARIA Patterns

**Always include ARIA attributes:**

```tsx
<button
  className="bg-blue-500 text-white px-4 py-2 rounded"
  aria-label="Close dialog"
>
  ×
</button>

<nav aria-label="Main navigation">
  {/* Navigation links */}
</nav>

<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  className="bg-white rounded-lg p-6"
>
  <h2 id="dialog-title">Dialog Title</h2>
</div>
```

### Focus Management

**Visible focus indicators:**

```css
/* In globals.css */
@layer utilities {
  .focus-ring {
    @apply ring-2 ring-offset-2 ring-blue-500 outline-none;
  }
}
```

```tsx
<button className="focus-ring">{/* Always visible focus ring */}</button>
```

### Screen Reader Classes

**Hide decorative elements:**

```tsx
<span className="sr-only">Skip to main content</span>

<button aria-hidden="true" className="absolute -left-full">
  {/* Decorative icon */}
</button>
```

## Common Patterns

### Grid Layouts

```tsx
// 3-column responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Items */}
</div>

// Sidebar + main content
<div className="flex flex-col lg:flex-row gap-6">
  <aside className="w-full lg:w-64">
    {/* Sidebar */}
  </aside>
  <main className="flex-1">
    {/* Main content */}
  </main>
</div>
```

### Flexbox Utilities

```tsx
// Centered content
<div className="flex items-center justify-center min-h-screen">
  {/* Centered both horizontally and vertically */}
</div>

// Space between items
<div className="flex justify-between items-center">
  <div>Left</div>
  <div>Right</div>
</div>

// Responsive flex direction
<div className="flex flex-col md:flex-row gap-4">
  {/* Stack on mobile, row on tablet+ */}
</div>
```

## Spacing & Sizing

### Consistent Spacing Scale

**Use Tailwind's spacing scale:**

```tsx
// ✅ Good - consistent spacing
<div className="p-4 m-4"> // 1rem padding and margin

// ❌ Bad - arbitrary values
<div className="p-[16px] m-[1rem]">
```

### Max-width Content

```tsx
<div className="max-w-4xl mx-auto px-4">{/* Centered with max-width */}</div>
```

## Typography

### Responsive Text

```tsx
<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
  Responsive heading
</h1>

<p className="text-sm md:text-base lg:text-lg leading-relaxed">
  Responsive body text with better line height
</p>
```

### Typography Plugin

```javascript
// tailwind.config.js
module.exports = {
  plugins: [require("@tailwindcss/typography")],
};
```

```tsx
<article className="prose prose-lg dark:prose-invert">{/* Styled prose with dark mode */}</article>
```

## Animation & Transitions

### Transitions

```tsx
<button className="transition-all duration-300 ease-in-out hover:scale-105 active:scale-95">
  {/* Smooth scale animation */}
</button>

<div className="transition-opacity duration-500 opacity-0 hover:opacity-100">
  {/* Fade in/out */}
</div>
```

### Custom Animations

```javascript
module.exports = {
  theme: {
    extend: {
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
    },
  },
};
```

```tsx
<div className="animate-fade-in">
  Fade in animation
</div>

<div className="animate-slide-up">
  Slide up animation
</div>
```

## Best Practices

### DO

- Use utility classes over custom CSS
- Follow mobile-first responsive design
- Implement dark mode from the start
- Keep configuration organized and documented
- Use theme values instead of arbitrary values
- Enable JIT for production builds
- Add ARIA attributes for accessibility
- Group related utilities (e.g., `hover:focus`)
- Use consistent spacing scales

### DON'T

- Create unnecessary custom CSS files
- Use `!important` modifier (rarely needed)
- Disable purging in production
- Hardcode values inline
- Override core Tailwind utilities
- Use arbitrary values when theme values exist
- Skip dark mode support
- Ignore accessibility (focus, ARIA)

## Anti-patterns

1. **Wrapper divs** - Adding unnecessary `div`s just for Tailwind classes
2. **Over-abstracting** - Creating components for single-use patterns
3. **Mixed styling** - Combining Tailwind with inline styles
4. **Poor organization** - Scattered `@apply` directives
5. **Inconsistent spacing** - Using random padding/margin values
6. **No dark mode** - Only styling for light theme

## Testing

### Visual Regression Testing

```typescript
describe('Button component', () => {
  it('matches snapshot', () => {
    const { container } = render(<Button variant="primary">Click</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('applies correct classes', () => {
    const { getByRole } = render(<Button variant="danger">Delete</Button>);
    const button = getByRole('button');

    expect(button).toHaveClass('bg-red-500');
    expect(button).toHaveClass('hover:bg-red-600');
  });
});
```

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Tailwind UI Components](https://tailwindui.com/)
- [Headless UI](https://headlessui.com/) - Accessible components with Tailwind
- [Tailwind Labs](https://tailwindlabs.com/) - Playground
- [Tailwind Typography Plugin](https://github.com/tailwindlabs/tailwindcss-typography)
