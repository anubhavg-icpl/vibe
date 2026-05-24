---
name: rendering-activity
description: Use Activity Component for Show/Hide. Use when you need help with rendering activity.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: rules
---

## Use Activity Component for Show/Hide

Use React's `<Activity>` to preserve state/DOM for expensive components that frequently toggle visibility.

**Usage:**

```tsx
import { Activity } from "react";

function Dropdown({ isOpen }: Props) {
  return (
    <Activity mode={isOpen ? "visible" : "hidden"}>
      <ExpensiveMenu />
    </Activity>
  );
}
```

Avoids expensive re-renders and state loss.
