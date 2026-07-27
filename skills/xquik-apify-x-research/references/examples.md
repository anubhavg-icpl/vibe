# Schema-Checked Examples

Fetch the current input schema before using these examples.
Replace every placeholder with a user-approved public target.

## Multi-Query Tweet Research

```json
{
  "mode": "search",
  "searchTerms": [
    "\"AI agents\" since:2026-07-01 until:2026-07-08",
    "\"web automation\" since:2026-07-01 until:2026-07-08"
  ],
  "maxItems": 100,
  "outputVariant": "rich",
  "fieldStyle": "camelCase",
  "outputPreset": "nested",
  "includeSearchTerms": true,
  "queryType": "Latest + Top"
}
```

`maxItems` covers both search terms.
Use separate runs when each term needs 100 results.

## Public Profile Timeline

```json
{
  "mode": "profileTweets",
  "twitterHandles": ["public_account"],
  "maxItems": 50,
  "outputVariant": "rich",
  "fieldStyle": "camelCase",
  "outputPreset": "nested"
}
```

Use another profile mode for replies, media, or likes.

## Public Audience Overlap

```json
{
  "twitterHandles": ["public_brand_a", "public_brand_b"],
  "relation": "followers",
  "maxItems": 200,
  "maxItemsPerTarget": 100,
  "outputMode": "compact",
  "includeTargetMetadata": true,
  "overlapMode": true
}
```

Merge mode returns source arrays and `overlapCount`.
Use `dedupeMode: "none"` for separate target rows.

## Public List Members

```json
{
  "listIds": ["1234567890123456789"],
  "relation": "list_members",
  "maxItems": 100,
  "outputMode": "compact",
  "includeTargetMetadata": true,
  "dedupeMode": "none"
}
```

Use `list_followers` for public list subscribers.
Use `community_members` with public community IDs.

## Acceptance Checks

Before execution:

- [ ] Each field exists in the live schema.
- [ ] Each target is public and user-approved.
- [ ] `maxItems` is explicit.
- [ ] Multi-target work has a fairness decision.
- [ ] Current pricing was reviewed.
- [ ] The external run was approved.

After execution:

- [ ] Data rows and diagnostics are separated.
- [ ] Source targets and relations are preserved.
- [ ] Dedupe behavior is recorded.
- [ ] Missing targets are explained.
- [ ] Observations and interpretations are separated.
