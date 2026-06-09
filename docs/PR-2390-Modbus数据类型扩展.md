# PR #2390: Modbus 数据类型扩展

> **来源**: https://github.com/frangoteam/FUXA/pull/2390  
> **作者**: steve0023  
> **状态**: Open (等待合并到 master)  
> **分支**: `64bit-datatype-clean`  
> **日期**: 2026-06-04

---

## 概述

新增 Modbus 32位和64位数据类型，修复字节序问题，改进 GUI 标签类型下拉框显示。

---

## 新增数据类型

### 64位数据类型

| 类型 | 字节序 | MBslave 格式 | 说明 |
|------|--------|-------------|------|
| `UInt64` | 大端 | - | 64位无符号整数（大端） |
| `UInt64LE` | 小端 | - | 64位无符号整数（小端） |
| `Int64MBE` | 7,8,5,6,3,4,1,2 | Little endian byte swap | 64位有符号整数 |
| `UInt64MBE` | 7,8,5,6,3,4,1,2 | Little endian byte swap | 64位无符号整数 |
| `Int64MLE` | 5,6,7,8,1,2,3,4 | Big endian byte swap | 64位有符号整数 |
| `UInt64MLE` | 5,6,7,8,1,2,3,4 | Big endian byte swap | 64位无符号整数 |
| `Float64MBE` | 7,8,5,6,3,4,1,2 | Little endian byte swap | 64位双精度浮点 |
| `Float64MLE` | 5,6,7,8,1,2,3,4 | Big endian byte swap | 64位双精度浮点 |

### 32位字节交换变体

| 类型 | 字节序 | MBslave 格式 | 说明 |
|------|--------|-------------|------|
| `Int32MBE` | 2,1,4,3 | Big endian byte swap | 32位有符号整数 |
| `UInt32MBE` | 2,1,4,3 | Big endian byte swap | 32位无符号整数 |
| `Float32MBE` | 2,1,4,3 | Big endian byte swap | 32位浮点数 |

---

## Bug 修复

### 1. Bool 解析器修复

**问题**: Holding Register 中 Bool 类型读取不正确

**修复**:
- Holding Register: 读取 2 字节 UInt16BE
- Coil: 回退到 1 字节读取

### 2. Float32 精度问题

**问题**: Float32 类型存在浮点精度伪影

**修复**: 应用 7 位有效数字舍入

```javascript
// 修复前
value = buffer.readFloatBE(offset);

// 修复后
value = parseFloat(buffer.readFloatBE(offset).toPrecision(7));
```

### 3. `_swap` 缓冲区污染

**问题**: `_swap` 函数直接修改共享的 Modbus 响应缓冲区，导致后续解析错误

**修复**: 解析器现在操作缓冲区副本

```javascript
// 修复前
function _swap(buffer, offset, length) {
    // 直接修改 buffer
    buffer.swap16(); // 污染原始缓冲区
}

// 修复后
function _swap(buffer, offset, length) {
    const copy = Buffer.from(buffer, offset, length);
    copy.swap16();
    return copy;
}
```

---

## GUI 改进

### 标签类型下拉框

添加字节序提示，使用 Teltonika 表示法：

| 显示格式 | 示例 |
|---------|------|
| `Int32MLE (32bit INT, Byte order 3,4,1,2)` | 32位整数，字节序 3,4,1,2 |
| `Float64MBE (64bit FLOAT, Byte order 7,8,5,6,3,4,1,2)` | 64位浮点，字节序 7,8,5,6,3,4,1,2 |

### 枚举排序

`ModbusTagType` 枚举按以下顺序排序：
1. Bool
2. 16位类型 (BE, LE)
3. 32位类型 (BE, LE, MLE, MBE)
4. 64位类型 (BE, LE, MLE, MBE)

---

## 字节序参考表

| 类型 | 字节序 | MBslave 格式 | 说明 |
|------|--------|-------------|------|
| `Int32LE` | 4,3,2,1 | Little endian | 小端 |
| `Int32MLE` | 3,4,1,2 | Little endian byte swap | 小端字节交换 |
| `Int32MBE` | 2,1,4,3 | Big endian byte swap | 大端字节交换 |
| `Int64MBE` | 7,8,5,6,3,4,1,2 | Little endian byte swap | 小端字节交换 |
| `Int64MLE` | 5,6,7,8,1,2,3,4 | Big endian byte swap | 大端字节交换 |

---

## 测试状态

| 测试项 | 状态 | 备注 |
|--------|------|------|
| Bool (Holding Register) | ✅ 已测试 | MBslave 模拟器 |
| Bool (Coil) | ✅ 已测试 | MBslave 模拟器 |
| 32位变体 (Int/UInt/Float LE, MBE, MLE) | ✅ 已测试 | MBslave 模拟器 |
| 64位变体 (Int/UInt/Float MBE, MLE) | ✅ 已测试 | MBslave 模拟器 |
| Int16LE, UInt16LE | ❌ 未测试 | 无小端设备模拟器 |
| Int64LE, UInt64LE | ❌ 未测试 | 无小端设备模拟器 |

---

## 已知限制

### JavaScript Number 精度

JavaScript `Number` 类型使用 IEEE 754 双精度浮点，有效精度约 15-17 位数字。

**影响**:
- Int64/UInt64 大数值会被近似
- 超过 `Number.MAX_SAFE_INTEGER` (2^53 - 1) 的值会丢失精度

**示例**:
```javascript
// 安全范围
const safe = 9007199254740991; // 2^53 - 1

// 超出范围会丢失精度
const large = 9223372036854775807; // Int64 最大值
console.log(large); // 9223372036854775808 (精度丢失)
```

---

## 对定制版本的影响

### 优先级评估

| 修改项 | 优先级 | 理由 |
|--------|--------|------|
| `_swap` 缓冲区污染修复 | ⭐⭐⭐ 高 | 可能导致数据解析错误 |
| Bool 解析器修复 | ⭐⭐⭐ 高 | Holding Register 中 Bool 读取错误 |
| Float32 精度修复 | ⭐⭐ 中 | 影响数据显示准确性 |
| 64位数据类型 | ⭐ 低 | 按需使用 |
| GUI 字节序提示 | ⭐ 低 | 改善用户体验 |

### 合并建议

**建议合并**，特别是以下修复：
1. `_swap` 缓冲区污染 — 可能影响所有使用字节交换的数据类型
2. Bool 解析器 — Holding Register 中 Bool 读取问题

---

## 合并步骤

```bash
# 1. 添加上游仓库（如果还没有）
git remote add upstream https://github.com/frangoteam/FUXA.git

# 2. 拉取 PR 分支
git fetch upstream pull/2390/head:pr-2390

# 3. 合并到当前分支
git checkout 1.3.3-minimal
git merge pr-2390

# 4. 解决冲突（如果有）
# 5. 测试验证
# 6. 推送到私有仓库
git push private 1.3.3-minimal
```

---

## 相关文件

PR 修改了以下文件（共 4 个）：

| 文件 | 修改内容 |
|------|---------|
| `server/modbus-handler.js` | 数据类型解析器、`_swap` 修复 |
| `server/modbus.js` | ModbusTagType 枚举定义 |
| `client/src/app/_tags/tags.component.html` | GUI 下拉框显示 |
| `client/src/app/_tags/tags.component.ts` | 字节序提示逻辑 |

---

## 参考资料

- **PR 链接**: https://github.com/frangoteam/FUXA/pull/2390
- **MBslave 模拟器**: 用于验证字节序
- **Teltonika 字节序表示法**: 设备常用字节序标记方式