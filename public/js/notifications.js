// notifications.js - Notifications page logic (Fixed)

async function loadNotifications() {
    const container = document.getElementById('notifList');
    if (!container) return;
    
    container.innerHTML = '<div class="empty-message">Loading...</div>';
    
    try {
        const res = await fetch('/api/notifications', { credentials: 'include' });
        
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        }
        
        const notifs = await res.json();
        
        container.innerHTML = '';
        
        if (!notifs || notifs.length === 0) {
            container.innerHTML = '<div class="empty-message" data-i18n="no_notifications">No notifications</div>';
            if (typeof applyTranslations === 'function') applyTranslations();
            return;
        }
        
        notifs.forEach(notif => {
            const div = document.createElement('div');
            div.className = `notif-item ${!notif.is_read ? 'unread' : ''}`;
            div.innerHTML = `
                <div class="notif-content">
                    <div class="notif-title">${escapeHtml(notif.title)}</div>
                    <div class="notif-message">${escapeHtml(notif.message)}</div>
                    <div class="notif-time">${new Date(notif.created_at).toLocaleString()}</div>
                </div>
                <button class="delete-notif" data-id="${notif.id}" data-i18n="delete">Delete</button>
            `;
            container.appendChild(div);
            
            // Mark as read automatically when displayed
            if (!notif.is_read) {
                fetch(`/api/notifications/${notif.id}/read`, { method: 'PUT', credentials: 'include' })
                    .catch(err => console.error('Mark read error:', err));
            }
        });
        
        // Add delete event listeners
        document.querySelectorAll('.delete-notif').forEach(btn => {
            btn.removeEventListener('click', handleDeleteClick);
            btn.addEventListener('click', handleDeleteClick);
        });
        
        if (typeof applyTranslations === 'function') applyTranslations();
    } catch(err) {
        console.error('Load notifications error:', err);
        container.innerHTML = `<div class="empty-message">Error loading notifications: ${err.message}</div>`;
    }
}

function handleDeleteClick(event) {
    const btn = event.currentTarget;
    const notifId = btn.getAttribute('data-id');
    deleteNotification(notifId);
}

async function deleteNotification(notifId) {
    if (!confirm('Delete this notification?')) return;
    try {
        const res = await fetch(`/api/notifications/${notifId}`, { method: 'DELETE', credentials: 'include' });
        if (res.ok) {
            loadNotifications();
        } else {
            const err = await res.json();
            alert(err.error || 'Failed to delete');
        }
    } catch(err) {
        console.error('Delete error:', err);
        alert('Network error');
    }
}

async function markAllAsRead() {
    try {
        const res = await fetch('/api/notifications', { credentials: 'include' });
        const notifs = await res.json();
        for (const notif of notifs) {
            if (!notif.is_read) {
                await fetch(`/api/notifications/${notif.id}/read`, { method: 'PUT', credentials: 'include' });
            }
        }
        loadNotifications();
    } catch(err) {
        console.error('Mark all as read error:', err);
        alert('Failed to mark all as read');
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    const markAllBtn = document.getElementById('markAllReadBtn');
    if (markAllBtn) {
        markAllBtn.removeEventListener('click', markAllAsRead);
        markAllBtn.addEventListener('click', markAllAsRead);
    }
});

// Initialize page
(async () => {
    try {
        const user = await checkAuth();
        if (!user) {
            window.location.href = '/login.html';
            return;
        }
        if (typeof injectNavbar === 'function') injectNavbar(user.role);
        if (typeof initI18n === 'function') await initI18n();
        if (typeof initTheme === 'function') await initTheme();
        await loadNotifications();
    } catch(err) {
        console.error('Initialization error:', err);
        const container = document.getElementById('notifList');
        if (container) {
            container.innerHTML = '<div class="empty-message">Failed to initialize. Please refresh the page.</div>';
        }
    }
})();