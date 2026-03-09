export function generateHTML(roomId: string, roomName: string, hasPassword: boolean, ttlMinutes: number, createdAt: number): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
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
  --bubble-out-lighter:#025144;
  --bubble-in:#1f2c34;
  --accent:#00a884;
  --accent2:#53bdeb;
  --danger:#f15c6d;
  --tick:#53bdeb;
}
html,body{height:100%;overflow:hidden}
body{font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:var(--bg);color:var(--text);display:flex;flex-direction:column}

/* CHAT WALLPAPER PATTERN */
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

/* HEADER — WhatsApp style */
.header{background:var(--header);padding:10px 16px;display:flex;align-items:center;gap:12px;flex-shrink:0;padding-top:max(10px,env(safe-area-inset-top));box-shadow:0 1px 3px rgba(0,0,0,.2)}
.header-avatar{width:40px;height:40px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.header-info{flex:1;min-width:0}
.header-info h2{font-size:16px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.header-info .meta{font-size:12px;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.header-timer{font-size:11px;color:var(--text2);background:rgba(255,255,255,.08);padding:4px 10px;border-radius:12px;flex-shrink:0;font-variant-numeric:tabular-nums}

/* MESSAGES */
.messages{flex:1;overflow-y:auto;padding:8px 12px;display:flex;flex-direction:column;gap:1px;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}

/* Date divider */
.date-divider{align-self:center;background:var(--header);color:var(--text2);font-size:11px;padding:4px 12px;border-radius:8px;margin:8px 0;box-shadow:0 1px 1px rgba(0,0,0,.15)}

/* Message bubbles — WhatsApp style with tails */
.msg{max-width:80%;padding:6px 8px 4px;border-radius:8px;animation:msgIn .2s ease-out;word-wrap:break-word;line-height:1.35;position:relative;margin-bottom:1px}
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
/* Double tick */
.msg-tick{font-size:14px;color:var(--tick);line-height:1}

/* System messages */
.msg-system{align-self:center;color:var(--text2);font-size:12px;padding:4px 12px;background:var(--header);border-radius:8px;margin:4px 0;box-shadow:0 1px 1px rgba(0,0,0,.15)}

/* Typing */
.typing-indicator{color:var(--text2);font-size:12px;padding:2px 16px;min-height:20px;flex-shrink:0}
.typing-dots{display:inline-flex;gap:3px;vertical-align:middle;margin-left:4px}
.typing-dots span{width:5px;height:5px;border-radius:50%;background:var(--text2);animation:typingBounce 1.4s infinite}
.typing-dots span:nth-child(2){animation-delay:.2s}
.typing-dots span:nth-child(3){animation-delay:.4s}

/* INPUT BAR — WhatsApp style */
.input-bar{display:flex;gap:6px;padding:6px 8px;background:var(--bg);flex-shrink:0;padding-bottom:max(6px,env(safe-area-inset-bottom));align-items:flex-end}
.input-wrap{flex:1;background:var(--input-bg);border-radius:24px;display:flex;align-items:flex-end;padding:6px 12px;min-height:44px}
.input-wrap input{flex:1;border:none;background:transparent;color:var(--text);font-size:16px;outline:none;padding:4px 0;line-height:1.3}
.input-wrap input::placeholder{color:var(--text2)}
.send-btn{width:44px;height:44px;border-radius:50%;border:none;background:var(--accent);color:#fff;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .1s;flex-shrink:0}
.send-btn:active{transform:scale(.9)}
.send-btn:disabled{opacity:.3}
.send-btn svg{width:22px;height:22px;fill:#fff}

/* Closed overlay */
.closed-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:100;align-items:center;justify-content:center;flex-direction:column;gap:8px;color:var(--text);font-size:17px;font-weight:500}
.closed-overlay span{font-size:44px;margin-bottom:4px}
.closed-overlay .subtitle{font-size:13px;color:var(--text2)}

/* Scrollbar */
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
      <div class="meta" id="headerMeta">tap here for info</div>
    </div>
    <div class="header-timer" id="countdown"></div>
  </div>
  <div class="messages" id="messages"></div>
  <div class="typing-indicator" id="typingIndicator"></div>
  <div class="input-bar">
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

<script>
const ROOM_ID="${roomId}",CREATED=${createdAt},TTL=${ttlMinutes};
let ws,myName,myDeviceId,typingTimeout,typingClear={},lastSender="",lastSenderTime=0;

function $(id){return document.getElementById(id)}
function esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML}

// Device ID — cached in localStorage
function getDeviceId(){
  let id=localStorage.getItem('qchat_device_id');
  if(!id){id=crypto.randomUUID?crypto.randomUUID():'d-'+Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem('qchat_device_id',id)}
  return id;
}

// Restore saved name for this room
function getSavedName(){return localStorage.getItem('qchat_name_'+ROOM_ID)||localStorage.getItem('qchat_last_name')||''}

function doJoin(){
  const name=$("nameInput").value.trim();
  if(!name)return $("joinError").textContent="Enter your name";
  ${hasPassword ? 'const pass=$("passInput").value;if(!pass)return $("joinError").textContent="Enter the room password";' : ''}
  myName=name;
  myDeviceId=getDeviceId();
  localStorage.setItem('qchat_name_'+ROOM_ID,name);
  localStorage.setItem('qchat_last_name',name);
  $("joinBtn").disabled=true;
  $("joinBtn").textContent="Connecting...";
  const proto=location.protocol==="https:"?"wss:":"ws:";
  ws=new WebSocket(proto+"//"+location.host+"/room/"+ROOM_ID+"/ws");
  ws.onopen=()=>{
    ws.send(JSON.stringify({type:"join",name,deviceId:myDeviceId${hasPassword ? ',password:$("passInput").value' : ''}}));
  };
  ws.onmessage=e=>{
    const msg=JSON.parse(e.data);
    if(msg.type==="error"){$("joinError").textContent=msg.text;$("joinBtn").disabled=false;$("joinBtn").textContent="Join";ws.close();return}
    if(msg.type==="joined"||msg.type==="left"){
      if(msg.type==="joined"&&msg.user===myName&&$("joinScreen").style.display!=="none"){
        $("joinScreen").style.display="none";
        $("chatScreen").style.display="flex";
        $("msgInput").focus();
        startCountdown();
      }
      updateParticipants(msg.participants,msg.names||[]);
      addSystem(msg.user+(msg.type==="joined"?" joined":" left"));
    }
    else if(msg.type==="message"){addMessage(msg)}
    else if(msg.type==="typing"){showTyping(msg.user)}
    else if(msg.type==="system"){addSystem(msg.text)}
    else if(msg.type==="closed"){showClosed()}
  };
  ws.onerror=()=>{$("joinError").textContent="Connection failed";$("joinBtn").disabled=false;$("joinBtn").textContent="Join"};
  ws.onclose=()=>{};
}

function doSend(){
  const text=$("msgInput").value.trim();
  if(!text||!ws)return;
  ws.send(JSON.stringify({type:"message",text}));
  $("msgInput").value="";
  $("msgInput").focus();
}

$("msgInput")?.addEventListener("keydown",e=>{
  if(e.key==="Enter"){e.preventDefault();doSend()}
  else{clearTimeout(typingTimeout);typingTimeout=setTimeout(()=>{ws&&ws.readyState===1&&ws.send(JSON.stringify({type:"typing"}))},300)}
});
$("nameInput").addEventListener("keydown",e=>{if(e.key==="Enter")doJoin()});

// Pre-fill saved name
const saved=getSavedName();
if(saved)$("nameInput").value=saved;

function addMessage(m){
  const mine=m.user===myName;
  const now=Date.now();
  const sameSender=m.user===lastSender&&(now-lastSenderTime)<60000;
  const isFirst=!sameSender;
  lastSender=m.user;lastSenderTime=now;

  const el=document.createElement("div");
  el.className="msg "+(mine?"msg-mine":"msg-other")+(isFirst?" msg-first":"");

  const t=new Date(m.ts);
  const time=t.getHours().toString().padStart(2,"0")+":"+t.getMinutes().toString().padStart(2,"0");

  let html="";
  if(!mine&&isFirst)html+='<div class="msg-sender" style="color:'+m.color+'">'+esc(m.user)+'</div>';
  html+='<div class="msg-text">'+linkify(esc(m.text))+'</div>';
  html+='<div class="msg-footer"><span class="msg-time">'+time+'</span>'+(mine?'<span class="msg-tick">✓✓</span>':'')+'</div>';

  el.innerHTML=html;
  const msgs=$("messages");
  const atBottom=msgs.scrollHeight-msgs.scrollTop-msgs.clientHeight<80;
  msgs.appendChild(el);
  if(atBottom)el.scrollIntoView({behavior:"smooth",block:"end"});
}

function linkify(text){
  return text.replace(/(https?:\\/\\/[^\\s<]+)/g,'<a href="$1" target="_blank" rel="noopener" style="color:var(--accent2)">$1</a>');
}

function addSystem(text){
  const el=document.createElement("div");
  el.className="msg-system";
  el.textContent=text;
  $("messages").appendChild(el);
  el.scrollIntoView({behavior:"smooth",block:"end"});
}

function updateParticipants(n,names){
  const meta=names.length?names.join(", "):(n+" participant"+(n!==1?"s":""));
  $("headerMeta").textContent=meta;
}

function showTyping(user){
  $("typingIndicator").innerHTML=esc(user)+' is typing<span class="typing-dots"><span></span><span></span><span></span></span>';
  clearTimeout(typingClear[user]);
  typingClear[user]=setTimeout(()=>{$("typingIndicator").innerHTML=""},2500);
}

function startCountdown(){
  const update=()=>{
    const left=Math.max(0,TTL*60*1000-(Date.now()-CREATED));
    const m=Math.floor(left/60000),s=Math.floor((left%60000)/1000);
    $("countdown").textContent=m+":"+s.toString().padStart(2,"0");
    if(left<=0){$("countdown").textContent="Ended";showClosed()}
  };
  update();setInterval(update,1000);
}

function showClosed(){$("closedOverlay").style.display="flex"}
</script>
</body>
</html>`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
