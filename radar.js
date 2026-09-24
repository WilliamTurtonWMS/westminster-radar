/* Static raster tiles only: no mapping library, animation, controls, or API key. */
(function () {
  'use strict';
  var API = 'https://api.rainviewer.com/public/weather-maps.json';
  var BASEMAP = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  var CENTER = [33.847, -84.428]; // Approximate Westminster campus / Buckhead.
  var places = [
    ['Westminster',33.84429,-84.43615] // Campus at 1424 West Paces Ferry Road NW.
  ];
  var map = document.getElementById('map');
  var timestamp = document.getElementById('timestamp');
  var status = document.getElementById('status');
  var frame = null, host = '', generation = 0, baseOK = false, radarOK = false;
  var apiFailed = false, busy = false, layout;
  function world(lat,lon) {
    var sin = Math.sin(lat*Math.PI/180);
    return [(lon+180)/360, .5-Math.log((1+sin)/(1-sin))/(4*Math.PI)];
  }
  function geometry() {
    var c = world(CENTER[0],CENTER[1]);
    // Symmetric extent about campus; includes the airport and Alpharetta with margins.
    var halfY = Math.max(Math.abs(world(34.14,0)[1]-c[1]),Math.abs(world(33.55,0)[1]-c[1]));
    var halfX = .40/360;
    var scale = Math.min(map.clientWidth/(halfX*2),map.clientHeight/(halfY*2));
    return {scale:scale,left:c[0]-map.clientWidth/scale/2,top:c[1]-map.clientHeight/scale/2,
      width:map.clientWidth,height:map.clientHeight};
  }
  function formatTime(t) {
    return new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(new Date(t*1000));
  }
  function report() {
    var warnings = [];
    if (!baseOK) warnings.push('Basemap unavailable or still loading');
    if (apiFailed) warnings.push('Radar update unavailable');
    if (!radarOK) warnings.push('Radar unavailable or still loading');
    if (frame && radarOK) {
      timestamp.textContent = 'Radar frame • '+formatTime(frame.time);
      if (Date.now()/1000-frame.time > 1800) warnings.push('Radar delayed — more than 30 minutes old');
    } else timestamp.textContent = apiFailed ? 'Radar currently unavailable' : 'Loading latest radar…';
    status.textContent = warnings.join(' • ');
    document.body.dataset.radarState = baseOK && radarOK && !apiFailed ? 'ready' : 'degraded';
  }
  function tiles(target,z,url,g) {
    var group = document.createElement('div'); group.className='layer';
    var count = Math.pow(2,z), size = layout.scale/count;
    var startX = Math.floor(layout.left*count), startY = Math.floor(layout.top*count);
    var endX = Math.ceil((layout.left+layout.width/layout.scale)*count);
    var endY = Math.ceil((layout.top+layout.height/layout.scale)*count);
    var jobs = [];
    for(var x=startX;x<endX;x++) for(var y=startY;y<endY;y++) {
      (function(x,y){ jobs.push(new Promise(function(resolve){
        var img = new Image(), done = false;
        var timer = setTimeout(function(){finish(false);},12000);
        function finish(ok){if(done)return;done=true;clearTimeout(timer);img.onload=img.onerror=null;resolve(ok);}
        img.className='tile';img.alt='';img.draggable=false;
        img.style.cssText='left:'+((x/count-layout.left)*layout.scale)+'px;top:'+((y/count-layout.top)*layout.scale)+'px;width:'+(size+.3)+'px;height:'+(size+.3)+'px';
        img.onload=function(){finish(true);};img.onerror=function(){finish(false);};
        img.src=url.replace('{z}',z).replace('{x}',x).replace('{y}',y);
        group.appendChild(img);
      })); })(x,y);
    }
    return Promise.all(jobs).then(function(results){
      if(g!==generation)return false;
      var ok=results.length>0 && results.every(function(v){return v;});
      // Never show a partial radar layer, which could falsely suggest clear conditions.
      target.textContent='';if(ok)target.appendChild(group);
      return ok;
    });
  }
  function drawRadar(g) {
    if(!frame)return Promise.resolve();
    radarOK=false;
    return tiles(document.getElementById('radar'),7,host+frame.path+'/512/{z}/{x}/{y}/2/1_0.png',g)
      .then(function(ok){if(g===generation){radarOK=ok;report();}});
  }
  function render() {
    var g=++generation;layout=geometry();baseOK=false;radarOK=false;
    document.getElementById('radar').textContent='';
    var labels=document.getElementById('labels');labels.textContent='';
    places.forEach(function(p){var pos=world(p[1],p[2]);var el=document.createElement('span');
      el.className='place school';
      el.setAttribute('aria-label','Westminster — 1424 West Paces Ferry Road NW');
      el.innerHTML='<svg class="map-pin" viewBox="0 0 28 36" aria-hidden="true"><path d="M14 35C11 30 1 21 1 14a13 13 0 0 1 26 0c0 7-10 16-13 21Z" fill="#126b65" stroke="white" stroke-width="2"/><circle cx="14" cy="14" r="4.5" fill="white"/></svg><span class="pin-label">Westminster</span>';
      el.style.left=((pos[0]-layout.left)*layout.scale)+'px';el.style.top=((pos[1]-layout.top)*layout.scale)+'px';labels.appendChild(el);
    });
    var baseZoom=Math.min(11,Math.max(1,Math.floor(Math.log(layout.scale/256)/Math.LN2)));
    tiles(document.getElementById('basemap'),baseZoom,BASEMAP,g).then(function(ok){if(g===generation){baseOK=ok;report();}});
    drawRadar(g);report();
  }
  function refresh() {
    if(busy)return;busy=true;
    var request=new XMLHttpRequest();request.open('GET',API,true);request.timeout=12000;
    function fail(){busy=false;apiFailed=true;report();}
    request.onerror=request.ontimeout=fail;
    request.onload=function(){
      try {
        if(request.status!==200)throw new Error('API status');
        var data=JSON.parse(request.responseText);
        if(!/^https:\/\/[a-z0-9.-]+\.rainviewer\.com\/?$/i.test(data.host))throw new Error('Invalid tile host');
        var frames=data.radar.past.filter(function(f){return Number.isFinite(f.time) && f.time>0 && f.time<=Date.now()/1000+300 && /^\/v2\/radar\/[a-z0-9/_-]+$/i.test(f.path);});
        frames.sort(function(a,b){return b.time-a.time;});
        if(!frames.length)throw new Error('No past frames');
        var next=frames[0];var changed=!frame || next.path!==frame.path || data.host!==host;
        frame=next;host=data.host.replace(/\/$/,'');apiFailed=false;busy=false;
        if(changed || !radarOK)drawRadar(generation);report();
      }catch(e){fail();}
    };
    request.send();
  }
  render();refresh();
  // Update a persistent live player as well as Carousel's periodic snapshots; no animation.
  setInterval(refresh,5*60*1000);setInterval(report,60*1000);
  var resizeTimer;window.addEventListener('resize',function(){clearTimeout(resizeTimer);resizeTimer=setTimeout(render,250);});
})();
