type DialogTask = () => void;
const dialogQueue: DialogTask[] = [];
let isDialogShowing = false;

function processQueue() {
  if (isDialogShowing || dialogQueue.length === 0) return;
  isDialogShowing = true;
  const nextTask = dialogQueue.shift();
  if (nextTask) nextTask();
}

function onDialogClosed() {
  isDialogShowing = false;
  processQueue();
}

export function showTextDialog(content: string[], onFinish?: () => void): void {
  dialogQueue.push(() => {
    const wrapper = document.querySelector(".canvas-wrapper") as HTMLElement;
    if (!wrapper) {
      onDialogClosed();
      return;
    }
    const dialog = document.createElement("div");
    dialog.id = "text-dialog-overlay";
    const textElement = document.createElement("p");
    textElement.id = "text-dialog-text";
    const hint = document.createElement("span");
    hint.innerText = "点击屏幕继续...";
    hint.id = "text-dialog-hint";
    dialog.appendChild(textElement);
    dialog.appendChild(hint);
    wrapper.appendChild(dialog);
    let currentIndex = 0;
    const updateDisplay = () => {
      if (currentIndex < content.length) {
        textElement.innerText = content[currentIndex] as string;
      } else {
        dialog.style.opacity = "0";
        setTimeout(() => {
          if (dialog.parentNode) {
            dialog.parentNode.removeChild(dialog);
            if (onFinish) onFinish();
          }
          onDialogClosed();
        }, 300);
      }
    };
    updateDisplay();
    dialog.addEventListener("click", (e) => {
      e.stopPropagation();
      currentIndex++;
      updateDisplay();
    });
  });
  processQueue();
}

export function showButtonTextDialog(
    content: string[],
    buttonText: string,
    onButtonClick: () => void,
    onFinish?: () => void
): void {
  dialogQueue.push(() => {
    const wrapper = document.querySelector(".canvas-wrapper") as HTMLElement;
    if (!wrapper) {
      onDialogClosed();
      return;
    }

    const dialog = document.createElement("div");
    dialog.id = "text-dialog-overlay";
    dialog.style.display = "flex";
    dialog.style.flexDirection = "column";
    dialog.style.alignItems = "center";
    dialog.style.justifyContent = "center";
    const textElement = document.createElement("p");
    textElement.id = "text-dialog-text";
    textElement.style.marginBottom = "20px";
    const button = document.createElement("button");
    button.innerText = buttonText;
    button.style.position = "absolute";
    button.style.bottom = "70px";
    button.style.left = "50%";
    button.style.transform = "translateX(-50%)";
    button.style.padding = "10px 24px";
    button.style.fontSize = "16px";
    button.style.cursor = "pointer";
    button.style.zIndex = "10";
    button.style.pointerEvents = "auto";
    const hint = document.createElement("span");
    hint.innerText = "点击屏幕继续...";
    hint.id = "text-dialog-hint";
    hint.style.position = "absolute";
    hint.style.bottom = "20px"; 
    textElement.style.marginBottom = "0";
    dialog.appendChild(textElement);
    dialog.appendChild(button);
    dialog.appendChild(hint);
    wrapper.appendChild(dialog);
    let currentIndex = 0;
    const updateDisplay = () => {
      if (currentIndex < content.length) {
        textElement.innerText = content[currentIndex] as string;
      } else {
        dialog.style.opacity = "0";
        setTimeout(() => {
          if (wrapper.contains(dialog)) {
            wrapper.removeChild(dialog);
          }
          if (onFinish) onFinish();
          onDialogClosed();
        }, 300);
      }
    };
    dialog.addEventListener("click", () => {
      currentIndex++;
      updateDisplay();
    });
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      onButtonClick();
      currentIndex++;
      updateDisplay();
    });
    requestAnimationFrame(() => {
      dialog.style.opacity = "1";
    });
    updateDisplay();
  });
  processQueue();
}

export function showConfirmDialog(
  message: string,
  onYes?: () => void,
  onNo?: () => void,
  isSubDialog: boolean = false,
): void {
  const render = () => {
    const wrapper = document.querySelector(".canvas-wrapper") as HTMLElement;
    if (!wrapper) {
      if (!isSubDialog) onDialogClosed();
      return;
    }
    const overlay = document.createElement("div");
    overlay.id = "confirm-dialog-overlay";
    const text = document.createElement("p");
    text.innerText = message;
    text.style.marginBottom = "20px";
    text.style.fontWeight = "bold";
    const btns = document.createElement("div");
    btns.style.display = "flex";
    btns.style.gap = "15px";
    const closeConfirm = () => {
      overlay.remove();
      if (!isSubDialog) onDialogClosed();
    };

    const yesBtn = document.createElement("button");
    yesBtn.innerText = "确定";
    yesBtn.onclick = () => {
      closeConfirm();
      if (onYes) onYes();
    };

    const noBtn = document.createElement("button");
    noBtn.innerText = "取消";
    noBtn.onclick = () => {
      closeConfirm();
      if (onNo) onNo();
    };

    btns.append(noBtn, yesBtn);
    overlay.append(text, btns);
    wrapper.appendChild(overlay);
  };

  if (isSubDialog) {
    render();
  } else {
    dialogQueue.push(render);
    processQueue();
  }
}

export function showInputDialog<T extends string | number>(
  message: string,
  validator: (value: T) => string | null,
  onCancel?: () => void,
  onConfirm?: (value: T) => void,
  inputMode: "number" | "text" = "number",
  needConfirmOnSubmit: boolean = false,
  needConfirmOnCancel: boolean = false,
  submitConfirmText: string = "确定要提交吗？",
  cancelConfirmText: string = "确定要取消吗？",
): void {
  dialogQueue.push(() => {
    const wrapper = document.querySelector(".canvas-wrapper") as HTMLElement;
    if (!wrapper) {
      onDialogClosed();
      return;
    }
    const overlay = document.createElement("div");
    overlay.id = "input-dialog-overlay";
    const title = document.createElement("p");
    title.innerText = message;
    title.id = "input-dialog-title";
    const input = document.createElement("input");
    input.type = inputMode;
    input.id = "input-dialog-input";
    input.onfocus = () => (input.style.borderColor = "#4a90e2");
    input.onblur = () => (input.style.borderColor = "#e2e8f0");
    const errorHint = document.createElement("p");
    errorHint.style.color = "red";
    errorHint.style.fontSize = "12px";
    errorHint.style.visibility = "hidden";
    const btnBox = document.createElement("div");
    btnBox.style.display = "flex";
    btnBox.style.gap = "20px";

    const finalClose = () => {
      overlay.remove();
      onDialogClosed();
    };

    const handleConfirm = () => {
      const val = (
        inputMode === "number" ? Number(input.value) : input.value
      ) as T;
      const error = validator(val);
      if (error) {
        errorHint.innerText = error;
        errorHint.style.visibility = "visible";
        return;
      }

      if (needConfirmOnSubmit) {
        overlay.style.visibility = "hidden";
        showConfirmDialog(
          submitConfirmText,
          () => {
            finalClose();
            if (onConfirm) onConfirm(val);
          },
          () => {
            overlay.style.visibility = "visible";
          },
          true,
        );
      } else {
        finalClose();
        if (onConfirm) onConfirm(val);
      }
    };

    const handleCancel = () => {
      if (needConfirmOnCancel) {
        overlay.style.visibility = "hidden";
        showConfirmDialog(
          cancelConfirmText,
          () => {
            finalClose();
            if (onCancel) onCancel();
          },
          () => {
            overlay.style.visibility = "visible";
          },
          true,
        );
      } else {
        finalClose();
        if (onCancel) onCancel();
      }
    };

    const okBtn = document.createElement("button");
    okBtn.innerText = "确定";
    okBtn.onclick = handleConfirm;
    const ccBtn = document.createElement("button");
    ccBtn.innerText = "取消";
    ccBtn.onclick = handleCancel;
    btnBox.append(ccBtn, okBtn);
    overlay.append(title, input, errorHint, btnBox);
    wrapper.appendChild(overlay);
  });
  processQueue();
}

export async function asyncDialog(
  type: "text",
  content: string[],
): Promise<void>;
export async function asyncDialog(
  type: "confirm",
  message: string,
): Promise<boolean>;
export async function asyncDialog<T extends string | number>(
  type: "input",
  message: string,
  validator: (value: T) => string | null,
  inputMode: "number" | "text",
  doubleSubmitCheck?: boolean,
  doubleCancelCheck?: boolean,
  checkMsg?: string,
  cancelCheckMsg?: string,
): Promise<T | null>;
export function asyncDialog(
    type: "textWithButton",
    content: string[],
    buttonText: string,
    onButtonClick: () => void
): Promise<void>;

export async function asyncDialog(type: string, ...args: any[]): Promise<any> {
  return new Promise((resolve) => {
    switch (type) {
      case "text":
        showTextDialog(args[0], () => resolve(undefined));
        break;
      case "confirm":
        showConfirmDialog(
          args[0],
          () => resolve(true),
          () => resolve(false),
        );
        break;
      case "input":
        showInputDialog(
          args[0],
          args[1],
          () => resolve(null),
          (val) => resolve(val),
          args[2] || "number",
          args[3] || false,
          args[4] || false,
          args[5] || "确定吗？",
          args[6] || "确定放弃吗？",
        );
        break;
        case "textWithButton":
          showButtonTextDialog(
              args[0],
              args[1],
              args[2],
              () => resolve(undefined)
          );
    }
  });
}
/**
 * @returns 返回选择的选项的索引，点取消返回-1
 */
export function showMenuDialog(
  title: string,
  options: string[],
  descriptions?: string[],
): Promise<number> {
  return new Promise((resolve) => {
    const wrapper = document.querySelector(".canvas-wrapper") as HTMLElement;
    if (!wrapper) return;
    const overlay = document.createElement("div");
    overlay.id = "menu-dialog-overlay";
    const header = document.createElement("div");
    header.innerText = title;
    header.id = "menu-dialog-header";
    overlay.appendChild(header);
    const listContainer = document.createElement("div");
    listContainer.id = "menu-dialog-container";

    const allItems = [...options, "取消"];
    allItems.forEach((text, index) => {
      const item = document.createElement("div");
      item.id = "menu-dialog-item";
      const titleDiv = document.createElement("div");
      titleDiv.textContent = text;
      titleDiv.style.display = "block";
      titleDiv.style.textAlign = "center";
      titleDiv.style.width = "100%";
      item.appendChild(titleDiv);
      //有描述且不是取消项则添加描述
      if (descriptions && index < options.length && descriptions[index]) {
        const descDiv = document.createElement("div");
        descDiv.textContent = descriptions[index];
        descDiv.className = "menu-dialog-description";
        descDiv.style.display = "block";
        descDiv.style.textAlign = "center";
        descDiv.style.width = "100%";
        item.appendChild(descDiv);
      }

      Object.assign(item.style, {
        transition: "background 0.2s",
        borderBottom:
          index === allItems.length - 1 ? "none" : "1px solid #f0f0f0",
      });

      item.onmouseenter = () => (item.style.backgroundColor = "#f0f7ff");
      item.onmouseleave = () => (item.style.backgroundColor = "transparent");
      item.onclick = (e) => {
        e.stopPropagation();
        overlay.remove();
        resolve(index === options.length ? -1 : index);
      };
      listContainer.appendChild(item);
    });
    overlay.appendChild(listContainer);
    wrapper.appendChild(overlay);
  });
}

let taskHintElement: HTMLDivElement | null = null;

export function showTaskHint(text: string): void {
  const wrapper = document.querySelector(".canvas-wrapper") as HTMLElement;
  if (!wrapper) return;
  if (taskHintElement) {
    taskHintElement.innerText = text;
    return;
  }
  const hint = document.createElement("div");
  taskHintElement = hint;
  hint.innerText = text;
  hint.id = "hint-dialog";
  wrapper.appendChild(hint);
  requestAnimationFrame(() => {
    hint.style.opacity = "1";
    hint.style.top = "30px";
  });
}

export function hideTaskHint(): void {
  if (!taskHintElement) return;
  const hint = taskHintElement;
  taskHintElement = null;
  hint.style.opacity = "0";
  hint.style.top = "20px";
  setTimeout(() => {
    if (hint.parentNode) {
      hint.parentNode.removeChild(hint);
    }
  }, 300);
}
