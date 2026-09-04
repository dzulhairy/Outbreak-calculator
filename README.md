# ZAP! Outbreak Investigator — V3 Professional Edition

A static, GitHub Pages-ready field epidemiology decision-support application.

## V3 features
- Professional navy/teal public-health dashboard
- Outbreak profile and denominator QC
- Attack Rate, CFR, Secondary Attack Rate, hospitalisation proportion
- CSV line-list upload processed locally in the browser
- Automatic detection of common age, sex, locality and onset-date columns
- Person–Place–Time summary
- Epidemic curve
- Multiple candidate exposure analysis
- Attack rates among exposed/unexposed
- Risk Ratio, 95% CI and Pearson chi-square p-value
- Automated epidemiological narrative
- Copy summary
- Print / Save PDF using the browser

## Deploy to your existing GitHub Pages repository
Replace the old files in the repository root with:
- index.html
- style.css
- script.js
- README.md

Commit changes. GitHub Pages should redeploy automatically.

## Suggested CSV columns
case_id, age, sex, locality, date_onset, hospitalised, outcome

Use YYYY-MM-DD for date_onset.

## Important
This application is decision support, not a substitute for professional outbreak investigation. Analytical associations do not by themselves establish causality.
