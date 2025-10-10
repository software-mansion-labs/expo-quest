# expo-quest

This is a fork of some of the `expo` packages which adds a support for Meta Quest devices.

## Included packages

- [`expo-quest`](expo-quest/README.md) - for building Expo applications for Meta Quest devices
- [`expo-quest-location`](expo-quest-location/README.md) - for location services on Meta Quest devices
- [`expo-quest-notifications`](expo-quest-notifications/README.md) - for push notifications on Meta Quest devices

## Example app

- [`example`](example/README.md) - an example app that uses the included packages

## Usage

```bash
yarn
```

## Upstream Sync

The packages are automatically synced from the upstream Expo repository using GitHub Actions.

### Manual Sync with Conflict Resolution

When the automated sync encounters conflicts, you can use the local sync script to resolve them manually:

```bash
# Run the local sync script
./scripts/sync-upstream-local.sh

# If conflicts occur, you'll be guided through the resolution process:
# 1. Edit conflicted files to resolve conflicts
# 2. Add resolved files: git add <file>
# 3. Complete the merge: git commit
# 4. Push and create PR: git push -u origin <branch-name>
```

The script will:
- Create a new branch for the sync
- Attempt to merge upstream changes
- If conflicts occur, leave you on the branch to resolve them manually
- If no conflicts, provide instructions for creating a PR

**Requirements:**
- `git-filter-repo`: Install with `pip install git-filter-repo`
- `gh` CLI tool: For creating PRs automatically
