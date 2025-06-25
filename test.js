import { watch, unwatch, watchFunction, watchPerformance, watchManager } from './index.js';

console.log('🧪 开始测试 WatchObj 2.0 功能...');

// 测试1: 基础监控
console.log('\n📝 测试1: 基础监控');
const obj = { 
  name: 'test', 
  getValue: () => 42,
  calculate: (a, b) => a + b
};

const proxy = watch(obj, {
  onGet: (context) => {
    console.log(`  ✅ 访问属性: ${context.property}`);
  },
  onCall: (context) => {
    console.log(`  ✅ 调用函数: ${context.property}`);
  }
});

proxy.name;
proxy.getValue();

// 测试2: 函数参数修改
console.log('\n📝 测试2: 函数参数修改');
const api = {
  request: (url, options = {}) => {
    console.log(`  📡 请求: ${url}`, options);
    return { url, options };
  }
};

const monitoredApi = watch(api, {
  modifyArgs: (context) => {
    if (context.property === 'request') {
      const [url, options = {}] = context.arguments;
      options.headers = {
        ...options.headers,
        'Authorization': 'Bearer token123'
      };
      console.log(`  🔧 修改参数: 添加认证头`);
      return [url, options];
    }
    return context.arguments;
  }
});

monitoredApi.request('/api/data', { method: 'GET' });

// 测试3: 函数替换
console.log('\n📝 测试3: 函数替换');
const calculator = {
  add: (a, b) => a + b,
  multiply: (a, b) => a * b
};

const enhancedCalculator = watch(calculator, {
  replaceFunction: (context) => {
    if (context.property === 'add') {
      return function(a, b) {
        console.log(`  🔄 替换函数: 计算 ${a} + ${b}`);
        const result = a + b;
        console.log(`  ✅ 结果: ${result}`);
        return result;
      };
    }
  }
});

enhancedCalculator.add(2, 3);
enhancedCalculator.multiply(4, 5);

// 测试4: 自定义属性访问
console.log('\n📝 测试4: 自定义属性访问');
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
};

const smartConfig = watch(config, {
  interceptGet: (context) => {
    if (context.property === 'apiUrl') {
      console.log(`  🌍 动态返回开发环境 URL`);
      return 'https://dev-api.example.com';
    }
  },
  
  interceptSet: (context) => {
    if (context.property === 'timeout') {
      const value = Math.max(1000, Math.min(30000, context.newValue));
      console.log(`  ⚡ 限制超时时间: ${context.newValue} -> ${value}`);
      context.target[context.property] = value;
      return true;
    }
  }
});

console.log(`  📖 读取 apiUrl: ${smartConfig.apiUrl}`);
smartConfig.timeout = 50000;
console.log(`  📖 读取 timeout: ${smartConfig.timeout}`);

// 测试5: 性能监控
console.log('\n📝 测试5: 性能监控');
const service = {
  fetchData: async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { data: 'test' };
  },
  processData: (data) => {
    // 模拟处理时间
    const start = Date.now();
    while (Date.now() - start < 50) {}
    return data;
  }
};

const monitoredService = watchPerformance(service, {
  onPerformanceUpdate: (key, stats, context) => {
    console.log(`  ⏱️  ${key}: 平均耗时 ${stats.avgTime.toFixed(2)}ms, 调用次数 ${stats.count}`);
  }
});

await monitoredService.fetchData();
monitoredService.processData({ test: 'data' });

// 测试6: 条件拦截
console.log('\n📝 测试6: 条件拦截');
const user = {
  name: 'Alice',
  password: 'secret123',
  email: 'alice@example.com'
};

const secureUser = watch(user, {
  shouldIntercept: (context) => {
    return ['password', 'email'].includes(context.property);
  },
  
  onGet: (context) => {
    console.log(`  🚨 警告: 访问敏感属性 ${context.property}`);
  }
});

secureUser.name; // 不会触发拦截
secureUser.password; // 触发拦截

// 测试7: 全局拦截器
console.log('\n📝 测试7: 全局拦截器');
watchManager.addGlobalInterceptor((phase, context) => {
  if (phase === 'before' && context.type === 'apply') {
    console.log(`  🌐 全局监控: 即将调用函数 ${context.property}`);
  }
});

const obj1 = watch({ method1: () => console.log('    执行 method1') });
const obj2 = watch({ method2: () => console.log('    执行 method2') });

obj1.method1();
obj2.method2();

// 测试8: 向后兼容性
console.log('\n📝 测试8: 向后兼容性');
import { watchObj, unwatchObj } from './index.js';

const oldStyleObj = { test: 'value' };
const oldProxy = watchObj(oldStyleObj, {
  onAccess: (context) => {
    console.log(`  🔄 旧版本兼容: 访问 ${context.property}`);
  }
});

oldProxy.test;
unwatchObj(oldProxy);

console.log('\n🎉 所有测试完成！');