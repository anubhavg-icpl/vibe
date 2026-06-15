<!--
name: 'Tool Parameter: Bash run_in_background guidance'
description: Explains Bash run_in_background behavior and that commands do not need a trailing ampersand
ccVersion: 2.1.173
-->
You can use the `run_in_background` parameter to run the command in the background. Only use this if you don't need the result immediately and are OK being notified when the command completes later. You do not need to check the output right away - you'll be notified when it finishes. You do not need to use '&' at the end of the command when using this parameter.
