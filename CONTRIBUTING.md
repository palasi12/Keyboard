# Contributing

Two people, one repo. These rules exist so you never lose an afternoon to a
merge conflict.

## The daily loop

```bash
git pull                       # before you start. Always.
git checkout -b feat/thing     # work on a branch, never on main
# ...edit...
git add .
git commit -m "feat: add thing"
git push -u origin feat/thing  # then open a pull request on GitHub
```

## Branch names

| Prefix     | Use for                          |
|------------|----------------------------------|
| `feat/`    | new functionality                |
| `fix/`     | bug fixes                        |
| `chore/`   | tooling, deps, config            |
| `docs/`    | documentation only               |

## Commit messages

`type: short description in the imperative`

```
feat: add hotkey action editor
fix: debounce double taps on the phone client
chore: bump electron to 33
```

Why the format: it makes `git log --oneline` readable, and later it lets us
generate a changelog automatically.

## Pull requests

Every change goes through a PR, even a one-liner. The other person reviews and
merges. This is not bureaucracy — it is the only way both of you stay aware of
what the codebase is doing.

CI runs typecheck and a production build on every PR. A red PR does not get merged.

## Who owns what

Agree this explicitly and write it here. Suggested split:

- **Palasi** — site build, checkout, deployment
- **Cofounder** — product copy, photography, vendor and pricing

Overlapping on the same files is the single biggest source of conflicts for a
two-person team. Divide by directory where you can.

## Code style

- TypeScript everywhere, `strict` on. No `any` without a comment explaining why.
- Comments explain *why*, not *what*. The code already says what.
- Keep dependencies few. Every one is more bundle for the customer to download.
