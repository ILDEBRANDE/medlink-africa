// hospital-dashboard.js - Full version

async function loadHospitalDashboard() {
    const user = await checkAuth();
    if (!user || user.role !== 'hospital') {
        window.location.href = '/login.html';
        return;
    }
    injectNavbar('hospital');
    await initI18n();

    if (user.profile) {
        document.getElementById('hospitalName').textContent = user.profile.hospital_name;
    }

    try {
        // Load jobs
        const jobsRes = await fetch('/api/jobs/hospital/my-jobs', { credentials: 'include' });
        const jobs = await jobsRes.json();
        document.getElementById('activeJobs').textContent = jobs.filter(j => j.status === 'open').length;

        // Load applicants
        const appsRes = await fetch('/api/applications/hospital/applications', { credentials: 'include' });
        const apps = await appsRes.json();
        document.getElementById('totalApplicants').textContent = apps.length;
        document.getElementById('shortlistedCount').textContent = apps.filter(a => a.status === 'shortlisted').length;

        // Display recent jobs
        const tbody = document.getElementById('jobsList');
        tbody.innerHTML = '';
        if (jobs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No jobs posted yet.</td></tr>';
            return;
        }
        jobs.slice(0, 5).forEach(job => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${escapeHtml(job.title)}</td>
                <td>${escapeHtml(job.specialty_required)}</td>
                <td>${escapeHtml(job.location_type)}</td>
                <td>${formatDate(job.posted_date)}</td>
                <td><span class="status-${job.status}">${job.status}</span></td>
                <td>
                    <button onclick="viewJobApplicants(${job.id})">View Applicants</button>
                    <button onclick="viewMatchedDoctors(${job.id})">Matches</button>
                </td>
            `;
        });
    } catch (error) {
        console.error('Failed to load dashboard:', error);
        document.getElementById('jobsList').innerHTML = '<tr><td colspan="6" style="color:red;">Error loading data.</td></tr>';
    }

    // Load notifications preview
    try {
        const notifRes = await fetch('/api/notifications', { credentials: 'include' });
        const notifs = await notifRes.json();
        const unread = notifs.filter(n => !n.is_read).length;
        const previewDiv = document.getElementById('hospitalNotificationPreview');
        if (previewDiv) {
            if (unread > 0) {
                previewDiv.innerHTML = `<strong>🔔 You have ${unread} new notification(s)</strong> <a href="/notifications.html">View all</a>`;
            } else {
                previewDiv.innerHTML = '✅ No new notifications';
            }
        }
    } catch (error) {
        console.error('Failed to load notifications preview:', error);
    }
}

function viewJobApplicants(jobId) {
    window.location.href = `/hospital/applicants.html?jobId=${jobId}`;
}

function viewMatchedDoctors(jobId) {
    window.location.href = `/hospital/matched-doctors.html?jobId=${jobId}`;
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

loadHospitalDashboard();