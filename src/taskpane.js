(function initTaskpane(global) {
  "use strict";

  const formatter = global.ThreeLineFormatter;
  const form = document.getElementById("settingsForm");
  const status = document.getElementById("status");
  const applyCurrent = document.getElementById("applyCurrent");
  const templateName = document.getElementById("templateName");
  const saveTemplate = document.getElementById("saveTemplate");
  const templateList = document.getElementById("templateList");
  const resetDefaults = document.getElementById("resetDefaults");
  const chineseFontOptions = document.getElementById("chineseFontOptions");
  const westernFontOptions = document.getElementById("westernFontOptions");
  const fontStatus = document.getElementById("fontStatus");

  let isApplying = false;

  function setStatus(message, tone) {
    status.textContent = message;
    status.dataset.tone = tone || "neutral";
  }

  function getFormSettings() {
    return formatter.normalizeSettings({
      outerWidth: form.elements.outerWidth.value,
      headerWidth: form.elements.headerWidth.value,
      borderColor: form.elements.borderColor.value,
      chineseFontFamily: form.elements.chineseFontFamily.value,
      westernFontFamily: form.elements.westernFontFamily.value,
      fontSize: form.elements.fontSize.value,
      fontColor: form.elements.fontColor.value,
      headerBold: form.elements.headerBold.checked
    });
  }

  function fillForm(settings) {
    const normalized = formatter.normalizeSettings(settings);
    form.elements.outerWidth.value = normalized.outerWidth;
    form.elements.headerWidth.value = normalized.headerWidth;
    form.elements.borderColor.value = normalized.borderColor;
    form.elements.chineseFontFamily.value = normalized.chineseFontFamily;
    form.elements.westernFontFamily.value = normalized.westernFontFamily;
    form.elements.fontSize.value = normalized.fontSize;
    form.elements.fontColor.value = normalized.fontColor;
    form.elements.headerBold.checked = normalized.headerBold;
  }

  function persistCurrentSettings() {
    formatter.saveSettings(getFormSettings());
  }

  async function applySettings(settings, successPrefix) {
    if (isApplying) {
      return;
    }

    isApplying = true;
    applyCurrent.disabled = true;
    setStatus("正在处理选中的表格...", "busy");

    try {
      const result = await formatter.applyToSelection(settings);
      setStatus(`${successPrefix || "已应用"}：共处理 ${result.formattedCount} 个表格。`, "success");
      fillForm(result.settings);
      renderTemplates();
    } catch (error) {
      setStatus(formatter.getErrorMessage(error), "error");
    } finally {
      isApplying = false;
      applyCurrent.disabled = false;
    }
  }

  function renderTemplates() {
    const templates = formatter.getTemplates();
    const activeId = formatter.getActiveTemplateId();
    templateList.innerHTML = "";

    if (!templates.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "还没有模板。保存当前设置后，会出现在这里。";
      templateList.append(empty);
      return;
    }

    templates.forEach((template) => {
      const item = document.createElement("article");
      item.className = "template-item";
      item.dataset.active = template.id === activeId ? "true" : "false";

      const summary = document.createElement("button");
      summary.type = "button";
      summary.className = "template-apply";
      const fontSummary = summarizeFonts(template.settings);
      summary.innerHTML = `
        <strong>${escapeHtml(template.name)}</strong>
        <span>${template.settings.outerWidth} pt / ${template.settings.headerWidth} pt · ${escapeHtml(fontSummary)} ${template.settings.fontSize} pt</span>
      `;
      summary.addEventListener("click", () => {
        formatter.setActiveTemplateId(template.id);
        formatter.saveSettings(template.settings);
        fillForm(template.settings);
        renderTemplates();
        applySettings(template.settings, `已按「${template.name}」模板应用`);
      });

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "icon-button";
      remove.setAttribute("aria-label", `删除 ${template.name}`);
      remove.textContent = "×";
      remove.addEventListener("click", () => {
        formatter.deleteTemplate(template.id);
        renderTemplates();
        setStatus(`已删除模板「${template.name}」。`, "neutral");
      });

      item.append(summary, remove);
      templateList.append(item);
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function summarizeFonts(settings) {
    const normalized = formatter.normalizeSettings(settings);
    if (normalized.chineseFontFamily === normalized.westernFontFamily) {
      return normalized.chineseFontFamily;
    }

    return `${normalized.chineseFontFamily} / ${normalized.westernFontFamily}`;
  }

  function renderFontOptions(target, fonts, currentValue) {
    const values = [];
    const seen = new Set();

    [currentValue, ...fonts].forEach((font) => {
      const value = String(font || "").trim();
      const key = value.toLocaleLowerCase();
      if (!value || seen.has(key)) {
        return;
      }

      seen.add(key);
      values.push(value);
    });

    const fragment = document.createDocumentFragment();
    values.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      fragment.append(option);
    });

    target.replaceChildren(fragment);
  }

  function renderFontLists(fontLists) {
    const settings = getFormSettings();
    renderFontOptions(chineseFontOptions, fontLists.chinese, settings.chineseFontFamily);
    renderFontOptions(westernFontOptions, fontLists.western, settings.westernFontFamily);

    if (fontLists.source === "word") {
      fontStatus.textContent = `已读取 ${fontLists.all.length} 个 Word 可用字体。`;
      fontStatus.dataset.tone = "success";
    } else {
      fontStatus.textContent = "当前环境不能自动读取字体；可从常用字体选择，也可直接输入本机字体名。";
      fontStatus.dataset.tone = "neutral";
    }
  }

  async function loadFonts() {
    renderFontLists({
      source: "fallback",
      ...formatter.getFallbackFontLists()
    });

    if (!global.Word) {
      return;
    }

    fontStatus.textContent = "正在读取 Word 可用字体...";
    fontStatus.dataset.tone = "busy";

    const fontLists = await formatter.loadAvailableFonts();
    renderFontLists(fontLists);
  }

  function wireEvents() {
    form.addEventListener("input", () => {
      persistCurrentSettings();
    });

    applyCurrent.addEventListener("click", () => {
      const settings = formatter.saveSettings(getFormSettings());
      formatter.setActiveTemplateId("");
      renderTemplates();
      applySettings(settings, "已按当前设置应用");
    });

    saveTemplate.addEventListener("click", () => {
      try {
        const template = formatter.upsertTemplate(templateName.value, getFormSettings());
        templateName.value = "";
        fillForm(template.settings);
        renderTemplates();
        setStatus(`已保存模板「${template.name}」。点击模板即可直接应用。`, "success");
      } catch (error) {
        setStatus(error.message || "保存模板失败。", "error");
      }
    });

    resetDefaults.addEventListener("click", () => {
      const defaults = formatter.resetSettings();
      fillForm(defaults);
      renderTemplates();
      setStatus("已恢复默认三线表参数。", "neutral");
    });
  }

  let booted = false;

  function boot() {
    if (booted) {
      return;
    }

    booted = true;
    fillForm(formatter.getActiveSettings());
    loadFonts();
    renderTemplates();
    wireEvents();

    if (global.Word) {
      setStatus("准备就绪。请先选中一个 Word 表格。", "neutral");
    } else {
      setStatus("当前是浏览器预览；在 Word 中打开后即可修改表格。", "neutral");
    }
  }

  if (global.Office && typeof global.Office.onReady === "function") {
    const previewFallback = global.setTimeout(boot, 1200);
    global.Office.onReady(() => {
      global.clearTimeout(previewFallback);
      boot();
    });
  } else {
    document.addEventListener("DOMContentLoaded", boot);
  }
})(window);
