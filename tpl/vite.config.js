// 从这里作为入口是为了方便监控和预留用户自定义vite.cofnig.js
import defaultViteConfig  from "vitescv/viteconfig"
import userConfig from "../config.js"
export default  defaultViteConfig(userConfig)