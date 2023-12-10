/**
 * Header处理对象
 * 借助localStorage和XMLHttpRequest的HEAD实现前后端同步信息. 并作了持久化
 * 服务端设置的head会自动同步到客户端，客户端设置的会自动在AJAX请求的时候发送到服务端，服务端可以获取设置的信息
 * 但是因为基于ajax，所以正常访问网页时，只能同步获取历史设置的信息，ssr渲染时设置的head无效， 建议
 **/ 
import {KEY_HEAD_PREFIX,encodeVal,decodeVal} from "./common.js"
import Storage from "./storage-client.js"
export const KEY_STORAGE = '__app_'

const Header = {option:{ttl:30},ssrContent:null,items:{}}

function getHeadKey(key){
  return KEY_HEAD_PREFIX+key
}
function resolveHeadKey(headKey){
  if(headKey.startsWith(KEY_HEAD_PREFIX)){
    return headKey.replace(KEY_HEAD_PREFIX,'')
  }
  return null
}

if(import.meta.env.SSR){
  Header.set = function(key,val){
    const headKey = getHeadKey(key)
    if(this.ssrContent){
      this.ssrContext.append(headKey, encodeVal(val));
    }
  },
  Header.get = function(key){
    const headKey = getHeadKey(key)
    if(this.ssrContent){
      const val = this.ssrContext.headers[headKey]
      if(val){
        return decodeVal(val)
      }
    }
    return null
  }
  // request时初始化
  for(const headKey in this.ssrContext.headers){
      const parts = line.split(': ');
      const key = resolveHeadKey(headKey)
      if(key){
        Header.set(key,parts[1])
      }
  }
}else{
  Header.set = function(key,val){
    const headKey = getHeadKey(key)
    Storage.set(headKey,val)
    if(val){
      Header.items[key]=val
    }else{
      delete Header.items[key]
    }
    Storage.set(KEY_STORAGE,Object.keys(Header.items))
  }
  Header.get = function(key){
    const headKey = getHeadKey(key)
    return Storage.get(headKey)
  }
  // 初始化keys
  const keys = Storage.get(KEY_STORAGE)||[]
  keys.forEach(key=>{
    Header.items[key] = Header.get(key)
  })

  // 重写xmlHttpRequest，处理自动带着header和cookie
  const oldOpen = XMLHttpRequest.prototype.open
  XMLHttpRequest.prototype.open = function(...arg){
    const that = this    
    oldOpen.call(that,...arg)
    // 加载所有的本地header到ajax请求中
    for(const key in Header.items){
      if(Header.items[key]){
        that.setRequestHeader(getHeadKey(key),Header.items[key])
      }
    }
    // cookie
    that.withCredentials = true
  }
  // 重写XMLHttpRequest的onreadystatechange, 请求返回的时候自动处理带着的header
  const oldOnreadystatechange = XMLHttpRequest.prototype.onreadystatechange
  XMLHttpRequest.prototype.onreadystatechange = function(...arg){
    const that = this
    if(that.readyState === XMLHttpRequest.DONE && that.status === 200) { //HEADERS_RECEIVED
      let headers = that.getAllResponseHeaders()
      // 将ajax中返回的通过本类设置的head取出来初始化
      headers = headers.trim().split(/[\r\n]+/);
      headers.forEach(line => {
        const parts = line.split(': ');
        const key = resolveHeadKey(parts[0])
        if(key){
          Header.set(key,parts[1])
        }
      })
    }
    oldOnreadystatechange.call(that,...arg)
  }
}

/**
 * @param {object} option
 *                   ttl:30, //minutes
 * @param {object} ssrContext  server端时的koa对象
 */
export default function(option,ssrContent){
  Header.option = Object.assign(Header.option,option)
  Header.ssrContent = ssrContent
  return Header
}