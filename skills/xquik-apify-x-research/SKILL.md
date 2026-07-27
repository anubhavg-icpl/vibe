---
name: xquik-apify-x-research
description: Research public X posts, profiles, relations, communities, and audience overlap with Xquik Apify Actors. Use when a task needs bounded X content or audience evidence from Apify.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
---

# Xquik Apify X Research

Use this Skill for public X content and audience research.
It supports two focused Apify Actors:

- [Xquik X Tweet Scraper](https://apify.com/xquik/x-tweet-scraper)
- [Xquik X Follower Scraper](https://apify.com/xquik/x-follower-scraper)

Use the Tweet Scraper for posts, profiles, lists, threads, and engagement routes.
Use the Follower Scraper for relations, communities, and audience overlap.

Never bypass private profiles, access controls, or platform restrictions.
Never start a billable run without explicit user approval.

## Workflow

Copy this checklist and track progress:

```text
Task Progress:
- [ ] Step 1: Define the public research target
- [ ] Step 2: Select the Actor and route
- [ ] Step 3: Inspect the live input schema
- [ ] Step 4: Build and review a bounded input
- [ ] Step 5: Confirm the external run
- [ ] Step 6: Validate returned rows
- [ ] Step 7: Report evidence and limitations
```

### Step 1: Define the Public Research Target

Record:

1. Public accounts, post IDs, list IDs, community IDs, or search terms.
2. Required post route or audience relation.
3. Global and per-target result limits.
4. Output shape and naming style.
5. Excluded inferences and privacy boundaries.

Use stable user IDs when identity accuracy matters.
Do not compare display names as stable identifiers.

### Step 2: Select the Actor and Route

| Goal                                    | Actor                      | Route                                 |
| --------------------------------------- | -------------------------- | ------------------------------------- |
| Search public posts                     | `xquik/x-tweet-scraper`    | `search`                              |
| Read a public profile timeline          | `xquik/x-tweet-scraper`    | `profileTweets`                       |
| Read a post, thread, replies, or quotes | `xquik/x-tweet-scraper`    | Matching direct mode                  |
| Read a public list timeline             | `xquik/x-tweet-scraper`    | `listTweets`                          |
| Collect followers or following          | `xquik/x-follower-scraper` | Matching relation                     |
| Collect list or community members       | `xquik/x-follower-scraper` | `list_members` or `community_members` |
| Compare public audiences                | `xquik/x-follower-scraper` | `overlapMode: true`                   |

Read [Actor Contracts](references/actor-contracts.md) before choosing fields.

### Step 3: Inspect the Live Input Schema

Use read-only Actor inspection:

```bash
apify actors info "xquik/x-tweet-scraper" --input --json
apify actors info "xquik/x-follower-scraper" --input --json
```

Stop unless both commands return their input schemas successfully.

Confirm:

- The Actor remains public and active.
- Every proposed field exists.
- The route supports each target type.
- `maxItems` is explicit.
- Current pricing fits the approved budget.

Do not hardcode pricing.
Treat each Actor listing as authoritative.

### Step 4: Build and Review a Bounded Input

Start with the smallest useful result cap.

For tweet searches, use the run-wide `maxItems` field.
It covers the complete run.
It does not create a quota for each search term.

For follower relations, use `maxItemsPerTarget` to balance targets.
Keep `includeTargetMetadata: true` to preserve sources.
For other explicit multi-target routes, use it only when the live schema permits it.

Use [Schema-Checked Examples](references/examples.md) as starting points.
Revalidate every field against the live schema.

### Step 5: Confirm the External Run

Present these details before any run:

1. Actor slug.
2. Public targets or search terms.
3. Global and per-target limits.
4. Current pricing source.
5. Expected output mode.

Ask for explicit approval.
Keep `APIFY_TOKEN` in the environment.
Never place tokens in inputs, outputs, logs, or saved examples.

After approval, use the current Apify CLI syntax:

```bash
apify actors call "ACTOR_SLUG" -i 'JSON_INPUT' --json --output-dataset
```

Do not retry a billable partial run automatically.
Inspect its results and diagnostics first.

### Step 6: Validate Returned Rows

Separate data rows from diagnostic rows.
A row with `status` and `message` can describe an unavailable target.

For tweet research:

- Preserve `searchTerm` for shared multi-query runs.
- Keep post IDs and canonical URLs.
- Count incomplete or unavailable targets separately.

For audience research:

- Preserve source targets and relations.
- Keep overlap counts and source arrays.
- Count filtered, duplicate, and unavailable profiles separately.

Read [Safety and Diagnostics](references/safety-and-diagnostics.md) before analysis.

### Step 7: Report Evidence and Limitations

Report:

- Actor slug and route.
- Inputs and result limits.
- Retrieval time.
- Data, filtered, duplicate, and diagnostic row counts.
- Result artifact location.
- Missing targets and diagnostic messages.
- Analysis limits and excluded inferences.

Separate observed public data from interpretation.
A follow does not prove endorsement or intent.

## Error Handling

`APIFY_TOKEN not found` - Ask the user to set the environment variable.

`Actor input rejected` - Fetch the live schema and correct the input.

`Fewer rows than requested` - Inspect visibility, filters, and diagnostics.

`One target dominates` - Use a route-supported per-target cap or split targets.

`Unexpected row shape` - Classify diagnostic rows before analysis.

`Partial run` - Preserve partial results and request approval before retrying.

## Resources

- [Actor Contracts](references/actor-contracts.md)
- [Schema-Checked Examples](references/examples.md)
- [Safety and Diagnostics](references/safety-and-diagnostics.md)
- [Xquik X Tweet Scraper listing](https://apify.com/xquik/x-tweet-scraper)
- [Xquik X Follower Scraper listing](https://apify.com/xquik/x-follower-scraper)

Xquik is an independent third-party service. Not affiliated with X Corp. "Twitter" and "X" are trademarks of X Corp.
