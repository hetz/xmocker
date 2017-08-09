### 前端mock用工具中间件
#### 介绍
支持：
  类型： database, jsonfile, json
 - 数据库类型支持指定数据库地址，数据库项目ID
 - jsonfile类型支持接口模板数据
 - 输入json数据类型数据，用于少量数据测试

配置参数
 - port: 端口
 - source: type: 'database|jsonfile|json', 数据库id({location: xxx, projectId: xxx, commonProjs: [], jsonData}), 文件地址，json数据
 - inject: html模板注入，参数为文件地址或true(默认注入)
 - linkViews: 快速链接生成，boolean 或数组
 - linkParams: 每条链接Url公有参数
 - proxy404: 404代理地址，代理模式
 - proxyMode: local, server, mix
 - proxyRules: 代理规则
 - staticPaths: 静态资源地址
方法
 - reconfig: 重设部分参数
 - refresh: function, 页面刷新接口
 - setLinkViews: 快速链接设定，boolean
 - setApiReturn: 接口控制，固定值，抛异常，指定分支
 - getApiReturns: 返回所有被指定接口控制状态
 - setProxyMode: 状态
 - reloadApis: 数据重载接口，Json数据，jsonfile, 数据库
 - exit: 退出
 - start: 启动
 - restart: 停止
event
 - 