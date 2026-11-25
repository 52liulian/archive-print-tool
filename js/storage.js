/**
 * 本地持久化模块 —— 基于 window.localStorage。
 * 所有读写均做异常保护，隐私模式或禁用存储时退化为内存存储，不影响工具使用。
 */
(function (global) {
  'use strict';

  var App = global.App = global.App || {};
  var PREFIX = 'archivePrintTool.v1.';
  var memory = {};

  /** 读取并反序列化指定键。 */
  function get(name, fallback) {
    try {
      var raw = global.localStorage.getItem(PREFIX + name);
      if (raw === null || raw === undefined) {
        return Object.prototype.hasOwnProperty.call(memory, name) ? memory[name] : fallback;
      }
      return JSON.parse(raw);
    } catch (e) {
      return Object.prototype.hasOwnProperty.call(memory, name) ? memory[name] : fallback;
    }
  }

  /** 序列化并写入指定键。 */
  function set(name, value) {
    memory[name] = value;
    try {
      global.localStorage.setItem(PREFIX + name, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  /** 删除指定键。 */
  function remove(name) {
    delete memory[name];
    try { global.localStorage.removeItem(PREFIX + name); } catch (e) { /* 忽略 */ }
  }

  App.Storage = { get: get, set: set, remove: remove, PREFIX: PREFIX };
})(window);
