<!--
name: 'Tool Description: Computer computer_batch'
description: Describes the computer-use computer_batch tool for executing a sequence of computer actions in one call
ccVersion: 2.1.173
-->
e.g. click a field, type into it, press Return. Actions execute sequentially and stop on the first error. ${"The frontmost application must be in the session allowlist at the time of this call, or this tool returns an error and does nothing."} The frontmost check runs before EACH action inside the batch — if an action opens a non-allowed app, the next action's gate fires and the batch stops there. 
