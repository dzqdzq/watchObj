function watchObj(target, targetName = 'default', options = {}) {
  const TAG = `WATCH_OBJ_${targetName}`;
  const HANDELS = [
    "apply",
    "construct",
    "defineProperty",
    "deleteProperty",
    "get",
    "getPrototypeOf",
    "has",
    "ownKeys",
    "set",
    "setPrototypeOf",
  ];
  if(!watchObj._watch_map){
    watchObj._watch_map = new WeakMap();
  }

  if(watchObj._watch_map.get(target)){
    throw new Error("watchObj: target has been watched");
  }

  // 初始化options
  HANDELS.forEach((handle) => {
    if(options[handle] === false || options[handle] === null){
      return;
    }
    if (!options[handle]) {
      options[handle] = {};
    }
    if (typeof options[handle].log !== "boolean") {
      options[handle].log = true;
    }
    if (typeof options[handle].debugger === "undefined") {
      options[handle].debugger = false;
    }
  });

  if (target === console) {
    console.error("不支持console对象, 它会导致无限递归");
    return;
  }

  function getCallerInfo(start=3) {
    const error = new Error();
    const stack = error.stack.split('\n');
    return stack.slice(start).join('\n');
  }

  const _debug = (config, context) => {
    if (typeof config.debugger === 'function') {
      return config.debugger(context);
    }
    return config.debugger;
  };

  const errorLog = (message, ...args) => {
    console.error(`[${TAG}]`, message, ...args);
  };

  // 通用handler工厂函数
  function createHandler(handlerName, handlerLogic) {
    const config = options[handlerName];
    if(!config){
      return undefined;
    }
    function shouldLog(context) { 
      if(typeof config.log === 'function'){
        return config.log(context);
      }
      return config.log;
    }
    return function (...args) {
      const context = {
        type: handlerName,
        caller: getCallerInfo(),
        args,
        ...handlerLogic.createContext(...args)
      };

      try {
        if (_debug(config, context)) {
          debugger;
        }
        
        if (shouldLog(context)) {
          const logMessage = handlerLogic.getLogMessage(context);
          const logArgs = handlerLogic.getLogArgs(context);
          console.log(`[${TAG}]`, logMessage, ...logArgs, "调用位置:\n", context.caller);
        }
        
        if (config.onModResult) {
          return config.onModResult(context);
        }
      } catch (error) {
        errorLog(`Handler ${handlerName} error:`, error);
      }
      return handlerLogic.execute(context);
    };
  }

  function createApply() {
    return createHandler('apply', {
      createContext: (target, thisArg, argumentsList) => ({
        target: thisArg,
        func: target,
        property: target.name,
        arguments: argumentsList
      }),
      getLogMessage: (context) => `[call]`,
      getLogArgs: (context) => ['this:', context.target, 'funcName:',context.property, 'args:', context.arguments],
      execute: (context) => target.apply(...context.args)
    });
  }// end createApply
  
  function createConstruct(){
    return createHandler('construct', {
      createContext: (target, argumentsList, newTarget) => ({
        target,
        arguments: argumentsList,
        newTarget
      }),
      getLogMessage: () => '[construct]',
      getLogArgs: (context) => ['construct:', context.target, 'args:', context.arguments],
      execute: (context) => Reflect.construct(...context.args)
    });
  }// end createConstruct

  function createDefineProperty(){
    return createHandler('defineProperty', {
      createContext: (target, property, descriptor) => ({
        target,
        property,
        descriptor
      }),
      getLogMessage: (context) => `[defineProperty]`,
      getLogArgs: (context) => ['target:', context.target, 'property:', context.property, 'args:', context.descriptor],
      execute: (context) => Reflect.defineProperty(...context.args)
    });
  }// end createDefineProperty

  function createDeleteProperty(){
    return createHandler('deleteProperty', {
      createContext: (target, property) => ({
        target,
        property
      }),
      getLogMessage: (context) => `[deleteProperty]`,
      getLogArgs: (context) => ['target:', context.target, 'property:', context.property],
      execute: (context) => Reflect.deleteProperty(...context.args)
    });
  }// end createDeleteProperty

  function createGetPrototypeOf(){
    return createHandler('getPrototypeOf', {
      createContext: (target) => ({
        target,
        prototype: Reflect.getPrototypeOf(target)
      }),
      getLogMessage: () => '[getPrototypeOf]',
      getLogArgs: (context) => ['target:', context.target, 'prototype:', context.prototype],
      execute: (context) => context.prototype
    });
  }// end createGetPrototypeOf

  function createSetPrototypeOf(){
    return createHandler('setPrototypeOf', {
      createContext: (target, prototype) => ({
        target,
        prototype
      }),
      getLogMessage: () => '[setPrototypeOf]',
      getLogArgs: (context) => ['target:', context.target, 'oldPrototype:', Reflect.getPrototypeOf(target, prototype), 'newPrototype:', context.prototype],
      execute: (context) => Reflect.setPrototypeOf(...context.args)
    });
  }// end createSetPrototypeOf

  function createGet(){
    return createHandler('get', {
      createContext: (target, property, receiver) => ({
        target,
        property,
        receiver,
        value: Reflect.get(target, property, receiver)
      }),
      getLogMessage: (context) => `[get]`,
      getLogArgs: (context) => ['target:', context.target, 'property:', context.property, 'value:', context.value],
      execute: (context) => context.value
    });
  }// end createGet

  function createSet(){
    return createHandler('set', {
      createContext: (target, property, value, receiver) => ({
        target,
        property,
        value,
        receiver
      }),
      getLogMessage: (context) => `[set]`,
      getLogArgs: (context) => ['target:', context.target, 'property:', context.property,'oldValue:', target[property], 'newValue:', context.value],
      execute: (context) => Reflect.set(...context.args)
    });
  }// end createSet

  function createHas(){
    return createHandler('has', {
      createContext: (target, property) => ({
        target,
        property,
        has: Reflect.has(target, property)
      }),
      getLogMessage: (context) => `[has] ${context.property}`,
      getLogArgs: (context) => ['target:', context.target, 'property:', context.property, "has:", context.has],
      execute: (context) => context.has
    });
  }// end createHas

  function createOwnKeys(){
    return createHandler('ownKeys', {
      createContext: (target) => ({
        target,
        keys: Reflect.ownKeys(target)
      }),
      getLogMessage: () => '[ownKeys]',
      getLogArgs: (context) => ['target:', context.target, "keys:", context.keys],
      execute: (context) => context.keys
    });
  }// end createOwnKeys

  const {proxy, revoke} = Proxy.revocable(target, {
    apply: createApply(),
    construct: createConstruct(),
    defineProperty: createDefineProperty(),
    deleteProperty: createDeleteProperty(),
    getPrototypeOf: createGetPrototypeOf(),
    setPrototypeOf: createSetPrototypeOf(),
    get: createGet(),
    set: createSet(),
    has: createHas(),
    ownKeys:createOwnKeys(),
  });
  
  watchObj._watch_map.set(target, proxy);
  if(!watchObj._watch_info){
    watchObj._watch_info = new WeakMap();
  }
  watchObj._watch_info.set(proxy, {
    revoke,
    target,
    options,
  });

  if(!watchObj.getConfig){
    watchObj.getConfig = function(proxy, handler){
      return watchObj._watch_info.get(proxy).options[handler];
    };
  }
  return proxy;
}

function unwatchObj(proxy) {
  if(!proxy){
    return;
  }
  const watch_info = watchObj._watch_info.get(proxy);
  if (!watch_info) {
    console.error("unwatchObj: proxy必须是watchObj监听的对象");
    return;
  }

  const {target, revoke} =  watch_info;

  revoke();

  watchObj._watch_map.delete(target);
  watchObj._watch_info.delete(proxy);
  return target;
}

export { watchObj, unwatchObj }