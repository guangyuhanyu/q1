/* ====== ĐĂNG NHẬP BẰNG MÃ HỌC VIÊN (dùng chung cho trang chủ và các trang bài) ====== */
(function(){
  var C = window.GY_COURSE || 'gy';
  var LS_DEV = 'gy-' + C + '-dev', LS_SES = 'gy-' + C + '-session';
  function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function lsSet(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }
  function lsDel(k){ try{ localStorage.removeItem(k); }catch(e){} }
  function deviceId(){
    var d = lsGet(LS_DEV);
    if(!d){
      var a = new Uint8Array(8); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach(function(_, i){ a[i] = Math.random() * 256; });
      d = Array.from(a, function(b){ return ('0' + b.toString(16)).slice(-2); }).join('');
      lsSet(LS_DEV, d);
    }
    return d;
  }
  function deviceLabel(){
    var u = navigator.userAgent || '';
    var os = /iPhone/.test(u) ? 'iPhone' : /iPad/.test(u) ? 'iPad' : /Android/.test(u) ? 'Android' : /Mac OS X/.test(u) ? 'Mac' : /Windows/.test(u) ? 'Windows' : 'Khác';
    var br = /Edg\//.test(u) ? 'Edge' : /CriOS|Chrome\//.test(u) ? 'Chrome' : /FxiOS|Firefox\//.test(u) ? 'Firefox' : /Safari\//.test(u) ? 'Safari' : 'Trình duyệt';
    return os + ' · ' + br;
  }
  function today(){ var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function session(){
    var s = null; try{ s = JSON.parse(lsGet(LS_SES) || 'null'); }catch(e){}
    if(!s || !s.code) return null;
    s.expired = !!(s.exp && s.exp < today());
    return s;
  }
  function cleanCode(c){ return String(c || '').replace(/\D/g, ''); }
  var ERR = {
    notfound: 'Mã học viên không đúng. Bạn kiểm tra lại 8 chữ số nhé.',
    expired:  'Mã học viên đã hết hạn sử dụng. Bạn liên hệ thầy để gia hạn nhé.',
    locked:   'Mã học viên đang bị tạm khóa. Bạn liên hệ thầy nhé.',
    nodate:   'Mã học viên chưa được kích hoạt. Bạn liên hệ thầy nhé.',
    missing:  'Bạn nhập mã học viên (8 chữ số) nhé.',
    network:  'Không kết nối được máy chủ. Bạn kiểm tra mạng rồi thử lại nhé.',
    config:   'Trang chưa được cài đặt máy chủ kiểm tra mã. Bạn báo thầy nhé.'
  };
  function message(err){ return ERR[err] || ('Có lỗi: ' + err); }
  function login(code){
    code = cleanCode(code);
    if(!code) return Promise.resolve({ ok:false, error:'missing' });
    if(!window.GY_SCRIPT_URL) return Promise.resolve({ ok:false, error:'config' });
    var url = window.GY_SCRIPT_URL + '?code=' + encodeURIComponent(code) + '&dev=' + encodeURIComponent(deviceId()) +
              '&label=' + encodeURIComponent(deviceLabel()) + '&t=' + Date.now();
    return fetch(url, { cache:'no-store' }).then(function(r){ return r.json(); }).then(function(j){
      if(j && j.ok){
        lsSet(LS_SES, JSON.stringify({ code:code, name:j.name, exp:j.expires, lessons:j.lessons || [], keys:j.keys || {}, ts:Date.now() }));
      } else if(j && (j.error === 'notfound' || j.error === 'expired' || j.error === 'locked' || j.error === 'nodate')){
        var s = session(); if(s && s.code === code) lsDel(LS_SES);    // mã cũ không còn dùng được → xóa phiên
      }
      return j || { ok:false, error:'network' };
    }).catch(function(){ return { ok:false, error:'network' }; });
  }
  function refresh(){ var s = session(); return s ? login(s.code) : Promise.resolve(null); }
  function logout(){ lsDel(LS_SES); }
  function keyFor(unit){ var s = session(); return (s && !s.expired && s.keys && s.keys[unit]) || null; }
  window.GY = { session:session, login:login, refresh:refresh, logout:logout, keyFor:keyFor, message:message, cleanCode:cleanCode };
})();
