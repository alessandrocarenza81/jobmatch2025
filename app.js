// JobMatch 2025 - app.js Completo Finale
// Versione corretta con navigazione funzionante

// ====================================
// CONFIGURAZIONE SUPABASE
// ====================================
const SUPABASE_URL = 'https://cqntluwuhcxovktdcowl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxbnRsdXd1aGN4b3ZrdGRjb3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2Mjk3OTUsImV4cCI6MjA2NTIwNTc5NX0.nuP0c64P9PQ8m-4LIpYs8sY1pGxgFb-PXvFma-_H_dE';

// ====================================
// VARIABILI GLOBALI
// ====================================
let companies = [];
let candidates = [];
let isSupabaseConnected = false;
let supabase;

// ====================================
// INIZIALIZZAZIONE APPLICAZIONE
// ====================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inizializzazione JobMatch 2025...');
    
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
        console.warn('⚠️ Credenziali Supabase non configurate');
        activateDemoMode();
    }
    
    // Aggiorna statistiche dashboard
    updateDashboardStats();
    
    // Configura event listeners
    setupEventListeners();
    
    // Mostra la dashboard di default
    navigateToPage('dashboard');
    
    console.log('✅ Inizializzazione completata');
});

// ====================================
// GESTIONE MODALITÀ DEMO
// ====================================
function activateDemoMode() {
    console.warn('⚠️ Modalità demo attiva, configura Supabase per la persistenza');
    // Carica da localStorage invece di Supabase
    companies = JSON.parse(localStorage.getItem('companies') || '[]');
    candidates = JSON.parse(localStorage.getItem('candidates') || '[]');
}

// ====================================
// CONFIGURAZIONE EVENT LISTENERS
// ====================================
function setupEventListeners() {
    console.log('🔧 Configurazione event listeners...');
    
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
        globalSearch.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performGlobalSearch();
            }
        });
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', performGlobalSearch);
    }
    
    if (typeFilter) {
        typeFilter.addEventListener('change', performGlobalSearch);
    }
}

// ====================================
// SISTEMA DI NAVIGAZIONE
// ====================================
function navigateToPage(pageId) {
    console.log('🧭 Navigazione verso:', pageId);
    
    // Nascondi tutte le sezioni
    const allSections = document.querySelectorAll('.page-section');
    allSections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Rimuovi classe active da tutti i bottoni di navigazione
    const allNavButtons = document.querySelectorAll('.nav-button');
    allNavButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostra la sezione selezionata
    const targetSection = document.getElementById(pageId + '-section');
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.classList.add('active');
        console.log('✅ Sezione mostrata:', pageId + '-section');
    } else {
        console.error('❌ Sezione non trovata:', pageId + '-section');
        return;
    }
    
    // Attiva il bottone di navigazione corretto
    const navButton = document.getElementById('nav-' + pageId);
    if (navButton) {
        navButton.classList.add('active');
    }
    
    // Carica i dati per la pagina selezionata
    switch(pageId) {
        case 'companies':
            displayCompanies();
            break;
        case 'candidates':
            displayCandidates();
            break;
        case 'dashboard':
            updateDashboardStats();
            // Nascondi i risultati di ricerca quando si torna alla dashboard
            const searchResults = document.getElementById('search-results-container');
            if (searchResults) {
                searchResults.style.display = 'none';
            }
            // Pulisci i campi di ricerca
            const globalSearch = document.getElementById('global-search');
            if (globalSearch) {
                globalSearch.value = '';
            }
            break;
        case 'matching':
            // La sezione matching è vuota di default fino a quando non si esegue il matching
            break;
    }
}

// ====================================
// GESTIONE AZIENDE
// ====================================

// Carica aziende da Supabase o localStorage
async function loadCompanies() {
    console.log('📦 Caricamento aziende...');
    if (isSupabaseConnected) {
        try {
            const { data, error } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            companies = data || [];
            console.log('✅ Aziende caricate:', companies.length);
        } catch (error) {
            console.error('❌ Errore nel caricamento delle aziende:', error);
            companies = [];
        }
    } else {
        companies = JSON.parse(localStorage.getItem('companies') || '[]');
        console.log('📦 Aziende caricate da localStorage:', companies.length);
    }
}

// Mostra il modal per aggiungere una nuova azienda
function showCompanyForm() {
    console.log('📝 Apertura form nuova azienda');
    
    // Reset del form
    document.getElementById('companyForm').reset();
    document.getElementById('company-id').value = '';
    
    // Aggiorna il titolo del modal
    document.getElementById('companyModalLabel').innerHTML = '<i class="bi bi-building"></i> Nuova Azienda';
    
    // Mostra il modal
    const companyModal = new bootstrap.Modal(document.getElementById('companyModal'));
    companyModal.show();
}

// Modifica un'azienda esistente
function editCompany(companyId) {
    console.log('✏️ Modifica azienda ID:', companyId);
    
    const company = companies.find(c => c.id.toString() === companyId.toString());
    if (company) {
        // Pre-popola il form con i dati dell'azienda
        document.getElementById('company-id').value = company.id;
        document.getElementById('company-name').value = company.nome || '';
        document.getElementById('company-description').value = company.descrizione || '';
        document.getElementById('company-skills').value = company.competenze || '';
        document.getElementById('company-category').value = company.categoria || '';
        document.getElementById('company-location').value = company.sede || '';
        
        // Aggiorna il titolo del modal
        document.getElementById('companyModalLabel').innerHTML = '<i class="bi bi-building"></i> Modifica Azienda';
        
        // Mostra il modal
        const companyModal = new bootstrap.Modal(document.getElementById('companyModal'));
        companyModal.show();
    } else {
        console.error('❌ Azienda non trovata:', companyId);
        alert('Azienda non trovata');
    }
}

// Salva un'azienda (nuova o modificata)
async function saveCompany(event) {
    event.preventDefault();
    console.log('💾 Salvataggio azienda...');
    
    const companyData = {
        nome: document.getElementById('company-name').value.trim(),
        descrizione: document.getElementById('company-description').value.trim(),
        competenze: document.getElementById('company-skills').value.trim(),
        categoria: document.getElementById('company-category').value,
        sede: document.getElementById('company-location').value.trim()
    };
    
    // Validazione base
    if (!companyData.nome) {
        alert('Il nome dell\'azienda è obbligatorio');
        return;
    }
    
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
                console.log('✅ Azienda aggiornata');
            } else {
                // Inserisci nuova azienda
                const { error } = await supabase
                    .from('companies')
                    .insert([companyData]);
                if (error) throw error;
                console.log('✅ Nuova azienda inserita');
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
                companyData.created_at = new Date().toISOString();
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
        if (companyModal) {
            companyModal.hide();
        }
        
        // Mostra messaggio di successo
        alert('Azienda salvata con successo!');
        
    } catch (error) {
        console.error('❌ Errore nel salvataggio dell\'azienda:', error);
        alert('Errore nel salvataggio dell\'azienda: ' + error.message);
    }
}

// Elimina un'azienda
async function deleteCompany(companyId) {
    if (!confirm('Sei sicuro di voler eliminare questa azienda?')) {
        return;
    }
    
    console.log('🗑️ Eliminazione azienda ID:', companyId);
    
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
        
        alert('Azienda eliminata con successo!');
        
    } catch (error) {
        console.error('❌ Errore nell\'eliminazione dell\'azienda:', error);
        alert('Errore nell\'eliminazione dell\'azienda: ' + error.message);
    }
}

// Mostra aziende nell'interfaccia
function displayCompanies() {
    console.log('🏢 Visualizzazione aziende:', companies.length);
    
    const companiesContainer = document.getElementById('companies-list');
    if (!companiesContainer) {
        console.error('❌ Container aziende non trovato');
        return;
    }
    
    companiesContainer.innerHTML = '';
    
    if (companies.length === 0) {
        companiesContainer.innerHTML = `
            <div class="alert alert-info text-center">
                <i class="bi bi-info-circle"></i> 
                <h5>Nessuna azienda presente</h5>
                <p>Inizia aggiungendo la prima azienda alla piattaforma!</p>
                <button class="btn btn-primary" onclick="showCompanyForm()">
                    <i class="bi bi-plus-circle"></i> Aggiungi Prima Azienda
                </button>
            </div>
        `;
        return;
    }
    
    companies.forEach(company => {
        const companyCard = document.createElement('div');
        companyCard.className = 'card company-card mb-3';
        companyCard.innerHTML = `
            <div class="card-body">
                <div class="row">
                    <div class="col-md-8">
                        <h5 class="card-title">
                            <i class="bi bi-building"></i> ${company.nome}
                        </h5>
                        <p class="card-text">${company.descrizione || 'Nessuna descrizione disponibile'}</p>
                        <div class="row">
                            <div class="col-md-6">
                                <p class="mb-1"><strong><i class="bi bi-geo-alt"></i> Sede:</strong> ${company.sede || 'Non specificata'}</p>
                                <p class="mb-1"><strong><i class="bi bi-tag"></i> Categoria:</strong> ${company.categoria || 'Non specificata'}</p>
                            </div>
                            <div class="col-md-6">
                                <p class="mb-1"><strong><i class="bi bi-gear"></i> Competenze:</strong></p>
                                <p class="text-muted">${company.competenze || 'Non specificate'}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 text-end">
                        <div class="btn-group-vertical">
                            <button class="btn btn-sm btn-outline-primary mb-2" onclick="editCompany(${company.id})">
                                <i class="bi bi-pencil"></i> Modifica
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteCompany(${company.id})">
                                <i class="bi bi-trash"></i> Elimina
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        companiesContainer.appendChild(companyCard);
    });
}

// ====================================
// GESTIONE CANDIDATI
// ====================================

// Carica candidati da Supabase o localStorage
async function loadCandidates() {
    console.log('👤 Caricamento candidati...');
    if (isSupabaseConnected) {
        try {
            const { data, error } = await supabase.from('candidates').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            candidates = data || [];
            console.log('✅ Candidati caricati:', candidates.length);
        } catch (error) {
            console.error('❌ Errore nel caricamento dei candidati:', error);
            candidates = [];
        }
    } else {
        candidates = JSON.parse(localStorage.getItem('candidates') || '[]');
        console.log('📦 Candidati caricati da localStorage:', candidates.length);
    }
}

// Mostra il modal per aggiungere un nuovo candidato
function showCandidateForm() {
    console.log('📝 Apertura form nuovo candidato');
    
    // Reset del form
    document.getElementById('candidateForm').reset();
    document.getElementById('candidate-id').value = '';
    
    // Aggiorna il titolo del modal
    document.getElementById('candidateModalLabel').innerHTML = '<i class="bi bi-person-fill"></i> Nuovo Candidato';
    
    // Mostra il modal
    const candidateModal = new bootstrap.Modal(document.getElementById('candidateModal'));
    candidateModal.show();
}

// Modifica un candidato esistente
function editCandidate(candidateId) {
    console.log('✏️ Modifica candidato ID:', candidateId);
    
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
        
        // Aggiorna il titolo del modal
        document.getElementById('candidateModalLabel').innerHTML = '<i class="bi bi-person-fill"></i> Modifica Candidato';
        
        // Mostra il modal
        const candidateModal = new bootstrap.Modal(document.getElementById('candidateModal'));
        candidateModal.show();
    } else {
        console.error('❌ Candidato non trovato:', candidateId);
        alert('Candidato non trovato');
    }
}

// Salva un candidato (nuovo o modificato)
async function saveCandidate(event) {
    event.preventDefault();
    console.log('💾 Salvataggio candidato...');
    
    const candidateData = {
        nome: document.getElementById('candidate-name').value.trim(),
        email: document.getElementById('candidate-email').value.trim(),
        telefono: document.getElementById('candidate-phone').value.trim(),
        competenze: document.getElementById('candidate-skills').value.trim(),
        esperienze: document.getElementById('candidate-experience').value.trim(),
        residenza: document.getElementById('candidate-location').value.trim()
    };
    
    // Validazione base
    if (!candidateData.nome) {
        alert('Il nome del candidato è obbligatorio');
        return;
    }
    
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
                console.log('✅ Candidato aggiornato');
            } else {
                // Inserisci nuovo candidato
                const { error } = await supabase
                    .from('candidates')
                    .insert([candidateData]);
                if (error) throw error;
                console.log('✅ Nuovo candidato inserito');
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
                candidateData.created_at = new Date().toISOString();
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
        if (candidateModal) {
            candidateModal.hide();
        }
        
        // Mostra messaggio di successo
        alert('Candidato salvato con successo!');
        
    } catch (error) {
        console.error('❌ Errore nel salvataggio del candidato:', error);
        alert('Errore nel salvataggio del candidato: ' + error.message);
    }
}

// Elimina un candidato
async function deleteCandidate(candidateId) {
    if (!confirm('Sei sicuro di voler eliminare questo candidato?')) {
        return;
    }
    
    console.log('🗑️ Eliminazione candidato ID:', candidateId);
    
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
        
        alert('Candidato eliminato con successo!');
        
    } catch (error) {
        console.error('❌ Errore nell\'eliminazione del candidato:', error);
        alert('Errore nell\'eliminazione del candidato: ' + error.message);
    }
}

// Mostra candidati nell'interfaccia
function displayCandidates() {
    console.log('👤 Visualizzazione candidati:', candidates.length);
    
    const candidatesContainer = document.getElementById('candidates-list');
    if (!candidatesContainer) {
        console.error('❌ Container candidati non trovato');
        return;
    }
    
    candidatesContainer.innerHTML = '';
    
    if (candidates.length === 0) {
        candidatesContainer.innerHTML = `
            <div class="alert alert-info text-center">
                <i class="bi bi-info-circle"></i> 
                <h5>Nessun candidato presente</h5>
                <p>Inizia aggiungendo il primo candidato alla piattaforma!</p>
                <button class="btn btn-primary" onclick="showCandidateForm()">
                    <i class="bi bi-person-plus"></i> Aggiungi Primo Candidato
                </button>
            </div>
        `;
        return;
    }
    
    candidates.forEach(candidate => {
        const candidateCard = document.createElement('div');
        candidateCard.className = 'card candidate-card mb-3';
        candidateCard.innerHTML = `
            <div class="card-body">
                <div class="row">
                    <div class="col-md-8">
                        <h5 class="card-title">
                            <i class="bi bi-person-fill"></i> ${candidate.nome}
                        </h5>
                        <div class="row">
                            <div class="col-md-6">
                                <p class="mb-1"><strong><i class="bi bi-envelope"></i> Email:</strong> ${candidate.email || 'Non specificata'}</p>
                                <p class="mb-1"><strong><i class="bi bi-telephone"></i> Telefono:</strong> ${candidate.telefono || 'Non specificato'}</p>
                                <p class="mb-1"><strong><i class="bi bi-house"></i> Residenza:</strong> ${candidate.residenza || 'Non specificata'}</p>
                            </div>
                            <div class="col-md-6">
                                <p class="mb-1"><strong><i class="bi bi-gear"></i> Competenze:</strong></p>
                                <p class="text-muted mb-2">${candidate.competenze || 'Non specificate'}</p>
                                <p class="mb-1"><strong><i class="bi bi-briefcase"></i> Esperienze:</strong></p>
                                <p class="text-muted">${(candidate.esperienze || 'Non specificate').substring(0, 100)}${(candidate.esperienze && candidate.esperienze.length > 100) ? '...' : ''}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 text-end">
                        <div class="btn-group-vertical">
                            <button class="btn btn-sm btn-outline-primary mb-2" onclick="editCandidate(${candidate.id})">
                                <i class="bi bi-pencil"></i> Modifica
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteCandidate(${candidate.id})">
                                <i class="bi bi-trash"></i> Elimina
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        candidatesContainer.appendChild(candidateCard);
    });
}

// ====================================
// RICERCA GLOBALE
// ====================================

// Esegue la ricerca globale e mostra i risultati nella homepage
function performGlobalSearch() {
    const searchTerm = document.getElementById('global-search').value.toLowerCase().trim();
    const categoryFilter = document.getElementById('category-filter').value;
    const typeFilter = document.getElementById('type-filter').value;
    
    console.log('🔍 Ricerca globale:', { searchTerm, categoryFilter, typeFilter });
    
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
        resultsHTML += `<h5 class="text-primary mb-3">
            <i class="bi bi-building"></i> 🏢 Aziende trovate (${filteredCompanies.length})
        </h5>`;
        filteredCompanies.forEach(company => {
            resultsHTML += `
                <div class="card company-card mb-3">
                    <div class="card-body">
                        <h6 class="card-title">
                            <i class="bi bi-building"></i> ${company.nome}
                        </h6>
                        <p class="card-text">${company.descrizione || 'Nessuna descrizione disponibile'}</p>
                        <div class="row">
                            <div class="col-md-6">
                                <p class="mb-1"><strong><i class="bi bi-geo-alt"></i> Sede:</strong> ${company.sede || 'Non specificata'}</p>
                                <p class="mb-1"><strong><i class="bi bi-tag"></i> Categoria:</strong> ${company.categoria || 'Non specificata'}</p>
                            </div>
                            <div class="col-md-6">
                                <p class="mb-1"><strong><i class="bi bi-gear"></i> Competenze:</strong> ${company.competenze || 'Non specificate'}</p>
                            </div>
                        </div>
                        <div class="btn-group mt-2">
                            <button class="btn btn-sm btn-outline-primary" onclick="editCompany(${company.id})">
                                <i class="bi bi-pencil"></i> Modifica
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteCompany(${company.id})">
                                <i class="bi bi-trash"></i> Elimina
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
        resultsHTML += `<h5 class="text-success mb-3">
            <i class="bi bi-person-fill"></i> 👤 Candidati trovati (${filteredCandidates.length})
        </h5>`;
        filteredCandidates.forEach(candidate => {
            resultsHTML += `
                <div class="card candidate-card mb-3">
                    <div class="card-body">
                        <h6 class="card-title">
                            <i class="bi bi-person-fill"></i> ${candidate.nome}
                        </h6>
                        <div class="row">
                            <div class="col-md-6">
                                <p class="mb-1"><strong><i class="bi bi-envelope"></i> Email:</strong> ${candidate.email || 'Non specificata'}</p>
                                <p class="mb-1"><strong><i class="bi bi-telephone"></i> Telefono:</strong> ${candidate.telefono || 'Non specificato'}</p>
                                <p class="mb-1"><strong><i class="bi bi-house"></i> Residenza:</strong> ${candidate.residenza || 'Non specificata'}</p>
                            </div>
                            <div class="col-md-6">
                                <p class="mb-1"><strong><i class="bi bi-gear"></i> Competenze:</strong> ${candidate.competenze || 'Non specificate'}</p>
                                <p class="mb-1"><strong><i class="bi bi-briefcase"></i> Esperienze:</strong> ${(candidate.esperienze || 'Non specificate').substring(0, 80)}${(candidate.esperienze && candidate.esperienze.length > 80) ? '...' : ''}</p>
                            </div>
                        </div>
                        <div class="btn-group mt-2">
                            <button class="btn btn-sm btn-outline-primary" onclick="editCandidate(${candidate.id})">
                                <i class="bi bi-pencil"></i> Modifica
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteCandidate(${candidate.id})">
                                <i class="bi bi-trash"></i> Elimina
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
                <i class="bi bi-info-circle"></i> 
                <strong>Nessun risultato trovato</strong><br>
                Prova a modificare i criteri di ricerca o ad aggiungere nuovi dati alla piattaforma.
            </div>
        `;
    }
    
    // Aggiorna il contenuto e mostra la sezione risultati
    if (resultsContent) {
        resultsContent.innerHTML = resultsHTML;
    }
    if (resultsContainer) {
        resultsContainer.style.display = 'block';
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

// ====================================
// MATCHING AUTOMATICO
// ====================================

// Esegue il matching automatico
function runMatching() {
    console.log('🤝 Esecuzione matching automatico...');
    
    // Se siamo nella dashboard, naviga alla sezione matching
    const currentSection = document.querySelector('.page-section.active');
    if (currentSection && currentSection.id === 'dashboard-section') {
        navigateToPage('matching');
    }
    
    const matchingResults = document.getElementById('matching-result');
    if (!matchingResults) {
        console.error('❌ Container risultati matching non trovato');
        return;
    }
    
    if (companies.length === 0 || candidates.length === 0) {
        matchingResults.innerHTML = `
            <div class="alert alert-warning text-center">
                <i class="bi bi-exclamation-triangle"></i>
                <h5>Dati insufficienti per il matching</h5>
                <p>Serve almeno una azienda e un candidato per eseguire il matching automatico.</p>
                <div class="mt-3">
                    <button class="btn btn-primary me-2" onclick="showCompanyForm()">
                        <i class="bi bi-plus-circle"></i> Aggiungi Azienda
                    </button>
                    <button class="btn btn-success" onclick="showCandidateForm()">
                        <i class="bi bi-person-plus"></i> Aggiungi Candidato
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    const matches = [];
    
    companies.forEach(company => {
        const companySkills = (company.competenze || '').toLowerCase()
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0);
        
        candidates.forEach(candidate => {
            const candidateSkills = (candidate.competenze || '').toLowerCase()
                .split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0);
            
            // Calcola la compatibilità basata sulle competenze comuni
            const commonSkills = companySkills.filter(skill => 
                candidateSkills.some(candidateSkill => 
                    candidateSkill.includes(skill) || skill.includes(candidateSkill) ||
                    (skill.length > 2 && candidateSkill.includes(skill.substring(0, skill.length - 1))) ||
                    (candidateSkill.length > 2 && skill.includes(candidateSkill.substring(0, candidateSkill.length - 1)))
                )
            );
            
            if (commonSkills.length > 0) {
                const maxSkills = Math.max(companySkills.length, candidateSkills.length);
                const compatibility = Math.round((commonSkills.length / maxSkills) * 100);
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
        matchingResults.innerHTML = `
            <div class="alert alert-info text-center">
                <i class="bi bi-info-circle"></i>
                <h5>Nessun match trovato</h5>
                <p>Non sono state trovate competenze compatibili tra aziende e candidati.</p>
                <p class="text-muted">Prova ad aggiungere competenze più specifiche o simili nei profili.</p>
            </div>
        `;
        return;
    }
    
    let matchHTML = `
        <div class="alert alert-success text-center mb-4">
            <i class="bi bi-check-circle"></i>
            <h5>Matching completato!</h5>
            <p>Trovati <strong>${matches.length}</strong> possibili abbinamenti</p>
        </div>
    `;
    
    matches.forEach((match, index) => {
        const badgeClass = match.compatibility >= 70 ? 'success' : 
                          match.compatibility >= 50 ? 'warning' : 'secondary';
        
        matchHTML += `
            <div class="card mb-4 ${index === 0 ? 'border-success' : ''} ${index < 3 ? 'shadow' : ''}">
                <div class="card-header ${index === 0 ? 'bg-success text-white' : 'bg-light'}">
                    <div class="row align-items-center">
                        <div class="col">
                            <h6 class="mb-0">
                                <i class="bi bi-trophy"></i> ${index === 0 ? 'MIGLIOR MATCH' : `Match #${index + 1}`}
                            </h6>
                        </div>
                        <div class="col-auto">
                            <span class="badge bg-${badgeClass} fs-6 px-3 py-2">
                                ${match.compatibility}% Compatibilità
                            </span>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-5">
                            <div class="border-end pe-3">
                                <h6 class="text-primary mb-3">
                                    <i class="bi bi-building"></i> ${match.company.nome}
                                </h6>
                                <p class="mb-2"><strong><i class="bi bi-geo-alt"></i> Sede:</strong> ${match.company.sede || 'Non specificata'}</p>
                                <p class="mb-2"><strong><i class="bi bi-tag"></i> Categoria:</strong> ${match.company.categoria || 'Non specificata'}</p>
                                <p class="mb-0"><strong><i class="bi bi-file-text"></i> Descrizione:</strong></p>
                                <p class="text-muted small">${(match.company.descrizione || 'Non specificata').substring(0, 100)}${(match.company.descrizione && match.company.descrizione.length > 100) ? '...' : ''}</p>
                            </div>
                        </div>
                        <div class="col-md-2 text-center">
                            <div class="d-flex flex-column align-items-center justify-content-center h-100">
                                <i class="bi bi-arrow-left-right text-primary mb-2" style="font-size: 2rem;"></i>
                                <small class="text-muted">
                                    <strong>${match.commonSkills.length}</strong><br>
                                    competenze comuni
                                </small>
                            </div>
                        </div>
                        <div class="col-md-5">
                            <div class="border-start ps-3">
                                <h6 class="text-success mb-3">
                                    <i class="bi bi-person-fill"></i> ${match.candidate.nome}
                                </h6>
                                <p class="mb-2"><strong><i class="bi bi-house"></i> Residenza:</strong> ${match.candidate.residenza || 'Non specificata'}</p>
                                <p class="mb-2"><strong><i class="bi bi-envelope"></i> Email:</strong> ${match.candidate.email || 'Non specificata'}</p>
                                <p class="mb-2"><strong><i class="bi bi-telephone"></i> Telefono:</strong> ${match.candidate.telefono || 'Non specificato'}</p>
                            </div>
                        </div>
                    </div>
                    <hr>
                    <div class="mt-3">
                        <h6 class="mb-2">
                            <i class="bi bi-gear"></i> Competenze in comune:
                        </h6>
                        <div class="d-flex flex-wrap gap-2">
                            ${match.commonSkills.map(skill => 
                                `<span class="badge bg-primary text-white px-3 py-2">${skill}</span>`
                            ).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    matchingResults.innerHTML = matchHTML;
    console.log('✅ Matching completato:', matches.length, 'risultati');
}

// ====================================
// DASHBOARD E STATISTICHE
// ====================================

// Aggiorna le statistiche nella dashboard
function updateDashboardStats() {
    console.log('📊 Aggiornamento statistiche dashboard...');
    
    const totalCompaniesElement = document.getElementById('total-companies');
    const totalCandidatesElement = document.getElementById('total-candidates');
    
    if (totalCompaniesElement) {
        totalCompaniesElement.textContent = companies.length;
    }
    
    if (totalCandidatesElement) {
        totalCandidatesElement.textContent = candidates.length;
    }
    
    console.log('📊 Statistiche aggiornate:', {
        aziende: companies.length,
        candidati: candidates.length
    });
}

// ====================================
// FUNZIONI UTILITY
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
    alert(message + ': ' + error.message);
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

// Formatta le competenze per la visualizzazione
function formatSkills(skills) {
    if (!skills) return 'Non specificate';
    return skills.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0).join(', ');
}

// Debug: mostra stato dell'applicazione
function debugStatus() {
    console.log('🔍 Stato applicazione:', {
        supabaseConnected: isSupabaseConnected,
        companies: companies.length,
        candidates: candidates.length,
        currentSection: document.querySelector('.page-section.active')?.id
    });
}

// Inizializza debug se necessario
if (window.location.search.includes('debug=true')) {
    setInterval(debugStatus, 5000);
}

console.log('✅ JobMatch 2025 caricato completamente');