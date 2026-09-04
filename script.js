"use strict";
const $=id=>document.getElementById(id);
let exposures=[], lineRows=[];

function val(id){const x=$(id).value.trim(); if(x==="")return null; const n=Number(x); return Number.isFinite(n)?n:null}
function pct(n,d){return n!==null&&d!==null&&d>0?n/d:null}
function fp(x){return x===null?"—":(100*x).toFixed(1)+"%"}
function erf(x){const s=x<0?-1:1;x=Math.abs(x);const a1=.254829592,a2=-.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=.3275911,t=1/(1+p*x);return s*(1-(((((a5*t+a4)*t+a3)*t+a2)*t+a1)*t*Math.exp(-x*x)))}
function cdf(z){return .5*(1+erf(z/Math.sqrt(2)))}
function rrStats(a,b,c,d){
 if([a,b,c,d].some(x=>x===null)||a+b<=0||c+d<=0)return null;
 let A=a,B=b,C=c,D=d,corrected=false;if([A,B,C,D].some(x=>x===0)){A+=.5;B+=.5;C+=.5;D+=.5;corrected=true}
 const re=A/(A+B),ru=C/(C+D),rr=re/ru,se=Math.sqrt(1/A-1/(A+B)+1/C-1/(C+D));
 const lo=Math.exp(Math.log(rr)-1.96*se),hi=Math.exp(Math.log(rr)+1.96*se);
 const n=A+B+C+D,r1=A+B,r2=C+D,c1=A+C,c2=B+D,chi=n*Math.pow(A*D-B*C,2)/(r1*r2*c1*c2);
 const p=Math.max(0,Math.min(1,2*(1-cdf(Math.sqrt(chi)))));
 return {rr,lo,hi,p,re:a/(a+b),ru:c/(c+d),corrected};
}
function ptxt(p){return p<.001?"<0.001":p.toFixed(3)}
function overview(){
 const pop=val("population"),cases=val("cases"),deaths=val("deaths"),h=val("hospitalised"),contacts=val("contacts"),secondary=val("secondary");
 const ar=pct(cases,pop),cfr=pct(deaths,cases),sar=pct(secondary,contacts),hp=pct(h,cases);
 $("kCases").textContent=cases??"—";$("kAR").textContent=fp(ar);$("kCFR").textContent=fp(cfr);$("kSAR").textContent=fp(sar);$("kHosp").textContent=fp(hp);
 const warnings=[];
 if(pop!==null&&cases!==null&&cases>pop)warnings.push("Total cases exceed the population at risk.");
 if(cases!==null&&deaths!==null&&deaths>cases)warnings.push("Deaths exceed total cases.");
 if(cases!==null&&h!==null&&h>cases)warnings.push("Hospitalised cases exceed total cases.");
 if(contacts!==null&&secondary!==null&&secondary>contacts)warnings.push("Secondary cases exceed susceptible contacts.");
 $("qc").innerHTML=warnings.length?warnings.map(x=>`<div class="warn">⚠ ${x}</div>`).join(""):`<div class="ok">✓ No basic denominator inconsistencies detected.</div>`;
 drawCurve();
}
function parseDates(){
 return $("dates").value.split(/\n|,/).map(x=>x.trim()).filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x)&&!isNaN(new Date(x+"T00:00:00")));
}
function drawCurve(){
 const dates=parseDates(),counts={};dates.forEach(x=>counts[x]=(counts[x]||0)+1);const data=Object.entries(counts).sort();
 const svg=$("epi");svg.innerHTML="";const NS="http://www.w3.org/2000/svg",add=(t,a={},txt="")=>{const e=document.createElementNS(NS,t);Object.entries(a).forEach(([k,v])=>e.setAttribute(k,v));e.textContent=txt;svg.appendChild(e)};
 const W=900,H=390,L=60,R=20,T=38,B=75;add("line",{x1:L,y1:H-B,x2:W-R,y2:H-B,stroke:"#8aa0ad","stroke-width":1.5});add("line",{x1:L,y1:T,x2:L,y2:H-B,stroke:"#8aa0ad","stroke-width":1.5});
 if(!data.length){add("text",{x:L+20,y:T+35,fill:"#7c8b95","font-size":14},"No onset dates available.");$("curveMeta").textContent="No onset data";$("peakDate").textContent="—";$("spanDays").textContent="—";return}
 const max=Math.max(...data.map(x=>x[1])),slot=(W-L-R)/data.length,bw=Math.max(9,slot*.72),ph=H-T-B;
 for(let i=0;i<=5;i++){const y=H-B-(i/5)*ph,v=Math.round(max*i/5);add("line",{x1:L,y1:y,x2:W-R,y2:y,stroke:"#e4ebef"});add("text",{x:L-10,y:y+4,"text-anchor":"end",fill:"#71818c","font-size":10},v)}
 data.forEach(([date,n],i)=>{const h=n/max*ph,x=L+i*slot+(slot-bw)/2,y=H-B-h;add("rect",{x,y,width:bw,height:h,rx:3,fill:"#159a9c"});add("text",{x:x+bw/2,y:y-6,"text-anchor":"middle","font-size":10,fill:"#43545f"},n);const tx=x+bw/2,ty=H-B+18;add("text",{x:tx,y:ty,transform:`rotate(-42 ${tx} ${ty})`,"text-anchor":"end","font-size":9,fill:"#657680"},date.slice(5))});
 const peak=data.reduce((a,b)=>b[1]>a[1]?b:a);$("peakDate").textContent=peak[0];const first=new Date(data[0][0]),last=new Date(data[data.length-1][0]);$("spanDays").textContent=Math.round((last-first)/86400000)+1+" days";$("curveMeta").textContent=`${dates.length} cases · peak ${peak[0]} (${peak[1]})`;
}
function renderExposures(){
 const body=$("expBody");if(!exposures.length){body.innerHTML='<tr><td colspan="7" class="empty">No exposures added.</td></tr>';$("topExposure").textContent="Add one or more candidate exposures to generate an analytical summary.";return}
 const ranked=[...exposures].sort((x,y)=>y.s.rr-x.s.rr);body.innerHTML=ranked.map((x,i)=>`<tr class="${i===0?"best":""}"><td><b>${escapeHTML(x.name)}</b></td><td>${fp(x.s.re)}</td><td>${fp(x.s.ru)}</td><td><b>${x.s.rr.toFixed(2)}</b></td><td>${x.s.lo.toFixed(2)}–${x.s.hi.toFixed(2)}</td><td>${ptxt(x.s.p)}</td><td><button onclick="removeExposure('${x.id}')">Remove</button></td></tr>`).join("");
 const x=ranked[0];$("topExposure").innerHTML=`<b>Highest observed risk ratio:</b> ${escapeHTML(x.name)} — RR ${x.s.rr.toFixed(2)} (95% CI ${x.s.lo.toFixed(2)}–${x.s.hi.toFixed(2)}, p ${ptxt(x.s.p)}). This ranking is descriptive and does not by itself establish the causal vehicle or source.`;
}
function escapeHTML(s){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
window.removeExposure=id=>{exposures=exposures.filter(x=>x.id!==id);renderExposures()}
function addExposure(){
 const name=$("expName").value.trim(),a=val("a"),b=val("b"),c=val("c"),d=val("d");if(!name||[a,b,c,d].some(x=>x===null)){alert("Enter the exposure name and all four 2 × 2 cell counts.");return}
 const s=rrStats(a,b,c,d);if(!s){alert("The 2 × 2 table cannot be analysed. Check denominators.");return}
 exposures.push({id:Date.now().toString(),name,a,b,c,d,s});["expName","a","b","c","d"].forEach(id=>$(id).value="");renderExposures()
}
function parseCSV(text){
 const lines=text.replace(/\r/g,"").split("\n").filter(x=>x.trim());if(!lines.length)return [];
 const parse=line=>{let out=[],cur="",q=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch=='"'){if(q&&line[i+1]=='"'){cur+='"';i++}else q=!q}else if(ch==","&&!q){out.push(cur);cur=""}else cur+=ch}out.push(cur);return out};
 const headers=parse(lines[0]).map(x=>x.trim());return lines.slice(1).map(l=>{const vals=parse(l),o={};headers.forEach((h,i)=>o[h]=vals[i]?.trim()??"");return o})
}
function detectColumn(headers,cands){return cands.find(c=>headers.includes(c))||null}
function analyzeLineList(rows){
 if(!rows.length)return;const headers=Object.keys(rows[0]),age=detectColumn(headers,["age","Age","AGE"]),sex=detectColumn(headers,["sex","Sex","gender","Gender"]),onset=detectColumn(headers,["date_onset","onset_date","dateOfOnset","DateOnset"]),locality=detectColumn(headers,["locality","location","Locality","Location"]);
 let bits=[`<b>${rows.length}</b> records loaded.`];
 if(age){const ages=rows.map(r=>Number(r[age])).filter(Number.isFinite).sort((a,b)=>a-b);if(ages.length){const m=ages.length%2?ages[(ages.length-1)/2]:(ages[ages.length/2-1]+ages[ages.length/2])/2;$("medianAge").textContent=m.toFixed(1)+" y";bits.push(`Median age ${m.toFixed(1)} years.`)}}
 if(sex){const valid=rows.map(r=>r[sex].toLowerCase()).filter(Boolean),m=valid.filter(x=>["m","male","lelaki"].includes(x)).length;if(valid.length){$("malePct").textContent=(100*m/valid.length).toFixed(1)+"%";bits.push(`Male ${(100*m/valid.length).toFixed(1)}%.`)}}
 if(onset){const ds=rows.map(r=>r[onset]).filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x));if(ds.length){$("dates").value=ds.join("\n");drawCurve();bits.push(`${ds.length} valid onset dates detected.`)}}
 if(locality){const cc={};rows.forEach(r=>{if(r[locality])cc[r[locality]]=(cc[r[locality]]||0)+1});const top=Object.entries(cc).sort((a,b)=>b[1]-a[1])[0];if(top)bits.push(`Most frequent locality: ${escapeHTML(top[0])} (${top[1]} records).`)}
 $("lineSummary").innerHTML=bits.join(" ");
}
function report(){
 overview();const name=$("outbreakName").value.trim()||"The outbreak",loc=$("location").value.trim(),disease=$("disease").value.trim(),cases=val("cases"),pop=val("population"),deaths=val("deaths"),h=val("hospitalised"),ar=pct(cases,pop),cfr=pct(deaths,cases),hp=pct(h,cases),dates=parseDates();
 let s=`${name}${loc?` in ${loc}`:""}${disease?` (${disease})`:""} was assessed using the available investigation data. `;
 if(cases!==null)s+=`${cases} case${cases===1?" was":"s were"} identified`;if(pop!==null&&ar!==null)s+=` among a population at risk of ${pop}, giving an overall attack rate of ${(ar*100).toFixed(1)}%`;s+=". ";
 if(hp!==null)s+=`${h} cases (${(hp*100).toFixed(1)}%) were hospitalised. `;if(cfr!==null)s+=`${deaths} death${deaths===1?" was":"s were"} reported, corresponding to a case fatality rate of ${(cfr*100).toFixed(1)}%. `;
 if(dates.length){s+=`Symptom onset dates were available for ${dates.length} cases; the observed peak onset date was ${$("peakDate").textContent}. `}
 if(exposures.length){const x=[...exposures].sort((a,b)=>b.s.rr-a.s.rr)[0];s+=`Among the candidate exposures entered, ${x.name} had the highest observed risk ratio (RR ${x.s.rr.toFixed(2)}, 95% CI ${x.s.lo.toFixed(2)}–${x.s.hi.toFixed(2)}, p ${ptxt(x.s.p)}). This association should be interpreted alongside the outbreak hypothesis, incubation period, potential confounding, laboratory findings and environmental evidence.`}
 $("reportText").textContent=s;
}
function demo(){
 $("outbreakName").value="Acute Gastroenteritis Outbreak";$("disease").value="Acute gastroenteritis";$("location").value="Demo Institution";$("population").value=250;$("cases").value=35;$("hospitalised").value=4;$("deaths").value=1;$("contacts").value=75;$("secondary").value=12;
 $("dates").value=["2026-09-01","2026-09-01","2026-09-01","2026-09-02","2026-09-02","2026-09-02","2026-09-02","2026-09-03","2026-09-03","2026-09-03","2026-09-03","2026-09-03","2026-09-04","2026-09-04","2026-09-04","2026-09-04","2026-09-04","2026-09-04","2026-09-05","2026-09-05","2026-09-05","2026-09-05","2026-09-05","2026-09-06","2026-09-06","2026-09-06","2026-09-06","2026-09-07","2026-09-07","2026-09-07","2026-09-08","2026-09-08","2026-09-09","2026-09-10","2026-09-11"].join("\n");
 exposures=[{id:"demo1",name:"Chicken curry",a:20,b:30,c:5,d:45,s:rrStats(20,30,5,45)},{id:"demo2",name:"Syrup drink",a:15,b:35,c:10,d:40,s:rrStats(15,35,10,40)}];overview();renderExposures();report()
}
function reset(){document.querySelectorAll("input:not([type=file]),textarea").forEach(x=>x.value="");exposures=[];lineRows=[];["kCases","kAR","kCFR","kSAR","kHosp","medianAge","malePct","peakDate","spanDays"].forEach(id=>$(id).textContent="—");$("qc").innerHTML="";$("lineSummary").textContent="No line list loaded. Manual onset dates can still be entered below.";$("reportText").textContent="Complete the outbreak profile and analyses, then generate the summary.";renderExposures();drawCurve()}
document.addEventListener("DOMContentLoaded",()=>{
 $("calcOverview").onclick=overview;$("drawCurve").onclick=drawCurve;$("addExposure").onclick=addExposure;$("demo").onclick=demo;$("reset").onclick=reset;$("generateReport").onclick=report;$("printReport").onclick=()=>window.print();$("copyReport").onclick=async()=>{await navigator.clipboard.writeText($("reportText").textContent);$("copyReport").textContent="Copied";setTimeout(()=>$("copyReport").textContent="Copy summary",1200)};
 $("csvFile").addEventListener("change",e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{lineRows=parseCSV(r.result);analyzeLineList(lineRows)};r.readAsText(f)});
 drawCurve();renderExposures();
});