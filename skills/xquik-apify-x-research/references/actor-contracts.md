# Actor Contracts

Fetch each live input schema before any run.
This reference records routing concepts, not pricing.

## Actor Identifiers

| Actor                                                                  | Store slug                 | REST name                  | Actor ID            |
| ---------------------------------------------------------------------- | -------------------------- | -------------------------- | ------------------- |
| [Xquik X Tweet Scraper](https://apify.com/xquik/x-tweet-scraper)       | `xquik/x-tweet-scraper`    | `xquik~x-tweet-scraper`    | `wAusCMrm284Voaw86` |
| [Xquik X Follower Scraper](https://apify.com/xquik/x-follower-scraper) | `xquik/x-follower-scraper` | `xquik~x-follower-scraper` | `AaT0BcKU5GQh97wdt` |

Prefer store slugs in Apify CLI commands.
Use REST names only where an endpoint requires them.

## Tweet Scraper Routes

| Need              | `mode`           | Main target field                           |
| ----------------- | ---------------- | ------------------------------------------- |
| Automatic routing | `legacy`         | Supported URLs, handles, IDs, or queries    |
| One post          | `tweet`          | `tweetId` or `tweetIds`                     |
| Several posts     | `tweets`         | `tweetIds`                                  |
| Search            | `search`         | `searchTerms`, `twitterContent`, or `query` |
| Profile posts     | `profileTweets`  | `twitterHandles` or `profileUrls`           |
| Profile replies   | `profileReplies` | `twitterHandles` or `profileUrls`           |
| Profile media     | `profileMedia`   | `twitterHandles` or `profileUrls`           |
| Profile likes     | `profileLikes`   | `twitterHandles` or `profileUrls`           |
| List posts        | `listTweets`     | `listIds`                                   |
| Article           | `article`        | `articleTweetIds`                           |
| Replies           | `replies`        | `replyTweetIds`                             |
| Quotes            | `quotes`         | `quoteTweetIds`                             |
| Thread            | `thread`         | `threadTweetIds`                            |
| Retweeters        | `retweeters`     | `retweeterTweetIds`                         |
| Favoriters        | `favoriters`     | `favoriterTweetIds`                         |

Output variants are `legacy`, `rich`, and `raw`.
Field styles are `legacy`, `camelCase`, and `snake_case`.
Output presets are `nested` and `flat`.

Use `includeSearchTerms: true` for shared multi-query runs.
`maxItems` applies across the complete run.
Use separate runs for independent per-query quotas.

## Follower Scraper Relations

| Need               | `relation`           | Main target field             |
| ------------------ | -------------------- | ----------------------------- |
| Followers          | `followers`          | `twitterHandles` or `userIds` |
| Following          | `following`          | `twitterHandles` or `userIds` |
| Verified followers | `verified_followers` | `twitterHandles` or `userIds` |
| List members       | `list_members`       | `listIds`                     |
| List followers     | `list_followers`     | `listIds`                     |
| Community members  | `community_members`  | `communityIds`                |

Use `relations` when one target needs several relations.
Use `maxItemsPerTarget` to balance multi-target runs.

Output modes are `compact`, `full`, and `raw`.
Dedupe modes are `none`, `first`, and `merge`.
`overlapMode: true` is the merge shortcut.

Keep `includeTargetMetadata: true` for multi-target analysis.
It preserves each source target, relation, and URL.

## Contract Refresh

Use read-only Actor inspection:

```bash
apify actors info "xquik/x-tweet-scraper" --input --json
apify actors info "xquik/x-follower-scraper" --input --json
```

Stop unless both commands return their input schemas successfully.

Validate examples against:

```text
taggedBuilds.latest.build.actorDefinition.input
```

Never infer pricing from an old document.
Read the current Actor listing and Actor information.
