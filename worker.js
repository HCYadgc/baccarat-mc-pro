// worker.js
self.onmessage = function (e) {
  const { counts, trials } = e.data;

  // WebCrypto RNG
  function randInt(n) {
    const max = 0x100000000;
    const limit = max - (max % n);
    const buf = new Uint32Array(1);
    while (true) {
      crypto.getRandomValues(buf);
      const x = buf[0];
      if (x < limit) return x % n;
    }
  }

  const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
  const IDX = new Map(RANKS.map((r,i)=>[r,i]));

  function rankValue(r){
    if(r==="A") return 1;
    if(r==="10"||r==="J"||r==="Q"||r==="K") return 0;
    return Number(r);
  }

  function handTotal(cards){
    return cards.reduce((s,r)=>s+rankValue(r),0) % 10;
  }

  function play(draw){
    const p=[draw[0],draw[1]];
    const b=[draw[2],draw[3]];
    let pt=handTotal(p), bt=handTotal(b);
    if(pt>=8||bt>=8){
      if(pt>bt) return 0;
      if(bt>pt) return 1;
      return 2;
    }
    let i=4, p3=null;
    if(pt<=5){ p3=draw[i++]; p.push(p3); pt=handTotal(p); }
    if(p3===null){
      if(bt<=5){ b.push(draw[i++]); bt=handTotal(b); }
    }else{
      const v=rankValue(p3);
      if(bt<=2 ||
         (bt===3 && v!==8) ||
         (bt===4 && v>=2 && v<=7) ||
         (bt===5 && v>=4 && v<=7) ||
         (bt===6 && (v===6||v===7))){
        b.push(draw[i++]); bt=handTotal(b);
      }
    }
    if(pt>bt) return 0;
    if(bt>pt) return 1;
    return 2;
  }

  const deck=[];
  for(let i=0;i<counts.length;i++){
    for(let k=0;k<counts[i];k++) deck.push(RANKS[i]);
  }

  let pw=0,bw=0,tw=0;
  for(let t=0;t<trials;t++){
    const d=deck.slice();
    for(let i=0;i<6;i++){
      const j=i+randInt(d.length-i);
      [d[i],d[j]]=[d[j],d[i]];
    }
    const r=play(d);
    if(r===0) pw++; else if(r===1) bw++; else tw++;
  }

  self.postMessage({
    p: pw/trials,
    b: bw/trials,
    t: tw/trials
  });
};