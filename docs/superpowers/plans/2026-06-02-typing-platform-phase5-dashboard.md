# Typing Platform — Phase 5 (Dashboard, Certificates & Achievements) Plan

> Executed via superpowers:subagent-driven-development. Full verbatim code lives in the per-task implementer dispatches; this doc is the design record + task list.

**Goal:** A home dashboard tying the app together — greeting by name, overall progress, best test, a Continue button, mode cards, earned achievement badges, and printable course certificates earned on completing a course.

**Architecture:** Pure, testable logic in `achievements.js` (badge predicates + sync) and `certificate.js` (earned-course detection + sync + course-best stats), both over the `storage` interface. DOM views: `views/dashboard.js` replaces the placeholder home; `views/certificate.js` renders a printable certificate at `#/certificate/:id` (via `window.print()` + `@media print`). New `storage` methods persist achievements + certificates (deduped).

**Tech stack:** unchanged.

## Files
- `js/storage.js` (MODIFY): `getAchievements`/`addAchievement(id)` (dedup), `getCertificates`/`addCertificate(cert)` (dedup by courseId).
- `js/achievements.js` (NEW): `ACHIEVEMENTS` defs, `evaluate(store)`, `syncAchievements(store)`, `achievementById(id)`.
- `js/certificate.js` (NEW): `earnedCourseIds(store)`, `courseBest(store, courseId)`, `syncCertificates(store, dateISO)`.
- `js/views/dashboard.js` (NEW): the home view.
- `js/views/certificate.js` (NEW): printable certificate route view.
- `js/app.js` (MODIFY): route `/` → dashboard (also as fallback), prefix route `/certificate/`; drop the placeholder `homeView`.
- `styles/celebrate.css` (MODIFY): dashboard cards/progress bar, achievement badges, certificate layout + `@media print`.
- Tests: `tests/achievements.test.js`, `tests/certificate.test.js`, additions to `tests/storage.test.js`, register in `tests/run-tests.html`.

## Tasks
1. **Logic + storage** — storage achievement/certificate methods; `achievements.js`; `certificate.js`; all unit tests. Controller verifies via direct import.
2. **Dashboard + certificate views + routing + styles** — `views/dashboard.js`, `views/certificate.js`, app routing, CSS. Controller verifies in browser (progress %, continue, badges appear after completing work; complete a course → certificate earned + printable).
3. **Verify + review + tag + finish** — full suite, e2e, console clean, independent review, tag `phase-5-dashboard`, then `superpowers:finishing-a-development-branch`.

## Key signatures
- `addAchievement(id)`→bool (deduped); `addCertificate({courseId,dateISO,wpm,accuracy})`→bool (one per course).
- `evaluate(store)`→earned achievement objects; `syncAchievements(store)`→newly-earned ids.
- `earnedCourseIds(store)`→course ids fully complete; `syncCertificates(store, dateISO)`→newly-earned course ids; `courseBest(store,id)`→`{wpm, accuracy}`.
- `dashboardView(host)` syncs achievements+certificates on load, renders progress/continue/cards/badges/certs; `certificateView(host)` reads `#/certificate/:id` and prints.

## Achievements (v1 set)
first-lesson 🌱, home-row 🏠 (Home Row unit), beginner-course 🎓, speedy ⚡ (≥20 WPM test), sharp 🎯 (≥95% test), gamer 🎮 (game high score ≥20).

## Verification
Full harness green; in-browser: dashboard shows progress %/continue/cards; completing a lesson earns "first-lesson"; a ≥20 WPM test earns "speedy"; completing every Beginner lesson earns the Beginner certificate, which renders at `#/certificate/beginner` with the learner name and prints cleanly (certificate only under `@media print`); console clean.
