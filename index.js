/**
 * 高度可定制的对象监控工具
 * 支持函数参数修改、返回值修改、函数替换、属性访问自定义等高级功能
 */

class WatchManager {
  constructor() {
    // 存储原始对象到监听信息的映射
    this.watchedObjects = new WeakMap();
    // 存储对象名称到对象的映射
    this.namedObjects = new Map();
    // 存储Proxy对象的元数据
    this.proxyMetadata = new WeakMap();
    // 全局拦截器
    this.globalInterceptors = [];
  }

  /**
   * 创建高度可定制的对象监控
   * @param {Object|Function} target 要监控的对象或函数
   * @param {Object} options 配置选项
   * @param {String} name 对象名称
   * @returns {Object|Function} 被监控的原始对象（已被代理覆盖）
   */
  watch(target, options = {}, name = null) {
    if (!target || (typeof target !== 'object' && typeof target !== 'function')) {
      throw new Error('Target must be an object or function');
    }

    // 如果已经被监控，返回代理对象
    if (this.watchedObjects.has(target)) {
      console.warn('Object is already being watched');
      return this.watchedObjects.get(target).proxy;
    }

    const config = this._normalizeConfig(options);
    const interceptors = this._createInterceptors(target, config);
    
    // 创建可撤销的代理
    const proxyInfo = Proxy.revocable(target, {
      // 函数调用拦截
      apply: interceptors.apply,
      // 构造函数调用拦截
      construct: interceptors.construct,
      // 属性访问拦截
      get: interceptors.get,
      // 属性设置拦截
      set: interceptors.set,
      // 属性定义拦截
      defineProperty: interceptors.defineProperty,
      // 属性删除拦截
      deleteProperty: interceptors.deleteProperty,
      // 属性检查拦截
      has: interceptors.has,
      // 属性枚举拦截
      ownKeys: interceptors.ownKeys,
      // 属性描述符获取拦截
      getOwnPropertyDescriptor: interceptors.getOwnPropertyDescriptor,
      // 原型获取拦截
      getPrototypeOf: interceptors.getPrototypeOf,
      // 原型设置拦截
      setPrototypeOf: interceptors.setPrototypeOf,
      // 可扩展性检查拦截
      isExtensible: interceptors.isExtensible,
      // 防止扩展拦截
      preventExtensions: interceptors.preventExtensions
    });

    const proxy = proxyInfo.proxy;
    
    // 存储监控信息（简化版本）
    const watchInfo = {
      target,
      proxy,
      config,
      name,
      revoke: proxyInfo.revoke,
      interceptors
    };

    this.watchedObjects.set(target, watchInfo);
    this.proxyMetadata.set(proxy, { isWatchedProxy: true, target });
    
    if (name) {
      this.namedObjects.set(name, { target, proxy });
    }

    this._log('info', `Started watching ${name || 'object'}`, { target, config });
    return proxy; // 返回代理对象
  }

  /**
   * 取消监控对象
   * @param {Object|string} proxyOrName - 要取消监控的代理对象或名称
   * @returns {Object} 原始对象
   */
  unwatch(proxyOrName) {
    let watchInfo;
    
    if (typeof proxyOrName === 'string') {
      // 通过名称查找
      const namedObj = this.namedObjects.get(proxyOrName);
      if (!namedObj) {
        console.warn(`No watched object found with name: ${proxyOrName}`);
        return null;
      }
      watchInfo = this.watchedObjects.get(namedObj.target);
    } else {
      // 通过代理对象查找
      const proxyMeta = this.proxyMetadata.get(proxyOrName);
      if (proxyMeta?.isWatchedProxy) {
        watchInfo = this.watchedObjects.get(proxyMeta.target);
      } else {
        console.warn('Object is not being watched');
        return proxyOrName;
      }
    }
    
    if (!watchInfo) {
      console.warn('Object is not being watched');
      return null;
    }
    
    const { target, proxy, name, revoke } = watchInfo;
    
    // 撤销代理
    revoke();
    
    // 清理监控信息
    this.watchedObjects.delete(target);
    this.proxyMetadata.delete(proxy);
    if (name) {
      this.namedObjects.delete(name);
    }
    
    this._log('info', `Stopped watching ${name || 'object'}`, { target });
    return target; // 返回原始对象
  }

  /**
   * 添加全局拦截器
   * @param {Function} interceptor 拦截器函数
   */
  addGlobalInterceptor(interceptor) {
    this.globalInterceptors.push(interceptor);
  }

  /**
   * 移除全局拦截器
   * @param {Function} interceptor 拦截器函数
   */
  removeGlobalInterceptor(interceptor) {
    const index = this.globalInterceptors.indexOf(interceptor);
    if (index > -1) {
      this.globalInterceptors.splice(index, 1);
    }
  }

  /**
   * 标准化配置
   * @private
   */
  _normalizeConfig(options) {
    // 兼容旧版本API
    if (typeof options === 'boolean') {
      options = { debug: options };
    }

    return {
      // 基础配置
      debug: false,
      log: true,
      logLevel: 'info', // 'debug', 'info', 'warn', 'error'
      
      // 通用钩子
      onBefore: null,
      onAfter: null,
      onError: null,
      
      // 属性访问钩子
      onGet: null,
      onSet: null,
      onDefine: null,
      onDelete: null,
      onHas: null,
      
      // 函数调用钩子
      onCall: null,
      onConstruct: null,
      
      // 高级定制钩子
      interceptGet: null,     // 完全自定义属性访问
      interceptSet: null,     // 完全自定义属性设置
      interceptCall: null,    // 完全自定义函数调用
      interceptConstruct: null, // 完全自定义构造函数调用
      
      // 参数和返回值修改
      modifyArgs: null,       // 修改函数参数
      modifyResult: null,     // 修改函数返回值
      
      // 其他操作结果修改
      modifyGetResult: null,  // 修改属性访问结果
      modifySetResult: null,  // 修改属性设置结果
      modifyHasResult: null,  // 修改属性存在检查结果
      modifyOwnKeysResult: null, // 修改自有属性列表结果
      modifyDescriptorResult: null, // 修改属性描述符结果
      modifyPrototypeResult: null, // 修改原型获取结果
      modifyDeleteResult: null, // 修改属性删除结果
      modifyDefineResult: null,  // 修改属性定义结果
      
      // 函数替换
      replaceFunction: null,  // 完全替换函数实现
      
      // 条件控制
      shouldIntercept: null,  // 条件拦截函数
      
      // 性能监控
      enableTiming: false,
      
      // 调用栈追踪
      enableStackTrace: false,
      
      ...options
    };
  }

  /**
   * 创建拦截器
   * @private
   */
  _createInterceptors(target, config) {
    return {
      apply: this._createApplyInterceptor(target, config),
      construct: this._createConstructInterceptor(target, config),
      get: this._createGetInterceptor(target, config),
      set: this._createSetInterceptor(target, config),
      defineProperty: this._createDefinePropertyInterceptor(target, config),
      deleteProperty: this._createDeletePropertyInterceptor(target, config),
      has: this._createHasInterceptor(target, config),
      ownKeys: this._createOwnKeysInterceptor(target, config),
      getOwnPropertyDescriptor: this._createGetOwnPropertyDescriptorInterceptor(target, config),
      getPrototypeOf: this._createGetPrototypeOfInterceptor(target, config),
      setPrototypeOf: this._createSetPrototypeOfInterceptor(target, config),
      isExtensible: this._createIsExtensibleInterceptor(target, config),
      preventExtensions: this._createPreventExtensionsInterceptor(target, config)
    };
  }

  /**
   * 创建函数调用拦截器
   * @private
   */
  _createApplyInterceptor(target, config) {
    return (target, thisArg, argumentsList) => {
      const context = this._createContext('apply', {
        target,
        thisArg,
        arguments: argumentsList,
        property: target.name || 'anonymous'
      });

      // 检查是否应该拦截
      if (config.shouldIntercept && !config.shouldIntercept(context)) {
        return Reflect.apply(target, thisArg, argumentsList);
      }

      try {
        // 执行前钩子
        this._executeHook(config.onBefore, context);
        this._executeHook(config.onCall, context);
        this._executeGlobalInterceptors('before', context);

        // 条件断点
        this._conditionalDebugger(config.debug, context);

        // 完全自定义拦截
        if (config.interceptCall) {
          const result = config.interceptCall(context);
          if (result !== undefined) {
            this._executeHook(config.onAfter, { ...context, result });
            return result;
          }
        }

        // 函数替换
        if (config.replaceFunction) {
          const replacement = config.replaceFunction(context);
          if (typeof replacement === 'function') {
            const result = replacement.apply(thisArg, argumentsList);
            this._executeHook(config.onAfter, { ...context, result, replaced: true });
            return result;
          }
        }

        // 参数修改
        let finalArgs = argumentsList;
        if (config.modifyArgs) {
          finalArgs = config.modifyArgs(context) || argumentsList;
        }

        // 记录开始时间
        const startTime = config.enableTiming ? performance.now() : null;

        // 执行原函数
        let result = Reflect.apply(target, thisArg, finalArgs);

        // 返回值修改
        if (config.modifyResult) {
          result = config.modifyResult({ ...context, result, arguments: finalArgs }) || result;
        }

        // 计算执行时间
        const duration = startTime ? performance.now() - startTime : null;

        // 执行后钩子
        const afterContext = { ...context, result, arguments: finalArgs, duration };
        this._executeHook(config.onAfter, afterContext);
        this._executeGlobalInterceptors('after', afterContext);

        // 日志记录
        this._log('debug', 'Function called', afterContext);

        return result;
      } catch (error) {
        this._executeHook(config.onError, { ...context, error });
        this._log('error', 'Function call error', { context, error });
        throw error;
      }
    };
  }

  /**
   * 创建构造函数拦截器
   * @private
   */
  _createConstructInterceptor(target, config) {
    return (target, argumentsList, newTarget) => {
      const context = this._createContext('construct', {
        target,
        arguments: argumentsList,
        newTarget,
        property: target.name || 'anonymous'
      });

      if (config.shouldIntercept && !config.shouldIntercept(context)) {
        return Reflect.construct(target, argumentsList, newTarget);
      }

      try {
        this._executeHook(config.onBefore, context);
        this._executeHook(config.onConstruct, context);
        this._executeGlobalInterceptors('before', context);

        this._conditionalDebugger(config.debug, context);

        // 完全自定义拦截
        if (config.interceptConstruct) {
          const result = config.interceptConstruct(context);
          if (result !== undefined) {
            this._executeHook(config.onAfter, { ...context, instance: result });
            return result;
          }
        }

        // 参数修改
        let finalArgs = argumentsList;
        if (config.modifyArgs) {
          finalArgs = config.modifyArgs(context) || argumentsList;
        }

        const startTime = config.enableTiming ? performance.now() : null;
        const instance = Reflect.construct(target, finalArgs, newTarget);
        const duration = startTime ? performance.now() - startTime : null;

        const afterContext = { ...context, instance, arguments: finalArgs, duration };
        this._executeHook(config.onAfter, afterContext);
        this._executeGlobalInterceptors('after', afterContext);

        this._log('debug', 'Constructor called', afterContext);
        return instance;
      } catch (error) {
        this._executeHook(config.onError, { ...context, error });
        this._log('error', 'Constructor call error', { context, error });
        throw error;
      }
    };
  }

  /**
   * 创建属性访问拦截器
   * @private
   */
  _createGetInterceptor(target, config) {
    return (target, property, receiver) => {
      const context = this._createContext('get', {
        target,
        property,
        receiver
      });

      if (config.shouldIntercept && !config.shouldIntercept(context)) {
        return Reflect.get(target, property, receiver);
      }

      try {
        this._executeHook(config.onBefore, context);
        this._executeHook(config.onGet, context);
        this._executeGlobalInterceptors('before', context);

        this._conditionalDebugger(config.debug, context);

        // 完全自定义属性访问
        if (config.interceptGet) {
          const result = config.interceptGet(context);
          if (result !== undefined) {
            this._executeHook(config.onAfter, { ...context, value: result });
            return result;
          }
        }

        let value = Reflect.get(target, property, receiver);
        
        // 修改属性访问结果
        if (config.modifyGetResult) {
          value = config.modifyGetResult({ ...context, value }) || value;
        }
        
        const afterContext = { ...context, value };
        this._executeHook(config.onAfter, afterContext);
        this._executeGlobalInterceptors('after', afterContext);

        this._log('debug', 'Property accessed', afterContext);
        return value;
      } catch (error) {
        this._executeHook(config.onError, { ...context, error });
        this._log('error', 'Property access error', { context, error });
        throw error;
      }
    };
  }

  /**
   * 创建属性设置拦截器
   * @private
   */
  _createSetInterceptor(target, config) {
    return (target, property, value, receiver) => {
      const oldValue = Reflect.get(target, property, receiver);
      const context = this._createContext('set', {
        target,
        property,
        oldValue,
        newValue: value,
        receiver
      });

      if (config.shouldIntercept && !config.shouldIntercept(context)) {
        return Reflect.set(target, property, value, receiver);
      }

      try {
        this._executeHook(config.onBefore, context);
        this._executeHook(config.onSet, context);
        this._executeGlobalInterceptors('before', context);

        this._conditionalDebugger(config.debug, context);

        // 完全自定义属性设置
        if (config.interceptSet) {
          const result = config.interceptSet(context);
          if (typeof result === 'boolean') {
            this._executeHook(config.onAfter, { ...context, success: result });
            return result;
          }
        }

        // 检查是否应该阻止设置
        let shouldSet = true;
        if (config.modifySetResult) {
          // 先预测设置结果
          const predictedResult = true; // 假设设置会成功
          const modifiedResult = config.modifySetResult({ ...context, success: predictedResult });
          shouldSet = modifiedResult !== false;
        }
        
        let success;
        if (shouldSet) {
          success = Reflect.set(target, property, value, receiver);
        } else {
          success = false; // 阻止设置
        }
        
        const afterContext = { ...context, success };
        this._executeHook(config.onAfter, afterContext);
        this._executeGlobalInterceptors('after', afterContext);

        this._log('debug', 'Property set', afterContext);
        return success;
      } catch (error) {
        this._executeHook(config.onError, { ...context, error });
        this._log('error', 'Property set error', { context, error });
        throw error;
      }
    };
  }

  // 其他拦截器的简化实现
  _createDefinePropertyInterceptor(target, config) {
    return (target, property, descriptor) => {
      const context = this._createContext('defineProperty', { target, property, descriptor });
      this._executeHook(config.onBefore, context);
      this._executeHook(config.onDefine, context);
      this._conditionalDebugger(config.debug, context);
      
      // 检查是否应该阻止定义
      let shouldDefine = true;
      if (config.modifyDefineResult) {
        // 先预测定义结果
        const predictedResult = true; // 假设定义会成功
        const modifiedResult = config.modifyDefineResult({ ...context, success: predictedResult });
        shouldDefine = modifiedResult !== false;
      }
      
      let result;
      if (shouldDefine) {
        result = Reflect.defineProperty(target, property, descriptor);
      } else {
        result = false; // 阻止定义
      }
      
      this._executeHook(config.onAfter, { ...context, success: result });
      this._log('debug', 'Property defined', { ...context, success: result });
      return result;
    };
  }

  _createDeletePropertyInterceptor(target, config) {
    return (target, property) => {
      const deletedValue = Reflect.get(target, property);
      const context = this._createContext('deleteProperty', { target, property, deletedValue });
      this._executeHook(config.onBefore, context);
      this._executeHook(config.onDelete, context);
      this._conditionalDebugger(config.debug, context);
      
      // 检查是否应该阻止删除
      let shouldDelete = true;
      if (config.modifyDeleteResult) {
        // 先预测删除结果
        const predictedResult = true; // 假设删除会成功
        const modifiedResult = config.modifyDeleteResult({ ...context, success: predictedResult });
        shouldDelete = modifiedResult !== false;
      }
      
      let result;
      if (shouldDelete) {
        result = Reflect.deleteProperty(target, property);
      } else {
        result = false; // 阻止删除
      }
      
      this._executeHook(config.onAfter, { ...context, success: result });
      this._log('debug', 'Property deleted', { ...context, success: result });
      return result;
    };
  }

  _createHasInterceptor(target, config) {
    return (target, property) => {
      const context = this._createContext('has', { target, property });
      this._executeHook(config.onBefore, context);
      this._executeHook(config.onHas, context);
      
      let result = Reflect.has(target, property);
      
      // 修改属性存在检查结果
      if (config.modifyHasResult) {
        result = config.modifyHasResult({ ...context, exists: result }) || result;
      }
      
      this._executeHook(config.onAfter, { ...context, exists: result });
      this._log('debug', 'Property existence checked', { ...context, exists: result });
      return result;
    };
  }

  // 简化的其他拦截器实现
  _createOwnKeysInterceptor(target, config) {
    return (target) => {
      const context = this._createContext('ownKeys', { target });
      this._executeHook(config.onBefore, context);
      
      let result = Reflect.ownKeys(target);
      
      // 修改自有属性列表结果
      if (config.modifyOwnKeysResult) {
        result = config.modifyOwnKeysResult({ ...context, keys: result }) || result;
      }
      
      this._executeHook(config.onAfter, { ...context, keys: result });
      this._log('debug', 'Own keys accessed', { target, keys: result });
      return result;
    };
  }

  _createGetOwnPropertyDescriptorInterceptor(target, config) {
    return (target, property) => {
      const context = this._createContext('getOwnPropertyDescriptor', { target, property });
      this._executeHook(config.onBefore, context);
      
      let result = Reflect.getOwnPropertyDescriptor(target, property);
      
      // 修改属性描述符结果
      if (config.modifyDescriptorResult) {
        result = config.modifyDescriptorResult({ ...context, descriptor: result }) || result;
      }
      
      this._executeHook(config.onAfter, { ...context, descriptor: result });
      this._log('debug', 'Property descriptor accessed', { target, property, descriptor: result });
      return result;
    };
  }

  _createGetPrototypeOfInterceptor(target, config) {
    return (target) => {
      const context = this._createContext('getPrototypeOf', { target });
      this._executeHook(config.onBefore, context);
      
      let result = Reflect.getPrototypeOf(target);
      
      // 修改原型获取结果
      if (config.modifyPrototypeResult) {
        result = config.modifyPrototypeResult({ ...context, prototype: result }) || result;
      }
      
      this._executeHook(config.onAfter, { ...context, prototype: result });
      this._log('debug', 'Prototype accessed', { target, prototype: result });
      return result;
    };
  }

  _createSetPrototypeOfInterceptor(target, config) {
    return (target, prototype) => {
      const result = Reflect.setPrototypeOf(target, prototype);
      this._log('debug', 'Prototype set', { target, prototype, success: result });
      return result;
    };
  }

  _createIsExtensibleInterceptor(target, config) {
    return (target) => {
      const result = Reflect.isExtensible(target);
      this._log('debug', 'Extensibility checked', { target, extensible: result });
      return result;
    };
  }

  _createPreventExtensionsInterceptor(target, config) {
    return (target) => {
      const result = Reflect.preventExtensions(target);
      this._log('debug', 'Extensions prevented', { target, success: result });
      return result;
    };
  }

  /**
   * 创建上下文对象
   * @private
   */
  _createContext(type, data) {
    const context = {
      type,
      timestamp: Date.now(),
      ...data
    };

    if (this.watchedObjects.get(data.target)?.config.enableStackTrace) {
      context.stack = new Error().stack;
    }

    return context;
  }

  /**
   * 执行钩子函数
   * @private
   */
  _executeHook(hook, context) {
    if (typeof hook === 'function') {
      try {
        return hook(context);
      } catch (error) {
        console.error('Hook execution error:', error);
      }
    }
  }

  /**
   * 执行全局拦截器
   * @private
   */
  _executeGlobalInterceptors(phase, context) {
    for (const interceptor of this.globalInterceptors) {
      try {
        interceptor(phase, context);
      } catch (error) {
        console.error('Global interceptor error:', error);
      }
    }
  }

  /**
   * 条件断点
   * @private
   */
  _conditionalDebugger(debugConfig, context) {
    if (typeof debugConfig === 'function') {
      if (debugConfig(context)) {
        debugger;
      }
    } else if (debugConfig) {
      debugger;
    }
  }

  /**
   * 日志记录
   * @private
   */
  _log(level, message, data = {}) {
    const config = data.target ? this.watchedObjects.get(data.target)?.config : {};
    if (!config || !config.log) return;

    const logLevels = { debug: 0, info: 1, warn: 2, error: 3 };
    const currentLevel = logLevels[config.logLevel] || 1;
    const messageLevel = logLevels[level] || 1;

    if (messageLevel >= currentLevel) {
      console[level](`[WatchManager] ${message}`, data);
    }
  }
}

// 创建全局实例
const watchManager = new WatchManager();

/**
 * 便捷的监控函数
 * @param {Object|Function} target 要监控的对象
 * @param {Object} options 配置选项
 * @param {String} name 对象名称
 * @returns {Proxy} 代理对象
 */
function watch(target, options = {}, name = null) {
  return watchManager.watch(target, options, name);
}

/**
 * 取消监控
 * @param {Object|String} targetOrName 目标对象或名称
 * @returns {Object|null} 原始对象
 */
function unwatch(targetOrName) {
  return watchManager.unwatch(targetOrName);
}

/**
 * 创建函数监控器 - 专门用于函数的高级监控
 * @param {Function} fn 要监控的函数
 * @param {Object} options 配置选项
 * @returns {Function} 监控后的函数
 */
function watchFunction(fn, options = {}) {
  if (typeof fn !== 'function') {
    throw new Error('Target must be a function');
  }

  return watch(fn, {
    ...options,
    // 专门针对函数的默认配置
    enableTiming: options.enableTiming !== false,
    logLevel: options.logLevel || 'info'
  });
}

/**
 * 创建属性监控器 - 专门用于对象属性的监控
 * @param {Object} obj 要监控的对象
 * @param {String|Array} properties 要监控的属性名或属性名数组
 * @param {Object} options 配置选项
 * @returns {Proxy} 代理对象
 */
function watchProperties(obj, properties, options = {}) {
  const propsArray = Array.isArray(properties) ? properties : [properties];
  
  return watch(obj, {
    ...options,
    shouldIntercept: (context) => {
      // 只拦截指定的属性
      return propsArray.includes(context.property);
    }
  });
}

/**
 * 创建性能监控器
 * @param {Object|Function} target 要监控的对象
 * @param {Object} options 配置选项
 * @returns {Proxy} 代理对象
 */
function watchPerformance(target, options = {}) {
  const performanceData = new Map();
  
  return watch(target, {
    ...options,
    enableTiming: true,
    onAfter: (context) => {
      if (context.duration !== undefined) {
        const key = `${context.type}:${context.property || 'anonymous'}`;
        if (!performanceData.has(key)) {
          performanceData.set(key, { count: 0, totalTime: 0, avgTime: 0 });
        }
        
        const data = performanceData.get(key);
        data.count++;
        data.totalTime += context.duration;
        data.avgTime = data.totalTime / data.count;
        
        if (options.onPerformanceUpdate) {
          options.onPerformanceUpdate(key, data, context);
        }
      }
      
      if (options.onAfter) {
        options.onAfter(context);
      }
    },
    getPerformanceData: () => performanceData
  });
}

/**
 * 代码生成工具 - 生成可执行的监控代码
 */
class CodeGenerator {
  static generateWatchCode(objName, options = {}) {
    const optionsStr = JSON.stringify(options, null, 2);
    return `${objName} = watch(${objName}, ${optionsStr});`;
  }

  static generateUnwatchCode(objName) {
    return `${objName} = unwatch(${objName}) || ${objName};`;
  }

  static generateFunctionReplacementCode(objName, methodName, newImplementation) {
    return `
${objName} = watch(${objName}, {
  replaceFunction: (context) => {
    if (context.property === '${methodName}') {
      return ${newImplementation.toString()};
    }
  }
});
    `.trim();
  }

  static generateArgumentModificationCode(objName, methodName, argModifier) {
    return `
${objName} = watch(${objName}, {
  modifyArgs: (context) => {
    if (context.property === '${methodName}') {
      return (${argModifier.toString()})(context.arguments);
    }
    return context.arguments;
  }
});
    `.trim();
  }
}

// 兼容旧版本API
function watchObj(obj, options = {}, objName = null) {
  console.warn('watchObj is deprecated, use watch() instead');
  return watch(obj, options, objName);
}

function unwatchObj(obj) {
  console.warn('unwatchObj is deprecated, use unwatch() instead');
  return unwatch(obj);
}

// 导出API
export {
  // 新的主要API
  watch,
  unwatch,
  watchFunction,
  watchProperties,
  watchPerformance,
  
  // 工具类
  WatchManager,
  CodeGenerator,
  
  // 全局实例
  watchManager,
  
  // 兼容旧版本
  watchObj,
  unwatchObj
};

// 默认导出
export default {
  watch,
  unwatch,
  watchFunction,
  watchProperties,
  watchPerformance,
  WatchManager,
  CodeGenerator,
  watchManager
};
