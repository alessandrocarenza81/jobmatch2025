// JobMatch Platform - app.js Aggiornato con Sede e Residenza

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
    
    // Search handler
    const globalSearch = document.getElementById('global-search');
    if (globalSearch) {
        globalSearch.addEventListener('input', performGlobalSearch);
    }
}

// ==================================== 
// FUNZIONI NAVIGAZIONE
// ====================================

function navigateToPage(pageId) {
    // Nascondi tutte le sezioni
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostra la sezione selezionata
    const selectedPage = document.getElementById(pageId);
    if (selectedPage) {
        selectedPage.classList.add('active');
    }
    
    // Carica i dati per la pagina selezionata
    if (pageId === 'companies') {
        displayCompanies();
    } else if (pageId === 'candidates') {
        displayCandidates();
    } else if (pageId === 'matching') {
        // runMatching verrà chiamato quando l'utente clicca il bottone
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
        companiesContainer.innerHTML = '<p class="text-center text-muted">Nessuna azienda trovata</p>';
        return;
    }
    
    companies.forEach(company => {
        const companyCard = document.createElement('div');
        companyCard.className = 'card';
        companyCard.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">${company.nome}</h5>
                <p class="card-text">${company.descrizione || 'Nessuna descrizione disponibile'}</p>
                <div class="mb-2">
                    <strong>Categoria:</strong> ${company.categoria || 'Non specificata'}
                </div>
                <div class="mb-2">
                    <strong>Competenze richieste:</strong> ${company.competenze || 'Non specificate'}
                </div>
                <div class="mb-2">
                    <strong>🏢 Sede:</strong> ${company.sede || 'Non specificata'}
                </div>
                <div class="btn-group btn-group-custom">
                    <button class="btn btn-sm btn-outline-primary" onclick="editCompany(${company.id})">
                        ✏️ Modifica
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteCompany(${company.id})">
                        🗑️ Elimina
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
        // Pre-popola il form con i dati del candidato
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
            // Modalità demo - salva in localStorage
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
        candidatesContainer.innerHTML = '<p class="text-center text-muted">Nessun candidato trovato</p>';
        return;
    }
    
    candidates.forEach(candidate => {
        const candidateCard = document.createElement('div');
        candidateCard.className = 'card';
        candidateCard.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">${candidate.nome}</h5>
                <div class="mb-2">
                    <strong>Email:</strong> ${candidate.email || 'Non specificata'}
                </div>
                <div class="mb-2">
                    <strong>Telefono:</strong> ${candidate.telefono || 'Non specificato'}
                </div>
                <div class="mb-2">
                    <strong>Competenze:</strong> ${candidate.competenze || 'Non specificate'}
                </div>
                <div class="mb-2">
                    <strong>Esperienze:</strong> ${candidate.esperienze || 'Non specificate'}
                </div>
                <div class="mb-2">
                    <strong>🏠 Residenza:</strong> ${candidate.residenza || 'Non specificata'}
                </div>
                <div class="btn-group btn-group-custom">
                    <button class="btn btn-sm btn-outline-primary" onclick="editCandidate(${candidate.id})">
                        ✏️ Modifica
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteCandidate(${candidate.id})">
                        🗑️ Elimina
                    </button>
                </div>
            </div>
        `;
        candidatesContainer.appendChild(candidateCard);
    });
}

// ====================================
// FUNZIONI MATCHING E RICERCA
// ====================================

// Esegui matching automatico
function runMatching() {
    const matchingResults = document.getElementById('matching-results');
    if (!matchingResults) return;
    
    matchingResults.innerHTML = '';
    
    if (companies.length === 0 || candidates.length === 0) {
        matchingResults.innerHTML = '<p class="text-center text-muted">Serve almeno una azienda e un candidato per il matching</p>';
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
        matchingResults.innerHTML = '<p class="text-center text-muted">Nessun match trovato</p>';
        return;
    }
    
    matches.forEach(match => {
        const matchDiv = document.createElement('div');
        matchDiv.className = 'match-result';
        matchDiv.innerHTML = `
            <h6>🤝 Match ${match.compatibility}%</h6>
            <div class="row">
                <div class="col-md-6">
                    <strong>🏢 ${match.company.nome}</strong>
                    <br>Sede: ${match.company.sede || 'Non specificata'}
                    <br>Cerca: ${match.company.competenze || 'N/A'}
                </div>
                <div class="col-md-6">
                    <strong>👤 ${match.candidate.nome}</strong>
                    <br>Residenza: ${match.candidate.residenza || 'Non specificata'}
                    <br>Competenze: ${match.candidate.competenze || 'N/A'}
                </div>
            </div>
            <div class="mt-2">
                <strong>Competenze in comune:</strong> ${match.commonSkills.join(', ')}
            </div>
        `;
        matchingResults.appendChild(matchDiv);
    });
}

// Ricerca globale
function performGlobalSearch() {
    const searchTerm = document.getElementById('global-search').value.toLowerCase();
    const categoryFilter = document.getElementById('category-filter').value;
    const skillsFilter = document.getElementById('skills-filter').value.toLowerCase();
    const typeFilter = document.getElementById('type-filter').value;
    
    let filteredCompanies = companies;
    let filteredCandidates = candidates;
    
    // Applica filtri
    if (searchTerm) {
        filteredCompanies = filteredCompanies.filter(company => 
            (company.nome || '').toLowerCase().includes(searchTerm) ||
            (company.descrizione || '').toLowerCase().includes(searchTerm) ||
            (company.competenze || '').toLowerCase().includes(searchTerm) ||
            (company.categoria || '').toLowerCase().includes(searchTerm) ||
            (company.sede || '').toLowerCase().includes(searchTerm)
        );
        
        filteredCandidates = filteredCandidates.filter(candidate => 
            (candidate.nome || '').toLowerCase().includes(searchTerm) ||
            (candidate.email || '').toLowerCase().includes(searchTerm) ||
            (candidate.competenze || '').toLowerCase().includes(searchTerm) ||
            (candidate.esperienze || '').toLowerCase().includes(searchTerm) ||
            (candidate.residenza || '').toLowerCase().includes(searchTerm)
        );
    }
    
    if (categoryFilter) {
        filteredCompanies = filteredCompanies.filter(company => company.categoria === categoryFilter);
    }
    
    if (skillsFilter) {
        filteredCompanies = filteredCompanies.filter(company => 
            (company.competenze || '').toLowerCase().includes(skillsFilter)
        );
        filteredCandidates = filteredCandidates.filter(candidate => 
            (candidate.competenze || '').toLowerCase().includes(skillsFilter)
        );
    }
    
    // Mostra risultati
    console.log('Risultati ricerca:', { filteredCompanies, filteredCandidates });
    
    // Aggiorna temporaneamente le liste (you could implement this differently)
    if (typeFilter === 'companies' || typeFilter === '') {
        companies = filteredCompanies;
        displayCompanies();
    }
    if (typeFilter === 'candidates' || typeFilter === '') {
        candidates = filteredCandidates;
        displayCandidates();
    }
}

// ====================================
// FUNZIONI UTILITY
// ====================================

// Aggiorna statistiche dashboard
function updateDashboardStats() {
    const totalCompaniesEl = document.getElementById('total-companies');
    const totalCandidatesEl = document.getElementById('total-candidates');
    
    if (totalCompaniesEl) {
        totalCompaniesEl.textContent = companies.length;
    }
    
    if (totalCandidatesEl) {
        totalCandidatesEl.textContent = candidates.length;
    }
}