/**
 * 档案封面封底套打工具 —— 字段与默认布局配置。
 *
 * 默认坐标依据 A4 扫描底图实测（1075 × 1520 像素 → 210 × 297 毫米）换算得出。
 * 坐标单位统一为毫米（mm），精度 0.1mm；x/y 为字段框左上角，w/h 为宽高。
 * 字号单位为磅（pt）。默认字体遵循公文规范（均使用免费可商用开源字体）：
 * 单位名称/类别/案卷题名用思源宋体 Heavy 20pt（替代方正小标宋），其余用朱雀仿宋 14pt（替代仿宋_GB2312）。
 */
(function (global) {
  'use strict';

  var App = global.App = global.App || {};

  /** 封面（第 1 页）字段定义。 */
  var COVER_FIELDS = [
    { id: 'unitName',    label: '单位名称',   type: 'text',     x: 59,  y: 38.5, w: 130, h: 13,  fontFamily: '思源宋体 Heavy', fontSize: 20, align: 'center', visible: true },
    { id: 'category',    label: '类别',       type: 'text',     x: 59,  y: 58.5, w: 130, h: 13,  fontFamily: '思源宋体 Heavy', fontSize: 20, align: 'center', visible: true },
    { id: 'title',       label: '案卷题名',   type: 'text',     x: 59,  y: 78.5, w: 130, h: 13,  fontFamily: '思源宋体 Heavy', fontSize: 20, align: 'center', visible: true },
    { id: 'summary',     label: '卷内摘要',   type: 'textarea', x: 60,  y: 97,   w: 128, h: 130, fontFamily: '朱雀仿宋', fontSize: 14, align: 'left',   visible: true },
    { id: 'startYear',   label: '起年',       type: 'text',     x: 74,  y: 231,  w: 10,   h: 7,   fontFamily: '朱雀仿宋', fontSize: 14, align: 'center', visible: true },
    { id: 'startMonth',  label: '起月',       type: 'text',     x: 89,  y: 231,  w: 8,   h: 7,   fontFamily: '朱雀仿宋', fontSize: 14, align: 'center', visible: true },
    { id: 'startDay',    label: '日起',       type: 'text',     x: 103, y: 231,  w: 7,   h: 7,   fontFamily: '朱雀仿宋', fontSize: 14, align: 'center', visible: true },
    { id: 'endYear',     label: '止年',       type: 'text',     x: 126, y: 231,  w: 10,   h: 7,   fontFamily: '朱雀仿宋', fontSize: 14, align: 'center', visible: true },
    { id: 'endMonth',    label: '止月',       type: 'text',     x: 141, y: 231,  w: 8,   h: 7,   fontFamily: '朱雀仿宋', fontSize: 14, align: 'center', visible: true },
    { id: 'endDay',      label: '日止',       type: 'text',     x: 154, y: 231,  w: 7,   h: 7,   fontFamily: '朱雀仿宋', fontSize: 14, align: 'center', visible: true },
    { id: 'pieceCount',  label: '件数',       type: 'text',     x: 89,  y: 241,  w: 9,   h: 7,   fontFamily: '朱雀仿宋', fontSize: 14, align: 'center', visible: true },
    { id: 'pageCount',   label: '页数',       type: 'text',     x: 104, y: 241,  w: 9,   h: 7,   fontFamily: '朱雀仿宋', fontSize: 14, align: 'center', visible: true },
    { id: 'retainPeriod',label: '保管期限',   type: 'text',     x: 166, y: 241,  w: 24,  h: 7,   fontFamily: '朱雀仿宋', fontSize: 14, align: 'center', visible: true },
    { id: 'archiveNo',   label: '全宗号',     type: 'text',     x: 58,  y: 251,  w: 27,  h: 7,   fontFamily: '朱雀仿宋', fontSize: 14, align: 'center', visible: true },
    { id: 'catalogNo',   label: '目录号',     type: 'text',     x: 106, y: 251,  w: 28,  h: 7,   fontFamily: '朱雀仿宋', fontSize: 14, align: 'center', visible: true },
    { id: 'fileNo',      label: '案卷号',     type: 'text',     x: 166, y: 251,  w: 24,  h: 7,   fontSize: 12, align: 'center', visible: true }
  ];

  /** 封底（第 2 页，卷内备查表）字段定义。 */
  var BACK_FIELDS = [
    { id: 'description', label: '本卷情况说明', type: 'textarea', x: 36,  y: 52,  w: 152, h: 165, fontFamily: '朱雀仿宋', fontSize: 14, align: 'left', visible: true },
    // 横线实测：立卷人 228.9mm / 检查人 241.2mm / 立卷时间 253.2mm。文字框内垂直居中，字底约距框顶 5.6mm，
    // 故框顶取「横线位置 - 6mm」，使字底贴合横线、文字写在横线上方。
    { id: 'filer',       label: '立卷人',       type: 'text',     x: 140, y: 222.8, w: 42, h: 7, fontFamily: '朱雀仿宋', fontSize: 14, align: 'center', visible: true },
    { id: 'checker',     label: '检查人',       type: 'text',     x: 140, y: 235.1, w: 42, h: 7, fontFamily: '朱雀仿宋', fontSize: 14, align: 'center', visible: true },
    { id: 'fileDate',    label: '立卷时间',     type: 'text',     x: 140, y: 247.1, w: 42, h: 7, fontFamily: '朱雀仿宋', fontSize: 14, align: 'center', visible: true }
  ];

  var FIELDS = { cover: COVER_FIELDS, back: BACK_FIELDS };
  var TAB_NAMES = { cover: '封面', back: '封底' };
  var IMAGES = { cover: 'assets/cover.png', back: 'assets/back.png' };
  var TABS = ['cover', 'back'];

  /**
   * 可选字体列表（fonts 目录内置 @font-face，无需系统安装；均为免费可商用开源字体）。
   * name 为 CSS font-family 名，同时也是下拉框显示文字。
   * 宋体/黑体依赖操作系统自带字体，不随本工具分发。
   */
  var FONT_OPTIONS = [
    { name: '朱雀仿宋' },
    { name: '思源宋体 Heavy' },
    { name: '思源宋体 Bold' },
    { name: '霞鹜文楷' },
    { name: '宋体' },
    { name: '黑体' }
  ];

  var STORAGE_KEYS = {
    layout: 'layout',       // 字段位置与样式配置
    single: 'singleData',   // 单份模式当前录入数据
    records: 'records',     // 批量模式记录数组
    settings: 'settings',   // 界面设置（页签、打印模式等）
    layoutVersion: 'layoutVersion' // 布局版本号，用于一次性迁移历史默认坐标
  };

  /** 当前布局版本。仅当缓存版本低于此值时执行迁移。 */
  var LAYOUT_VERSION = 4;

  /**
   * 布局迁移表：props 中每个属性独立判断——仅当缓存值仍等于旧值（用户未手动调整该属性）时更新为新值。
   * v2：封底三行文字移到横线上方。
   * v3：默认布局重新校准（年份框加宽防折行、封底三行居中贴线等），对齐 config.js 当前默认值。
   * v4：公文字体规范——标题三行改小标宋风格 20pt，其余改仿宋风格 14pt（fontFamily 为新增属性，
   *     由 mergeLayout 自动补默认值，无需迁移；此处仅迁移 fontSize 旧默认值）。
   */
  var LAYOUT_MIGRATIONS = [
    { version: 2, tab: 'back', id: 'filer',    props: { y: [228, 222.8], w: [40, 53] } },
    { version: 2, tab: 'back', id: 'checker',  props: { y: [241, 235.1], w: [40, 53] } },
    { version: 2, tab: 'back', id: 'fileDate', props: { y: [253, 247.1], w: [40, 53] } },
    { version: 3, tab: 'cover', id: 'startYear',    props: { x: [77, 74],     y: [231, 231.5], w: [8, 10] } },
    { version: 3, tab: 'cover', id: 'startMonth',   props: { y: [231, 231.5] } },
    { version: 3, tab: 'cover', id: 'startDay',     props: { y: [231, 231.5] } },
    { version: 3, tab: 'cover', id: 'endYear',      props: { x: [129, 125],   y: [231, 231.5], w: [8, 10] } },
    { version: 3, tab: 'cover', id: 'endMonth',     props: { y: [231, 231.5] } },
    { version: 3, tab: 'cover', id: 'endDay',       props: { y: [231, 231.5] } },
    { version: 3, tab: 'cover', id: 'pieceCount',   props: { y: [241, 242] } },
    { version: 3, tab: 'cover', id: 'pageCount',    props: { y: [241, 242] } },
    { version: 3, tab: 'cover', id: 'retainPeriod', props: { y: [241, 242] } },
    { version: 3, tab: 'cover', id: 'archiveNo',    props: { y: [251, 251.5] } },
    { version: 3, tab: 'cover', id: 'catalogNo',    props: { y: [251, 251.5] } },
    { version: 3, tab: 'cover', id: 'fileNo',       props: { y: [251, 251.5] } },
    { version: 3, tab: 'back', id: 'description',   props: { x: [36, 38], w: [152, 150] } },
    { version: 3, tab: 'back', id: 'filer',    props: { x: [141, 140], y: [222.8, 222], w: [53, 42], align: ['left', 'center'] } },
    { version: 3, tab: 'back', id: 'checker',  props: { x: [141, 140], y: [235.1, 234], w: [53, 42], align: ['left', 'center'] } },
    { version: 3, tab: 'back', id: 'fileDate', props: { x: [141, 140], y: [247.1, 246], w: [53, 42], align: ['left', 'center'] } },
    // v4：字号规范化（仅当仍为旧默认值时更新，不动用户手动调过的字号）
    { version: 4, tab: 'cover', id: 'unitName',    props: { fontSize: [14, 20] } },
    { version: 4, tab: 'cover', id: 'category',    props: { fontSize: [14, 20] } },
    { version: 4, tab: 'cover', id: 'title',       props: { fontSize: [14, 20] } },
    { version: 4, tab: 'cover', id: 'summary',     props: { fontSize: [12, 14] } },
    { version: 4, tab: 'cover', id: 'startYear',   props: { fontSize: [12, 14] } },
    { version: 4, tab: 'cover', id: 'startMonth',  props: { fontSize: [12, 14] } },
    { version: 4, tab: 'cover', id: 'startDay',    props: { fontSize: [12, 14] } },
    { version: 4, tab: 'cover', id: 'endYear',     props: { fontSize: [12, 14] } },
    { version: 4, tab: 'cover', id: 'endMonth',    props: { fontSize: [12, 14] } },
    { version: 4, tab: 'cover', id: 'endDay',      props: { fontSize: [12, 14] } },
    { version: 4, tab: 'cover', id: 'pieceCount',  props: { fontSize: [12, 14] } },
    { version: 4, tab: 'cover', id: 'pageCount',   props: { fontSize: [12, 14] } },
    { version: 4, tab: 'cover', id: 'retainPeriod',props: { fontSize: [12, 14] } },
    { version: 4, tab: 'cover', id: 'archiveNo',   props: { fontSize: [12, 14] } },
    { version: 4, tab: 'cover', id: 'catalogNo',   props: { fontSize: [12, 14] } },
    { version: 4, tab: 'cover', id: 'fileNo',      props: { fontSize: [12, 14] } },
    { version: 4, tab: 'back',  id: 'description', props: { fontSize: [12, 14] } },
    { version: 4, tab: 'back',  id: 'filer',       props: { fontSize: [12, 14] } },
    { version: 4, tab: 'back',  id: 'checker',     props: { fontSize: [12, 14] } },
    { version: 4, tab: 'back',  id: 'fileDate',    props: { fontSize: [12, 14] } }
  ];

  /** 生成全新的默认布局对象（深拷贝，避免共享引用）。 */
  function defaultLayout() {
    var layout = { cover: {}, back: {} };
    TABS.forEach(function (tab) {
      FIELDS[tab].forEach(function (f) {
        layout[tab][f.id] = {
          x: f.x, y: f.y, w: f.w, h: f.h,
          fontFamily: f.fontFamily,
          fontSize: f.fontSize, align: f.align, visible: f.visible
        };
      });
    });
    return layout;
  }

  /** 生成全新的空数据对象。 */
  function defaultData() {
    var data = { cover: {}, back: {} };
    TABS.forEach(function (tab) {
      FIELDS[tab].forEach(function (f) { data[tab][f.id] = ''; });
    });
    return data;
  }

  /** 按 id 查找字段定义。 */
  function getField(tab, id) {
    var list = FIELDS[tab] || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) { return list[i]; }
    }
    return null;
  }

  /** 将数值四舍五入到 0.1mm。 */
  function round1(value) {
    return Math.round((Number(value) + Number.EPSILON) * 10) / 10;
  }

  /** 将数值限制在 [min, max] 区间内。 */
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  App.Config = {
    PAGE_W: 210,
    PAGE_H: 297,
    FIELDS: FIELDS,
    TABS: TABS,
    TAB_NAMES: TAB_NAMES,
    IMAGES: IMAGES,
    FONT_OPTIONS: FONT_OPTIONS,
    STORAGE_KEYS: STORAGE_KEYS,
    LAYOUT_VERSION: LAYOUT_VERSION,
    LAYOUT_MIGRATIONS: LAYOUT_MIGRATIONS,
    defaultLayout: defaultLayout,
    defaultData: defaultData,
    getField: getField,
    round1: round1,
    clamp: clamp
  };
})(window);
