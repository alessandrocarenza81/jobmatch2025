// JobMatch Platform - app.js

// Supabase configuration
const SUPABASE_URL = 'https://cqntluwuhcxovktdcowl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxbnRsdXd1aGN4b3ZrdGRjb3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2Mjk3OTUsImV4cCI6MjA2NTIwNTc5NX0.nuP0c64P9PQ8m-4LIpYs8sY1pGxgFb-PXvFma-_H_dE';

// Global variables
let companies = [];
let candidates = [];
let isSupabaseConnected = false;

// Initialize Supabase client
document.addEventListener('DOMContentLoaded', async () => {
    // Check if Supabase is configured with real credentials
    if (SUPABASE_URL && SUPABASE_URL !== 'YOUR_SUPABASE_URL' && 
        SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
        try {
            // Initialize Supabase client with the global supabase object
            const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            isSupabaseConnected = true;
            console.log('✅ Supabase connected successfully');
            
            // Show dashboard stats
            updateDashboardStats();
            
            // Load data from Supabase
            await loadCompanies();
            await loadCandidates();
        } catch (error) {
            console.error('❌ Supabase connection error:', error);
            isSupabaseConnected = false;
            activateDemoMode();
        }
    } else {
        activateDemoMode();
    }

    // Setup event listeners
    setupEventListeners();
});

// Activate demo mode if Supabase connection fails
function activateDemoMode() {
    console.warn('⚠️ Demo mode active, configure Supabase for persistence');
    // Load from localStorage instead
    companies = JSON.parse(localStorage.getItem('companies') || '[]');
    candidates = JSON.parse(localStorage.getItem('candidates') || '[]');
    updateDashboardStats();
};

// Setup all event listeners
function setupEventListeners() {
    // Add company button
    document.getElementById('add-company-btn').addEventListener('click', () => {
        document.getElementById('company-form').reset();
        document.getElementById('company-modal-title').textContent = 'Add Company';
        document.getElementById('company-form').dataset.mode = 'add';
        document.getElementById('company-form').dataset.id = '';
        $('#company-modal').modal('show');
    });

    // Add candidate button
    document.getElementById('add-candidate-btn').addEventListener('click', () => {
        document.getElementById('candidate-form').reset();
        document.getElementById('candidate-modal-title').textContent = 'Add Candidate';
        document.getElementById('candidate-form').dataset.mode = 'add';
        document.getElementById('candidate-form').dataset.id = '';
        $('#candidate-modal').modal('show');
    });

    // Company form submission
    document.getElementById('company-form').addEventListener('submit', handleCompanySubmit);

    // Candidate form submission
    document.getElementById('candidate-form').addEventListener('submit', handleCandidateSubmit);

    // Search functionality
    document.getElementById('search-input').addEventListener('input', handleSearch);

    // Tab navigation for statistics
    document.querySelectorAll('.nav-link').forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('href');
            
            // Hide all tab contents
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('show', 'active');
            });
            
            // Deactivate all tabs
            document.querySelectorAll('.nav-link').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show the selected tab content
            document.querySelector(target).classList.add('show', 'active');
            
            // Activate the selected tab
            this.classList.add('active');
        });
    });

    // Matching button
    document.getElementById('matching-btn').addEventListener('click', performMatching);
};

// ====================================
// COMPANY FUNCTIONS
// ====================================

// Load companies from Supabase or localStorage
async function loadCompanies() {
    if (isSupabaseConnected) {
        try {
            const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            const { data, error } = await supabase.from('companies').select('*');
            
            if (error) throw error;
            
            companies = data || [];
            displayCompanies();
        } catch (error) {
            console.error('Error loading companies:', error);
        }
    } else {
        displayCompanies();
    }
};

// Display companies in the UI
function displayCompanies() {
    const companiesContainer = document.getElementById('companies-list');
    companiesContainer.innerHTML = '';

    if (companies.length === 0) {
        companiesContainer.innerHTML = '<div class="col-12"><p class="text-center text-muted">No companies found</p></div>';
        return;
    }

    companies.forEach(company => {
        const companyCard = document.createElement('div');
        companyCard.className = 'col-md-6 col-lg-4 mb-4';
        companyCard.innerHTML = `
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${company.nome || ''}</h5>
                    <h6 class="card-subtitle mb-2 text-muted">${company.categoria || ''}</h6>
                    <p class="card-text description">${company.descrizione || ''}</p>
                    <p class="card-text"><strong>Skills:</strong> ${company.competenze || ''}</p>
                </div>
                <div class="card-footer bg-transparent">
                    <button class="btn btn-sm btn-primary edit-company" data-id="${company.id}">Edit</button>
                    <button class="btn btn-sm btn-danger delete-company" data-id="${company.id}">Remove</button>
                </div>
            </div>
        `;
        companiesContainer.appendChild(companyCard);
    });

    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-company').forEach(button => {
        button.addEventListener('click', (e) => editCompany(e.target.dataset.id));
    });

    document.querySelectorAll('.delete-company').forEach(button => {
        button.addEventListener('click', (e) => deleteCompany(e.target.dataset.id));
    });

    // Update dashboard stats
    updateDashboardStats();
};

// Handle company form submission (add or edit)
async function handleCompanySubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const mode = form.dataset.mode;
    const companyId = form.dataset.id;
    
    const company = {
        nome: document.getElementById('company-name').value,
        categoria: document.getElementById('company-category').value,
        descrizione: document.getElementById('company-description').value,
        competenze: document.getElementById('company-skills').value
    };
    
    if (mode === 'add') {
        await addCompany(company);
    } else if (mode === 'edit') {
        await updateCompany(companyId, company);
    }
    
    $('#company-modal').modal('hide');
};

// Add a new company
async function addCompany(company) {
    if (isSupabaseConnected) {
        try {
            const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            const { data, error } = await supabase.from('companies').insert([company]);
            
            if (error) throw error;
            
            await loadCompanies();
        } catch (error) {
            console.error('Error adding company:', error);
        }
    } else {
        // Add in demo mode
        company.id = Date.now().toString();
        companies.push(company);
        localStorage.setItem('companies', JSON.stringify(companies));
        displayCompanies();
    }
};

// Edit a company
function editCompany(id) {
    const company = companies.find(c => c.id.toString() === id.toString());
    if (!company) return;

    document.getElementById('company-name').value = company.nome || '';
    document.getElementById('company-category').value = company.categoria || '';
    document.getElementById('company-description').value = company.descrizione || '';
    document.getElementById('company-skills').value = company.competenze || '';
    
    document.getElementById('company-modal-title').textContent = 'Edit Company';
    document.getElementById('company-form').dataset.mode = 'edit';
    document.getElementById('company-form').dataset.id = id;
    
    $('#company-modal').modal('show');
};

// Update a company
async function updateCompany(id, updatedCompany) {
    if (isSupabaseConnected) {
        try {
            const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            const { data, error } = await supabase
                .from('companies')
                .update(updatedCompany)
                .eq('id', id);
            
            if (error) throw error;
            
            await loadCompanies();
        } catch (error) {
            console.error('Error updating company:', error);
        }
    } else {
        // Update in demo mode
        const index = companies.findIndex(c => c.id.toString() === id.toString());
        if (index !== -1) {
            companies[index] = { ...companies[index], ...updatedCompany };
            localStorage.setItem('companies', JSON.stringify(companies));
            displayCompanies();
        }
    }
};

// Delete a company
async function deleteCompany(id) {
    if (!confirm('Are you sure you want to delete this company?')) return;

    if (isSupabaseConnected) {
        try {
            const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            const { error } = await supabase
                .from('companies')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            
            await loadCompanies();
        } catch (error) {
            console.error('Error deleting company:', error);
        }
    } else {
        // Delete in demo mode
        companies = companies.filter(c => c.id.toString() !== id.toString());
        localStorage.setItem('companies', JSON.stringify(companies));
        displayCompanies();
    }
};

// ====================================
// CANDIDATE FUNCTIONS
// ====================================

// Load candidates from Supabase or localStorage
async function loadCandidates() {
    if (isSupabaseConnected) {
        try {
            const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            const { data, error } = await supabase.from('candidates').select('*');
            
            if (error) throw error;
            
            candidates = data || [];
            displayCandidates();
        } catch (error) {
            console.error('Error loading candidates:', error);
        }
    } else {
        displayCandidates();
    }
};

// Display candidates in the UI
function displayCandidates() {
    const candidatesContainer = document.getElementById('candidates-list');
    candidatesContainer.innerHTML = '';

    if (candidates.length === 0) {
        candidatesContainer.innerHTML = '<div class="col-12"><p class="text-center text-muted">No candidates found</p></div>';
        return;
    }

    candidates.forEach(candidate => {
        const candidateCard = document.createElement('div');
        candidateCard.className = 'col-md-6 col-lg-4 mb-4';
        candidateCard.innerHTML = `
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${candidate.nome || ''}</h5>
                    <p class="card-text"><i class="bi bi-envelope"></i> ${candidate.email || ''}</p>
                    <p class="card-text"><i class="bi bi-telephone"></i> ${candidate.telefono || ''}</p>
                    <p class="card-text"><strong>Skills:</strong> ${candidate.competenze || ''}</p>
                    <p class="card-text"><strong>Experience:</strong> ${candidate.esperienze || ''}</p>
                </div>
                <div class="card-footer bg-transparent">
                    <button class="btn btn-sm btn-primary edit-candidate" data-id="${candidate.id}">Edit</button>
                    <button class="btn btn-sm btn-danger delete-candidate" data-id="${candidate.id}">Remove</button>
                </div>
            </div>
        `;
        candidatesContainer.appendChild(candidateCard);
    });

    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-candidate').forEach(button => {
        button.addEventListener('click', (e) => editCandidate(e.target.dataset.id));
    });

    document.querySelectorAll('.delete-candidate').forEach(button => {
        button.addEventListener('click', (e) => deleteCandidate(e.target.dataset.id));
    });

    // Update dashboard stats
    updateDashboardStats();
};

// Handle candidate form submission (add or edit)
async function handleCandidateSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const mode = form.dataset.mode;
    const candidateId = form.dataset.id;
    
    const candidate = {
        nome: document.getElementById('candidate-name').value,
        email: document.getElementById('candidate-email').value,
        telefono: document.getElementById('candidate-phone').value,
        competenze: document.getElementById('candidate-skills').value,
        esperienze: document.getElementById('candidate-experience').value
    };
    
    if (mode === 'add') {
        await addCandidate(candidate);
    } else if (mode === 'edit') {
        await updateCandidate(candidateId, candidate);
    }
    
    $('#candidate-modal').modal('hide');
};

// Add a new candidate
async function addCandidate(candidate) {
    if (isSupabaseConnected) {
        try {
            const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            const { data, error } = await supabase.from('candidates').insert([candidate]);
            
            if (error) throw error;
            
            await loadCandidates();
        } catch (error) {
            console.error('Error adding candidate:', error);
        }
    } else {
        // Add in demo mode
        candidate.id = Date.now().toString();
        candidates.push(candidate);
        localStorage.setItem('candidates', JSON.stringify(candidates));
        displayCandidates();
    }
};

// Edit a candidate
function editCandidate(id) {
    const candidate = candidates.find(c => c.id.toString() === id.toString());
    if (!candidate) return;

    document.getElementById('candidate-name').value = candidate.nome || '';
    document.getElementById('candidate-email').value = candidate.email || '';
    document.getElementById('candidate-phone').value = candidate.telefono || '';
    document.getElementById('candidate-skills').value = candidate.competenze || '';
    document.getElementById('candidate-experience').value = candidate.esperienze || '';
    
    document.getElementById('candidate-modal-title').textContent = 'Edit Candidate';
    document.getElementById('candidate-form').dataset.mode = 'edit';
    document.getElementById('candidate-form').dataset.id = id;
    
    $('#candidate-modal').modal('show');
};

// Update a candidate
async function updateCandidate(id, updatedCandidate) {
    if (isSupabaseConnected) {
        try {
            const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            const { data, error } = await supabase
                .from('candidates')
                .update(updatedCandidate)
                .eq('id', id);
            
            if (error) throw error;
            
            await loadCandidates();
        } catch (error) {
            console.error('Error updating candidate:', error);
        }
    } else {
        // Update in demo mode
        const index = candidates.findIndex(c => c.id.toString() === id.toString());
        if (index !== -1) {
            candidates[index] = { ...candidates[index], ...updatedCandidate };
            localStorage.setItem('candidates', JSON.stringify(candidates));
            displayCandidates();
        }
    }
};

// Delete a candidate
async function deleteCandidate(id) {
    if (!confirm('Are you sure you want to delete this candidate?')) return;

    if (isSupabaseConnected) {
        try {
            const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            const { error } = await supabase
                .from('candidates')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            
            await loadCandidates();
        } catch (error) {
            console.error('Error deleting candidate:', error);
        }
    } else {
        // Delete in demo mode
        candidates = candidates.filter(c => c.id.toString() !== id.toString());
        localStorage.setItem('candidates', JSON.stringify(candidates));
        displayCandidates();
    }
};

// ====================================
// UTILITY FUNCTIONS
// ====================================

// Update dashboard statistics
function updateDashboardStats() {
    document.getElementById('total-companies').textContent = companies.length;
    document.getElementById('total-candidates').textContent = candidates.length;
};

// Handle search functionality
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    // Filter companies
    const filteredCompanies = companies.filter(company => 
        company.nome?.toLowerCase().includes(searchTerm) || 
        company.categoria?.toLowerCase().includes(searchTerm) || 
        company.descrizione?.toLowerCase().includes(searchTerm) || 
        company.competenze?.toLowerCase().includes(searchTerm)
    );
    
    // Filter candidates
    const filteredCandidates = candidates.filter(candidate => 
        candidate.nome?.toLowerCase().includes(searchTerm) || 
        candidate.email?.toLowerCase().includes(searchTerm) || 
        candidate.competenze?.toLowerCase().includes(searchTerm) || 
        candidate.esperienze?.toLowerCase().includes(searchTerm)
    );
    
    // Display filtered results
    displayFilteredResults(filteredCompanies, filteredCandidates);
};

// Display filtered search results
function displayFilteredResults(filteredCompanies, filteredCandidates) {
    // Display filtered companies
    const companiesContainer = document.getElementById('companies-list');
    companiesContainer.innerHTML = '';

    if (filteredCompanies.length === 0) {
        companiesContainer.innerHTML = '<div class="col-12"><p class="text-center text-muted">No companies found</p></div>';
    } else {
        filteredCompanies.forEach(company => {
            const companyCard = document.createElement('div');
            companyCard.className = 'col-md-6 col-lg-4 mb-4';
            companyCard.innerHTML = `
                <div class="card h-100">
                    <div class="card-body">
                        <h5 class="card-title">${company.nome || ''}</h5>
                        <h6 class="card-subtitle mb-2 text-muted">${company.categoria || ''}</h6>
                        <p class="card-text description">${company.descrizione || ''}</p>
                        <p class="card-text"><strong>Skills:</strong> ${company.competenze || ''}</p>
                    </div>
                    <div class="card-footer bg-transparent">
                        <button class="btn btn-sm btn-primary edit-company" data-id="${company.id}">Edit</button>
                        <button class="btn btn-sm btn-danger delete-company" data-id="${company.id}">Remove</button>
                    </div>
                </div>
            `;
            companiesContainer.appendChild(companyCard);
        });

        // Re-add event listeners to edit and delete buttons
        document.querySelectorAll('.edit-company').forEach(button => {
            button.addEventListener('click', (e) => editCompany(e.target.dataset.id));
        });

        document.querySelectorAll('.delete-company').forEach(button => {
            button.addEventListener('click', (e) => deleteCompany(e.target.dataset.id));
        });
    }

    // Display filtered candidates
    const candidatesContainer = document.getElementById('candidates-list');
    candidatesContainer.innerHTML = '';

    if (filteredCandidates.length === 0) {
        candidatesContainer.innerHTML = '<div class="col-12"><p class="text-center text-muted">No candidates found</p></div>';
    } else {
        filteredCandidates.forEach(candidate => {
            const candidateCard = document.createElement('div');
            candidateCard.className = 'col-md-6 col-lg-4 mb-4';
            candidateCard.innerHTML = `
                <div class="card h-100">
                    <div class="card-body">
                        <h5 class="card-title">${candidate.nome || ''}</h5>
                        <p class="card-text"><i class="bi bi-envelope"></i> ${candidate.email || ''}</p>
                        <p class="card-text"><i class="bi bi-telephone"></i> ${candidate.telefono || ''}</p>
                        <p class="card-text"><strong>Skills:</strong> ${candidate.competenze || ''}</p>
                        <p class="card-text"><strong>Experience:</strong> ${candidate.esperienze || ''}</p>
                    </div>
                    <div class="card-footer bg-transparent">
                        <button class="btn btn-sm btn-primary edit-candidate" data-id="${candidate.id}">Edit</button>
                        <button class="btn btn-sm btn-danger delete-candidate" data-id="${candidate.id}">Remove</button>
                    </div>
                </div>
            `;
            candidatesContainer.appendChild(candidateCard);
        });

        // Re-add event listeners to edit and delete buttons
        document.querySelectorAll('.edit-candidate').forEach(button => {
            button.addEventListener('click', (e) => editCandidate(e.target.dataset.id));
        });

        document.querySelectorAll('.delete-candidate').forEach(button => {
            button.addEventListener('click', (e) => deleteCandidate(e.target.dataset.id));
        });
    }
};

// Perform matching between companies and candidates
function performMatching() {
    const matchingResults = document.getElementById('matching-results');
    matchingResults.innerHTML = '';
    
    if (companies.length === 0 || candidates.length === 0) {
        matchingResults.innerHTML = '<div class="alert alert-warning">Please add both companies and candidates to perform matching.</div>';
        return;
    }
    
    // Create a results table
    const resultTable = document.createElement('table');
    resultTable.className = 'table table-bordered table-hover';
    resultTable.innerHTML = `
        <thead class="thead-light">
            <tr>
                <th>Candidate</th>
                <th>Company</th>
                <th>Match Score</th>
            </tr>
        </thead>
        <tbody id="matching-table-body">
        </tbody>
    `;
    matchingResults.appendChild(resultTable);
    
    const tableBody = document.getElementById('matching-table-body');
    
    // Calculate matching scores
    const matches = [];
    
    candidates.forEach(candidate => {
        companies.forEach(company => {
            const score = calculateMatchScore(candidate, company);
            if (score > 0) {
                matches.push({ candidate, company, score });
            }
        });
    });
    
    // Sort matches by score (descending)
    matches.sort((a, b) => b.score - a.score);
    
    // Display matches
    if (matches.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center">No matches found</td></tr>';
    } else {
        matches.forEach(match => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${match.candidate.nome || ''}</td>
                <td>${match.company.nome || ''}</td>
                <td>${match.score}%</td>
            `;
            tableBody.appendChild(row);
        });
    }
};

// Calculate match score between a candidate and a company
function calculateMatchScore(candidate, company) {
    if (!candidate.competenze || !company.competenze) return 0;
    
    // Split competenze into arrays
    const candidateSkills = candidate.competenze.toLowerCase().split(',').map(skill => skill.trim());
    const companySkills = company.competenze.toLowerCase().split(',').map(skill => skill.trim());
    
    // Find common skills
    const commonSkills = candidateSkills.filter(skill => companySkills.includes(skill));
    
    // Calculate score
    const totalUniqueSkills = new Set([...candidateSkills, ...companySkills]).size;
    const score = Math.round((commonSkills.length / totalUniqueSkills) * 100);
    
    return score;
};