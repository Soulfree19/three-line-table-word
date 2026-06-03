(function attachThreeLineFormatter(global) {
  "use strict";

  const SETTINGS_KEY = "threeLineTable.settings.v1";
  const TEMPLATES_KEY = "threeLineTable.templates.v1";
  const ACTIVE_TEMPLATE_KEY = "threeLineTable.activeTemplateId.v1";
  const WORD_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

  const DEFAULT_SETTINGS = Object.freeze({
    outerWidth: 0.75,
    headerWidth: 0.5,
    borderColor: "#000000",
    fontFamily: "Times New Roman",
    fontSize: 10.5,
    fontColor: "#000000",
    headerBold: false
  });
  const BORDER_WIDTHS = Object.freeze([0.25, 0.5, 0.75, 1, 1.5, 2.25, 3, 4.5, 6]);

  function storageAvailable() {
    try {
      return Boolean(global.localStorage);
    } catch (_error) {
      return false;
    }
  }

  function readJson(key, fallback) {
    if (!storageAvailable()) {
      return fallback;
    }

    try {
      const raw = global.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    if (!storageAvailable()) {
      return;
    }

    global.localStorage.setItem(key, JSON.stringify(value));
  }

  function clampNumber(value, fallback, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return fallback;
    }

    return Math.min(Math.max(number, min), max);
  }

  function snapBorderWidth(value, fallback) {
    const number = clampNumber(value, fallback, 0.25, 6);
    return BORDER_WIDTHS.reduce((closest, item) =>
      Math.abs(item - number) < Math.abs(closest - number) ? item : closest
    );
  }

  function normalizeColor(value, fallback) {
    if (typeof value !== "string") {
      return fallback;
    }

    const trimmed = value.trim();
    if (/^#[0-9a-f]{6}$/i.test(trimmed)) {
      return trimmed.toUpperCase();
    }

    return fallback;
  }

  function normalizeFontFamily(value) {
    if (typeof value !== "string") {
      return DEFAULT_SETTINGS.fontFamily;
    }

    const trimmed = value.trim();
    return trimmed || DEFAULT_SETTINGS.fontFamily;
  }

  function normalizeSettings(input) {
    const source = input && typeof input === "object" ? input : {};

    return {
      outerWidth: snapBorderWidth(source.outerWidth, DEFAULT_SETTINGS.outerWidth),
      headerWidth: snapBorderWidth(source.headerWidth, DEFAULT_SETTINGS.headerWidth),
      borderColor: normalizeColor(source.borderColor, DEFAULT_SETTINGS.borderColor),
      fontFamily: normalizeFontFamily(source.fontFamily),
      fontSize: clampNumber(source.fontSize, DEFAULT_SETTINGS.fontSize, 6, 36),
      fontColor: normalizeColor(source.fontColor, DEFAULT_SETTINGS.fontColor),
      headerBold: Boolean(source.headerBold)
    };
  }

  function getSettings() {
    return normalizeSettings(readJson(SETTINGS_KEY, DEFAULT_SETTINGS));
  }

  function saveSettings(settings) {
    const normalized = normalizeSettings(settings);
    writeJson(SETTINGS_KEY, normalized);
    return normalized;
  }

  function getTemplates() {
    const templates = readJson(TEMPLATES_KEY, []);
    if (!Array.isArray(templates)) {
      return [];
    }

    return templates
      .filter((template) => template && typeof template.name === "string")
      .map((template) => ({
        id: String(template.id || cryptoRandomId()),
        name: template.name.trim() || "未命名模板",
        settings: normalizeSettings(template.settings),
        createdAt: template.createdAt || new Date().toISOString(),
        updatedAt: template.updatedAt || template.createdAt || new Date().toISOString()
      }));
  }

  function saveTemplates(templates) {
    writeJson(TEMPLATES_KEY, templates);
  }

  function getActiveTemplateId() {
    if (!storageAvailable()) {
      return "";
    }

    return global.localStorage.getItem(ACTIVE_TEMPLATE_KEY) || "";
  }

  function setActiveTemplateId(id) {
    if (!storageAvailable()) {
      return;
    }

    if (id) {
      global.localStorage.setItem(ACTIVE_TEMPLATE_KEY, id);
    } else {
      global.localStorage.removeItem(ACTIVE_TEMPLATE_KEY);
    }
  }

  function getActiveSettings() {
    const activeId = getActiveTemplateId();
    const template = getTemplates().find((item) => item.id === activeId);
    return template ? template.settings : getSettings();
  }

  function upsertTemplate(name, settings) {
    const cleanName = String(name || "").trim();
    if (!cleanName) {
      throw new Error("请先填写模板名称。");
    }

    const now = new Date().toISOString();
    const templates = getTemplates();
    const existing = templates.find((template) => template.name === cleanName);
    const normalized = normalizeSettings(settings);

    if (existing) {
      existing.settings = normalized;
      existing.updatedAt = now;
      setActiveTemplateId(existing.id);
      saveSettings(normalized);
      saveTemplates(templates);
      return existing;
    }

    const template = {
      id: cryptoRandomId(),
      name: cleanName,
      settings: normalized,
      createdAt: now,
      updatedAt: now
    };

    templates.push(template);
    setActiveTemplateId(template.id);
    saveSettings(normalized);
    saveTemplates(templates);
    return template;
  }

  function deleteTemplate(id) {
    const templates = getTemplates().filter((template) => template.id !== id);
    saveTemplates(templates);

    if (getActiveTemplateId() === id) {
      setActiveTemplateId("");
    }
  }

  function cryptoRandomId() {
    if (global.crypto && typeof global.crypto.randomUUID === "function") {
      return global.crypto.randomUUID();
    }

    return `tpl-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function assertWordReady() {
    if (!global.Word || !global.Office) {
      throw new Error("请在 Word 加载项中运行。浏览器预览只能检查界面。");
    }

    const requirements = global.Office.context && global.Office.context.requirements;
    if (requirements && !requirements.isSetSupported("WordApi", "1.3")) {
      throw new Error("当前 Word 版本不支持 WordApi 1.3，无法稳定修改表格框线。");
    }
  }

  function toWordColor(hex) {
    return normalizeColor(hex, "#000000").replace("#", "").toUpperCase();
  }

  function toHalfPoints(points) {
    return String(Math.round(clampNumber(points, DEFAULT_SETTINGS.fontSize, 6, 36) * 2));
  }

  function toBorderEighthPoints(points) {
    return String(Math.round(snapBorderWidth(points, DEFAULT_SETTINGS.headerWidth) * 8));
  }

  function wAttr(name) {
    return `w:${name}`;
  }

  function setWAttr(element, name, value) {
    element.setAttributeNS(WORD_NS, wAttr(name), String(value));
  }

  function getWChildren(parent, localName) {
    return Array.from(parent.childNodes).filter(
      (node) => node.nodeType === 1 && node.namespaceURI === WORD_NS && node.localName === localName
    );
  }

  function getFirstWChild(parent, localName) {
    return getWChildren(parent, localName)[0] || null;
  }

  function removeWChildren(parent, localName) {
    getWChildren(parent, localName).forEach((node) => node.remove());
  }

  function removeWDescendants(parent, localName) {
    Array.from(parent.getElementsByTagNameNS(WORD_NS, localName)).forEach((node) => node.remove());
  }

  function createWElement(doc, localName) {
    return doc.createElementNS(WORD_NS, wAttr(localName));
  }

  function ensureWChild(parent, localName, insertFirst) {
    const existing = getFirstWChild(parent, localName);
    if (existing) {
      return existing;
    }

    const created = createWElement(parent.ownerDocument, localName);
    if (insertFirst && parent.firstChild) {
      parent.insertBefore(created, parent.firstChild);
    } else {
      parent.appendChild(created);
    }
    return created;
  }

  function ensureTableProperties(table) {
    return ensureWChild(table, "tblPr", true);
  }

  function ensureCellProperties(cell) {
    return ensureWChild(cell, "tcPr", true);
  }

  function clearTableStyleEffects(table, tableProperties) {
    removeWChildren(tableProperties, "tblStyle");
    removeWChildren(tableProperties, "tblStyleRowBandSize");
    removeWChildren(tableProperties, "tblStyleColBandSize");
    removeWChildren(tableProperties, "tblLook");
    removeWDescendants(table, "cnfStyle");
  }

  function clearTableShading(table, tableProperties) {
    clearTableStyleEffects(table, tableProperties);
    removeWDescendants(table, "shd");
  }

  function setTableAutofit(tableProperties) {
    const width = ensureWChild(tableProperties, "tblW", false);
    setWAttr(width, "type", "pct");
    setWAttr(width, "w", "5000");

    const layout = ensureWChild(tableProperties, "tblLayout", false);
    setWAttr(layout, "type", "autofit");
  }

  function setBorderElement(borders, localName, options) {
    const border = ensureWChild(borders, localName, false);
    if (options.visible) {
      setWAttr(border, "val", "single");
      setWAttr(border, "sz", toBorderEighthPoints(options.width));
      setWAttr(border, "space", "0");
      setWAttr(border, "color", toWordColor(options.color));
    } else {
      setWAttr(border, "val", "nil");
      setWAttr(border, "sz", "0");
      setWAttr(border, "space", "0");
      setWAttr(border, "color", "auto");
    }
  }

  function setTableBorders(tableProperties, settings) {
    const borders = ensureWChild(tableProperties, "tblBorders", false);
    setBorderElement(borders, "top", { visible: true, width: settings.outerWidth, color: settings.borderColor });
    setBorderElement(borders, "left", { visible: false });
    setBorderElement(borders, "bottom", { visible: true, width: settings.outerWidth, color: settings.borderColor });
    setBorderElement(borders, "right", { visible: false });
    setBorderElement(borders, "insideH", { visible: false });
    setBorderElement(borders, "insideV", { visible: false });
  }

  function setHeaderBottomBorder(row, settings) {
    getWChildren(row, "tc").forEach((cell) => {
      const cellProperties = ensureCellProperties(cell);
      const borders = ensureWChild(cellProperties, "tcBorders", false);
      setBorderElement(borders, "bottom", {
        visible: true,
        width: settings.headerWidth,
        color: settings.borderColor
      });
    });
  }

  function setRunFormatting(run, settings, isHeaderRun) {
    const runProperties = ensureWChild(run, "rPr", true);
    const fonts = ensureWChild(runProperties, "rFonts", false);
    setWAttr(fonts, "ascii", settings.fontFamily);
    setWAttr(fonts, "hAnsi", settings.fontFamily);
    setWAttr(fonts, "cs", settings.fontFamily);
    setWAttr(fonts, "eastAsia", settings.fontFamily);

    const color = ensureWChild(runProperties, "color", false);
    setWAttr(color, "val", toWordColor(settings.fontColor));
    color.removeAttributeNS(WORD_NS, "themeColor");
    color.removeAttribute("w:themeColor");

    const size = ensureWChild(runProperties, "sz", false);
    setWAttr(size, "val", toHalfPoints(settings.fontSize));
    const complexSize = ensureWChild(runProperties, "szCs", false);
    setWAttr(complexSize, "val", toHalfPoints(settings.fontSize));

    getWChildren(runProperties, "b").forEach((node) => node.remove());
    getWChildren(runProperties, "bCs").forEach((node) => node.remove());
    if (isHeaderRun && settings.headerBold) {
      runProperties.appendChild(createWElement(run.ownerDocument, "b"));
      runProperties.appendChild(createWElement(run.ownerDocument, "bCs"));
    }
  }

  function formatOoxmlTable(doc, table, settings) {
    const tableProperties = ensureTableProperties(table);
    clearTableShading(table, tableProperties);
    setTableAutofit(tableProperties);
    setTableBorders(tableProperties, settings);

    const rows = getWChildren(table, "tr");
    rows.forEach((row, rowIndex) => {
      getWChildren(row, "tc").forEach((cell) => {
        ensureCellProperties(cell);
      });

      Array.from(row.getElementsByTagNameNS(WORD_NS, "r")).forEach((run) => {
        setRunFormatting(run, settings, rowIndex === 0);
      });
    });

    if (rows[0]) {
      setHeaderBottomBorder(rows[0], settings);
    }

    return doc;
  }

  // Editing OOXML avoids Word for Mac border-width errors seen with TableBorder APIs.
  function transformTableOoxml(ooxml, settings) {
    const parser = new global.DOMParser();
    const doc = parser.parseFromString(ooxml, "application/xml");
    if (doc.getElementsByTagName("parsererror").length) {
      throw new Error("无法解析 Word 返回的表格 OOXML。");
    }

    const tables = Array.from(doc.getElementsByTagNameNS(WORD_NS, "tbl"));
    if (!tables.length) {
      throw new Error("没有在选区 OOXML 中找到表格。");
    }

    tables.forEach((table) => {
      formatOoxmlTable(doc, table, settings);
    });

    return new global.XMLSerializer().serializeToString(doc);
  }

  async function applyToSelection(settingsInput) {
    const settings = normalizeSettings(settingsInput || getActiveSettings());
    assertWordReady();

    let formattedCount = 0;

    await global.Word.run(async (context) => {
      const selection = context.document.getSelection();
      const selectedTables = selection.tables;
      const parentTable = selection.parentTableOrNullObject;

      selectedTables.load("items");
      parentTable.load("rowCount");
      await context.sync();

      let tables = selectedTables.items || [];
      if (!tables.length && !parentTable.isNullObject) {
        tables = [parentTable];
      }

      if (!tables.length) {
        throw new Error("没有找到选中的表格。请先选中表格，或把光标放在表格内。");
      }

      const ranges = tables.map((table) => table.getRange());
      const ooxmlResults = ranges.map((range) => range.getOoxml());
      await context.sync();

      for (let index = ranges.length - 1; index >= 0; index -= 1) {
        const transformed = transformTableOoxml(ooxmlResults[index].value, settings);
        ranges[index].insertOoxml(transformed, getInsertLocation("replace", "Replace"));
      }

      formattedCount = tables.length;
      await context.sync();
    });

    saveSettings(settings);
    return {
      formattedCount,
      settings
    };
  }

  function getInsertLocation(key, fallback) {
    const insertLocations = global.Word && global.Word.InsertLocation;
    return insertLocations && insertLocations[key] ? insertLocations[key] : fallback;
  }

  function getErrorMessage(error) {
    const debugInfo = error && error.debugInfo;
    const location = debugInfo && debugInfo.errorLocation ? ` (${debugInfo.errorLocation})` : "";
    return `${error && error.message ? error.message : "应用失败"}${location}`;
  }

  function resetSettings() {
    setActiveTemplateId("");
    return saveSettings(DEFAULT_SETTINGS);
  }

  global.ThreeLineFormatter = {
    DEFAULT_SETTINGS,
    normalizeSettings,
    getSettings,
    saveSettings,
    getTemplates,
    upsertTemplate,
    deleteTemplate,
    getActiveTemplateId,
    setActiveTemplateId,
    getActiveSettings,
    applyToSelection,
    getErrorMessage,
    resetSettings
  };
})(window);
