# ZAP! Outbreak Calculator

GitHub Pages-ready field epidemiology calculator.

## Functions
- Attack Rate
- Secondary Attack Rate
- Case Fatality Rate
- 2×2 exposure table
- Risk Ratio (RR)
- 95% confidence interval for RR
- Pearson chi-square p-value
- Epidemic curve from onset dates
- Automatic interpretation
- Demo dataset and reset
- Mobile-friendly interface

## Deploy with GitHub Pages

1. Create a new GitHub repository, for example:
   `zap-outbreak-calculator`
2. Upload these files to the repository root:
   - `index.html`
   - `style.css`
   - `script.js`
3. Commit the files.
4. Open **Settings → Pages**.
5. Under **Build and deployment**, choose:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
6. Save.
7. After deployment, your URL will normally be:
   `https://YOUR-USERNAME.github.io/zap-outbreak-calculator/`

## Demo values
Click **LOAD DEMO** in the app.

Expected key results:
- Attack Rate = 14.0%
- Secondary Attack Rate = 16.0%
- CFR ≈ 2.9%
- AR exposed = 40.0%
- AR unexposed = 10.0%
- RR = 4.00

## Important epidemiology note
The Secondary Attack Rate denominator is entered directly as the number of susceptible contacts at the start of observation. Do not automatically subtract primary cases unless that matches the outbreak definition and population structure being used.

This tool is for epidemiological decision support and training; it does not replace outbreak investigation protocols or professional assessment.
