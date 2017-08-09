'use strict'
const assert = require('assert')
const path = require('path')
const http = require('http')
const sendFile = require('../plugin/file-server')
const htmlInject = require('../util/file-server-inject')
const log = require('../middleware/log')

module.exports = {
  startServerByDataBase,
}
async function findAppBase (db) {
  try {
    return await db.appBase.cfindOne({}).exec()
  } catch (e) {
    console.log(e)
    return
  }
}

async function findProjectById (db, projectId) {
  try {
    return await db.project.cfindOne({ _id: projectId }).exec()
  } catch (e) {
    console.log(e)
    return
  }
}

async function startServerByDataBase (app, option) {
  assert(option.source.projectId, 'projectId must be provided')

  const db = require('../database').init(option).dbs
  let appConfig = await findAppBase(db) || {}
  let proj = await findProjectById(db, option.source.projectId)
  assert(proj, 'project is not found: ' + option.source.projectId)

  if (option.source && option.source.common && option.source.common.length > 3) {
    process.emitWarning('common db too much will cause slow reaction and higher memory used')
  }

  const gInfo = global.serverInfo
  let finalOption = getOptionFromProj(proj)
  finalOption.mainPort = appConfig.mainPort || 6001
  Object.assign(gInfo.option, finalOption, option)
  gInfo.option.source.projectName = proj.name
  let server = await startupServer(app, option)
  return server
}

async function startupServer (app, option = {}) {
  return new Promise((resolve, reject) => {
    app.use(log())

    // proxy
    app.use(require('../middleware/proxyTo').proxyToGlobal({
      status: 404,
      error: log.toError,
      deal: log.logProxy,
    }))

    // proxy
    if (option.proxyTable && option.proxyTable.length) {
      app.use(require('../middleware/proxyTo').setProxyGlobal({
        status: 404,
        error: log.toError,
        deal: log.logProxy,
      }))
    }

    // static server
    if (option.staticPaths) {
      option.staticPaths.forEach((dir) => {
        let absDir = dir.trim()
        if (option.root && !path.isAbsolute(absDir)) {
          absDir = path.join(option.root, absDir)
        }

        app.use(async function (ctx, next) {
          return next().then(sendFile(ctx, ctx.path, {
            root: absDir,
            index: 'index.html',
            serverOption: option,
            plugin: htmlInject,
          }))
        })
      })
    }

    app.use(require('../router.js')(option).routes())

    // 建立是的监听及server
    const httpServer = http.createServer(app.callback())

    const WebSocket = require('ws')
    // 建立 websocket 服务
    const wss = new WebSocket.Server({ server: httpServer })
    const wsctrl = require('./controller.ws.js')
    wsctrl.init(wss)

    httpServer.listen(option.port, function (e) {
      resolve()
    })
    global.serverInfo.server = httpServer
    resolve()
    // setting dafault link
    require('./controller.inject').setLinkData()
    return httpServer
  })
}

function getOptionFromProj (proj, source = {}) {
  let op = {
    port: proj.port,
    root: proj.path.trim(),
    proxy404: proj.proxyTo,
    proxyMode: proj.proxyType || 0,
    linkViews: proj.urls,
    inject: proj.injectHtml,
    staticPaths: proj.staticPath || [],
    proxyTable: proj.proxyTable || [],
  }

  // add default static path
  if (op.root) {
    let gulp = proj.gulp || {}
    let gulpPath = (gulp.buildPath || '').trim()
    if (gulpPath) {
      op.staticPaths.unshift(path.join(op.root, gulp.buildPath.trim()))
    } else {
      op.staticPaths.unshift(op.root)
    }
  }

  return op
}
