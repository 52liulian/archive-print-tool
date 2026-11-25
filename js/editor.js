/**
 * 所见即所得编辑模块 —— 字段渲染、鼠标/触摸拖拽、右下角缩放、键盘微调。
 * 所有坐标以毫米为单位，拖拽时按页面实际渲染尺寸换算，因此缩放预览不影响精度。
 */
(function (global) {
  'use strict';

  var App = global.App = global.App || {};
  var Config = App.Config;

  var pageEl = null;
  var layoutRef = null;
  var onChange = null;
  var selectedId = null;
  var dragState = null;

  /** 初始化编辑器。 */
  function init(options) {
    pageEl = options.pageEl;
    onChange = options.onChange || function () {};
    selectedId = null;
    dragState = null;
  }

  /** 计算当前页面渲染尺寸对应的「每像素多少毫米」。 */
  function mmPerPixel() {
    var rect = pageEl.getBoundingClientRect();
    var width = rect.width || 1;
    var height = rect.height || 1;
    return { x: Config.PAGE_W / width, y: Config.PAGE_H / height };
  }

  /** 设置选中字段（null 表示取消选中）。 */
  function select(id) {
    selectedId = id;
    var nodes = pageEl.querySelectorAll('.ef');
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var active = node.getAttribute('data-id') === id;
      node.classList.toggle('ef-selected', active);
      var handle = node.querySelector('.ef-resize');
      if (active && !handle) {
        var h = document.createElement('div');
        h.className = 'ef-resize';
        h.title = '拖动调整大小';
        node.appendChild(h);
      } else if (!active && handle) {
        node.removeChild(handle);
      }
    }
  }

  /** 渲染指定页签的字段。 */
  function render(tab, data, layout) {
    if (!pageEl) { return; }
    layoutRef = layout;
    selectedId = null;
    // 仅移除旧字段元素，必须保留底图 <img>，否则底图会随每次重绘消失。
    var oldFields = pageEl.querySelectorAll('.ef');
    for (var i = 0; i < oldFields.length; i++) {
      pageEl.removeChild(oldFields[i]);
    }

    var fields = Config.FIELDS[tab] || [];
    fields.forEach(function (field) {
      var cfg = layout[tab][field.id];
      if (!cfg || !cfg.visible) { return; }

      var el = document.createElement('div');
      el.className = 'ef';
      el.setAttribute('data-id', field.id);
      el.setAttribute('data-tab', tab);
      el.style.left = cfg.x + 'mm';
      el.style.top = cfg.y + 'mm';
      el.style.width = cfg.w + 'mm';
      el.style.height = cfg.h + 'mm';
      el.title = field.label + '：拖动移动，点右下角调整大小，方向键微调 0.1mm';

      var value = data && data[field.id] ? String(data[field.id]) : '';
      var text = document.createElement('div');
      text.className = 'field-text ' + (field.type === 'textarea' ? 'multi' : 'single');
      text.style.fontSize = cfg.fontSize + 'pt';
      text.style.fontFamily = cfg.fontFamily ? '"' + cfg.fontFamily + '"' : '';
      text.style.textAlign = cfg.align;
      var span = document.createElement('span');
      span.textContent = value;
      text.appendChild(span);
      el.appendChild(text);

      el.addEventListener('pointerdown', onPointerDown);
      pageEl.appendChild(el);
    });
  }

  /** 指针按下：选中字段并启动拖拽或缩放。 */
  function onPointerDown(event) {
    if (event.button !== 0 && event.pointerType === 'mouse') { return; }
    var el = event.currentTarget;
    var id = el.getAttribute('data-id');
    var tab = el.getAttribute('data-tab');
    select(id);
    var cfg = layoutRef[tab][id];
    var isResize = event.target.classList && event.target.classList.contains('ef-resize');
    var mpp = mmPerPixel();
    dragState = {
      el: el, id: id, tab: tab, cfg: cfg,
      mode: isResize ? 'resize' : 'move',
      startX: event.clientX, startY: event.clientY,
      origX: cfg.x, origY: cfg.y, origW: cfg.w, origH: cfg.h,
      mpp: mpp
    };
    if (el.setPointerCapture) {
      try { el.setPointerCapture(event.pointerId); } catch (e) { /* 忽略 */ }
    }
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    event.preventDefault();
  }

  /** 指针移动：按毫米更新位置或尺寸，并实时回调。 */
  function onPointerMove(event) {
    if (!dragState) { return; }
    var dx = (event.clientX - dragState.startX) * dragState.mpp.x;
    var dy = (event.clientY - dragState.startY) * dragState.mpp.y;
    var cfg = dragState.cfg;
    if (dragState.mode === 'move') {
      cfg.x = Config.round1(Config.clamp(dragState.origX + dx, 0, Config.PAGE_W - cfg.w));
      cfg.y = Config.round1(Config.clamp(dragState.origY + dy, 0, Config.PAGE_H - cfg.h));
      dragState.el.style.left = cfg.x + 'mm';
      dragState.el.style.top = cfg.y + 'mm';
    } else {
      cfg.w = Config.round1(Config.clamp(dragState.origW + dx, 4, Config.PAGE_W - cfg.x));
      cfg.h = Config.round1(Config.clamp(dragState.origH + dy, 4, Config.PAGE_H - cfg.y));
      dragState.el.style.width = cfg.w + 'mm';
      dragState.el.style.height = cfg.h + 'mm';
    }
  }

  /** 指针抬起：解绑事件并通知布局已变更。 */
  function onPointerUp(event) {
    if (!dragState) { return; }
    var el = dragState.el;
    el.removeEventListener('pointermove', onPointerMove);
    el.removeEventListener('pointerup', onPointerUp);
    el.removeEventListener('pointercancel', onPointerUp);
    if (el.releasePointerCapture) {
      try { el.releasePointerCapture(event.pointerId); } catch (e) { /* 忽略 */ }
    }
    dragState = null;
    onChange(layoutRef);
  }

  /** 键盘方向键微调选中字段：方向键 0.1mm，Shift+方向键 1mm。 */
  function handleKeydown(event) {
    if (!selectedId || !layoutRef) { return; }
    var tag = (event.target && event.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') { return; }
    var tab = null;
    for (var t = 0; t < Config.TABS.length; t++) {
      var candidate = Config.TABS[t];
      if (layoutRef[candidate] && layoutRef[candidate][selectedId]) { tab = candidate; break; }
    }
    if (!tab) { return; }
    var cfg = layoutRef[tab][selectedId];
    var step = event.shiftKey ? 1 : 0.1;
    var handled = true;
    switch (event.key) {
      case 'ArrowLeft':  cfg.x = Config.round1(Config.clamp(cfg.x - step, 0, Config.PAGE_W - cfg.w)); break;
      case 'ArrowRight': cfg.x = Config.round1(Config.clamp(cfg.x + step, 0, Config.PAGE_W - cfg.w)); break;
      case 'ArrowUp':    cfg.y = Config.round1(Config.clamp(cfg.y - step, 0, Config.PAGE_H - cfg.h)); break;
      case 'ArrowDown':  cfg.y = Config.round1(Config.clamp(cfg.y + step, 0, Config.PAGE_H - cfg.h)); break;
      default: handled = false;
    }
    if (handled) {
      event.preventDefault();
      var currentId = selectedId;
      render(tab, App.Editor.currentData, layoutRef);
      select(currentId);
      onChange(layoutRef);
    }
  }

  /** 由 App 在切换页签时写入，供键盘微调重渲染使用。 */
  App.Editor = {
    init: init,
    render: render,
    select: select,
    handleKeydown: handleKeydown,
    currentData: null,
    getSelectedId: function () { return selectedId; }
  };
})(window);
