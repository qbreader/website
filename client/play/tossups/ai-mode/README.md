# How to add a new AI bot

Following the pattern in `ai-bots.js`, create a function with the following signature:

```javascript
function ({ packetLength, oldTossup, tossup }) {
    const buzzpoint: number;
    const correctBuzz: boolean;
    return { buzzpoint, correctBuzz };
}
```

and add it (along with a description) to the `aiBots` dictionary.
The rest of the code will handle loading the bot into the game, etc.
