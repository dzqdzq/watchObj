# WatchObj - 对象监控工具

一个功能强大的 JavaScript 对象监控工具，基于 Proxy 实现

## ✨ 核心特性

- 🎯 **高度可定制**: 支持函数参数修改、返回值修改、完全函数替换
- 🔍 **属性访问控制**: 自定义属性访问逻辑
- 🐛 **智能调试**: 支持条件断点，精确控制调试时机

## 安装

```bash
npm install watchobj -g
```

## 使用方法

### 基本用法

```javascript
// 监控对象
targetObj = watchObj(targetObj, 'targetName', {
  // 配置监控选项
});

// 取消对象监控
targetObj = unwatchObj(targetObj);
```

### 详细配置

```javascript
targetObj = watchObj(targetObj, 'targetName', {
  // 监控属性获取
  get: {
    log: true,  // 是否打印日志
    debugger: function(context) {  // 自定义断点逻辑
      // context 包含访问的属性信息
      return context.property === 'sensitiveData';
    }
  },

  // 监控属性设置
  set: {
    log: true,
    debugger: function(context) {
      // context 包含属性和新值信息
      return context.value > 100;
    },
    onModResult: function(context) {
      // 修改设置的值
      return context.value * 2;
    }
  },

  // 其他可配置的处理器
  apply: { /* 函数调用 */ },
  construct: { /* 构造函数调用 */ },
  defineProperty: { /* 属性定义 */ },
  deleteProperty: { /* 属性删除 */ },
  has: { /* in 操作符 */ },
  ownKeys: { /* Object.keys等 */ },
  getPrototypeOf: { /* 原型获取 */ },
  setPrototypeOf: { /* 原型设置 */ }
});
```

### 命令行工具

查看帮助信息：

```bash
watchObj -h
```

## 实际应用场景

1. **调试复杂对象**：监控对象的属性访问和修改，快速定位问题
2. **性能分析**：追踪函数调用和属性访问频率
3. **数据验证**：在属性设置时进行数据校验和转换
4. **行为记录**：记录对象的所有操作

## 📄 许可证

MIT License