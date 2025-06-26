import {watchObj, unwatchObj} from '../index.js';

class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  sayHello() {
    return `Hello, I'm ${this.name}`;
  }

  birthday() {
    this.age += 1;
    return `Happy ${this.age}th birthday!`;
  }

  setName(newName) {
    this.name = newName;
  }
}

Person = watchObj(Person, 'testPersonClass', {
  apply: {
    log: true,
    debugger: false
  },
  get: {
    log: true
  },
  set: {
    log: true
  }
});
let person = new Person('Alice', 25);

console.log('--- test class method call ---');
console.log(person.sayHello());

console.log('\n--- test class property get ---');
console.log(person.name);
console.log(person.age);

console.log('\n--- test class property set ---');
person.setName('Bob');

console.log('\n--- test class method with state change ---');
console.log(person.birthday());

console.log('\n--- test class property after changes ---');
console.log(person.name);
console.log(person.age);

console.log('\n--- unwatchObj test class ---');
Person = unwatchObj(Person);
let person1 = new Person('Alice1', 26);
console.log(person1.name);
console.log(person1.age);