// JobMatch Platform - app.js

// Configurazione Supabase
const SUPABASE_URL = 'https://cqntluwuhcxovktdcowl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxbnRsdXd1aGN4b3ZrdGRjb3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2Mjk3OTUsImV4cCI6MjA2NTIwNTc5NX0.nuP0c64P9PQ8m-4LIpYs8sY1pGxgFb-PXvFma-_H_dE';

// Variabili globali
let companies = [];
let candidates = [];
let isSupabaseConnected = false;

// Inizializza client Supabase
document.addEventListener('DOMContentLoaded', async () => {
    // Verifica se Supabase è configurato con credenziali reali
    if (SUPABASE_URL && SUPABASE_URL !== 'YOUR_SUPABASE_URL' && 
        SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
        try {
            // Inizializza client Supabase con l'oggetto globale supabase
            const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            isSupabaseConnected = true;
            console.log('✅ Connessione a Supabase riuscita');
            
            // Mostra statistiche dashboard
            updateDashboardStats();
            
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

    // Configura event listeners
    setupEventListeners();
});

// Attiva modalità demo se la connessione a Supabase fallisce
function activateDemoMode() {
    console.warn('⚠️ Modalità demo attiva, configura Supabase per la persistenza');
    // Carica da localStorage invece
    companies = JSON.parse(localStorage.getItem('companies') || '[]');
    candidates = JSON.parse(localStorage.getItem('candidates') || '[]');
    updateDashboardStats();
};

// Configura tutti gli event listeners
function setupEventListeners() {
    // Navigazione tra le pagine
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = e.target.getAttribute('data-page');
            if (pageId) {
                navigateToPage(pageId);
            }
        });
    });

    // Bottoni per aggiungere azienda (sia nella dashboard che nella pagina aziende)
    document.getElementById('add-company-btn').addEventListener('click', () => showCompanyModal('add'));
    const companyBtnPage = document.getElementById('add-company-btn-page');
    if (companyBtnPage) {
        companyBtnPage.addEventListener('click', () => showCompanyModal('add'));
    }

    // Bottoni per aggiungere candidato (sia nella dashboard che nella pagina candidati)
    document.getElementById('add-candidate-btn').addEventListener('click', () => showCandidateModal('add'));
    const candidateBtnPage = document.getElementById('add-candidate-btn-page');
    if (candidateBtnPage) {
        candidateBtnPage.addEventListener('click', () => showCandidateModal('add'));
    }

    // Form di invio azienda
    document.getElementById('company-form').addEventListener('submit', handleCompanySubmit);

    // Form di invio candidato
    document.getElementById('candidate-form').addEventListener('submit', handleCandidateSubmit);

    // Funzionalità di ricerca
    document.getElementById('search-input').addEventListener('input', handleSearch);

    // Bottoni per il matching
    document.getElementById('matching-btn').addEventListener('click', performMatching);
    const matchingBtnPage = document.getElementById('matching-btn-page');
    if (matchingBtnPage) {
        matchingBtnPage.addEventListener('click', performMatching);
    }
};

// Funzione per navigare tra le pagine
function navigateToPage(pageId) {
    // Nascondi tutte le sezioni
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Disattiva tutti i link di navigazione
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Attiva la sezione selezionata
    const selectedPage = document.getElementById(pageId);
    if (selectedPage) {
        selectedPage.classList.add('active');
    }
    
    // Attiva il link di navigazione corrispondente
    const activeLink = document.querySelector(`.nav-link[data-page="${pageId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Carica i dati per la pagina selezionata
    if (pageId === 'companies') {
        displayCompanies();
    } else if (pageId === 'candidates') {
        displayCandidates();
    } else if (pageId === 'matching') {
        performMatching();
    }
}

// Mostra il modal per aggiungere/modificare un'azienda
function showCompanyModal(mode, companyId) {
    document.getElementById('company-form').reset();
    document.getElementById('company-form').dataset.mode = mode;
    
    if (mode === 'add') {
        document.getElementById('company-modal-title').textContent = 'Aggiungi Azienda';
        document.getElementById('company-form').dataset.id = '';
    } else if (mode === 'edit' && companyId) {
        document.getElementById('company-modal-title').textContent = 'Modifica Azienda';
        document.getElementById('company-form').dataset.id = companyId;
        
        // Carica i dati dell'azienda nel form
        const company = companies.find(c => c.id.toString() === companyId.toString());
        if (company) {
            document.getElementById('company-name').value = company.nome || '';
			document.getElementById('company-location').value = company.luogo_residenza || '';
            document.getElementById('company-category').value = company.categoria || '';
            document.getElementById('company-description').value = company.descrizione || '';
            document.getElementById('company-skills').value = company.competenze || '';
        }
    }
    
    // Mostra il modal
    const companyModal = new bootstrap.Modal(document.getElementById('company-modal'));
    companyModal.show();
}

// Mostra il modal per aggiungere/modificare un candidato
function showCandidateModal(mode, candidateId) {
    document.getElementById('candidate-form').reset();
    document.getElementById('candidate-form').dataset.mode = mode;
    
    if (mode === 'add') {
        document.getElementById('candidate-modal-title').textContent = 'Aggiungi Candidato';
        document.getElementById('candidate-form').dataset.id = '';
    } else if (mode === 'edit' && candidateId) {
        document.getElementById('candidate-modal-title').textContent = 'Modifica Candidato';
        document.getElementById('candidate-form').dataset.id = candidateId;
        
        // Carica i dati del candidato nel form
        const candidate = candidates.find(c => c.id.toString() === candidateId.toString());
        if (candidate) {
            document.getElementById('candidate-name').value = candidate.nome || '';
            document.getElementById('candidate-email').value = candidate.email || '';
            document.getElementById('candidate-phone').value = candidate.telefono || '';
			document.getElementById('candidate-location').value = candidate.luogo_residenza || '';
            document.getElementById('candidate-skills').value = candidate.competenze || '';
            document.getElementById('candidate-experience').value = candidate.esperienze || '';
        }
    }
    
    // Mostra il modal
    const candidateModal = new bootstrap.Modal(document.getElementById('candidate-modal'));
    candidateModal.show();
}

// ====================================
// FUNZIONI AZIENDE
// ====================================

// Carica aziende da Supabase o localStorage
async function loadCompanies() {
    if (isSupabaseConnected) {
        try {
            const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            const { data, error } = await supabase.from('companies').select('*');
            
            if (error) throw error;
            
            companies = data || [];
            displayCompanies();
        } catch (error) {
            console.error('Errore nel caricamento delle aziende:', error);
        }
    } else {
        displayCompanies();
    }
};

// Mostra aziende nell'interfaccia
function displayCompanies() {
    const companiesContainer = document.getElementById('companies-list');
    if (!companiesContainer) return;
    
    companiesContainer.innerHTML = '';

    if (companies.length === 0) {
        companiesContainer.innerHTML = '<div class="col-12"><p class="text-center text-muted">Nessuna azienda trovata</p></div>';
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
                    <p class="card-text"><strong>Competenze:</strong> ${company.competenze || ''}</p>
					<p class="card-text"><strong>Luogo di residenza:</strong> ${company.luogo_residenza || ''}</p>
                </div>
                <div class="card-footer bg-transparent">
                    <button class="btn btn-sm btn-primary edit-company" data-id="${company.id}">Modifica</button>
                    <button class="btn btn-sm btn-danger delete-company" data-id="${company.id}">Elimina</button>
                </div>
            </div>
        `;
        companiesContainer.appendChild(companyCard);
    });

    // Aggiungi event listeners ai bottoni di modifica ed eliminazione
    document.querySelectorAll('.edit-company').forEach(button => {
        button.addEventListener('click', (e) => showCompanyModal('edit', e.target.dataset.id));
    });

    document.querySelectorAll('.delete-company').forEach(button => {
        button.addEventListener('click', (e) => deleteCompany(e.target.dataset.id));
    });

    // Aggiorna statistiche dashboard
    updateDashboardStats();
};

// Gestisci l'invio del form azienda (aggiungi o modifica)
async function handleCompanySubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const mode = form.dataset.mode;
    const companyId = form.dataset.id;
    
    const company = {
        nome: document.getElementById('company-name').value,
		luogo_residenza = document.getElementById('company-location').value,
        categoria: document.getElementById('company-category').value,
        descrizione: document.getElementById('company-description').value,
        competenze: document.getElementById('company-skills').value
    };
    
    if (mode === 'add') {
        await addCompany(company);
    } else if (mode === 'edit') {
        await updateCompany(companyId, company);
    }
    
    // Chiudi il modal
    const companyModal = bootstrap.Modal.getInstance(document.getElementById('company-modal'));
    if (companyModal) {
        companyModal.hide();
    }
};

// Aggiungi una nuova azienda
async function addCompany(company) {
    if (isSupabaseConnected) {
        try {
            const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            const { data, error } = await supabase.from('companies').insert([company]);
            
            if (error) throw error;
            
            await loadCompanies();
        } catch (error) {
            console.error('Errore nell\'aggiunta dell\'azienda:', error);
        }
    } else {
        // Aggiungi in modalità demo
        company.id = Date.now().toString();
        companies.push(company);
        localStorage.setItem('companies', JSON.stringify(companies));
        displayCompanies();
    }
};

// Aggiorna un'azienda
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
            console.error('Errore nell\'aggiornamento dell\'azienda:', error);
        }
    } else {
        // Aggiorna in modalità demo
        const index = companies.findIndex(c => c.id.toString() === id.toString());
        if (index !== -1) {
            companies[index] = { ...companies[index], ...updatedCompany };
            localStorage.setItem('companies', JSON.stringify(companies));
            displayCompanies();
        }
    }
};

// Elimina un'azienda
async function deleteCompany(id) {
    if (!confirm('Sei sicuro di voler eliminare questa azienda?')) return;

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
            console.error('Errore nell\'eliminazione dell\'azienda:', error);
        }
    } else {
        // Elimina in modalità demo
        companies = companies.filter(c => c.id.toString() !== id.toString());
        localStorage.setItem('companies', JSON.stringify(companies));
        displayCompanies();
    }
};

// ====================================
// FUNZIONI CANDIDATI
// ====================================

// Carica candidati da Supabase o localStorage
async function loadCandidates() {
    if (isSupabaseConnected) {
        try {
            const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            const { data, error } = await supabase.from('candidates').select('*');
            
            if (error) throw error;
            
            candidates = data || [];
            displayCandidates();
        } catch (error) {
            console.error('Errore nel caricamento dei candidati:', error);
        }
    } else {
        displayCandidates();
    }
};

// Mostra candidati nell'interfaccia
function displayCandidates() {
    const candidatesContainer = document.getElementById('candidates-list');
    if (!candidatesContainer) return;
    
    candidatesContainer.innerHTML = '';

    if (candidates.length === 0) {
        candidatesContainer.innerHTML = '<div class="col-12"><p class="text-center text-muted">Nessun candidato trovato</p></div>';
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
                    <p class="card-text"><strong>Competenze:</strong> ${candidate.competenze || ''}</p>
				    <p class="card-text"><strong>Luogo di residenza:</strong> ${candidate.luogo_residenza || ''}</p>	
                    <p class="card-text"><strong>Esperienze:</strong> ${candidate.esperienze || ''}</p>
                </div>
                <div class="card-footer bg-transparent">
                    <button class="btn btn-sm btn-primary edit-candidate" data-id="${candidate.id}">Modifica</button>
                    <button class="btn btn-sm btn-danger delete-candidate" data-id="${candidate.id}">Elimina</button>
                </div>
            </div>
        `;
        candidatesContainer.appendChild(candidateCard);
    });

    // Aggiungi event listeners ai bottoni di modifica ed eliminazione
    document.querySelectorAll('.edit-candidate').forEach(button => {
        button.addEventListener('click', (e) => showCandidateModal('edit', e.target.dataset.id));
    });

    document.querySelectorAll('.delete-candidate').forEach(button => {
        button.addEventListener('click', (e) => deleteCandidate(e.target.dataset.id));
    });

    // Aggiorna statistiche dashboard
    updateDashboardStats();
};

// Gestisci l'invio del form candidato (aggiungi o modifica)
async function handleCandidateSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const mode = form.dataset.mode;
    const candidateId = form.dataset.id;
    
    const candidate = {
        nome: document.getElementById('candidate-name').value,
        email: document.getElementById('candidate-email').value,
        telefono: document.getElementById('candidate-phone').value,
		luogo_residenza = document.getElementById('candidate-location').value,
        competenze: document.getElementById('candidate-skills').value,
        esperienze: document.getElementById('candidate-experience').value
    };
    
    if (mode === 'add') {
        await addCandidate(candidate);
    } else if (mode === 'edit') {
        await updateCandidate(candidateId, candidate);
    }
    
    // Chiudi il modal
    const candidateModal = bootstrap.Modal.getInstance(document.getElementById('candidate-modal'));
    if (candidateModal) {
        candidateModal.hide();
    }
};

// Aggiungi un nuovo candidato
async function addCandidate(candidate) {
    if (isSupabaseConnected) {
        try {
            const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            const { data, error } = await supabase.from('candidates').insert([candidate]);
            
            if (error) throw error;
            
            await loadCandidates();
        } catch (error) {
            console.error('Errore nell\'aggiunta del candidato:', error);
        }
    } else {
        // Aggiungi in modalità demo
        candidate.id = Date.now().toString();
        candidates.push(candidate);
        localStorage.setItem('candidates', JSON.stringify(candidates));
        displayCandidates();
    }
};

// Aggiorna un candidato
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
            console.error('Errore nell\'aggiornamento del candidato:', error);
        }
    } else {
        // Aggiorna in modalità demo
        const index = candidates.findIndex(c => c.id.toString() === id.toString());
        if (index !== -1) {
            candidates[index] = { ...candidates[index], ...updatedCandidate };
            localStorage.setItem('candidates', JSON.stringify(candidates));
            displayCandidates();
        }
    }
};

// Elimina un candidato
async function deleteCandidate(id) {
    if (!confirm('Sei sicuro di voler eliminare questo candidato?')) return;

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
            console.error('Errore nell\'eliminazione del candidato:', error);
        }
    } else {
        // Elimina in modalità demo
        candidates = candidates.filter(c => c.id.toString() !== id.toString());
        localStorage.setItem('candidates', JSON.stringify(candidates));
        displayCandidates();
    }
};

// ====================================
// FUNZIONI UTILITÀ
// ====================================

// Aggiorna statistiche dashboard
function updateDashboardStats() {
    const totalCompaniesElement = document.getElementById('total-companies');
    const totalCandidatesElement = document.getElementById('total-candidates');
    
    if (totalCompaniesElement) {
        totalCompaniesElement.textContent = companies.length;
    }
    if (totalCandidatesElement) {
        totalCandidatesElement.textContent = candidates.length;
    }
};

// Gestisci funzionalità di ricerca
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    // Filtra aziende
    const filteredCompanies = companies.filter(company => 
        company.nome?.toLowerCase().includes(searchTerm) || 
		company.luogo_residenza?.toLowerCase().includes(searchTerm) ||
        company.categoria?.toLowerCase().includes(searchTerm) || 
        company.descrizione?.toLowerCase().includes(searchTerm) || 
        company.competenze?.toLowerCase().includes(searchTerm)
    );
    
    // Filtra candidati
    const filteredCandidates = candidates.filter(candidate => 
        candidate.nome?.toLowerCase().includes(searchTerm) || 
        candidate.email?.toLowerCase().includes(searchTerm) || 
		candidate.luogo_residenza?.toLowerCase().includes(searchTerm) || 
        candidate.competenze?.toLowerCase().includes(searchTerm) || 
        candidate.esperienze?.toLowerCase().includes(searchTerm)
    );
    
    // Mostra risultati filtrati
    displayFilteredResults(filteredCompanies, filteredCandidates);
};

// Mostra risultati di ricerca filtrati
function displayFilteredResults(filteredCompanies, filteredCandidates) {
    // Mostra aziende filtrate
    const companiesContainer = document.getElementById('companies-list');
    if (companiesContainer) {
        companiesContainer.innerHTML = '';

        if (filteredCompanies.length === 0) {
            companiesContainer.innerHTML = '<div class="col-12"><p class="text-center text-muted">Nessuna azienda trovata</p></div>';
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
							<p class="card-text description">${company.luogo_residenza || ''}</p>
                            <p class="card-text"><strong>Competenze:</strong> ${company.competenze || ''}</p>
                        </div>
                        <div class="card-footer bg-transparent">
                            <button class="btn btn-sm btn-primary edit-company" data-id="${company.id}">Modifica</button>
                            <button class="btn btn-sm btn-danger delete-company" data-id="${company.id}">Elimina</button>
                        </div>
                    </div>
                `;
                companiesContainer.appendChild(companyCard);
            });

            // Riaggiungi event listeners ai bottoni di modifica ed eliminazione
            document.querySelectorAll('.edit-company').forEach(button => {
                button.addEventListener('click', (e) => showCompanyModal('edit', e.target.dataset.id));
            });

            document.querySelectorAll('.delete-company').forEach(button => {
                button.addEventListener('click', (e) => deleteCompany(e.target.dataset.id));
            });
        }
    }

    // Mostra candidati filtrati
    const candidatesContainer = document.getElementById('candidates-list');
    if (candidatesContainer) {
        candidatesContainer.innerHTML = '';

        if (filteredCandidates.length === 0) {
            candidatesContainer.innerHTML = '<div class="col-12"><p class="text-center text-muted">Nessun candidato trovato</p></div>';
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
							<p class="card-text"><strong>Luogo di residenza:</strong> ${candidate.luogo_residenza || ''}</p>
                            <p class="card-text"><strong>Competenze:</strong> ${candidate.competenze || ''}</p>
                            <p class="card-text"><strong>Esperienze:</strong> ${candidate.esperienze || ''}</p>
                        </div>
                        <div class="card-footer bg-transparent">
                            <button class="btn btn-sm btn-primary edit-candidate" data-id="${candidate.id}">Modifica</button>
                            <button class="btn btn-sm btn-danger delete-candidate" data-id="${candidate.id}">Elimina</button>
                        </div>
                    </div>
                `;
                candidatesContainer.appendChild(candidateCard);
            });

            // Riaggiungi event listeners ai bottoni di modifica ed eliminazione
            document.querySelectorAll('.edit-candidate').forEach(button => {
                button.addEventListener('click', (e) => showCandidateModal('edit', e.target.dataset.id));
            });

            document.querySelectorAll('.delete-candidate').forEach(button => {
                button.addEventListener('click', (e) => deleteCandidate(e.target.dataset.id));
            });
        }
    }
};

// Esegui matching tra aziende e candidati
function performMatching() {
    const matchingResults = document.getElementById('matching-results');
    if (!matchingResults) return;
    
    matchingResults.innerHTML = '';
    
    if (companies.length === 0 || candidates.length === 0) {
        matchingResults.innerHTML = '<div class="alert alert-warning">Aggiungi sia aziende che candidati per eseguire il matching.</div>';
        return;
    }
    
    // Crea una tabella dei risultati
    const resultTable = document.createElement('table');
    resultTable.className = 'table table-bordered table-hover';
    resultTable.innerHTML = `
        <thead class="thead-light">
            <tr>
                <th>Candidato</th>
                <th>Azienda</th>
                <th>Punteggio</th>
            </tr>
        </thead>
        <tbody id="matching-table-body">
        </tbody>
    `;
    matchingResults.appendChild(resultTable);
    
    const tableBody = document.getElementById('matching-table-body');
    
    // Calcola punteggi di matching
    const matches = [];
    
    candidates.forEach(candidate => {
        companies.forEach(company => {
            const score = calculateMatchScore(candidate, company);
            if (score > 0) {
                matches.push({ candidate, company, score });
            }
        });
    });
    
    // Ordina i match per punteggio (decrescente)
    matches.sort((a, b) => b.score - a.score);
    
    // Mostra i match
    if (matches.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center">Nessun match trovato</td></tr>';
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

// Calcola punteggio di match tra un candidato e un'azienda
function calculateMatchScore(candidate, company) {
    if (!candidate.competenze || !company.competenze) return 0;
    
    // Dividi le competenze in array
    const candidateSkills = candidate.competenze.toLowerCase().split(',').map(skill => skill.trim());
    const companySkills = company.competenze.toLowerCase().split(',').map(skill => skill.trim());
    
    // Trova competenze comuni
    const commonSkills = candidateSkills.filter(skill => companySkills.includes(skill));
    
    // Calcola punteggio
    const totalUniqueSkills = new Set([...candidateSkills, ...companySkills]).size;
    const score = Math.round((commonSkills.length / totalUniqueSkills) * 100);
    
    return score;
};