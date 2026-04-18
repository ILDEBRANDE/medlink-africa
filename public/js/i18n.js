let currentLanguage = 'en';
let translations = {};

async function loadLanguage(lang) {
    try {
        const res = await fetch(`/locales/${lang}.json`);
        translations = await res.json();
        currentLanguage = lang;
        applyTranslations();
    } catch(e) {
        console.error('Failed to load language', e);
    }
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[key]) {
            if (el.tagName === 'INPUT' && el.type === 'button') {
                el.value = translations[key];
            } else if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'password')) {
                el.placeholder = translations[key];
            } else {
                el.innerText = translations[key];
            }
        }
    });
}

// Automatically load user's language from server
async function initI18n() {
    const res = await fetch('/api/settings', { credentials: 'include' });
    if (res.ok) {
        const settings = await res.json();
        await loadLanguage(settings.language);
    } else {
        await loadLanguage('en');
    }
}

// Call initI18n after login on every page