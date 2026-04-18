// settings.js – handles loading/saving user settings

function showMessage(msg, type) {
    const msgDiv = document.getElementById('message');
    msgDiv.textContent = msg;
    msgDiv.className = `message ${type}`;
    msgDiv.style.display = 'block';
    setTimeout(() => msgDiv.style.display = 'none', 5000);
}

async function loadUserSettings() {
    try {
        const user = await checkAuth();
        if (user) document.getElementById('emailInput').value = user.email;
        const res = await fetch('/api/settings', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        document.getElementById('languageSelect').value = data.language || 'en';
        document.getElementById('themeSelect').value = data.theme || 'light';
        // apply theme immediately (already applied by initTheme, but ensure consistency)
        applyTheme(data.theme || 'light');
    } catch (err) {
        console.error(err);
        showMessage('Failed to load settings', 'error');
    }
}

async function saveSettings() {
    const language = document.getElementById('languageSelect').value;
    const theme = document.getElementById('themeSelect').value;
    try {
        // Save language
        const langRes = await fetch('/api/settings/language', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ language })
        });
        if (!langRes.ok) throw new Error('Language update failed');
        // Save theme
        const settingsRes = await fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ theme, notifications_enabled: true, email_notifications: true })
        });
        if (!settingsRes.ok) throw new Error('Theme update failed');
        // Apply theme immediately
        applyTheme(theme);
        showMessage('Settings saved! Page will reload to apply language.', 'success');
        setTimeout(() => location.reload(), 1000);
    } catch (err) {
        console.error(err);
        showMessage('Failed to save settings', 'error');
    }
}

async function updateEmail() {
    const email = document.getElementById('emailInput').value;
    if (!email) return showMessage('Email required', 'error');
    try {
        const res = await fetch('/api/settings/email', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email })
        });
        if (res.ok) {
            showMessage('Email updated', 'success');
        } else {
            const err = await res.json();
            showMessage(err.error || 'Failed to update email', 'error');
        }
    } catch (err) {
        showMessage('Network error', 'error');
    }
}

async function updatePassword() {
    const current = document.getElementById('currentPassword').value;
    const newPwd = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;
    if (!current || !newPwd) return showMessage('Fill current and new password', 'error');
    if (newPwd !== confirm) return showMessage('New passwords do not match', 'error');
    if (newPwd.length < 6) return showMessage('Password must be at least 6 characters', 'error');
    try {
        const res = await fetch('/api/settings/password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ currentPassword: current, newPassword: newPwd })
        });
        if (res.ok) {
            showMessage('Password changed', 'success');
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        } else {
            const err = await res.json();
            showMessage(err.error || 'Failed to change password', 'error');
        }
    } catch (err) {
        showMessage('Network error', 'error');
    }
}

document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
document.getElementById('updateEmailBtn').addEventListener('click', updateEmail);
document.getElementById('updatePasswordBtn').addEventListener('click', updatePassword);

// Load settings when page is ready
loadUserSettings();