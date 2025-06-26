#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import clipboardy from 'clipboardy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const indexPath = path.join(__dirname, '../index.js');
const indexContent = fs.readFileSync(indexPath, 'utf-8');

// 判断是否是 -h 参数
const isHelp = process.argv.includes('-h') || process.argv.includes('--help');
const usage = `使用方法：

监听对象:
targetObj = watchObj(targetObj, 'targetName', {
  get: {
    log: true,
    debugger: function(){ .. },
  },
  set: {
    log: (content) => content.property === 'age',
    debugger: function(content){ .. },
    onModResult: function(content){ .. },
  },
  ownKeys: null, // 表示不监听ownKeys
});

取消对象监听：
targetObj = unwatchObj(targetObj);

动态修改配置:
watchObj.getConfig(targetObj, 'get').log = false;
watchObj.getConfig(targetObj, 'get').debugger = false;
watchObj.getConfig(targetObj, 'get').onModResult = function(content){};
`;
if(isHelp){
  console.log(usage);
  process.exit(0);
}

const executableCode = indexContent
  .replace(/export\s*\{[^}]+\};?/g, '')

clipboardy.writeSync(executableCode);
console.log('✅ watchObj Code has been copied to the clipboard.');