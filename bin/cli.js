#!/usr/bin/env node

"use strict"
import { resolve } from "path"
import { existsSync,copyFileSync,constants as FsConstants,mkdirSync,rmSync} from "fs"
import { fileURLToPath } from "url"
import { createServer as createViteServer,build,preview} from 'vite'
// import chokidar from "chokidar";
// 项目根目录
process.env.__PROJECTROOT = process.cwd()
// 项目中vitescv的项目文件
process.env.__PROJECTCACHEROOT = resolve('./.vitescv')
// process.env.__PROJECTCACHEROOT = resolve(process.env.__PROJECTROOT,'node_modules','.vitescv')
// vitescv 根目录
process.env.__VITESCVROOT = fileURLToPath(new URL("../",import.meta.url))
// process.env.__VITESCVROOT = resolve(process.env.__PROJECTROOT,'node_modules','vitescv')

const viteConfigPath = resolve(process.env.__PROJECTCACHEROOT,'vite.config.js')
const isInit = existsSync(process.env.__PROJECTCACHEROOT)

switch (process.argv[2]) {
  case "init":
    cliInit()
    break;
  case "build":
    process.env.NODE_ENV = "production"
    cliBuild()
    break;
  case "preview":
    cliPreview()
    break;
  case "dev":
  case undefined:
    process.env.NODE_ENV = "development"
    cliDev()
    break;
}


// 开发模式
async function cliDev() {
  if(!isInit){
    console.warn('[vitescv] please init project with: npx vitescv init')
    return
  }
  const server = await createViteServer({
    mode: 'development',
    configFile: viteConfigPath,
    envFile:true,
  })
  await server.listen()
  server.printUrls()
  // server.bindCLIShortcuts({ print: true })
}
// 编译项目
async function cliBuild() {
  if(!isInit){
    console.warn('[vitescv] please init project with: npx vitescv init')
    return
  }
  await build({
    configFile: viteConfigPath,
  })
}
// 预览项目
async function cliPreview() {
  if(!isInit){
    console.warn('[vitescv] please init project with: npx vitescv init')
    return
  }
  const previewServer = await preview({
    configFile: viteConfigPath,
  })
  previewServer.printUrls()
}
// 初始化项目
async function cliInit() {
  // tpl,项目运行时文件， 用于 init
  const tplPath = resolve(process.env.__VITESCVROOT,"tpl")
  const tplFiles = {
      entry:'entry.js',
      index:'index.html',
      viteConfig:'vite.config.js',
    }
  //  用户个性化配置文件
  const userConfigFile = "config.js"

  //1 判断是否没有初始化过,有一个文件也不行
  if(isInit){
    console.warn('[vitescv] This is not empty vitescv project! please remove the [.vitescv] folder in the root!')
    return false
  }
  //2 创建一个基于项目的文件夹和文件
  try{
    mkdirSync(process.env.__PROJECTCACHEROOT,{recursive:true})
    for (const k in tplFiles) {
      let fpath = resolve(process.env.__PROJECTCACHEROOT,tplFiles[k])
      copyFileSync(resolve(tplPath, tplFiles[k]),fpath,FsConstants.COPYFILE_FICLONE)
    }
    let userConfigFileDst = resolve(process.env.__PROJECTROOT, 'config.js')
    if(existsSync(userConfigFileDst)){
      console.warn('[vitescv] config.js is exist, pass.')
    }else{
      copyFileSync(resolve(tplPath, userConfigFile),userConfigFileDst,FsConstants.COPYFILE_FICLONE)
    }
    console.warn('[vitescv] init success')
  }catch(e){
    console.warn('[vitescv] init error:',e.message)
    rmSync(process.env.__PROJECTCACHEROOT,{ recursive: true, force: true })
  }
}