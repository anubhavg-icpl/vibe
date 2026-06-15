<!--
name: 'Tool Parameter: Claude in Chrome JavaScript code'
description: Describes the JavaScript code parameter for the Claude in Chrome JavaScript execution tool
ccVersion: 2.1.173
-->
The JavaScript code to execute. Evaluated in the page context with REPL semantics: top-level `await` works, and the result of the last expression is returned automatically — write the expression you want (e.g. `window.myData.value`, or `await fetch(url).then(r=>r.json())`) rather than `return ...`. You can access and modify the DOM, call page functions, and interact with page variables.
