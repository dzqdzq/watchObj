import { watch, unwatch, watchFunction, watchPerformance, watchManager, CodeGenerator } from './index.js';

console.log('🚀 WatchObj 2.0 实际使用示例');

// 示例1: API 拦截器 - 自动添加认证和重试逻辑
console.log('\n📡 示例1: API 拦截器');
class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.token = null;
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`    原始请求: ${url}`);
    return { url, options, status: 200 };
  }
  
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }
  
  async post(endpoint, data) {
    return this.request(endpoint, { method: 'POST', body: data });
  }
}

const api = new ApiClient('https://api.example.com');
api.token = 'secret-token';

const enhancedApi = watch(api, {
  modifyArgs: (context) => {
    if (context.property === 'request') {
      const [endpoint, options = {}] = context.arguments;
      
      // 自动添加认证头
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${context.target.token}`,
        'Content-Type': 'application/json'
      };
      
      console.log(`    🔐 自动添加认证头`);
      return [endpoint, options];
    }
    return context.arguments;
  },
  
  modifyResult: async (context) => {
    if (context.property === 'request') {
      const result = await context.result;
      
      // 模拟重试逻辑
      if (result.status >= 500) {
        console.log(`    🔄 服务器错误，自动重试...`);
        // 这里可以实现重试逻辑
      }
      
      // 包装响应
      return {
        ...result,
        timestamp: Date.now(),
        cached: false
      };
    }
    return context.result;
  }
});

const response = await enhancedApi.get('/users');
console.log('    📦 增强后的响应:', response);

// 示例2: 状态管理器 - 自动持久化和变更通知
console.log('\n📊 示例2: 状态管理器');
class StateManager {
  constructor(initialState = {}) {
    this.state = initialState;
    this.listeners = [];
  }
  
  setState(updates) {
    Object.assign(this.state, updates);
  }
  
  getState() {
    return this.state;
  }
  
  subscribe(listener) {
    this.listeners.push(listener);
  }
}

const stateManager = new StateManager({ count: 0, user: null });

const smartStateManager = watch(stateManager, {
  interceptSet: (context) => {
    if (context.property === 'state') {
      // 自动保存到 localStorage
      console.log(`    💾 自动保存状态到本地存储`);
      // localStorage.setItem('appState', JSON.stringify(context.newValue));
      
      // 通知所有监听器
      context.target.listeners.forEach(listener => {
        console.log(`    📢 通知状态变更监听器`);
        // listener(context.newValue);
      });
    }
  },
  
  onCall: (context) => {
    if (context.property === 'setState') {
      console.log(`    🔄 状态更新:`, context.arguments[0]);
    }
  }
});

smartStateManager.setState({ count: 1 });
smartStateManager.setState({ user: { name: 'Alice' } });

// 示例3: 数据库查询优化器 - 自动缓存和批处理
console.log('\n🗄️ 示例3: 数据库查询优化器');
class Database {
  async query(sql, params = []) {
    console.log(`    🔍 执行查询: ${sql}`);
    // 模拟数据库查询延迟
    await new Promise(resolve => setTimeout(resolve, 100));
    return { sql, params, rows: [{ id: 1, name: 'test' }] };
  }
  
  async findById(table, id) {
    return this.query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
  }
  
  async findByIds(table, ids) {
    return this.query(`SELECT * FROM ${table} WHERE id IN (${ids.map(() => '?').join(',')})`, ids);
  }
}

const db = new Database();
const cache = new Map();
const batchQueue = new Map();

const optimizedDb = watch(db, {
  interceptCall: async (context) => {
    if (context.property === 'findById') {
      const [table, id] = context.arguments;
      const cacheKey = `${table}:${id}`;
      
      // 检查缓存
      if (cache.has(cacheKey)) {
        console.log(`    ⚡ 缓存命中: ${cacheKey}`);
        return cache.get(cacheKey);
      }
      
      // 执行原始查询
      const result = await context.target[context.property](...context.arguments);
      
      // 缓存结果
      cache.set(cacheKey, result);
      console.log(`    💾 缓存结果: ${cacheKey}`);
      
      return result;
    }
    
    if (context.property === 'query') {
      const [sql] = context.arguments;
      console.log(`    📊 查询统计: ${sql.substring(0, 50)}...`);
    }
  }
});

const user1 = await optimizedDb.findById('users', 1);
const user1Again = await optimizedDb.findById('users', 1); // 应该命中缓存

// 示例4: 函数性能分析器
console.log('\n⚡ 示例4: 函数性能分析器');
class Calculator {
  fibonacci(n) {
    if (n <= 1) return n;
    return this.fibonacci(n - 1) + this.fibonacci(n - 2);
  }
  
  factorial(n) {
    if (n <= 1) return 1;
    return n * this.factorial(n - 1);
  }
  
  isPrime(n) {
    if (n <= 1) return false;
    for (let i = 2; i <= Math.sqrt(n); i++) {
      if (n % i === 0) return false;
    }
    return true;
  }
}

const calculator = new Calculator();
const performanceStats = new Map();

const profiledCalculator = watchPerformance(calculator, {
  onPerformanceUpdate: (key, stats, context) => {
    console.log(`    📈 ${key}: 调用${stats.count}次, 平均${stats.avgTime.toFixed(2)}ms, 总计${stats.totalTime.toFixed(2)}ms`);
  }
});

console.log('    🧮 计算斐波那契数列...');
profiledCalculator.fibonacci(10);

console.log('    🧮 计算阶乘...');
profiledCalculator.factorial(5);

console.log('    🧮 检查质数...');
profiledCalculator.isPrime(97);

// 示例5: 安全监控器 - 敏感操作拦截
console.log('\n🔒 示例5: 安全监控器');
class SecureVault {
  constructor() {
    this.secrets = {
      apiKey: 'sk-1234567890abcdef',
      password: 'super-secret-password',
      token: 'jwt-token-here'
    };
    this.publicData = {
      name: 'MyApp',
      version: '1.0.0'
    };
  }
  
  getSecret(key) {
    return this.secrets[key];
  }
  
  setSecret(key, value) {
    this.secrets[key] = value;
  }
  
  deleteSecret(key) {
    delete this.secrets[key];
  }
}

const vault = new SecureVault();
const accessLog = [];

const secureVault = watch(vault, {
  shouldIntercept: (context) => {
    // 只拦截涉及敏感数据的操作
    return context.property === 'secrets' || 
           context.property.includes('Secret') ||
           (context.type === 'get' && context.property in vault.secrets);
  },
  
  onBefore: (context) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: context.type,
      property: context.property,
      stack: new Error().stack.split('\n')[3] // 获取调用位置
    };
    accessLog.push(logEntry);
    console.log(`    🚨 安全警告: 访问敏感数据 ${context.property}`);
  },
  
  interceptGet: (context) => {
    if (context.property === 'secrets') {
      // 返回脱敏的数据
      const masked = {};
      for (const [key, value] of Object.entries(context.target.secrets)) {
        masked[key] = typeof value === 'string' ? value.replace(/./g, '*') : value;
      }
      console.log(`    🎭 返回脱敏数据`);
      return masked;
    }
  }
});

console.log('    🔍 访问公开数据...');
console.log('    名称:', secureVault.publicData.name);

console.log('    🔍 访问敏感数据...');
console.log('    密钥:', secureVault.secrets); // 应该返回脱敏数据

console.log('    📋 安全访问日志:');
accessLog.forEach((entry, index) => {
  console.log(`      ${index + 1}. ${entry.timestamp} - ${entry.type}:${entry.property}`);
});

// 示例6: 代码生成器使用
console.log('\n🛠️ 示例6: 代码生成器');

// 生成监控代码
const watchCode = CodeGenerator.generateWatchCode('myApiClient', {
  onCall: (context) => console.log('API调用:', context.property),
  modifyArgs: (context) => {
    if (context.property === 'request') {
      const [url, options = {}] = context.arguments;
      options.timeout = 5000;
      return [url, options];
    }
    return context.arguments;
  }
});

console.log('    📝 生成的监控代码:');
console.log(watchCode);

// 生成函数替换代码
const replaceCode = CodeGenerator.generateFunctionReplacementCode(
  'console',
  'log',
  function(...args) {
    const timestamp = new Date().toISOString();
    originalLog.call(this, `[${timestamp}]`, ...args);
  }
);

console.log('    📝 生成的函数替换代码:');
console.log(replaceCode);

console.log('\n🎉 所有示例演示完成！');
console.log('\n💡 提示: 这些示例展示了 WatchObj 2.0 在实际项目中的强大应用场景');
console.log('   - API 拦截和增强');
console.log('   - 状态管理和持久化');
console.log('   - 数据库查询优化');
console.log('   - 性能分析和监控');
console.log('   - 安全监控和访问控制');
console.log('   - 代码生成和自动化');