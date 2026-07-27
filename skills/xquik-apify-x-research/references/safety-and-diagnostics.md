# Safety and Diagnostics

## Run Gate

Require these facts before a billable run:

- Public target or query.
- Selected Actor and route.
- Current input schema.
- Current pricing source.
- Explicit global result cap.
- Optional per-target cap.
- Approved maximum cost per run.
- User approval for the external run.

Stop when the target requires access bypass.
Never place credentials in inputs, outputs, or examples.

## Result Classification

Classify each row before analysis:

| Class       | Common signal                       | Handling                  |
| ----------- | ----------------------------------- | ------------------------- |
| Data        | Expected post or profile identifier | Include in analysis       |
| Diagnostic  | `resultType: "diagnostic"`          | Report separately         |
| Filtered    | Actor reports a filter reason       | Exclude and count         |
| Duplicate   | Repeated stable identifier          | Apply the declared policy |
| Unavailable | Target visibility marker            | Report without inference  |
| Partial     | Run stopped before completion       | Preserve partial status   |

Never convert diagnostic rows into empty profiles or posts.
Never hide partial, unavailable, filtered, or duplicate counts.
Use `status` and `message` as fallback signals when `resultType` is absent.

## Audience Interpretation

Use stable user IDs when available.
Normalize handles before joining datasets.
Do not join on display names.

Keep these limits visible:

- Public relation data can be incomplete.
- Platform visibility can change between runs.
- A follow does not prove endorsement.
- Audience overlap does not prove shared intent.
- Verification status does not prove expertise.
- Profile fields can be stale or self-reported.

Report only necessary attributes that users explicitly self-disclose.
Never infer sensitive traits from profiles, bios, locations, relations, or engagement.

## Post Interpretation

Keep canonical post IDs and URLs.
Retain search terms for multi-query attribution.
Separate posts, replies, quotes, and reposts when relevant.

Do not infer sentiment from engagement counts alone.
Do not treat search ranking as population prevalence.
Do not claim exhaustive coverage without evidence.

## Retry Policy

Do not retry a billable run automatically.

Before retrying:

1. Inspect run status and diagnostic rows.
2. Check whether partial results were already billed.
3. Correct the query, target, or input.
4. Recalculate the result cap.
5. Request approval again.

## Delivery Checklist

- [ ] Name the Actor and route.
- [ ] State global and per-target limits.
- [ ] Record retrieval time.
- [ ] Count data and diagnostic rows separately.
- [ ] Preserve source metadata.
- [ ] State dedupe behavior.
- [ ] Describe incomplete targets.
- [ ] Separate observations from interpretations.
