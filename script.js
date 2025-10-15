const board = document.getElementById('board');
const sizeRange = document.getElementById('sizeRange');
const speedRange = document.getElementById('speedRange');
const newArrayBtn = document.getElementById('newArray');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const algoSelect = document.getElementById('algoSelect');
const valuesEl = document.getElementById('values');
const stateLabel = document.getElementById('stateLabel');
const pseudocodeEl = document.getElementById('pseudocode');

let array = [];
let bars = [];
let steps = [];
let playing = false;
let paused = false;
let currentStep = 0;

function rand(min, max){ return Math.floor(Math.random()*(max-min+1))+min }
function setState(s){ stateLabel.textContent = s }

function generateArray(n){ array = Array.from({length:n}, ()=>rand(6, 400)); renderArray(); }
function renderArray(){
  board.innerHTML=''; bars=[];
  const max = Math.max(...array);
  for(let i=0;i<array.length;i++){
    const bar = document.createElement('div');
    bar.className='bar';
    bar.style.height = (array[i]/max)*100 + '%';
    board.appendChild(bar);
    bars.push(bar);
  }
  valuesEl.textContent = array.join(', ');
}

function color(index, state){
  const el = bars[index];
  if(!el) return;
  const colors = {
    compare: 'linear-gradient(180deg,#f59e0b,#b45309)',
    swap: 'linear-gradient(180deg,#ef4444,#7f1d1d)',
    sorted: 'linear-gradient(180deg,#10b981,#064e3b)'
  };
  el.style.background = colors[state] || 'linear-gradient(180deg,var(--accent),#036b78)';
}
function renderHeights(){ const max=Math.max(...array); bars.forEach((b,i)=>b.style.height=(array[i]/max)*100+'%'); valuesEl.textContent=array.join(', '); }
function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }
function pushStep(type,a,b,val){ steps.push({type,a,b,val}); }

async function animate(){
  playing=true; paused=false; startBtn.textContent='Running...'; setState('running');
  for(currentStep=0; currentStep<steps.length; currentStep++){
    if(!playing) break;
    while(paused){ setState('paused'); await sleep(50); }
    const s = steps[currentStep];
    if(s.type==='compare'){
      color(s.a,'compare'); color(s.b,'compare'); await sleep(speedRange.value); color(s.a); color(s.b);
    } else if(s.type==='swap'){
      color(s.a,'swap'); color(s.b,'swap'); await sleep(speedRange.value);
      [array[s.a], array[s.b]] = [array[s.b], array[s.a]]; renderHeights(); await sleep(speedRange.value/2);
      color(s.a); color(s.b);
    } else if(s.type==='overwrite'){
      color(s.a,'swap'); await sleep(speedRange.value); array[s.a]=s.val; renderHeights(); color(s.a);
    } else if(s.type==='markSorted'){
      color(s.a,'sorted');
    }
  }
  if(playing){ for(let i=0;i<array.length;i++) color(i,'sorted'); setState('finished'); startBtn.textContent='Start'; playing=false; }
}

function bubbleSortSteps(a){ a=a.slice(); for(let i=0;i<a.length;i++){ for(let j=0;j<a.length-1-i;j++){ pushStep('compare',j,j+1); if(a[j]>a[j+1]){ pushStep('swap',j,j+1); [a[j],a[j+1]]=[a[j+1],a[j]]; } } pushStep('markSorted',a.length-1-i);} }
function insertionSortSteps(a){ a=a.slice(); for(let i=1;i<a.length;i++){ let key=a[i],j=i-1; pushStep('compare',i,j); while(j>=0&&a[j]>key){ pushStep('overwrite',j+1,null,a[j]); a[j+1]=a[j]; j--; if(j>=0) pushStep('compare',j+1,j); } pushStep('overwrite',j+1,null,key); a[j+1]=key; } for(let k=0;k<a.length;k++) pushStep('markSorted',k); }
function selectionSortSteps(a){ a=a.slice(); for(let i=0;i<a.length;i++){ let min=i; for(let j=i+1;j<a.length;j++){ pushStep('compare',j,min); if(a[j]<a[min]) min=j; } if(min!==i){ pushStep('swap',i,min); [a[i],a[min]]=[a[min],a[i]]; } pushStep('markSorted',i); } }
function mergeSortSteps(a){ a=a.slice(); function merge(l,m,r){ let left=a.slice(l,m+1),right=a.slice(m+1,r+1); let i=0,j=0,k=l; while(i<left.length&&j<right.length){ pushStep('compare',l+i,m+1+j); if(left[i]<=right[j]){ pushStep('overwrite',k,null,left[i]); a[k++]=left[i++]; } else { pushStep('overwrite',k,null,right[j]); a[k++]=right[j++]; } } while(i<left.length){ pushStep('overwrite',k,null,left[i]); a[k++]=left[i++]; } while(j<right.length){ pushStep('overwrite',k,null,right[j]); a[k++]=right[j++]; } } function ms(l,r){ if(l>=r)return; const m=Math.floor((l+r)/2); ms(l,m); ms(m+1,r); merge(l,m,r);} ms(0,a.length-1); for(let i=0;i<a.length;i++) pushStep('markSorted',i); }
function quickSortSteps(a){ a=a.slice(); function part(l,r){ const pivot=a[r]; let i=l; for(let j=l;j<r;j++){ pushStep('compare',j,r); if(a[j]<pivot){ pushStep('swap',i,j); [a[i],a[j]]=[a[j],a[i]]; i++; } } pushStep('swap',i,r); [a[i],a[r]]=[a[r],a[i]]; return i; } function qs(l,r){ if(l<r){ const p=part(l,r); qs(l,p-1); qs(p+1,r); } } qs(0,a.length-1); for(let i=0;i<a.length;i++) pushStep('markSorted',i); }

function showPseudo(a){ const pseudos={ bubble:`for i in 0..n-1:\n  for j in 0..n-1-i:\n    compare j,j+1\n    if a[j]>a[j+1] swap`, insertion:`for i from 1..n-1:\n  key=a[i]\n  j=i-1\n  while j>=0 and a[j]>key:\n    a[j+1]=a[j]\n    j--\n  a[j+1]=key`, selection:`for i from 0..n-1:\n  min=i\n  for j from i+1..n-1:\n    if a[j]<a[min] min=j\n  swap a[i],a[min]`, merge:`mergeSort(a,l,r):\n  if l>=r return\n  m=(l+r)/2\n  mergeSort(a,l,m)\n  mergeSort(a,m+1,r)\n  merge two halves`, quick:`quickSort(a,l,r):\n  pick pivot\n  partition -> p\n  quickSort(l,p-1)\n  quickSort(p+1,r)` }; pseudocodeEl.textContent=pseudos[a]||''; }

function reset(){ playing=false; paused=false; steps=[]; currentStep=0; startBtn.textContent='Start'; setState('idle'); }

newArrayBtn.addEventListener('click',()=>{reset();generateArray(+sizeRange.value);});
startBtn.addEventListener('click',async()=>{ if(playing){playing=false;paused=false;startBtn.textContent='Start';setState('stopped');return;} steps=[]; currentStep=0; const algo=algoSelect.value; const copy=array.slice(); if(algo==='bubble') bubbleSortSteps(copy); else if(algo==='insertion') insertionSortSteps(copy); else if(algo==='selection') selectionSortSteps(copy); else if(algo==='merge') mergeSortSteps(copy); else if(algo==='quick') quickSortSteps(copy); showPseudo(algo); await animate(); });
pauseBtn.addEventListener('click',()=>{ if(!playing)return; paused=!paused; pauseBtn.textContent=paused?'Resume':'Pause'; });
resetBtn.addEventListener('click',()=>{ reset(); generateArray(+sizeRange.value); });
algoSelect.addEventListener('change',()=>showPseudo(algoSelect.value));
sizeRange.addEventListener('input',()=>{ generateArray(+sizeRange.value); reset(); });

// initial
generateArray(+sizeRange.value); showPseudo(algoSelect.value);
