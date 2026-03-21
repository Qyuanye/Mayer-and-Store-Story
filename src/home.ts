//abandoned
import {loadGame} from "./saveload.ts";

document.getElementById("startBtn")?.addEventListener('click', () => {
    window.location.href = '/index.html';
})

document.getElementById("loadGameBtn")?.addEventListener('click', () => {
    const fileInput = document.getElementById("loadGame");
    if (!fileInput) return;
    fileInput.click();
    fileInput.addEventListener("change", async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
            await loadGame(file);
        }
    })
})

document.getElementById("settingsBtn")?.addEventListener('click', () => {
    window.location.href = 'settings.html';
})