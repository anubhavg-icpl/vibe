<!--
name: 'Skill: Code Review (cleanup and altitude output guidance)'
description: Explains how cleanup and altitude candidates should use the findings shape and rank below correctness bugs
ccVersion: 2.1.173
-->
Cleanup and altitude candidates use the same `file`/`line`/`summary` shape; in
`failure_scenario`, state the concrete cost (what is duplicated, wasted, or
harder to maintain) instead of a crash. Correctness bugs always outrank
cleanup and altitude findings when the output cap forces a cut.
