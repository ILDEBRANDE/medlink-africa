// chat.js - Messaging logic for all users (doctor, hospital, admin)

let currentChatUserId = null;
let currentUserId = null;
let currentUserName = '';

async function loadConversations() {
    try {
        const res = await fetch('/api/messages/conversations', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load conversations');
        const convs = await res.json();
        const list = document.getElementById('conversationList');
        list.innerHTML = '';
        
        if (convs.length === 0) {
            list.innerHTML = '<div class="loading">No conversations yet. Click "Contact" to start.</div>';
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

        // Handle ?userId= from URL (coming from contact buttons)
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId');
        
        if (userId) {
            const existing = convs.find(c => c.other_user_id == userId);
            if (existing) {
                await loadChat(existing.other_user_id, existing.other_name);
            } else {
                // Try to get user name
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
        console.error('Load conversations error:', err);
        document.getElementById('conversationList').innerHTML = '<div class="error">Error loading conversations.</div>';
    }
}

async function loadChat(userId, userName) {
    if (!userId) return;
    currentChatUserId = userId;
    currentUserName = userName;
    
    const chatHeader = document.getElementById('chatHeader');
    const messagesContainer = document.getElementById('messagesContainer');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    
    if (chatHeader) chatHeader.innerText = `Chat with ${escapeHtml(userName)}`;
    if (messagesContainer) messagesContainer.innerHTML = '<div class="loading">Loading messages...</div>';
    
    // ENABLE INPUT IMMEDIATELY
    if (messageInput) {
        messageInput.disabled = false;
        messageInput.value = '';
        messageInput.focus();
    }
    if (sendBtn) sendBtn.disabled = false;
    
    try {
        const res = await fetch(`/api/messages/${userId}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load messages');
        const messages = await res.json();
        
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
            
            if (messages.length === 0) {
                messagesContainer.innerHTML = '<div class="loading">No messages yet. Send a message!</div>';
            } else {
                messages.forEach(m => {
                    const div = document.createElement('div');
                    div.className = `message ${m.sender_id === currentUserId ? 'sent' : 'received'}`;
                    div.innerHTML = `${escapeHtml(m.message)} ${m.sender_id === currentUserId ? `<button class="delete-msg" onclick="deleteMessage(${m.id})">✖</button>` : ''}`;
                    messagesContainer.appendChild(div);
                });
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }
        
        // Highlight active conversation
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
            if (item.innerText.includes(userName.substring(0,20))) item.classList.add('active');
        });
    } catch (err) {
        console.error('Load chat error:', err);
        if (messagesContainer) messagesContainer.innerHTML = '<div class="error">Failed to load messages.</div>';
    }
}

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    
    if (!messageInput || !sendBtn) return;
    
    const msg = messageInput.value.trim();
    if (!msg || !currentChatUserId) return;
    
    sendBtn.disabled = true;
    const originalText = sendBtn.innerText;
    sendBtn.innerText = 'Sending...';
    
    try {
        const res = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ receiver_id: currentChatUserId, message: msg })
        });
        
        if (res.ok) {
            messageInput.value = '';
            await loadChat(currentChatUserId, currentUserName);
        } else {
            const err = await res.json();
            alert(err.error || 'Failed to send');
        }
    } catch (err) {
        console.error('Send message error:', err);
        alert('Network error');
    } finally {
        sendBtn.disabled = false;
        sendBtn.innerText = originalText;
        if (messageInput) messageInput.focus();
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

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Set up event listeners
document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.getElementById('sendBtn');
    const messageInput = document.getElementById('messageInput');
    
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            const btn = document.getElementById('sendBtn');
            if (e.key === 'Enter' && btn && !btn.disabled) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
});

// Initialize the messages page
(async () => {
    try {
        const user = await checkAuth();
        if (!user) {
            window.location.href = '/login.html';
            return;
        }
        currentUserId = user.id;
        
        if (typeof injectNavbar === 'function') injectNavbar(user.role);
        if (typeof initI18n === 'function') await initI18n();
        if (typeof initTheme === 'function') await initTheme();
        
        await loadConversations();
    } catch (err) {
        console.error('Chat initialization error:', err);
        const container = document.getElementById('conversationList');
        if (container) {
            container.innerHTML = '<div class="error">Failed to initialize chat. Please refresh.</div>';
        }
    }
})();