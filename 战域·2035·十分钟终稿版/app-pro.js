const $=selector=>document.querySelector(selector);
const $$=selector=>document.querySelectorAll(selector);

const STATUS_ZH={LOCKED:'未解锁',CHECKING:'自检中',ONLINE:'在线',STANDBY:'待命',AVAILABLE:'可部署',DEGRADED:'性能下降',DEPLOYING:'部署中',OVERLOAD:'数据过载',CHARGING:'充能中'};
const RISK_ZH={STANDBY:'待命',ELEVATED:'较高',UNKNOWN:'未知',HIGH:'高',CRITICAL:'严重',CONTROLLED:'受控',SATURATED:'饱和',DECISION:'待决策',SECURE:'安全'};
const CODE_ZH={'SYSTEM READY':'系统待机','MISSION BRIEF':'任务简报','LOAD LIMIT':'负载极限','SEARCH DECISION':'搜索决策',SWARM:'蜂群展开','LOW ALTITUDE THREAT':'低空威胁','MISSION COMPLETE':'任务完成'};
const ALERT_ZH={
  'TACTICAL CORE INITIALIZED':'战术核心初始化完成','MISSION PACKAGE RECEIVED':'任务数据包已接收','HUMAN PERFORMANCE LIMIT':'人员负载接近阈值','DECISION REQUIRED':'需要选择搜索方式','SWARM MODE AUTHORIZED':'24机蜂群模式已授权','LOW ALTITUDE OBJECTS INBOUND':'检测到低空目标接近','ALL PRIMARY OBJECTIVES COMPLETE':'全部主要任务目标已完成'
};
const EVENT_ZH={
  'OBSERVER NETWORK READY':'观察员网络已就绪','TEN MINUTE MODE LOADED':'十分钟展示流程已载入','WAITING FOR OPERATION ENTRY':'等待进入推演','TEAM-A ENTERED SECTOR 07':'ALPHA小组进入第七任务区','ROAD DAMAGE CONFIRMED':'山谷道路损坏，车辆无法继续','COMMUNICATION INTERFERENCE DETECTED':'区域通信受到干扰','MISSION CONTROL ACTIVE':'任务指挥链路已激活','TEAM LOAD ABOVE NOMINAL':'任务单元负载高于额定值','FATIGUE INDEX RISING':'人员疲劳指数持续上升','BROKEN TERRAIN AHEAD':'前方为碎石与台阶混合地形','EXO ASSIST PACKAGE AVAILABLE':'外骨骼辅助模块可用','SEARCH AREA EXPANDED':'未知搜索区域扩大','GROUND SEARCH TOO SLOW':'地面逐点搜索预计超时','UAV PACKAGE AVAILABLE':'无人侦察系统可部署','COMMAND DECISION REQUESTED':'已向现场观察员请求决策','24 AUTONOMOUS NODES DEPLOYED':'24个自主节点已部署','DISTRIBUTED TASKING ONLINE':'分布式任务分配上线','UAV-07 LINK LOST':'7号节点通信中断','SWARM TASKS REALLOCATED':'邻近节点已重新分配任务','MULTIPLE TRACKS DETECTED':'检测到多个低空航迹','EXFIL ROUTE UNDER THREAT':'安全撤离通道受到威胁','TRACKING SOLUTION ACQUIRED':'目标跟踪解算完成','DIRECTED ENERGY PACKAGE READY':'定向能防御模块就绪','TARGET RECOVERED':'失联目标已定位','EXFIL ROUTE SECURED':'安全撤离通道已恢复','TEAM-A RETURNED':'ALPHA小组完成返回','RETROSPECTIVE SEQUENCE READY':'三项技术复盘已就绪'
};
const SYSTEM_NAMES={EXO:'动力外骨骼',UAV:'无人机蜂群',DEW:'高能激光'};
const TECH_ACTIONS={exo:'启用负重辅助',uav:'展开24机蜂群',dew:'启动拦截链路'};
const TECH_LABELS={exo:'动力外骨骼与人机协同',uav:'无人机蜂群协同',dew:'高能激光防御'};
const VIDEO_PATHS={exo:'assets/videos/exo-fiction.mp4',uav:'assets/videos/uav-fiction.mp4',dew:'assets/videos/dew-fiction.mp4'};
const VIDEO_DESCRIPTIONS={exo:'《明日边缘》动力外骨骼片段',uav:'《流浪地球2》无人机片段',dew:'科幻光束武器片段'};
const CHECKS=[['任务核心','MISSION CORE','在线'],['战术地图','TACTICAL MAP','在线'],['外骨骼模块','EXO MODULE','待命'],['蜂群节点','SWARM NODES','待命'],['激光链路','LASER CHAIN','待命'],['观察员网络','OBSERVER','可接入']];
const TAB_NAMES={fiction:'科幻想象',reality:'现实技术',principle:'核心原理',limitation:'工程边界'};
const ENTITY_DETAILS={bridge:['交通节点','峡谷桥','连接北侧设施与南部撤离路线，目前结构完整。'],compound:['任务设施','工业设施区','包含三座主要建筑，热源与弱通信信号仍在持续。'],tower:['通信设施','高地通信塔','作为蜂群通信中继节点，当前链路质量82%。'],lz:['空中节点','LZ-2 起降区','无人机群待命区，可展开24个轻型侦察节点。'],objective:['搜寻目标','失联小队','区域内检测到微弱生命特征，需要持续缩小定位范围。'],uav01:['无人平台','UAV-01 / 领航节点','负责路径规划与编组通信中继。'],uav02:['无人平台','UAV-02 / 光学节点','搭载可见光侦察载荷，执行区域建图。'],uav03:['无人平台','UAV-03 / 热成像节点','负责低照度与热特征搜索。'],uav04:['无人平台','UAV-04 / 中继节点','扩展蜂群通信范围并监控链路质量。']};

let state=BlackoutSync.state;
let activeTech=null;
let techTab='fiction';
let lastAlert=-1;
let modalOpen=false;
let audioOn=true;
let missionEntered=false;
const videoReady={};
let mediaInventoryPromise=null;
let mapLayer='terrain';
let mapZoom=0;
let lastSceneVisit=-1;
let autoVideoTimer=null;
let currentVideoTech=null;
let swarmFault=false;
let dewTimer=null;
let rotatedVideoResize=null;

$('#bootChecks').innerHTML=CHECKS.map(([zh,en,status])=>`<div class="boot-check"><span>${zh}<small>${en}</small></span><b>${status}</b></div>`).join('');
$('#timelineList').innerHTML=BLACKOUT_DATA.timeline.map(([year,name,detail],index)=>`<div style="--i:${index}"><b>${year}</b><span><strong>${name}</strong><small>${detail}</small></span></div>`).join('');

function renderObserverQr(url){
  const host=$('#observerQr');if(!host)return;host.innerHTML='';
  if(window.QRCode)new QRCode(host,{text:url,width:238,height:238,colorDark:'#071117',colorLight:'#dffcff',correctLevel:QRCode.CorrectLevel.M});
  $('#checkinUrl').textContent=url;
}
let lastObserverUrl='';
async function refreshObserverAccess(){
  const info=await BlackoutSync.info();
  $('#observerUrl').textContent=info.observerUrl;
  const publicReady=Boolean(info.public&&info.publicUrl);
  if(publicReady&&info.observerUrl!==lastObserverUrl){lastObserverUrl=info.observerUrl;renderObserverQr(info.observerUrl)}
  const scope=$('#accessScope');
  scope.textContent=publicReady?'公网二维码已就绪 · 不限网络与参与人数':'正在建立公网接入通道…';
  scope.classList.toggle('ready',publicReady);
  $('#checkinContinue').disabled=!publicReady;
  $('#checkinContinue').textContent=publicReady?'公网已就绪，进入系统':'正在建立公网投票通道…';
  $('#copyCheckinUrl').disabled=!publicReady;
}
function enterSystemLobby(){
  sessionStorage.setItem('b35:checkin','done');
  $('#checkin').classList.add('checkin-exit');
  setTimeout(()=>{$('#checkin').classList.add('is-hidden');$('#boot').classList.remove('is-hidden')},420);
}

function translateAlert(value){return ALERT_ZH[value]||value}
function translateEvent(value){return EVENT_ZH[value]||value}
function scenePhase(scene){return CODE_ZH[scene.code]||scene.title}
function modal(selector){modalOpen=true;$(selector).classList.remove('is-hidden')}
function closeModals(){$$('#videoPreviewStage video').forEach(video=>video.pause());$$('.modal-layer').forEach(layer=>layer.classList.add('is-hidden'));clearInterval(dewTimer);modalOpen=false}
function toast(message){const node=$('#toast');node.textContent=message;node.classList.add('show');clearTimeout(node._timer);node._timer=setTimeout(()=>node.classList.remove('show'),2200)}
function beep(freq=620,duration=.09,type='sine'){
  if(!audioOn)return;
  try{const context=new (window.AudioContext||window.webkitAudioContext)();const oscillator=context.createOscillator();const gain=context.createGain();oscillator.type=type;oscillator.frequency.value=freq;gain.gain.setValueAtTime(.018,context.currentTime);gain.gain.exponentialRampToValueAtTime(.001,context.currentTime+duration);oscillator.connect(gain).connect(context.destination);oscillator.start();oscillator.stop(context.currentTime+duration)}catch(_error){}
}

function showDashboard(){
  const boot=$('#boot');boot.classList.add('boot-exit');
  setTimeout(()=>{boot.classList.add('is-hidden');$('#dashboard').classList.remove('is-hidden')},360);
}
function enterOperation(){
  missionEntered=true;showDashboard();modal('#briefingModal');beep(520,.13);
}
function startMission(){
  closeModals();
  if(state.scene===0)BlackoutSync.action('setScene',{scene:1});
  toast('任务 BX-07A 已启动');beep(760,.16);
}

function systemStatus(name,scene){return state.deployed?.[name.toLowerCase()]?'ONLINE':scene.status[name]}
function renderSystems(scene){
  $('#systemList').innerHTML=BLACKOUT_DATA.systems.map(name=>{
    const raw=systemStatus(name,scene);const locked=raw==='LOCKED';const warning=['DEGRADED','OVERLOAD','CHARGING'].includes(raw);const progress=locked?0:raw==='AVAILABLE'?58:raw==='STANDBY'?34:raw==='DEPLOYING'?76:warning?48:100;
    return `<button class="system-row ${locked?'locked':''} ${warning?'warning':''}" data-system="${name}" ${locked?'aria-disabled="true"':''}><span>${name}<small>${SYSTEM_NAMES[name]}</small></span><i><em style="width:${progress}%"></em></i><div class="system-state"><b>${STATUS_ZH[raw]||raw}</b><small>${raw}</small></div></button>`;
  }).join('');
  $$('[data-system]').forEach(button=>button.onclick=()=>{
    const key=Object.keys(BLACKOUT_DATA.techs).find(id=>BLACKOUT_DATA.techs[id].short===button.dataset.system);
    if(key)openTech(key);
  });
}
function renderEvents(scene){
  const base=32+state.scene*4;
  $('#eventLog').innerHTML=scene.events.map((raw,index)=>{
    const message=translateEvent(raw);const second=11+index*7;const warning=/丢失|超过|风险|过载|威胁|下降|超限|饱和|异常|不可用|未知/.test(message);
    return `<div class="event-row"><time>19:${String(base%60).padStart(2,'0')}:${String(second).padStart(2,'0')}</time><b class="${warning?'warning':'info'}">${warning?'警告':'系统'}</b><span>${message}</span></div>`;
  }).join('');
}
function renderMap(scene){
  const mode=scene.map;
  ['blindField','driftGhosts','uavLayer','threatLayer','aiLayer'].forEach(id=>$('#'+id).classList.remove('visible'));
  if(['blind','risk'].includes(mode))$('#blindField').classList.add('visible');
  if(mode==='drift')$('#driftGhosts').classList.add('visible');
  if(['swarm','overload','ai','threat','complete'].includes(mode))$('#uavLayer').classList.add('visible');
  if(mode==='threat')$('#threatLayer').classList.add('visible');
  if(mode==='ai')$('#aiLayer').classList.add('visible');
  $('#teamMarker').classList.toggle('drifting',mode==='drift');
  const uavActive=state.uav?.mode==='airborne'||['swarm','overload','ai','threat','complete'].includes(mode);
  $('.map-panel').className=`map-panel panel mode-${mode} layer-${mapLayer} zoom-${mapZoom} ${uavActive?'uav-active':''}`;
  $('#airNodes').textContent=`${uavActive?(state.uav?.active||24):0} / 24`;
}

function handleSceneArrival(scene){
  if(state.scene===lastSceneVisit)return;
  const arrivedScene=state.scene;lastSceneVisit=arrivedScene;clearTimeout(autoVideoTimer);
  if(arrivedScene===0)return;
  if(window.playSceneCinematic)window.playSceneCinematic(scene);
  if(!scene.tech)return;
  const attemptOpen=(remaining=6)=>{if(state.scene!==arrivedScene)return;if(modalOpen&&remaining>0){autoVideoTimer=setTimeout(()=>attemptOpen(remaining-1),700);return}if(!modalOpen)openVideoPreview(scene.tech,{automatic:true,scene})};
  autoVideoTimer=setTimeout(()=>attemptOpen(),1450);
}
function renderPoll(){
  const scene=BLACKOUT_DATA.scenes[state.scene];const pollId=scene.poll||state.poll?.id;const poll=pollId&&BLACKOUT_DATA.polls[pollId];
  if(!poll)return;
  $('#pollTitle').textContent=poll.title;$('#pollQuestion').textContent=poll.question;
  $('#pollOptions').innerHTML=poll.options.map(option=>`<div><b>${option.id}</b><span>${option.label}</span></div>`).join('');
  const votes=state.poll?.id===pollId?state.poll.votes:{A:0,B:0};const total=(votes?.A||0)+(votes?.B||0);
  $('#resultBars').innerHTML=poll.options.map(option=>{const count=votes?.[option.id]||0;const percent=total?Math.round(count/total*100):0;return `<div><span>${option.id}</span><i><em style="width:${percent}%"></em></i><b><strong>${count}票</strong><small>${percent}%</small></b></div>`}).join('');
  $('#responseCount').textContent=`${total} 份有效反馈`;$('#openPollBtn').textContent=state.poll?.open?'投票通道已开启':'向观察员发起投票';
}
function renderRoute(sceneIndex){
  const routes=[['01','进入任务区',1],['02','人员负重辅助',2],['03','蜂群区域搜索',3],['04','保卫撤离通道',5]];
  $('#routeList').innerHTML=routes.map(([number,label,start],index)=>{const next=routes[index+1]?.[2]??99;const active=sceneIndex>=start&&sceneIndex<next;const done=sceneIndex>=next;return `<span class="${active?'active':''} ${done?'done':''}">${number} / ${label}</span>`}).join('');
}
function renderSceneNavigation(){
  $('#sceneNavList').innerHTML=BLACKOUT_DATA.scenes.map((scene,index)=>`<button class="scene-nav-item ${index===state.scene?'active':''} ${index<state.scene?'done':''}" data-jump="${index}"><b>${scene.number}</b><span>${scene.title}</span><small>${scene.code}</small></button>`).join('');
  $$('[data-jump]').forEach(button=>button.onclick=()=>{BlackoutSync.action('setScene',{scene:Number(button.dataset.jump)});closeModals()});
}
function render(next){
  state=next||BlackoutSync.state;const scene=BLACKOUT_DATA.scenes[state.scene]||BLACKOUT_DATA.scenes[0];const alertText=translateAlert(scene.alert);
  $('#bootConnected').textContent=`${state.connected||0} / ∞`;$('#checkinConnected').textContent=state.connected||0;
  $('#sceneLabel').textContent=`场景 / ${scene.number}`;$('#sceneTitle').textContent=scene.title;$('#sceneObjective').textContent=scene.objective;
  $('#phaseLabel').textContent=scenePhase(scene);$('#riskLabel').textContent=RISK_ZH[scene.risk]||scene.risk;$('#riskLabel').className=`risk risk-${scene.risk.toLowerCase()}`;
  $('#progressText').textContent=`${scene.progress}%`;$('#progressBar').style.width=`${scene.progress}%`;$('#sceneTime').textContent=scene.time;
  $('#sceneIndex').textContent=`${scene.number} / ${String(BLACKOUT_DATA.scenes.length-1).padStart(2,'0')}`;$('#sceneProgress').style.background=`linear-gradient(90deg,var(--cyan) ${scene.progress}%,#17323d ${scene.progress}%)`;
  $('#actionHint').textContent=`${scene.title} // ${alertText}`;$('#mapAlert strong').textContent=alertText;
  $('#dataRate').textContent=scene.rate;$('#telemetryRate').textContent=scene.rate;$('#coverage').textContent=`${scene.coverage}%`;$('#positionError').textContent=scene.error;
  $('#networkState').textContent=state.demoMode?'演示模式':'安全连接';$('#operationState').textContent=state.demoMode?'离线续航模式':'任务运行中';
  renderSystems(scene);renderEvents(scene);renderMap(scene);renderPoll();renderRoute(state.scene);renderSceneNavigation();
  $('#techBtn').disabled=!scene.tech;$('#deployBtn').disabled=!scene.tech;$('#pollBtn').disabled=!scene.poll;$('#prevBtn').disabled=state.scene<=0;$('#nextBtn').disabled=state.scene>=BLACKOUT_DATA.scenes.length-1;
  const pollText=$('#pollBtn').childNodes[0];if(pollText&&pollText.nodeType===3)pollText.nodeValue=state.poll?.open?'关闭投票 ':'决策投票 ';
  document.body.classList.toggle('critical',['CRITICAL','HIGH'].includes(scene.risk));
  if(state.alertPulse!==lastAlert){if(lastAlert>=0){$('#alertFlash').classList.remove('pulse');requestAnimationFrame(()=>$('#alertFlash').classList.add('pulse'));beep(220,.22,'sawtooth');toast(alertText)}lastAlert=state.alertPulse}
  if(state.scene===BLACKOUT_DATA.scenes.length-1&&!$('#timelineModal').dataset.shown){$('#timelineModal').dataset.shown='1';setTimeout(()=>modal('#timelineModal'),550)}
  if(state.scene!==BLACKOUT_DATA.scenes.length-1)delete $('#timelineModal').dataset.shown;
  if(!$('#uavModal').classList.contains('is-hidden'))renderUavConsole();if(!$('#intelModal').classList.contains('is-hidden'))renderIntel();
  handleSceneArrival(scene);
}

async function probeVideo(id){
  if(id in videoReady)return videoReady[id];
  try{mediaInventoryPromise=mediaInventoryPromise||fetch('/api/media',{cache:'no-store'}).then(response=>response.ok?response.json():{});const inventory=await mediaInventoryPromise;Object.assign(videoReady,inventory);videoReady[id]=Boolean(inventory[id])}catch(_error){videoReady[id]=false}
  return videoReady[id];
}
function videoPlaceholder(id){
  const filename=VIDEO_PATHS[id].split('/').pop();
  return `<div class="video-stage" data-video-preview="${id}" role="button" tabindex="0" title="打开影片预览窗口"><div class="video-placeholder"><span class="play-mark"></span><div class="video-placeholder-copy"><div><span>点击打开影片窗口</span><b>${VIDEO_DESCRIPTIONS[id]}</b></div><small>${filename}<br>建议 5–8 秒</small></div></div></div>`;
}
async function renderTech(){
  const id=activeTech;const tech=BLACKOUT_DATA.techs[id];if(!tech)return;
  const index=['fiction','reality','principle','limitation'].indexOf(techTab);let html='';
  if(techTab==='fiction'){
    const ready=await probeVideo(id);
    const media=ready?`<div class="video-stage" data-video-preview="${id}" role="button" tabindex="0" title="点击打开影片窗口"><video src="${VIDEO_PATHS[id]}" loop playsinline preload="metadata"></video><span class="video-ready-badge">点击后播放</span></div>`:videoPlaceholder(id);
    html=`<div class="archive-frame">${media}<small>影视想象只是问题入口，后续页面将回到现实原理与工程边界。</small></div><div class="tech-copy"><span>科幻想象 / CONCEPT REFERENCE</span><h3>${tech.question}</h3><p>${tech.fiction}</p></div>`;
  }
  if(techTab==='reality')html=`<div class="reality-mark">现实</div><div class="tech-copy"><span>现实技术 / REAL-WORLD TECHNOLOGY</span><h3>${TECH_LABELS[id]}</h3><p>${tech.reality}</p></div>`;
  if(techTab==='principle')html=`<div class="principle-grid">${tech.principles.map((principle,itemIndex)=>`<div><b>0${itemIndex+1}</b><span>${principle}</span></div>`).join('')}</div>`;
  if(techTab==='limitation')html=`<div class="limitation"><span>工程边界 / ENGINEERING GAP</span><h3>为什么现实还不是电影效果？</h3><p>${tech.limitation}</p></div>`;
  if(id!==activeTech)return;
  $('#techContent').innerHTML=html;$('#techStep').textContent=`0${index+1} / ${TAB_NAMES[techTab]}`;$('#techNext').style.display=index===3?'none':'inline-block';$('#techDeploy').textContent=TECH_ACTIONS[id];
  $$('[data-video-preview]').forEach(node=>node.onclick=()=>openVideoPreview(node.dataset.videoPreview));
}
function openTech(id){
  if(!id)return;activeTech=id;techTab='fiction';const tech=BLACKOUT_DATA.techs[id];$('#techTitle').textContent=TECH_LABELS[id]||tech.name;
  $$('#techTabs button').forEach(button=>button.classList.toggle('active',button.dataset.tab==='fiction'));renderTech();modal('#techModal');beep(720,.08);
}
function deploy(){
  const scene=BLACKOUT_DATA.scenes[state.scene];if(!scene.tech)return;
  BlackoutSync.action('deploy',{tech:scene.tech});beep(880,.18);toast(`${TECH_LABELS[scene.tech]}已接入任务系统`);closeModals();
}
function openDecision(){const scene=BLACKOUT_DATA.scenes[state.scene];if(!scene.poll)return;renderPoll();modal('#pollModal');beep(330,.14,'square')}
async function renderMediaCenter(){
  $('#mediaSlotList').innerHTML=Object.keys(VIDEO_PATHS).map(id=>`<article class="media-slot" data-media="${id}"><div class="media-slot-icon">${BLACKOUT_DATA.techs[id].short}</div><div><h3>${TECH_LABELS[id]}</h3><p>${VIDEO_PATHS[id]}</p></div><div class="media-slot-actions"><button class="media-preview-btn" data-preview="${id}">预览窗口</button><em>检查中</em></div></article>`).join('');
  await Promise.all(Object.keys(VIDEO_PATHS).map(async id=>{const ready=await probeVideo(id);const card=$(`[data-media="${id}"]`);if(!card)return;card.classList.toggle('ready',ready);card.querySelector('em').textContent=ready?'素材已接入':'等待素材'}));
  $$('[data-preview]').forEach(button=>button.onclick=()=>openVideoPreview(button.dataset.preview));
}
function openMedia(){renderMediaCenter();modal('#mediaModal')}
async function openVideoPreview(id,options={}){
  const ready=await probeVideo(id);const filename=VIDEO_PATHS[id].split('/').pop();const currentScene=options.scene||BLACKOUT_DATA.scenes[state.scene];closeModals();
  currentVideoTech=id;
  $('#videoPreviewTitle').textContent=VIDEO_DESCRIPTIONS[id];$('#videoSceneContext').textContent=`场景 ${currentScene.number} · ${currentScene.title}｜${currentScene.objective}`;$('#videoPreviewFile').textContent=`素材位置：D:\\战域·2035·十分钟终稿版\\assets\\videos\\${filename}`;
  $('#videoPreviewStage').innerHTML=ready?`<video src="${VIDEO_PATHS[id]}" class="${id==='dew'?'rotate-landscape':''}" loop playsinline controls preload="auto"></video><div class="video-classroom-badge"><i></i>点击播放 · 课堂音量 18%${id==='dew'?' · 横屏适配':''}</div>`:`<div class="cinema-placeholder"><div class="cinema-play"></div><div class="cinema-meta"><div><span>${options.automatic?'情节已自动触发影片窗口':'影片预览窗口'}</span><b>${TECH_LABELS[id]}</b></div><small>${filename}<br>16:9 · 5–8秒</small></div></div>`;
  $('#videoContinueBtn').textContent={exo:'进入外骨骼结构演示',uav:'进入蜂群协同演示',dew:'进入激光拦截演示'}[id]||'进入现实技术解析';
  modal('#videoPreviewModal');const player=$('#videoPreviewStage video');if(player){prepareClassroomVideo(player);if(id==='dew')fitRotatedVideo(player)}beep(610,.08);
}
function prepareClassroomVideo(video){
  video.volume=.18;video.muted=false;video.pause();
  const resetToStart=()=>{video.currentTime=0;video.pause()};
  if(video.readyState>=1)resetToStart();else video.addEventListener('loadedmetadata',resetToStart,{once:true});
}
function fitRotatedVideo(video){
  if(rotatedVideoResize)window.removeEventListener('resize',rotatedVideoResize);
  const apply=()=>{const stage=$('#videoPreviewStage');if(!stage||!video.videoWidth)return;const scale=Math.min(stage.clientWidth/video.videoHeight,stage.clientHeight/video.videoWidth);video.style.width=`${Math.floor(video.videoWidth*scale)}px`;video.style.height=`${Math.floor(video.videoHeight*scale)}px`};
  rotatedVideoResize=apply;video.addEventListener('loadedmetadata',apply,{once:true});window.addEventListener('resize',apply);if(video.readyState>=1)apply();
}
async function resetTrainingSession(){
  if(!confirm('确定重置整场训练吗？\n\n场景、投票、无人机与部署记录都会清空，所有手机可重新参与投票。'))return;
  await BlackoutSync.action('reset',{scene:0});sessionStorage.removeItem('b35:checkin');location.href='index.html';
}
function showShutdownScreen(){
  document.body.innerHTML='<section class="shutdown-screen"><div><span>BATTLE DOMAIN / OFFLINE</span><b>战域·2035 已安全关闭</b><p>大屏、公网投票和后台服务均已停止。下次使用时，双击桌面的“战域·2035”图标即可重新启动。</p><i></i></div></section>';
}
async function shutdownSystem(){
  if(!confirm('确定关闭战域·2035吗？\n\n这会断开所有手机投票连接并停止后台服务。'))return;
  try{const response=await fetch('/api/shutdown',{method:'POST',cache:'no-store'});if(!response.ok)throw new Error('shutdown');showShutdownScreen()}catch(_error){toast('关闭指令未能执行，请使用本机大屏操作')}
}
function openTechnologyDemo(id){
  closeModals();
  if(id==='exo'){updateExoMetrics(Number($('#exoAssist').value));modal('#exoModal');requestAnimationFrame(()=>window.exo3D?.resize());return}
  if(id==='uav'){openUavConsole();return}
  if(id==='dew'){resetDewDemo();modal('#dewModal');return}
  openTech(id);
}
function updateExoMetrics(value){
  const load=Math.round(value*.62);const hours=(6.9-value*.045).toFixed(1);
  $('#exoAssistValue').textContent=`${value}%`;$('#exoLoad').textContent=`${load}%`;$('#exoEndurance').textContent=`${hours} h`;$('#exoHeat').textContent=value>75?'高':value>48?'中':'低';
  $('#exoModel').style.setProperty('--assist',`${value}%`);if(window.exo3D)window.exo3D.setAssist(value);
}
function initExo3D(){
  const canvas=$('#exoCanvas');const host=$('#exoModel');if(!canvas||!host||!window.THREE)return;
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
  const scene3d=new THREE.Scene();scene3d.fog=new THREE.FogExp2(0x061018,.052);const camera=new THREE.PerspectiveCamera(35,1,.1,40);camera.position.set(0,.05,8.7);camera.lookAt(0,-.12,0);
  scene3d.add(new THREE.HemisphereLight(0xbdefff,0x020509,1.25));const key=new THREE.DirectionalLight(0xd8fbff,3.2);key.position.set(4,5,6);scene3d.add(key);const rim=new THREE.PointLight(0x22d9ff,42,12);rim.position.set(-4,1,-2);scene3d.add(rim);const warm=new THREE.PointLight(0xffb761,16,9);warm.position.set(3,-2,4);scene3d.add(warm);
  const root=new THREE.Group();root.position.y=-.04;scene3d.add(root);const bodyMat=new THREE.MeshStandardMaterial({color:0x263d47,metalness:.22,roughness:.56,transparent:true,opacity:.9});const jointBodyMat=new THREE.MeshStandardMaterial({color:0x516a73,metalness:.28,roughness:.42});const exoMat=new THREE.MeshStandardMaterial({color:0x35dff6,emissive:0x087f98,emissiveIntensity:1.2,metalness:.82,roughness:.2});const exoDark=new THREE.MeshStandardMaterial({color:0x112d36,emissive:0x063847,emissiveIntensity:.75,metalness:.88,roughness:.23});const energyMat=new THREE.MeshStandardMaterial({color:0xffbb57,emissive:0x8a4300,emissiveIntensity:1.35,metalness:.5,roughness:.28});
  const mesh=(geometry,material,position,scale)=>{const item=new THREE.Mesh(geometry,material);item.position.set(...position);if(scale)item.scale.set(...scale);item.castShadow=true;root.add(item);return item};
  const capsule=(radius,length,position,scale=[1,1,1],material=bodyMat)=>mesh(new THREE.CapsuleGeometry(radius,length,8,18),material,position,scale);
  const sphere=(radius,position,material=jointBodyMat,scale=[1,1,1])=>mesh(new THREE.SphereGeometry(radius,24,18),material,position,scale);
  const rail=(a,b,radius=.045,material=exoMat)=>{const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);const item=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,delta.length(),12),material);item.position.copy(start.clone().add(end).multiplyScalar(.5));item.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize());root.add(item);return item};
  sphere(.36,[0,2.25,0],jointBodyMat,[.9,1.08,.92]);capsule(.15,.18,[0,1.82,0],[1,1,1],bodyMat);capsule(.51,1.05,[0,1.05,0],[1,.92,.62]);capsule(.38,.22,[0,.25,0],[1.12,.72,.7]);
  [-1,1].forEach(side=>{const x=side*.67;capsule(.17,.67,[x,1.22,0],[1,1,1],bodyMat).rotation.z=side*-.12;capsule(.15,.62,[side*.72,.48,.02],[1,1,1],bodyMat).rotation.z=side*.08;sphere(.18,[side*.7,.84,0]);sphere(.15,[side*.72,.1,.02]);capsule(.22,.82,[side*.27,-.52,0],[1,1,1],bodyMat).rotation.z=side*-.02;sphere(.22,[side*.27,-1.08,.02]);capsule(.19,.75,[side*.27,-1.64,.04],[1,1,1],bodyMat);const foot=mesh(new THREE.BoxGeometry(.42,.18,.72),bodyMat,[side*.27,-2.18,.2]);foot.rotation.x=.04;
    rail([side*.47,.24,-.08],[side*.46,-.96,-.08],.052);rail([side*.46,-1.23,-.08],[side*.47,-2.04,.08],.055);rail([side*.63,1.68,-.08],[side*.83,.84,-.06],.038,exoDark);rail([side*.83,.78,-.06],[side*.84,.12,.02],.035,exoDark);sphere(.13,[side*.47,-1.09,-.08],exoMat);sphere(.11,[side*.49,.22,-.08],exoMat);sphere(.1,[side*.83,.82,-.06],exoMat);const knee=new THREE.Mesh(new THREE.TorusGeometry(.2,.045,10,30),exoMat);knee.position.set(side*.47,-1.09,-.08);knee.rotation.y=Math.PI/2;root.add(knee);rail([side*.43,-2.03,.08],[side*.43,-2.27,.43],.045,exoMat)});
  rail([-.55,1.72,-.18],[.55,1.72,-.18],.055,exoDark);rail([0,1.72,-.18],[0,.2,-.25],.07,exoMat);rail([-.5,.2,-.18],[.5,.2,-.18],.06,exoMat);
  const backpack=mesh(new THREE.BoxGeometry(.76,1.18,.42),exoDark,[0,1.05,-.52]);const battery=mesh(new THREE.BoxGeometry(.46,.62,.12),energyMat,[0,1.08,-.77]);const packEdges=new THREE.LineSegments(new THREE.EdgesGeometry(backpack.geometry),new THREE.LineBasicMaterial({color:0x63efff,transparent:true,opacity:.72}));packEdges.position.copy(backpack.position);root.add(packEdges);const cellEdges=new THREE.LineSegments(new THREE.EdgesGeometry(battery.geometry),new THREE.LineBasicMaterial({color:0xffd48a}));cellEdges.position.copy(battery.position);root.add(cellEdges);
  const chestArc=new THREE.Mesh(new THREE.TorusGeometry(.57,.035,10,42,Math.PI),exoMat);chestArc.position.set(0,1.25,.08);chestArc.rotation.z=Math.PI;root.add(chestArc);
  const floor=new THREE.GridHelper(8,18,0x1f8ca2,0x153541);floor.position.y=-2.33;floor.material.transparent=true;floor.material.opacity=.28;scene3d.add(floor);[1.25,1.75,2.25].forEach((radius,index)=>{const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,.009,6,96),new THREE.MeshBasicMaterial({color:index===1?0x3ceaff:0x17677a,transparent:true,opacity:index===1?.35:.18}));ring.rotation.x=Math.PI/2;ring.position.y=-2.29;scene3d.add(ring)});
  const particlesGeometry=new THREE.BufferGeometry();const points=[];for(let i=0;i<90;i++)points.push((Math.random()-.5)*7,(Math.random()-.5)*6,(Math.random()-.5)*4);particlesGeometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));scene3d.add(new THREE.Points(particlesGeometry,new THREE.PointsMaterial({color:0x57dff3,size:.018,transparent:true,opacity:.48})));
  let dragging=false,lastX=0,rotationY=-.34,targetTilt=.03;host.addEventListener('pointerdown',event=>{dragging=true;lastX=event.clientX;host.setPointerCapture?.(event.pointerId)});host.addEventListener('pointermove',event=>{if(!dragging)return;rotationY+=(event.clientX-lastX)*.012;targetTilt=Math.max(-.18,Math.min(.18,targetTilt+(event.movementY||0)*.004));lastX=event.clientX});host.addEventListener('pointerup',()=>dragging=false);host.addEventListener('pointercancel',()=>dragging=false);
  const resize=()=>{const width=host.clientWidth,height=host.clientHeight;if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix()};new ResizeObserver(resize).observe(host);resize();
  let last=performance.now();function animate(now){const dt=Math.min(.04,(now-last)/1000);last=now;if(!dragging)rotationY+=dt*.34;root.rotation.y+=(rotationY-root.rotation.y)*.08;root.rotation.x+=(targetTilt-root.rotation.x)*.08;root.position.y=-.04+Math.sin(now*.00115)*.018;renderer.render(scene3d,camera);requestAnimationFrame(animate)}requestAnimationFrame(animate);
  window.exo3D={resize,setAssist(value){exoMat.emissiveIntensity=.55+value/55;energyMat.emissiveIntensity=.65+value/70;rim.intensity=24+value*.3}};
}
function resetDewDemo(){
  clearInterval(dewTimer);const stage=$('#dewStage');stage.className='dew-stage';$$('[data-dew-step]').forEach(node=>node.classList.remove('active','done'));$('#dewError').textContent='--';$('#dewDwell').textContent='0.0 s';$('#dewCooling').textContent='92%';$('#dewExplanation').textContent='先发现目标，再把光斑稳定留在关键位置。跟踪稍有偏差，能量就会被摊开，无法形成有效热积累。';$('#dewRunBtn').disabled=false;$('#dewRunBtn').textContent='启动完整拦截链路';
}
function runDewDemo(){
  resetDewDemo();const stage=$('#dewStage');const steps=['detect','track','stabilize','dwell'];let index=0;$('#dewRunBtn').disabled=true;$('#dewRunBtn').textContent='拦截链路运行中';
  const advance=()=>{const step=steps[index];if(index>0)$(`[data-dew-step="${steps[index-1]}"]`).classList.replace('active','done');$(`[data-dew-step="${step}"]`).classList.add('active');stage.classList.add(`step-${step}`);
    if(step==='detect'){$('#dewError').textContent='1.8 mrad';$('#dewExplanation').textContent='探测系统先建立航迹。此时只是“看见”，还没有形成可用的照射解。'}
    if(step==='track'){$('#dewError').textContent='0.42 mrad';$('#dewExplanation').textContent='目标高速移动，跟踪系统必须持续预测下一时刻的位置。'}
    if(step==='stabilize'){$('#dewError').textContent='0.08 mrad';$('#dewExplanation').textContent='光束控制补偿平台振动与大气扰动，把能量稳定压在关键位置。'}
    if(step==='dwell'){let dwell=0;$('#dewExplanation').textContent='驻留时间开始累计。能量持续沉积，同时冷却余量下降。';dewTimer=setInterval(()=>{dwell+=.2;$('#dewDwell').textContent=`${dwell.toFixed(1)} s`;$('#dewCooling').textContent=`${Math.max(64,92-Math.round(dwell*7))}%`;if(dwell>=3.8){clearInterval(dewTimer);$('[data-dew-step="dwell"]').classList.replace('active','done');stage.classList.add('intercepted');$('#dewRunBtn').disabled=false;$('#dewRunBtn').textContent='重新演示';$('#dewExplanation').textContent='目标失效。真正关键的不是“光出现了”，而是探测、跟踪、稳定照射和散热共同完成了闭环。';beep(940,.22)}},200);return}
    index++;dewTimer=setTimeout(advance,1050)};advance();
}
function renderUavConsole(){
  const airborne=state.uav?.mode==='airborne';const active=airborne?(state.uav?.active||24):0;const coverage=airborne?Math.max(88,BLACKOUT_DATA.scenes[state.scene].coverage):BLACKOUT_DATA.scenes[state.scene].coverage;
  $('#uavMode').textContent=swarmFault?'节点掉线，任务已重组':airborne?'任务中 / AIRBORNE':'待命 / READY';$('#uavActive').textContent=`${swarmFault?23:active} / 24`;$('#uavCoverage').textContent=`${swarmFault?Math.max(84,coverage-4):coverage}%`;$('#uavLink').textContent=airborne?(swarmFault?'91%':'97%'):'--';
  $('#launchUavBtn').disabled=airborne;$('#recallUavBtn').disabled=!airborne;
  $('#simulateUavFaultBtn').disabled=!airborne||swarmFault;
  $('#uavRoster').innerHTML=Array.from({length:24},(_,index)=>{const offline=swarmFault&&index===6;const rerouted=swarmFault&&[5,7,13].includes(index);return`<div class="uav-node ${airborne?'active':''} ${offline?'offline':''} ${rerouted?'rerouted':''}"><i></i><span><b>UAV-${String(index+1).padStart(2,'0')}</b><small>${offline?'链路中断':rerouted?'接管7号搜索区':airborne?['通信中继','区域扫描','目标搜索','热源侦测'][index%4]:'机库待命'}</small></span></div>`}).join('');
}
function openUavConsole(){renderUavConsole();modal('#uavModal')}
function renderIntel(){
  const scene=BLACKOUT_DATA.scenes[state.scene];const cards=[['任务态势',scene.title,scene.objective,scene.progress],['传感器融合','多源数据已接入',`当前数据速率 ${scene.rate}，区域覆盖 ${scene.coverage}%。`,Math.min(100,scene.coverage)],['目标研判',scene.risk==='CRITICAL'?'存在高优先风险':'持续监测中',translateAlert(scene.alert),scene.risk==='CRITICAL'?86:58],['链路健康','联合网络稳定',`定位误差 ${scene.error}，观察员终端 ${state.connected||0} 个。`,state.demoMode?64:93]];
  $('#intelGrid').innerHTML=cards.map(([type,title,copy,value])=>`<article class="intel-card"><span>${type}</span><h3>${title}</h3><p>${copy}</p><div class="intel-meter"><i style="width:${value}%"></i></div></article>`).join('');
}
function openIntel(){renderIntel();modal('#intelModal')}
function setMapLayer(layer){mapLayer=layer;$$('[data-map-layer]').forEach(button=>button.classList.toggle('active',button.dataset.mapLayer===layer));renderMap(BLACKOUT_DATA.scenes[state.scene]);toast(`${{terrain:'地形影像',signal:'信号覆盖',thermal:'热成像',route:'路线规划'}[layer]}图层已启用`)}
function setMapZoom(next){mapZoom=Math.max(0,Math.min(2,next));renderMap(BLACKOUT_DATA.scenes[state.scene])}
function showEntity(id){const detail=ENTITY_DETAILS[id];if(!detail)return;const card=$('#entityCard');card.innerHTML=`<button aria-label="关闭">×</button><span>${detail[0]}</span><b>${detail[1]}</b><small>${detail[2]}</small>`;card.classList.remove('is-hidden');card.querySelector('button').onclick=()=>card.classList.add('is-hidden')}
async function toggleFullscreen(){try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen()}catch(_error){toast('浏览器未允许全屏模式')}}

$$('[data-close]').forEach(button=>button.onclick=closeModals);
$('#enterBtn').onclick=enterOperation;$('#startMissionBtn').onclick=startMission;$('#briefingBtn').onclick=()=>modal('#briefingModal');$('#sceneNavBtn').onclick=()=>{renderSceneNavigation();modal('#sceneNavModal')};$('#uavConsoleBtn').onclick=openUavConsole;$('#intelBtn').onclick=openIntel;$('#mediaBtn').onclick=openMedia;$('#sessionControlBtn').onclick=()=>modal('#sessionControlModal');$('#fullscreenBtn').onclick=toggleFullscreen;
$('#nextBtn').onclick=()=>BlackoutSync.action('next');$('#prevBtn').onclick=()=>BlackoutSync.action('prev');$('#alertBtn').onclick=()=>BlackoutSync.action('alert');$('#techBtn').onclick=()=>openTech(BLACKOUT_DATA.scenes[state.scene].tech);$('#deployBtn').onclick=deploy;$('#pollBtn').onclick=()=>state.poll?.open?BlackoutSync.action('closePoll'):openDecision();$('#helpBtn').onclick=()=>modal('#helpModal');
$('#openPollBtn').onclick=()=>{const pollId=BLACKOUT_DATA.scenes[state.scene].poll;if(pollId)BlackoutSync.action('openPoll',{pollId});renderPoll();toast('观察员终端投票已开启')};
$('#closePollBtn').onclick=()=>{BlackoutSync.action('closePoll');closeModals()};
$('#demoResultBtn').onclick=()=>{const pollId=BLACKOUT_DATA.scenes[state.scene].poll;BlackoutSync.action('demoResult',{pollId,votes:pollId==='ai'?{A:34,B:26}:{A:16,B:44}});renderPoll()};
$('#techDeploy').onclick=deploy;
$('#techNext').onclick=()=>{const tabs=['fiction','reality','principle','limitation'];techTab=tabs[Math.min(3,tabs.indexOf(techTab)+1)];$$('#techTabs button').forEach(button=>button.classList.toggle('active',button.dataset.tab===techTab));renderTech()};
$$('#techTabs button').forEach(button=>button.onclick=()=>{techTab=button.dataset.tab;$$('#techTabs button').forEach(item=>item.classList.toggle('active',item===button));renderTech()});
$('#copyObserver').onclick=async()=>{const info=await BlackoutSync.info();try{await navigator.clipboard.writeText(info.observerUrl);toast('观察员接入地址已复制')}catch(_error){toast(info.observerUrl)}};
$('#checkinContinue').onclick=enterSystemLobby;
$('#copyCheckinUrl').onclick=async()=>{const info=await BlackoutSync.info();try{await navigator.clipboard.writeText(info.observerUrl);toast('观察员接入地址已复制')}catch(_error){toast(info.observerUrl)}};
$('#videoContinueBtn').onclick=()=>openTechnologyDemo(currentVideoTech);
$('#resetTrainingBtn').onclick=resetTrainingSession;$('#shutdownSystemBtn').onclick=shutdownSystem;
$('#exoAssist').oninput=event=>updateExoMetrics(Number(event.target.value));
$('#exoDeployBtn').onclick=()=>{BlackoutSync.action('deploy',{tech:'exo'});toast('外骨骼负重辅助已启用');beep(860,.18);closeModals()};
$('#launchUavBtn').onclick=()=>{swarmFault=false;BlackoutSync.action('launchUav');toast('24机蜂群正在展开');beep(840,.2);setTimeout(renderUavConsole,260)};
$('#simulateUavFaultBtn').onclick=()=>{swarmFault=true;renderUavConsole();$('.map-panel').classList.add('swarm-reallocating');setTimeout(()=>$('.map-panel').classList.remove('swarm-reallocating'),1900);toast('7号节点掉线，邻近节点正在接管搜索区');beep(280,.2,'square')};
$('#recallUavBtn').onclick=()=>{swarmFault=false;BlackoutSync.action('recallUav');toast('无人机群已收到返航指令');beep(420,.16);renderUavConsole()};
$('#dewRunBtn').onclick=runDewDemo;
$('#dewDeployBtn').onclick=()=>{BlackoutSync.action('deploy',{tech:'dew'});toast('定向能防御模块已接入');beep(900,.2);closeModals()};
$$('[data-map-layer]').forEach(button=>button.onclick=()=>setMapLayer(button.dataset.mapLayer));$('#mapZoomIn').onclick=()=>setMapZoom(mapZoom+1);$('#mapZoomOut').onclick=()=>setMapZoom(mapZoom-1);$('#mapZoomReset').onclick=()=>setMapZoom(0);
$$('.map-entity').forEach(entity=>{entity.addEventListener('click',()=>showEntity(entity.dataset.entity));entity.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' ')showEntity(entity.dataset.entity)})});

document.addEventListener('keydown',event=>{
  if(['INPUT','TEXTAREA'].includes(event.target.tagName))return;
  if(event.key==='Escape')return closeModals();if(modalOpen)return;
  if(event.key===' '){event.preventDefault();BlackoutSync.action('next')}
  const key=event.key.toLowerCase();if(key==='p')BlackoutSync.action('prev');if(key==='a')BlackoutSync.action('alert');if(key==='t')openTech(BLACKOUT_DATA.scenes[state.scene].tech);if(key==='v')state.poll?.open?BlackoutSync.action('closePoll'):openDecision();if(key==='d')deploy();if(key==='r')resetTrainingSession();
});
window.addEventListener('hashchange',()=>{const match=location.hash.match(/^#tech-(.+)$/);if(match&&BLACKOUT_DATA.techs[match[1]])openTech(match[1])});
window.addEventListener('blackout-state',event=>render(event.detail));
setInterval(()=>$('#clock').textContent=new Date().toLocaleTimeString('zh-CN',{hour12:false}),1000);

initExo3D();

refreshObserverAccess();
setInterval(()=>{if(!$('#checkin').classList.contains('is-hidden'))refreshObserverAccess()},2000);
BlackoutSync.refresh().then(next=>{
  render(next);
  $('#checkinConnected').textContent=next.connected||0;
  if(next.scene>0){missionEntered=true;$('#checkin').classList.add('is-hidden');$('#boot').classList.add('is-hidden');$('#dashboard').classList.remove('is-hidden')}
  else if(sessionStorage.getItem('b35:checkin')==='done'){$('#checkin').classList.add('is-hidden');$('#boot').classList.remove('is-hidden')}
  const match=location.hash.match(/^#tech-(.+)$/);if(match&&BLACKOUT_DATA.techs[match[1]])openTech(match[1]);
});
