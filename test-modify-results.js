import { WatchManager } from './index.js';

const manager = new WatchManager();

// 测试对象
const testObj = {
  name: 'test',
  value: 42,
  nested: { prop: 'hello' }
};

console.log('=== 测试修改结果功能 ===\n');

// 测试 modifyGetResult
console.log('1. 测试 modifyGetResult:');
const proxy1 = manager.watch(testObj, {
  modifyGetResult: (context) => {
    if (context.property === 'name') {
      console.log(`  修改前: ${context.value}`);
      return `Modified: ${context.value}`;
    }
    return context.value;
  }
});

console.log(`  原始值: ${testObj.name}`);
console.log(`  代理值: ${proxy1.name}`);
console.log();

// 测试 modifyHasResult
console.log('2. 测试 modifyHasResult:');
const proxy2 = manager.watch(testObj, {
  modifyHasResult: (context) => {
    if (context.property === 'nonexistent') {
      console.log(`  修改前: ${context.exists}`);
      return true; // 让不存在的属性返回 true
    }
    return context.exists;
  }
});

console.log(`  'name' in proxy: ${'name' in proxy2}`);
console.log(`  'nonexistent' in proxy: ${'nonexistent' in proxy2}`);
console.log();

// 测试 modifyOwnKeysResult
console.log('3. 测试 modifyOwnKeysResult:');
const proxy3 = manager.watch(testObj, {
  modifyOwnKeysResult: (context) => {
    console.log(`  修改前: [${context.keys.join(', ')}]`);
    return [...context.keys, 'extraKey']; // 添加一个额外的键
  }
});

console.log(`  原始键: [${Object.keys(testObj).join(', ')}]`);
console.log(`  代理键: [${Object.keys(proxy3).join(', ')}]`);
console.log();

// 测试 modifySetResult
console.log('4. 测试 modifySetResult:');
const proxy4 = manager.watch({}, {
  modifySetResult: (context) => {
    console.log(`  设置 ${context.property} = ${context.value}, 原始结果: ${context.success}`);
    return true; // 总是返回成功
  }
});

const setResult = (proxy4.test = 'value');
console.log(`  设置结果: ${setResult}`);
console.log();

// 测试 modifyDescriptorResult
console.log('5. 测试 modifyDescriptorResult:');
const proxy5 = manager.watch(testObj, {
  modifyDescriptorResult: (context) => {
    if (context.property === 'name' && context.descriptor) {
      console.log(`  修改前描述符: ${JSON.stringify(context.descriptor)}`);
      return {
        ...context.descriptor,
        value: `Modified: ${context.descriptor.value}`
      };
    }
    return context.descriptor;
  }
});

const descriptor = Object.getOwnPropertyDescriptor(proxy5, 'name');
console.log(`  修改后描述符: ${JSON.stringify(descriptor)}`);
console.log();

// 测试 modifyDeleteResult
console.log('6. 测试 modifyDeleteResult:');
const testObj2 = { deletable: 'value', protected: 'value' };
const proxy6 = manager.watch(testObj2, {
  modifyDeleteResult: (context) => {
    if (context.property === 'protected') {
      console.log(`  阻止删除 ${context.property}`);
      return false; // 阻止删除
    }
    return context.success;
  }
});

console.log(`  删除 'deletable': ${delete proxy6.deletable}`);
try {
  console.log(`  删除 'protected': ${delete proxy6.protected}`);
} catch (error) {
  console.log(`  删除 'protected' 被阻止: ${error.message}`);
}
console.log(`  'protected' 仍存在: ${'protected' in proxy6}`);
console.log();

console.log('=== 所有测试完成 ===');