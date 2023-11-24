This document specifies the kind of (quizbowl) answerlines that the program is designed to parse.

**Answerlines** should be formatted as follows:

```
<main answerline> [<sub-answerline>]
```

where the **sub-answerline** is a string of clauses separated by semicolons of the form:

```
(<special directives>;)? <clause> (; <clause>; ...)?
```

where each **clause** is a string of answers separated by the word "or" of the form:

```
<directive>? (on)? <answer>((or|,) <answer>(or|,) <answer> ...)? (by asking|with <directed prompt>)?
```

**Deprecated:** answers can also be separated by commas instead of "or", but this is deprecated and serves mostly to support old answerlines.

Each **directive** should be one of:

- "accept"
- "prompt"
- "reject"
- "anti-prompt"
  - some sets use "antiprompt" (no hyphen)

and "on" and "by asking/with" are optional and indicate that there should be a directed prompt.

## Special Directives

**Special directives** should be one of the following and affect the main answerline only:

- "accept either" or "accept any": accept any individual word of the main answer
  - For example, if the entire answerline is `<b><u>Grover Underwood</u></b> [accept either]`, then "Grover", "Underwood", and "Grover Underwood" would be accepted.
- "prompt on partial": prompt on any individual word of the main answer
  - For example: `<b><u>John</u></b> [prompt on partial]` would prompt on "John" and "John Smith", but not "John Smithson".

**Note:** special directives should be the first phrase in the sub-answerline, but this program will recognize them anywhere in the sub-answerline.

## Additional Info

For more information about how answerlines should be formatted, see <https://minkowski.space/quizbowl/manuals/style/answerlines.html>.
Note that the linked guide is more useful for explaining how answerlines should be formatted from a sylistic/quizbowl sense, while this specification only describes how they should be formatted in a way that computers can understand.
