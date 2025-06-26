import {watchObj, unwatchObj} from '../index.js';

let testArray = [1, 2, 3, 4, 5];

testArray = watchObj(testArray, 'testArray', {});

console.log('--- test array get ---');
console.log(testArray[0]);

console.log('\n--- test array set ---');
testArray[1] = 20;

console.log('\n--- test array push ---');
testArray.push(6);

console.log('\n--- test array pop ---');
testArray.pop();

console.log('\n--- test array splice ---');
testArray.splice(1, 2, 'a', 'b');

console.log('\n--- test array length ---');
console.log(testArray.length);

console.log('\n--- test array iteration ---');
testArray.forEach(item => console.log(item));

console.log('\n--- test array map ---');
const mapped = testArray.map(x => x + '!');
console.log(mapped);

console.log('\n--- unwatchObj test array ---');

testArray = unwatchObj(testArray);
console.log(testArray[1])

