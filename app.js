// ===========================
// CONFIGURAZIONE SUPABASE
// ===========================

// IMPORTANTE: Sostituisci questi placeholder con i tuoi dati reali di Supabase
const SUPABASE_URL = 'https://cqntluwuhcxovktdcowl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxbnRsdXd1aGN4b3ZrdGRjb3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2Mjk3OTUsImV4cCI6MjA2NTIwNTc5NX0.nuP0c64P9PQ8m-4LIpYs8sY1pGxgFb-PXvFma-_H_dE';

// Inizializzazione client Supabase
let supabase = null;
let isSupabaseConnected = false;

// Prova a inizializzare Supabase se le credenziali sono configurate
if (SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY_HERE') {
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        isSupabaseConnected = true;
        console.log('✅ Supabase connesso con successo');
    } catch (error) {
        console.error('❌ Errore connessione Supabase:', error);
        isSupabaseConnected = false;
    }
} else {
    console.log('⚠️ Modalità DEMO - Supabase non configurato. Usando localStorage.');
}

// ===========================
// DATI DI ESEMPIO E CATEGORIE
// ===========================

const sampleCompanies = [
    {
        id: 1,
        nome: "TechStart SRL",
        descrizione: "Startup innovativa nel settore tecnologico",
        competenze: "JavaScript, React, Node.js, Database",
        categoria: "J - Servizi di informazione e comunicazione"
    },
    {
        id: 2,
        nome: "EcoBuilding SpA",
        descrizione: "Costruzioni sostenibili e green building",
        competenze: "Ingegneria civile, Sostenibilità, CAD, Project Management",
        categoria: "F - Costruzioni"
    }
];

const sampleCandidates = [
    {
        id: 1,
        nome: "Mario Rossi",
        email: "mario.rossi@email.com",
        telefono: "333-1234567",
        competenze: "JavaScript, React, PHP, MySQL",
        esperienze: "5 anni sviluppatore web, 2 anni team leader"
    },
    {
        id: 2,
        nome: "Anna Bianchi",
        email: "anna.bianchi@email.com", 
        telefono: "347-9876543",
        competenze: "Project Management, AutoCAD, Sostenibilità, Costruzioni",
        esperienze: "8 anni ingegnere civile, 3 anni responsabile progetti"
    }
];

const atecoCategories = [
    "A - Agricoltura, silvicoltura e pesca",
    "B - Estrazione di minerali da cave e miniere", 
    "C - Attività manifatturiere",
    "D - Fornitura di energia elettrica, gas, vapore e aria condizionata",
    "E - Fornitura di acqua; reti fognarie, attività di gestione dei rifiuti e risanamento",
    "F - Costruzioni",
    "G - Commercio all'ingrosso e al dettaglio; riparazione di autoveicoli e motocicli",
    "H - Trasporto e magazzinaggio", 
    "I - Attività dei servizi di alloggio e di ristorazione",
    "J - Servizi di informazione e comunicazione",
    "K - Attività finanziarie e assicurative",
    "L - Attività immobiliari",
    "M - Attività professionali, scientifiche e tecniche",
    "N - Noleggio, agenzie di viaggio, servizi di supporto alle imprese",
    "O - Amministrazione pubblica e difesa; assicurazione sociale obbligatoria",
    "P - Istruzione",
    "Q - Sanità e assistenza sociale", 
    "R - Attività artistiche, sportive, di intrattenimento e divertimento",
    "S - Altre attività di servizi",
    "T - Attività di famiglie e convivenze come datori di lavoro per personale domestico",
    "U - Attività di organizzazioni e organismi extraterritoriali",
    "V - Attività non classificate altrove"
];

// ===========================
// STATO GLOBALE DELL'APP
// ===========================

let companies = [];
let candidates = [];
let currentMatches = [];

// ===========================
// UTILITY FUNCTIONS
// ===========================

function showLoading() {
    document.getElementById('loading-overlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.remove('active');
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

function generateId() {
    return Date.now();
}

// ===========================
// SUPABASE DATABASE OPERATIONS
// ===========================

// Operazioni Aziende
async function saveCompanyToSupabase(company) {
    if (!isSupabaseConnected) return null;
    
    try {
        const { data, error } = await supabase
            .from('companies')
            .insert([company])
            .select();
        
        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Errore salvataggio azienda:', error);
        throw error;
    }
}

async function updateCompanyInSupabase(id, company) {
    if (!isSupabaseConnected) return null;
    
    try {
        const { data, error } = await supabase
            .from('companies')
            .update(company)
            .eq('id', id)
            .select();
        
        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Errore aggiornamento azienda:', error);
        throw error;
    }
}

async function deleteCompanyFromSupabase(id) {
    if (!isSupabaseConnected) return null;
    
    try {
        const { error } = await supabase
            .from('companies')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Errore eliminazione azienda:', error);
        throw error;
    }
}

async function loadCompaniesFromSupabase() {
    if (!isSupabaseConnected) return null;
    
    try {
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Errore caricamento aziende:', error);
        throw error;
    }
}

// Operazioni Candidati
async function saveCandidateToSupabase(candidate) {
    if (!isSupabaseConnected) return null;
    
    try {
        const { data, error } = await supabase
            .from('candidates')
            .insert([candidate])
            .select();
        
        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Errore salvataggio candidato:', error);
        throw error;
    }
}

async function updateCandidateInSupabase(id, candidate) {
    if (!isSupabaseConnected) return null;
    
    try {
        const { data, error } = await supabase
            .from('candidates')
            .update(candidate)
            .eq('id', id)
            .select();
        
        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Errore aggiornamento candidato:', error);
        throw error;
    }
}

async function deleteCandidateFromSupabase(id) {
    if (!isSupabaseConnected) return null;
    
    try {
        const { error } = await supabase
            .from('candidates')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Errore eliminazione candidato:', error);
        throw error;
    }
}

async function loadCandidatesFromSupabase() {
    if (!isSupabaseConnected) return null;
    
    try {
        const { data, error } = await supabase
            .from('candidates')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Errore caricamento candidati:', error);
        throw error;
    }
}

// ===========================
// FALLBACK LOCALSTORAGE
// ===========================

function saveToLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function loadFromLocalStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

// ===========================
// DATA MANAGEMENT
// ===========================

async function loadAllData() {
    showLoading();
    
    try {
        if (isSupabaseConnected) {
            // Carica da Supabase
            const [companiesData, candidatesData] = await Promise.all([
                loadCompaniesFromSupabase(),
                loadCandidatesFromSupabase()
            ]);
            
            companies = companiesData || [];
            candidates = candidatesData || [];
        } else {
            // Modalità demo con localStorage
            companies = loadFromLocalStorage('companies') || [...sampleCompanies];
            candidates = loadFromLocalStorage('candidates') || [...sampleCandidates];
            
            // Salva i dati di esempio se non esistono
            if (!loadFromLocalStorage('companies')) {
                saveToLocalStorage('companies', companies);
            }
            if (!loadFromLocalStorage('candidates')) {
                saveToLocalStorage('candidates', candidates);
            }
        }
        
        updateDashboardStats();
        renderCompanies();
        renderCandidates();
        
    } catch (error) {
        console.error('Errore caricamento dati:', error);
        showToast('Errore nel caricamento dei dati', 'error');
        
        // Fallback ai dati locali in caso di errore
        companies = loadFromLocalStorage('companies') || [...sampleCompanies];
        candidates = loadFromLocalStorage('candidates') || [...sampleCandidates];
        updateDashboardStats();
        renderCompanies();
        renderCandidates();
    } finally {
        hideLoading();
    }
}

async function saveCompany(companyData) {
    showLoading();
    
    try {
        if (isSupabaseConnected) {
            const savedCompany = await saveCompanyToSupabase(companyData);
            companies.push(savedCompany);
        } else {
            companyData.id = generateId();
            companies.push(companyData);
            saveToLocalStorage('companies', companies);
        }
        
        updateDashboardStats();
        renderCompanies();
        showToast('Azienda salvata con successo!', 'success');
        
    } catch (error) {
        console.error('Errore salvataggio azienda:', error);
        showToast('Errore nel salvataggio dell\'azienda', 'error');
        throw error;
    } finally {
        hideLoading();
    }
}

async function updateCompany(id, companyData) {
    showLoading();
    
    try {
        if (isSupabaseConnected) {
            const updatedCompany = await updateCompanyInSupabase(id, companyData);
            const index = companies.findIndex(c => c.id === id);
            if (index !== -1) {
                companies[index] = updatedCompany;
            }
        } else {
            const index = companies.findIndex(c => c.id === id);
            if (index !== -1) {
                companies[index] = { ...companies[index], ...companyData };
                saveToLocalStorage('companies', companies);
            }
        }
        
        renderCompanies();
        showToast('Azienda aggiornata con successo!', 'success');
        
    } catch (error) {
        console.error('Errore aggiornamento azienda:', error);
        showToast('Errore nell\'aggiornamento dell\'azienda', 'error');
        throw error;
    } finally {
        hideLoading();
    }
}

async function deleteCompany(id) {
    if (!confirm('Sei sicuro di voler eliminare questa azienda?')) return;
    
    showLoading();
    
    try {
        if (isSupabaseConnected) {
            await deleteCompanyFromSupabase(id);
        }
        
        companies = companies.filter(c => c.id !== id);
        
        if (!isSupabaseConnected) {
            saveToLocalStorage('companies', companies);
        }
        
        updateDashboardStats();
        renderCompanies();
        showToast('Azienda eliminata con successo!', 'success');
        
    } catch (error) {
        console.error('Errore eliminazione azienda:', error);
        showToast('Errore nell\'eliminazione dell\'azienda', 'error');
    } finally {
        hideLoading();
    }
}

async function saveCandidate(candidateData) {
    showLoading();
    
    try {
        if (isSupabaseConnected) {
            const savedCandidate = await saveCandidateToSupabase(candidateData);
            candidates.push(savedCandidate);
        } else {
            candidateData.id = generateId();
            candidates.push(candidateData);
            saveToLocalStorage('candidates', candidates);
        }
        
        updateDashboardStats();
        renderCandidates();
        showToast('Candidato salvato con successo!', 'success');
        
    } catch (error) {
        console.error('Errore salvataggio candidato:', error);
        showToast('Errore nel salvataggio del candidato', 'error');
        throw error;
    } finally {
        hideLoading();
    }
}

async function updateCandidate(id, candidateData) {
    showLoading();
    
    try {
        if (isSupabaseConnected) {
            const updatedCandidate = await updateCandidateInSupabase(id, candidateData);
            const index = candidates.findIndex(c => c.id === id);
            if (index !== -1) {
                candidates[index] = updatedCandidate;
            }
        } else {
            const index = candidates.findIndex(c => c.id === id);
            if (index !== -1) {
                candidates[index] = { ...candidates[index], ...candidateData };
                saveToLocalStorage('candidates', candidates);
            }
        }
        
        renderCandidates();
        showToast('Candidato aggiornato con successo!', 'success');
        
    } catch (error) {
        console.error('Errore aggiornamento candidato:', error);
        showToast('Errore nell\'aggiornamento del candidato', 'error');
        throw error;
    } finally {
        hideLoading();
    }
}

async function deleteCandidate(id) {
    if (!confirm('Sei sicuro di voler eliminare questo candidato?')) return;
    
    showLoading();
    
    try {
        if (isSupabaseConnected) {
            await deleteCandidateFromSupabase(id);
        }
        
        candidates = candidates.filter(c => c.id !== id);
        
        if (!isSupabaseConnected) {
            saveToLocalStorage('candidates', candidates);
        }
        
        updateDashboardStats();
        renderCandidates();
        showToast('Candidato eliminato con successo!', 'success');
        
    } catch (error) {
        console.error('Errore eliminazione candidato:', error);
        showToast('Errore nell\'eliminazione del candidato', 'error');
    } finally {
        hideLoading();
    }
}

// ===========================
// UI RENDERING FUNCTIONS  
// ===========================

function updateDashboardStats() {
    document.getElementById('companies-count').textContent = companies.length;
    document.getElementById('candidates-count').textContent = candidates.length;
    document.getElementById('matches-count').textContent = currentMatches.length;
}

function renderCompanies() {
    const container = document.getElementById('companies-list');
    
    if (companies.length === 0) {
        container.innerHTML = '<p class="text-center">Nessuna azienda trovata. Aggiungi la prima azienda!</p>';
        return;
    }
    
    container.innerHTML = companies.map(company => `
        <div class="entity-card">
            <div class="entity-header">
                <h3 class="entity-title">${company.nome}</h3>
                <div class="entity-actions">
                    <button class="btn btn--sm btn--secondary" onclick="editCompany(${company.id})">Modifica</button>
                    <button class="btn btn--sm btn--outline" onclick="deleteCompany(${company.id})">Elimina</button>
                </div>
            </div>
            <div class="entity-info">
                ${company.descrizione ? `<p><strong>Descrizione:</strong> ${company.descrizione}</p>` : ''}
                ${company.categoria ? `<p><strong>Categoria ATECO:</strong> ${company.categoria}</p>` : ''}
            </div>
            ${company.competenze ? `
                <div class="entity-skills">
                    ${company.competenze.split(',').map(skill => 
                        `<span class="skill-tag">${skill.trim()}</span>`
                    ).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');
}

function renderCandidates() {
    const container = document.getElementById('candidates-list');
    
    if (candidates.length === 0) {
        container.innerHTML = '<p class="text-center">Nessun candidato trovato. Aggiungi il primo candidato!</p>';
        return;
    }
    
    container.innerHTML = candidates.map(candidate => `
        <div class="entity-card">
            <div class="entity-header">
                <h3 class="entity-title">${candidate.nome}</h3>
                <div class="entity-actions">
                    <button class="btn btn--sm btn--secondary" onclick="editCandidate(${candidate.id})">Modifica</button>
                    <button class="btn btn--sm btn--outline" onclick="deleteCandidate(${candidate.id})">Elimina</button>
                </div>
            </div>
            <div class="entity-info">
                ${candidate.email ? `<p><strong>Email:</strong> ${candidate.email}</p>` : ''}
                ${candidate.telefono ? `<p><strong>Telefono:</strong> ${candidate.telefono}</p>` : ''}
                ${candidate.esperienze ? `<p><strong>Esperienze:</strong> ${candidate.esperienze}</p>` : ''}
            </div>
            ${candidate.competenze ? `
                <div class="entity-skills">
                    ${candidate.competenze.split(',').map(skill => 
                        `<span class="skill-tag">${skill.trim()}</span>`
                    ).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');
}

// ===========================
// NAVIGATION FUNCTIONS
// ===========================

function showSection(sectionId) {
    // Nasconde tutte le sezioni
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Rimuove la classe active da tutti i link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Mostra la sezione richiesta
    document.getElementById(sectionId).classList.add('active');
    
    // Aggiunge la classe active al link corrispondente
    document.querySelectorAll(`[data-section="${sectionId}"]`).forEach(link => {
        link.classList.add('active');
    });
    
    // Chiude il menu mobile se aperto
    document.querySelector('.mobile-menu').classList.remove('active');
}

// ===========================
// MODAL FUNCTIONS
// ===========================

function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    
    // Reset form se è un modal con form
    const form = document.querySelector(`#${modalId} form`);
    if (form) {
        form.reset();
        form.querySelector('input[type="hidden"]').value = '';
    }
}

function showAddCompanyForm() {
    document.getElementById('company-modal-title').textContent = 'Aggiungi Azienda';
    document.getElementById('company-form').reset();
    document.getElementById('company-id').value = '';
    showModal('company-modal');
}

function showAddCandidateForm() {
    document.getElementById('candidate-modal-title').textContent = 'Aggiungi Candidato';
    document.getElementById('candidate-form').reset();
    document.getElementById('candidate-id').value = '';
    showModal('candidate-modal');
}

function editCompany(id) {
    const company = companies.find(c => c.id === id);
    if (!company) return;
    
    document.getElementById('company-modal-title').textContent = 'Modifica Azienda';
    document.getElementById('company-id').value = company.id;
    document.getElementById('company-name').value = company.nome || '';
    document.getElementById('company-description').value = company.descrizione || '';
    document.getElementById('company-skills').value = company.competenze || '';
    document.getElementById('company-ateco').value = company.categoria || '';
    
    showModal('company-modal');
}

function editCandidate(id) {
    const candidate = candidates.find(c => c.id === id);
    if (!candidate) return;
    
    document.getElementById('candidate-modal-title').textContent = 'Modifica Candidato';
    document.getElementById('candidate-id').value = candidate.id;
    document.getElementById('candidate-name').value = candidate.nome || '';
    document.getElementById('candidate-email').value = candidate.email || '';
    document.getElementById('candidate-phone').value = candidate.telefono || '';
    document.getElementById('candidate-skills').value = candidate.competenze || '';
    document.getElementById('candidate-experience').value = candidate.esperienze || '';
    
    showModal('candidate-modal');
}

// ===========================
// SEARCH AND FILTERING
// ===========================

function performSearch() {
    const searchTerm = document.getElementById('global-search').value.toLowerCase().trim();
    const typeFilter = document.getElementById('type-filter').value;
    const atecoFilter = document.getElementById('ateco-filter').value;
    
    if (!searchTerm && !typeFilter && !atecoFilter) {
        showToast('Inserisci almeno un criterio di ricerca', 'info');
        return;
    }
    
    showSection('dashboard'); // Assicura che siamo nella dashboard per vedere i risultati
    
    let results = [];
    
    // Cerca nelle aziende
    if (typeFilter === '' || typeFilter === 'company') {
        const companyResults = companies.filter(company => {
            const matchesSearch = !searchTerm || 
                company.nome.toLowerCase().includes(searchTerm) ||
                (company.descrizione && company.descrizione.toLowerCase().includes(searchTerm)) ||
                (company.competenze && company.competenze.toLowerCase().includes(searchTerm));
            
            const matchesAteco = !atecoFilter || company.categoria === atecoFilter;
            
            return matchesSearch && matchesAteco;
        }).map(company => ({ ...company, type: 'company' }));
        
        results = results.concat(companyResults);
    }
    
    // Cerca nei candidati
    if (typeFilter === '' || typeFilter === 'candidate') {
        const candidateResults = candidates.filter(candidate => {
            const matchesSearch = !searchTerm ||
                candidate.nome.toLowerCase().includes(searchTerm) ||
                (candidate.email && candidate.email.toLowerCase().includes(searchTerm)) ||
                (candidate.competenze && candidate.competenze.toLowerCase().includes(searchTerm)) ||
                (candidate.esperienze && candidate.esperienze.toLowerCase().includes(searchTerm));
            
            return matchesSearch;
        }).map(candidate => ({ ...candidate, type: 'candidate' }));
        
        results = results.concat(candidateResults);
    }
    
    renderSearchResults(results);
    
    if (results.length > 0) {
        showToast(`Trovati ${results.length} risultati`, 'success');
    } else {
        showToast('Nessun risultato trovato. Prova con altri termini.', 'info');
    }
}

function renderSearchResults(results) {
    const container = document.getElementById('search-results');
    
    if (!results || results.length === 0) {
        container.innerHTML = '<p class="text-center">Nessun risultato trovato per la ricerca.</p>';
        return;
    }
    
    container.innerHTML = `
        <h3>Risultati della ricerca (${results.length})</h3>
        ${results.map(result => `
            <div class="search-result-item">
                <span class="search-result-type ${result.type}">
                    ${result.type === 'company' ? '🏢 Azienda' : '👤 Candidato'}
                </span>
                <h4>${result.nome}</h4>
                ${result.descrizione ? `<p>${result.descrizione}</p>` : ''}
                ${result.email ? `<p><strong>Email:</strong> ${result.email}</p>` : ''}
                ${result.categoria ? `<p><strong>Categoria:</strong> ${result.categoria}</p>` : ''}
                ${result.competenze ? `
                    <div class="entity-skills">
                        ${result.competenze.split(',').map(skill => 
                            `<span class="skill-tag">${skill.trim()}</span>`
                        ).join('')}
                    </div>
                ` : ''}
                <div class="entity-actions" style="margin-top: 10px;">
                    ${result.type === 'company' 
                        ? `<button class="btn btn--sm btn--secondary" onclick="editCompany(${result.id})">Modifica</button>` 
                        : `<button class="btn btn--sm btn--secondary" onclick="editCandidate(${result.id})">Modifica</button>`
                    }
                </div>
            </div>
        `).join('')}
    `;
}

// ===========================
// MATCHING ALGORITHM
// ===========================

function calculateMatching() {
    if (companies.length === 0 || candidates.length === 0) {
        showToast('Servono almeno un\'azienda e un candidato per il matching', 'info');
        return;
    }
    
    showLoading();
    
    const matches = [];
    
    companies.forEach(company => {
        candidates.forEach(candidate => {
            const companySkills = company.competenze ? 
                company.competenze.split(',').map(s => s.trim().toLowerCase()) : [];
            const candidateSkills = candidate.competenze ? 
                candidate.competenze.split(',').map(s => s.trim().toLowerCase()) : [];
            
            const commonSkills = companySkills.filter(skill => 
                candidateSkills.includes(skill)
            );
            
            const totalSkills = new Set([...companySkills, ...candidateSkills]).size;
            const matchPercentage = totalSkills > 0 ? 
                Math.round((commonSkills.length / totalSkills) * 100) : 0;
            
            if (matchPercentage > 0) {
                matches.push({
                    company,
                    candidate,
                    percentage: matchPercentage,
                    commonSkills: commonSkills.map(s => 
                        s.charAt(0).toUpperCase() + s.slice(1)
                    )
                });
            }
        });
    });
    
    // Ordina per percentuale decrescente
    matches.sort((a, b) => b.percentage - a.percentage);
    
    currentMatches = matches;
    updateDashboardStats();
    renderMatches(matches);
    showSection('matching');
    
    hideLoading();
    
    if (matches.length === 0) {
        showToast('Nessun match trovato. Prova ad aggiungere più competenze!', 'info');
    } else {
        showToast(`Trovati ${matches.length} match!`, 'success');
    }
}

function renderMatches(matches) {
    const container = document.getElementById('matching-results');
    
    if (matches.length === 0) {
        container.innerHTML = '<p class="text-center">Nessun match trovato. Clicca "Calcola Matching" per iniziare.</p>';
        return;
    }
    
    container.innerHTML = `
        <h3>Risultati Matching (${matches.length} match trovati)</h3>
        ${matches.map(match => `
            <div class="match-card">
                <div class="match-header">
                    <h4>Match Trovato</h4>
                    <span class="match-percentage">${match.percentage}%</span>
                </div>
                <div class="match-details">
                    <div class="match-entity">
                        <h4>🏢 ${match.company.nome}</h4>
                        <p>${match.company.descrizione || 'Nessuna descrizione'}</p>
                        ${match.company.categoria ? `<p><strong>Settore:</strong> ${match.company.categoria}</p>` : ''}
                    </div>
                    <div class="match-entity">
                        <h4>👤 ${match.candidate.nome}</h4>
                        ${match.candidate.email ? `<p><strong>Email:</strong> ${match.candidate.email}</p>` : ''}
                        ${match.candidate.telefono ? `<p><strong>Tel:</strong> ${match.candidate.telefono}</p>` : ''}
                    </div>
                </div>
                ${match.commonSkills.length > 0 ? `
                    <div class="common-skills">
                        <h5>Competenze in comune:</h5>
                        <div class="entity-skills">
                            ${match.commonSkills.map(skill => 
                                `<span class="skill-tag">${skill}</span>`
                            ).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `).join('')}
    `;
}

function showMatching() {
    showSection('matching');
    calculateMatching();
}

// ===========================
// FORM HANDLERS
// ===========================

function handleCompanyForm(event) {
    event.preventDefault();
    
    const formData = {
        nome: document.getElementById('company-name').value.trim(),
        descrizione: document.getElementById('company-description').value.trim(),
        competenze: document.getElementById('company-skills').value.trim(),
        categoria: document.getElementById('company-ateco').value
    };
    
    if (!formData.nome) {
        showToast('Il nome dell\'azienda è obbligatorio', 'error');
        return;
    }
    
    const companyId = document.getElementById('company-id').value;
    
    if (companyId) {
        // Modifica azienda esistente
        updateCompany(parseInt(companyId), formData)
            .then(() => {
                closeModal('company-modal');
            })
            .catch(error => {
                console.error('Errore aggiornamento:', error);
            });
    } else {
        // Nuova azienda
        saveCompany(formData)
            .then(() => {
                closeModal('company-modal');
            })
            .catch(error => {
                console.error('Errore salvataggio:', error);
            });
    }
}

function handleCandidateForm(event) {
    event.preventDefault();
    
    const formData = {
        nome: document.getElementById('candidate-name').value.trim(),
        email: document.getElementById('candidate-email').value.trim(),
        telefono: document.getElementById('candidate-phone').value.trim(),
        competenze: document.getElementById('candidate-skills').value.trim(),
        esperienze: document.getElementById('candidate-experience').value.trim()
    };
    
    if (!formData.nome) {
        showToast('Il nome del candidato è obbligatorio', 'error');
        return;
    }
    
    const candidateId = document.getElementById('candidate-id').value;
    
    if (candidateId) {
        // Modifica candidato esistente
        updateCandidate(parseInt(candidateId), formData)
            .then(() => {
                closeModal('candidate-modal');
            })
            .catch(error => {
                console.error('Errore aggiornamento:', error);
            });
    } else {
        // Nuovo candidato
        saveCandidate(formData)
            .then(() => {
                closeModal('candidate-modal');
            })
            .catch(error => {
                console.error('Errore salvataggio:', error);
            });
    }
}

// ===========================
// INITIALIZATION
// ===========================

function populateAtecoDropdowns() {
    const companyAteco = document.getElementById('company-ateco');
    const filterAteco = document.getElementById('ateco-filter');
    
    // Pulisci le opzioni esistenti per evitare duplicati
    companyAteco.innerHTML = '<option value="">Seleziona categoria</option>';
    filterAteco.innerHTML = '<option value="">Tutte le categorie ATECO</option>';
    
    atecoCategories.forEach(category => {
        const option1 = document.createElement('option');
        option1.value = category;
        option1.textContent = category;
        companyAteco.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = category;
        option2.textContent = category;
        filterAteco.appendChild(option2);
    });
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            showSection(section);
        });
    });
    
    // Mobile menu toggle
    document.querySelector('.mobile-menu-toggle').addEventListener('click', () => {
        document.querySelector('.mobile-menu').classList.toggle('active');
    });
    
    // Form submissions
    document.getElementById('company-form').addEventListener('submit', handleCompanyForm);
    document.getElementById('candidate-form').addEventListener('submit', handleCandidateForm);
    
    // Search
    document.getElementById('global-search').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Filtri cambio
    document.getElementById('type-filter').addEventListener('change', () => {
        if (document.getElementById('global-search').value.trim()) {
            performSearch();
        }
    });
    
    document.getElementById('ateco-filter').addEventListener('change', () => {
        if (document.getElementById('global-search').value.trim() || document.getElementById('ateco-filter').value) {
            performSearch();
        }
    });
    
    // Modal close on overlay click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });
}

// ===========================
// MAIN INITIALIZATION
// ===========================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inizializzazione JobMatch...');
    
    // Setup initial UI
    populateAtecoDropdowns();
    setupEventListeners();
    
    // Load data
    await loadAllData();
    
    // Show welcome message
    if (isSupabaseConnected) {
        showToast('✅ Connesso a Supabase!', 'success');
    } else {
        showToast('⚠️ Modalità DEMO attiva - configura Supabase per la persistenza', 'info');
    }
    
    console.log('✅ JobMatch inizializzato con successo!');
});

// ===========================
// SUPABASE SETUP INSTRUCTIONS
// ===========================

console.log(`
🔧 CONFIGURAZIONE SUPABASE
==========================

Per collegare l'applicazione a Supabase, segui questi passaggi:

1. Crea un progetto su https://supabase.com
2. Vai su Settings > API nel tuo progetto Supabase
3. Copia l'URL del progetto e la chiave pubblica anon
4. Nel file app.js, sostituisci:
   - SUPABASE_URL con il tuo URL del progetto
   - SUPABASE_ANON_KEY con la tua chiave pubblica

5. Crea le seguenti tabelle nel tuo database Supabase:

-- Tabella companies
CREATE TABLE companies (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    descrizione TEXT,
    competenze TEXT,
    categoria TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella candidates  
CREATE TABLE candidates (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT,
    telefono TEXT,
    competenze TEXT,
    esperienze TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Abilita RLS (Row Level Security) se necessario
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Policy per accesso pubblico (modifica secondo le tue esigenze)
CREATE POLICY "Allow all operations" ON companies FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON candidates FOR ALL USING (true);

6. Ricarica l'applicazione e dovresti vedere "✅ Supabase connesso con successo" nella console

L'applicazione funziona anche senza Supabase in modalità DEMO con localStorage.
`);