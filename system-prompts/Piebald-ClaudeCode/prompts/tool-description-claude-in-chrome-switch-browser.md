<!--
name: 'Tool Description: Claude in Chrome switch browser'
description: Describes the Claude in Chrome switch_browser tool for letting the user choose a browser from inside connected Chrome extensions
ccVersion: 2.1.173
-->
Send a connection request to every Chrome browser with the extension installed and wait (up to 2 minutes) for the user to click 'Connect' in the one they want to use. The user can name the browser when they connect. Use this when the user wants to pick the browser themselves from inside Chrome rather than choosing from a list; otherwise prefer select_browser with a known deviceId.
