# GitHub Publish Steps

GitHub CLI is installed, but no GitHub account is authenticated in the submission workspace. A free GitHub account is sufficient; no paid plan is required.

Run these commands from the final extracted `Forklight` directory after reviewing the repository contents:

```powershell
gh auth login
gh repo create forklight --public --source . --remote origin --push --description "Branchable live state for AI agents: humans define the rules, agents explore futures, verified changes merge only after approval." --homepage "https://forklight.kimth06230724.chatgpt.site/"
gh repo edit --add-topic webmcp --add-topic ai-agents --add-topic human-in-the-loop --add-topic react --add-topic threejs --add-topic typescript
git push origin webmcp-challenge-submission-v1
gh repo view --web
```

Before creating the repository, verify that `gh repo view forklight` does not identify an unrelated repository you own. Do not overwrite an unrelated repository.

After publishing:

1. Confirm the repository visibility is **Public**.
2. Confirm the default branch is `main`.
3. Confirm GitHub renders `README.md` on the repository front page.
4. Confirm GitHub detects the root `LICENSE` as MIT.
5. Confirm the homepage opens the live Forklight app.
6. Copy the final GitHub URL into `submission/DEVPOST_FINAL.md` and the Devpost form.
7. Clone the public URL into a new empty folder and follow `docs/CLEAN_CLONE_VERIFICATION.md`.

The local source freeze tag is `webmcp-challenge-submission-v1`. The final command above publishes that immutable tag after the repository has been created.
