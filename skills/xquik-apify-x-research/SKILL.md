---
name: xquik-apify-x-research
description: Research public X posts, profiles, relations, communities, and audience overlap with Xquik Apify Actors. Use when a task needs bounded X content or audience evidence from Apify.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  when_to_use: Use for bounded, approved research of public X content or audience relations through Apify.
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

Check for Apify CLI authentication without printing a token:

```bash
if [ -z "${APIFY_TOKEN:-}" ] &&
  { [ -z "${HOME:-}" ] || [ ! -s "${HOME}/.apify/auth.json" ]; }; then
  printf '%s\n' "Apify CLI authentication required. Run: apify auth login" >&2
  exit 1
fi
```

Never use `apify auth token` as a preflight.
That command prints the stored secret.

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
6. Estimated cost and approved maximum cost per run.

Ask for explicit approval.
Keep `APIFY_TOKEN` in the environment.
Never place tokens in inputs, outputs, logs, or saved examples.

Record the approved cap as `APPROVED_MAX_TOTAL_CHARGE_USD`.
Pass it through the API as `maxTotalChargeUsd`.
The platform exposes it as `ACTOR_MAX_TOTAL_CHARGE_USD` inside the run.
Never rely on `maxItems` alone for a hard cost limit.

The current CLI cannot pass this run-level cost cap.
Use the API for the approved billable run:

```bash
set -euo pipefail

: "${APIFY_TOKEN:?Set APIFY_TOKEN in the caller environment.}"

ACTOR_ID="xquik~x-tweet-scraper"
APPROVED_MAX_TOTAL_CHARGE_USD="SET_APPROVED_VALUE"
APPROVED_INPUT_PATH="PATH_TO_APPROVED_JSON"

case "$ACTOR_ID" in
  xquik~x-tweet-scraper | xquik~x-follower-scraper) ;;
  *)
    printf '%s\n' "Unsupported Actor ID." >&2
    exit 1
    ;;
esac

if ! [[ "$APPROVED_MAX_TOTAL_CHARGE_USD" =~ ^[0-9]+([.][0-9]+)?$ ]] ||
  ! jq -en --arg value "$APPROVED_MAX_TOTAL_CHARGE_USD" \
    '($value | tonumber) > 0' >/dev/null; then
  printf '%s\n' "Approved maximum cost must be a positive number." >&2
  exit 1
fi

umask 077
INPUT_FILE="$(mktemp)"
RUN_FILE="$(mktemp)"
trap 'rm -f "$INPUT_FILE" "$RUN_FILE"' EXIT

# Validate and normalize the approved input into the private temporary file.
# Never interpolate raw JSON into a shell command.
jq -e \
  'if type == "object" then . else error("input must be an object") end' \
  "$APPROVED_INPUT_PATH" >"$INPUT_FILE"

printf 'header = "Authorization: Bearer %s"\n' "$APIFY_TOKEN" |
  curl --config - \
    --fail-with-body \
    --silent \
    --show-error \
    --request POST \
    --header "Content-Type: application/json" \
    --data-binary "@$INPUT_FILE" \
    --output "$RUN_FILE" \
    "https://api.apify.com/v2/actors/${ACTOR_ID}/runs?maxTotalChargeUsd=${APPROVED_MAX_TOTAL_CHARGE_USD}&waitForFinish=60"

jq -e '.data.id and .data.defaultDatasetId' "$RUN_FILE" >/dev/null
jq '{runId: .data.id, status: .data.status, defaultDatasetId: .data.defaultDatasetId}' \
  "$RUN_FILE"
```

Wait for a terminal status before fetching dataset items.
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

`Apify CLI authentication required` - Run `apify auth login`. Never print its token.

`Apify API authentication required` - Set `APIFY_TOKEN` in the caller environment.

`Actor reports APIFY_TOKEN not found` - Report the diagnostic. Never add credentials to Actor input.

`Maximum charge rejected` - Check the Actor minimum. Raise it only with approval.

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
