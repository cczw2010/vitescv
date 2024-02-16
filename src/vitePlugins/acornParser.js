import {parse} from "acorn"
import {walk} from "estree-walker"

/**
 * 利用acorn解析vue的script获取关键数据,不支持jsx
 * @param {string} code vue的script源码
 * @param {string} mark 本次的标识名称，用于报错提示
 * @returns ast
 */
export default function(code,mark){
  const ast = parse(code, {ecmaVersion: 2020,sourceType:'module'})
  return transformAst(ast,mark)
}

/**
 * 解析ast文件获取vue的相关信息
 * @param {Object} ast 
 * @param {string} mark 本次的标识名称，用于报错提示
 * @returns Object
 */
function transformAst(ast,mark){
  const result = {}
  walk(ast, {
    enter(node, parent, prop, index) {
      // console.debug(index,prop,node.type,node.key&&node.key.name)
      // 0 body ExportDefaultDeclaration undefined
      // null declaration ObjectExpression undefined
      if(prop=='declaration' && node.type=='ObjectExpression' && parent.type=="ExportDefaultDeclaration"){
        // console.debug(">>>>>>>>>",node.properties) // [async,head data....]
        node.properties.forEach((propItem,i) => {
          // 如果不是最后一个proptype，那么为了包含进去",",结束点为下个proptype之前。
          switch(propItem.key.name){
            case "name":
              if(propItem.value.type!='Literal'){
                console.warn('[app] prop name must be a Literal String:',mark)
              }else{
                result.name =  propItem.value.value
              }
              break;
            case "alias":
              if(propItem.value.type!='Literal' || !propItem.value.value.startsWith("/")){
                console.warn('[app] prop alias must be a Literal String also startsWith "/" :\nFile:',mark)
              }else{
                result.alias =  propItem.value.value
              }
              break;
            case "layout":
              if(propItem.value.type!='Literal'){
                console.warn('[app] layout must be a Literal String :\nFile:',mark)

              }else{
                result.layout = propItem.value.value
              }
              break;
            //默认自动收集其他字面量属性 ,便于用户扩展
            // {type: "Literal"; value: string | boolean | null | number | RegExp;}
            default:
              if(propItem.value.type=='Literal'){
                result[propItem.key.name] = propItem.value.value
              }
              break;
          }
        });
        this.skip()
      }
    },
    // leave(node, parent, prop, index) {
    // }
  })
  return result
}