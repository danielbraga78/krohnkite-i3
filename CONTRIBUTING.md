# Contributing to Krohnkite-i3

Krohnkite-i3 is an independent fork of [anametologin/Kröhnkite](https://codeberg.org/anametologin/Krohnkite). Contributions should focus on the fork's i3-style tiling goals and preserve the original project's attribution and MIT license.

## Working on this fork

1. Create a feature branch from the fork's default branch.
2. Install the development requirements listed in the [README](README.md).
3. Make focused changes in `src/` and the corresponding resources in `res/` as needed. Avoid editing generated files under `pkg/`.
4. Build a package with `go-task package`. On a KDE Plasma 6 session, `go-task install` builds and installs it.
5. Open a pull request against this fork and describe the user-visible change and how it was checked.

## Syncing changes from the original project

The original Kröhnkite project is a separate upstream, not this fork's `origin`. Add it as `upstream` if it is not already configured:

```sh
git remote add upstream https://codeberg.org/anametologin/Krohnkite.git
git fetch upstream
git remote show upstream
```

Check the upstream default branch before merging it into a dedicated integration branch:

```sh
git switch -c sync-upstream
git merge upstream/<default-branch>
```

Resolve conflicts carefully. The two projects have different layout goals; bring over relevant fixes rather than assuming every upstream change belongs in this fork. Test the resulting package before merging the integration branch into the fork's default branch.

## Licensing

The project is distributed under the MIT License. Keep existing copyright and license notices intact, and include appropriate notices for substantial contributions.
