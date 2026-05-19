// doctor-profile.js
async function loadProfile() {
    const user = await checkAuth();
    if (!user || user.role !== 'doctor') { window.location.href = '/login.html'; return; }
    const profile = user.profile;
    document.getElementById('fullName').value = profile.full_name || '';
    document.getElementById('specialty').value = profile.specialty || '';
    document.getElementById('experienceYears').value = profile.experience_years || 0;
    document.getElementById('locationPref').value = profile.location_pref || 'both';
    document.getElementById('salaryExpectation').value = profile.salary_expectation || '';
    document.getElementById('phone').value = profile.phone || '';
    document.getElementById('bio').value = profile.bio || '';
    if (profile.profile_photo) {
        document.getElementById('profilePhotoPreview').src = '/' + profile.profile_photo;
    }
}

document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        full_name: document.getElementById('fullName').value,
        specialty: document.getElementById('specialty').value,
        experience_years: parseInt(document.getElementById('experienceYears').value),
        location_pref: document.getElementById('locationPref').value,
        salary_expectation: document.getElementById('salaryExpectation').value,
        phone: document.getElementById('phone').value,
        bio: document.getElementById('bio').value
    };
    const res = await fetch('/api/doctor/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
    if (res.ok) alert('Profile updated');
    else alert('Update failed');
});

document.getElementById('photoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    const fileInput = document.querySelector('#photoForm input[type="file"]');
    if (!fileInput.files.length) return alert('Select a photo');
    formData.append('photo', fileInput.files[0]);
    const res = await fetch('/api/doctor/upload-photo', { method: 'POST', body: formData, credentials: 'include' });
    if (res.ok) {
        alert('Photo uploaded');
        loadProfile();
    } else alert('Upload failed');
});

document.getElementById('cvForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('cv', document.querySelector('#cvForm input[type="file"]').files[0]);
    const res = await fetch('/api/doctor/upload-cv', { method: 'POST', body: formData, credentials: 'include' });
    if (res.ok) alert('CV uploaded');
    else alert('Upload failed');
});

document.getElementById('licenseForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('license', document.querySelector('#licenseForm input[type="file"]').files[0]);
    const res = await fetch('/api/doctor/upload-license', { method: 'POST', body: formData, credentials: 'include' });
    if (res.ok) alert('License uploaded');
    else alert('Upload failed');
});

loadProfile();