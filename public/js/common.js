// common.js - Medical Recruitment Platform
const API_BASE = '/api';

// ========== AUTHENTICATION ==========
async function checkAuth() {
    try {
        const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            return data.user;
        }
        return null;
    } catch(e) {
        return null;
    }
}

async function logout() {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
    window.location.href = '/';
}

function redirectToDashboard(role) {
    if (role === 'doctor') window.location.href = '/doctor/dashboard.html';
    else if (role === 'hospital') window.location.href = '/hospital/dashboard.html';
    else if (role === 'admin') window.location.href = '/admin/dashboard.html';
    else window.location.href = '/';
}

// ========== UTILITIES ==========
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ========== NOTIFICATION BADGE ==========
async function loadUnreadCount() {
    try {
        const res = await fetch('/api/notifications', { credentials: 'include' });
        if (!res.ok) return;
        const notifs = await res.json();
        const unread = notifs.filter(n => !n.is_read).length;
        const badge = document.getElementById('notificationBadge');
        if (badge) badge.textContent = unread > 0 ? unread : '';
    } catch(e) {}
}

// ========== THEME MANAGEMENT ==========
function adjustColor(hex, percent) {
    let r = parseInt(hex.slice(1,3), 16);
    let g = parseInt(hex.slice(3,5), 16);
    let b = parseInt(hex.slice(5,7), 16);
    r = Math.min(255, Math.max(0, r + (r * percent / 100)));
    g = Math.min(255, Math.max(0, g + (g * percent / 100)));
    b = Math.min(255, Math.max(0, b + (b * percent / 100)));
    return `#${Math.round(r).toString(16).padStart(2,'0')}${Math.round(g).toString(16).padStart(2,'0')}${Math.round(b).toString(16).padStart(2,'0')}`;
}

function applyTheme(theme, customColor = null) {
    document.body.className = theme;
    if (theme === 'custom' && customColor) {
        document.body.style.setProperty('--primary-color', customColor);
        document.body.style.setProperty('--primary-hover', adjustColor(customColor, -20));
    } else {
        if (theme === 'light') document.body.style.setProperty('--primary-color', '#3498db');
        else if (theme === 'dark') document.body.style.setProperty('--primary-color', '#2980b9');
        else if (theme === 'blue') document.body.style.setProperty('--primary-color', '#0c4a6e');
        else if (theme === 'green') document.body.style.setProperty('--primary-color', '#14532d');
        document.body.style.setProperty('--primary-hover', '');
    }
    localStorage.setItem('theme', theme);
    if (customColor) localStorage.setItem('customColor', customColor);
}

async function initTheme() {
    try {
        const res = await fetch('/api/settings', { credentials: 'include' });
        if (res.ok) {
            const settings = await res.json();
            applyTheme(settings.theme || 'light');
        } else {
            applyTheme('light');
        }
    } catch(e) {
        applyTheme('light');
    }
}

// ========== I18N ==========
let currentLanguage = 'en';
let translations = {};

async function loadLanguage(lang) {
    try {
        const res = await fetch(`/locales/${lang}.json`);
        if (!res.ok) throw new Error(`Failed to load ${lang}`);
        translations = await res.json();
        currentLanguage = lang;
        applyTranslations();
    } catch(e) {
        console.error('Language load error:', e);
        if (lang !== 'en') await loadLanguage('en');
    }
}

function applyTranslations() {
    if (!translations) return;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[key]) {
            if (el.tagName === 'INPUT' && (el.type === 'button' || el.type === 'submit')) {
                el.value = translations[key];
            } else if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'password' || el.type === 'email')) {
                el.placeholder = translations[key];
            } else if (el.tagName === 'TEXTAREA') {
                el.placeholder = translations[key];
            } else {
                el.innerText = translations[key];
            }
        }
    });
    if (translations.app_name) document.title = translations.app_name;
}

async function initI18n() {
    try {
        const res = await fetch('/api/settings', { credentials: 'include' });
        if (res.ok) {
            const settings = await res.json();
            await loadLanguage(settings.language || 'en');
        } else {
            await loadLanguage('en');
        }
    } catch(e) {
        await loadLanguage('en');
    }
}

async function loadAdminLanguage() {
    try {
        const res = await fetch('/api/admin/admin-settings', { credentials: 'include' });
        if (res.ok) {
            const settings = await res.json();
            await loadLanguage(settings.language || 'en');
        } else {
            await loadLanguage('en');
        }
    } catch(e) {
        await loadLanguage('en');
    }
}

// ========== NAVBAR INJECTION ==========
function injectNavbar(role) {
    const nav = document.getElementById('navbar');
    if (!nav) return;
    
    let links = `<div class="container"><div class="logo"><h1 data-i18n="app_name">Medical Recruitment</h1></div><div class="nav-links">`;
    
    if (role === 'doctor') {
        links += `<a href="/doctor/dashboard.html" data-i18n="dashboard">Dashboard</a>
                  <a href="/doctor/profile.html" data-i18n="profile">Profile</a>
                  <a href="/doctor/jobs.html" data-i18n="find_jobs">Find Jobs</a>
                  <a href="/messages.html" data-i18n="messages">Messages</a>
                  <a href="/notifications.html" data-i18n="notifications">Notifications</a>
                  <a href="/settings.html" data-i18n="settings">Settings</a>
                  <a href="#" onclick="logout()" data-i18n="logout">Logout</a>`;
    } 
    else if (role === 'hospital') {
        links += `<a href="/hospital/dashboard.html" data-i18n="dashboard">Dashboard</a>
                  <a href="/hospital/jobs.html" data-i18n="my_jobs">My Jobs</a>
                  <a href="/hospital/post-job.html" data-i18n="post_job">Post Job</a>
                  <a href="/hospital/applicants.html" data-i18n="applicants">Applicants</a>
                  <div class="dropdown">
                      <button class="dropbtn" data-i18n="more">More ▼</button>
                      <div class="dropdown-content">
                          <a href="/hospital/search-doctors.html" data-i18n="search_doctors">Search Doctors</a>
                          <a href="/messages.html" data-i18n="messages">Messages</a>
                          <a href="/hospital/profile.html" data-i18n="profile">Profile</a>
                          <a href="/settings.html" data-i18n="settings">Settings</a>
                          <a href="#" onclick="logout()" data-i18n="logout">Logout</a>
                      </div>
                  </div>`;
    } 
    else if (role === 'admin') {
        // Admin navbar WITHOUT Map
        links += `<a href="/admin/dashboard.html" data-i18n="dashboard">Dashboard</a>
                  <a href="/admin/users.html" data-i18n="users">Users</a>
                  <a href="/admin/content.html" data-i18n="content">Content</a>
                  <a href="/admin/jobs.html" data-i18n="jobs">Jobs</a>
                  <a href="/admin/stats.html" data-i18n="stats">Stats</a>
                  <a href="/admin/support.html" data-i18n="support">Support</a>
                  <a href="/admin/system.html" data-i18n="system">System</a>
                  <a href="#" onclick="logout()" data-i18n="logout">Logout</a>`;
    } 
    else {
        links += `<a href="/" data-i18n="home">Home</a>
                  <a href="/login.html" data-i18n="login">Login</a>
                  <a href="/register.html" data-i18n="register">Register</a>`;
    }
    
    links += `</div></div>`;
    nav.innerHTML = links;
    applyTranslations();
    
    // Add dropdown CSS for hospital only
    if (role === 'hospital' && !document.getElementById('dropdown-styles')) {
        const style = document.createElement('style');
        style.id = 'dropdown-styles';
        style.textContent = `
            .dropdown {
                position: relative;
                display: inline-block;
            }
            .dropbtn {
                background: transparent;
                color: white;
                padding: 8px 16px;
                font-size: 16px;
                border: none;
                cursor: pointer;
                font-family: inherit;
            }
            .dropdown-content {
                display: none;
                position: absolute;
                background-color: #2c3e50;
                min-width: 160px;
                box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
                z-index: 1;
                border-radius: 5px;
                overflow: hidden;
            }
            .dropdown-content a {
                color: white;
                padding: 12px 16px;
                text-decoration: none;
                display: block;
                text-align: left;
            }
            .dropdown-content a:hover {
                background-color: #34495e;
            }
            .dropdown:hover .dropdown-content {
                display: block;
            }
            .dropdown:hover .dropbtn {
                background-color: #34495e;
                border-radius: 5px;
            }
        `;
        document.head.appendChild(style);
    }
}

// ========== DOCTOR / HOSPITAL PAGE INIT ==========
async function initUserPanel(requiredRole) {
    const user = await checkAuth();
    if (!user || user.role !== requiredRole) {
        window.location.href = '/login.html';
        return;
    }
    injectNavbar(requiredRole);
    await initI18n();
    await initTheme();
    loadUnreadCount();
    setInterval(loadUnreadCount, 30000);
}

// ========== ADMIN INIT ==========
async function initAdminPanel() {
    const user = await checkAuth();
    if (!user || user.role !== 'admin') {
        window.location.href = '/login.html';
        return;
    }
    injectNavbar('admin');
    try {
        const res = await fetch('/api/admin/admin-settings', { credentials: 'include' });
        if (res.ok) {
            const settings = await res.json();
            await loadLanguage(settings.language || 'en');
            if (settings.theme === 'custom' && settings.customColor) {
                applyTheme('custom', settings.customColor);
            } else {
                applyTheme(settings.theme || 'light');
            }
        } else {
            await loadLanguage('en');
            applyTheme('light');
        }
    } catch(e) {
        await loadLanguage('en');
        applyTheme('light');
    }
    loadUnreadCount();
    setInterval(loadUnreadCount, 30000);
}