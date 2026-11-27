/**
 * 档案封面封底套打工具 —— 字段与默认布局配置。
 *
 * 默认坐标依据 A4 扫描底图实测（1075 × 1520 像素 → 210 × 297 毫米）换算得出。
 * 坐标单位统一为毫米（mm），精度 0.1mm；x/y 为字段框左上角，w/h 为宽高。
 * 字号单位为磅（pt）。默认字体遵循公文规范（均使用免费可商用开源字体）：
 * 单位名称/类别/案卷题名用思源宋体 Heavy 20pt（替代方正小标宋的免费开源方案，亦可在下拉框选方正小标宋简体），
 * 数字类字段（起止年月日/件数/页数/保管期限/全宗号/目录号/案卷号）默认仿宋_GB2312 14pt（用户自备的传统公文字体），
 * 其余文字字段（卷内摘要、封底文字）用朱雀仿宋 14pt（替代仿宋_GB2312 的开源方案）。
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
    { id: 'startYear',   label: '起年',       type: 'text',     x: 74,  y: 231,  w: 10,   h: 7,   fontFamily: '仿宋_GB2312', fontSize: 14, align: 'center', visible: true },
    { id: 'startMonth',  label: '起月',       type: 'text',     x: 89,  y: 231,  w: 8,   h: 7,   fontFamily: '仿宋_GB2312', fontSize: 14, align: 'center', visible: true },
    { id: 'startDay',    label: '日起',       type: 'text',     x: 103, y: 231,  w: 7,   h: 7,   fontFamily: '仿宋_GB2312', fontSize: 14, align: 'center', visible: true },
    { id: 'endYear',     label: '止年',       type: 'text',     x: 126, y: 231,  w: 10,   h: 7,   fontFamily: '仿宋_GB2312', fontSize: 14, align: 'center', visible: true },
    { id: 'endMonth',    label: '止月',       type: 'text',     x: 141, y: 231,  w: 8,   h: 7,   fontFamily: '仿宋_GB2312', fontSize: 14, align: 'center', visible: true },
    { id: 'endDay',      label: '日止',       type: 'text',     x: 154, y: 231,  w: 7,   h: 7,   fontFamily: '仿宋_GB2312', fontSize: 14, align: 'center', visible: true },
    { id: 'pieceCount',  label: '件数',       type: 'text',     x: 89,  y: 241,  w: 9,   h: 7,   fontFamily: '仿宋_GB2312', fontSize: 14, align: 'center', visible: true },
    { id: 'pageCount',   label: '页数',       type: 'text',     x: 104, y: 241,  w: 9,   h: 7,   fontFamily: '仿宋_GB2312', fontSize: 14, align: 'center', visible: true },
    { id: 'retainPeriod',label: '保管期限',   type: 'text',     x: 166, y: 241,  w: 24,  h: 7,   fontFamily: '仿宋_GB2312', fontSize: 14, align: 'center', visible: true },
    { id: 'archiveNo',   label: '全宗号',     type: 'text',     x: 58,  y: 251,  w: 27,  h: 7,   fontFamily: '仿宋_GB2312', fontSize: 14, align: 'center', visible: true },
    { id: 'catalogNo',   label: '目录号',     type: 'text',     x: 106, y: 251,  w: 28,  h: 7,   fontFamily: '仿宋_GB2312', fontSize: 14, align: 'center', visible: true },
    { id: 'fileNo',      label: '案卷号',     type: 'text',     x: 166, y: 251,  w: 24,  h: 7,   fontFamily: '仿宋_GB2312', fontSize: 14, align: 'center', visible: true }
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
   * 可选字体列表（fonts 目录内置 @font-face，无需系统安装；无需联网）。
   * 开源字体均为免费可商用；仿宋_GB2312 / 方正小标宋简体 / 方正大标宋简体 / 楷体_GB2312
   * 为传统公文字体，商业使用需用户自行确认授权。
   * name 为 CSS font-family 名，同时也是下拉框显示文字。
   * 宋体依赖操作系统自带字体，不随本工具分发。
   */
  var FONT_OPTIONS = [
    { name: '仿宋_GB2312' },
    { name: '朱雀仿宋' },
    { name: '思源宋体 Heavy' },
    { name: '思源宋体 Bold' },
    { name: '思源黑体' },
    { name: '方正小标宋简体' },
    { name: '方正大标宋简体' },
    { name: '楷体_GB2312' },
    { name: '霞鹜文楷' },
    { name: '宋体' }
  ];

  var STORAGE_KEYS = {
    layout: 'layout',       // 字段位置与样式配置
    single: 'singleData',   // 单份模式当前录入数据
    records: 'records',     // 批量模式记录数组
    settings: 'settings',   // 界面设置（页签、打印模式等）
    layoutVersion: 'layoutVersion' // 布局版本号，用于一次性迁移历史默认坐标
  };

  /** 当前布局版本。仅当缓存版本低于此值时执行迁移。 */
  var LAYOUT_VERSION = 7;

  /**
   * 布局迁移表：props 中每个属性独立判断——仅当缓存值仍等于旧值（用户未手动调整该属性）时更新为新值。
   * v2：封底三行文字移到横线上方。
   * v3：默认布局重新校准（年份框加宽防折行、封底三行居中贴线等），对齐 config.js 当前默认值。
   * v4：公文字体规范——标题三行改小标宋风格 20pt，其余改仿宋风格 14pt（fontFamily 为新增属性，
   *     由 mergeLayout 自动补默认值，无需迁移；此处仅迁移 fontSize 旧默认值）。
   * v5：数字类字段（起止年月日/件数/页数/保管期限/全宗号/目录号/案卷号）默认字体改思源黑体。
   * v6：数字类字段默认字体改回朱雀仿宋 14pt（原仿宋_GB2312 的开源替代；仅回退 v5 升级时
   *     仍等于旧默认"思源黑体"的缓存值，不动用户手动改过的字体）。
   * v7：数字类字段默认字体改回仿宋_GB2312 14pt（用户自备的传统公文字体；仅回退 v6 升级时
   *     仍等于旧默认"朱雀仿宋"的缓存值，不动用户手动改过的字体。与 v5→v6 链式执行后，
   *     v5 旧缓存"思源黑体"会经 v6→v7 最终落到仿宋_GB2312）。
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
    { version: 4, tab: 'back',  id: 'fileDate',    props: { fontSize: [12, 14] } },
    // v5：数字类字段默认字体改思源黑体（仅当仍为旧默认朱雀仿宋时更新，不动用户手动改过的字体；
    // 旧值 仿宋_GB2312/黑体 等已不在字体列表，由 mergeLayout 的 isValidFont 自动回退到新默认值）
    { version: 5, tab: 'cover', id: 'startYear',    props: { fontFamily: ['朱雀仿宋', '思源黑体'] } },
    { version: 5, tab: 'cover', id: 'startMonth',   props: { fontFamily: ['朱雀仿宋', '思源黑体'] } },
    { version: 5, tab: 'cover', id: 'startDay',     props: { fontFamily: ['朱雀仿宋', '思源黑体'] } },
    { version: 5, tab: 'cover', id: 'endYear',      props: { fontFamily: ['朱雀仿宋', '思源黑体'] } },
    { version: 5, tab: 'cover', id: 'endMonth',     props: { fontFamily: ['朱雀仿宋', '思源黑体'] } },
    { version: 5, tab: 'cover', id: 'endDay',       props: { fontFamily: ['朱雀仿宋', '思源黑体'] } },
    { version: 5, tab: 'cover', id: 'pieceCount',   props: { fontFamily: ['朱雀仿宋', '思源黑体'] } },
    { version: 5, tab: 'cover', id: 'pageCount',    props: { fontFamily: ['朱雀仿宋', '思源黑体'] } },
    { version: 5, tab: 'cover', id: 'retainPeriod', props: { fontFamily: ['朱雀仿宋', '思源黑体'] } },
    { version: 5, tab: 'cover', id: 'archiveNo',    props: { fontFamily: ['朱雀仿宋', '思源黑体'] } },
    { version: 5, tab: 'cover', id: 'catalogNo',    props: { fontFamily: ['朱雀仿宋', '思源黑体'] } },
    { version: 5, tab: 'cover', id: 'fileNo',       props: { fontFamily: ['朱雀仿宋', '思源黑体'] } },
    // v6：数字类字段默认字体改回朱雀仿宋 14pt（原仿宋_GB2312 的开源替代；仅当缓存值仍为 v5 旧默认
    // "思源黑体"时回退，不动用户手动改过的字体。其他字体如霞鹜文楷等说明用户手动选择过，一并保留）
    { version: 6, tab: 'cover', id: 'startYear',    props: { fontFamily: ['思源黑体', '朱雀仿宋'] } },
    { version: 6, tab: 'cover', id: 'startMonth',   props: { fontFamily: ['思源黑体', '朱雀仿宋'] } },
    { version: 6, tab: 'cover', id: 'startDay',     props: { fontFamily: ['思源黑体', '朱雀仿宋'] } },
    { version: 6, tab: 'cover', id: 'endYear',      props: { fontFamily: ['思源黑体', '朱雀仿宋'] } },
    { version: 6, tab: 'cover', id: 'endMonth',     props: { fontFamily: ['思源黑体', '朱雀仿宋'] } },
    { version: 6, tab: 'cover', id: 'endDay',       props: { fontFamily: ['思源黑体', '朱雀仿宋'] } },
    { version: 6, tab: 'cover', id: 'pieceCount',   props: { fontFamily: ['思源黑体', '朱雀仿宋'] } },
    { version: 6, tab: 'cover', id: 'pageCount',    props: { fontFamily: ['思源黑体', '朱雀仿宋'] } },
    { version: 6, tab: 'cover', id: 'retainPeriod', props: { fontFamily: ['思源黑体', '朱雀仿宋'] } },
    { version: 6, tab: 'cover', id: 'archiveNo',    props: { fontFamily: ['思源黑体', '朱雀仿宋'] } },
    { version: 6, tab: 'cover', id: 'catalogNo',    props: { fontFamily: ['思源黑体', '朱雀仿宋'] } },
    { version: 6, tab: 'cover', id: 'fileNo',       props: { fontFamily: ['思源黑体', '朱雀仿宋'] } },
    // v7：数字类字段默认字体改回仿宋_GB2312 14pt（用户自备的传统公文字体；仅当缓存值仍为 v6 旧默认
    // "朱雀仿宋"时回退，不动用户手动改过的字体。v5/v6/v7 链式执行后，最早 v5 旧缓存"思源黑体"亦最终落到仿宋_GB2312）
    { version: 7, tab: 'cover', id: 'startYear',    props: { fontFamily: ['朱雀仿宋', '仿宋_GB2312'] } },
    { version: 7, tab: 'cover', id: 'startMonth',   props: { fontFamily: ['朱雀仿宋', '仿宋_GB2312'] } },
    { version: 7, tab: 'cover', id: 'startDay',     props: { fontFamily: ['朱雀仿宋', '仿宋_GB2312'] } },
    { version: 7, tab: 'cover', id: 'endYear',      props: { fontFamily: ['朱雀仿宋', '仿宋_GB2312'] } },
    { version: 7, tab: 'cover', id: 'endMonth',     props: { fontFamily: ['朱雀仿宋', '仿宋_GB2312'] } },
    { version: 7, tab: 'cover', id: 'endDay',       props: { fontFamily: ['朱雀仿宋', '仿宋_GB2312'] } },
    { version: 7, tab: 'cover', id: 'pieceCount',   props: { fontFamily: ['朱雀仿宋', '仿宋_GB2312'] } },
    { version: 7, tab: 'cover', id: 'pageCount',    props: { fontFamily: ['朱雀仿宋', '仿宋_GB2312'] } },
    { version: 7, tab: 'cover', id: 'retainPeriod', props: { fontFamily: ['朱雀仿宋', '仿宋_GB2312'] } },
    { version: 7, tab: 'cover', id: 'archiveNo',    props: { fontFamily: ['朱雀仿宋', '仿宋_GB2312'] } },
    { version: 7, tab: 'cover', id: 'catalogNo',    props: { fontFamily: ['朱雀仿宋', '仿宋_GB2312'] } },
    { version: 7, tab: 'cover', id: 'fileNo',       props: { fontFamily: ['朱雀仿宋', '仿宋_GB2312'] } }
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
