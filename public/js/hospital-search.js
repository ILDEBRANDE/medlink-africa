// hospital-search.js – Full version with search, filters, and contact button

// Helper to escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Perform doctor search based on filter inputs
async function searchDoctors() {
    const specialty = document.getElementById('searchSpecialty').value.trim();
    const location_pref = document.getElementById('searchLocationPref').value;
    const min_experience = document.getElementById('searchMinExp').value;

    let url = '/api/hospital/search-doctors?';
    if (specialty) url += `specialty=${encodeURIComponent(specialty)}&`;
    if (location_pref) url += `location_pref=${location_pref}&`;
    if (min_experience) url += `min_experience=${parseInt(min_experience)}&`;

    try {
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const doctors = await res.json();
        const tbody = document.getElementById('doctorsList');
        tbody.innerHTML = '';

        if (doctors.length === 0) {
            tbody.innerHTML = `<td><td colspan="6" data-i18n="no_doctors_found">No doctors found.</td></tr>`;
            if (typeof applyTranslations === 'function') applyTranslations();
            return;
        }

        doctors.forEach(doc => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${escapeHtml(doc.full_name)}</td>
                <td>${escapeHtml(doc.specialty)}</td>
                <td>${doc.experience_years} yrs</td>
                <td>${doc.location_pref}</td>
                <td>${escapeHtml(doc.phone || 'N/A')}</td>
                <td><button class="btn-contact" onclick="contactDoctor(${doc.user_id})" data-i18n="contact">💬 Contact</button></td>
            `;
        });
        if (typeof applyTranslations === 'function') applyTranslations();
    } catch (error) {
        console.error('Search error:', error);
        document.getElementById('doctorsList').innerHTML = '<tr><td colspan="6">Error searching doctors. Please try again.</td></tr>';
    }
}

// Redirect to messages page with the selected doctor's user ID
function contactDoctor(doctorUserId) {
    window.location.href = `/messages.html?userId=${doctorUserId}`;
}

// Initialize search page
async function initSearchPage() {
    const user = await checkAuth();
    if (!user || user.role !== 'hospital') {
        window.location.href = '/login.html';
        return;
    }
    injectNavbar('hospital');
    if (typeof initI18n === 'function') await initI18n();
    await searchDoctors(); // initial load
}

// Attach event listener to search button
document.getElementById('searchBtn').addEventListener('click', searchDoctors);

// Start the page
initSearchPage();