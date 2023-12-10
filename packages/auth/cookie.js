// cookie处理类，前后端通用
// 过期时间依托于环境变量 VITE_TTL_AUTH（分钟） 默认 30分钟
const SESSION_ID_COOKIE_NAME='__app_session_id'
const KEY_COOKIE = '__app_'

class Cookie{
  constructor(){
    this.option = {
      ttl:parseInt(import.meta.env.VITE_TTL_AUTH??30), //0也有效
    }
    this.uniqueId =  this.get(SESSION_ID_COOKIE_NAME)
    // 初始化  uniquId | session_id
    if(!this.uniqueId){
      this.uniqueId = getUuid();
    }
    // 更新
    this.set(SESSION_ID_COOKIE_NAME,this.uniqueId)
  }
  // 设置
  set(key,val,ttl,option){
    ttl = ttl||this.option.ttl
    // csr
    let date=new Date();
    let expires = 'Session'
    if(!val){
      ttl = -1
    }
    if(ttl){
      date.setMinutes(date.getMinutes()+ttl)
      expires = date.toUTCString()
    }
    let cookie=key+'='+val||'';
    cookie+=';path=/;expires='+expires;
    document.cookie=cookie;
  }
  // 获取
  get(key){
    // csr
    const cookies = document.cookie.split('; ')
    for (const item of cookies) {
      const cookie = item.split('=')
      if (cookie[0] == key) {
        return cookie[1]
      }
    }
    return null
  }
  /**
   * 客户端同步公共信息到服务器端,不宜过长，仅用于一些公共设置，比如语言等,注入为Vue的全局mixin
   * 原理：
   * XMLHttpRequest中增加了公共参数头的注入，直接请求的url本身并不会走ajax，所以也做了cookie支持
   * 1 服务器端获取程序公共参数（从cookie中） 
   * 2 客户端设置公共信息，(ajax请求的时候自动带上)
   */
  setSharedConfig(key,val){
    let cookies = this.get(KEY_COOKIE)
    cookies = cookies?decodeVal(cookies):{}
    cookies[key] = val
    this.set(KEY_COOKIE,encodeVal(cookies))
  }
  getSharedConfig(key){
    let cookies = this.get(KEY_COOKIE)
    cookies = cookies?decodeVal(cookies):{}
    return cookies[key]||null
  }
}

/**
 * 生成Cookie对象
 */
export default function(){
  return new Cookie()
}

function getUuid() {
  return 'xxxxxxxy-yxxx-'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16)
  })+Date.now();
}
// 编码值
function encodeVal(val){
  return encodeURIComponent(JSON.stringify(val||''))
}
// 解码值
function decodeVal(val){
  if(val){
    return JSON.parse(decodeURIComponent(val))
  }
  return ''
}