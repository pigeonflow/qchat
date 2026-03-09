export function generateHTML(roomId: string, roomName: string, hasPassword: boolean, ttlMinutes: number, createdAt: number): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<title>${esc(roomName)} — qchat</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#0a0a0f;--surface:#12121a;--surface2:#1a1a26;--border:#2a2a3a;--text:#e4e4ed;--text2:#8888a0;--accent:#06d6a0;--accent2:#0cc0df;--danger:#f87171}
html,body{height:100%;overflow:hidden}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--text);display:flex;flex-direction:column}

/* JOIN SCREEN */
.join-screen{display:flex;align-items:center;justify-content:center;height:100%;padding:24px;animation:fadeIn .4s}
.join-card{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:40px 32px;width:100%;max-width:380px;text-align:center}
.join-card h1{font-size:24px;font-weight:700;margin-bottom:4px;background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.join-card .room-name{color:var(--text2);font-size:14px;margin-bottom:32px}
.join-card input{width:100%;padding:14px 18px;border-radius:12px;border:1px solid var(--border);background:var(--surface2);color:var(--text);font-size:16px;outline:none;margin-bottom:12px;transition:border .2s}
.join-card input:focus{border-color:var(--accent)}
.join-card input::placeholder{color:var(--text2)}
.join-btn{width:100%;padding:14px;border:none;border-radius:12px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#0a0a0f;font-size:16px;font-weight:700;cursor:pointer;margin-top:8px;transition:opacity .2s,transform .1s}
.join-btn:active{transform:scale(.97)}
.join-btn:disabled{opacity:.5}
.join-error{color:var(--danger);font-size:13px;margin-top:12px;min-height:20px}

/* CHAT SCREEN */
.chat-screen{display:none;flex-direction:column;height:100%}
.header{background:var(--surface);border-bottom:1px solid var(--border);padding:12px 16px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;padding-top:max(12px,env(safe-area-inset-top))}
.header-left h2{font-size:17px;font-weight:700}
.header-left .meta{font-size:12px;color:var(--text2);display:flex;gap:12px;margin-top:2px}
.header-right{display:flex;align-items:center;gap:6px;background:var(--surface2);padding:6px 12px;border-radius:20px;font-size:13px;color:var(--text2)}
.dot{width:8px;height:8px;border-radius:50%;background:var(--accent);animation:pulse 2s infinite}

.messages{flex:1;overflow-y:auto;padding:12px 16px;display:flex;flex-direction:column;gap:2px;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
.msg{max-width:85%;padding:10px 14px;border-radius:16px;animation:msgIn .25s ease-out;word-wrap:break-word;line-height:1.45}
.msg-mine{align-self:flex-end;background:linear-gradient(135deg,#06d6a022,#0cc0df18);border:1px solid #06d6a030;border-bottom-right-radius:4px}
.msg-other{align-self:flex-start;background:var(--surface2);border:1px solid var(--border);border-bottom-left-radius:4px}
.msg-sender{font-size:12px;font-weight:600;margin-bottom:3px}
.msg-text{font-size:15px}
.msg-time{font-size:10px;color:var(--text2);margin-top:3px;text-align:right}
.msg-system{align-self:center;color:var(--text2);font-size:12px;padding:6px 14px;background:var(--surface2);border-radius:20px;margin:8px 0}
.typing-indicator{color:var(--text2);font-size:12px;padding:4px 16px;min-height:22px;flex-shrink:0}

.input-bar{display:flex;gap:8px;padding:10px 12px;background:var(--surface);border-top:1px solid var(--border);flex-shrink:0;padding-bottom:max(10px,env(safe-area-inset-bottom))}
.input-bar input{flex:1;padding:12px 16px;border-radius:24px;border:1px solid var(--border);background:var(--surface2);color:var(--text);font-size:16px;outline:none}
.input-bar input:focus{border-color:var(--accent)}
.send-btn{width:44px;height:44px;border-radius:50%;border:none;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#0a0a0f;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:opacity .2s,transform .1s;flex-shrink:0}
.send-btn:active{transform:scale(.9)}
.send-btn:disabled{opacity:.3}

.closed-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:100;align-items:center;justify-content:center;flex-direction:column;gap:12px;color:var(--text);font-size:18px;font-weight:600}
.closed-overlay span{font-size:48px}

@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes msgIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
</style>
</head>
<body>
<div class="join-screen" id="joinScreen">
  <div class="join-card">
    <h1>qchat</h1>
    <div class="room-name">${esc(roomName)}</div>
    <input type="text" id="nameInput" placeholder="Your name" maxlength="24" autocomplete="off" autofocus>
    ${hasPassword ? '<input type="password" id="passInput" placeholder="Room password" autocomplete="off">' : ''}
    <button class="join-btn" id="joinBtn" onclick="doJoin()">Join Chat</button>
    <div class="join-error" id="joinError"></div>
  </div>
</div>

<div class="chat-screen" id="chatScreen">
  <div class="header">
    <div class="header-left">
      <h2>${esc(roomName)}</h2>
      <div class="meta">
        <span id="countdown"></span>
        <span id="participantCount"></span>
      </div>
    </div>
    <div class="header-right"><div class="dot"></div><span id="onlineCount">0</span></div>
  </div>
  <div class="messages" id="messages"></div>
  <div class="typing-indicator" id="typingIndicator"></div>
  <div class="input-bar">
    <input type="text" id="msgInput" placeholder="Message..." autocomplete="off">
    <button class="send-btn" id="sendBtn" onclick="doSend()">↑</button>
  </div>
</div>

<div class="closed-overlay" id="closedOverlay">
  <span>👋</span>
  <div>Room closed</div>
</div>

<script>
const ROOM_ID="${roomId}",CREATED=${createdAt},TTL=${ttlMinutes};
let ws,myName,typingTimeout,typingClear={};

function $(id){return document.getElementById(id)}
function esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML}

function doJoin(){
  const name=$("nameInput").value.trim();
  if(!name)return $("joinError").textContent="Enter a name";
  ${hasPassword ? 'const pass=$("passInput").value;if(!pass)return $("joinError").textContent="Enter the room password";' : ''}
  myName=name;
  $("joinBtn").disabled=true;
  const proto=location.protocol==="https:"?"wss:":"ws:";
  ws=new WebSocket(proto+"//"+location.host+"/room/"+ROOM_ID+"/ws");
  ws.onopen=()=>{
    ws.send(JSON.stringify({type:"join",name${hasPassword ? ',password:$("passInput").value' : ''}}));
  };
  ws.onmessage=e=>{
    const msg=JSON.parse(e.data);
    if(msg.type==="error"){$("joinError").textContent=msg.text;$("joinBtn").disabled=false;ws.close();return}
    if(msg.type==="joined"||msg.type==="left"){
      if(msg.type==="joined"&&msg.user===myName&&$("joinScreen").style.display!=="none"){
        $("joinScreen").style.display="none";
        $("chatScreen").style.display="flex";
        $("msgInput").focus();
        startCountdown();
      }
      updateCount(msg.participants);
      addSystem(msg.user+(msg.type==="joined"?" joined":" left"));
    }
    else if(msg.type==="message"){addMessage(msg)}
    else if(msg.type==="typing"){showTyping(msg.user)}
    else if(msg.type==="system"){addSystem(msg.text)}
    else if(msg.type==="closed"){showClosed()}
  };
  ws.onclose=()=>{};
}

function doSend(){
  const text=$("msgInput").value.trim();
  if(!text||!ws)return;
  ws.send(JSON.stringify({type:"message",text}));
  $("msgInput").value="";
}

$("msgInput")?.addEventListener("keydown",e=>{
  if(e.key==="Enter")doSend();
  else{clearTimeout(typingTimeout);typingTimeout=setTimeout(()=>{ws&&ws.send(JSON.stringify({type:"typing"}))},300)}
});
$("nameInput").addEventListener("keydown",e=>{if(e.key==="Enter")doJoin()});

function addMessage(m){
  const mine=m.user===myName;
  const el=document.createElement("div");
  el.className="msg "+(mine?"msg-mine":"msg-other");
  const t=new Date(m.ts);
  const time=t.getHours().toString().padStart(2,"0")+":"+t.getMinutes().toString().padStart(2,"0");
  el.innerHTML=(mine?"":'<div class="msg-sender" style="color:'+m.color+'">'+esc(m.user)+"</div>")+
    '<div class="msg-text">'+esc(m.text)+'</div><div class="msg-time">'+time+"</div>";
  $("messages").appendChild(el);
  el.scrollIntoView({behavior:"smooth",block:"end"});
}

function addSystem(text){
  const el=document.createElement("div");
  el.className="msg-system";
  el.textContent=text;
  $("messages").appendChild(el);
  el.scrollIntoView({behavior:"smooth",block:"end"});
}

function updateCount(n){$("onlineCount").textContent=n;$("participantCount").textContent=n+" online"}

function showTyping(user){
  $("typingIndicator").textContent=user+" is typing...";
  clearTimeout(typingClear[user]);
  typingClear[user]=setTimeout(()=>{$("typingIndicator").textContent=""},2000);
}

function startCountdown(){
  const update=()=>{
    const left=Math.max(0,TTL*60*1000-(Date.now()-CREATED));
    const m=Math.floor(left/60000),s=Math.floor((left%60000)/1000);
    $("countdown").textContent=m+"m "+s+"s left";
    if(left<=0){$("countdown").textContent="Expired"}
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
