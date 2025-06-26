import { watchObj, unwatchObj } from '../index.js';

function getInitialObject() {
  return {
    a: 1,
    b: 'hello',
    c: {
      d: 2
    },
    _e: 'private',
    [Symbol('f')]: 'symbol-f'
  };
}

function test_get() {
  console.log('\n--- Testing GET handler ---');
  let obj = getInitialObject();
  obj = watchObj(obj, 'get-test', {});
  
  console.log('1. 点访问:', obj.a);
  console.log('2. 方括号访问', obj['b']);
  console.log('3. 访问子对象:', obj.c.d);
  console.log('4. 访问不存在的对象:', obj.x);
  console.log('5. 解构访问:', (({ a }) => a)(obj));
  for(let k in obj){
    console.log(`6. 循环访问: ${k}`);
  }
  console.log('\n--- Testing unwatchObj 应该看不到hook日志---');
  obj = unwatchObj(obj);
  console.log('7. 无监听直接访问:', obj.c.d);
}

function test_set() {
  console.log('\n--- Testing SET handler ---');
  let obj = getInitialObject();
  obj = watchObj(obj, 'set-test', {});

  console.log('1. Direct property assignment:');
  obj.a = 10;
  console.log('2. Property assignment via brackets:');
  obj['b'] = 'world';
  console.log('3. Assigning a new property:');
  obj.z = 100;
  console.log('4. Nested property assignment:');
  obj.c.d = 20;

  console.log('\n--- Testing after unwatchObj ---');
  obj = unwatchObj(obj);
  obj.a = 30;
  obj['b'] = 'unwatched';
  console.log('5. Values after unwatch:', obj);
}

function test_has() {
  console.log('\n--- Testing HAS handler ---');
  let obj = getInitialObject();
  obj = watchObj(obj, 'has-test', {});

  console.log('1. Using `in` operator for existing property:', 'a' in obj);
  console.log('2. Using `in` operator for non-existent property:', 'x' in obj);
  console.log('3. Using `hasOwnProperty`:', obj.hasOwnProperty('b'));

  console.log('\n--- Testing after unwatchObj ---');
  obj = unwatchObj(obj);
  console.log('4. Using `in` operator after unwatch:', 'a' in obj);
  console.log('5. Using `hasOwnProperty` after unwatch:', obj.hasOwnProperty('b'));
}

function test_deleteProperty() {
  console.log('\n--- Testing DELETEPROPERTY handler ---');
  let obj = getInitialObject();
  obj = watchObj(obj, 'delete-test', {});

  console.log('1. Deleting an existing property:', delete obj.a);
  console.log('2. Deleting a non-existent property:', delete obj.x);
  console.log('3. Object after deletion:', obj);

  console.log('\n--- Testing after unwatchObj ---');
  obj = unwatchObj(obj);
  console.log('4. Deleting property after unwatch:', delete obj.b);
  console.log('5. Object after unwatch deletion:', obj);
}

function test_ownKeys() {
  console.log('\n--- Testing OWNKEYS handler ---');
  let obj = getInitialObject();
  obj = watchObj(obj, 'ownKeys-test', {});

  console.log('1. Using Object.keys():', Object.keys(obj));
  console.log('2. Using Object.getOwnPropertyNames():', Object.getOwnPropertyNames(obj));
  console.log('3. Using Object.getOwnPropertySymbols():', Object.getOwnPropertySymbols(obj));
  console.log('4. Using Reflect.ownKeys():', Reflect.ownKeys(obj));
  console.log('5. Using for...in loop:');
  for (const key in obj) { console.log(key); }

  console.log('\n--- Testing after unwatchObj ---');
  obj = unwatchObj(obj);
  console.log('6. Using Object.keys() after unwatch:', Object.keys(obj));
  console.log('7. Using for...in after unwatch:');
  for (const key in obj) { console.log(key); }
}

function test_defineProperty() {
  console.log('\n--- Testing DEFINEPROPERTY handler ---');
  let obj = getInitialObject();
  obj = watchObj(obj, 'defineProperty-test', {});

  console.log('1. Defining a new property:');
  Object.defineProperty(obj, 'x', { value: 100, writable: true, configurable: true, enumerable: true });
  console.log('2. Modifying an existing property:');
  Object.defineProperty(obj, 'a', { value: 10, writable: false });

  console.log('\n--- Testing after unwatchObj ---');
  obj = unwatchObj(obj);
  Object.defineProperty(obj, 'y', { value: 200 });
  console.log('3. Object after unwatch:', obj);
}

function test_getPrototypeOf() {
  console.log('\n--- Testing GETPROTOTYPEOF handler ---');
  let obj = getInitialObject();
  obj = watchObj(obj, 'getPrototypeOf-test', {});

  console.log('1. Using Object.getPrototypeOf():', Object.getPrototypeOf(obj));
  console.log('2. Using `__proto__`:', obj.__proto__);
  console.log('3. Using `isPrototypeOf`:', Object.prototype.isPrototypeOf(obj));

  console.log('\n--- Testing after unwatchObj ---');
  obj = unwatchObj(obj);
  console.log('4. Using Object.getPrototypeOf() after unwatch:', Object.getPrototypeOf(obj));
}

function test_setPrototypeOf() {
  console.log('\n--- Testing SETPROTOTYPEOF handler ---');
  let obj = getInitialObject();
  obj = watchObj(obj, 'setPrototypeOf-test', {});
  const newProto = { newMethod: () => 'from new proto' };

  console.log('1. Using Object.setPrototypeOf():');
  Object.setPrototypeOf(obj, newProto);
  console.log('2. New prototype:', Object.getPrototypeOf(obj));

  console.log('\n--- Testing after unwatchObj ---');
  obj = unwatchObj(obj);
  const anotherProto = { anotherMethod: () => 'another proto' };
  Object.setPrototypeOf(obj, anotherProto);
  console.log('3. Prototype after unwatch:', Object.getPrototypeOf(obj));
}

// Run all tests
test_get();
test_set();
test_has();
test_deleteProperty();
test_ownKeys();
test_defineProperty();
test_getPrototypeOf();
test_setPrototypeOf();