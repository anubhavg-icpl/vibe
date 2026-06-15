<!--
name: 'Tool Description: CronCreate (durability note)'
description: CronCreate insert (shown when durable-cron is enabled) explaining the durable: true vs false trade-off
ccVersion: 2.1.173
-->
## Durability

By default (durable: false) the job lives only in this Claude session — nothing is written to disk, and the job is gone when Claude exits. Pass durable: true to write to .claude/scheduled_tasks.json so the job survives restarts. Only use durable: true when the user explicitly asks for the task to persist ("keep doing this every day", "set this up permanently"). Most "remind me in 5 minutes" / "check back in an hour" requests should stay session-only.
