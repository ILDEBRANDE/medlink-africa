// doctor-dashboard.js – Full with Contact Admin functionality

async function loadDashboard() {
    const user = await checkAuth();
    if (!user || user.role !== 'doctor') {
        window.location.href = '/login.html';
        return;
    }
    injectNavbar('doctor');

    // Display doctor name and profile completeness
    if (user.profile) {
        document.getElementById('doctorName').textContent = user.profile.full_name;
        let completed = 0;
        let total = 6;
        if (user.profile.full_name) completed++;
        if (user.profile.specialty) completed++;
        if (user.profile.experience_years > 0) completed++;
        if (user.profile.location_pref) completed++;
        if (user.profile.cv_path) completed++;
        if (user.profile.license_path) completed++;
        const percentage = Math.round((completed / total) * 100);
        document.getElementById('profileComplete').textContent = `${percentage}%`;
    }

    // Load applications
    try {
        const appsRes = await fetch('/api/doctor/applications', { credentials: 'include' });
        if (!appsRes.ok) throw new Error('Failed to fetch applications');
        const applications = await appsRes.json();
        document.getElementById('applicationsCount').textContent = applications.length;
        const interviews = applications.filter(app => app.status === 'interview_scheduled');
        document.getElementById('interviewsCount').textContent = interviews.length;

        const tbody = document.getElementById('applicationsList');
        tbody.innerHTML = '';
        if (applications.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No applications yet.您</td>';
            return;
        }
        applications.forEach(app => {
            const row = tbody.insertRow();
            let rejectionReasonCell = '';
            if (app.status === 'rejected') {
                rejectionReasonCell = `<td>${escapeHtml(app.rejection_reason || 'No reason provided')}</td>`;
            } else {
                rejectionReasonCell = '<td>-</td>';
            }
            row.innerHTML = `
                <td>${escapeHtml(app.title)}</td>
                <td>${escapeHtml(app.hospital_name)}</td>
                <td>${formatDate(app.applied_date)}</td>
                <td><span class="status-${app.status.replace('_', '-')}">${app.status}</span></td>
                ${rejectionReasonCell}
                <td>${app.scheduled_datetime ? formatDate(app.scheduled_datetime) : 'Not scheduled'}</td>
            `;
        });
    } catch (error) {
        console.error('Failed to load applications:', error);
    }

    // Load notification preview
    try {
        const notifRes = await fetch('/api/notifications', { credentials: 'include' });
        if (!notifRes.ok) throw new Error('Failed to fetch notifications');
        const notifications = await notifRes.json();
        const unread = notifications.filter(n => !n.is_read).length;
        const previewDiv = document.getElementById('notificationPreview');
        if (previewDiv) {
            previewDiv.innerHTML = unread > 0
                ? `<strong>🔔 You have ${unread} new notification(s)</strong> <a href="/notifications.html">View all</a>`
                : '✅ No new notifications';
        }
    } catch (error) {
        console.error('Failed to load notifications:', error);
    }
}

// Function to contact admin
async function contactAdmin() {
    try {
        const res = await fetch('/api/admin/admin-id', { credentials: 'include' });
        if (!res.ok) throw new Error('Admin not found');
        const data = await res.json();
        if (data.adminId) {
            window.location.href = `/messages.html?userId=${data.adminId}`;
        } else {
            alert('Admin ID not found');
        }
    } catch (err) {
        console.error(err);
        alert('Could not contact admin. Please try again later.');
    }
}

// Attach event listener when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const contactBtn = document.getElementById('contactAdminBtn');
    if (contactBtn) {
        contactBtn.addEventListener('click', contactAdmin);
    }
});

// Helper functions
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
}

// Start dashboard
loadDashboard();