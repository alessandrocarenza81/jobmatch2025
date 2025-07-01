// JobMatch Platform - app.js Completo Aggiornato

// Configurazione Supabase
const SUPABASE_URL = 'https://cqntluwuhcxovktdcowl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxbnRsdXd1aGN4b3ZrdGRjb3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2Mjk3OTUsImV4cCI6MjA2NTIwNTc5NX0.nuP0c64P9PQ8m-4LIpYs8sY1pGxgFb-PXvFma-_H_dE';

// Variabili globali
let companies = [];
let candidates = [];
let isSupabaseConnected = false;
let supabase;

// Inizializza client Supabase
document.addEventListener('DOMContentLoaded', async () => {
    // Verifica se Supabase è configurato con credenziali reali
    if (SUPABASE_URL && SUPABASE_URL !== 'YOUR_SUPABASE_URL' && 
        SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
        try {
            // Inizializza client Supabase
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            isSupabaseConnected = true;
            console.log('✅ Connessione a Supabase riuscita');
            
            // Carica dati da Supabase
            await loadCompanies();
            await loadCandidates();
        } catch (error) {
            console.error('❌ Errore di connessione a Supabase:', error);
            isSupabaseConnected = false;
            activateDemoMode();
        }
    } else {
        activateDemoMode();
    }
    
    // Aggiorna statistiche dashboard
    updateDashboardStats();
    
    // Configura event listeners
    setupEventListeners();
});

// Attiva modalità demo se la connessione a Supabase fallisce
function activateDemoMode() {
    console.warn('⚠️ Modalità demo attiva, configura Supabase per la persistenza');
    // Carica da localStorage invece
    companies = JSON.parse(localStorage.getItem('companies') || '[]');
    candidates = JSON.parse(localStorage.getItem('candidates') || '[]');
}

// Configura tutti gli event listeners
function setupEventListeners() {
    // Form handlers
    const companyForm = document.getElementById('companyForm');
    const candidateForm = document.getElementById('candidateForm');
    
    if (companyForm) {
        companyForm.addEventListener('submit', saveCompany);
    }
    
    if (candidateForm) {
        candidateForm.addEventListener('submit', saveCandidate);
    }
    
    // Search handlers
    const globalSearch = document.getElementById('global-search');
    const categoryFilter = document.getElementById('category-filter');
    const typeFilter = document.getElementById('type-filter');
    
    if (globalSearch) {
        globalSearch.addEventListener('input', performGlobalSearch);
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', performGlobalSearch);
    }
    
    if (typeFilter) {
        typeFilter.addEventListener('change', performGlobalSearch);
    }
}

// ====================================
// FUNZIONI NAVIGAZIONE
// ====================================

function navigateToPage(pageId) {
    // Nascondi tutte le sezioni
    document.querySelectorAll('.page-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Mostra la sezione selezionata
    const selectedPage = document.getElementById(pageId + '-section');
    if (selectedPage) {
        selectedPage.style.display = 'block';
    }
    
    // Aggiorna lo stato attivo dei bottoni di navigazione
    document.querySelectorAll('[onclick*="navigateToPage"]').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Carica i dati per la pagina selezionata
    if (pageId === 'companies') {
        displayCompanies();
    } else if (pageId === 'candidates') {
        displayCandidates();
    } else if (pageId === 'dashboard') {
        updateDashboardStats();
        // Nascondi i risultati di ricerca quando si torna alla dashboard
        const searchResults = document.getElementById('search-results-container');
        if (searchResults) {
            searchResults.style.display = 'none';
        }
    }
}

// ====================================
// FUNZIONI AZIENDE
// ====================================

// Carica aziende da Supabase o localStorage
async function loadCompanies() {
    if (isSupabaseConnected) {
        try {
            const { data, error } = await supabase.from('companies').select('*');
            if (error) throw error;
            companies = data || [];
        } catch (error) {
            console.error('Errore nel caricamento delle aziende:', error);
        }
    }
}

// Mostra il modal per aggiungere/modificare un'azienda
function showCompanyForm() {
    // Reset del form
    document.getElementById('companyForm').reset();
    document.getElementById('company-id').value = '';
    
    // Mostra il modal
    const companyModal = new bootstrap.Modal(document.getElementById('companyModal'));
    companyModal.show();
}

// Modifica un'azienda esistente
function editCompany(companyId) {
    const company = companies.find(c => c.id.toString() === companyId.toString());
    if (company) {
        // Pre-popola il form con i dati dell'azienda
        document.getElementById('company-id').value = company.id;
        document.getElementById('company-name').value = company.nome || '';
        document.getElementById('company-description').value = company.descrizione || '';
        document.getElementById('company-skills').value = company.competenze || '';
        document.getElementById('company-category').value = company.categoria || '';
        document.getElementById('company-location').value = company.sede || '';
        
        // Mostra il modal
        const companyModal = new bootstrap.Modal(document.getElementById('companyModal'));
        companyModal.show();
    }
}

// Salva un'azienda (nuova o modificata)
async function saveCompany(event) {
    event.preventDefault();
    
    const companyData = {
        nome: document.getElementById('company-name').value.trim(),
        descrizione: document.getElementById('company-description').value.trim(),
        competenze: document.getElementById('company-skills').value.trim(),
        categoria: document.getElementById('company-category').value,
        sede: document.getElementById('company-location').value.trim()
    };
    
    const companyId = document.getElementById('company-id').value;
    
    try {
        if (isSupabaseConnected) {
            if (companyId) {
                // Aggiorna azienda esistente
                const { error } = await supabase
                    .from('companies')
                    .update(companyData)
                    .eq('id', companyId);
                if (error) throw error;
            } else {
                // Inserisci nuova azienda
                const { error } = await supabase
                    .from('companies')
                    .insert([companyData]);
                if (error) throw error;
            }
        } else {
            // Modalità demo - salva in localStorage
            if (companyId) {
                const index = companies.findIndex(c => c.id.toString() === companyId);
                if (index !== -1) {
                    companies[index] = { ...companies[index], ...companyData };
                }
            } else {
                companyData.id = Date.now();
                companies.push(companyData);
            }
            localStorage.setItem('companies', JSON.stringify(companies));
        }
        
        // Ricarica dati e aggiorna interfaccia
        await loadCompanies();
        displayCompanies();
        updateDashboardStats();
        
        // Chiudi modal
        const companyModal = bootstrap.Modal.getInstance(document.getElementById('companyModal'));
        companyModal.hide();
        
    } catch (error) {
        console.error('Errore nel salvataggio dell\'azienda:', error);
        alert('Errore nel salvataggio dell\'azienda');
    }
}

// Elimina un'azienda
async function deleteCompany(companyId) {
    if (confirm('Sei sicuro di voler eliminare questa azienda?')) {
        try {
            if (isSupabaseConnected) {
                const { error } = await supabase
                    .from('companies')
                    .delete()
                    .eq('id', companyId);
                if (error) throw error;
            } else {
                // Modalità demo
                companies = companies.filter(c => c.id.toString() !== companyId.toString());
                localStorage.setItem('companies', JSON.stringify(companies));
            }
            
            // Ricarica dati e aggiorna interfaccia
            await loadCompanies();
            displayCompanies();
            updateDashboardStats();
            
        } catch (error) {
            console.error('Errore nell\'eliminazione dell\'azienda:', error);
            alert('Errore nell\'eliminazione dell\'azienda');
        }
    }
}

// Mostra aziende nell'interfaccia
function displayCompanies() {
    const companiesContainer = document.getElementById('companies-list');
    if (!companiesContainer) return;
    
    companiesContainer.innerHTML = '';
    
    if (companies.length === 0) {
        companiesContainer.innerHTML = '<div class="alert alert-info">Nessuna azienda trovata</div>';
        return;
    }
    
    companies.forEach(company => {
        const companyCard = document.createElement('div');
        companyCard.className = 'card mb-3';
        companyCard.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">${company.nome}</h5>
                <p class="card-text">${company.descrizione || 'Nessuna descrizione disponibile'}</p>
                <p><strong>🏢 Sede:</strong> ${company.sede || 'Non specificata'}</p>
                <p><strong>💼 Competenze:</strong> ${company.competenze || 'Non specificate'}</p>
                <p><strong>📂 Categoria:</strong> ${company.categoria || 'Non specificata'}</p>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" onclick="editCompany(${company.id})">
                        Modifica
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteCompany(${company.id})">
                        Elimina
                    </button>
                </div>
            </div>
        `;
        companiesContainer.appendChild(companyCard);
    });
}

// ====================================
// FUNZIONI CANDIDATI
// ====================================

// Carica candidati da Supabase o localStorage
async function loadCandidates() {
    if (isSupabaseConnected) {
        try {
            const { data, error } = await supabase.from('candidates').select('*');
            if (error) throw error;
            candidates = data || [];
        } catch (error) {
            console.error('Errore nel caricamento dei candidati:', error);
        }
    }
}

// Mostra il modal per aggiungere/modificare un candidato
function showCandidateForm() {
    // Reset del form
    document.getElementById('candidateForm').reset();
    document.getElementById('candidate-id').value = '';
    
    // Mostra il modal
    const candidateModal = new bootstrap.Modal(document.getElementById('candidateModal'));
    candidateModal.show();
}

// Modifica un candidato esistente
function editCandidate(candidateId) {
    const candidate = candidates.find(c => c.id.toString() === candidateId.toString());
    if (candidate) {
        // Pre-popola il form
        document.getElementById('candidate-id').value = candidate.id;
        document.getElementById('candidate-name').value = candidate.nome || '';
        document.getElementById('candidate-email').value = candidate.email || '';
        document.getElementById('candidate-phone').value = candidate.telefono || '';
        document.getElementById('candidate-skills').value = candidate.competenze || '';
        document.getElementById('candidate-experience').value = candidate.esperienze || '';
        document.getElementById('candidate-location').value = candidate.residenza || '';
        
        // Mostra il modal
        const candidateModal = new bootstrap.Modal(document.getElementById('candidateModal'));
        candidateModal.show();
    }
}

// Salva un candidato (nuovo o modificato)
async function saveCandidate(event) {
    event.preventDefault();
    
    const candidateData = {
        nome: document.getElementById('candidate-name').value.trim(),
        email: document.getElementById('candidate-email').value.trim(),
        telefono: document.getElementById('candidate-phone').value.trim(),
        competenze: document.getElementById('candidate-skills').value.trim(),
        esperienze: document.getElementById('candidate-experience').value.trim(),
        residenza: document.getElementById('candidate-location').value.trim()
    };
    
    const candidateId = document.getElementById('candidate-id').value;
    
    try {
        if (isSupabaseConnected) {
            if (candidateId) {
                // Aggiorna candidato esistente
                const { error } = await supabase
                    .from('candidates')
                    .update(candidateData)
                    .eq('id', candidateId);
                if (error) throw error;
            } else {
                // Inserisci nuovo candidato
                const { error } = await supabase
                    .from('candidates')
                    .insert([candidateData]);
                if (error) throw error;
            }
        } else {
            // Modalità demo
            if (candidateId) {
                const index = candidates.findIndex(c => c.id.toString() === candidateId);
                if (index !== -1) {
                    candidates[index] = { ...candidates[index], ...candidateData };
                }
            } else {
                candidateData.id = Date.now();
                candidates.push(candidateData);
            }
            localStorage.setItem('candidates', JSON.stringify(candidates));
        }
        
        // Ricarica dati e aggiorna interfaccia
        await loadCandidates();
        displayCandidates();
        updateDashboardStats();
        
        // Chiudi modal
        const candidateModal = bootstrap.Modal.getInstance(document.getElementById('candidateModal'));
        candidateModal.hide();
        
    } catch (error) {
        console.error('Errore nel salvataggio del candidato:', error);
        alert('Errore nel salvataggio del candidato');
    }
}

// Elimina un candidato
async function deleteCandidate(candidateId) {
    if (confirm('Sei sicuro di voler eliminare questo candidato?')) {
        try {
            if (isSupabaseConnected) {
                const { error } = await supabase
                    .from('candidates')
                    .delete()
                    .eq('id', candidateId);
                if (error) throw error;
            } else {
                // Modalità demo
                candidates = candidates.filter(c => c.id.toString() !== candidateId.toString());
                localStorage.setItem('candidates', JSON.stringify(candidates));
            }
            
            // Ricarica dati e aggiorna interfaccia
            await loadCandidates();
            displayCandidates();
            updateDashboardStats();
            
        } catch (error) {
            console.error('Errore nell\'eliminazione del candidato:', error);
            alert('Errore nell\'eliminazione del candidato');
        }
    }
}

// Mostra candidati nell'interfaccia
function displayCandidates() {
    const candidatesContainer = document.getElementById('candidates-list');
    if (!candidatesContainer) return;
    
    candidatesContainer.innerHTML = '';
    
    if (candidates.length === 0) {
        candidatesContainer.innerHTML = '<div class="alert alert-info">Nessun candidato trovato</div>';
        return;
    }
    
    candidates.forEach(candidate => {
        const candidateCard = document.createElement('div');
        candidateCard.className = 'card mb-3';
        candidateCard.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">${candidate.nome}</h5>
                <p><strong>📧 Email:</strong> ${candidate.email || 'Non specificata'}</p>
                <p><strong>📞 Telefono:</strong> ${candidate.telefono || 'Non specificato'}</p>
                <p><strong>🏠 Residenza:</strong> ${candidate.residenza || 'Non specificata'}</p>
                <p><strong>💼 Competenze:</strong> ${candidate.competenze || 'Non specificate'}</p>
                <p><strong>📝 Esperienze:</strong> ${candidate.esperienze || 'Non specificate'}</p>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" onclick="editCandidate(${candidate.id})">
                        Modifica
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteCandidate(${candidate.id})">
                        Elimina
                    </button>
                </div>
            </div>
        `;
        candidatesContainer.appendChild(candidateCard);
    });
}

// ====================================
// FUNZIONI RICERCA GLOBALE
// ====================================

// Esegue la ricerca globale e mostra i risultati nella homepage
function performGlobalSearch() {
    const searchTerm = document.getElementById('global-search').value.toLowerCase().trim();
    const categoryFilter = document.getElementById('category-filter').value;
    const typeFilter = document.getElementById('type-filter').value;
    
    const resultsContainer = document.getElementById('search-results-container');
    const resultsContent = document.getElementById('search-results-content');
    
    // Se la ricerca è vuota, nascondi i risultati
    if (!searchTerm && !categoryFilter && typeFilter === 'all') {
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
        }
        return;
    }
    
    let filteredCompanies = [];
    let filteredCandidates = [];
    
    // Filtra le aziende se richiesto
    if (typeFilter === 'all' || typeFilter === 'companies') {
        filteredCompanies = companies.filter(company => {
            const matchesSearch = !searchTerm || 
                (company.nome && company.nome.toLowerCase().includes(searchTerm)) ||
                (company.descrizione && company.descrizione.toLowerCase().includes(searchTerm)) ||
                (company.competenze && company.competenze.toLowerCase().includes(searchTerm)) ||
                (company.sede && company.sede.toLowerCase().includes(searchTerm));
            
            const matchesCategory = !categoryFilter || company.categoria === categoryFilter;
            
            return matchesSearch && matchesCategory;
        });
    }
    
    // Filtra i candidati se richiesto
    if (typeFilter === 'all' || typeFilter === 'candidates') {
        filteredCandidates = candidates.filter(candidate => {
            const matchesSearch = !searchTerm ||
                (candidate.nome && candidate.nome.toLowerCase().includes(searchTerm)) ||
                (candidate.email && candidate.email.toLowerCase().includes(searchTerm)) ||
                (candidate.competenze && candidate.competenze.toLowerCase().includes(searchTerm)) ||
                (candidate.esperienze && candidate.esperienze.toLowerCase().includes(searchTerm)) ||
                (candidate.residenza && candidate.residenza.toLowerCase().includes(searchTerm));
            
            return matchesSearch;
        });
    }
    
    // Genera HTML per i risultati
    let resultsHTML = '';
    
    // Mostra risultati aziende
    if (filteredCompanies.length > 0) {
        resultsHTML += `<h5 class="text-primary mb-3">🏢 Aziende trovate (${filteredCompanies.length})</h5>`;
        filteredCompanies.forEach(company => {
            resultsHTML += `
                <div class="card company-card mb-3">
                    <div class="card-body">
                        <h6 class="card-title">${company.nome}</h6>
                        <p class="card-text">${company.descrizione || 'Nessuna descrizione disponibile'}</p>
                        <p><strong>🏢 Sede:</strong> ${company.sede || 'Non specificata'}</p>
                        <p><strong>💼 Competenze:</strong> ${company.competenze || 'Non specificate'}</p>
                        <p><strong>📂 Categoria:</strong> ${company.categoria || 'Non specificata'}</p>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-primary" onclick="editCompany(${company.id})">
                                Modifica
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteCompany(${company.id})">
                                Elimina
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    // Mostra risultati candidati
    if (filteredCandidates.length > 0) {
        if (filteredCompanies.length > 0) resultsHTML += '<hr class="my-4">';
        resultsHTML += `<h5 class="text-success mb-3">👤 Candidati trovati (${filteredCandidates.length})</h5>`;
        filteredCandidates.forEach(candidate => {
            resultsHTML += `
                <div class="card candidate-card mb-3">
                    <div class="card-body">
                        <h6 class="card-title">${candidate.nome}</h6>
                        <p><strong>📧 Email:</strong> ${candidate.email || 'Non specificata'}</p>
                        <p><strong>📞 Telefono:</strong> ${candidate.telefono || 'Non specificato'}</p>
                        <p><strong>🏠 Residenza:</strong> ${candidate.residenza || 'Non specificata'}</p>
                        <p><strong>💼 Competenze:</strong> ${candidate.competenze || 'Non specificate'}</p>
                        <p><strong>📝 Esperienze:</strong> ${candidate.esperienze || 'Non specificate'}</p>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-primary" onclick="editCandidate(${candidate.id})">
                                Modifica
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteCandidate(${candidate.id})">
                                Elimina
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    // Mostra messaggio se nessun risultato
    if (filteredCompanies.length === 0 && filteredCandidates.length === 0) {
        resultsHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle"></i> Nessun risultato trovato per i criteri di ricerca specificati.
            </div>
        `;
    }
    
    // Aggiorna il contenuto e mostra la sezione risultati
    if (resultsContent) {
        resultsContent.innerHTML = resultsHTML;
    }
    if (resultsContainer) {
        resultsContainer.style.display = 'block';
    }
}

// ====================================
// FUNZIONI MATCHING
// ====================================

// Esegue il matching automatico
function runMatching() {
    const matchingResults = document.getElementById('matching-result');
    if (!matchingResults) return;
    
    if (companies.length === 0 || candidates.length === 0) {
        matchingResults.innerHTML = '<div class="alert alert-warning">Serve almeno una azienda e un candidato per il matching</div>';
        return;
    }
    
    const matches = [];
    
    companies.forEach(company => {
        const companySkills = (company.competenze || '').toLowerCase().split(',').map(s => s.trim());
        
        candidates.forEach(candidate => {
            const candidateSkills = (candidate.competenze || '').toLowerCase().split(',').map(s => s.trim());
            
            // Calcola la compatibilità basata sulle competenze comuni
            const commonSkills = companySkills.filter(skill => 
                candidateSkills.some(candidateSkill => 
                    candidateSkill.includes(skill) || skill.includes(candidateSkill)
                )
            );
            
            if (commonSkills.length > 0) {
                const compatibility = Math.round((commonSkills.length / Math.max(companySkills.length, 1)) * 100);
                matches.push({
                    company,
                    candidate,
                    compatibility,
                    commonSkills
                });
            }
        });
    });
    
    // Ordina per compatibilità decrescente
    matches.sort((a, b) => b.compatibility - a.compatibility);
    
    if (matches.length === 0) {
        matchingResults.innerHTML = '<div class="alert alert-info">Nessun match trovato</div>';
        return;
    }
    
    let matchHTML = '<h4>Risultati Matching</h4>';
    matches.forEach((match, index) => {
        matchHTML += `
            <div class="card mb-3 ${index === 0 ? 'border-success' : ''}">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-5">
                            <h6 class="text-primary">🏢 ${match.company.nome}</h6>
                            <p><strong>Sede:</strong> ${match.company.sede || 'Non specificata'}</p>
                            <p><strong>Categoria:</strong> ${match.company.categoria || 'Non specificata'}</p>
                        </div>
                        <div class="col-md-2 text-center">
                            <div class="badge bg-${match.compatibility >= 70 ? 'success' : match.compatibility >= 50 ? 'warning' : 'secondary'} fs-6">
                                ${match.compatibility}% Match
                            </div>
                            <br><small class="text-muted">Competenze comuni: ${match.commonSkills.length}</small>
                        </div>
                        <div class="col-md-5">
                            <h6 class="text-success">👤 ${match.candidate.nome}</h6>
                            <p><strong>Residenza:</strong> ${match.candidate.residenza || 'Non specificata'}</p>
                            <p><strong>Email:</strong> ${match.candidate.email || 'Non specificata'}</p>
                        </div>
                    </div>
                    <div class="mt-2">
                        <strong>Competenze in comune:</strong> 
                        ${match.commonSkills.map(skill => `<span class="badge bg-light text-dark me-1">${skill}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
    });
    
    matchingResults.innerHTML = matchHTML;
}

// ====================================
// FUNZIONI DASHBOARD E STATISTICHE
// ====================================

// Aggiorna le statistiche nella dashboard
function updateDashboardStats() {
    const totalCompaniesElement = document.getElementById('total-companies');
    const totalCandidatesElement = document.getElementById('total-candidates');
    
    if (totalCompaniesElement) {
        totalCompaniesElement.textContent = companies.length;
    }
    
    if (totalCandidatesElement) {
        totalCandidatesElement.textContent = candidates.length;
    }
}

// ====================================
// UTILITÀ E FUNZIONI HELPER
// ====================================

// Pulisce i form
function resetForms() {
    const companyForm = document.getElementById('companyForm');
    const candidateForm = document.getElementById('candidateForm');
    
    if (companyForm) companyForm.reset();
    if (candidateForm) candidateForm.reset();
}

// Gestisce gli errori
function handleError(error, message) {
    console.error(message, error);
    alert(message);
}

// Valida i dati del form
function validateForm(formData, requiredFields) {
    for (let field of requiredFields) {
        if (!formData[field] || formData[field].trim() === '') {
            return false;
        }
    }
    return true;
}
