# PI Skills Index

Skills imported from [pi-coding-agent](https://github.com/) skills repository, prefixed with `pi-` to mark provenance. All are Claude Code compatible.

| Skill | Description |
|-------|-------------|
| [pi-brave-search](./pi-brave-search/) | Web search and content extraction via Brave Search API. Use for searching documentation, facts, or any web content. Lightweight, no browser required. |
| [pi-browser-tools](./pi-browser-tools/) | Interactive browser automation via Chrome DevTools Protocol. Use when you need to interact with web pages, test frontends, or when user interaction with a visible browser is required. |
| [pi-gccli](./pi-gccli/) | Google Calendar CLI for listing calendars, viewing/creating/updating events, and checking availability. |
| [pi-gdcli](./pi-gdcli/) | Google Drive CLI for listing, searching, uploading, downloading, and sharing files and folders. |
| [pi-gmcli](./pi-gmcli/) | Gmail CLI for searching emails, reading threads, sending messages, managing drafts, and handling labels/attachments. |
| [pi-transcribe](./pi-transcribe/) | Speech-to-text transcription using Groq Whisper API. Supports m4a, mp3, wav, ogg, flac, webm. |
| [pi-vscode](./pi-vscode/) | VS Code integration for viewing diffs and comparing files. Use when showing file differences to the user. |
| [pi-youtube-transcript](./pi-youtube-transcript/) | Fetch transcripts from YouTube videos for summarization and analysis. |

## Provenance

Source: `/tmp/pi-skills/` (pi-coding-agent skills repository).

Note: The `name` field inside each `SKILL.md` frontmatter retains the original (unprefixed) skill name. The `pi-` prefix exists only on the directory name to mark provenance and avoid collisions with other vibe skills.
