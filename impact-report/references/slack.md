# Posting to Slack

Post the headline panel with the message, then put the other panels in its thread. Slack posts go through Executor's Slack integration: search the `slack_com` namespace for `upload file` and `read channel`.

## 1. Draft the message

- First line: a bold headline. Use the user's wording if they gave one.
- One sentence on what changed, in plain words ("twice the CPU and memory, at twice the price per minute").
- Three or four bullets, each a bold label, then before → after and a plain percentage ("7.4 → 4.3 min, 41% faster"). Say "typical" for median and "the slow ones" for p90. Include cost and the control ("checks we didn't touch didn't get faster").
- A bold "What's slow now" line naming the new bottleneck.
- "Charts in the thread 🧵" and the sample caveat.

Make a plain-language pass so every line reads like one person talking to another. Bold is `**text**`: with this integration `*text*` comes out as italics. Leave italics out entirely.

## 2. Preview in the user's DM

Find the self-DM with `slack_list_user_channels` (`types: "im"`) and the user's ID. Post the full message and thread there, read it back with `slack_read_thread`, and show the user. Read-back reports bold as `*…*` and italics as `_…_`, so check for `_` around labels. This integration can't delete posts, so get the destination and wording confirmed before any channel post. If the user edits the DM, read their edit back and use it as the source.

## 3. Upload and post

For each PNG:

1. `slack_get_file_upload_url` with `filename`, `content_length` (exact bytes, from `stat -f %z`) and `alt_txt` (the panel's finding in one sentence).
2. POST the bytes using the returned URL exactly as given: `curl -X POST "$URL" -H 'Content-Type: image/png' --data-binary @file.png`. Expect 200. URLs expire after about an hour.
3. `slack_complete_file_upload` with `file_id`, `channel_id` and a `title`:
   - For the headline panel, add `initial_comment` (the message).
   - For the other panels, add `thread_ts`.

To get the parent's `thread_ts`, run `slack_read_channel` and take the `Message TS` of the message listing the headline file's ID.

Done when `slack_read_thread` shows the parent with its image and one reply per remaining panel.

Every post ends with a "Sent using Executor" footer that the integration adds; mention it, since it can't be turned off.
