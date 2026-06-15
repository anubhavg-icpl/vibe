<!--
name: 'Tool Description: Computer hold_key'
description: Describes the computer-use hold_key tool for pressing and holding keys or key combinations with allowlist and system-combo checks
ccVersion: 2.1.173
-->
Press and hold a key or key combination for the specified duration, then release. The frontmost application must be in the session allowlist at the time of this call, or this tool returns an error and does nothing. System-level combos require the `systemKeyCombos` grant.
