// hospital-dashboard.js - Complete with working Contact Admin

// ========== CONTACT ADMIN FUNCTION ==========
function contactAdmin() {
    console.log('Contact Admin button clicked');
    // Direct redirect to messages with admin ID (change 1 to your admin ID if different)
    window.location.href = '/messages.html?userId=1';
}

// ========== LOAD DASHBOARD DATA ==========
async function loadHospitalDashboard() {
    const user = await checkAuth();
    if (!user || user.role !== 'hospital') {
        window.location.href = '/login.html';
        return;
    }

    // Set hospital name and photo
    if (user.profile) {
        const hospitalNameElem = document.getElementById('hospitalName');
        if (hospitalNameElem) {
            hospitalNameElem.textContent = user.profile.hospital_name;
        }
        
        const hospitalPhoto = document.getElementById('hospitalPhoto');
        if (hospitalPhoto && user.profile.profile_photo) {
            hospitalPhoto.src = '/' + user.profile.profile_photo;
        }
    }

    // Load all dashboard data
    await loadStatistics();
    await loadRecentJobs();
    await loadNotificationPreview();
}

// ========== LOAD STATISTICS ==========
async function loadStatistics() {
    try {
        // Get jobs count
        const jobsRes = await fetch('/api/jobs/hospital/my-jobs', { credentials: 'include' });
        if (jobsRes.ok) {
            const jobs = await jobsRes.json();
            const activeJobs = jobs.filter(j => j.status === 'open').length;
            const activeJobsElem = document.getElementById('activeJobsCount');
            if (activeJobsElem) activeJobsElem.textContent = activeJobs;
        }

        // Get applications count
        const appsRes = await fetch('/api/applications/hospital/applications', { credentials: 'include' });
        if (appsRes.ok) {
            const apps = await appsRes.json();
            const totalApplicantsElem = document.getElementById('totalApplicantsCount');
            const shortlistedElem = document.getElementById('shortlistedCount');
            const interviewsElem = document.getElementById('interviewsCount');
            
            if (totalApplicantsElem) totalApplicantsElem.textContent = apps.length;
            if (shortlistedElem) shortlistedElem.textContent = apps.filter(a => a.status === 'shortlisted').length;
            if (interviewsElem) interviewsElem.textContent = apps.filter(a => a.status === 'interview_scheduled').length;
        }
    } catch (err) {
        console.error('Failed to load statistics:', err);
    }
}

// ========== LOAD RECENT JOBS ==========
async function loadRecentJobs() {
    try {
        const res = await fetch('/api/jobs/hospital/my-jobs', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch jobs');
        const jobs = await res.json();
        const tbody = document.getElementById('jobsList');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (jobs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No jobs posted yet. <a href="/hospital/post-job.html">Post your first job</a>穷</td></tr>';
            return;
        }
        
        // Show only last 5 jobs
        jobs.slice(0, 5).forEach(job => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${escapeHtml(job.title)}</td>
                <td>${escapeHtml(job.specialty_required)}</td>
                <td>${job.location_type}</td>
                <td>${new Date(job.posted_date).toLocaleDateString()}</td>
                <td>${job.status}</td>
                <td><button onclick="viewJob(${job.id})">View</button></td>
            `;
        });
    } catch (err) {
        console.error('Failed to load recent jobs:', err);
        const tbody = document.getElementById('jobsList');
        if (tbody) tbody.innerHTML = '<tr><td colspan="6">Error loading jobs. Refresh page.穷穷</tr></td>';
    }
}

// ========== VIEW JOB DETAILS ==========
function viewJob(jobId) {
    window.location.href = `/hospital/applicants.html?jobId=${jobId}`;
}

// ========== LOAD NOTIFICATION PREVIEW ==========
async function loadNotificationPreview() {
    try {
        const res = await fetch('/api/notifications', { credentials: 'include' });
        if (res.ok) {
            const notifs = await res.json();
            const unread = notifs.filter(n => !n.is_read).length;
            const previewDiv = document.getElementById('notificationPreview');
            if (previewDiv) {
                previewDiv.innerHTML = unread > 0
                    ? `<strong>🔔 You have ${unread} new notification(s)</strong> <a href="/notifications.html">View all</a>`
                    : '✅ No new notifications';
            }
        }
    } catch (err) {
        console.error('Failed to load notification preview:', err);
    }
}

// ========== HELPER FUNCTIONS ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ========== EVENT LISTENERS ==========
document.addEventListener('DOMContentLoaded', () => {
    const contactBtn = document.getElementById('contactAdminBtn');
    if (contactBtn) {
        contactBtn.addEventListener('click', contactAdmin);
        console.log('Contact Admin button listener attached');
    } else {
        console.warn('Contact Admin button not found in DOM');
    }
});

// ========== INITIALIZE DASHBOARD ==========
loadHospitalDashboard();