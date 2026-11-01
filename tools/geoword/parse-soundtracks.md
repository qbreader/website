# Task

**Turn a packet's Word doc and timing spreadsheet into an `answers.json` that the Geoword upload script accepts.**

- **Input:** the `.docx` I name (e.g. `Demo Packet.docx`) for the text, and an `.xlsx` I name (e.g. `SEPTEMBER Questions (Reordered).xlsx`) for the clip timings. The xlsx is a zip of XML; if no spreadsheet library is installed, unzip it and read the XML rather than installing packages into the repo.
- **Output:** `answers.json` in the same folder as the `.docx`, overwriting any existing one. It is a JSON array with one entry per tossup, ordered by `questionNumber`.
- Before writing, read `tools/geoword/upload-packet.js` (especially the `--help` epilog) so the output matches what it validates.

# Output schema

**Each tossup becomes one JSON object with the fields below.**

All fields are strings unless noted.

| Field | Required | Meaning |
| --- | --- | --- |
| `questionNumber` | yes (number) | The tossup's number in the packet, starting at 1 |
| `instructions` | if present | The directive sentence(s) telling the player what to answer, e.g. `Name the album.` |
| `question` | yes | The clue list that follows the answer, with HTML formatting |
| `question_sanitized` | yes | `question` with formatting tags removed and special characters normalized |
| `answer` | yes | The answer line, with HTML formatting |
| `answer_sanitized` | yes | `answer` with formatting tags removed and special characters normalized |
| `category` | yes | The same string as `subcategory` |
| `subcategory` | yes | The docx's subcategory tag, in title case |
| `clues` | yes (array of strings) | Each clue as its own string (see Clues) |
| `clipBoundaries` | if the spreadsheet allows (array of numbers) | The second at which each clue starts in the audio (see Clip boundaries) |

# Parsing rules

## Instructions

**`instructions` is the short directive telling the player what kind of answer to give, like "Name the album."**

- Any sentence that tells the player what to give, such as `Name the album.` or `Name the composer.`, goes in `instructions`, not in `question`.
- If a tossup has no such sentence, omit `instructions` (do not use an empty string).

## Question

**`question` is the list of clues the player hears, written as one line of formatted text (the text after the answer in the docx).**

- The `question` is everything that comes after the answer and before the subcategory tag.
- Drop the leading `Clues:` label; keep only the clue text itself. Example: from `Clues: "Get It Right the First Time", "Vienna"`, the `question` is `"Get It Right the First Time", "Vienna"`.

## Answer

**`answer` is the correct answer to the tossup, with its bold/underline/italic formatting (the answer line in the docx).**

- The `answer` is the answer line from the docx, without any `ANSWER:` label.

## Subcategory

**`subcategory` is the tossup's specific topic label, taken from the docx's `<tag>` (e.g. `<rock>`) and written in title case (`Rock`).**

- The `subcategory` is the tag after the question, with the angle brackets removed and the text otherwise unchanged, then converted to proper title case. Examples: `<rock>` → `Rock`, `<electronic/dance>` → `Electronic/Dance`, `<hip hop>` → `Hip Hop`.
- Do not rename, merge, or correct tags, and do not look the tag up in `shared/categories.js`; custom tags that appear nowhere in that file are expected. The same tag must produce the same string in every tossup, regardless of how it was capitalized in the docx.
- Title case means each word starts with a capital letter, including each part around `/` and `-`, with the remaining letters lowercase (e.g. `r&b` → `R&B`). Keep an all-caps acronym in caps.

## Category

**`category` is always identical to `subcategory`.**

- Copy the `subcategory` string (the title-cased tag) into `category` exactly. Examples: `<rock>` → `category: "Rock"`, `<electronic/dance>` → `category: "Electronic/Dance"`.
- Do not map the tag to a category in `shared/categories.js`; the category does not need to appear in that file.

## Clues

**`clues` is the same clue list as `question`, split into one string per clue, in the order they are played.**

- Both come from the same docx text, so they must agree.
- `clues` is the `question` split into its individual clues, in order, with no HTML. Each string keeps its literal quote characters, so the JSON looks like `["\"Get It Right the First Time\"", "\"Everybody Has a Dream\"", ...]`.
- Clues are not always quoted titles (e.g. `"True Blue" by boygenius`). Split on the separators between clues, not on quote marks, and keep any trailing text like `by boygenius` with its clue.

## Clip boundaries

**`clipBoundaries` lists the second at which each clue starts in the tossup's audio, so the results page can jump to it; it is computed from the clip lengths in the spreadsheet.**

- `clipBoundaries` is a list of numbers, one per clue: the second at which each clue's audio clip starts within that tossup's audio. The first is always `0`. Example: `[0, 10, 21, 31, 41, 53]`.
- The times come from a spreadsheet (`.xlsx`) I provide alongside the docx, not from the docx.
- In the spreadsheet, find the sheet for this packet (sheet names are usually the packet name, e.g. `Demo` for `Demo Packet.docx`). Ignore similarly named sheets that hold other data (e.g. `Demo (Answerlines)`), and ignore any column that locates the clip in its source recording (e.g. a YouTube video ID or `Start at (sec)`); those say where the clip was cut from, not where it sits in the tossup audio.
- Find columns by header name, not position. You need the question number, the clip number within the question, and the clip length in seconds.
- For each question, order its rows by clip number. Then `clipBoundaries[0] = 0` and `clipBoundaries[i] = clipBoundaries[i-1] + length of clip i-1`. The last clip's length is not used. Example: lengths `10, 11, 10, 10, 12, 10` give `[0, 10, 21, 31, 41, 53]`.
- If the spreadsheet has a total-length column (e.g. `Total length (sec)`), check that it equals the sum of all clip lengths for that question. Report any mismatch.
- `clues` and `clipBoundaries` must be the same length in every entry. If the clip count in the spreadsheet differs from the clue count in the docx, do not guess: omit `clipBoundaries` for that tossup and report it. Never invent times.
- If I provide no spreadsheet, or it has no matching sheet, omit `clipBoundaries` from every entry and say so in the final report.

# Formatting rules

## HTML in `question` and `answer`

**Only bold, underline, and italic survive; everything else becomes plain text.**

- Keep bold, underline, and italic from the docx using only `<b>`, `<u>`, and `<i>`.
- When text has more than one of these formats, always nest the tags in the order `<i>`, `<b>`, `<u>`: `<i>` outermost, then `<b>`, then `<u>` innermost, regardless of how the docx orders them. Example: bold-underlined text is `<b><u>text</u></b>`, and italic-bold-underlined text is `<i><b><u>text</u></b></i>`.
- Tags must be properly nested, never overlapping. If formatting changes partway through a span, close and reopen tags in that same order. Example: text that is bold throughout but underlined only in the middle is `<b>aa </b><b><u>bb</u></b><b> cc</b>`.
- Use no other HTML tags (no `<p>`, `<br>`, `<em>`, `<strong>`, `<span>`, etc.) and no non-text elements such as tables or images. Flatten them to plain text.

## Sanitized fields

**`question_sanitized` and `answer_sanitized` are plain-text copies of `question` and `answer` (no tags, simple characters), generated with the repo's helpers rather than by hand.**

- Build them in a small throwaway script (in the scratchpad, not the repo) that imports the helpers and applies them to the HTML versions:
  - `answer_sanitized = unformatString(removeHTML(answer))`
  - `question_sanitized = unformatString(removeHTML(question))`
- `removeHTML` and `unformatString` are both named exports of `shared/string-utils.js`.

# Final checks

**Verify the file before reporting back, and flag anything that was guessed or missing.**

Verify and state the results of:
1. The file is valid JSON and every `questionNumber` is unique and consecutive from 1.
2. Every entry has all required fields, with no empty strings (`instructions` and `clipBoundaries` may be absent as described above).
3. Each `subcategory` is the title-cased tag, and each `category` equals its `subcategory`.
4. `clues.length === clipBoundaries.length` for every entry that has `clipBoundaries`, and each `clipBoundaries` starts at 0 and strictly increases.
5. The only HTML tags present are `<b>`, `<u>`, `<i>`, and wherever they nest, `<i>` is outside `<b>`, which is outside `<u>`.
6. The `*_sanitized` fields contain no HTML tags.

Then report anything you had to guess or could not fill in.
