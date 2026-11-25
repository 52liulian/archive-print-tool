/**
 * 档案封面封底套打工具 —— 主控制器。
 * 负责状态管理、表单渲染、布局编辑、数据持久化、批量处理与打印预览。
 */
(function (global) {
  'use strict';

  var App = global.App = global.App || {};
  var Config = App.Config;
  var Storage = App.Storage;
  var Parser = App.Parser;
  var Editor = App.Editor;
  var Print = App.Print;

  var state = {
    tab: 'cover',
    printMode: 'overlay',
    inputMode: 'single',
    layout: null,
    single: null,
    records: [],
    recordIndex: 0,
    batchText: '',
    previewItems: [],
    previewZoom: 1,
    offsetX: 0,
    offsetY: 0
  };

  var dom = {};
  var toastTimer = 0;

  /* ------------------------------------------------------------------ */
  /* 通用工具                                                            */
  /* ------------------------------------------------------------------ */

  /** 显示短时提示。 */
  function toast(message) {
    var el = dom.toast;
    if (!el) { return; }
    el.textContent = message;
    el.classList.add('toast-show');
    global.clearTimeout(toastTimer);
    toastTimer = global.setTimeout(function () { el.classList.remove('toast-show'); }, 2400);
  }

  /** 数值安全转换。 */
  function num(value, fallback) {
    var n = Number(value);
    return isFinite(n) ? n : fallback;
  }

  /** 判断字体名是否在可选列表中。 */
  function isValidFont(name) {
    if (typeof name !== 'string' || !name) { return false; }
    var list = Config.FONT_OPTIONS || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].name === name) { return true; }
    }
    return false;
  }

  /** 合并已保存布局与默认布局，兼容后续新增字段。 */
  function mergeLayout(saved) {
    var fresh = Config.defaultLayout();
    Config.TABS.forEach(function (tab) {
      Config.FIELDS[tab].forEach(function (f) {
        var s = saved && saved[tab] && saved[tab][f.id];
        if (!s) { return; }
        fresh[tab][f.id] = {
          x: Config.round1(Config.clamp(num(s.x, f.x), 0, Config.PAGE_W)),
          y: Config.round1(Config.clamp(num(s.y, f.y), 0, Config.PAGE_H)),
          w: Config.round1(Config.clamp(num(s.w, f.w), 4, Config.PAGE_W)),
          h: Config.round1(Config.clamp(num(s.h, f.h), 4, Config.PAGE_H)),
          fontFamily: isValidFont(s.fontFamily) ? s.fontFamily : f.fontFamily,
          fontSize: Config.clamp(num(s.fontSize, f.fontSize), 6, 48),
          align: (s.align === 'left' || s.align === 'center') ? s.align : f.align,
          visible: s.visible !== false
        };
      });
    });
    return fresh;
  }

  /**
   * 按版本迁移历史布局坐标：逐属性判断，仅当缓存值仍等于旧默认值（未被用户手动调整）时才更新为新值。
   * 命中迁移的布局立即落盘，避免"版本号已写但布局未存"导致迁移丢失。
   */
  function migrateLayout(layout) {
    var currentVersion = num(Storage.get(Config.STORAGE_KEYS.layoutVersion, 1), 1);
    if (currentVersion >= Config.LAYOUT_VERSION) { return layout; }
    var changed = false;
    Config.LAYOUT_MIGRATIONS.forEach(function (m) {
      if (m.version <= currentVersion) { return; }
      var cfg = layout[m.tab] && layout[m.tab][m.id];
      if (!cfg) { return; }
      Object.keys(m.props).forEach(function (prop) {
        var from = m.props[prop][0];
        var to = m.props[prop][1];
        var cur = cfg[prop];
        var match = (typeof from === 'number')
          ? Config.round1(num(cur, NaN)) === Config.round1(from)
          : cur === from;
        if (match) { cfg[prop] = to; changed = true; }
      });
    });
    if (changed) { Storage.set(Config.STORAGE_KEYS.layout, layout); }
    Storage.set(Config.STORAGE_KEYS.layoutVersion, Config.LAYOUT_VERSION);
    return layout;
  }

  /** 合并已保存数据，仅保留当前配置中存在的字段。 */
  function mergeOneData(saved) {
    var fresh = Config.defaultData();
    Config.TABS.forEach(function (tab) {
      Config.FIELDS[tab].forEach(function (f) {
        var v = saved && saved[tab] && saved[tab][f.id];
        if (v !== undefined && v !== null) { fresh[tab][f.id] = String(v); }
      });
    });
    return fresh;
  }

  /** 合并批量记录数组。 */
  function mergeRecords(saved) {
    if (!Array.isArray(saved)) { return []; }
    return saved.map(function (r) { return mergeOneData(r); });
  }

  /** 保存全部状态到 localStorage。 */
  function save() {
    Storage.set(Config.STORAGE_KEYS.layout, state.layout);
    Storage.set(Config.STORAGE_KEYS.single, state.single);
    Storage.set(Config.STORAGE_KEYS.records, state.records);
    Storage.set(Config.STORAGE_KEYS.settings, {
      tab: state.tab,
      printMode: state.printMode,
      inputMode: state.inputMode,
      recordIndex: state.recordIndex,
      batchText: state.batchText,
      offsetX: state.offsetX,
      offsetY: state.offsetY
    });
  }

  /** 全局打印偏移（毫米）。 */
  function getOffset() {
    return { x: state.offsetX || 0, y: state.offsetY || 0 };
  }

  /** 当前页签正在编辑/预览的字段数据对象（{ fieldId: value }）。 */
  function currentData() {
    if (state.inputMode === 'batch') {
      if (state.records.length === 0) { return null; }
      var record = state.records[state.recordIndex];
      return record ? record[state.tab] : null;
    }
    return state.single ? state.single[state.tab] : null;
  }

  /** 当前来源的完整数据（含 cover / back 两页）。 */
  function currentFullData() {
    if (state.inputMode === 'batch') {
      return state.records.length > 0 ? state.records[state.recordIndex] : null;
    }
    return state.single;
  }

  /* ------------------------------------------------------------------ */
  /* 渲染                                                                */
  /* ------------------------------------------------------------------ */

  /** 渲染页签选中态。 */
  function renderTabs() {
    dom.tabCover.classList.toggle('active', state.tab === 'cover');
    dom.tabBack.classList.toggle('active', state.tab === 'back');
  }

  /** 渲染录入模式面板可见性。 */
  function renderInputMode() {
    dom.singleControls.hidden = state.inputMode !== 'single';
    dom.batchControls.hidden = state.inputMode !== 'batch';
    dom.modeSingle.checked = state.inputMode === 'single';
    dom.modeBatch.checked = state.inputMode === 'batch';
    dom.modeOverlay.checked = state.printMode === 'overlay';
    dom.modeFull.checked = state.printMode === 'full';
  }

  /** 渲染左侧字段表单。 */
  function renderForm() {
    var data = currentData();
    var fields = Config.FIELDS[state.tab] || [];
    dom.formPanel.innerHTML = '';

    if (!data) {
      var empty = document.createElement('div');
      empty.className = 'empty-hint';
      empty.textContent = '尚无批量记录。请在上方粘贴表格内容并点击「解析表格」。';
      dom.formPanel.appendChild(empty);
      return;
    }

    fields.forEach(function (field) {
      var cfg = state.layout[state.tab][field.id];
      var card = document.createElement('div');
      card.className = 'form-card';
      card.setAttribute('data-id', field.id);

      var head = document.createElement('div');
      head.className = 'form-card-head';

      var label = document.createElement('span');
      label.className = 'form-card-label';
      label.textContent = field.label;
      head.appendChild(label);

      var visLabel = document.createElement('label');
      visLabel.className = 'mini-check';
      var vis = document.createElement('input');
      vis.type = 'checkbox';
      vis.setAttribute('data-bind', 'visible');
      vis.checked = cfg.visible !== false;
      visLabel.appendChild(vis);
      visLabel.appendChild(document.createTextNode('显示'));
      head.appendChild(visLabel);

      var toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'link-btn settings-toggle';
      toggle.setAttribute('data-action', 'toggle-settings');
      toggle.textContent = '位置/样式';
      head.appendChild(toggle);
      card.appendChild(head);

      var input;
      if (field.type === 'textarea') {
        input = document.createElement('textarea');
        input.rows = 5;
        input.setAttribute('data-bind', 'value');
        input.placeholder = '请输入' + field.label + '（支持多行）';
      } else {
        input = document.createElement('input');
        input.type = 'text';
        input.setAttribute('data-bind', 'value');
        input.placeholder = '请输入' + field.label;
      }
      input.value = data[field.id] || '';
      card.appendChild(input);

      var settings = document.createElement('div');
      settings.className = 'form-card-settings';
      settings.hidden = true;

      var row1 = document.createElement('div');
      row1.className = 'setting-row';
      row1.appendChild(makeFontControl('字体', 'fontFamily', cfg.fontFamily, field.fontFamily));
      row1.appendChild(makeNumberControl('字号(pt)', 'fontSize', cfg.fontSize, 6, 48, 0.5));
      row1.appendChild(makeSelectControl('对齐', 'align', cfg.align));
      settings.appendChild(row1);

      var row2 = document.createElement('div');
      row2.className = 'setting-row pos-row';
      row2.appendChild(makeNumberControl('X(mm)', 'x', cfg.x, 0, Config.PAGE_W, 0.1));
      row2.appendChild(makeNumberControl('Y(mm)', 'y', cfg.y, 0, Config.PAGE_H, 0.1));
      row2.appendChild(makeNumberControl('宽(mm)', 'w', cfg.w, 4, Config.PAGE_W, 0.1));
      row2.appendChild(makeNumberControl('高(mm)', 'h', cfg.h, 4, Config.PAGE_H, 0.1));
      settings.appendChild(row2);

      card.appendChild(settings);
      dom.formPanel.appendChild(card);
    });
  }

  /** 构造数字输入控件。 */
  function makeNumberControl(text, bind, value, min, max, step) {
    var wrap = document.createElement('label');
    wrap.className = 'setting-field';
    var span = document.createElement('span');
    span.textContent = text;
    var input = document.createElement('input');
    input.type = 'number';
    input.setAttribute('data-bind', bind);
    input.value = value;
    input.min = min;
    input.max = max;
    input.step = step;
    wrap.appendChild(span);
    wrap.appendChild(input);
    return wrap;
  }

  /** 构造字体选择控件；value 与默认字体不同时控件高亮标记「已自定义」。 */
  function makeFontControl(text, bind, value, defaultFont) {
    var wrap = document.createElement('label');
    wrap.className = 'setting-field';
    var span = document.createElement('span');
    span.textContent = text;
    var select = document.createElement('select');
    select.setAttribute('data-bind', bind);
    (Config.FONT_OPTIONS || []).forEach(function (f) {
      var opt = document.createElement('option');
      opt.value = f.name;
      opt.textContent = f.name;
      opt.selected = value === f.name;
      opt.style.fontFamily = '"' + f.name + '"';
      select.appendChild(opt);
    });
    // 当前值不在列表中时（历史自定义字体），保留显示
    if (value && select.selectedIndex === -1) {
      var opt = document.createElement('option');
      opt.value = value;
      opt.textContent = value;
      opt.selected = true;
      select.insertBefore(opt, select.firstChild);
    }
    // 已自定义（与默认字体不同）时高亮控件，改完立即生效
    if (value && value !== defaultFont) { select.classList.add('font-changed'); }
    wrap.appendChild(span);
    wrap.appendChild(select);
    return wrap;
  }

  /** 构造对齐选择控件。 */
  function makeSelectControl(text, bind, value) {
    var wrap = document.createElement('label');
    wrap.className = 'setting-field';
    var span = document.createElement('span');
    span.textContent = text;
    var select = document.createElement('select');
    select.setAttribute('data-bind', bind);
    var options = [{ v: 'left', t: '左对齐' }, { v: 'center', t: '居中' }];
    options.forEach(function (o) {
      var opt = document.createElement('option');
      opt.value = o.v;
      opt.textContent = o.t;
      opt.selected = value === o.v;
      select.appendChild(opt);
    });
    wrap.appendChild(span);
    wrap.appendChild(select);
    return wrap;
  }

  /** 渲染右侧编辑区（底图 + 字段）。 */
  function renderEditPage() {
    var img = dom.editPage.querySelector('.page-bg');
    if (!img) {
      img = document.createElement('img');
      img.className = 'page-bg';
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      dom.editPage.appendChild(img);
    }
    img.src = Config.IMAGES[state.tab];

    var data = currentData() || {};
    App.Editor.currentData = data;
    Editor.render(state.tab, data, state.layout);
  }

  /** 按可用宽度和高度缩放编辑区 A4 页面（仅屏幕显示，不改变内部 mm 坐标系），整页完整显示。 */
  function updateEditScale() {
    if (!dom.editViewport || !dom.editPage) { return; }
    var availW = Math.max(320, dom.editViewport.clientWidth - 36);
    var availH = Math.max(240, dom.editViewport.clientHeight - 36);
    var scale = Math.min(1, availW / 794, availH / 1123); // 210mm×297mm ≈ 794×1123px @96dpi
    dom.editPage.style.zoom = String(scale);
  }

  /** 渲染批量导航信息。 */
  function renderBatchInfo() {
    var total = state.records.length;
    dom.batchInfo.textContent = total > 0
      ? '第 ' + (state.recordIndex + 1) + ' / ' + total + ' 条'
      : '暂无记录';
    dom.batchNavPrev.disabled = total === 0 || state.recordIndex <= 0;
    dom.batchNavNext.disabled = total === 0 || state.recordIndex >= total - 1;
    dom.btnBatchPrint.disabled = total === 0;
  }

  /** 全量重绘。 */
  function renderAll() {
    renderTabs();
    renderInputMode();
    renderForm();
    renderEditPage();
    renderBatchInfo();
  }

  /* ------------------------------------------------------------------ */
  /* 交互                                                                */
  /* ------------------------------------------------------------------ */

  /** 切换页签。 */
  function setTab(tab) {
    if (state.tab === tab) { return; }
    state.tab = tab;
    save();
    renderAll();
  }

  /** 切换录入模式。 */
  function setInputMode(mode) {
    if (state.inputMode === mode) { return; }
    state.inputMode = mode;
    save();
    renderAll();
  }

  /** 切换打印模式（仅影响打印与预览，编辑区始终显示底图以便定位）。 */
  function setPrintMode(mode) {
    if (state.printMode === mode) { return; }
    state.printMode = mode;
    save();
    renderInputMode();
    if (dom.previewOverlay.hidden === false) { openPreview(state.previewItems.slice()); }
  }

  /** 批量记录跳转。 */
  function gotoRecord(index) {
    if (state.records.length === 0) { return; }
    state.recordIndex = Config.clamp(index, 0, state.records.length - 1);
    save();
    renderForm();
    renderEditPage();
    renderBatchInfo();
  }

  /** 解析粘贴的表格。 */
  function parseBatch() {
    var result = Parser.parseRecords(dom.batchPaste.value);
    state.batchText = dom.batchPaste.value;
    if (result.errors.length) { toast(result.errors.join('；')); }
    if (result.records.length === 0) { toast('未解析出有效记录，请检查表头。'); return; }
    state.records = result.records;
    state.recordIndex = 0;
    save();
    renderAll();
    toast('已解析 ' + result.records.length + ' 条记录');
  }

  /** 复制表头模板到剪贴板。 */
  function copyTemplate() {
    var text = Parser.templateTSV();
    if (global.navigator.clipboard && global.navigator.clipboard.writeText) {
      global.navigator.clipboard.writeText(text).then(function () {
        toast('表头模板已复制，可直接粘贴到 Excel 第一行');
      }).catch(function () { fallbackCopy(text); });
    } else {
      fallbackCopy(text);
    }
  }

  /* ------------------------------ 文件导入与模板下载 ------------------------------ */

  /** CSV 单元格转义：含逗号/引号/换行时用引号包裹。 */
  function escapeCsvCell(value) {
    var s = String(value === undefined || value === null ? '' : value);
    if (/[",\r\n]/.test(s)) { return '"' + s.replace(/"/g, '""') + '"'; }
    return s;
  }

  /** 触发浏览器下载。 */
  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    global.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /** 下载批量模板：优先生成 .xlsx（需内置 SheetJS），否则降级 CSV（UTF-8 BOM，Excel 可直接打开）。 */
  function downloadTemplate() {
    var matrix = Parser.templateMatrix();
    if (global.XLSX && global.XLSX.utils) {
      var ws = global.XLSX.utils.aoa_to_sheet(matrix);
      ws['!cols'] = matrix[0].map(function (h) { return { wch: Math.max(10, String(h).length * 2 + 4) }; });
      var wb = global.XLSX.utils.book_new();
      global.XLSX.utils.book_append_sheet(wb, ws, '档案数据');
      global.XLSX.writeFile(wb, '档案套打批量模板.xlsx');
      toast('Excel 模板已下载（含示例行，填入数据时可删除）');
      return;
    }
    var csv = '\uFEFF' + matrix.map(function (row) { return row.map(escapeCsvCell).join(','); }).join('\r\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), '档案套打批量模板.csv');
    toast('已下载 CSV 模板（含示例行）');
  }

  /** 解码 CSV 字节流：优先严格 UTF-8，失败回退 GBK（兼容中文 Excel 导出的 CSV）。 */
  function decodeCsvBuffer(buffer) {
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch (e) {
      try { return new TextDecoder('gbk').decode(buffer); }
      catch (e2) { return new TextDecoder('utf-8').decode(buffer); }
    }
  }

  /** 应用解析结果到批量模式。 */
  function applyBatchResult(result) {
    if (result.errors.length) { toast(result.errors.join('；')); }
    if (!result.records || result.records.length === 0) {
      toast('文件中未解析出有效记录，请检查表头（第一行须为字段中文名）。');
      return;
    }
    state.records = result.records;
    state.recordIndex = 0;
    save();
    renderAll();
    toast('已导入 ' + result.records.length + ' 条记录');
  }

  /** 过滤全空行后走矩阵解析。 */
  function applyBatchMatrix(matrix) {
    var rows = (matrix || []).filter(function (r) {
      return r.some(function (c) { return String(c === undefined || c === null ? '' : c).trim() !== ''; });
    });
    applyBatchResult(Parser.parseMatrix(rows));
  }

  /** 导入 .csv / .xls / .xlsx 批量文件。 */
  function importBatchFile(file) {
    if (!file) { return; }
    var name = String(file.name || '').toLowerCase();
    var isExcel = /\.xlsx?$/.test(name);
    var reader = new FileReader();
    reader.onload = function () {
      try {
        if (isExcel) {
          if (!global.XLSX || !global.XLSX.read) {
            toast('Excel 解析组件未就绪，请改用 CSV 文件或粘贴表格文本。');
            return;
          }
          var wb = global.XLSX.read(reader.result, { type: 'array' });
          var sheet = wb.Sheets[wb.SheetNames[0]];
          var matrix = global.XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
          applyBatchMatrix(matrix);
        } else {
          var text = decodeCsvBuffer(reader.result);
          applyBatchResult(Parser.parseRecords(text));
        }
      } catch (e) {
        toast('文件解析失败：' + (e && e.message ? e.message : '格式不受支持'));
      }
    };
    reader.onerror = function () { toast('文件读取失败，请重试。'); };
    reader.readAsArrayBuffer(file);
  }

  /** 剪贴板降级方案。 */
  function fallbackCopy(text) {
    dom.batchPaste.value = text;
    dom.batchPaste.focus();
    dom.batchPaste.select();
    try {
      var ok = document.execCommand('copy');
      toast(ok ? '表头模板已复制并填入文本框' : '模板已填入文本框，请手动复制');
    } catch (e) {
      toast('模板已填入文本框，请手动复制');
    }
  }

  /** 根据范围构造待打印页面项。 */
  function buildPrintItems(scope) {
    if (scope === 'batchAll') {
      var items = [];
      state.records.forEach(function (record) {
        items.push({ tab: 'cover', data: record.cover || {} });
        items.push({ tab: 'back', data: record.back || {} });
      });
      return items;
    }
    if (scope === 'allTabs') {
      var full = currentFullData();
      if (!full) { toast('当前没有可打印的数据。'); return []; }
      return [
        { tab: 'cover', data: full.cover || {} },
        { tab: 'back', data: full.back || {} }
      ];
    }
    var data = currentData();
    if (!data) { toast('当前没有可打印的数据。'); return []; }
    return [{ tab: state.tab, data: data }];
  }

  /** 打开打印预览弹层（多页左右并排显示，支持缩放）。 */
  function openPreview(scopeOrItems) {
    var items = Array.isArray(scopeOrItems) ? scopeOrItems : buildPrintItems(scopeOrItems);
    if (!items || items.length === 0) { return; }
    state.previewItems = items;

    // 关键：必须先显示弹层再测量舞台宽度——隐藏状态下 clientWidth 为 0，
    // 会导致缩放被兜底到最小、预览页面极小。
    dom.previewOverlay.hidden = false;
    document.body.classList.add('preview-open');

    var stage = dom.previewStage;
    Print.clear(stage);
    var pages = Print.createPages(items, state.layout, state.printMode, getOffset());

    // 预览缩放：A4 在 96dpi 下约 794 × 1123 像素。
    // 适配原则：整页完整显示在当前屏幕可视区内（宽度与高度同时纳入，
    // 多页时左右并排、每页约占舞台宽度的一半）；缩放倍率可再手动调整。
    var fitScale = previewFitScale(items.length);
    var scale = Config.clamp(fitScale * (state.previewZoom || 1), 0.15, 3);
    pages.forEach(function (page) {
      var wrap = document.createElement('div');
      wrap.className = 'preview-page-wrap';
      wrap.style.width = Math.round(794 * scale) + 'px';
      wrap.style.height = Math.round(1123 * scale) + 'px';
      var inner = document.createElement('div');
      inner.className = 'preview-page-inner';
      inner.style.transform = 'scale(' + scale + ')';
      inner.appendChild(page);
      wrap.appendChild(inner);
      stage.appendChild(wrap);
    });

    // 打印容器必须使用独立生成的 DOM：同一元素无法同时挂在预览区与打印区，
    // 直接复用会把页面从预览节点上摘走，导致预览空白。
    Print.clear(dom.printRoot);
    var printPages = Print.createPages(items, state.layout, state.printMode, getOffset());
    printPages.forEach(function (page) { dom.printRoot.appendChild(page); });

    dom.previewHint.textContent = '共 ' + items.length + ' 页 · ' +
      (state.printMode === 'overlay' ? '套打模式（不打印底图）' : '完整模式（含底图）') +
      ' · 打印时请选择 A4、100% 缩放、无边距';
    updateZoomLabel();
    Print.waitForImages(dom.printRoot);
  }

  /** 计算预览适合比例：整页（含上下左右）完整显示在预览舞台可视区内。 */
  function previewFitScale(pageCount) {
    var stage = dom.previewStage;
    var availW = pageCount >= 2
      ? Math.max(280, (stage.clientWidth - 48) / 2)
      : Math.max(280, stage.clientWidth - 48);
    var availH = Math.max(200, stage.clientHeight - 32);
    return Math.min(availW / 794, availH / 1123);
  }

  /** 更新预览缩放百分比标签。 */
  function updateZoomLabel() {
    if (!dom.zoomLabel) { return; }
    var pct = Math.round(previewFitScale(state.previewItems.length) * (state.previewZoom || 1) * 100);
    dom.zoomLabel.textContent = pct + '%';
  }

  /** 调整预览缩放倍率（step 为乘/除系数）。 */
  function zoomPreview(step) {
    state.previewZoom = Config.clamp((state.previewZoom || 1) * step, 0.3, 4);
    if (state.previewItems.length) { openPreview(state.previewItems.slice()); }
  }

  /** 预览缩放复位为适合宽度。 */
  function zoomReset() {
    state.previewZoom = 1;
    if (state.previewItems.length) { openPreview(state.previewItems.slice()); }
  }

  /** 关闭打印预览弹层。 */
  function closePreview() {
    dom.previewOverlay.hidden = true;
    document.body.classList.remove('preview-open');
  }

  /** 执行打印。 */
  function doPrint() {
    Print.waitForImages(dom.printRoot).then(function () { Print.doPrint(); });
  }

  /** 一键打印：不打开预览，直接按当前录入内容与页签生成打印页并调起打印对话框。 */
  function quickPrint() {
    var items = buildPrintItems();
    if (!items || items.length === 0) { return; }
    Print.clear(dom.printRoot);
    Print.createPages(items, state.layout, state.printMode, getOffset())
      .forEach(function (page) { dom.printRoot.appendChild(page); });
    toast('正在调起打印…');
    doPrint();
  }

  /* ------------------------------ 页面设置 ------------------------------ */

  /** 打开页面设置弹层，回填当前偏移值。 */
  function openPageSetup() {
    dom.inputOffsetX.value = String(state.offsetX || 0);
    dom.inputOffsetY.value = String(state.offsetY || 0);
    dom.setupOverlay.hidden = false;
  }

  /** 关闭页面设置弹层。 */
  function closePageSetup() {
    dom.setupOverlay.hidden = true;
  }

  /** 应用偏移输入值（即改即存，并刷新已打开的预览）。 */
  function applyOffsetFromInput() {
    var x = Config.clamp(num(dom.inputOffsetX.value, 0), -30, 30);
    var y = Config.clamp(num(dom.inputOffsetY.value, 0), -30, 30);
    state.offsetX = Config.round1(x);
    state.offsetY = Config.round1(y);
    dom.inputOffsetX.value = String(state.offsetX);
    dom.inputOffsetY.value = String(state.offsetY);
    save();
    // 若打印预览开着，实时刷新偏移效果
    if (!dom.previewOverlay.hidden && state.previewItems && state.previewItems.length) {
      openPreview(state.previewItems);
    }
  }

  /** 偏移归零。 */
  function resetOffset() {
    dom.inputOffsetX.value = '0';
    dom.inputOffsetY.value = '0';
    applyOffsetFromInput();
    toast('打印偏移已归零');
  }

  /** 导出 JSON 数据档案。 */
  function exportJson() {
    var payload = {
      format: 'archive-print-tool',
      version: 1,
      exportedAt: new Date().toISOString(),
      layout: state.layout,
      single: state.single,
      records: state.records
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = '档案套打数据_' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    global.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast('数据档案已导出');
  }

  /** 导入 JSON 数据档案。 */
  function importJson(file) {
    if (!file) { return; }
    var reader = new FileReader();
    reader.onload = function () {
      var payload;
      try {
        payload = JSON.parse(reader.result);
      } catch (e) {
        toast('导入失败：文件不是有效的 JSON。');
        return;
      }
      if (!payload || !payload.layout) {
        toast('导入失败：文件中没有布局配置。');
        return;
      }
      if (!global.confirm('导入将覆盖当前的字段位置和录入数据，确定继续？')) { return; }
      state.layout = mergeLayout(payload.layout);
      state.single = mergeOneData(payload.single);
      state.records = mergeRecords(payload.records);
      state.recordIndex = 0;
      save();
      renderAll();
      toast('已导入 ' + state.records.length + ' 条批量记录');
    };
    reader.onerror = function () { toast('导入失败：文件读取错误。'); };
    reader.readAsText(file, 'utf-8');
  }

  /** 恢复默认布局。 */
  function resetLayout() {
    if (!global.confirm('确定恢复所有字段到默认位置？当前布局设置将被清除。')) { return; }
    state.layout = Config.defaultLayout();
    Storage.set(Config.STORAGE_KEYS.layoutVersion, Config.LAYOUT_VERSION);
    save();
    renderAll();
    toast('已恢复默认位置');
  }

  /** 表单输入事件处理（事件委托）。 */
  function onFormInput(event) {
    var target = event.target;
    var bind = target.getAttribute && target.getAttribute('data-bind');
    if (!bind) { return; }
    var card = target.closest ? target.closest('.form-card') : null;
    if (!card) { return; }
    var id = card.getAttribute('data-id');
    var data = currentData();
    if (!data) { return; }
    var cfg = state.layout[state.tab][id];

    if (bind === 'value') {
      data[id] = target.value;
      // 仅更新预览文字，不重建表单，避免输入时失焦。
      var textNode = dom.editPage.querySelector('.ef[data-id="' + id + '"] .field-text span');
      if (textNode) { textNode.textContent = target.value; }
      save();
      return;
    }

    if (bind === 'fontSize') {
      cfg.fontSize = Config.clamp(num(target.value, 12), 6, 48);
    } else if (bind === 'x' || bind === 'y' || bind === 'w' || bind === 'h') {
      var max = (bind === 'x' || bind === 'w') ? Config.PAGE_W : Config.PAGE_H;
      var min = (bind === 'w' || bind === 'h') ? 4 : 0;
      cfg[bind] = Config.round1(Config.clamp(num(target.value, min), min, max));
    } else {
      return;
    }
    renderEditPage();
    save();
  }

  /** 表单 change 事件处理（复选框与下拉框）。 */
  function onFormChange(event) {
    var target = event.target;
    var bind = target.getAttribute && target.getAttribute('data-bind');
    if (bind !== 'visible' && bind !== 'align' && bind !== 'fontFamily') { return; }
    var card = target.closest ? target.closest('.form-card') : null;
    if (!card) { return; }
    var cfg = state.layout[state.tab][card.getAttribute('data-id')];
    if (bind === 'visible') { cfg.visible = target.checked; }
    else if (bind === 'fontFamily') { cfg.fontFamily = target.value; }
    else { cfg.align = (target.value === 'center') ? 'center' : 'left'; }
    renderEditPage();
    save();
  }

  /** 绑定全部界面事件。 */
  function bindEvents() {
    dom.tabCover.addEventListener('click', function () { setTab('cover'); });
    dom.tabBack.addEventListener('click', function () { setTab('back'); });

    dom.modeSingle.addEventListener('change', function () { if (dom.modeSingle.checked) { setInputMode('single'); } });
    dom.modeBatch.addEventListener('change', function () { if (dom.modeBatch.checked) { setInputMode('batch'); } });
    dom.modeOverlay.addEventListener('change', function () { if (dom.modeOverlay.checked) { setPrintMode('overlay'); } });
    dom.modeFull.addEventListener('change', function () { if (dom.modeFull.checked) { setPrintMode('full'); } });

    dom.btnResetLayout.addEventListener('click', resetLayout);
    dom.btnExportJson.addEventListener('click', exportJson);
    dom.btnImportJson.addEventListener('click', function () { dom.fileImport.click(); });
    dom.fileImport.addEventListener('change', function () {
      importJson(dom.fileImport.files && dom.fileImport.files[0]);
      dom.fileImport.value = '';
    });

    dom.btnParseBatch.addEventListener('click', parseBatch);
    dom.btnTemplate.addEventListener('click', copyTemplate);
    dom.btnTemplateDownload.addEventListener('click', downloadTemplate);
    dom.btnImportFile.addEventListener('click', function () { dom.fileImportBatch.click(); });
    dom.fileImportBatch.addEventListener('change', function () {
      importBatchFile(dom.fileImportBatch.files && dom.fileImportBatch.files[0]);
      dom.fileImportBatch.value = '';
    });
    dom.batchNavPrev.addEventListener('click', function () { gotoRecord(state.recordIndex - 1); });
    dom.batchNavNext.addEventListener('click', function () { gotoRecord(state.recordIndex + 1); });

    dom.formPanel.addEventListener('input', onFormInput);
    dom.formPanel.addEventListener('change', onFormChange);
    dom.formPanel.addEventListener('click', function (event) {
      var btn = event.target.closest ? event.target.closest('[data-action="toggle-settings"]') : null;
      if (!btn) { return; }
      var card = btn.closest('.form-card');
      var settings = card.querySelector('.form-card-settings');
      settings.hidden = !settings.hidden;
      btn.textContent = settings.hidden ? '位置/样式' : '收起设置';
    });

    dom.btnPreview.addEventListener('click', function () { openPreview('current'); });
    dom.btnQuickPrint.addEventListener('click', quickPrint);
    dom.btnPageSetup.addEventListener('click', openPageSetup);
    dom.btnCloseSetup.addEventListener('click', closePageSetup);
    dom.btnHelp.addEventListener('click', function () { dom.helpOverlay.hidden = false; });
    dom.btnCloseHelp.addEventListener('click', function () { dom.helpOverlay.hidden = true; });
    dom.helpOverlay.addEventListener('click', function (event) {
      if (event.target === dom.helpOverlay) { dom.helpOverlay.hidden = true; }
    });
    dom.inputOffsetX.addEventListener('change', applyOffsetFromInput);
    dom.inputOffsetY.addEventListener('change', applyOffsetFromInput);
    dom.btnOffsetReset.addEventListener('click', resetOffset);
    dom.btnPrintBoth.addEventListener('click', function () { openPreview('allTabs'); });
    dom.btnBatchPrint.addEventListener('click', function () { openPreview('batchAll'); });

    dom.btnPrint.addEventListener('click', doPrint);
    dom.btnClosePreview.addEventListener('click', closePreview);
    dom.btnZoomOut.addEventListener('click', function () { zoomPreview(1 / 1.25); });
    dom.btnZoomIn.addEventListener('click', function () { zoomPreview(1.25); });
    dom.btnZoomFit.addEventListener('click', zoomReset);
    dom.previewOverlay.addEventListener('click', function (event) {
      if (event.target === dom.previewOverlay) { closePreview(); }
    });

    global.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        if (!dom.helpOverlay.hidden) { dom.helpOverlay.hidden = true; return; }
        if (!dom.previewOverlay.hidden) { closePreview(); return; }
      }
      Editor.handleKeydown(event);
    });
    global.addEventListener('resize', function () {
      updateEditScale();
      if (!dom.previewOverlay.hidden && state.previewItems.length) {
        openPreview(state.previewItems.slice());
      }
    });
  }

  /** 初始化应用。 */
  function init() {
    dom = {
      tabCover: document.getElementById('tabCover'),
      tabBack: document.getElementById('tabBack'),
      modeSingle: document.getElementById('modeSingle'),
      modeBatch: document.getElementById('modeBatch'),
      modeOverlay: document.getElementById('modeOverlay'),
      modeFull: document.getElementById('modeFull'),
      singleControls: document.getElementById('singleControls'),
      batchControls: document.getElementById('batchControls'),
      batchPaste: document.getElementById('batchPaste'),
      btnParseBatch: document.getElementById('btnParseBatch'),
      btnTemplate: document.getElementById('btnTemplate'),
      btnTemplateDownload: document.getElementById('btnTemplateDownload'),
      btnImportFile: document.getElementById('btnImportFile'),
      fileImportBatch: document.getElementById('fileImportBatch'),
      batchInfo: document.getElementById('batchInfo'),
      batchNavPrev: document.getElementById('batchNavPrev'),
      batchNavNext: document.getElementById('batchNavNext'),
      btnBatchPrint: document.getElementById('btnBatchPrint'),
      formPanel: document.getElementById('formPanel'),
      editViewport: document.getElementById('editViewport'),
      editPage: document.getElementById('editPage'),
      btnResetLayout: document.getElementById('btnResetLayout'),
      btnExportJson: document.getElementById('btnExportJson'),
      btnImportJson: document.getElementById('btnImportJson'),
      fileImport: document.getElementById('fileImport'),
      btnPreview: document.getElementById('btnPreview'),
      btnQuickPrint: document.getElementById('btnQuickPrint'),
      btnPageSetup: document.getElementById('btnPageSetup'),
      setupOverlay: document.getElementById('setupOverlay'),
      inputOffsetX: document.getElementById('inputOffsetX'),
      inputOffsetY: document.getElementById('inputOffsetY'),
      btnOffsetReset: document.getElementById('btnOffsetReset'),
      btnCloseSetup: document.getElementById('btnCloseSetup'),
      helpOverlay: document.getElementById('helpOverlay'),
      btnHelp: document.getElementById('btnHelp'),
      btnCloseHelp: document.getElementById('btnCloseHelp'),
      previewOverlay: document.getElementById('previewOverlay'),
      previewStage: document.getElementById('previewStage'),
      previewHint: document.getElementById('previewHint'),
      btnZoomOut: document.getElementById('btnZoomOut'),
      btnZoomIn: document.getElementById('btnZoomIn'),
      btnZoomFit: document.getElementById('btnZoomFit'),
      zoomLabel: document.getElementById('zoomLabel'),
      btnPrint: document.getElementById('btnPrint'),
      btnPrintBoth: document.getElementById('btnPrintBoth'),
      btnClosePreview: document.getElementById('btnClosePreview'),
      printRoot: document.getElementById('printRoot'),
      toast: document.getElementById('toast')
    };

    state.layout = migrateLayout(mergeLayout(Storage.get(Config.STORAGE_KEYS.layout, null)));
    state.single = mergeOneData(Storage.get(Config.STORAGE_KEYS.single, null));
    state.records = mergeRecords(Storage.get(Config.STORAGE_KEYS.records, []));
    var settings = Storage.get(Config.STORAGE_KEYS.settings, {}) || {};
    state.tab = (settings.tab === 'back') ? 'back' : 'cover';
    state.printMode = (settings.printMode === 'full') ? 'full' : 'overlay';
    state.inputMode = (settings.inputMode === 'batch') ? 'batch' : 'single';
    state.recordIndex = Config.clamp(num(settings.recordIndex, 0), 0, Math.max(0, state.records.length - 1));
    state.batchText = typeof settings.batchText === 'string' ? settings.batchText : '';
    dom.batchPaste.value = state.batchText;
    state.offsetX = Config.clamp(num(settings.offsetX, 0), -30, 30);
    state.offsetY = Config.clamp(num(settings.offsetY, 0), -30, 30);

    Editor.init({
      pageEl: dom.editPage,
      onChange: function () { save(); }
    });

    bindEvents();
    renderAll();
    updateEditScale();
  }

  App.init = init;
  App.getState = function () { return state; };
})(window);
