# WatchObj - 高度可定制的对象监控工具

一个功能强大的 JavaScript 对象监控工具，支持函数参数修改、返回值修改、函数替换、属性访问自定义等高级功能。基于 Proxy 实现，提供类似 Frida 的拦截能力。

## ✨ 核心特性

- 🎯 **高度可定制**: 支持函数参数修改、返回值修改、完全函数替换
- 🔍 **属性访问控制**: 自定义属性访问逻辑，甚至无需访问原始值
- 🪝 **丰富的钩子系统**: 提供 before/after 钩子，支持全局拦截器
- 🐛 **智能调试**: 支持条件断点，精确控制调试时机
- ⚡ **性能监控**: 内置函数执行时间统计和性能分析
- 🔄 **向后兼容**: 完全兼容旧版本 API
- 🚀 **零依赖**: 纯 JavaScript 实现，轻量高效
- 📝 **代码生成**: 自动生成监控代码，方便集成

## 📦 安装

```bash
npm install watch-obj
```

## 🚀 快速开始

### 基础监控

```javascript
import { watch, unwatch } from 'watch-obj';

// 监控对象的所有操作
const obj = { name: 'test', getValue: () => 42 };
const proxy = watch(obj, {
  onGet: (context) => {
    console.log(`访问属性: ${context.property}`);
  },
  onCall: (context) => {
    console.log(`调用函数: ${context.property}`);
  }
});

proxy.name; // 触发 onGet
proxy.getValue(); // 触发 onCall

// 取消监控
const original = unwatch(proxy);
```

### 函数参数和返回值修改

```javascript
// 修改函数参数
const api = {
  request: (url, options) => fetch(url, options)
};

const monitoredApi = watch(api, {
  modifyArgs: (context) => {
    if (context.property === 'request') {
      // 自动添加认证头
      const [url, options = {}] = context.arguments;
      options.headers = {
        ...options.headers,
        'Authorization': 'Bearer token123'
      };
      return [url, options];
    }
    return context.arguments;
  },
  
  modifyResult: (context) => {
    if (context.property === 'request') {
      // 包装返回结果
      return context.result.then(response => ({
        data: response,
        timestamp: Date.now()
      }));
    }
    return context.result;
  }
});

// 现在所有请求都会自动添加认证头，返回结果会包含时间戳
monitoredApi.request('/api/data');
```

### 完全函数替换

```javascript
const calculator = {
  add: (a, b) => a + b,
  multiply: (a, b) => a * b
};

const enhancedCalculator = watch(calculator, {
  replaceFunction: (context) => {
    if (context.property === 'add') {
      // 完全替换 add 函数，添加日志功能
      return function(a, b) {
        console.log(`计算: ${a} + ${b}`);
        const result = a + b;
        console.log(`结果: ${result}`);
        return result;
      };
    }
    // 其他函数保持原样
  }
});

enhancedCalculator.add(2, 3); // 会输出日志
enhancedCalculator.multiply(2, 3); // 正常执行
```

### 自定义属性访问

```javascript
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
};

const smartConfig = watch(config, {
  interceptGet: (context) => {
    if (context.property === 'apiUrl') {
      // 根据环境动态返回不同的 URL
      return process.env.NODE_ENV === 'development' 
        ? 'https://dev-api.example.com'
        : 'https://api.example.com';
    }
    // 返回 undefined 表示使用默认行为
  },
  
  interceptSet: (context) => {
    if (context.property === 'timeout') {
      // 限制超时时间范围
      const value = Math.max(1000, Math.min(30000, context.newValue));
      context.target[context.property] = value;
      return true; // 表示已处理
    }
    // 返回 undefined 表示使用默认行为
  }
});

console.log(smartConfig.apiUrl); // 根据环境返回不同 URL
smartConfig.timeout = 50000; // 会被限制为 30000
```

## 🔧 高级功能

### 条件拦截

```javascript
const user = {
  name: 'Alice',
  password: 'secret123',
  email: 'alice@example.com'
};

const secureUser = watch(user, {
  shouldIntercept: (context) => {
    // 只拦截敏感属性的访问
    return ['password', 'email'].includes(context.property);
  },
  
  onGet: (context) => {
    console.log(`警告: 访问敏感属性 ${context.property}`);
  },
  
  debug: (context) => {
    // 只在访问密码时触发断点
    return context.property === 'password';
  }
});

secureUser.name; // 不会触发拦截
secureUser.password; // 触发拦截和断点
```

### 性能监控

```javascript
import { watchPerformance } from 'watch-obj';

const service = {
  fetchData: async () => { /* 模拟异步操作 */ },
  processData: (data) => { /* 处理数据 */ }
};

const monitoredService = watchPerformance(service, {
  onPerformanceUpdate: (key, stats, context) => {
    console.log(`${key}: 平均耗时 ${stats.avgTime.toFixed(2)}ms, 调用次数 ${stats.count}`);
  }
});

// 自动统计每个方法的执行时间
await monitoredService.fetchData();
monitoredService.processData({});
```

### 全局拦截器

```javascript
import { watchManager } from 'watch-obj';

// 添加全局拦截器，监控所有被 watch 的对象
watchManager.addGlobalInterceptor((phase, context) => {
  if (phase === 'before' && context.type === 'apply') {
    console.log(`全局监控: 即将调用函数 ${context.property}`);
  }
});

// 现在所有被监控的对象都会触发全局拦截器
const obj1 = watch({ method1: () => {} });
const obj2 = watch({ method2: () => {} });

obj1.method1(); // 触发全局拦截器
obj2.method2(); // 也触发全局拦截器
```

## 🛠️ 专用监控器

### 函数监控器

```javascript
import { watchFunction } from 'watch-obj';

function expensiveCalculation(n) {
  // 模拟耗时计算
  return n * n;
}

const monitoredFn = watchFunction(expensiveCalculation, {
  enableTiming: true,
  onAfter: (context) => {
    console.log(`函数执行耗时: ${context.duration}ms`);
  }
});

monitoredFn(1000); // 自动记录执行时间
```

### 属性监控器

```javascript
import { watchProperties } from 'watch-obj';

const state = {
  count: 0,
  name: 'test',
  data: {}
};

// 只监控特定属性
const monitoredState = watchProperties(state, ['count', 'name'], {
  onSet: (context) => {
    console.log(`状态变更: ${context.property} = ${context.newValue}`);
  }
});

monitoredState.count = 1; // 触发监控
monitoredState.data = {}; // 不触发监控
```

## 📝 代码生成工具

```javascript
import { CodeGenerator } from 'watch-obj';

// 生成监控代码
const watchCode = CodeGenerator.generateWatchCode('myObject', {
  onCall: (context) => console.log('函数调用:', context.property)
});
console.log(watchCode);
// 输出: myObject = watch(myObject, { "onCall": ... });

// 生成函数替换代码
const replaceCode = CodeGenerator.generateFunctionReplacementCode(
  'api', 
  'request', 
  function(url, options) {
    console.log('拦截请求:', url);
    return originalRequest.call(this, url, options);
  }
);

// 生成参数修改代码
const modifyArgsCode = CodeGenerator.generateArgumentModificationCode(
  'calculator',
  'add',
  (args) => args.map(x => Math.abs(x)) // 确保参数为正数
);
```

## 📚 API 参考

### watch(target, options, name)

创建对象监控器。

**参数:**
- `target` - 要监控的对象或函数
- `options` - 配置选项
- `name` - 可选的对象名称

**配置选项:**

```javascript
{
  // 基础配置
  debug: false,              // 启用调试或条件断点函数
  log: true,                 // 是否输出日志
  logLevel: 'info',          // 日志级别: 'debug', 'info', 'warn', 'error'
  
  // 通用钩子
  onBefore: null,            // 操作前钩子
  onAfter: null,             // 操作后钩子
  onError: null,             // 错误处理钩子
  
  // 属性访问钩子
  onGet: null,               // 属性访问钩子
  onSet: null,               // 属性设置钩子
  onDefine: null,            // 属性定义钩子
  onDelete: null,            // 属性删除钩子
  onHas: null,               // 属性检查钩子
  
  // 函数调用钩子
  onCall: null,              // 函数调用钩子
  onConstruct: null,         // 构造函数调用钩子
  
  // 高级定制钩子
  interceptGet: null,        // 完全自定义属性访问
  interceptSet: null,        // 完全自定义属性设置
  interceptCall: null,       // 完全自定义函数调用
  interceptConstruct: null,  // 完全自定义构造函数调用
  
  // 参数和返回值修改
  modifyArgs: null,          // 修改函数参数
  modifyResult: null,        // 修改函数返回值
  
  // 函数替换
  replaceFunction: null,     // 完全替换函数实现
  
  // 条件控制
  shouldIntercept: null,     // 条件拦截函数
  
  // 性能监控
  enableTiming: false,       // 启用执行时间统计
  
  // 调用栈追踪
  enableStackTrace: false    // 启用调用栈记录
}
```

### 上下文对象

所有钩子函数都会接收一个上下文对象，包含以下信息：

```javascript
{
  type: 'get|set|apply|construct|...',  // 操作类型
  target: Object,                       // 目标对象
  property: String,                     // 属性名（如果适用）
  arguments: Array,                     // 函数参数（如果适用）
  oldValue: any,                        // 旧值（set 操作）
  newValue: any,                        // 新值（set 操作）
  result: any,                          // 操作结果（after 钩子）
  duration: Number,                     // 执行时间（如果启用）
  timestamp: Number,                    // 时间戳
  stack: String                         // 调用栈（如果启用）
}
```

## 🔄 迁移指南

从旧版本迁移到新版本：

```javascript
// 旧版本
import { watchObj, unwatchObj } from 'watch-obj';
const proxy = watchObj(obj, { debugger: true });
unwatchObj(proxy);

// 新版本（推荐）
import { watch, unwatch } from 'watch-obj';
const proxy = watch(obj, { debug: true });
unwatch(proxy);

// 旧版本仍然支持，但会显示弃用警告
```

## 🎯 使用场景

1. **API 拦截和修改**: 自动添加认证、重试逻辑、缓存等
2. **调试和诊断**: 追踪对象状态变化、函数调用链
3. **性能分析**: 统计函数执行时间、调用频率
4. **安全监控**: 监控敏感数据访问、防止恶意操作
5. **测试和模拟**: 模拟函数行为、注入测试数据
6. **开发工具**: 构建调试器、性能分析器等开发工具

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License