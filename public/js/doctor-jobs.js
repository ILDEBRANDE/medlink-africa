// doctor-jobs.js – Complete with map, contact, apply, view applicants, and interview details

let currentMap = null;
let currentMarker = null;

async function loadJobs() {
    const user = await checkAuth();
    if (!user || user.role !== 'doctor') {
        window.location.href = '/login.html';
        return;
    }
    injectNavbar('doctor');
    try {
        const res = await fetch('/api/doctor/jobs', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch jobs');
        const jobs = await res.json();
        const container = document.getElementById('jobsList');
        container.innerHTML = '';
        if (jobs.length === 0) {
            container.innerHTML = '<p data-i18n="no_jobs">No jobs available at the moment.</p>';
            applyTranslations();
            return;
        }
        jobs.forEach(job => {
            const card = document.createElement('div');
            card.className = 'feature-card';
            card.style.marginBottom = '20px';
            let statusHtml = '';
            let interviewBtnHtml = '';
            if (job.has_applied) {
                const statusClass = `status-${job.application_status?.replace('_', '-') || 'applied'}`;
                statusHtml = `
                    <div class="application-status-box">
                        <strong data-i18n="your_application_status">Your Application Status:</strong>
                        <span class="${statusClass}">${job.application_status || 'applied'}</span>
                        ${job.rejection_reason ? `<br><strong data-i18n="rejection_reason">Rejection Reason:</strong> ${escapeHtml(job.rejection_reason)}` : ''}
                    </div>
                `;
                if (job.application_status === 'interview_scheduled') {
                    interviewBtnHtml = `<button class="interview-details-btn" onclick="viewInterviewDetails(${job.application_id}, '${escapeHtml(job.title)}')" data-i18n="view_interview_details">📅 View Interview Details</button>`;
                }
            }
            card.innerHTML = `
                <h3>${escapeHtml(job.title)}</h3>
                <p><strong>${escapeHtml(job.hospital_name)}</strong> - ${escapeHtml(job.hospital_location)}</p>
                <p><strong data-i18n="specialty">Specialty:</strong> ${escapeHtml(job.specialty_required)} | <strong data-i18n="location_type">Location:</strong> ${job.location_type}</p>
                <p><strong data-i18n="salary">Salary:</strong> ${job.salary_range || 'Negotiable'}</p>
                <p>${escapeHtml(job.description.substring(0,200))}...</p>
                ${statusHtml}
                <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
                    ${!job.has_applied 
                        ? `<button class="apply-btn" onclick="applyForJob(${job.id})" data-i18n="apply_now">Apply Now</button>
                           <button class="view-applicants-btn" onclick="viewAllApplicants(${job.id}, '${escapeHtml(job.title)}')" data-i18n="view_all_applicants">👥 View All Applicants</button>` 
                        : `<span class="applied-badge" data-i18n="already_applied">✓ Already applied</span>
                           <button class="view-applicants-btn" onclick="viewAllApplicants(${job.id}, '${escapeHtml(job.title)}')" data-i18n="view_all_applicants">👥 View All Applicants</button>`
                    }
                    <button class="map-btn" onclick="showHospitalMap(${job.hospital_id}, '${escapeHtml(job.hospital_name)}')" data-i18n="show_on_map">📍 Show on Map</button>
                    <button class="contact-hospital-btn" onclick="contactHospital(${job.hospital_user_id})" data-i18n="contact_hospital">🏥 Contact Hospital</button>
                    ${interviewBtnHtml}
                </div>
            `;
            container.appendChild(card);
        });
        applyTranslations();
    } catch (err) {
        console.error(err);
        document.getElementById('jobsList').innerHTML = '<p data-i18n="error_loading">Error loading jobs.</p>';
        applyTranslations();
    }
}

async function showHospitalMap(hospitalId, hospitalName) {
    const modal = document.getElementById('mapModal');
    const modalTitle = document.getElementById('modalHospitalName');
    modalTitle.innerText = hospitalName;
    modal.style.display = 'block';
    let lat = -1.9403;
    let lng = 29.8739;
    try {
        const res = await fetch(`/api/hospital/location/${hospitalId}`, { credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            lat = data.lat || -1.9403;
            lng = data.lng || 29.8739;
        }
    } catch (err) { console.error('Map fetch error:', err); }
    setTimeout(() => {
        if (currentMap) currentMap.remove();
        currentMap = L.map('map').setView([lat, lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(currentMap);
        if (currentMarker) currentMarker.remove();
        currentMarker = L.marker([lat, lng]).addTo(currentMap);
    }, 100);
}

function contactHospital(hospitalUserId) {
    if (!hospitalUserId) {
        alert('Hospital contact info not available');
        return;
    }
    window.location.href = `/messages.html?userId=${hospitalUserId}`;
}

async function applyForJob(jobId) {
    try {
        const res = await fetch('/api/applications/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ job_id: jobId })
        });
        if (res.ok) {
            alert('Application submitted!');
            loadJobs();
        } else {
            const err = await res.json();
            alert(err.error || 'Failed to apply');
        }
    } catch(e) { alert('Network error'); }
}

async function viewAllApplicants(jobId, jobTitle) {
    const modal = document.getElementById('applicantsModal');
    const titleElem = document.getElementById('applicantsModalTitle');
    titleElem.innerText = `All Applicants for "${jobTitle}"`;
    modal.style.display = 'block';
    const container = document.getElementById('applicantsListModal');
    container.innerHTML = '<div class="loading">Loading...</div>';
    try {
        const res = await fetch(`/api/doctor/job/${jobId}/applicants`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load');
        const applicants = await res.json();
        container.innerHTML = '';
        if (applicants.length === 0) {
            container.innerHTML = '<p data-i18n="no_applicants">No applicants yet.</p>';
            applyTranslations();
            return;
        }
        applicants.forEach(app => {
            const div = document.createElement('div');
            div.className = 'applicant-card';
            if (app.is_current) {
                div.style.backgroundColor = '#e8f4fd';
                div.style.borderLeft = '4px solid #007bff';
            }
            div.innerHTML = `
                <strong>${escapeHtml(app.full_name)}</strong> ${app.is_current ? '(You)' : ''}<br>
                Specialty: ${escapeHtml(app.specialty)}<br>
                Experience: ${app.experience_years} yrs<br>
                Status: <span class="status-${app.status?.replace('_','-') || 'applied'}">${app.status || 'applied'}</span><br>
                Applied: ${new Date(app.applied_date).toLocaleDateString()}<br>
                ${app.rejection_reason ? `<strong>Rejection Reason:</strong> ${escapeHtml(app.rejection_reason)}<br>` : ''}
                ${!app.is_current ? `<button class="message-btn" onclick="contactDoctor(${app.user_id})" data-i18n="message">💬 Message</button>` : ''}
            `;
            container.appendChild(div);
        });
        applyTranslations();
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p data-i18n="error_loading">Error loading applicants.</p>';
    }
}

async function viewInterviewDetails(applicationId, jobTitle) {
    try {
        const res = await fetch(`/api/doctor/interview/${applicationId}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch interview');
        const data = await res.json();
        alert(`📅 Interview Details for "${jobTitle}":\n\nDate: ${new Date(data.scheduled_datetime).toLocaleString()}\nMeeting Link: ${data.meeting_link || 'Not provided'}\nNotes: ${data.notes || 'No notes'}`);
    } catch (err) {
        alert('Could not load interview details');
    }
}

function contactDoctor(doctorUserId) {
    window.location.href = `/messages.html?userId=${doctorUserId}`;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

document.querySelector('.close')?.addEventListener('click', () => {
    document.getElementById('mapModal').style.display = 'none';
});
document.querySelector('.close-applicants')?.addEventListener('click', () => {
    document.getElementById('applicantsModal').style.display = 'none';
});
window.onclick = (e) => {
    const mapModal = document.getElementById('mapModal');
    const appsModal = document.getElementById('applicantsModal');
    if (e.target === mapModal) mapModal.style.display = 'none';
    if (e.target === appsModal) appsModal.style.display = 'none';
};

loadJobs();