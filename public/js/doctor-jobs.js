// doctor-jobs.js – full with map, contact, apply, i18n

let currentMap = null;
let currentMarker = null;

async function loadJobs() {
    const user = await checkAuth();
    if (!user || user.role !== 'doctor') { window.location.href = '/login.html'; return; }
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
            card.innerHTML = `
                <h3>${escapeHtml(job.title)}</h3>
                <p><strong>${escapeHtml(job.hospital_name)}</strong> - ${escapeHtml(job.hospital_location)}</p>
                <p><strong data-i18n="specialty">Specialty:</strong> ${escapeHtml(job.specialty_required)} | <strong data-i18n="location_type">Location:</strong> ${job.location_type}</p>
                <p><strong data-i18n="salary">Salary:</strong> ${job.salary_range || 'Negotiable'}</p>
                <p>${escapeHtml(job.description.substring(0,200))}...</p>
                <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
                    ${!job.has_applied ? `<button class="apply-btn" onclick="applyForJob(${job.id})" data-i18n="apply_now">Apply Now</button>` : `<span class="applied-badge" data-i18n="already_applied">✓ Already applied</span>`}
                    <button class="map-btn" onclick="showHospitalMap(${job.hospital_id}, '${escapeHtml(job.hospital_name)}')" data-i18n="show_on_map">📍 Show on Map</button>
                    <button class="contact-hospital-btn" onclick="contactHospital(${job.hospital_user_id})" data-i18n="contact_hospital">🏥 Contact Hospital</button>
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
    let lat = -1.9403; // default Kigali
    let lng = 29.8739;
    try {
        const res = await fetch(`/api/hospital/location/${hospitalId}`, { credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            lat = data.lat || -1.9403;
            lng = data.lng || 29.8739;
        } else {
            console.warn(`Location fetch failed (${res.status}), using default coordinates`);
        }
    } catch (err) {
        console.error('Map fetch error:', err);
        // fallback to default coordinates
    }
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

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

// Modal close handlers
document.querySelector('.close')?.addEventListener('click', () => {
    document.getElementById('mapModal').style.display = 'none';
});
window.onclick = (e) => {
    const modal = document.getElementById('mapModal');
    if (e.target === modal) modal.style.display = 'none';
};

loadJobs();