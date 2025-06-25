import { watch, unwatch } from './index.js';

console.log('🧪 测试对象覆盖和还原功能...');

// 测试1: 基础对象覆盖
console.log('\n📝 测试1: 基础对象覆盖');
const originalObj = {
  name: 'test',
  value: 42,
  getValue: function() {
    return this.value;
  },
  calculate: (a, b) => a + b
};

// 保存原始引用
const objRef = originalObj;
console.log('  📋 原始对象:', originalObj);
console.log('  🔗 原始引用相等:', objRef === originalObj);

// 监控对象（返回代理对象）
const proxyObj = watch(originalObj, {
  onGet: (context) => {
    console.log(`    ✅ 拦截到属性访问: ${context.property}`);
  },
  onCall: (context) => {
    console.log(`    ✅ 拦截到函数调用: ${context.property}`);
  }
});

console.log('  🔗 watch返回的是代理对象:', proxyObj !== originalObj);
console.log('  🔗 原始对象未被修改:', objRef === originalObj);

// 测试监控是否生效
console.log('  🧪 测试监控功能:');
proxyObj.name; // 应该触发监控
proxyObj.getValue(); // 通过代理调用，应该触发监控

// 测试2: 对象还原
console.log('\n📝 测试2: 对象还原');
console.log('  📋 还原前的对象:', originalObj);

// 取消监控，应该还原原始对象
const restoredObj = unwatch(proxyObj); // 传入代理对象

console.log('  📋 还原后的对象:', restoredObj);
console.log('  🔗 还原的对象与原始对象相等:', restoredObj === originalObj);
console.log('  🔗 原始引用仍然有效:', objRef === originalObj);

// 测试还原后监控是否失效
console.log('  🧪 测试还原后监控失效:');
restoredObj.name; // 不应该触发监控
restoredObj.getValue(); // 不应该触发监控

// 验证功能是否正常
console.log('  ✅ 还原后功能验证:');
console.log('    name:', restoredObj.name);
console.log('    getValue():', restoredObj.getValue());
console.log('    calculate(2, 3):', restoredObj.calculate(2, 3));

// 测试3: 复杂对象（类实例）
console.log('\n📝 测试3: 复杂对象（类实例）');
class TestClass {
  constructor(name) {
    this.name = name;
    this.value = 100;
  }
  
  getName() {
    return this.name;
  }
  
  setValue(val) {
    this.value = val;
  }
  
  getValue() {
    return this.value;
  }
}

const instance = new TestClass('测试实例');
const instanceRef = instance;

console.log('  📋 原始实例:', instance);
console.log('  🔗 原始引用相等:', instanceRef === instance);

// 监控类实例
const proxyInstance = watch(instance, {
  onGet: (context) => {
    console.log(`    ✅ 拦截到属性访问: ${context.property}`);
  },
  onCall: (context) => {
    console.log(`    ✅ 拦截到方法调用: ${context.property}`);
  }
});

console.log('  🔗 watch返回的是代理对象:', proxyInstance !== instance);
console.log('  🔗 原始实例未被修改:', instanceRef === instance);

// 测试监控
console.log('  🧪 测试实例监控:');
proxyInstance.name;
proxyInstance.getName();
proxyInstance.setValue(200);

// 还原实例
const restoredInstance = unwatch(proxyInstance);
console.log('  🔗 还原后返回原始实例:', restoredInstance === instance);
console.log('  🔗 原始引用仍然有效:', instanceRef === instance);

// 测试还原后功能
console.log('  🧪 测试还原后功能:');
restoredInstance.name; // 不应该触发监控
console.log('    getName():', restoredInstance.getName());
console.log('    getValue():', restoredInstance.getValue());

// 测试4: 函数
console.log('\n📝 测试4: 函数');

function testFunction(a, b) {
  return a + b;
}

testFunction.customProp = 'custom';
const funcRef = testFunction;

console.log('  📋 原始函数:', testFunction);
console.log('  🔗 原始引用相等:', funcRef === testFunction);

// 监控函数
const proxyFunc = watch(testFunction, {
  onCall: (context) => {
    console.log(`    ✅ 拦截到函数调用: ${context.property}`);
  },
  onGet: (context) => {
    console.log(`    ✅ 拦截到属性访问: ${context.property}`);
  }
});

console.log('  🔗 watch返回的是代理函数:', proxyFunc !== testFunction);
console.log('  🔗 原始函数未被修改:', funcRef === testFunction);

// 测试函数监控
console.log('  🧪 测试函数监控:');
proxyFunc(1, 2); // 应该触发监控
proxyFunc.customProp; // 应该触发监控

// 还原函数
const restoredFunc = unwatch(proxyFunc);
console.log('  🔗 还原后返回原始函数:', restoredFunc === testFunction);
console.log('  🔗 原始引用仍然有效:', funcRef === testFunction);

// 测试还原后功能
console.log('  🧪 测试还原后功能:');
console.log('    调用结果:', restoredFunc(5, 6));
console.log('    自定义属性:', restoredFunc.customProp);

// 测试5: 多重引用测试
console.log('\n📝 测试5: 多重引用测试');

const multiRefObj = {
  data: 'test',
  method() {
    return this.data;
  }
};

const ref1 = multiRefObj;
const ref2 = multiRefObj;
const ref3 = multiRefObj;

console.log('  📋 所有引用都指向同一对象:');
console.log('    ref1 === multiRefObj:', ref1 === multiRefObj);
console.log('    ref2 === multiRefObj:', ref2 === multiRefObj);
console.log('    ref3 === multiRefObj:', ref3 === multiRefObj);

// 监控对象
const proxyMultiRef = watch(multiRefObj, {
  onGet: (context) => {
    console.log(`    ✅ 拦截到属性访问: ${context.property}`);
  }
});

console.log('  🔗 监控后原始对象未变:');
console.log('    ref1 === multiRefObj:', ref1 === multiRefObj);
console.log('    ref2 === multiRefObj:', ref2 === multiRefObj);
console.log('    ref3 === multiRefObj:', ref3 === multiRefObj);
console.log('    proxyMultiRef !== multiRefObj:', proxyMultiRef !== multiRefObj);

// 通过代理测试监控
console.log('  🧪 通过代理测试监控:');
proxyMultiRef.data; // 应该触发监控
proxyMultiRef.method(); // 应该触发监控

// 还原对象
const restoredMultiRef = unwatch(proxyMultiRef);
console.log('  🔗 还原后返回原始对象:');
console.log('    ref1 === multiRefObj:', ref1 === multiRefObj);
console.log('    ref2 === multiRefObj:', ref2 === multiRefObj);
console.log('    ref3 === multiRefObj:', ref3 === multiRefObj);
console.log('    restoredMultiRef === multiRefObj:', restoredMultiRef === multiRefObj);

console.log('\n🎉 所有测试完成！新的API设计：watch返回proxy，unwatch接收proxy返回原始对象');