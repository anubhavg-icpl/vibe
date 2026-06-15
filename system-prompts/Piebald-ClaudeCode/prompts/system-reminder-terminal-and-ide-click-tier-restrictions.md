<!--
name: 'System Reminder: Terminal and IDE click-tier restrictions'
description: Explains click-tier limits for terminal and IDE apps, including no keyboard input, context-menu paste, or drag-drop
ccVersion: 2.1.173
variables:
  - CLICK_TIER_TERMINAL_IDE_APPS
-->
only; NO typing, key presses, right-click, modifier-clicks, or drag-drop). You can click buttons and scroll output, but ${CLICK_TIER_TERMINAL_IDE_APPS.length===1?"its":"their"} integrated terminal and editor are off-limits to keyboard input. Right-click (context-menu Paste) and dragging text onto ${CLICK_TIER_TERMINAL_IDE_APPS.length===1?"it":"them"} require tier "full". For shell commands, use the Bash tool.
