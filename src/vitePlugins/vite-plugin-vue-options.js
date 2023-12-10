import {resolve} from "path"
import minimatch from "minimatch"
import { normalizePath } from 'vite'
import {parseComponent as parseSFC} from "vue/compiler-sfc"
import {parse as acornParse} from "acorn"
import MagicString from "magic-string"
import {walk} from "estree-walker"

/**
 * 将通过minimatch匹配的vue文件，注入对应的options
 * @param {array} options 配置对象数组，所有路径都是相对于项目根目录
 *          [{
 *            include:"src/pages/*.vue", //包含文件正则
 *            exclude:null,              //忽略文件正则，默认null，
 *            options:{},                //要注入的vm.$options的对象
 *          }] 
 * @returns 
 */
export default function (options) {
  let transformer 
  return {
    name: 'vite-plugin-vue-options',
    enforce: 'pre',
    configResolved(resolvedConfig) {
      transformer = new Transformer(options)
    },
    transform(source,id){
      const result = transformer.transform(id,source)
      return result||source
    }
  }
}

/**
 *代码注入转换类
 *
 * @class Transformer
 */
class Transformer{
  constructor(options){
    options = options||[]
    this.options = options.map(optionItem=>{
      optionItem.include = optionItem.include && normalizePath(resolve(optionItem.include))
      optionItem.exclude = optionItem.exclude && normalizePath(resolve(optionItem.exclude))
      return optionItem
    })
  }

  // 获取与当前页面地址相匹配的配置信息，返回匹配的对象合并集合
  _getMatched(id){
    let matched = {}
    this.options.forEach(optionItem => {
      if(optionItem.options && minimatch(id,optionItem.include) 
        && (!optionItem.exclude || !minimatch(id,optionItem.exclude) )){
          Object.assign(matched,optionItem.options)
      }
    });
    // console.debug(id,matched)
    return matched
  }
  /**
   *根据获取的注入信息，注入js代码，返回转换后的源码
   *
   * @param {string} id      文件id  (全路径)
   * @param {string} source  文件源码
   * @returns code || null
   * @memberof Transformer
   */
  transform(id,source){
    const matched = this._getMatched(id)
    if(Object.keys(matched).length==0){
      return null
    }
    let content = ''
    let injectCode=''
    const sfc = parseSFC(source);
    //====1 组装代码
    for(const key in matched){
      injectCode+=key+':'+JSON.stringify(matched[key])+','
    }
    // console.debug(sfc,matched)
    //====2 init source
    if(sfc.script && sfc.script.content.trim()){
      content+=sfc.script.content
    }else{
      content+='export default {}'
    }
    //====2 ast track and modify
    const ast = acornParse(content, {ecmaVersion: 2020,sourceType:'module'})
    let s = new MagicString(content)
    walk(ast, {
      enter(node, parent, prop, index) {
        if(prop=='declaration' && node.type=='ObjectExpression' && parent.type=="ExportDefaultDeclaration"){
          // 3 prepend inject 
          s.appendRight(node.start+1,injectCode)
          this.skip()
        }
      },
      // leave(node, parent, prop, index) {
      // }
    })
    // ==== 4 组织最终代码
    const scriptContent =s.toString()
    let dst
    if(sfc.script){
      dst = source.split('')
      dst.splice(sfc.script.start,sfc.script.end-sfc.script.start,scriptContent)
      dst = dst.join('')
    }else{
      dst = source+`<script>${scriptContent}</script>`
      // log("no script:",dst)
    }
    return dst
  }
}