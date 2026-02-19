/* RU: Утилиты */
function $(sel, root=document){ return root.querySelector(sel); }
function $all(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

function toNum(v){
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}
function roundSmart(x){
  if(!Number.isFinite(x)) return "—";
  const ax = Math.abs(x);
  if(ax === 0) return "0";
  if(ax >= 1e9) return x.toExponential(3);
  if(ax >= 1e6) return x.toExponential(3);
  if(ax >= 1000) return x.toFixed(2);
  if(ax >= 1) return x.toFixed(3);
  if(ax >= 0.01) return x.toFixed(5);
  return x.toExponential(3);
}

/* RU: Простая линейная регрессия y = a*x + b */
function linearFit(xs, ys){
  const n = xs.length;
  if(n < 2) return {a:NaN,b:NaN};
  let sx=0, sy=0, sxx=0, sxy=0;
  for(let i=0;i<n;i++){
    const x=xs[i], y=ys[i];
    sx += x; sy += y;
    sxx += x*x; sxy += x*y;
  }
  const den = (n*sxx - sx*sx);
  if(den === 0) return {a:NaN,b:NaN};
  const a = (n*sxy - sx*sy)/den;
  const b = (sy - a*sx)/n;
  return {a,b};
}

/* RU: Отрисовка графика на canvas (точки + линия) */
function drawChart(canvas, xs, ys, xLabel, yLabel){
  if(!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0,0,w,h);

  // background
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(0,0,w,h);

  const padL=70, padR=20, padT=20, padB=60;

  const finite = xs.map((x,i)=>({x, y: ys[i]})).filter(p=>Number.isFinite(p.x) && Number.isFinite(p.y));
  if(finite.length < 1){
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.font = "16px system-ui";
    ctx.fillText("Мән енгізсең — график шығады 🙂", padL, h/2);
    return;
  }

  let xmin = Math.min(...finite.map(p=>p.x));
  let xmax = Math.max(...finite.map(p=>p.x));
  let ymin = Math.min(...finite.map(p=>p.y));
  let ymax = Math.max(...finite.map(p=>p.y));

  // avoid zero ranges
  if(xmin === xmax){ xmin -= 1; xmax += 1; }
  if(ymin === ymax){ ymin -= 1; ymax += 1; }

  // margins
  const mx = (xmax-xmin)*0.1;
  const my = (ymax-ymin)*0.1;
  xmin -= mx; xmax += mx; ymin -= my; ymax += my;

  function X(x){ return padL + (x-xmin)/(xmax-xmin)*(w-padL-padR); }
  function Y(y){ return h-padB - (y-ymin)/(ymax-ymin)*(h-padT-padB); }

  // axes
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padL,padT);
  ctx.lineTo(padL,h-padB);
  ctx.lineTo(w-padR,h-padB);
  ctx.stroke();

  // ticks
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = "12px system-ui";
  const ticks = 5;
  for(let i=0;i<=ticks;i++){
    const tx = xmin + (xmax-xmin)*i/ticks;
    const px = X(tx);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.moveTo(px,padT);
    ctx.lineTo(px,h-padB);
    ctx.stroke();
    ctx.fillText(roundSmart(tx), px-16, h-padB+18);
  }
  for(let i=0;i<=ticks;i++){
    const ty = ymin + (ymax-ymin)*i/ticks;
    const py = Y(ty);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.moveTo(padL,py);
    ctx.lineTo(w-padR,py);
    ctx.stroke();
    ctx.fillText(roundSmart(ty), 10, py+4);
  }

  // points
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  for(const p of finite){
    ctx.beginPath();
    ctx.arc(X(p.x), Y(p.y), 4, 0, Math.PI*2);
    ctx.fill();
  }

  // fit line
  const fit = linearFit(finite.map(p=>p.x), finite.map(p=>p.y));
  if(Number.isFinite(fit.a) && Number.isFinite(fit.b)){
    ctx.strokeStyle = "rgba(6,182,212,0.85)";
    ctx.lineWidth = 2;
    const x1 = xmin, y1 = fit.a*x1 + fit.b;
    const x2 = xmax, y2 = fit.a*x2 + fit.b;
    ctx.beginPath();
    ctx.moveTo(X(x1), Y(y1));
    ctx.lineTo(X(x2), Y(y2));
    ctx.stroke();
  }

  // labels
  ctx.fillStyle = "rgba(255,255,255,0.80)";
  ctx.font = "14px system-ui";
  ctx.fillText(`${yLabel}`, 10, 18);
  ctx.fillText(`${xLabel}`, w/2-20, h-18);
}

/* RU: Скачивание JSON */
function downloadJSON(obj, filename){
  const blob = new Blob([JSON.stringify(obj,null,2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 500);
}

/* RU: Scroll buttons */
document.addEventListener("click",(e)=>{
  const btn = e.target.closest("[data-scroll]");
  if(!btn) return;
  const sel = btn.getAttribute("data-scroll");
  const el = document.querySelector(sel);
  if(el) el.scrollIntoView({behavior:"smooth", block:"start"});
});

/* =========================
   LAB 1: Hooke
========================= */
function initLab1(){
  const table = $("#hookeTable");
  if(!table) return;

  function compute(){
    const rows = $all("tbody tr", table);
    const xs=[], ys=[];
    let ks=[];
    rows.forEach(r=>{
      const F = toNum($(".F", r)?.value);
      const x = toNum($(".x", r)?.value);
      const kcell = $(".kcell", r);

      if(Number.isFinite(F) && Number.isFinite(x) && x !== 0){
        const k = F/x;
        kcell.textContent = roundSmart(k);
        ks.push(k);
        xs.push(x);
        ys.push(F);
      }else{
        kcell.textContent = "—";
      }
    });

    const kAvg = ks.length ? ks.reduce((a,b)=>a+b,0)/ks.length : NaN;
    $("#kAvg").textContent = roundSmart(kAvg);

    const fit = linearFit(xs, ys); // F = a*x + b; a ~ k
    $("#kSlope").textContent = roundSmart(fit.a);

    drawChart($("#hookeChart"), xs, ys, "x (м)", "F (Н)");
  }

  table.addEventListener("input", compute);
  compute();

  $("#exportLab1")?.addEventListener("click", ()=>{
    const name = $("#studentName1")?.value?.trim() || "Оқушы";
    const cls  = $("#studentClass1")?.value?.trim() || "";
    const rows = $all("tbody tr", table).map((r,i)=>{
      const F = toNum($(".F", r)?.value);
      const x = toNum($(".x", r)?.value);
      const k = (Number.isFinite(F) && Number.isFinite(x) && x!==0) ? F/x : null;
      return {n:i+1, F, x, k};
    });

    const answers = {};
    $all(".ans").forEach(t=>{
      answers[t.dataset.q] = t.value.trim();
    });

    const obj = {
      lab: "Лаб №1 — Гук заңы",
      student: { name, class: cls },
      table: rows,
      summary: {
        k_avg: $("#kAvg").textContent,
        k_slope: $("#kSlope").textContent
      },
      answers,
      created_at: new Date().toISOString()
    };

    downloadJSON(obj, `Lab1_Hooke_${name.replaceAll(" ","_")}.json`);
  });
}

/* =========================
   LAB 2: Young
========================= */
function initLab2(){
  const table = $("#youngTable");
  if(!table) return;

  function compute(){
    const rows = $all("tbody tr", table);

    const epsArr=[], sigArr=[], EArr=[];
    rows.forEach(r=>{
      const F  = toNum($(".F2", r)?.value);
      const S  = toNum($(".S2", r)?.value);
      const L0 = toNum($(".L02", r)?.value);
      const dL = toNum($(".dL2", r)?.value);

      const sigCell = $(".sig", r);
      const epsCell = $(".eps", r);
      const ECell   = $(".E", r);

      let sigma = NaN, eps = NaN, E = NaN;

      if(Number.isFinite(F) && Number.isFinite(S) && S !== 0) sigma = F/S;
      if(Number.isFinite(dL) && Number.isFinite(L0) && L0 !== 0) eps = dL/L0;
      if(Number.isFinite(sigma) && Number.isFinite(eps) && eps !== 0) E = sigma/eps;

      sigCell.textContent = roundSmart(sigma);
      epsCell.textContent = roundSmart(eps);
      ECell.textContent   = roundSmart(E);

      if(Number.isFinite(sigma) && Number.isFinite(eps)){
        sigArr.push(sigma);
        epsArr.push(eps);
      }
      if(Number.isFinite(E)) EArr.push(E);
    });

    const EAvg = EArr.length ? EArr.reduce((a,b)=>a+b,0)/EArr.length : NaN;
    $("#EAvg").textContent = roundSmart(EAvg);

    // sigma = a*eps + b ; a ~ E
    const fit = linearFit(epsArr, sigArr);
    $("#ESlope").textContent = roundSmart(fit.a);

    drawChart($("#youngChart"), epsArr, sigArr, "ε", "σ (Па)");
  }

  table.addEventListener("input", compute);
  compute();

  $("#exportLab2")?.addEventListener("click", ()=>{
    const name = $("#studentName2")?.value?.trim() || "Оқушы";
    const cls  = $("#studentClass2")?.value?.trim() || "";
    const rows = $all("tbody tr", table).map((r,i)=>{
      const F  = toNum($(".F2", r)?.value);
      const S  = toNum($(".S2", r)?.value);
      const L0 = toNum($(".L02", r)?.value);
      const dL = toNum($(".dL2", r)?.value);

      const sigma = (Number.isFinite(F)&&Number.isFinite(S)&&S!==0) ? F/S : null;
      const eps   = (Number.isFinite(dL)&&Number.isFinite(L0)&&L0!==0) ? dL/L0 : null;
      const E     = (sigma!=null && eps!=null && eps!==0) ? sigma/eps : null;

      return {n:i+1, F, S, L0, dL, sigma, eps, E};
    });

    const answers = {};
    $all(".ans2").forEach(t=>{
      answers[t.dataset.q] = t.value.trim();
    });

    const obj = {
      lab: "Лаб №2 — Юнг модулі",
      student: { name, class: cls },
      table: rows,
      summary: {
        E_avg: $("#EAvg").textContent,
        E_slope: $("#ESlope").textContent
      },
      answers,
      created_at: new Date().toISOString()
    };

    downloadJSON(obj, `Lab2_Young_${name.replaceAll(" ","_")}.json`);
  });
}

/* =========================
   Teacher viewer
========================= */
function initTeacher(){
  const input = $("#teacherFile");
  const view = $("#teacherView");
  if(!input || !view) return;

  input.addEventListener("change", async ()=>{
    const file = input.files?.[0];
    if(!file) return;
    const text = await file.text();
    let obj=null;
    try{ obj = JSON.parse(text); }catch(e){ obj=null; }

    if(!obj){
      view.innerHTML = `<p class="muted">Файл JSON емес сияқты 😢</p>`;
      return;
    }

    const student = obj.student?.name || "—";
    const cls = obj.student?.class || "—";
    const lab = obj.lab || "—";
    const created = obj.created_at ? new Date(obj.created_at).toLocaleString() : "—";

    const summary = obj.summary || {};
    const ans = obj.answers || {};
    const table = obj.table || [];

    view.innerHTML = `
      <h3>${lab}</h3>
      <p><b>Оқушы:</b> ${student} • <b>Сынып:</b> ${cls}</p>
      <p class="muted"><b>Уақыты:</b> ${created}</p>

      <div class="note">
        <b>Қысқаша нәтиже:</b>
        <div style="margin-top:6px;">
          ${Object.entries(summary).map(([k,v])=>`<div><b>${k}:</b> ${v}</div>`).join("") || "—"}
        </div>
      </div>

      <h4>Кесте (алынған мәндер)</h4>
      <div class="table-wrap">
        <table class="tbl">
          <thead><tr>${Object.keys(table[0]||{a:""}).map(h=>`<th>${h}</th>`).join("")}</tr></thead>
          <tbody>
            ${table.map(row=>`<tr>${Object.values(row).map(v=>`<td>${(v===null||v===undefined)?"—":String(v)}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
      </div>

      <h4>Бақылау сұрақтары</h4>
      ${Object.entries(ans).map(([k,v])=>`<div class="note"><b>${k}:</b><br>${(v||"—").replaceAll("\n","<br>")}</div>`).join("") || "<p class='muted'>—</p>"}
    `;
  });
}

/* init */
document.addEventListener("DOMContentLoaded", ()=>{
  initLab1();
  initLab2();
  initTeacher();
});
