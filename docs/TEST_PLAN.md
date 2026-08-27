# Forklight Test Plan v1.2

## State

1. branch creation leaves MAIN unchanged
2. branch A edit leaves B and MAIN unchanged
3. mutation invalidates metrics/validation
4. approved branch mutation revokes approval
5. protected move remains violation after move-back

## Simulator/golden

6. deterministic same world/seed
7. no simulation dependence on `Math.random()`
8. A fails distance
9. B passes all four
10. C fails protected
11. exactly one verified future = B

## Merge

12. merge capability absent at boot
13. failed branch cannot approve
14. unapproved verified branch cannot merge
15. stale branch cannot merge
16. approve current verified B exposes merge
17. revoke removes merge
18. mutation after approval removes merge
19. merge increments MAIN revision
20. B becomes merged
21. A/C become stale
22. merge capability disappears

## WebMCP

23. document.modelContext only
24. 9 static tools
25. 4 read tools with readOnlyHint
26. all tools have titles
27. outer execute values are structured objects
28. structured compact errors
29. bounded same-name re-registration
30. real WebMCP timeline only
31. manual QA source separated
32. WebMCP unavailable does not break manual app

## Submission/cleanroom

33. QA hidden without `?qa=1`
34. QA visible with `?qa=1`
35. no DB migration in production build
36. no server required for production
37. no auth/OAuth requirement
38. no multiplayer requirement
39. no Grok PWA/app-env runtime requirement
40. static build succeeds

## Live gate

41. real site-tools inspect→branch→mutate→simulate→validate→compare works
42. human approve changes tool surface
43. real merge works
44. MAIN visibly changes
45. merge capability disappears after success
