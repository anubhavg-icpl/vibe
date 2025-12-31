# Frontend Development Modes

Modern frontend technologies and hypermedia approaches.

## Available Modes (1)

| Mode                   | Description                                 |
| ---------------------- | ------------------------------------------- |
| `htmx-hypermedia-mode` | HTMX for hypermedia-driven web applications |

## Usage

### HTMX Hypermedia Mode

Build modern web apps with hypermedia:

- HTML over the wire
- AJAX without JavaScript
- Server-side rendering
- Progressive enhancement
- Reduced complexity

### Key Features

```html
<!-- HTMX attributes -->
<button hx-get="/api/data" hx-target="#result" hx-swap="innerHTML">Load Data</button>

<!-- Out-of-band swaps -->
<div hx-swap-oob="true" id="notification">Updated!</div>

<!-- WebSocket support -->
<div hx-ws="connect:/chat">
  <div id="messages"></div>
</div>
```

### Benefits

- **Simplicity**: No complex JavaScript build steps
- **Performance**: Smaller payloads, server rendering
- **SEO**: Full HTML responses
- **Accessibility**: Progressive enhancement
- **Maintainability**: Server-side logic

### Common Patterns

1. **Infinite Scroll**: `hx-trigger="revealed"`
2. **Form Validation**: `hx-post` with validation response
3. **Live Search**: `hx-trigger="keyup changed delay:500ms"`
4. **Modal Dialogs**: `hx-target="#modal"` with `hx-swap="outerHTML"`
5. **Polling**: `hx-trigger="every 2s"`

## Recommended Stack

- **Backend**: Any server-side framework (Django, Rails, FastAPI, Go)
- **Styling**: Tailwind CSS or plain CSS
- **Extensions**: Alpine.js for client-side interactivity
- **Icons**: Heroicons or similar
