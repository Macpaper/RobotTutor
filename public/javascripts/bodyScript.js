const toggleButton = document.getElementById("theme-toggle-button");

toggleButton.addEventListener("click", e => {
    toggleTheme();
});

function applyThemeToEditors(isLight) {
    if (window.miniEditors && Array.isArray(window.miniEditors)) {
        window.miniEditors.forEach(cm => {
            cm.setOption('theme', isLight ? 'default' : 'dracula');
        });
    }

    if (window.editorInstance && typeof monaco !== 'undefined') {
        monaco.editor.setTheme(isLight ? 'vs' : 'vs-dark');
    }
}

// On page load, restore theme preference
const savedTheme = localStorage.getItem('theme');
document.body.classList.remove('light-mode', 'dark-mode');
const isLightTheme = savedTheme === 'light';
if (isLightTheme) {
    document.body.classList.add('light-mode');
    updateThemeButton(true);
} else {
    document.body.classList.add('dark-mode');
    updateThemeButton(false);
}
applyThemeToEditors(isLightTheme);
    window.dispatchEvent(new CustomEvent('themechange', { detail: { isLightTheme } }));

function toggleTheme() {
    const isLight = !document.body.classList.contains('light-mode');
    document.body.classList.toggle('light-mode', isLight);
    document.body.classList.toggle('dark-mode', !isLight);
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    updateThemeButton(isLight);
    applyThemeToEditors(isLight);

    window.dispatchEvent(new CustomEvent('themechange', { detail: { isLight } }));
}

function updateThemeButton(isLight) {
    toggleButton.checked = isLight;
}