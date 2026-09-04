# ZAP! Outbreak Calculator — English Version

A GitHub Pages-ready field epidemiology calculator.

## Included
- Overall Attack Rate
- Secondary Attack Rate
- Case Fatality Rate (CFR)
- 2 × 2 exposure table: Exposed / Not exposed × Ill / Not ill
- Risk Ratio (RR)
- 95% confidence interval for RR
- Pearson chi-square p-value
- Epidemic curve from symptom onset dates
- Automatic interpretation
- Demo dataset
- Reset button
- Mobile-friendly interface

## Deploy / replace your current GitHub Pages version

Upload these three files to the root of your existing repository and replace the old versions:
- index.html
- style.css
- script.js

Commit the changes. GitHub Pages will redeploy automatically.

## Demo
Click LOAD DEMO. Expected key outputs:
- Attack Rate: 14.0%
- Secondary Attack Rate: 16.0%
- CFR: about 2.9%
- Attack Rate Exposed: 40.0%
- Attack Rate Unexposed: 10.0%
- Risk Ratio: 4.00

## Epidemiological note
For the Secondary Attack Rate, the user directly enters the number of susceptible contacts at the start of the relevant observation period. The correct denominator depends on the outbreak context and case/contact definitions.
