const $=id=>document.getElementById(id);
const fmt=(n,d=1)=>n==null||!Number.isFinite(Number(n))?'—':Number(n).toLocaleString('en-IN',{maximumFractionDigits:d});
const pct=n=>n==null?'—':`${(Number(n)*100).toFixed(1)}%`;
const money=n=>n==null?'—':'₹'+Number(n).toLocaleString('en-IN',{maximumFractionDigits:0});
const esc=s=>String(s??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let summary={},metrics=[],predictions=[],importance=[],regional=[],products=[],page=1,pageSize=12,filtered=[];
async function loadJson(file){const r=await fetch('/web/data/'+file);if(!r.ok)throw Error(`Could not load ${file} (${r.status})`);return r.json()}
async function loadCsv(file){const r=await fetch('/web/data/'+file);if(!r.ok)throw Error(`Could not load ${file} (${r.status})`);return parseCsv(await r.text())}
function parseCsv(text){const lines=text.trim().split(/\r?\n/);if(!lines.length)return[];const parseLine=line=>{let a=[],v='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'&&q&&line[i+1]==='"'){v+='"';i++}else if(c==='"')q=!q;else if(c===','&&!q){a.push(v);v=''}else v+=c}a.push(v);return a};const h=parseLine(lines[0]);return lines.slice(1).filter(Boolean).map(line=>{const vals=parseLine(line),o={};h.forEach((k,i)=>o[k]=vals[i]??'');return o})}
function toast(s){const t=$('toast');t.textContent=s;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2400)}
function plot(id,data,layout={}){Plotly.newPlot(id,data,{margin:{l:45,r:15,t:12,b:55},paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',font:{family:'Inter,system-ui,sans-serif',size:11,color:'#728097'},xaxis:{gridcolor:'#edf0f5',zerolinecolor:'#edf0f5'},yaxis:{gridcolor:'#edf0f5',zerolinecolor:'#edf0f5'},...layout},{responsive:true,displayModeBar:false})}
async function init(){
 try{
  summary=await loadJson('dashboard_summary.json');
  metrics=await loadCsv('model_metrics.csv');
  predictions=await loadCsv('test_predictions.csv');
  importance=await loadCsv('feature_importance.csv');
  products=await loadCsv('product_summary.csv');
  try{regional=await loadCsv('regional_summary_from_applications.csv')}catch{regional=summary.regional_summary||[]}
  render();
 }catch(e){document.querySelector('.main').insertAdjacentHTML('afterbegin',`<div class="notice"><b>Could not load dashboard exports.</b><span>${esc(e.message)}. Ensure the project is running through FastAPI and that web/data contains the Colab export files.</span></div>`)}
}
function render(){
 const ds=summary.dataset||{},bestName=summary.best_model||'—',best=metrics.find(m=>m.model===bestName)||metrics[0]||{};
 $('applications').textContent=fmt(ds.rows,0);$('datasetName').textContent=ds.name||'Source dataset';
 $('approvalRate').textContent=ds.approval_rate_pct==null?'—':fmt(ds.approval_rate_pct,2)+'%';
 $('outcomeSplit').textContent=`${fmt(ds.approved_count,0)} approved · ${fmt(ds.rejected_count,0)} rejected`;
 $('bestModel').textContent=bestName;$('bestAccuracy').textContent=pct(best.accuracy);$('bestF1').textContent='F1 score '+pct(best.f1_approved);
 $('generatedAt').textContent=summary.generated_at_utc?'Run generated '+new Date(summary.generated_at_utc).toLocaleString():'Colab export';
 $('metricsTable').querySelector('tbody').innerHTML=metrics.map(m=>`<tr><td><b>${esc(m.model)}</b></td><td>${pct(m.accuracy)}</td><td>${pct(m.precision_approved)}</td><td>${pct(m.recall_approved)}</td><td>${pct(m.f1_approved)}</td><td>${pct(m.roc_auc)}</td></tr>`).join('');
 plot('metricChart',[
  {type:'bar',name:'Accuracy',x:metrics.map(m=>m.model),y:metrics.map(m=>+m.accuracy),marker:{color:'#4F46E5'}},
  {type:'bar',name:'Precision',x:metrics.map(m=>m.model),y:metrics.map(m=>+m.precision_approved),marker:{color:'#0D9488'}},
  {type:'bar',name:'Recall',x:metrics.map(m=>m.model),y:metrics.map(m=>+m.recall_approved),marker:{color:'#D97706'}},
  {type:'bar',name:'F1',x:metrics.map(m=>m.model),y:metrics.map(m=>+m.f1_approved),marker:{color:'#6366F1'}}
 ],{barmode:'group',yaxis:{range:[0,1],tickformat:'.0%',title:'Score'},legend:{orientation:'h',y:-.25},margin:{l:45,r:10,t:10,b:80}});
 const test=predictions;
 const actualA=test.filter(x=>x.actual_outcome==='Approved'),actualR=test.filter(x=>x.actual_outcome==='Rejected');
 const labels=['Actual Rejected','Actual Approved'],predLabs=['Predicted Rejected','Predicted Approved'];
 const cm=[[0,0],[0,0]];
 test.forEach(x=>{let a=x.actual_outcome==='Approved'?1:0,p=x.predicted_outcome==='Approved'?1:0;cm[a][p]++});
 plot('confusionChart',[{z:cm,x:predLabs,y:labels,type:'heatmap',colorscale:[[0,'#EEF2FF'],[1,'#4F46E5']],showscale:false,text:cm.map(r=>r.map(String)),texttemplate:'%{text}',hovertemplate:'%{y}<br>%{x}<br>Count: %{z}<extra></extra>'}],{yaxis:{autorange:'reversed'},margin:{l:120,r:10,t:10,b:60}});
 const probs=test.map(x=>Number(x.approval_probability)).filter(Number.isFinite);
 plot('probChart',[{x:probs,type:'histogram',nbinsx:20,marker:{color:'#4F46E5'},hovertemplate:'Probability range: %{x}<br>Records: %{y}<extra></extra>'}],{xaxis:{title:'Predicted approval probability',range:[0,1]},yaxis:{title:'Test records'}});
 plot('productChart',[{x:products.map(x=>x.loan_product),y:products.map(x=>Number(x.approval_rate_pct)),type:'bar',marker:{color:'#0D9488'},text:products.map(x=>fmt(x.approval_rate_pct,1)+'%'),textposition:'outside',cliponaxis:false}],{yaxis:{title:'Approval rate (%)',range:[0,Math.min(100,Math.max(70,...products.map(x=>+x.approval_rate_pct||0))+8)]},margin:{l:45,r:15,t:15,b:100}});
 plot('regionChart',[{x:regional.map(x=>x.region),y:regional.map(x=>Number(x.applications)),type:'bar',marker:{color:'#4F46E5'},text:regional.map(x=>fmt(x.applications,0)),textposition:'outside'}],{yaxis:{title:'Applications'},margin:{l:50,r:15,t:15,b:55}});
 $('regionTable').querySelector('tbody').innerHTML=regional.map(x=>`<tr><td><b>${esc(x.region)}</b></td><td>${fmt(x.applications,0)}</td><td>${fmt(x.approved,0)}</td><td>${fmt(x.rejected,0)}</td><td>${fmt(x.approval_rate_pct,2)}%</td><td>${money(x.requested_amount_inr)}</td></tr>`).join('');
 const top=importance.slice().sort((a,b)=>Number(b.importance)-Number(a.importance)).slice(0,20).reverse();
 plot('importanceChart',[{x:top.map(x=>Number(x.importance)),y:top.map(x=>String(x.feature).replace(/^(num__|cat__)/,'')),type:'bar',orientation:'h',marker:{color:'#4F46E5'},hovertemplate:'%{y}<br>Importance: %{x:.4f}<extra></extra>'}],{xaxis:{title:'Importance'},margin:{l:230,r:20,t:5,b:45}});
 $('predictionCount').textContent=`${fmt(test.length,0)} held-out test records`;
 filterPredictions();
}
function filterPredictions(){
 const q=$('search').value.toLowerCase().trim(),out=$('outcomeFilter').value,cor=$('correctFilter').value;
 filtered=predictions.filter(x=>(out==='all'||x.actual_outcome===out)&&(cor==='all'||(cor==='correct'?String(x.prediction_correct).toLowerCase()==='true':String(x.prediction_correct).toLowerCase()!=='true'))&&(!q||[x.loan_id,x.application_id,x.state,x.region,x.loan_product,x.predicted_outcome,x.actual_outcome].some(v=>String(v||'').toLowerCase().includes(q))));
 const pages=Math.max(1,Math.ceil(filtered.length/pageSize));page=Math.min(page,pages);
 $('predictionTable').querySelector('tbody').innerHTML=filtered.slice((page-1)*pageSize,page*pageSize).map(x=>`<tr><td>${esc(x.loan_id)}</td><td>${esc(x.region)}</td><td>${esc(x.state)}</td><td>${esc(x.loan_product)}</td><td><span class="pill ${x.actual_outcome==='Approved'?'approved':'rejected'}">${esc(x.actual_outcome)}</span></td><td><span class="pill ${x.predicted_outcome==='Approved'?'approved':'rejected'}">${esc(x.predicted_outcome)}</span></td><td>${pct(x.approval_probability)}</td><td><span class="pill ${String(x.prediction_correct).toLowerCase()==='true'?'good':'bad'}">${String(x.prediction_correct).toLowerCase()==='true'?'Correct':'Incorrect'}</span></td></tr>`).join('');
 $('pageLabel').textContent=`Page ${page} of ${pages} · ${fmt(filtered.length,0)} matches`;
 $('prevPage').disabled=page<=1;$('nextPage').disabled=page>=pages;
}
function downloadFiltered(){
 if(!filtered.length){toast('No rows to export');return}
 const keys=Object.keys(filtered[0]);const csv=[keys.join(','),...filtered.map(r=>keys.map(k=>{const s=String(r[k]??'');return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}).join(','))].join('\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})),a=document.createElement('a');a.href=url;a.download='filtered_loan_predictions.csv';a.click();URL.revokeObjectURL(url);toast('CSV export started');
}
$('refresh').addEventListener('click',()=>{init();toast('Refreshing dashboard exports')});
$('search').addEventListener('input',()=>{page=1;filterPredictions()});
$('outcomeFilter').addEventListener('change',()=>{page=1;filterPredictions()});
$('correctFilter').addEventListener('change',()=>{page=1;filterPredictions()});
$('prevPage').addEventListener('click',()=>{page=Math.max(1,page-1);filterPredictions()});
$('nextPage').addEventListener('click',()=>{page++;filterPredictions()});
$('downloadPredictions').addEventListener('click',downloadFiltered);
init();
