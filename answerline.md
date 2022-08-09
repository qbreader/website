Sample Answerline:
------------------

> <b><u>Newton</u></b>'s <b><u>second</u></b> law of motion 
> [
>     accept anything indicating <b><u>Newton</u></b> and <b><u>two</u></b>, prompt on partial answers; 
>     accept <b><u>impulse</u></b>-momentum principle before "impulse;" 
>     accept "<u>F equals m a</u>" 
>     or "<u>force equals mass times acceleration</u>" before "force"; 
>     prompt on <u>equation of motion</u>; 
>     prompt on Tsiolkovsky's <u>rocket</u> equation before "rocket," asking "what more basic statement gains that term in the derivation of the rocket equation?"
> ]

> <b><u>gravitational wave</u></b>s [or <b><u>gravitational radiation</u></b>; accept <b><u>gravitational</u></b> waves after "waves" and prompt beforehand; do not accept or prompt on "gravity waves"]

- [x] Remove metadata - stuff inside () and <>
- [x] Find the pair of brackets [] - everything before this is the **main answer**
- [x] For the answers inside of the brackets, split by semicolon, generating a list of **phrases**
- [x] For each **phrase**, check the first word(s). Cases:
    1. "or" or "accept" or "also accept"
        - Check for "before [x]" clauses
        - Check for "after [x]" clauses
        - Check for "after [x], prompt before [y]" clauses
    2. "prompt"
        - Check for "before [x]" clauses
        - Check for "with [x]" or "(by) asking [x]" clauses
    3. "reject", "do not accept"
    4. "accept either underlined portion" (modifies main answer)
    5. "prompt on partial" clause (modifies possible prompts based on main answer)
- [x] Split on the word "or", generating an array of acceptable/promptable/rejectable **answers**
- [x] For each answer, check with the given answer to see if it should be accepted, prompted, or rejected