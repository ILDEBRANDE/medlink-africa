// chat.js – works for admin, doctor, hospital (supports starting new chats)

let currentChatUserId = null;
let currentUserId = null;
let currentUserName = '';

async function loadConversations() {
    try {
        const res = await fetch('/api/messages/conversations', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load');
        const convs = await res.json();
        const list = document.getElementById('conversationList');
        list.innerHTML = '';
        if (convs.length === 0) {
            list.innerHTML = '<div class="loading" data-i18n="no_conversations">No conversations yet. Click "Contact" to start.</div>';
            applyTranslations();
        } else {
            convs.forEach(c => {
                const div = document.createElement('div');
                div.className = 'conversation-item';
                if (currentChatUserId === c.other_user_id) div.classList.add('active');
                div.innerHTML = `<strong>${escapeHtml(c.other_name)}</strong><br><small>${c.last_message ? escapeHtml(c.last_message.substring(0,40)) : 'No messages'}</small>`;
                div.onclick = () => loadChat(c.other_user_id, c.other_name);
                list.appendChild(div);
            });
        }

        // Handle ?userId= from URL (coming from admin panel or contact buttons)
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId');
        if (userId) {
            const existing = convs.find(c => c.other_user_id == userId);
            if (existing) {
                await loadChat(existing.other_user_id, existing.other_name);
            } else {
                // No prior conversation: fetch the user's name and load a new chat
                try {
                    const nameRes = await fetch(`/api/messages/user/${userId}/name`, { credentials: 'include' });
                    if (nameRes.ok) {
                        const nameData = await nameRes.json();
                        await loadChat(parseInt(userId), nameData.name);
                    } else {
                        await loadChat(parseInt(userId), 'User');
                    }
                } catch (e) {
                    await loadChat(parseInt(userId), 'User');
                }
            }
        }
    } catch (err) {
        console.error(err);
        document.getElementById('conversationList').innerHTML = '<div class="error">Error loading conversations.</div>';
    }
}

async function loadChat(userId, userName) {
    if (!userId) return;
    currentChatUserId = userId;
    currentUserName = userName;
    document.getElementById('chatHeader').innerText = `Chat with ${escapeHtml(userName)}`;
    document.getElementById('messagesContainer').innerHTML = '<div class="loading">Loading messages...</div>';
    // ENABLE INPUT IMMEDIATELY (so user can type even before messages load)
    document.getElementById('messageInput').disabled = false;
    document.getElementById('sendBtn').disabled = false;
    document.getElementById('messageInput').focus();
    try {
        const res = await fetch(`/api/messages/${userId}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load');
        const messages = await res.json();
        const container = document.getElementById('messagesContainer');
        container.innerHTML = '';
        if (messages.length === 0) {
            container.innerHTML = '<div class="loading">No messages yet. Send a message!</div>';
        } else {
            messages.forEach(m => {
                const div = document.createElement('div');
                div.className = `message ${m.sender_id === currentUserId ? 'sent' : 'received'}`;
                div.innerHTML = `${escapeHtml(m.message)} ${m.sender_id === currentUserId ? `<button class="delete-msg" onclick="deleteMessage(${m.id})">✖</button>` : ''}`;
                container.appendChild(div);
            });
            container.scrollTop = container.scrollHeight;
        }
        // Highlight active conversation in list (if it exists)
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
            if (item.innerText.includes(userName.substring(0,20))) item.classList.add('active');
        });
    } catch (err) {
        console.error(err);
        document.getElementById('messagesContainer').innerHTML = '<div class="error">Failed to load messages.</div>';
        // Keep input enabled even on error
    }
}

async function sendMessage() {
    const msg = document.getElementById('messageInput').value.trim();
    if (!msg || !currentChatUserId) return;
    document.getElementById('sendBtn').disabled = true;
    document.getElementById('sendBtn').innerText = 'Sending...';
    try {
        const res = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ receiver_id: currentChatUserId, message: msg })
        });
        if (res.ok) {
            document.getElementById('messageInput').value = '';
            await loadChat(currentChatUserId, currentUserName);
        } else {
            const err = await res.json();
            alert(err.error || 'Failed to send');
        }
    } catch (err) {
        alert('Network error');
    } finally {
        document.getElementById('sendBtn').disabled = false;
        document.getElementById('sendBtn').innerText = 'Send';
    }
}

async function deleteMessage(messageId) {
    if (!confirm('Delete this message?')) return;
    try {
        const res = await fetch(`/api/messages/${messageId}`, { method: 'DELETE', credentials: 'include' });
        if (res.ok) {
            await loadChat(currentChatUserId, currentUserName);
        } else {
            alert('Failed to delete');
        }
    } catch (err) {
        alert('Network error');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.getElementById('sendBtn');
    const messageInput = document.getElementById('messageInput');
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (messageInput) messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && sendBtn && !sendBtn.disabled) {
            e.preventDefault();
            sendMessage();
        }
    });
});

// Initialize the page (called from messages.html or here)
(async () => {
    const user = await checkAuth();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }
    currentUserId = user.id;
    injectNavbar(user.role);
    await initI18n();
    await initTheme();
    await loadConversations();
})();