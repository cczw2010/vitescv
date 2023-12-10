// 在 Node.js 端使用 Buffer 进行编解码
// 在浏览器端使用 btoa 和 atob 进行编解码


// 编码
export function encode64(data) {
  if(import.meta.env.SSR){
    return Buffer.from(data).toString('base64');
  }else{
    return btoa(data);
  }
}

// 解码
export function decode64(encodedData) {
  if(import.meta.env.SSR){
    return Buffer.from(encodedData, 'base64').toString();
  }else{
    try{
      return atob(encodedData);
    }catch(e){
      return null
    }
  }
}