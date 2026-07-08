const net=require("net"),http=require("http"),crypto=require("crypto"),fs=require("fs"),path=require("path"),{spawn}=require("child_process");
const EDGE="C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const FILE_URL="file:///"+path.resolve(__dirname,"index.html").replace(/\\/g,"/");
const PORT=9466,userDir=path.join(process.env.TEMP||".","ptw-shot-"+Date.now());
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
class WS{constructor(u){this.url=u;this.id=0;this.pending=new Map();this.buf=Buffer.alloc(0);this.frag=[];this.onEvent=()=>{};}
 connect(){return new Promise((res,rej)=>{const u=new URL(this.url),key=crypto.randomBytes(16).toString("base64");const s=net.connect(u.port,u.hostname,()=>{s.write(`GET ${u.pathname}${u.search} HTTP/1.1\r\nHost: ${u.host}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`);});this.sock=s;let hs=false;s.on("data",d=>{if(!hs){const t=d.toString("latin1"),i=t.indexOf("\r\n\r\n");if(i>=0){hs=true;this.buf=d.slice(Buffer.byteLength(t.slice(0,i+4),"latin1"));this._p();res();}}else{this.buf=Buffer.concat([this.buf,d]);this._p();}});s.on("error",rej);});}
 _p(){while(this.buf.length>=2){const b0=this.buf[0],b1=this.buf[1],fin=b0&0x80,op=b0&0x0f;let len=b1&0x7f,off=2;if(len===126){if(this.buf.length<4)return;len=this.buf.readUInt16BE(2);off=4;}else if(len===127){if(this.buf.length<10)return;len=Number(this.buf.readBigUInt64BE(2));off=10;}if(this.buf.length<off+len)return;const pl=this.buf.slice(off,off+len);this.buf=this.buf.slice(off+len);if(op===0x8){this.sock.end();return;}this.frag.push(pl);if(fin){const f=Buffer.concat(this.frag).toString("utf8");this.frag=[];let m;try{m=JSON.parse(f);}catch{continue;}if(m.id&&this.pending.has(m.id)){this.pending.get(m.id)(m);this.pending.delete(m.id);}else if(m.method)this.onEvent(m);}}}
 send(method,params){const id=++this.id,data=JSON.stringify({id,method,params:params||{}}),pl=Buffer.from(data,"utf8"),mask=crypto.randomBytes(4);let h;if(pl.length<126)h=Buffer.from([0x81,0x80|pl.length]);else if(pl.length<65536){h=Buffer.alloc(4);h[0]=0x81;h[1]=0xFE;h.writeUInt16BE(pl.length,2);}else{h=Buffer.alloc(10);h[0]=0x81;h[1]=0xFF;h.writeBigUInt64BE(BigInt(pl.length),2);}const mk=Buffer.alloc(pl.length);for(let i=0;i<pl.length;i++)mk[i]=pl[i]^mask[i%4];this.sock.write(Buffer.concat([h,mask,mk]));return new Promise(r=>this.pending.set(id,r));}}
const getJSON=u=>new Promise((res,rej)=>{http.get(u,r=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>res(JSON.parse(d)));}).on("error",rej);});
(async()=>{
 const steps=JSON.parse(process.argv[2]||"[]"),outfile=process.argv[3]||"shot.png";
 const proc=spawn(EDGE,["--headless=new","--disable-gpu","--no-first-run","--no-default-browser-check",`--remote-debugging-port=${PORT}`,`--user-data-dir=${userDir}`,"--window-size=430,860","--hide-scrollbars","--force-device-scale-factor=2",FILE_URL]);
 let target;for(let i=0;i<40;i++){try{const l=await getJSON(`http://127.0.0.1:${PORT}/json`);target=l.find(t=>t.type==="page"&&t.webSocketDebuggerUrl);if(target)break;}catch{}await sleep(300);}
 const ws=new WS(target.webSocketDebuggerUrl);await ws.connect();await ws.send("Runtime.enable");await ws.send("Page.enable");
 await ws.send("Page.navigate",{url:FILE_URL});await sleep(700);await ws.send("Runtime.evaluate",{expression:"localStorage.clear()"});await ws.send("Page.reload");await sleep(800);
 for(const s of steps){await ws.send("Runtime.evaluate",{expression:s,awaitPromise:true});await sleep(320);}
 const r=await ws.send("Page.captureScreenshot",{format:"png"});
 fs.writeFileSync(path.resolve(__dirname,outfile),Buffer.from(r.result.data,"base64"));
 console.log("saved",outfile);proc.kill();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
