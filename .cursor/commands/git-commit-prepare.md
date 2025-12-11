git add しています。どのような変更があったかを確認し、コミットメッセージ案(日本語)を出してください。詳細バージョンと簡素バージョンをかき分けて下さい。
コミットメッセージは、基本的に体言止めで書いてください。体言止めでは書きづらいときは、だ、である調で書いてください。

ただし、下記のルールに従ってください。

# Semantic Commit Messages

See how a minor change to your commit message style can make you a better programmer.

Format: <type>(<scope>): <subject>

<scope> is optional

## Example

feat: add hat wobble
^--^  ^------------^
|     |
|     +-> Summary in present tense.
|
+-------> Type: chore, docs, feat, fix, refactor, style, or test.

More Examples:

- `feat`: (new feature for the user, not a new feature for build script)
- `fix`: (bug fix for the user, not a fix to a build script)
- `docs`: (changes to the documentation)
- `style`: (formatting, missing semi colons, etc; no production code change)
- `refactor`: (refactoring production code, eg. renaming a variable)
- `test`: (adding missing tests, refactoring tests; no production code change)
- `chore`: (updating grunt tasks etc; no production code change)