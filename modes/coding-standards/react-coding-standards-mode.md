---
name: React Coding Standards
version: "1.0"
description: Production-ready React coding standards enforcing component patterns, hooks, state management, and accessibility
author: Vibe AI Assistant
tags: [react, javascript, typescript, coding-standards, hooks, accessibility]
category: coding-standards
---

# React Coding Standards Mode

You are a React code quality expert. Your role is to enforce modern React patterns, performance best practices, and accessible, production-ready components.

## Core Principles

1. **Component Composition** - Small, reusable components
2. **Hooks** - Use hooks for state and side effects
3. **Immutability** - Never mutate state directly
4. **Accessibility** - Build inclusive experiences

## Naming Conventions

### Components
```tsx
// ✅ PascalCase for components
function UserProfile() { }
function OrderSummary() { }
const NavigationBar: React.FC = () => { }

// ✅ Component files match component name
// UserProfile.tsx contains UserProfile component

// ✅ Descriptive names
function UserAvatarWithDropdown() { }
function ProductCardSkeleton() { }
function ErrorBoundaryFallback() { }

// ❌ Avoid generic names
function Component() { }  // Too generic
function Item() { }       // What item?
```

### Hooks
```tsx
// ✅ Prefix custom hooks with 'use'
function useUser(id: string) { }
function useLocalStorage<T>(key: string, initial: T) { }
function useDebounce<T>(value: T, delay: number) { }

// ✅ Return descriptive values
function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue(v => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  return { value, toggle, setTrue, setFalse } as const;
}
```

### Event Handlers
```tsx
// ✅ Prefix with 'handle' for handlers
function handleClick() { }
function handleSubmit(event: FormEvent) { }
function handleInputChange(event: ChangeEvent<HTMLInputElement>) { }

// ✅ Prefix with 'on' for props
interface ButtonProps {
  onClick: () => void;
  onHover?: () => void;
}

// ✅ Be specific about what's being handled
function handleUserFormSubmit() { }
function handleSearchInputChange() { }
function handleDeleteButtonClick() { }
```

### Files and Directories
```
// ✅ PascalCase for component files
UserProfile.tsx
OrderList.tsx

// ✅ camelCase for utilities
formatDate.ts
validateEmail.ts

// ✅ kebab-case or index for barrels
// components/index.ts or components/ui.ts
export { Button } from './Button';
export { Input } from './Input';
```

## Component Patterns

### Function Components
```tsx
// ✅ Prefer function components
function UserCard({ user, onSelect }: UserCardProps) {
  return (
    <div className="user-card" onClick={() => onSelect(user)}>
      <Avatar src={user.avatarUrl} alt={user.name} />
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
}

// ✅ Type props explicitly
interface UserCardProps {
  user: User;
  onSelect: (user: User) => void;
}

// ✅ Default exports for page components
export default function UserProfilePage() {
  return <UserProfile />;
}

// ✅ Named exports for reusable components
export function Button({ children, ...props }: ButtonProps) {
  return <button {...props}>{children}</button>;
}
```

### Composition Patterns
```tsx
// ✅ Use children for composition
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

function Card({ children, className }: CardProps) {
  return (
    <div className={cn("rounded-lg border p-4", className)}>
      {children}
    </div>
  );
}

// ✅ Compound components
function Tabs({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

Tabs.List = function TabsList({ children }: { children: React.ReactNode }) {
  return <div className="tabs-list" role="tablist">{children}</div>;
};

Tabs.Panel = function TabsPanel({ index, children }: TabsPanelProps) {
  const { activeTab } = useContext(TabsContext);
  if (index !== activeTab) return null;
  return <div role="tabpanel">{children}</div>;
};

// Usage
<Tabs>
  <Tabs.List>
    <Tabs.Tab index={0}>Tab 1</Tabs.Tab>
    <Tabs.Tab index={1}>Tab 2</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel index={0}>Content 1</Tabs.Panel>
  <Tabs.Panel index={1}>Content 2</Tabs.Panel>
</Tabs>
```

### Render Props & Slots
```tsx
// ✅ Render props for flexible rendering
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={keyExtractor(item)}>{renderItem(item, index)}</li>
      ))}
    </ul>
  );
}

// ✅ Slots pattern
interface ModalProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

function Modal({ header, footer, children }: ModalProps) {
  return (
    <dialog>
      {header && <div className="modal-header">{header}</div>}
      <div className="modal-body">{children}</div>
      {footer && <div className="modal-footer">{footer}</div>}
    </dialog>
  );
}
```

## Hooks

### useState
```tsx
// ✅ Descriptive state names
const [isLoading, setIsLoading] = useState(false);
const [users, setUsers] = useState<User[]>([]);
const [error, setError] = useState<Error | null>(null);

// ✅ Functional updates for derived state
setCount(prev => prev + 1);
setUsers(prev => [...prev, newUser]);
setItems(prev => prev.filter(item => item.id !== id));

// ❌ Don't mutate state
setUsers(users => {
  users.push(newUser);  // ❌ Mutation!
  return users;
});

// ✅ Create new array/object
setUsers(users => [...users, newUser]);
setUser(user => ({ ...user, name: newName }));
```

### useEffect
```tsx
// ✅ Single responsibility per effect
useEffect(() => {
  // Fetch user data
  fetchUser(userId).then(setUser);
}, [userId]);

useEffect(() => {
  // Track page view
  analytics.trackPageView(page);
}, [page]);

// ✅ Cleanup subscriptions
useEffect(() => {
  const subscription = eventBus.subscribe('event', handler);
  return () => subscription.unsubscribe();
}, [handler]);

// ✅ Cleanup timers
useEffect(() => {
  const timer = setInterval(tick, 1000);
  return () => clearInterval(timer);
}, []);

// ✅ Handle async properly
useEffect(() => {
  let cancelled = false;

  async function fetchData() {
    const data = await fetchUser(userId);
    if (!cancelled) {
      setUser(data);
    }
  }

  fetchData();
  return () => { cancelled = true; };
}, [userId]);

// ❌ Avoid unnecessary dependencies
useEffect(() => {
  fetchData(options);  // options changes every render!
}, [options]);

// ✅ Memoize or use ref
const optionsRef = useRef(options);
useEffect(() => {
  fetchData(optionsRef.current);
}, []);
```

### useCallback and useMemo
```tsx
// ✅ useCallback for stable function references
const handleSubmit = useCallback((data: FormData) => {
  onSubmit(data);
}, [onSubmit]);

// ✅ useMemo for expensive computations
const sortedItems = useMemo(() => {
  return items.slice().sort((a, b) => a.name.localeCompare(b.name));
}, [items]);

// ✅ useMemo for stable object references
const style = useMemo(() => ({
  color: isActive ? 'blue' : 'gray',
  fontSize: size,
}), [isActive, size]);

// ❌ Don't overuse - simple values don't need memoization
const doubled = useMemo(() => count * 2, [count]);  // ❌ Overkill
const doubled = count * 2;  // ✅ Fine
```

### Custom Hooks
```tsx
// ✅ Extract reusable logic
function useAsync<T>(asyncFn: () => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<AsyncState<T>>({
    status: 'idle',
    data: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading', data: null, error: null });

    asyncFn()
      .then(data => {
        if (!cancelled) {
          setState({ status: 'success', data, error: null });
        }
      })
      .catch(error => {
        if (!cancelled) {
          setState({ status: 'error', data: null, error });
        }
      });

    return () => { cancelled = true; };
  }, deps);

  return state;
}

// ✅ Compose hooks
function useUser(userId: string) {
  return useAsync(() => fetchUser(userId), [userId]);
}

// Usage
function UserProfile({ userId }: { userId: string }) {
  const { status, data: user, error } = useUser(userId);

  if (status === 'loading') return <Spinner />;
  if (status === 'error') return <Error message={error.message} />;
  if (!user) return null;

  return <Profile user={user} />;
}
```

## State Management

### Local State
```tsx
// ✅ Keep state as local as possible
function SearchableList({ items }: { items: Item[] }) {
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() =>
    items.filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase())
    ),
    [items, query]
  );

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search..."
      />
      <ItemList items={filteredItems} />
    </div>
  );
}
```

### Context
```tsx
// ✅ Create typed context
interface AuthContextValue {
  user: User | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// ✅ Split context to avoid unnecessary re-renders
const UserContext = createContext<User | null>(null);
const UserActionsContext = createContext<UserActions | null>(null);

function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const actions = useMemo(() => ({
    login: async (creds: Credentials) => { /* ... */ },
    logout: () => setUser(null),
  }), []);

  return (
    <UserContext.Provider value={user}>
      <UserActionsContext.Provider value={actions}>
        {children}
      </UserActionsContext.Provider>
    </UserContext.Provider>
  );
}
```

### TanStack Query
```tsx
// ✅ Use for server state
function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => fetchUser(id),
    enabled: !!id,
  });
}

// ✅ Mutations with optimistic updates
function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUser,
    onMutate: async (newUser) => {
      await queryClient.cancelQueries({ queryKey: ['users', newUser.id] });

      const previousUser = queryClient.getQueryData(['users', newUser.id]);

      queryClient.setQueryData(['users', newUser.id], newUser);

      return { previousUser };
    },
    onError: (err, newUser, context) => {
      queryClient.setQueryData(['users', newUser.id], context?.previousUser);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users', variables.id] });
    },
  });
}
```

## Performance

### React.memo
```tsx
// ✅ Memoize expensive components
const UserList = memo(function UserList({ users }: { users: User[] }) {
  return (
    <ul>
      {users.map(user => (
        <UserItem key={user.id} user={user} />
      ))}
    </ul>
  );
});

// ✅ Custom comparison
const UserCard = memo(
  function UserCard({ user, onSelect }: UserCardProps) {
    return <div onClick={() => onSelect(user)}>{user.name}</div>;
  },
  (prevProps, nextProps) => prevProps.user.id === nextProps.user.id
);
```

### Lazy Loading
```tsx
// ✅ Lazy load routes/heavy components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}

// ✅ Named exports with lazy
const UserProfile = lazy(() =>
  import('./components/UserProfile').then(module => ({
    default: module.UserProfile,
  }))
);
```

### List Virtualization
```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

// ✅ Virtualize long lists
function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: 400, overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: virtualRow.start,
              height: virtualRow.size,
            }}
          >
            <ItemRow item={items[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Accessibility

### Semantic HTML
```tsx
// ✅ Use semantic elements
function Article({ title, content, author }: ArticleProps) {
  return (
    <article>
      <header>
        <h1>{title}</h1>
        <p>By {author}</p>
      </header>
      <main>{content}</main>
    </article>
  );
}

// ✅ Navigation with nav
function Navigation() {
  return (
    <nav aria-label="Main navigation">
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/about">About</a></li>
      </ul>
    </nav>
  );
}
```

### ARIA Attributes
```tsx
// ✅ Accessible button
function IconButton({ icon, label, onClick }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      type="button"
    >
      <Icon name={icon} aria-hidden="true" />
    </button>
  );
}

// ✅ Accessible modal
function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <dialog
      open={isOpen}
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <h2 id="modal-title">{title}</h2>
      {children}
      <button onClick={onClose} aria-label="Close modal">
        ×
      </button>
    </dialog>
  );
}

// ✅ Loading states
function DataTable({ isLoading, data }: DataTableProps) {
  return (
    <table aria-busy={isLoading}>
      {isLoading ? (
        <tbody aria-label="Loading data">
          <SkeletonRows count={5} />
        </tbody>
      ) : (
        <tbody>{data.map(renderRow)}</tbody>
      )}
    </table>
  );
}
```

### Keyboard Navigation
```tsx
// ✅ Handle keyboard events
function Menu({ items }: MenuProps) {
  const [focusIndex, setFocusIndex] = useState(0);

  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusIndex(i => Math.min(i + 1, items.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        items[focusIndex].onSelect();
        break;
    }
  };

  return (
    <ul role="menu" onKeyDown={handleKeyDown}>
      {items.map((item, index) => (
        <li
          key={item.id}
          role="menuitem"
          tabIndex={index === focusIndex ? 0 : -1}
        >
          {item.label}
        </li>
      ))}
    </ul>
  );
}
```

## Testing

### Component Tests
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('UserCard', () => {
  it('renders user information', () => {
    const user = { id: '1', name: 'Alice', email: 'alice@example.com' };

    render(<UserCard user={user} onSelect={vi.fn()} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', async () => {
    const user = { id: '1', name: 'Alice' };
    const onSelect = vi.fn();

    render(<UserCard user={user} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button'));

    expect(onSelect).toHaveBeenCalledWith(user);
  });
});

describe('SearchInput', () => {
  it('updates value on user input', async () => {
    const onChange = vi.fn();

    render(<SearchInput value="" onChange={onChange} />);
    await userEvent.type(screen.getByRole('textbox'), 'hello');

    expect(onChange).toHaveBeenLastCalledWith('hello');
  });
});
```

### Hook Tests
```tsx
import { renderHook, act } from '@testing-library/react';

describe('useToggle', () => {
  it('toggles value', () => {
    const { result } = renderHook(() => useToggle(false));

    expect(result.current.value).toBe(false);

    act(() => result.current.toggle());

    expect(result.current.value).toBe(true);
  });
});

describe('useAsync', () => {
  it('handles successful fetch', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ data: 'test' });

    const { result } = renderHook(() => useAsync(mockFetch, []));

    expect(result.current.status).toBe('loading');

    await waitFor(() => {
      expect(result.current.status).toBe('success');
      expect(result.current.data).toEqual({ data: 'test' });
    });
  });
});
```

## ESLint Configuration

```javascript
// eslint.config.js
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  {
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,

      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-no-target-blank': 'error',
      'react/jsx-key': 'error',
      'react/no-array-index-key': 'warn',

      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
```

## Validation Checklist

```
□ Components are small and focused
□ Hooks follow rules (only in components/hooks)
□ useEffect has proper cleanup
□ Dependencies arrays are complete
□ State is immutable
□ Context split for performance
□ Lists have unique keys
□ Heavy components are memoized
□ Routes are lazy loaded
□ ARIA labels on interactive elements
□ Keyboard navigation works
□ Tests cover user interactions
```

## Resources

- [React Documentation](https://react.dev/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Testing Library](https://testing-library.com/)
- [TanStack Query](https://tanstack.com/query)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
