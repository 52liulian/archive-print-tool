/**
 * 打印模块 —— 生成 A4 页面 DOM，支持套打（隐藏底图）与完整（含底图）两种模式。
 * 页面尺寸与字段坐标均为 mm，配合 @page { size: A4; margin: 0 } 保证打印与预览一致。
 */
(function (global) {
  'use strict';

  var App = global.App = global.App || {};
  var Config = App.Config;

  /**
   * 创建单张 A4 页面。
   * @param {string} tab 'cover' 或 'back'
   * @param {Object} data 该页字段值 { fieldId: value }
   * @param {Object} layout 完整布局配置
   * @param {string} mode 'overlay'（套打）或 'full'（完整）
   * @param {Object} [offset] 全局打印偏移 { x, y }（毫米），用于适配打印机进纸偏差
   * @returns {HTMLElement}
   */
  function createPage(tab, data, layout, mode, offset) {
    var offX = offset && isFinite(Number(offset.x)) ? Number(offset.x) : 0;
    var offY = offset && isFinite(Number(offset.y)) ? Number(offset.y) : 0;
    var page = document.createElement('div');
    page.className = 'page-sheet mode-' + (mode === 'full' ? 'full' : 'overlay');
    page.setAttribute('data-tab', tab);

    var img = document.createElement('img');
    img.className = 'page-bg';
    img.src = Config.IMAGES[tab];
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    page.appendChild(img);

    var fields = Config.FIELDS[tab] || [];
    fields.forEach(function (field) {
      var cfg = layout[tab] && layout[tab][field.id];
      if (!cfg || !cfg.visible) { return; }
      var value = data && data[field.id] ? String(data[field.id]) : '';
      if (!value) { return; } // 空字段不留下任何占位

      var el = document.createElement('div');
      el.className = 'pf';
      el.style.left = Config.round1(cfg.x + offX) + 'mm';
      el.style.top = Config.round1(cfg.y + offY) + 'mm';
      el.style.width = cfg.w + 'mm';
      el.style.height = cfg.h + 'mm';

      var text = document.createElement('div');
      text.className = 'field-text ' + (field.type === 'textarea' ? 'multi' : 'single');
      text.style.fontSize = cfg.fontSize + 'pt';
      text.style.fontFamily = cfg.fontFamily ? '"' + cfg.fontFamily + '"' : '';
      text.style.textAlign = cfg.align;
      var span = document.createElement('span');
      span.textContent = value;
      text.appendChild(span);
      el.appendChild(text);
      page.appendChild(el);
    });
    return page;
  }

  /**
   * 批量创建页面。
   * @param {Array<{tab:string, data:Object}>} items 页面项
   * @param {Object} layout 布局配置
   * @param {string} mode 打印模式
   * @returns {Array<HTMLElement>}
   */
  function createPages(items, layout, mode, offset) {
    return items.map(function (item) {
      return createPage(item.tab, item.data || {}, layout, mode, offset);
    });
  }

  /** 等待容器内所有底图加载完成（避免打印出空白底图）。 */
  function waitForImages(root) {
    var imgs = root.querySelectorAll('img');
    var pending = [];
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i];
      if (img.complete && img.naturalWidth > 0) { continue; }
      pending.push(new Promise(function (resolve) {
        img.onload = resolve;
        img.onerror = resolve;
        // 兜底：某些浏览器本地图片 complete 状态异常时 1 秒后放行。
        global.setTimeout(resolve, 1000);
      }));
    }
    return Promise.all(pending);
  }

  /** 清空容器。 */
  function clear(root) {
    while (root.firstChild) { root.removeChild(root.firstChild); }
  }

  /** 调用浏览器打印对话框。 */
  function doPrint() {
    global.print();
  }

  App.Print = {
    createPage: createPage,
    createPages: createPages,
    waitForImages: waitForImages,
    clear: clear,
    doPrint: doPrint
  };
})(window);
