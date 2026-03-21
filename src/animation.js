(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const previousValues = new Map();
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        //获取发生变化的节点
        let target = mutation.target;
        if (target.nodeType === Node.TEXT_NODE) {
          target = target.parentElement;
        }
        if (
          target.classList.contains("info-value") ||
          target.tagName === "TD"
        ) {
          const text = target.textContent || "";
          const matches = text.match(/-?\d+(\.\d+)?/g);
          if (!matches) return;
          const newValue = parseFloat(matches[matches.length - 1]);
          if (!previousValues.has(target)) {
            previousValues.set(target, newValue);
            return;
          }
          const oldValue = previousValues.get(target);
          if (newValue > oldValue) {
            //变绿并跳动
            target.classList.remove("value-down");
            target.classList.add("value-up");
            target.classList.remove("jump-anim");
            void target.offsetWidth;
            target.classList.add("jump-anim");
          } else if (newValue < oldValue) {
            target.classList.remove("value-up", "jump-anim");
            target.classList.add("value-down");
          }
          previousValues.set(target, newValue);
        }
      });
    });
    const config = { childList: true, characterData: true, subtree: true };
    const infoPanel = document.getElementById("infoPanel");
    if (infoPanel) observer.observe(infoPanel, config);
    const valueTable = document.querySelector(".value-table");
    if (valueTable) observer.observe(valueTable, config);
  });
})();