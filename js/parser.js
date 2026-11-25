/**
 * 表格文本解析模块 —— 支持从 Excel 粘贴的 TSV、逗号分隔 CSV。
 * 纯原生实现，支持引号包裹字段、引号内逗号/换行、双引号转义。
 */
(function (global) {
  'use strict';

  var App = global.App = global.App || {};
  var Config = App.Config;

  /**
   * 通用分隔符文本解析（状态机，支持引号）。
   * @param {string} text 原始文本
   * @param {string} delim 分隔符：'\t' 或 ','
   * @returns {Array<Array<string>>} 二维单元格数组
   */
  function parseDelimited(text, delim) {
    var rows = [];
    var row = [];
    var cell = '';
    var inQuote = false;
    var i = 0;
    var len = text.length;

    while (i < len) {
      var ch = text.charAt(i);
      if (inQuote) {
        if (ch === '"') {
          if (text.charAt(i + 1) === '"') { cell += '"'; i += 2; continue; }
          inQuote = false; i++; continue;
        }
        cell += ch; i++; continue;
      }
      if (ch === '"') { inQuote = true; i++; continue; }
      if (ch === '\r') { i++; continue; }
      if (ch === '\n') {
        row.push(cell); rows.push(row); row = []; cell = ''; i++; continue;
      }
      if (delim && ch === delim) { row.push(cell); cell = ''; i++; continue; }
      cell += ch; i++;
    }
    if (cell !== '' || row.length > 0) { row.push(cell); rows.push(row); }

    // 丢弃完全空白的行（Excel 常带尾部空行）。
    return rows.filter(function (r) {
      return r.some(function (c) { return String(c).trim() !== ''; });
    });
  }

  /** 推断分隔符：优先按首行中 Tab 与逗号的数量比较。 */
  function detectDelimiter(text) {
    var firstLine = String(text).split(/\r?\n/, 1)[0] || '';
    var tabs = (firstLine.match(/\t/g) || []).length;
    var commas = (firstLine.match(/,/g) || []).length;
    if (tabs > 0 && tabs >= commas) { return '\t'; }
    if (commas > 0) { return ','; }
    // 无明确分隔：单列数据，按行处理。
    return '\n';
  }

  /** 规范化表头文本：去空白、去常见不可见字符。 */
  function normalizeHeader(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/^\uFEFF/, '')
      .replace(/[\s\u3000]/g, '')
      .trim();
  }

  /**
   * 将二维表解析成案卷记录数组（核心逻辑，供文本与 Excel 文件导入共用）。
   * 表头可使用字段中文名（去空格后匹配）或字段 id。
   * 额外支持「起止时间」「立卷时间」两种复合列自动拆分。
   * @param {Array<Array>} matrix 二维单元格数组（第一行为表头）
   * @returns {{records: Array, errors: Array}}
   */
  function parseMatrix(matrix) {
    var result = { records: [], errors: [] };
    if (!matrix || matrix.length < 2) {
      result.errors.push('至少需要两行：第一行表头，第二行起为数据。');
      return result;
    }

    var header = matrix[0].map(normalizeHeader);
    var fieldMap = {};
    Config.TABS.forEach(function (tab) {
      Config.FIELDS[tab].forEach(function (f) {
        fieldMap[f.label] = { tab: tab, id: f.id };
        fieldMap[f.id] = { tab: tab, id: f.id };
      });
    });
    // 常见别名，方便直接从既有台账粘贴。
    var aliases = {
      '单位': { tab: 'cover', id: 'unitName' },
      '案卷标题': { tab: 'cover', id: 'title' },
      '题名': { tab: 'cover', id: 'title' },
      '摘要': { tab: 'cover', id: 'summary' },
      '期限': { tab: 'cover', id: 'retainPeriod' },
      '全宗': { tab: 'cover', id: 'archiveNo' },
      '目录': { tab: 'cover', id: 'catalogNo' },
      '案卷': { tab: 'cover', id: 'fileNo' },
      '情况说明': { tab: 'back', id: 'description' }
    };
    Object.keys(aliases).forEach(function (k) {
      if (!fieldMap[k]) { fieldMap[k] = aliases[k]; }
    });

    var mapping = [];
    header.forEach(function (h, index) {
      if (!h) { return; }
      // 复合列在下方单独拆分处理，不按普通字段匹配，也不应提示为错误。
      if (h === '起止时间' || h === '立卷时间') { return; }
      var target = fieldMap[h];
      if (!target) {
        result.errors.push('第 ' + (index + 1) + ' 列「' + h + '」未识别，已忽略。');
        return;
      }
      mapping.push({ index: index, tab: target.tab, id: target.id, header: h });
    });
    if (mapping.length === 0) {
      result.errors.push('未识别到任何有效表头，请使用字段中文名（如：单位名称、案卷题名）。');
      return result;
    }

    // 复合列在 mapping 中的下标（若表头存在）。
    var dateIndex = header.indexOf('起止时间');
    var fileDateIndex = header.indexOf('立卷时间');

    for (var r = 1; r < matrix.length; r++) {
      var cells = matrix[r];
      var record = { cover: {}, back: {} };
      mapping.forEach(function (m) {
        record[m.tab][m.id] = String(cells[m.index] === undefined || cells[m.index] === null ? '' : cells[m.index]).trim();
      });
      // 智能拆分「起止时间」列：2024年3月5日起至2025年6月8日止
      if (dateIndex >= 0) {
        var dtext = String(cells[dateIndex] || '').trim();
        var nums = dtext.match(/\d{1,4}/g);
        if (nums && nums.length >= 6) {
          record.cover.startYear = nums[0];
          record.cover.startMonth = nums[1];
          record.cover.startDay = nums[2];
          record.cover.endYear = nums[3];
          record.cover.endMonth = nums[4];
          record.cover.endDay = nums[5];
        }
      }
      // 智能填充「立卷时间」列。
      if (fileDateIndex >= 0) {
        var ftext = String(cells[fileDateIndex] || '').trim();
        var fnums = ftext.match(/\d{1,4}/g);
        if (fnums && fnums.length >= 3) {
          record.back.fileDate = fnums[0] + '年' + Number(fnums[1]) + '月' + Number(fnums[2]) + '日';
        } else if (ftext) {
          record.back.fileDate = ftext;
        }
      }
      result.records.push(record);
    }
    return result;
  }

  /** 文本入口：先推断分隔符并解析成二维表，再走矩阵解析。 */
  function parseRecords(text) {
    var result = { records: [], errors: [] };
    if (!text || !String(text).trim()) {
      result.errors.push('粘贴内容为空。');
      return result;
    }
    var delim = detectDelimiter(text);
    var matrix = parseDelimited(String(text), delim);
    return parseMatrix(matrix);
  }

  /** 生成模板二维表（表头 + 一行示例数据），供复制与下载模板共用。 */
  function templateMatrix() {
    var headers = [];
    Config.TABS.forEach(function (tab) {
      Config.FIELDS[tab].forEach(function (f) { headers.push(f.label); });
    });
    var sample = [
      '××市档案馆', '文书档案', '2026年度党群工作类文件案卷',
      '本卷收录2026年度党委办公室形成的各类文件材料，包括工作计划、总结、会议纪要等。',
      '2026', '01', '01', '2026', '12', '31',
      '32', '128', '永久', '0123', '45', '6789',
      '卷内文件均按年度、机构、问题相结合的方法整理排列。',
      '张三', '李四', '2026年11月25日'
    ];
    return [headers, sample];
  }

  /** 生成可直接复制到 Excel 的 TSV 表头（字段中文名）。 */
  function templateTSV() {
    return templateMatrix()[0].join('\t');
  }

  App.Parser = {
    parseDelimited: parseDelimited,
    detectDelimiter: detectDelimiter,
    parseRecords: parseRecords,
    parseMatrix: parseMatrix,
    templateMatrix: templateMatrix,
    templateTSV: templateTSV
  };
})(window);
