/* Supplemental chapter primitives. The approved reader and typography are unchanged. */
(() => {
'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const S=(title,body,refs=[],demo=null)=>({title,body:body.trim(),refs:refs.map(([file,start,end])=>({file,start,end})),demo});
function chapter(id,spec){const c=window.ORB_BOOK.chapters.find(c=>c.id===id);if(!c)throw Error('Unknown chapter '+id);Object.assign(c,spec,{revision:'principles-2026-09-27'});}
const eq=(formula,explanation='')=>`<span class="d-equation"><span>${esc(formula).replace(/\n/g,'<br>')}</span>${explanation?`<small>${explanation}</small>`:''}</span>`;
const table=(heads,rows)=>`<span class="d-table-wrap" tabindex="0" role="region" aria-label="可横向滚动的对照表"><span class="d-table" role="table">${[heads,...rows].map((r,i)=>`<span class="d-row${i===0?' d-head':''}" role="row" style="grid-template-columns:repeat(${heads.length},minmax(0,1fr))">${r.map(t=>`<span role="${i===0?'columnheader':'cell'}">${t}</span>`).join('')}</span>`).join('')}</span></span>`;
const note=(title,text)=>`<span class="d-note"><strong>${title}</strong><span>${text}</span></span>`;
const figure=(title,content,caption)=>`<span class="d-figure" role="figure" aria-label="${esc(title)}"><strong class="d-caption-top">${title}</strong>${content}<small class="d-caption">${caption}</small></span>`;
function flow(title,lanes,caption){
 const H=lanes.length*132+20,W=850;
 const svg=lanes.map((lane,row)=>{
  const y=row*132+18;const n=lane.steps.length;const width=(718-(n-1)*20)/n;
  return `<text x="8" y="${y+25}" font-size="13" font-weight="600">${esc(lane.name)}</text>`+lane.steps.map((s,i)=>{
   const [label,detail,url]=typeof s==='string'?[s,'','']:s;const x=124+i*(width+20);
   const shape=`<rect x="${x}" y="${y}" width="${width}" height="78" rx="7" fill="${lane.kind==='output'?'#e8f2e9':'#fff'}" stroke="#a8bdac"/><text x="${x+12}" y="${y+29}" font-size="14" font-weight="600">${esc(label)}</text><text x="${x+12}" y="${y+54}" font-size="11">${esc(detail)}</text>`;
   return (url?`<a href="${esc(url)}"><title>${esc(label)}：进入对应章节</title>${shape}</a>`:shape)+(i<n-1&&lane.parallel!==true?`<path d="M${x+width+3} ${y+38}h14l-4 -4m4 4l-4 4" stroke="#60806a" fill="none"/>`:'');
  }).join('')+`<text x="124" y="${y+104}" font-size="11" fill="#627269">${esc(lane.after||'')}</text>`;
 }).join('');
 return figure(title,`<span class="d-diagram-scroll" tabindex="0" aria-label="流程图，窄屏可横向滚动"><svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(title)}">${svg}</svg></span>`,caption);
}
const chain=(title,steps,caption)=>flow(title,[{name:'处理顺序',steps}],caption);
const lab=(kind,title,controls,caption)=>figure(title,`<span class="d-lab" data-deep-lab="${kind}"><span class="d-controls">${controls.map(([name,label,min,max,step,value])=>`<label>${label}<input type="range" name="${name}" min="${min}" max="${max}" step="${step}" value="${value}"><output data-value="${name}">${value}</output></label>`).join('')}</span><span class="d-lab-result" role="status" aria-live="polite"></span></span>`,caption);
function evaluate(kind,v){
 if(kind==='projection'){return {u:v.f*v.x/v.z+v.c,normalized:v.x/v.z};}
 if(kind==='depth'){return {d:v.f*v.b/v.z,z:v.z,condition:v.b===0?'退化：基线为零':'平行相机教学模型'};}
 if(kind==='pnp'){const u=320*(1-v.c)/4+320;return {u,residual:360-u,cost:(360-u)**2};}
 if(kind==='integration'){const a=v.a-v.bias;return {dv:a*v.t,dp:.5*a*v.t*v.t};}
 if(kind==='robust'){const chi=v.r*v.r/v.variance,delta=Math.sqrt(5.991);return {chi,rho:chi<=5.991?chi:2*delta*Math.sqrt(chi)-5.991};}
 throw Error('Unknown lab '+kind);
}
function mount(){document.querySelectorAll('[data-deep-lab]').forEach(root=>{
 const calc=()=>{const values={};root.querySelectorAll('input').forEach(input=>{values[input.name]=Number(input.value);root.querySelector(`[data-value="${input.name}"]`).textContent=input.value;});const r=evaluate(root.dataset.deepLab,values);root.querySelector('.d-lab-result').textContent=Object.entries(r).map(([k,v])=>`${k} = ${typeof v==='number'?v.toFixed(4):v}`).join('；');};
 root.querySelectorAll('input').forEach(input=>input.addEventListener('input',calc));calc();
});}
window.ORB_DEEP={S,chapter,eq,table,note,figure,flow,chain,lab,evaluate,mount};
})();
