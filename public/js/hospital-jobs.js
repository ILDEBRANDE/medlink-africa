// hospital-jobs.js - Full version with working toggle status

async function loadAllJobs() {
    const user = await checkAuth();
    if (!user || user.role !== 'hospital') {
        window.location.href = '/login.html';
        return;
    }
    injectNavbar('hospital');

    try {
        const res = await fetch('/api/jobs/hospital/my-jobs', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch jobs');
        const jobs = await res.json();
        const tbody = document.getElementById('allJobsList');
        tbody.innerHTML = '';
        
        if (jobs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No jobs posted yet. <a href="/hospital/post-job.html">Post your first job</a></td></tr>';
            return;
        }

        jobs.forEach(job => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${escapeHtml(job.title)}</td>
                <td>${escapeHtml(job.specialty_required)}</td>
                <td>${escapeHtml(job.location_type)}</td>
                <td>${escapeHtml(job.salary_range || 'N/A')}</td>
                <td><span class="status-${job.status}">${job.status}</span></td>
                <td>
                    <button class="btn-toggle" data-job-id="${job.id}" data-current-status="${job.status}">
                        ${job.status === 'open' ? 'Close' : 'Open'}
                    </button>
                    <button class="btn-delete" data-job-id="${job.id}">Delete</button>
                    <button class="btn-matches" data-job-id="${job.id}">View Matches</button>
                 </td>
            `;
        });

        // Attach event listeners to dynamically created buttons
        document.querySelectorAll('.btn-toggle').forEach(btn => {
            btn.addEventListener('click', () => toggleJobStatus(btn.dataset.jobId, btn.dataset.currentStatus));
        });
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => deleteJob(btn.dataset.jobId));
        });
        document.querySelectorAll('.btn-matches').forEach(btn => {
            btn.addEventListener('click', () => viewMatchedDoctors(btn.dataset.jobId));
        });
    } catch (error) {
        console.error('Failed to load jobs:', error);
        document.getElementById('allJobsList').innerHTML = '<tr><td colspan="6">Error loading jobs. Please refresh.</td></tr>';
    }
}

async function toggleJobStatus(jobId, currentStatus) {
    const newStatus = currentStatus === 'open' ? 'closed' : 'open';
    try {
        // First get current job details to keep other fields unchanged
        const getRes = await fetch(`/api/jobs/${jobId}`, { credentials: 'include' });
        if (!getRes.ok) throw new Error('Failed to fetch job details');
        const job = await getRes.json();
        
        const updateRes = await fetch(`/api/jobs/${jobId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                title: job.title,
                description: job.description,
                specialty_required: job.specialty_required,
                location_type: job.location_type,
                salary_range: job.salary_range,
                status: newStatus
            })
        });
        if (updateRes.ok) {
            alert(`Job ${newStatus === 'open' ? 'opened' : 'closed'} successfully`);
            loadAllJobs(); // Refresh table
        } else {
            const error = await updateRes.json();
            alert(error.error || 'Failed to update status');
        }
    } catch (error) {
        console.error('Toggle status error:', error);
        alert('Network error. Please try again.');
    }
}

async function deleteJob(jobId) {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) return;
    try {
        const res = await fetch(`/api/jobs/${jobId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (res.ok) {
            alert('Job deleted successfully');
            loadAllJobs();
        } else {
            const error = await res.json();
            alert(error.error || 'Failed to delete job');
        }
    } catch (error) {
        alert('Network error. Please try again.');
    }
}

function viewMatchedDoctors(jobId) {
    window.location.href = `/hospital/matched-doctors.html?jobId=${jobId}`;
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

loadAllJobs();