<!--
name: 'Tool Description: Computer left_mouse_down'
description: Describes the computer-use left_mouse_down tool for holding the left mouse button at the current cursor position
ccVersion: 2.1.173
-->
Press the left mouse button at the current cursor position and leave it held. The frontmost application must be in the session allowlist at the time of this call, or this tool returns an error and does nothing. Use mouse_move first to position the cursor. Call left_mouse_up to release. Errors if the button is already held.
