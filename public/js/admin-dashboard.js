// admin-dashboard.js - Full version with stats cards working

let allHospitals = [];
let allDoctors = [];
let map = null;
let marker = null;
let currentReportFilter = 'all';
let currentStartDate = '';
let currentEndDate = '';

async function loadAdminDashboard() {
    await loadStats();
    await loadPendingVerifications();
    await loadPendingJobs();
    await loadHospitals();
    await loadDoctors();
    await loadReportsWithFilters();

    document.getElementById('hospitalSearch')?.addEventListener('input', () => filterHospitals());
    document.getElementById('doctorSearch')?.addEventListener('input', () => filterDoctors());
    document.getElementById('exportHospitalsBtn')?.addEventListener('click', () => exportToCSV('hospitals'));
    document.getElementById('exportDoctorsBtn')?.addEventListener('click', () => exportDoctorsToCSV());
}

// ==================== STATS CARDS (WORKING) ====================
async function loadStats() {
    try {
        const res = await fetch('/api/admin/stats', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch stats');
        const stats = await res.json();
        
        document.getElementById('statsContainer').innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>${stats.totalHospitals || 0}</h3>
                    <p>🏥 Total Hospitals</p>
                </div>
                <div class="stat-card">
                    <h3>${stats.totalDoctors || 0}</h3>
                    <p>👨‍⚕️ Total Doctors</p>
                </div>
                <div class="stat-card">
                    <h3>${stats.totalJobs || 0}</h3>
                    <p>💼 Total Jobs</p>
                </div>
                <div class="stat-card">
                    <h3>${stats.pendingVerifications || 0}</h3>
                    <p>⏳ Pending Verifications</p>
                </div>
                <div class="stat-card">
                    <h3>${stats.pendingReports || 0}</h3>
                    <p>📋 Pending Reports</p>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading stats:', error);
        document.getElementById('statsContainer').innerHTML = '<p class="error">Error loading statistics. Please refresh.</p>';
    }
}

// ==================== PENDING VERIFICATIONS ====================
async function loadPendingVerifications() {
    try {
        const res = await fetch('/api/admin/pending-hospitals', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch pending verifications');
        const hospitals = await res.json();
        const container = document.getElementById('verificationsList');
        if (!hospitals || hospitals.length === 0) {
            container.innerHTML = '<div class="card-item"><p>No pending verifications. All hospitals are verified.</p></div>';
            return;
        }
        container.innerHTML = hospitals.map(h => `
            <div class="card-item">
                <h4>${escapeHtml(h.hospital_name)}</h4>
                <p>📍 Location: ${escapeHtml(h.location)} | 📞 Phone: ${h.contact_phone || 'N/A'}</p>
                <p><a href="/api/admin/preview-license/${h.id}" target="_blank">📄 View License</a></p>
                <button class="btn-approve" onclick="verifyHospital(${h.verification_id}, 'approved')">✅ Approve</button>
                <button class="btn-reject" onclick="verifyHospital(${h.verification_id}, 'rejected')">❌ Reject</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading pending verifications:', error);
        document.getElementById('verificationsList').innerHTML = '<div class="card-item"><p>Error loading pending verifications.</p></div>';
    }
}

window.verifyHospital = async function(verificationId, status) {
    let rejection_reason = null;
    if (status === 'rejected') {
        rejection_reason = prompt('Reason for rejection:');
        if (!rejection_reason) return;
    }
    try {
        const res = await fetch(`/api/admin/verify-hospital/${verificationId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status, rejection_reason })
        });
        if (res.ok) {
            alert(`Hospital ${status}`);
            loadPendingVerifications();
            loadStats();
        } else {
            const error = await res.json();
            alert(error.error || 'Failed');
        }
    } catch (error) {
        alert('Network error');
    }
};

// ==================== PENDING JOBS ====================
async function loadPendingJobs() {
    try {
        const res = await fetch('/api/admin/jobs/pending', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch pending jobs');
        const jobs = await res.json();
        const container = document.getElementById('jobsList');
        if (!jobs || jobs.length === 0) {
            container.innerHTML = '<div class="card-item"><p>No pending jobs. All jobs are verified.</p></div>';
            return;
        }
        container.innerHTML = jobs.map(j => `
            <div class="card-item">
                <h4>${escapeHtml(j.title)}</h4>
                <p>🏥 Hospital: ${escapeHtml(j.hospital_name)} | 📅 Posted: ${new Date(j.posted_date).toLocaleDateString()}</p>
                <p>🩺 Specialty: ${j.specialty_required} | 📍 Location: ${j.location_type}</p>
                <button class="btn-verify" onclick="verifyJob(${j.id}, true)">✅ Verify</button>
                <button class="btn-delete" onclick="deleteJob(${j.id})">🗑️ Delete</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading pending jobs:', error);
        document.getElementById('jobsList').innerHTML = '<div class="card-item"><p>Error loading pending jobs.</p></div>';
    }
}

window.verifyJob = async function(jobId, isVerified) {
    try {
        const res = await fetch(`/api/admin/jobs/${jobId}/verify`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ is_verified: isVerified })
        });
        if (res.ok) {
            alert('Job verified');
            loadPendingJobs();
        } else {
            const error = await res.json();
            alert(error.error || 'Failed');
        }
    } catch (error) {
        alert('Network error');
    }
};

window.deleteJob = async function(jobId) {
    if (!confirm('Delete this job? This action cannot be undone.')) return;
    try {
        const res = await fetch(`/api/admin/jobs/${jobId}`, { method: 'DELETE', credentials: 'include' });
        if (res.ok) {
            alert('Job deleted');
            loadPendingJobs();
        } else {
            const error = await res.json();
            alert(error.error || 'Failed');
        }
    } catch (error) {
        alert('Network error');
    }
};

// ==================== HOSPITAL MANAGEMENT ====================
async function loadHospitals() {
    try {
        const res = await fetch('/api/admin/hospitals', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch hospitals');
        allHospitals = await res.json();
        filterHospitals();
    } catch (error) {
        console.error('Error loading hospitals:', error);
        document.getElementById('hospitalsList').innerHTML = '<p>Error loading hospitals.</p>';
    }
}

function filterHospitals() {
    const searchTerm = document.getElementById('hospitalSearch')?.value.toLowerCase() || '';
    const filtered = allHospitals.filter(h => 
        h.hospital_name.toLowerCase().includes(searchTerm) || 
        h.email.toLowerCase().includes(searchTerm)
    );
    renderHospitals(filtered);
}

function renderHospitals(hospitals) {
    const container = document.getElementById('hospitalsList');
    container.innerHTML = '';
    if (hospitals.length === 0) {
        container.innerHTML = '<div class="card-item"><p>No hospitals found.</p></div>';
        return;
    }
    hospitals.forEach(h => {
        const div = document.createElement('div');
        div.className = 'card-item';
        div.innerHTML = `
            <h4>${escapeHtml(h.hospital_name)}</h4>
            <p>📧 Email: ${h.email} | 📍 Location: ${escapeHtml(h.location)}</p>
            <p>🏷️ Status: <span class="status-badge status-${h.verification_status || 'pending'}">${h.verification_status || 'pending'}</span></p>
            <button class="btn-suspend" onclick="suspendHospital(${h.id}, ${!h.suspended})">${h.suspended ? 'Activate' : 'Suspend'}</button>
            <button class="btn-message" onclick="showHospitalDetails(${h.id})">✏️ Edit</button>
            <button class="btn-message" onclick="viewHospitalJobs(${h.id})">📋 Jobs</button>
            <button class="btn-message" onclick="viewHospitalActivity(${h.id})">📊 Activity</button>
            <button class="btn-message" onclick="showHospitalOnMap('${escapeHtml(h.location)}')">🗺️ Show Map</button>
            <button class="btn-export" onclick="downloadHospitalLicense(${h.id}, event)">📄 Download License</button>
            <a href="/api/admin/preview-license/${h.id}" target="_blank" class="btn-export">👁️ Preview License</a>
            <button class="btn-message" onclick="startChat(${h.user_id})">💬 Message</button>
            <button class="btn-reset" onclick="resetUserPassword(${h.user_id})">🔑 Reset Password</button>
        `;
        container.appendChild(div);
    });
}

window.suspendHospital = async function(hospitalId, suspend) {
    try {
        const res = await fetch(`/api/admin/hospitals/${hospitalId}/suspend`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ suspended: suspend })
        });
        if (res.ok) {
            alert(suspend ? 'Hospital suspended' : 'Hospital activated');
            loadHospitals();
        } else {
            const error = await res.json();
            alert(error.error || 'Failed');
        }
    } catch (error) {
        alert('Network error');
    }
};

window.showHospitalDetails = async function(hospitalId) {
    try {
        const res = await fetch(`/api/admin/hospitals/${hospitalId}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch hospital');
        const hospital = await res.json();
        const newName = prompt('Enter new hospital name:', hospital.hospital_name);
        const newLocation = prompt('Enter new location:', hospital.location);
        const newPhone = prompt('Enter new phone:', hospital.contact_phone || '');
        if (newName && newLocation) {
            const updateRes = await fetch(`/api/admin/hospitals/${hospitalId}/update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ hospital_name: newName, location: newLocation, contact_phone: newPhone, description: hospital.description })
            });
            if (updateRes.ok) {
                alert('Hospital updated successfully');
                loadHospitals();
            } else {
                const error = await updateRes.json();
                alert(error.error || 'Update failed');
            }
        }
    } catch (error) {
        alert('Network error');
    }
};

window.viewHospitalJobs = async function(hospitalId) {
    try {
        const res = await fetch(`/api/admin/hospitals/${hospitalId}/jobs`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch jobs');
        const jobs = await res.json();
        if (jobs.length === 0) {
            alert('No jobs posted by this hospital.');
            return;
        }
        let message = '📋 Jobs posted:\n';
        jobs.forEach(j => {
            message += `- ${j.title} (${j.status})\n`;
        });
        alert(message);
    } catch (error) {
        alert('Error loading jobs');
    }
};

window.viewHospitalActivity = async function(hospitalId) {
    try {
        const res = await fetch(`/api/admin/hospitals/${hospitalId}/activity`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch activity');
        const activities = await res.json();
        if (activities.length === 0) {
            alert('No activity found.');
            return;
        }
        let message = '📊 Recent Activity:\n';
        activities.forEach(a => {
            message += `- ${new Date(a.action_date).toLocaleString()}: ${a.details}\n`;
        });
        alert(message);
    } catch (error) {
        alert('Error loading activity');
    }
};

window.downloadHospitalLicense = async function(hospitalId, event) {
    const btn = event?.target;
    try {
        if (btn) {
            btn.textContent = '⏳ Downloading...';
            btn.disabled = true;
        }
        const response = await fetch(`/api/admin/hospital-license/${hospitalId}`, {
            method: 'GET',
            credentials: 'include'
        });
        if (!response.ok) {
            const error = await response.json();
            alert(error.error || 'Failed to download license');
            return;
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hospital_license_${hospitalId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Download error:', error);
        alert('Failed to download license: ' + error.message);
    } finally {
        if (btn) {
            btn.textContent = '📄 Download License';
            btn.disabled = false;
        }
    }
};

// ==================== DOCTOR MANAGEMENT ====================
async function loadDoctors() {
    try {
        const res = await fetch('/api/admin/doctors', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch doctors');
        allDoctors = await res.json();
        filterDoctors();
    } catch (error) {
        console.error('Error loading doctors:', error);
        document.getElementById('doctorsList').innerHTML = '<p>Error loading doctors.</p>';
    }
}

function filterDoctors() {
    const searchTerm = document.getElementById('doctorSearch')?.value.toLowerCase() || '';
    const filtered = allDoctors.filter(d => 
        d.full_name.toLowerCase().includes(searchTerm) || 
        d.email.toLowerCase().includes(searchTerm) ||
        d.specialty.toLowerCase().includes(searchTerm)
    );
    renderDoctors(filtered);
}

function renderDoctors(doctors) {
    const container = document.getElementById('doctorsList');
    container.innerHTML = '';
    if (doctors.length === 0) {
        container.innerHTML = '<div class="card-item"><p>No doctors found.</p></div>';
        return;
    }
    doctors.forEach(d => {
        const div = document.createElement('div');
        div.className = 'card-item';
        div.innerHTML = `
            <h4>👨‍⚕️ ${escapeHtml(d.full_name)}</h4>
            <p>📧 Email: ${d.email} | 🩺 Specialty: ${d.specialty} | ⏱️ Experience: ${d.experience_years} yrs</p>
            <p>📄 <a href="/api/admin/doctor-document/${d.id}/cv" target="_blank" class="btn-export">CV</a> | <a href="/api/admin/doctor-document/${d.id}/license" target="_blank" class="btn-export">License</a></p>
            <button class="btn-message" onclick="showDoctorDetails(${d.id})">✏️ Edit</button>
            <button class="btn-message" onclick="viewDoctorApplications(${d.id})">📋 Applications</button>
            <button class="btn-message" onclick="viewDoctorActivity(${d.id})">📊 Activity</button>
            <button class="btn-delete" onclick="deleteDoctor(${d.id})">Delete Doctor</button>
            <button class="btn-message" onclick="startChat(${d.user_id})">💬 Message</button>
            <button class="btn-reset" onclick="resetUserPassword(${d.user_id})">🔑 Reset Password</button>
        `;
        container.appendChild(div);
    });
}

window.showDoctorDetails = async function(doctorId) {
    try {
        const res = await fetch(`/api/admin/doctors/${doctorId}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch doctor');
        const doctor = await res.json();
        const newName = prompt('Enter new full name:', doctor.full_name);
        const newSpecialty = prompt('Enter new specialty:', doctor.specialty);
        const newExp = prompt('Enter new experience years:', doctor.experience_years);
        const newPhone = prompt('Enter new phone:', doctor.phone || '');
        if (newName && newSpecialty) {
            const updateRes = await fetch(`/api/admin/doctors/${doctorId}/update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                    full_name: newName, 
                    specialty: newSpecialty, 
                    experience_years: parseInt(newExp) || 0, 
                    location_pref: doctor.location_pref,
                    phone: newPhone,
                    bio: doctor.bio
                })
            });
            if (updateRes.ok) {
                alert('Doctor updated successfully');
                loadDoctors();
            } else {
                const error = await updateRes.json();
                alert(error.error || 'Update failed');
            }
        }
    } catch (error) {
        alert('Network error');
    }
};

window.viewDoctorApplications = async function(doctorId) {
    try {
        const res = await fetch(`/api/admin/doctors/${doctorId}/applications`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch applications');
        const apps = await res.json();
        if (apps.length === 0) {
            alert('No applications submitted by this doctor.');
            return;
        }
        let message = '📋 Applications:\n';
        apps.forEach(a => {
            message += `- ${a.job_title} at ${a.hospital_name} (${a.status})\n`;
        });
        alert(message);
    } catch (error) {
        alert('Error loading applications');
    }
};

window.viewDoctorActivity = async function(doctorId) {
    try {
        const res = await fetch(`/api/admin/doctors/${doctorId}/activity`, { 
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) {
            const error = await res.json();
            alert(error.error || 'Failed to load activity');
            return;
        }
        const activities = await res.json();
        if (!activities || activities.length === 0) {
            alert('📋 No activity found for this doctor.');
            return;
        }
        let modalHtml = `
            <div id="activityModal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:10000;display:flex;align-items:center;justify-content:center;">
                <div style="background:white;border-radius:16px;width:700px;max-width:95%;max-height:85%;overflow:auto;padding:20px;box-shadow:0 20px 40px rgba(0,0,0,0.3);">
                    <h3 style="margin-top:0;color:#2c3e50;border-bottom:2px solid #3498db;padding-bottom:10px;">📊 Doctor Activity Log</h3>
                    <div style="max-height:500px;overflow-y:auto;">
                        <table style="width:100%;border-collapse:collapse;">
                            <thead>
                                <tr style="background:#3498db;color:white;position:sticky;top:0;">
                                    <th style="padding:12px;text-align:left;">Date & Time</th>
                                    <th style="padding:12px;text-align:left;">Activity</th>
                                    <th style="padding:12px;text-align:left;">Status</th>
                                </tr>
                            </thead>
                            <tbody>
        `;
        for (const act of activities) {
            let statusBadge = '';
            let actionIcon = '';
            if (act.action_type === 'application') {
                actionIcon = '📝';
                let bgColor = '#95a5a6';
                if (act.status === 'applied') bgColor = '#f0ad4e';
                else if (act.status === 'shortlisted') bgColor = '#5bc0de';
                else if (act.status === 'interview_scheduled') bgColor = '#5cb85c';
                else if (act.status === 'hired') bgColor = '#2ecc71';
                else if (act.status === 'rejected') bgColor = '#d9534f';
                statusBadge = `<span style="background:${bgColor};color:white;padding:4px 12px;border-radius:20px;font-size:11px;display:inline-block;">${act.status || 'N/A'}</span>`;
            } else if (act.action_type === 'interview') {
                actionIcon = '🎯';
                let bgColor = act.interview_status === 'scheduled' ? '#5bc0de' : act.interview_status === 'completed' ? '#2ecc71' : '#95a5a6';
                statusBadge = `<span style="background:${bgColor};color:white;padding:4px 12px;border-radius:20px;font-size:11px;display:inline-block;">${act.interview_status || 'N/A'}</span>`;
            } else {
                actionIcon = '✏️';
                statusBadge = '<span style="color:#666;">—</span>';
            }
            modalHtml += `
                <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:12px;white-space:nowrap;">${new Date(act.action_date).toLocaleString()}</td>
                    <td style="padding:12px;">${actionIcon} ${escapeHtml(act.description)}</td>
                    <td style="padding:12px;">${statusBadge}</td>
                </tr>
            `;
        }
        modalHtml += `
                            </tbody>
                        </table>
                    </div>
                    <div style="margin-top:20px;text-align:center;">
                        <button onclick="closeActivityModal()" style="padding:10px 24px;background:#3498db;color:white;border:none;border-radius:8px;cursor:pointer;">Close</button>
                    </div>
                </div>
            </div>
        `;
        const existingModal = document.getElementById('activityModal');
        if (existingModal) existingModal.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    } catch (error) {
        console.error('Error loading doctor activity:', error);
        alert('Error loading activity. Please try again.');
    }
};

window.closeActivityModal = function() {
    const modal = document.getElementById('activityModal');
    if (modal) modal.remove();
};

window.deleteDoctor = async function(doctorId) {
    if (!confirm('Delete this doctor? This action cannot be undone.')) return;
    try {
        const res = await fetch(`/api/admin/doctors/${doctorId}`, { method: 'DELETE', credentials: 'include' });
        if (res.ok) {
            alert('Doctor deleted');
            loadDoctors();
        } else {
            const error = await res.json();
            alert(error.error || 'Failed');
        }
    } catch (error) {
        alert('Network error');
    }
};

window.resetUserPassword = async function(userId) {
    const newPassword = prompt('Enter new password (minimum 6 characters):');
    if (!newPassword || newPassword.length < 6) return alert('Password must be at least 6 characters');
    try {
        const res = await fetch(`/api/admin/reset-password/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ newPassword })
        });
        if (res.ok) alert('Password reset successfully');
        else {
            const error = await res.json();
            alert(error.error || 'Failed to reset password');
        }
    } catch (error) {
        alert('Network error');
    }
};

window.startChat = function(userId) {
    window.location.href = `/messages.html?userId=${userId}`;
};

// ==================== EXPORT FUNCTIONS ====================
function exportDoctorsToCSV() {
    if (!allDoctors || allDoctors.length === 0) {
        alert('No doctor data to export');
        return;
    }
    const csvData = allDoctors.map(doc => ({
        'ID': doc.id,
        'Full Name': doc.full_name,
        'Email': doc.email,
        'Specialty': doc.specialty,
        'Experience (Years)': doc.experience_years,
        'Location Preference': doc.location_pref,
        'Phone': doc.phone || 'N/A',
        'Bio': (doc.bio || '').substring(0, 100),
        'CV Uploaded': doc.cv_path ? 'Yes' : 'No',
        'License Uploaded': doc.license_path ? 'Yes' : 'No'
    }));
    const headers = Object.keys(csvData[0]);
    const csvRows = [headers.join(',')];
    for (const row of csvData) {
        const values = headers.map(header => {
            let value = row[header] || '';
            value = String(value).replace(/"/g, '""');
            if (value.includes(',') || value.includes('\n') || value.includes('"')) {
                value = `"${value}"`;
            }
            return value;
        });
        csvRows.push(values.join(','));
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doctors_export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert(`✅ Exported ${csvData.length} doctors to CSV`);
}

function exportToCSV(type) {
    if (type === 'hospitals') {
        if (!allHospitals || allHospitals.length === 0) {
            alert('No hospital data to export');
            return;
        }
        const csvData = allHospitals.map(h => ({
            'ID': h.id,
            'Hospital Name': h.hospital_name,
            'Email': h.email,
            'Location': h.location,
            'Phone': h.contact_phone || 'N/A',
            'Status': h.verification_status || 'pending',
            'Suspended': h.suspended ? 'Yes' : 'No'
        }));
        const headers = Object.keys(csvData[0]);
        const csvRows = [headers.join(',')];
        for (const row of csvData) {
            const values = headers.map(header => {
                let value = row[header] || '';
                value = String(value).replace(/"/g, '""');
                if (value.includes(',') || value.includes('\n') || value.includes('"')) {
                    value = `"${value}"`;
                }
                return value;
            });
            csvRows.push(values.join(','));
        }
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hospitals_export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert(`✅ Exported ${csvData.length} hospitals to CSV`);
    }
}

// ==================== REPORTS ====================
async function loadFilteredReports() {
    let url = '/api/admin/filtered-reports?';
    if (currentReportFilter === 'daily' && currentStartDate) {
        url += `type=daily&startDate=${currentStartDate}`;
    } else if (currentReportFilter === 'weekly' && currentStartDate) {
        url += `type=weekly&startDate=${currentStartDate}`;
    } else if (currentReportFilter === 'monthly' && currentStartDate) {
        url += `type=monthly&startDate=${currentStartDate}`;
    } else if (currentStartDate && currentEndDate) {
        url += `startDate=${currentStartDate}&endDate=${currentEndDate}`;
    }
    try {
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch reports');
        const data = await res.json();
        const container = document.getElementById('reportsList');
        if (!container) return;
        const statsHtml = `
            <div style="display:flex; gap:15px; flex-wrap:wrap; margin-bottom:20px; padding:15px; background:#f8f9fa; border-radius:8px;">
                <div><strong>Total:</strong> ${data.stats.total}</div>
                <div><strong>Pending:</strong> <span style="color:#f0ad4e;">${data.stats.pending}</span></div>
                <div><strong>Resolved:</strong> <span style="color:#5cb85c;">${data.stats.resolved}</span></div>
                <div><strong>Dismissed:</strong> <span style="color:#d9534f;">${data.stats.dismissed}</span></div>
                <div><strong>Fake Jobs:</strong> ${data.stats.byType.fake_job}</div>
                <div><strong>Fake Hospitals:</strong> ${data.stats.byType.fake_hospital}</div>
                <div><strong>Inappropriate:</strong> ${data.stats.byType.inappropriate}</div>
            </div>
        `;
        if (!data.reports || data.reports.length === 0) {
            container.innerHTML = statsHtml + '<div class="card-item"><p>No reports found for the selected period.</p></div>';
            return;
        }
        container.innerHTML = statsHtml + data.reports.map(r => `
            <div class="card-item">
                <p><strong>📢 Reporter:</strong> ${escapeHtml(r.reporter_name)}</p>
                <p><strong>⚠️ Reported:</strong> ${escapeHtml(r.reported_name)}</p>
                <p><strong>📌 Type:</strong> ${r.report_type} | <strong>🏷️ Status:</strong> <span class="status-badge status-${r.status}">${r.status}</span></p>
                <p><strong>📝 Description:</strong> ${escapeHtml(r.description || 'No description')}</p>
                <p><strong>📅 Created:</strong> ${new Date(r.created_at).toLocaleString()}</p>
                ${r.status === 'pending' ? `
                    <div style="margin-top:10px;">
                        <button class="btn-approve" onclick="resolveReport(${r.id}, 'resolved')">✅ Resolve</button>
                        <button class="btn-reject" onclick="resolveReport(${r.id}, 'dismissed')">❌ Dismiss</button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading filtered reports:', error);
        const container = document.getElementById('reportsList');
        if (container) container.innerHTML = '<div class="card-item"><p style="color:red;">Error loading reports.</p></div>';
    }
}

window.setReportFilter = function(type) {
    currentReportFilter = type;
    const today = new Date().toISOString().slice(0, 10);
    const pickerDiv = document.getElementById('reportDatePicker');
    if (!pickerDiv) return;
    if (type === 'daily') {
        currentStartDate = today;
        currentEndDate = '';
        pickerDiv.style.display = 'block';
        pickerDiv.innerHTML = `
            <input type="date" id="reportDate" value="${today}" style="padding:8px; margin-right:10px;">
            <button onclick="updateReportDate()" class="btn-verify">Apply</button>
        `;
    } else if (type === 'weekly') {
        const startOfWeek = new Date();
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(startOfWeek.setDate(diff)).toISOString().slice(0, 10);
        currentStartDate = monday;
        currentEndDate = '';
        pickerDiv.style.display = 'block';
        pickerDiv.innerHTML = `
            <input type="week" id="reportWeek" value="${today.slice(0, 4)}-W${Math.ceil(new Date().getDate() / 7)}" style="padding:8px; margin-right:10px;">
            <button onclick="updateReportWeek()" class="btn-verify">Apply</button>
        `;
    } else if (type === 'monthly') {
        currentStartDate = today.slice(0, 7);
        currentEndDate = '';
        pickerDiv.style.display = 'block';
        pickerDiv.innerHTML = `
            <input type="month" id="reportMonth" value="${today.slice(0, 7)}" style="padding:8px; margin-right:10px;">
            <button onclick="updateReportMonth()" class="btn-verify">Apply</button>
        `;
    } else {
        pickerDiv.style.display = 'none';
        currentStartDate = '';
        currentEndDate = '';
    }
    loadFilteredReports();
};

window.updateReportDate = function() {
    const date = document.getElementById('reportDate')?.value;
    if (date) {
        currentStartDate = date;
        loadFilteredReports();
    }
};

window.updateReportWeek = function() {
    const week = document.getElementById('reportWeek')?.value;
    if (week) {
        currentStartDate = week;
        loadFilteredReports();
    }
};

window.updateReportMonth = function() {
    const month = document.getElementById('reportMonth')?.value;
    if (month) {
        currentStartDate = month;
        loadFilteredReports();
    }
};

async function loadReportsWithFilters() {
    const container = document.getElementById('reportsList');
    if (container && !document.getElementById('reportFilters')) {
        container.parentNode.insertAdjacentHTML('afterbegin', `
            <div id="reportFilters" style="margin-bottom:20px;">
                <div class="report-filters">
                    <button onclick="setReportFilter('all')" class="btn-export">📋 All Reports</button>
                    <button onclick="setReportFilter('daily')" class="btn-export">📅 Daily</button>
                    <button onclick="setReportFilter('weekly')" class="btn-export">📆 Weekly</button>
                    <button onclick="setReportFilter('monthly')" class="btn-export">📊 Monthly</button>
                    <button onclick="exportReportsToCSV()" class="btn-export" style="background:#27ae60;">📥 Export CSV</button>
                </div>
                <div id="reportDatePicker" class="date-picker"></div>
            </div>
        `);
    }
    await loadFilteredReports();
}

window.exportReportsToCSV = async function() {
    let url = '/api/admin/export-reports?';
    if (currentReportFilter === 'daily' && currentStartDate) {
        url += `type=daily&startDate=${currentStartDate}`;
    } else if (currentReportFilter === 'weekly' && currentStartDate) {
        url += `type=weekly&startDate=${currentStartDate}`;
    } else if (currentReportFilter === 'monthly' && currentStartDate) {
        url += `type=monthly&startDate=${currentStartDate}`;
    } else if (currentStartDate && currentEndDate) {
        url += `startDate=${currentStartDate}&endDate=${currentEndDate}`;
    }
    try {
        window.location.href = url;
    } catch (error) {
        console.error('Export error:', error);
        alert('Failed to export reports');
    }
};

window.resolveReport = async function(reportId, status) {
    try {
        const res = await fetch(`/api/admin/reports/${reportId}/resolve`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status })
        });
        if (res.ok) {
            alert(`Report ${status}`);
            loadFilteredReports();
        } else {
            const error = await res.json();
            alert(error.error || 'Failed to resolve report');
        }
    } catch (err) {
        alert('Network error');
    }
};

window.createTestReport = async function() {
    try {
        const res = await fetch('/api/admin/test-report', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) {
            alert('Test report created successfully!');
            loadFilteredReports();
        } else {
            const error = await res.json();
            alert(error.error || 'Failed to create test report');
        }
    } catch (err) {
        alert('Network error');
    }
};

// ==================== MAP ====================
function initOpenStreetMap() {
    const mapDiv = document.getElementById('map');
    if (!mapDiv) return;
    if (typeof L !== 'undefined') {
        map = L.map('map').setView([-1.9441, 30.0619], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        marker = L.marker([-1.9441, 30.0619]).addTo(map);
        marker.bindPopup('Location').openPopup();
        return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
        map = L.map('map').setView([-1.9441, 30.0619], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        marker = L.marker([-1.9441, 30.0619]).addTo(map);
        marker.bindPopup('Location').openPopup();
    };
    document.head.appendChild(script);
}

window.showHospitalOnMap = function(location) {
    const mapDiv = document.getElementById('map');
    if (!mapDiv) return;
    mapDiv.style.display = 'block';
    if (!map) {
        initOpenStreetMap();
        setTimeout(() => geocodeAndShow(location), 1000);
    } else {
        geocodeAndShow(location);
    }
};

function geocodeAndShow(location) {
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                map.setView([lat, lon], 14);
                marker.setLatLng([lat, lon]);
                marker.bindPopup(`${location}<br><a href="https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}" target="_blank">View on OpenStreetMap</a>`).openPopup();
            } else {
                alert('Location not found: ' + location);
            }
        })
        .catch(error => {
            console.error('Geocoding error:', error);
            alert('Could not find location: ' + location);
        });
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}