# Submission Checklist

Complete every item before submitting the Opptra FDE assignment.

---

## Repository

- [ ] README complete and professional
- [ ] Repository is **public** (or shared with reviewers)
- [ ] No secrets committed (`.env` in `.gitignore`)
- [ ] `LICENSE` file present (MIT)
- [ ] `.env.example` present with documented variables

---

## Code Quality

- [ ] Tests passing (`npm test` → 42/42)
- [ ] Production build passes (`npm run build`)
- [ ] Preview works locally (`npm run preview`)
- [ ] No `console.log` in source
- [ ] No TODO / FIXME left in source
- [ ] Console clean in browser (no errors)

---

## Functionality

- [ ] Sample outputs verified against assignment spec
  - [ ] ITEM-01 → Rs.1,104
  - [ ] ITEM-02 → Rs.629
  - [ ] ITEM-03 → Rs.509
  - [ ] ITEM-04 → Rs.2,499
  - [ ] ITEM-05 → Rs.382
  - [ ] ITEM-06 → Rs.809
  - [ ] Cart subtotal → Rs.5,932
  - [ ] Cart offer → −Rs.593
  - [ ] Final total → Rs.5,339
- [ ] CSV rules upload works
- [ ] CSV cart upload works
- [ ] PDF cart upload works
- [ ] Natural language rules work (with Anthropic API key)
- [ ] Export results CSV includes summary + timestamp

---

## UI / UX

- [ ] Mobile responsive (320px, 375px, 768px)
- [ ] Desktop layout (1024px, 1440px)
- [ ] Dark mode toggle works
- [ ] Accessibility checked (keyboard nav, focus states, ARIA)
- [ ] Single Calculate CTA (no duplicate buttons)

---

## Documentation

- [ ] `docs/DEPLOYMENT.md` complete
- [ ] `docs/LOOM_SCRIPT.md` complete
- [ ] `docs/FINAL_QA_REPORT.md` complete
- [ ] Screenshots added (replace SVG placeholders in `assets/screenshots/`)

---

## Deployment & Demo

- [ ] Deployed to Vercel / Netlify / GitHub Pages
- [ ] Deployment URL added to README (if applicable)
- [ ] Environment variables configured on host (`VITE_ANTHROPIC_API_KEY` if using AI)
- [ ] Loom walkthrough recorded and uploaded
- [ ] Loom link added to submission

---

## Final Sign-off

| Check | Status | Date |
|-------|--------|------|
| All tests pass | ☐ | |
| Build passes | ☐ | |
| Assignment outputs verified | ☐ | |
| Loom uploaded | ☐ | |
| Ready to submit | ☐ | |
