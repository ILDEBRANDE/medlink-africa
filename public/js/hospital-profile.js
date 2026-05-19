// hospital-profile.js
async function loadProfile() {
    const user = await checkAuth();
    if (!user || user.role !== 'hospital') { window.location.href = '/login.html'; return; }
    const profile = user.profile;
    document.getElementById('hospitalName').value = profile.hospital_name || '';
    document.getElementById('location').value = profile.location || '';
    document.getElementById('contactPhone').value = profile.contact_phone || '';
    document.getElementById('description').value = profile.description || '';
    if (profile.profile_photo) {
        document.getElementById('profilePhotoPreview').src = '/' + profile.profile_photo;
    }
}

document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        hospital_name: document.getElementById('hospitalName').value,
        location: document.getElementById('location').value,
        contact_phone: document.getElementById('contactPhone').value,
        description: document.getElementById('description').value
    };
    const res = await fetch('/api/hospital/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
    if (res.ok) alert('Profile updated');
    else alert('Update failed');
});

document.getElementById('photoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('photo', document.querySelector('#photoForm input[type="file"]').files[0]);
    const res = await fetch('/api/hospital/upload-photo', { method: 'POST', body: formData, credentials: 'include' });
    if (res.ok) {
        alert('Photo uploaded');
        loadProfile();
    } else alert('Upload failed');
});

loadProfile();