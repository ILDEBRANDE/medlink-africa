async function loadApplicants() {
    const user = await checkAuth();
    if (!user || user.role !== 'hospital') {
        window.location.href = '/login.html';
        return;
    }
    injectNavbar('hospital');

    try {
        const res = await fetch('/api/applications/hospital/applications', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch');
        let apps = await res.json();
        const urlParams = new URLSearchParams(window.location.search);
        const jobId = urlParams.get('jobId');
        if (jobId) apps = apps.filter(a => a.job_id == jobId);
        const tbody = document.getElementById('applicantsList');
        tbody.innerHTML = '';
        if (apps.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">No applicants found.</td></tr>';
            return;
        }
        for (const app of apps) {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${escapeHtml(app.full_name)}</td>
                <td>${escapeHtml(app.specialty)}</td>
                <td>${app.experience_years} yrs</td>
                <td>${escapeHtml(app.job_title)}</td>
                <td><span class="status-${app.status.replace('_', '-')}">${app.status}</span></td>
                <td>
                    <select onchange="updateStatusWithReason(${app.id}, this.value)">
                        <option value="shortlisted" ${app.status === 'shortlisted' ? 'selected' : ''}>Shortlist</option>
                        <option value="rejected" ${app.status === 'rejected' ? 'selected' : ''}>Reject</option>
                        <option value="hired" ${app.status === 'hired' ? 'selected' : ''}>Hire</option>
                        <option value="interview_scheduled" ${app.status === 'interview_scheduled' ? 'selected' : ''}>Schedule Interview</option>
                    </select>
                    ${app.status === 'interview_scheduled' ? `<button onclick="scheduleInterview(${app.id})">Set Date</button>` : ''}
                    <button onclick="downloadFile(${app.doctor_user_id}, 'cv')">CV</button>
                    <button onclick="downloadFile(${app.doctor_user_id}, 'license')">License</button>
                    <button onclick="startChat(${app.doctor_user_id})">💬 Message</button>
                  </td>
            `;
        }
    } catch (error) {
        console.error(error);
        document.getElementById('applicantsList').innerHTML = '<tr><td colspan="7">Error loading applicants. Refresh page.</td></tr>';
    }
}

// Updated status update function with reason prompt for rejection
async function updateStatusWithReason(appId, newStatus) {
    if (newStatus === 'rejected') {
        const reason = prompt('Please provide a reason for rejecting this application:');
        if (!reason) {
            alert('Rejection reason is required.');
            return;
        }
        try {
            const res = await fetch(`/api/applications/${appId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status: newStatus, reason: reason })
            });
            if (res.ok) {
                alert('Application rejected');
                loadApplicants();
            } else {
                const err = await res.json();
                alert(err.error || 'Update failed');
            }
        } catch(e) {
            alert('Network error');
        }
    } else {
        // For other statuses, no reason needed
        try {
            const res = await fetch(`/api/applications/${appId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                alert(`Application ${newStatus}`);
                loadApplicants();
            } else {
                const err = await res.json();
                alert(err.error || 'Update failed');
            }
        } catch(e) {
            alert('Network error');
        }
    }
}

function downloadFile(doctorUserId, fileType) {
    fetch(`/api/doctor/download/${fileType}?doctorId=${doctorUserId}`, {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) return response.json().then(err => { throw new Error(err.error || 'Download failed'); });
        return response.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileType}_${doctorUserId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    })
    .catch(error => {
        console.error(error);
        alert('Failed to download: ' + error.message);
    });
}

function scheduleInterview(appId) {
    const datetime = prompt('Enter interview datetime (YYYY-MM-DD HH:MM:SS)', '2025-01-15 10:00:00');
    if (!datetime) return;
    const meetingLink = prompt('Enter meeting link (optional)', 'https://meet.google.com/xxx');
    fetch('/api/interviews/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ application_id: appId, scheduled_datetime: datetime, meeting_link: meetingLink, notes: '' })
    }).then(res => {
        if (res.ok) {
            alert('Interview scheduled');
            loadApplicants();
        } else alert('Failed to schedule');
    }).catch(() => alert('Error'));
}

function startChat(doctorUserId) {
    window.location.href = `/messages.html?userId=${doctorUserId}`;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

loadApplicants();