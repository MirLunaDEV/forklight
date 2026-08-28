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

1. Repository visibility: **Public** — PASS.
2. Default branch: `main` — PASS.
3. Root `README.md` publication — PASS.
4. Root MIT `LICENSE` publication — PASS.
5. Public source clean clone and build — PASS; see `docs/CLEAN_CLONE_VERIFICATION.md`.
6. Final GitHub URL recorded in `submission/DEVPOST_FINAL.md` — PASS.

The local source freeze tag is `webmcp-challenge-submission-v1`. The final command above publishes that release tag after the repository has been created.
