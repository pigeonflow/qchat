export function generateHTML(roomId: string, roomName: string, hasPassword: boolean, ttlMinutes: number, createdAt: number): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="manifest" href="/manifest.json">
<title>${esc(roomName)} — qchat</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#0b141a;
  --header:#1f2c34;
  --surface:#111b21;
  --input-bg:#1f2c34;
  --border:#2a3942;
  --text:#e9edef;
  --text2:#8696a0;
  --bubble-out:#005c4b;
  --bubble-in:#1f2c34;
  --accent:#00a884;
  --accent2:#53bdeb;
  --danger:#f15c6d;
  --tick:#53bdeb;
}
html,body{height:100%;overflow:hidden}
body{font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:var(--bg);color:var(--text);display:flex;flex-direction:column}

.chat-bg{position:fixed;inset:0;opacity:.04;background-image:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");z-index:0;pointer-events:none}

/* JOIN SCREEN */
.join-screen{display:flex;align-items:center;justify-content:center;height:100%;padding:20px;animation:fadeIn .3s;z-index:1;position:relative}
.join-card{background:var(--surface);border-radius:16px;padding:40px 28px;width:100%;max-width:360px;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,.4)}
.join-logo{width:64px;height:64px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:28px}
.join-card h1{font-size:22px;font-weight:600;color:var(--text);margin-bottom:2px}
.join-card .room-name{color:var(--text2);font-size:13px;margin-bottom:28px}
.join-card input{width:100%;padding:12px 16px;border-radius:8px;border:none;background:var(--input-bg);color:var(--text);font-size:16px;outline:none;margin-bottom:10px;transition:box-shadow .2s}
.join-card input:focus{box-shadow:0 0 0 2px var(--accent)}
.join-card input::placeholder{color:var(--text2)}
.join-btn{width:100%;padding:13px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-size:16px;font-weight:600;cursor:pointer;margin-top:6px;transition:opacity .2s,transform .05s}
.join-btn:active{transform:scale(.98);opacity:.9}
.join-btn:disabled{opacity:.4}
.join-error{color:var(--danger);font-size:13px;margin-top:10px;min-height:18px}

/* CHAT SCREEN */
.chat-screen{display:none;flex-direction:column;height:100%;z-index:1;position:relative}

.header{background:var(--header);padding:10px 16px;display:flex;align-items:center;gap:12px;flex-shrink:0;padding-top:max(10px,env(safe-area-inset-top));box-shadow:0 1px 3px rgba(0,0,0,.2)}
.header-avatar{width:40px;height:40px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.header-info{flex:1;min-width:0}
.header-info h2{font-size:16px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.header-info .meta{font-size:12px;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.header-actions{display:flex;align-items:center;gap:8px;flex-shrink:0}
.header-timer{font-size:11px;color:var(--text2);background:rgba(255,255,255,.08);padding:4px 10px;border-radius:12px;font-variant-numeric:tabular-nums}
.install-btn,.leave-btn{display:none;background:none;border:1px solid var(--accent);color:var(--accent);font-size:11px;padding:4px 10px;border-radius:12px;cursor:pointer;font-weight:500;transition:background .2s,color .2s}
.install-btn:hover{background:var(--accent);color:#fff}
.leave-btn{display:block;border-color:var(--danger);color:var(--danger)}
.leave-btn:hover{background:var(--danger);color:#fff}

/* MESSAGES */
.messages{flex:1;overflow-y:auto;padding:8px 12px;display:flex;flex-direction:column;gap:1px;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
.msg{max-width:80%;padding:6px 8px 4px;border-radius:8px;animation:msgIn .2s ease-out;word-wrap:break-word;line-height:1.35;position:relative;margin-bottom:1px}
.msg.no-anim{animation:none}
.msg-first{margin-top:6px}
.msg-mine{align-self:flex-end;background:var(--bubble-out);border-top-right-radius:0}
.msg-mine.msg-first::after{content:'';position:absolute;top:0;right:-8px;width:8px;height:13px;background:var(--bubble-out);clip-path:polygon(0 0,0 100%,100% 0)}
.msg-other{align-self:flex-start;background:var(--bubble-in);border-top-left-radius:0}
.msg-other.msg-first::after{content:'';position:absolute;top:0;left:-8px;width:8px;height:13px;background:var(--bubble-in);clip-path:polygon(100% 0,0 0,100% 100%)}
.msg-sender{font-size:12.5px;font-weight:500;margin-bottom:1px}
.msg-text{font-size:14.5px;white-space:pre-wrap}
.msg-footer{display:flex;align-items:center;justify-content:flex-end;gap:4px;margin-top:1px}
.msg-time{font-size:11px;color:rgba(255,255,255,.5)}
.msg-mine .msg-time{color:rgba(255,255,255,.6)}
.msg-tick{font-size:14px;color:var(--tick);line-height:1}
.msg-system{align-self:center;color:var(--text2);font-size:12px;padding:4px 12px;background:var(--header);border-radius:8px;margin:4px 0;box-shadow:0 1px 1px rgba(0,0,0,.15)}
.msg-system.no-anim{animation:none}

.typing-indicator{color:var(--text2);font-size:12px;padding:2px 16px;min-height:20px;flex-shrink:0}
.typing-dots{display:inline-flex;gap:3px;vertical-align:middle;margin-left:4px}
.typing-dots span{width:5px;height:5px;border-radius:50%;background:var(--text2);animation:typingBounce 1.4s infinite}
.typing-dots span:nth-child(2){animation-delay:.2s}
.typing-dots span:nth-child(3){animation-delay:.4s}

/* Reconnecting banner */
.reconnecting{display:none;background:#e6a817;color:#000;text-align:center;font-size:12px;padding:4px;font-weight:500;flex-shrink:0}

/* @mention highlight */
.mention{color:var(--accent);font-weight:500;cursor:default}
.mention-me{background:rgba(0,168,132,.2);padding:1px 3px;border-radius:3px}

/* Autocomplete dropdown */
.autocomplete{display:none;position:absolute;bottom:100%;left:12px;right:60px;background:var(--header);border:1px solid var(--border);border-radius:10px;overflow:hidden;max-height:180px;overflow-y:auto;box-shadow:0 -4px 16px rgba(0,0,0,.3);z-index:10;margin-bottom:4px}
.autocomplete-item{padding:10px 14px;cursor:pointer;font-size:14px;display:flex;align-items:center;gap:8px;transition:background .1s}
.autocomplete-item:hover,.autocomplete-item.selected{background:rgba(255,255,255,.08)}
.autocomplete-item .ac-avatar{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;flex-shrink:0}

.input-bar{display:flex;gap:6px;padding:6px 8px;background:var(--bg);flex-shrink:0;padding-bottom:max(6px,env(safe-area-inset-bottom));align-items:flex-end;position:relative}
.input-wrap{flex:1;background:var(--input-bg);border-radius:24px;display:flex;align-items:flex-end;padding:6px 12px;min-height:44px}
.input-wrap input{flex:1;border:none;background:transparent;color:var(--text);font-size:16px;outline:none;padding:4px 0;line-height:1.3}
.input-wrap input::placeholder{color:var(--text2)}
.send-btn{width:44px;height:44px;border-radius:50%;border:none;background:var(--accent);color:#fff;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .1s;flex-shrink:0}
.send-btn:active{transform:scale(.9)}
.send-btn:disabled{opacity:.3}
.send-btn svg{width:22px;height:22px;fill:#fff}

.closed-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:100;align-items:center;justify-content:center;flex-direction:column;gap:8px;color:var(--text);font-size:17px;font-weight:500}
.closed-overlay span{font-size:44px;margin-bottom:4px}
.closed-overlay .subtitle{font-size:13px;color:var(--text2)}

/* Confirm dialog */
.confirm-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:90;align-items:center;justify-content:center}
.confirm-box{background:var(--surface);border-radius:12px;padding:24px;max-width:280px;text-align:center}
.confirm-box p{margin-bottom:16px;font-size:15px}
.confirm-box .btns{display:flex;gap:8px}
.confirm-box button{flex:1;padding:10px;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer}
.confirm-cancel{background:var(--input-bg);color:var(--text)}
.confirm-leave{background:var(--danger);color:#fff}

.messages::-webkit-scrollbar{width:5px}
.messages::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:4px}

@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes msgIn{from{opacity:0;transform:translateY(4px) scale(.98)}to{opacity:1;transform:none}}
@keyframes typingBounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}
</style>
</head>
<body>
<div class="chat-bg"></div>

<div class="join-screen" id="joinScreen">
  <div class="join-card">
    <div class="join-logo">💬</div>
    <h1>${esc(roomName)}</h1>
    <div class="room-name">Disposable group chat</div>
    <input type="text" id="nameInput" placeholder="Your name" maxlength="24" autocomplete="off" autofocus>
    ${hasPassword ? '<input type="password" id="passInput" placeholder="Room password" autocomplete="off">' : ''}
    <button class="join-btn" id="joinBtn" onclick="doJoin()">Join</button>
    <div class="join-error" id="joinError"></div>
  </div>
</div>

<div class="chat-screen" id="chatScreen">
  <div class="header">
    <div class="header-avatar">💬</div>
    <div class="header-info">
      <h2>${esc(roomName)}</h2>
      <div class="meta" id="headerMeta"></div>
    </div>
    <div class="header-actions">
      <button class="install-btn" id="installBtn" onclick="doInstall()">📲 Add</button>
      <div class="header-timer" id="countdown"></div>
      <button class="leave-btn" id="leaveBtn" onclick="confirmLeave()">Leave</button>
    </div>
  </div>
  <div class="reconnecting" id="reconnecting">Reconnecting...</div>
  <div class="messages" id="messages"></div>
  <div class="typing-indicator" id="typingIndicator"></div>
  <div class="input-bar">
    <div class="autocomplete" id="autocomplete"></div>
    <div class="input-wrap">
      <input type="text" id="msgInput" placeholder="Message" autocomplete="off">
    </div>
    <button class="send-btn" id="sendBtn" onclick="doSend()">
      <svg viewBox="0 0 24 24"><path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"/></svg>
    </button>
  </div>
</div>

<div class="closed-overlay" id="closedOverlay">
  <span>👋</span>
  <div>Chat ended</div>
  <div class="subtitle">This room has been closed</div>
</div>

<div class="confirm-overlay" id="confirmOverlay">
  <div class="confirm-box">
    <p>Leave this chat? You'll lose access and your history.</p>
    <div class="btns">
      <button class="confirm-cancel" onclick="cancelLeave()">Cancel</button>
      <button class="confirm-leave" onclick="doLeave()">Leave</button>
    </div>
  </div>
</div>

<script>
const ROOM_ID="${roomId}",CREATED=${createdAt},TTL=${ttlMinutes};
let ws,myName,myDeviceId,typingTimeout,typingClear={},lastSender="",lastSenderTime=0;
let joined=false,intentionalClose=false;

function $(id){return document.getElementById(id)}
function esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML}

function getDeviceId(){
  let id=localStorage.getItem('qchat_device_id');
  if(!id){id=crypto.randomUUID?crypto.randomUUID():'d-'+Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem('qchat_device_id',id)}
  return id;
}

// Check if we were previously in this room
function getSession(){
  try{return JSON.parse(localStorage.getItem('qchat_session_'+ROOM_ID))}catch{return null}
}
function saveSession(name,deviceId){
  localStorage.setItem('qchat_session_'+ROOM_ID,JSON.stringify({name,deviceId}));
}
function clearSession(){
  localStorage.removeItem('qchat_session_'+ROOM_ID);
}

// Auto-rejoin if we have a session
const prevSession=getSession();
if(prevSession){
  myName=prevSession.name;
  myDeviceId=prevSession.deviceId;
  // Skip join screen, go straight to chat
  $("joinScreen").style.display="none";
  $("chatScreen").style.display="flex";
  connect();
} else {
  // Pre-fill from last used name
  const lastN=localStorage.getItem('qchat_last_name');
  if(lastN)$("nameInput").value=lastN;
}

function connect(){
  const proto=location.protocol==="https:"?"wss:":"ws:";
  ws=new WebSocket(proto+"//"+location.host+"/room/"+ROOM_ID+"/ws");
  ws.onopen=()=>{
    $("reconnecting").style.display="none";
    ws.send(JSON.stringify({type:"join",name:myName,deviceId:myDeviceId${hasPassword ? ',password:localStorage.getItem("qchat_pass_"+ROOM_ID)||""' : ''}}));
  };
  ws.onmessage=handleMsg;
  ws.onerror=()=>{};
  ws.onclose=()=>{
    if(!intentionalClose&&joined){
      // Auto-reconnect
      $("reconnecting").style.display="block";
      setTimeout(connect,1500);
    }
  };
}

function handleMsg(e){
  const msg=JSON.parse(e.data);
  if(msg.type==="error"){
    if(!joined){$("joinError").textContent=msg.text;$("joinBtn").disabled=false;$("joinBtn").textContent="Join";$("joinScreen").style.display="flex";$("chatScreen").style.display="none";clearSession()}
    if(ws)ws.close();return;
  }
  if(msg.type==="history"){
    // Render all history (no animation)
    $("messages").innerHTML="";
    lastSender="";lastSenderTime=0;
    msg.messages.forEach(m=>{
      if(m.type==="system")addSystem(m.text,true);
      else if(m.type==="message")addMessage(m,true);
    });
    if(!joined){joined=true;startCountdown();$("msgInput").focus()}
    return;
  }
  if(msg.type==="joined"||msg.type==="left"||msg.type==="online"||msg.type==="offline"){
    updateMeta(msg.members,msg.online,msg.names||[]);
    if(msg.type==="joined"&&!joined){joined=true;startCountdown();$("msgInput").focus()}
    // joined/left are also in history, but for live events show system msg
    if(msg.type==="left")addSystem(msg.user+" left",false);
    return;
  }
  if(msg.type==="message"){addMessage(msg,false);return}
  if(msg.type==="typing"){showTyping(msg.user);return}
  if(msg.type==="system"){addSystem(msg.text,false);return}
  if(msg.type==="closed"){showClosed();return}
}

function doJoin(){
  const name=$("nameInput").value.trim();
  if(!name)return $("joinError").textContent="Enter your name";
  ${hasPassword ? 'const pass=$("passInput").value;if(!pass)return $("joinError").textContent="Enter the room password";localStorage.setItem("qchat_pass_"+ROOM_ID,pass);' : ''}
  myName=name;
  myDeviceId=getDeviceId();
  saveSession(name,myDeviceId);
  localStorage.setItem('qchat_last_name',name);
  $("joinBtn").disabled=true;
  $("joinBtn").textContent="Connecting...";
  $("joinScreen").style.display="none";
  $("chatScreen").style.display="flex";
  connect();
}

function doSend(){
  const text=$("msgInput").value.trim();
  if(!text||!ws||ws.readyState!==1)return;
  ws.send(JSON.stringify({type:"message",text}));
  $("msgInput").value="";
  $("msgInput").focus();
}

$("msgInput")?.addEventListener("keydown",e=>{
  const ac=$("autocomplete");
  if(ac&&ac.style.display==="block"){
    const items=ac.querySelectorAll(".autocomplete-item");
    if(e.key==="ArrowDown"){e.preventDefault();acIdx=Math.min(acIdx+1,items.length-1);items.forEach((el,i)=>el.classList.toggle("selected",i===acIdx));return}
    if(e.key==="ArrowUp"){e.preventDefault();acIdx=Math.max(acIdx-1,0);items.forEach((el,i)=>el.classList.toggle("selected",i===acIdx));return}
    if((e.key==="Tab"||e.key==="Enter")&&acIdx>=0){e.preventDefault();pickMention(items[acIdx]);return}
    if(e.key==="Enter"&&acIdx<0&&items.length>0){e.preventDefault();pickMention(items[0]);return}
    if(e.key==="Escape"){hideAc();return}
  }
  if(e.key==="Enter"){e.preventDefault();doSend()}
  else{clearTimeout(typingTimeout);typingTimeout=setTimeout(()=>{ws&&ws.readyState===1&&ws.send(JSON.stringify({type:"typing"}))},300)}
});
$("msgInput")?.addEventListener("input",()=>{
  const val=$("msgInput").value;
  const cursor=$("msgInput").selectionStart;
  const before=val.slice(0,cursor);
  const m=before.match(/@(\\w*)$/);
  if(m){
    const q=m[1].toLowerCase();
    const hits=knownMembers.filter(n=>n.toLowerCase().startsWith(q));
    if(hits.length){showAc(hits,m.index);return}
  }
  hideAc();
});
let knownMembers=[],acIdx=-1;
function showAc(names,atIdx){
  const ac=$("autocomplete");acIdx=-1;
  ac.innerHTML=names.map(name=>{
    let h=0;for(let i=0;i<name.length;i++)h=(h*31+name.charCodeAt(i))|0;
    const colors=["#25d366","#53bdeb","#f472b6","#a78bfa","#34d399","#fbbf24","#fb923c","#f87171","#38bdf8","#818cf8"];
    const c=colors[Math.abs(h)%colors.length];
    return '<div class="autocomplete-item" data-name="'+esc(name)+'" data-at="'+atIdx+'" onclick="pickMention(this)"><div class="ac-avatar" style="background:'+c+'">'+esc(name[0].toUpperCase())+'</div><span>'+esc(name)+'</span></div>';
  }).join("");
  ac.style.display="block";
}
function hideAc(){$("autocomplete").style.display="none";acIdx=-1}
function pickMention(el){
  const name=el.dataset.name,atI=parseInt(el.dataset.at);
  const val=$("msgInput").value;
  const after=val.slice($("msgInput").selectionStart).replace(/^\\w*/,"");
  $("msgInput").value=val.slice(0,atI)+"@"+name+" "+after;
  $("msgInput").focus();hideAc();
}
$("nameInput").addEventListener("keydown",e=>{if(e.key==="Enter")doJoin()});

function addMessage(m,isHistory){
  const mine=m.user===myName;
  const now=m.ts||Date.now();
  const sameSender=m.user===lastSender&&(now-lastSenderTime)<60000;
  const isFirst=!sameSender;
  lastSender=m.user;lastSenderTime=now;

  const el=document.createElement("div");
  el.className="msg "+(mine?"msg-mine":"msg-other")+(isFirst?" msg-first":"")+(isHistory?" no-anim":"");

  const t=new Date(m.ts);
  const time=t.getHours().toString().padStart(2,"0")+":"+t.getMinutes().toString().padStart(2,"0");

  let html="";
  if(!mine&&isFirst)html+='<div class="msg-sender" style="color:'+(m.color||"var(--accent2)")+'">'+esc(m.user)+'</div>';
  html+='<div class="msg-text">'+linkify(esc(m.text))+'</div>';
  html+='<div class="msg-footer"><span class="msg-time">'+time+'</span>'+(mine?'<span class="msg-tick">✓✓</span>':'')+'</div>';

  el.innerHTML=html;
  const msgs=$("messages");
  const atBottom=msgs.scrollHeight-msgs.scrollTop-msgs.clientHeight<80;
  msgs.appendChild(el);
  if(atBottom||isHistory)msgs.scrollTop=msgs.scrollHeight;
}

function linkify(text){
  text=text.replace(/(https?:\\/\\/[^\\s<]+)/g,'<a href="$1" target="_blank" rel="noopener" style="color:var(--accent2)">$1</a>');
  text=text.replace(/@(\\w+)/g,(match,name)=>{
    const isMe=name.toLowerCase()===myName.toLowerCase();
    return '<span class="mention'+(isMe?' mention-me':'')+'">'+match+'</span>';
  });
  return text;
}

function addSystem(text,isHistory){
  const el=document.createElement("div");
  el.className="msg-system"+(isHistory?" no-anim":"");
  el.textContent=text;
  const msgs=$("messages");
  msgs.appendChild(el);
  if(isHistory)msgs.scrollTop=msgs.scrollHeight;
  else el.scrollIntoView({behavior:"smooth",block:"end"});
}

function updateMeta(members,online,names){
  let text="";
  if(names.length<=5)text=names.join(", ");
  else text=names.slice(0,4).join(", ")+" +"+(names.length-4);
  if(online!==undefined&&members!==undefined)text+="  ·  "+online+"/"+members+" online";
  $("headerMeta").textContent=text;
  knownMembers=names.filter(n=>n!==myName);
}

function showTyping(user){
  $("typingIndicator").innerHTML=esc(user)+' is typing<span class="typing-dots"><span></span><span></span><span></span></span>';
  clearTimeout(typingClear[user]);
  typingClear[user]=setTimeout(()=>{$("typingIndicator").innerHTML=""},2500);
}

function startCountdown(){
  if(TTL===0){$("countdown").textContent="∞";return}
  const update=()=>{
    const left=Math.max(0,TTL*60*1000-(Date.now()-CREATED));
    const m=Math.floor(left/60000),s=Math.floor((left%60000)/1000);
    $("countdown").textContent=m+":"+s.toString().padStart(2,"0");
    if(left<=0){$("countdown").textContent="Ended";showClosed()}
  };
  update();setInterval(update,1000);
}

function confirmLeave(){$("confirmOverlay").style.display="flex"}
function cancelLeave(){$("confirmOverlay").style.display="none"}
function doLeave(){
  intentionalClose=true;
  if(ws&&ws.readyState===1)ws.send(JSON.stringify({type:"leave",deviceId:myDeviceId}));
  clearSession();
  showClosed();
  $("confirmOverlay").style.display="none";
}

function showClosed(){
  intentionalClose=true;
  if(ws)try{ws.close()}catch{}
  $("closedOverlay").style.display="flex";
}

// PWA Install
let deferredPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$("installBtn").style.display="block"});
function doInstall(){if(deferredPrompt){deferredPrompt.prompt();deferredPrompt.userChoice.then(()=>{deferredPrompt=null;$("installBtn").style.display="none"})}}
if(/iPhone|iPad/.test(navigator.userAgent)&&!window.navigator.standalone){$("installBtn").style.display="block";$("installBtn").onclick=()=>{alert("Tap the Share button (↑) then 'Add to Home Screen'")}}
if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(()=>{})}
</script>
</body>
</html>`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
