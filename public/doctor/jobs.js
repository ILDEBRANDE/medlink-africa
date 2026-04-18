async function loadJobs() {
    const user = await checkAuth();
    if (!user || user.role !== 'doctor') {
        window.location.href = '/login.html';
        return;
    }
    injectNavbar('doctor');

    try {
        const response = await fetch('/api/doctor/jobs', { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to fetch jobs');
        const jobs = await response.json();
        const container = document.getElementById('jobsList');
        container.innerHTML = '';

        if (jobs.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:50px;" data-i18n="no_jobs">No jobs available.</p>';
            return;
        }

        jobs.forEach(job => {
            const card = document.createElement('div');
            card.className = 'feature-card';
            card.style.marginBottom = '20px';
            card.innerHTML = `
                <h3>${escapeHtml(job.title)}</h3>
                <p><strong>${escapeHtml(job.hospital_name)}</strong> - ${escapeHtml(job.hospital_location)}</p>
                <p><strong data-i18n="specialty">Specialty:</strong> ${escapeHtml(job.specialty_required)} | <strong data-i18n="location_type">Location:</strong> ${job.location_type}</p>
                <p><strong data-i18n="salary">Salary:</strong> ${job.salary_range || 'Negotiable'}</p>
                <p>${escapeHtml(job.description.substring(0, 200))}...</p>
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    ${!job.has_applied ? `<button class="apply-btn" onclick="applyForJob(${job.id})" data-i18n="apply_now">Apply Now</button>` : `<span class="applied-badge" data-i18n="already_applied">✓ Already applied</span>`}
                    <button class="contact-hospital-btn" onclick="contactHospital(${job.hospital_user_id})" data-i18n="contact_hospital">🏥 Contact Hospital</button>
                </div>
            `;
            container.appendChild(card);
        });
        applyTranslations();
    } catch (error) {
        console.error(error);
        document.getElementById('jobsList').innerHTML = '<p style="color:red; text-align:center;" data-i18n="error_loading">Error loading jobs.</p>';
    }
}

function contactHospital(hospitalUserId) {
    window.location.href = `/messages.html?userId=${hospitalUserId}`;
}

async function applyForJob(jobId) {
    try {
        const response = await fetch('/api/applications/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ job_id: jobId })
        });
        if (response.ok) {
            alert('Application submitted!');
            loadJobs();
        } else {
            const err = await response.json();
            alert(err.error || 'Failed to apply');
        }
    } catch(e) { alert('Network error'); }
}

function escapeHtml(str) { /* same as before */ }

loadJobs();