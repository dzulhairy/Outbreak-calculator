
"use strict";

const $ = (id) => document.getElementById(id);

function num(id){
  const raw = $(id).value.trim();
  if(raw === "") return null;
  const x = Number(raw);
  return Number.isFinite(x) ? x : null;
}

function fmtPct(x){
  return x === null ? "—" : `${x.toFixed(1)}%`;
}

function fmtRR(x){
  if(x === null || !Number.isFinite(x)) return "—";
  return x.toFixed(2);
}

function validateNonNegative(ids){
  let ok = true;
  ids.forEach(id => {
    const el = $(id);
    el.classList.remove("error");
    const v = num(id);
    if(v !== null && v < 0){
      el.classList.add("error");
      ok = false;
    }
  });
  return ok;
}

function safeRate(numerator, denominator){
  if(numerator === null || denominator === null || denominator <= 0) return null;
  return numerator / denominator;
}

function erf(x){
  // Abramowitz and Stegun 7.1.26
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p*x);
  const y = 1 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*Math.exp(-x*x);
  return sign*y;
}

function normalCDF(z){
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

function pearsonChiSquareP(a,b,c,d){
  if([a,b,c,d].some(v => v === null)) return null;
  const n = a+b+c+d;
  const r1 = a+b, r2 = c+d, c1 = a+c, c2 = b+d;
  if(n <= 0 || r1 <= 0 || r2 <= 0 || c1 <= 0 || c2 <= 0) return null;
  const denom = r1*r2*c1*c2;
  if(denom <= 0) return null;
  const chi2 = n * Math.pow(a*d - b*c, 2) / denom;
  const z = Math.sqrt(chi2);
  const p = 2 * (1 - normalCDF(z)); // chi-square with 1 df
  return Math.max(0, Math.min(1, p));
}

function riskRatioStats(a,b,c,d){
  if([a,b,c,d].some(v => v === null)) return null;
  if((a+b) <= 0 || (c+d) <= 0) return null;

  const crudeExposed = a/(a+b);
  const crudeUnexposed = c/(c+d);
  let corrected = false;

  let aa=a, bb=b, cc=c, dd=d;
  if([a,b,c,d].some(v => v === 0)){
    aa += 0.5; bb += 0.5; cc += 0.5; dd += 0.5;
    corrected = true;
  }

  const riskE = aa/(aa+bb);
  const riskU = cc/(cc+dd);
  if(riskU <= 0) return null;

  const rr = riskE/riskU;
  const seLogRR = Math.sqrt((1/aa) - (1/(aa+bb)) + (1/cc) - (1/(cc+dd)));
  const low = Math.exp(Math.log(rr) - 1.96*seLogRR);
  const high = Math.exp(Math.log(rr) + 1.96*seLogRR);

  return {rr, low, high, corrected, crudeExposed, crudeUnexposed};
}

function pText(p){
  if(p === null) return "—";
  if(p < 0.001) return "<0.001";
  return p.toFixed(3);
}

function interpretRR(stats, p){
  if(!stats) return "The 2 × 2 table does not contain enough data to calculate the Risk Ratio.";
  const rr = stats.rr;
  const ci = `${stats.low.toFixed(2)}–${stats.high.toFixed(2)}`;

  let statement = "";
  if(rr > 1){
    statement = `The exposed group has approximately <b>${rr.toFixed(2)} times</b> the risk of illness compared with the unexposed group.`;
  }else if(rr < 1){
    statement = `The exposed group has a lower risk of illness than the unexposed group (RR < 1).`;
  }else{
    statement = `The risk is the same in both groups (RR = 1.00).`;
  }

  const sig = (stats.low > 1 || stats.high < 1)
    ? ` 95% CI <b>${ci}</b> does not include 1.0.`
    : ` 95% CI <b>${ci}</b> includes 1.0.`;

  const pbit = p === null ? "" : ` Pearson χ² p = <b>${pText(p)}</b>.`;
  const correction = stats.corrected ? ` A 0.5 continuity correction was used for RR/CI because at least one cell was zero.` : "";

  return statement + sig + pbit + correction;
}

function calculate(){
  const ids = ["population","cases","deaths","susceptibleContacts","secondaryCases","a","b","c","d"];
  if(!validateNonNegative(ids)){
    $("interpretation").innerHTML = "<b>Semak input:</b> semua nilai perlu ≥ 0.";
    return;
  }

  const population = num("population");
  const cases = num("cases");
  const deaths = num("deaths");
  const susceptibleContacts = num("susceptibleContacts");
  const secondaryCases = num("secondaryCases");
  const a=num("a"), b=num("b"), c=num("c"), d=num("d");

  const attack = safeRate(cases, population);
  const secondary = safeRate(secondaryCases, susceptibleContacts);
  const fatality = safeRate(deaths, cases);
  const rrStats = riskRatioStats(a,b,c,d);
  const p = pearsonChiSquareP(a,b,c,d);

  $("attackRate").textContent = attack === null ? "—" : fmtPct(attack*100);
  $("attackDetail").textContent = (cases !== null && population !== null && population > 0) ? `${cases}/${population}` : "—";

  $("secondaryAttackRate").textContent = secondary === null ? "—" : fmtPct(secondary*100);
  $("secondaryDetail").textContent = (secondaryCases !== null && susceptibleContacts !== null && susceptibleContacts > 0) ? `${secondaryCases}/${susceptibleContacts}` : "—";

  $("cfr").textContent = fatality === null ? "—" : fmtPct(fatality*100);
  $("cfrDetail").textContent = (deaths !== null && cases !== null && cases > 0) ? `${deaths}/${cases}` : "—";

  const arE = (a !== null && b !== null) ? safeRate(a, a+b) : null;
  const arU = (c !== null && d !== null) ? safeRate(c, c+d) : null;

  $("arExposed").textContent = arE === null ? "—" : fmtPct(arE*100);
  $("arExposedDetail").textContent = (a !== null && b !== null && (a+b)>0) ? `${a}/${a+b}` : "—";

  $("arUnexposed").textContent = arU === null ? "—" : fmtPct(arU*100);
  $("arUnexposedDetail").textContent = (c !== null && d !== null && (c+d)>0) ? `${c}/${c+d}` : "—";

  $("rr").textContent = rrStats ? fmtRR(rrStats.rr) : "—";
  $("rrCI").textContent = rrStats ? `95% CI: ${rrStats.low.toFixed(2)}–${rrStats.high.toFixed(2)}` : "95% CI: —";
  $("pValue").textContent = pText(p);

  const sections = [];
  if(attack !== null){
    sections.push(`Overall attack rate is <b>${(attack*100).toFixed(1)}%</b>.`);
  }
  if(secondary !== null){
    sections.push(`Secondary attack rate is <b>${(secondary*100).toFixed(1)}%</b>.`);
  }
  if(fatality !== null){
    sections.push(`Case fatality rate is <b>${(fatality*100).toFixed(1)}%</b>.`);
  }
  sections.push(interpretRR(rrStats,p));

  $("interpretation").innerHTML = sections.join(" ");
  drawCurve();

  $("resultsPanel").scrollIntoView({behavior:"smooth", block:"start"});
}

function parseDates(){
  const raw = $("onsetDates").value
    .split(/\n|,/)
    .map(s => s.trim())
    .filter(Boolean);

  const counts = new Map();
  for(const value of raw){
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if(!m) continue;
    const date = new Date(`${value}T00:00:00`);
    if(Number.isNaN(date.getTime())) continue;
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()].sort((x,y) => x[0].localeCompare(y[0]));
}

function drawCurve(){
  const data = parseDates();
  const svg = $("epiChart");
  svg.innerHTML = "";

  const NS = "http://www.w3.org/2000/svg";
  const add = (tag, attrs={}, text="") => {
    const e = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k,v]) => e.setAttribute(k,v));
    if(text !== "") e.textContent = text;
    svg.appendChild(e);
    return e;
  };

  const W=900, H=340, L=62, R=20, T=28, B=76;
  add("line",{x1:L,y1:H-B,x2:W-R,y2:H-B,stroke:"#111","stroke-width":"2.5"});
  add("line",{x1:L,y1:T,x2:L,y2:H-B,stroke:"#111","stroke-width":"2.5"});
  add("text",{x:16,y:(T+H-B)/2,transform:`rotate(-90 16 ${(T+H-B)/2})`,"font-size":"12","font-weight":"800","text-anchor":"middle"},"Number of cases");

  if(data.length === 0){
    add("text",{x:L+15,y:T+30,"font-size":"15","font-weight":"700",fill:"#666"},"Enter symptom onset dates to generate the epidemic curve.");
    $("curveSummary").textContent = "Tiada data onset.";
    return;
  }

  const total = data.reduce((s,[,n])=>s+n,0);
  const maxCount = Math.max(...data.map(([,n])=>n));
  $("curveSummary").textContent = `${total} cases · ${data.length} onset dates`;

  const plotW = W-L-R;
  const plotH = H-T-B;
  const slot = plotW/data.length;
  const barW = Math.max(10, slot*0.72);

  const ticks = Math.min(maxCount, 5);
  for(let i=0;i<=ticks;i++){
    const val = Math.round((maxCount/ticks)*i);
    const y = H-B-(val/maxCount)*plotH;
    add("line",{x1:L,y1:y,x2:W-R,y2:y,stroke:"#ddd","stroke-width":"1"});
    add("text",{x:L-10,y:y+4,"font-size":"11","text-anchor":"end"},String(val));
  }

  data.forEach(([date,count],i)=>{
    const x = L+i*slot+(slot-barW)/2;
    const h = (count/maxCount)*plotH;
    const y = H-B-h;

    add("rect",{x,y,width:barW,height:h,rx:"2",fill:"#ffd12a",stroke:"#111","stroke-width":"2"});
    add("text",{x:x+barW/2,y:y-6,"font-size":"11","font-weight":"900","text-anchor":"middle"},String(count));

    const label = data.length > 12 ? date.slice(5) : date;
    const tx = x+barW/2;
    const ty = H-B+17;
    add("text",{x:tx,y:ty,"font-size":"10","text-anchor":"end",transform:`rotate(-45 ${tx} ${ty})`},label);
  });
}

function loadDemo(){
  $("population").value = 250;
  $("cases").value = 35;
  $("deaths").value = 1;
  $("susceptibleContacts").value = 75;
  $("secondaryCases").value = 12;

  $("a").value = 20;
  $("b").value = 30;
  $("c").value = 5;
  $("d").value = 45;

  $("onsetDates").value = [
    "2026-09-01","2026-09-01","2026-09-01",
    "2026-09-02","2026-09-02","2026-09-02","2026-09-02",
    "2026-09-03","2026-09-03","2026-09-03","2026-09-03","2026-09-03",
    "2026-09-04","2026-09-04","2026-09-04","2026-09-04","2026-09-04","2026-09-04",
    "2026-09-05","2026-09-05","2026-09-05","2026-09-05","2026-09-05",
    "2026-09-06","2026-09-06","2026-09-06","2026-09-06",
    "2026-09-07","2026-09-07","2026-09-07",
    "2026-09-08","2026-09-08",
    "2026-09-09","2026-09-10","2026-09-11"
  ].join("\n");

  calculate();
}

function resetAll(){
  ["population","cases","deaths","susceptibleContacts","secondaryCases","a","b","c","d","onsetDates"].forEach(id => $(id).value = "");
  ["attackRate","secondaryAttackRate","cfr","arExposed","arUnexposed","rr","pValue"].forEach(id => $(id).textContent = "—");
  $("attackDetail").textContent = "—";
  $("secondaryDetail").textContent = "—";
  $("cfrDetail").textContent = "—";
  $("arExposedDetail").textContent = "—";
  $("arUnexposedDetail").textContent = "—";
  $("rrCI").textContent = "95% CI: —";
  $("interpretation").innerHTML = 'Enter the data or click <b>LOAD DEMO</b>, then click <b>CALCULATE OUTBREAK</b>.';
  drawCurve();
  window.scrollTo({top:0,behavior:"smooth"});
}

document.addEventListener("DOMContentLoaded", () => {
  $("calculateBtn").addEventListener("click", calculate);
  $("demoBtn").addEventListener("click", loadDemo);
  $("resetBtn").addEventListener("click", resetAll);
  drawCurve();
});
