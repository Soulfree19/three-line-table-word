(function registerCommands(global) {
  "use strict";

  async function applyThreeLineTableFromRibbon(event) {
    try {
      const settings = global.ThreeLineFormatter.getActiveSettings();
      await global.ThreeLineFormatter.applyToSelection(settings);
    } catch (error) {
      console.error(global.ThreeLineFormatter.getErrorMessage(error), error);
    } finally {
      event.completed();
    }
  }

  function register() {
    if (global.Office && global.Office.actions) {
      global.Office.actions.associate("applyThreeLineTableFromRibbon", applyThreeLineTableFromRibbon);
    }
  }

  if (global.Office && typeof global.Office.onReady === "function") {
    global.Office.onReady(register);
  } else {
    register();
  }
})(window);
