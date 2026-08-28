# GitHub Publication Record

**Public repository:** <https://github.com/MirLunaDEV/forklight>  
**Release tag:** `webmcp-challenge-submission-v1`

The repository was published through the connected GitHub account. A free GitHub account is sufficient; no paid plan is required.

## Optional manual reproduction

Run these commands from the final `Forklight` directory after reviewing the repository contents.

If you are working in the original Codex project, it is already a Git repository and already contains the release tag. Skip this initialization block.

If you extracted the Git-free handoff ZIP, initialize its repository first:

```powershell
git init -b main
git add --all
git commit -m "Forklight WebMCP Challenge submission v1"
git tag -a webmcp-challenge-submission-v1 -m "Forklight WebMCP Challenge submission v1"
```

To reproduce publication manually with GitHub CLI:

```powershell
gh auth login
gh repo create forklight --public --source . --remote origin --push --description "Branchable live state for AI agents: humans define the rules, agents explore futures, verified changes merge only after approval." --homepage "https://forklight.kimth06230724.chatgpt.site/"
gh repo edit --add-topic webmcp --add-topic ai-agents --add-topic human-in-the-loop --add-topic react --add-topic threejs --add-topic typescript
git push origin webmcp-challenge-submission-v1
gh repo view --web
```

Before creating the repository, verify that `gh repo view forklight` does not identify an unrelated repository you own. Do not overwrite an unrelated repository.

Publication checks:

1. Confirm the repository visibility is **Public**.
2. Confirm the default branch is `main`.
3. Confirm GitHub renders `README.md` on the repository front page.
4. Confirm GitHub detects the root `LICENSE` as MIT.
5. Confirm the homepage opens the live Forklight app.
6. Copy the final GitHub URL into `submission/DEVPOST_FINAL.md` and the Devpost form.
7. Clone the public URL into a new empty folder and follow `docs/CLEAN_CLONE_VERIFICATION.md`.

The local source freeze tag is `webmcp-challenge-submission-v1`. The final command above publishes that immutable tag after the repository has been created.
