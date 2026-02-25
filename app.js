


            let docBlobs = {
                id_card: null,
                cv: null,
                diploma: null,
                attestation: null,
                leave_justif: null
            };

let logsPage = 1;
let logsTotalPages = 1;

let currentEditingOriginal = null;

// Fonction utilitaire pour compresser les images avant l'upload
async function compressImage(file, maxWidth = 1200, quality = 0.7) {
    return new Promise((resolve) => {
        if (!file || !file.type.startsWith('image/')) {
            resolve(file); // Si ce n'est pas une image, on ne compresse pas
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convertir le canvas en Blob (fichier)
                canvas.toBlob(
                    (blob) => {
                        resolve(blob);
                    },
                    file.type, // Garder le type original de l'image (ex: image/jpeg)
                    quality // Qualité de compression (0.7 = 70%)
                );
            };
            img.onerror = () => resolve(file); // En cas d'erreur de chargement, renvoyer le fichier original
        };
        reader.onerror = () => resolve(file); // En cas d'erreur de lecture, renvoyer le fichier original
    });
}


let reportPage = 1;
let reportTotalPages = 1;

let activeFilters = {
    search: "",   
    status: "all", 
    type: "all",   
    dept: "all",
    role: "all"    
};

let searchTimeout = null; // Sert à attendre que l'utilisateur finisse de taper

    // ==========================================
// CONFIGURATION DE PERSONNALISATION (SAAS)
// ==========================================
const SIRH_CONFIG = {
    company: {
        name: "SIRH-SECURE",
        logo: "https://cdn-icons-png.flaticon.com/128/13594/13594876.png",
        supportEmail: "rh@entreprise.com"
    },
    theme: {
        primary: "#0f172a",   // Couleur Sidebar
        accent: "#2563eb",    // Couleur Boutons / Éléments actifs
        fontFamily: "'Plus Jakarta Sans', sans-serif", // Choix de police
        baseFontSize: "16px" // Taille de base (14px ou 16px recommandé)
    },

    // 3. PARAMÈTRES GPS MULTI-SIÈGES
    // Note : Cette liste pourra être remplie dynamiquement par Airtable plus tard
    gps: {
        enabled: true,         // Activer la vérification GPS ?
        strictMode: true,      // Bloquer le pointage si hors zone ?
        
        // Liste des sièges autorisés
        offices: []
    },

    // 4. MODULES ACTIFS
    features: {
        recruitment: true,
        payroll: true,
        auditLogs: true
    },

    // 5. SERVEUR (BASE API)
    apiBaseUrl: "https://sirh-supabase-v2-t03q.onrender.com/api"
};

    // --- GÉNÉRATION AUTOMATIQUE DES LIENS ---
    // (On utilise SIRH_CONFIG.apiBaseUrl pour ne rien changer en bas)
    const URL_LOGIN = `${SIRH_CONFIG.apiBaseUrl}/login`; 
    const URL_READ = `${SIRH_CONFIG.apiBaseUrl}/read`; 
    const URL_WRITE_POST = `${SIRH_CONFIG.apiBaseUrl}/write`; 
    const URL_UPDATE = `${SIRH_CONFIG.apiBaseUrl}/update`; 
    const URL_READ_LOGS = `${SIRH_CONFIG.apiBaseUrl}/read-logs`; 
    const URL_GATEKEEPER = `${SIRH_CONFIG.apiBaseUrl}/gatekeeper`; 
    const URL_BADGE_GEN = `${SIRH_CONFIG.apiBaseUrl}/badge`; 
    const URL_EMPLOYEE_UPDATE = `${SIRH_CONFIG.apiBaseUrl}/emp-update`;
    const URL_CONTRACT_GENERATE = `${SIRH_CONFIG.apiBaseUrl}/contract-gen`;
    const URL_UPLOAD_SIGNED_CONTRACT = `${SIRH_CONFIG.apiBaseUrl}/contract-upload`;
    const URL_LEAVE_REQUEST = `${SIRH_CONFIG.apiBaseUrl}/leave`;  
    const URL_CLOCK_ACTION = `${SIRH_CONFIG.apiBaseUrl}/clock`;
    const URL_READ_LEAVES = `${SIRH_CONFIG.apiBaseUrl}/read-leaves`;
    const URL_LEAVE_ACTION = `${SIRH_CONFIG.apiBaseUrl}/leave-action`;
    const URL_READ_CANDIDATES = `${SIRH_CONFIG.apiBaseUrl}/read-candidates`; 
    const URL_CANDIDATE_ACTION = `${SIRH_CONFIG.apiBaseUrl}/candidate-action`;
    const URL_READ_PAYROLL = `${SIRH_CONFIG.apiBaseUrl}/read-payroll`;
    const URL_READ_FLASH = `${SIRH_CONFIG.apiBaseUrl}/read-flash`;
    const URL_WRITE_FLASH = `${SIRH_CONFIG.apiBaseUrl}/write-flash`;
    const URL_READ_REPORT = `${SIRH_CONFIG.apiBaseUrl}/read-report`;
    const URL_GET_CONFIG = `${SIRH_CONFIG.apiBaseUrl}/read-config`;




// Initialisation du client Supabase Realtime
const supabaseUrl = "https://wdfuqsqssapcrzhjsels.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZnVxc3Fzc2FwY3J6aGpzZWxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjQ3MDksImV4cCI6MjA4NTYwMDcwOX0.G8i83W0ZcdEd9Bnp3T8rbGjlBxRcpgFdwG5k_LPd0po";

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

let chatSubscription = null;




            const SCAN_KEY = "SIGD_SECURE_2025"; 
            const URL_REDIRECT_FAILURE = "https://google.com";

            // SON DE NOTIFICATION (Bip professionnel)
            const NOTIF_SOUND = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
            let currentView = 'dash'; 
            let allLeaves = []; // Pour stocker tous les congés et les comparer
            let myPayrolls = [];
            let currentFilter = 'all';
    
            // ÉTAPE 1 : Mémoire des derniers chargements (pour économiser les crédits Make)
            let lastFetchTimes = {
                global: 0,      // Pour la config GPS
                employees: 0,   // Pour la liste de base
                leaves: 0,      // Pour les congés
                candidates: 0,  // Pour le recrutement
                payroll: 0,     // Pour la paie
                flash: 0        // Pour les annonces
            };

            const REFRESH_THRESHOLD = 300000;



// ============================================================
// MOTEUR D'IMPORT / EXPORT INTELLIGENT (PAPAPARSE)
// ============================================================
// ============================================================
// MOTEUR D'IMPORT / EXPORT INTELLIGENT (PAPAPARSE) - CORRIGÉ EXCEL FR
// ============================================================
const CSVManager = {
    // 1. Générer et télécharger un fichier modèle vide
    downloadTemplate: (headers, filename) => {
        // AJOUT ICI : { delimiter: ";" } pour forcer le point-virgule
        const csv = Papa.unparse([headers], { delimiter: ";" }); 
        CSVManager._triggerDownload(csv, filename);
    },

    // 2. Exporter un tableau de données JSON en CSV
    exportData: (dataArray, filename) => {
        if (!dataArray || dataArray.length === 0) {
            return Swal.fire('Oups', 'Aucune donnée à exporter', 'warning');
        }
        // AJOUT ICI : { delimiter: ";" } pour forcer le point-virgule
        const csv = Papa.unparse(dataArray, { delimiter: ";" });
        CSVManager._triggerDownload(csv, filename);
    },

    // 3. Lire, parser et valider un fichier importé
    parseAndValidate: (file, requiredColumns) => {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                transformHeader: h => h.trim().toLowerCase(),
                // PapaParse détecte automatiquement le séparateur en lecture, 
                // donc pas besoin de forcer ici, il lira aussi bien , que ;
                complete: (results) => {
                    if (results.errors.length > 0 && results.errors[0].code !== "TooFewFields") {
                        return reject("Le fichier est mal formaté ou corrompu.");
                    }

                    const data = results.data;
                    if (data.length === 0) return reject("Le fichier est vide.");

                    const actualHeaders = Object.keys(data[0]);
                    const missingColumns = requiredColumns.filter(reqCol => 
                        !actualHeaders.includes(reqCol.toLowerCase())
                    );

                    if (missingColumns.length > 0) {
                        return reject(`Colonnes obligatoires manquantes : ${missingColumns.join(', ')}`);
                    }

                    resolve(data);
                },
                error: (err) => reject(err.message)
            });
        });
    },

    // Fonction interne (Inchangée mais cruciale pour les accents)
    _triggerDownload: (csvContent, filename) => {
        // Le \ufeff (BOM) est OBLIGATOIRE pour qu'Excel lise les accents (é, è, à)
        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
            // Variable globale qui stockera les infos du bureau
            let companyConfig = {
                latitude: null,      
                longitude: null,     
                radius: 100,         // Rayon par défaut (mètres)
                geo_required: false  // Force le GPS ou non
            };

            let currentUser = null, employees = [], videoStream = null,  capturedBlob = null, contractBlob = null, contractStream = null, signaturePad = null;
         
            let proofStream = null;
            let offsetSuivant = null; // Mémorise le marque-page pour le lot suivant
            let currentPage = 1;
            const ITEMS_PER_PAGE = 10; // Nombre d'employés par page


            window.addEventListener('DOMContentLoaded', () => {
                applyBranding(); 
                const session = localStorage.getItem('sirh_user_session');
                const loader = document.getElementById('initial-loader');
            
                if(session) {
                    try {
                        const u = JSON.parse(session);
                        if(u && u.nom) {
                            console.log("Restauration session : " + u.nom);
                            
                            // On lance la session (qui va attendre la fin du chargement des données avant de cacher le loader)
                            setSession(u.nom, u.role, u.id, u.permissions, u.employee_type);
                            
                            // ❌ LE SETTIMEOUT QUI CACHAIT LE LOADER TROP TÔT A ÉTÉ SUPPRIMÉ ICI
                            
                        } else {
                            throw new Error("Session invalide");
                        }
                    } catch(e) { 
                        // Si erreur de lecture, on nettoie et on montre le login
                        localStorage.removeItem('sirh_user_session');
                        loader.classList.add('hidden');
                    }
                } else {
                    // Pas de session, on montre immédiatement le login
                    loader.classList.add('hidden');
                }
            });


            document.getElementById('current-date').innerText = new Date().toLocaleDateString('fr-FR');


                    let chartStatusInstance = null;
                    let chartDeptInstance = null;



const PremiumUI = {
    // Vibrations haptiques (Standard iPhone/Android)
    vibrate: (type) => {
        if (!("vibrate" in navigator)) return;
        if (type === 'success') navigator.vibrate([50, 30, 50]); // Double tap léger
        if (type === 'error') navigator.vibrate([100, 50, 100, 50, 100]); // Alerte forte
        if (type === 'click') navigator.vibrate(10); // Micro-vibration tactile
    },
    
    // Sons discrets et pros
    play: (soundName) => {
        const sounds = {
            success: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3',
            notification: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3'
        };
        const audio = new Audio(sounds[soundName]);
        audio.volume = 0.3;
        audio.play().catch(e => console.log("Audio bloqué"));
    }
};








            // Fonction mathématique pour calculer la distance entre deux points GPS
            function getDistance(lat1, lon1, lat2, lon2) {
                const R = 6371e3; // Rayon de la terre en mètres
                const φ1 = lat1 * Math.PI/180;
                const φ2 = lat2 * Math.PI/180;
                const Δφ = (lat2-lat1) * Math.PI/180;
                const Δλ = (lon2-lon1) * Math.PI/180;
                const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                        Math.cos(φ1) * Math.cos(φ2) *
                        Math.sin(Δλ/2) * Math.sin(Δλ/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                return R * c; // Résultat en mètres
            }


            
async function downloadMyBadge() {
        // 1. Sécurité : Vérifier que la liste n'est pas vide
        if (!employees || employees.length === 0) {
            return Swal.fire('Patientez', 'Le système charge vos données...', 'info');
        }

        // 2. LOGIQUE DE RECHERCHE IDENTIQUE À loadMyProfile (qui fonctionne chez toi)
        const cleanUser = currentUser.nom.toLowerCase().replace(/[\.-_]/g, ' ').trim();

        let myData = employees.find(e => {
            const cleanEmp = e.nom.toLowerCase().replace(/[\.-_]/g, ' ').trim();
            return cleanEmp.includes(cleanUser) || cleanUser.includes(cleanEmp);
        });

        // 3. Fallback par ID au cas où
        if (!myData && currentUser.id) {
            myData = employees.find(e => String(e.id) === String(currentUser.id));
        }

        // 4. Si on ne trouve toujours rien
        if (!myData) {
            console.error("Badge Error: Impossible de trouver cet l'employé", currentUser.nom);
            return Swal.fire('Erreur', 'Impossible de localiser votre fiche employé pour générer le badge.', 'error');
        }

        // 5. Lancement de la génération
        const token = localStorage.getItem('sirh_token');
        Swal.fire({ 
            title: 'Génération du badge...', 
            text: 'Veuillez patienter',
            didOpen: () => Swal.showLoading(),
            allowOutsideClick: false 
        });

        try {
            // On formate la photo pour qu'elle soit visible sur le badge
            const photoUrl = myData.photo ? formatGoogleLink(myData.photo) : '';

            // Construction de l'URL vers ton API de badge
            const url = `${URL_BADGE_GEN}?id=${encodeURIComponent(myData.id)}&nom=${encodeURIComponent(myData.nom)}&poste=${encodeURIComponent(myData.poste)}&photo=${encodeURIComponent(photoUrl)}&agent=${encodeURIComponent(currentUser.nom)}&token=${token}`;

            const response = await fetch(url);
            if (!response.ok) throw new Error("Erreur serveur");

            const htmlContent = await response.text();
            Swal.close();

            // Ouverture de la fenêtre d'impression
            const w = window.open('', '_blank', 'width=450,height=700');
            if (w) {
                w.document.open();
                w.document.write(htmlContent);
                w.document.close();
            } else {
                Swal.fire('Pop-up bloqué', 'Veuillez autoriser les fenêtres surgissantes pour voir votre badge.', 'warning');
            }

        } catch (error) {
            console.error(error);
            Swal.fire('Erreur', 'Une erreur technique est survenue.', 'error');
        }
    }









// ============================================================
// MODULE MOBILE : LOGIQUE FRONTEND
// ============================================================
async function fetchMobileLocations() {
    const container = document.getElementById('locations-grid');
    if (!container) return;
    
    // 1. On lit la préférence
    const mode = localStorage.getItem('sirh_view_pref_locations') || 'grid';

    // 2. CORRECTION ANTI-BOUCLE : On met à jour les boutons MANUELLEMENT ici
    // On n'appelle PLUS changeViewMode() pour éviter le crash.
    document.querySelectorAll(`.view-toggle-locations`).forEach(btn => {
        if(btn.dataset.mode === mode) {
            btn.classList.add('bg-blue-600', 'text-white');
            btn.classList.remove('bg-white', 'text-slate-600');
        } else {
            btn.classList.remove('bg-blue-600', 'text-white');
            btn.classList.add('bg-white', 'text-slate-600');
        }
    });
    
    try {
        const r = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/list-mobile-locations`);
        const data = await r.json();
        
        container.innerHTML = '';
        if (data.length === 0) {
            container.className = ""; 
            container.innerHTML = '<div class="col-span-full text-center text-slate-400 py-10">Aucun lieu configuré.</div>';
            return;
        }

        const canManage = currentUser.permissions?.can_manage_mobile_locations;

        if (mode === 'grid') {
            // --- VUE GRILLE ---
            container.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
            data.forEach(loc => {
                container.innerHTML += `
                    <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all relative">
                        ${canManage ? `
                        <button onclick="deleteMobileLocation('${loc.id}')" class="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors">
                            <i class="fa-solid fa-trash"></i>
                        </button>` : ''}
                        <div class="flex items-center gap-3 mb-3">
                            <div class="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-lg"><i class="fa-solid fa-location-dot"></i></div>
                            <div>
                                <h3 class="font-bold text-slate-800">${loc.name}</h3>
                                <p class="text-[10px] font-black text-slate-400 uppercase">${loc.type_location}</p>
                            </div>
                        </div>
                        <p class="text-xs text-slate-500 mb-2"><i class="fa-solid fa-map-pin mr-1"></i> ${loc.address || 'Non renseignée'}</p>
                        <div class="flex gap-2 text-[10px] font-mono bg-slate-50 p-2 rounded-lg text-slate-500">
                            <span>Lat: ${loc.latitude.toFixed(4)}</span>
                            <span>Lon: ${loc.longitude.toFixed(4)}</span>
                            <span>Rayon: ${loc.radius}m</span>
                        </div>
                    </div>`;
            });
        } else {
            // --- VUE LISTE ---
            container.className = "bg-white rounded-xl shadow-xl border border-slate-200 overflow-x-auto";
            let html = `
                <table class="w-full text-left whitespace-nowrap">
                    <thead class="bg-slate-900 text-white text-[10px] uppercase font-bold">
                        <tr>
                            <th class="px-6 py-4">Nom du Lieu</th>
                            <th class="px-6 py-4">Adresse</th>
                            <th class="px-6 py-4">Coordonnées GPS</th>
                            ${canManage ? '<th class="px-6 py-4 text-right">Actions</th>' : ''}
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">`;
            
            data.forEach(loc => {
                html += `
                    <tr class="hover:bg-slate-50 transition-colors">
                        <td class="px-6 py-4">
                            <div class="flex items-center gap-3">
                                <i class="fa-solid fa-location-dot text-blue-500 bg-blue-50 p-2 rounded-lg"></i>
                                <div>
                                    <div class="font-bold text-slate-800">${loc.name}</div>
                                    <div class="text-[9px] font-black text-slate-400 uppercase">${loc.type_location}</div>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4 text-xs text-slate-500">${loc.address || '<span class="italic opacity-50">Non renseignée</span>'}</td>
                        <td class="px-6 py-4">
                            <div class="text-[10px] font-mono bg-slate-50 px-2 py-1 rounded inline-block text-slate-500">
                                Lat: ${loc.latitude.toFixed(4)} | Lon: ${loc.longitude.toFixed(4)} | R: ${loc.radius}m
                            </div>
                        </td>
                        ${canManage ? `
                        <td class="px-6 py-4 text-right">
                            <button onclick="deleteMobileLocation('${loc.id}')" class="p-2 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </td>` : ''}
                    </tr>`;
            });
            html += `</tbody></table>`;
            container.innerHTML = html;
        }
    } catch (e) { console.error(e); }
}




async function openAddLocationModal() {
    // On demande la position actuelle pour faciliter la saisie
    let lat = '', lon = '';
    try {
        const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
    } catch (e) {}

    const { value: form } = await Swal.fire({
        title: 'Nouveau Lieu',
        html: `
            <input id="loc-name" class="swal2-input" placeholder="Nom du lieu (ex: Pharmacie X)">
            <input id="loc-addr" class="swal2-input" placeholder="Adresse (facultatif)">
            <select id="loc-type" class="swal2-input">
                <option value="PHARMACIE">Pharmacie</option>
                <option value="CENTRE_SANTE">Centre de Santé</option>
                <option value="CLIENT">Client / Partenaire</option>
                <option value="SITE_GARDE">Site de Garde (Sécurité)</option>
            </select>
            <div class="grid grid-cols-2 gap-2">
                <input id="loc-lat" class="swal2-input" placeholder="Latitude" value="${lat}">
                <input id="loc-lon" class="swal2-input" placeholder="Longitude" value="${lon}">
            </div>
            <input id="loc-radius" type="number" class="swal2-input" placeholder="Rayon (mètres)" value="50">
        `,
        focusConfirm: false,
        showCancelButton: true,
        preConfirm: () => {
            return {
                name: document.getElementById('loc-name').value,
                address: document.getElementById('loc-addr').value,
                type_location: document.getElementById('loc-type').value,
                latitude: document.getElementById('loc-lat').value,
                longitude: document.getElementById('loc-lon').value,
                radius: document.getElementById('loc-radius').value
            }
        }
    });

    if (form) {
        await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/add-mobile-location`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(form)
        });
        fetchMobileLocations();
        Swal.fire('Ajouté !', '', 'success');
    }
}

async function deleteMobileLocation(id) {
    if(await Swal.fire({title:'Supprimer ?', icon:'warning', showCancelButton:true}).then(r => r.isConfirmed)) {
        await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/delete-mobile-location`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({id})
        });
        fetchMobileLocations();
    }
}


// ============================================================
// VUE AGENDA (TIMELINE) - ADAPTATIVE (Délégué vs Manager)
// ============================================================
// ============================================================
// VUE AGENDA (DESIGN COMPACT & GRILLE)
// ============================================================

async function fetchMobileSchedules() {
    const container = document.getElementById('planning-timeline-container');
    if (!container) return;

    // Loader discret
    container.innerHTML = '<div class="flex flex-col items-center justify-center py-10"><i class="fa-solid fa-circle-notch fa-spin text-blue-500 text-2xl"></i><p class="text-xs text-slate-400 mt-2 font-bold uppercase">Chargement...</p></div>';

    try {
        const r = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/list-schedules`);
        const data = await r.json();

        container.innerHTML = '';
        
        // Message si vide
        if (data.length === 0) {
            container.innerHTML = `
                <div class="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
                    <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3 mx-auto text-slate-300">
                        <i class="fa-regular fa-calendar text-2xl"></i>
                    </div>
                    <p class="text-sm font-bold text-slate-500">Aucune mission planifiée.</p>
                </div>`;
            return;
        }

        // 1. GROUPEMENT PAR DATE
        const grouped = {};
        data.forEach(s => {
            const dateKey = s.schedule_date.split('T')[0];
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push(s);
        });

        // On trie les dates (les plus récentes en haut, ou l'inverse selon ton besoin. Ici: Chronologique)
        const sortedDates = Object.keys(grouped).sort(); 

        let html = '';

        sortedDates.forEach(date => {
            const dateObj = new Date(date);
            // Format : Lundi 24 Février
            const dateStr = dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
            
            const todayStr = new Date().toISOString().split('T')[0];
            const isToday = (todayStr === date);
            
            // Badge "Aujourd'hui"
            const badgeToday = isToday ? `<span class="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded uppercase font-black tracking-wider ml-2">Aujourd'hui</span>` : '';
            const headerColor = isToday ? 'text-slate-800' : 'text-slate-500';

            // DÉBUT BLOC DATE
            html += `
                <div class="mb-8 animate-fadeIn">
                    <div class="flex items-center mb-4 px-1">
                        <i class="fa-regular fa-calendar-check mr-2 ${isToday ? 'text-blue-600' : 'text-slate-300'}"></i>
                        <h3 class="font-black text-sm uppercase tracking-wide ${headerColor}">
                            ${dateStr}
                        </h3>
                        ${badgeToday}
                    </div>
                    
                    <!-- GRILLE DES CARTES (Responsive: 1 col mobile, 2 col tablette, 3 col PC) -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            `;

            grouped[date].forEach(mission => {
                const isMe = (String(mission.employee_id) === String(currentUser.id));
                
                // --- LOGIQUE VISUELLE (COULEURS & STATUTS) ---
                let borderClass = 'border-l-slate-300'; // Gris (En attente)
                let bgClass = 'bg-white';
                let iconStatus = '<i class="fa-regular fa-circle text-slate-300"></i>';
                let timeClass = 'text-slate-600';
                let statusBadge = '';

                if (mission.status === 'COMPLETED') {
                    borderClass = 'border-l-emerald-500'; // Vert (Fait)
                    bgClass = 'bg-emerald-50/30';
                    iconStatus = '<i class="fa-solid fa-circle-check text-emerald-500"></i>';
                    timeClass = 'text-emerald-700 line-through decoration-emerald-300';
                    statusBadge = '<span class="text-[9px] font-black text-emerald-600 uppercase bg-emerald-100 px-1.5 py-0.5 rounded">Terminé</span>';
                } 
                else if (mission.status === 'CHECKED_IN') {
                    borderClass = 'border-l-blue-600'; // Bleu (En cours)
                    bgClass = 'bg-white shadow-md ring-1 ring-blue-100';
                    iconStatus = '<i class="fa-solid fa-spinner fa-spin text-blue-600"></i>';
                    timeClass = 'text-blue-600 font-bold';
                    statusBadge = '<span class="text-[9px] font-black text-blue-600 uppercase bg-blue-100 px-1.5 py-0.5 rounded animate-pulse">En cours</span>';
                }
                else if (mission.status === 'MISSED') {
                    borderClass = 'border-l-red-500'; // Rouge (Raté)
                    bgClass = 'bg-red-50/30';
                    iconStatus = '<i class="fa-solid fa-circle-xmark text-red-500"></i>';
                    statusBadge = '<span class="text-[9px] font-black text-red-600 uppercase bg-red-100 px-1.5 py-0.5 rounded">Manqué</span>';
                }

                // Heure propre (09:00)
                const timeStr = mission.start_time.slice(0, 5);

                // --- CARTE COMPACTE ---
                html += `
                    <div class="relative p-4 rounded-xl border border-slate-200 border-l-4 ${borderClass} ${bgClass} shadow-sm hover:shadow-md transition-all group flex flex-col justify-between min-h-[140px]">
                        
                        <!-- HAUT : HEURE & STATUT -->
                        <div class="flex justify-between items-start mb-2">
                            <div class="flex items-center gap-2">
                                ${iconStatus}
                                <span class="font-mono text-sm ${timeClass}">${timeStr}</span>
                            </div>
                            ${statusBadge}
                        </div>

                        <!-- MILIEU : INFOS PRINCIPALES -->
                        <div class="mb-3">
                            <h4 class="font-extrabold text-slate-800 text-sm leading-tight mb-1 line-clamp-1" title="${mission.location_name}">
                                ${mission.location_name}
                            </h4>
                            
                            ${mission.prescripteur_nom ? `
                                <div class="flex items-center gap-1.5 text-xs text-blue-600 font-bold mb-1">
                                    <i class="fa-solid fa-user-doctor text-[10px]"></i>
                                    <span class="truncate">${mission.prescripteur_nom}</span>
                                </div>
                            ` : '<div class="h-4"></div>'} <!-- Espace vide pour alignement si pas de médecin -->

                            <p class="text-[10px] text-slate-400 truncate flex items-center gap-1">
                                <i class="fa-solid fa-map-pin"></i> ${mission.location_address || 'Adresse standard'}
                            </p>
                        </div>

                        <!-- BAS : ACTIONS (ICÔNES) -->
                        <div class="flex items-center justify-between mt-auto pt-3 border-t border-slate-100/50">
                            <!-- Notes (si présentes) -->
                            <div class="flex-1">
                                ${mission.notes ? `<i class="fa-regular fa-note-sticky text-slate-400 text-xs" title="${mission.notes}"></i>` : ''}
                            </div>

                            <!-- BOUTONS D'ACTION (Seulement pour moi et si pas fini) -->
                            ${(isMe && mission.status !== 'COMPLETED') ? `
                                <div class="flex gap-2">
                                    <button onclick="deleteSchedule('${mission.id}')" 
                                        class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Annuler">
                                        <i class="fa-solid fa-trash-can text-xs"></i>
                                    </button>

                                    <button onclick="startMissionFromAgenda('${mission.id}', '${mission.location_id}', '${mission.prescripteur_id || ''}', '${mission.notes ? mission.notes.replace(/'/g, "\\'") : ''}')" 
                                        class="px-3 h-8 bg-slate-900 text-white rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase shadow-md hover:bg-blue-600 transition-all active:scale-95">
                                        <i class="fa-solid fa-play"></i> Go
                                    </button>
                                </div>
                            ` : ''}

                            <!-- INFO MANAGER (Si ce n'est pas moi) -->
                            ${(!isMe) ? `
                                <div class="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded text-[9px] font-bold text-slate-500">
                                    <div class="w-4 h-4 bg-slate-300 rounded-full flex items-center justify-center text-[8px] text-white">${mission.employee_name.charAt(0)}</div>
                                    <span class="uppercase truncate max-w-[80px]">${mission.employee_name}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            });

            html += `</div></div>`; // Fin Grille & Fin Bloc Date
        });

        container.innerHTML = html;

    } catch (e) {
        console.error(e);
        container.innerHTML = '<div class="text-center text-red-500 py-10 font-bold text-xs">Erreur connexion agenda.</div>';
    }
}

// FONCTION INTELLIGENTE : LANCE LE POINTAGE DIRECTEMENT DEPUIS L'AGENDA
async function startMissionFromAgenda(missionId, locationId, presId, notes) {
    
    // 1. Confirmation rapide
    const confirm = await Swal.fire({
        title: 'Démarrer la visite ?',
        text: "Cela va valider votre ENTRÉE immédiatement.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        confirmButtonText: 'Oui, j\'y suis !'
    });

    if (!confirm.isConfirmed) return;

    Swal.fire({ title: 'Validation GPS...', didOpen: () => Swal.showLoading() });

    try {
        // 2. Récupération GPS & IP
        const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
        const currentGps = `${pos.coords.latitude},${pos.coords.longitude}`;
        const ipRes = await fetch('https://api.ipify.org?format=json').then(r => r.json());

        // 3. Envoi au serveur (CLOCK IN + LIEN AVEC LE PLANNING)
        const fd = new FormData();
        fd.append('id', currentUser.id);
        fd.append('action', 'CLOCK_IN'); // On force l'entrée
        fd.append('gps', currentGps);
        fd.append('ip', ipRes.ip);
        fd.append('agent', currentUser.nom);
        
        // C'EST ICI QUE TOUT SE JOUE : On envoie l'ID du planning et du lieu prévu
        fd.append('schedule_id', missionId); 
        fd.append('forced_location_id', locationId); // Pour dire au serveur "C'est ce lieu là, ne cherche pas"

        const response = await secureFetch(URL_CLOCK_ACTION, { method: 'POST', body: fd });
        const resData = await response.json();

        if (response.ok) {
            // 4. MÉMOIRE LOCALE : On retient les infos pour le CLOCK OUT tout à l'heure
            localStorage.setItem('active_mission_context', JSON.stringify({
                missionId: missionId,
                prescripteurId: presId, // On retient le médecin
                preNotes: notes // On retient la note préparatoire
            }));

            // 5. Mise à jour Interface
            localStorage.setItem(`clock_status_${currentUser.id}`, 'IN');
            updateClockUI('IN');
            
            Swal.fire({
                icon: 'success',
                title: 'Visite démarrée !',
                text: `Bon courage pour le ${presId ? 'Dr sélectionné' : 'RDV'}.`,
                timer: 2000,
                showConfirmButton: false
            });

            switchView('dash'); // Retour accueil
        } else {
            throw new Error(resData.error);
        }

    } catch (e) {
        console.error(e);
        Swal.fire('Erreur', e.message || "Impossible de démarrer (Vérifiez le GPS).", 'error');
    }
}


// --- FONCTION POUR CRÉER UNE MISSION (PLANNING) ---
async function openAddScheduleModal() {
    Swal.fire({ title: 'Chargement des données...', didOpen: () => Swal.showLoading() });

    try {
        // 1. On charge : Employés (si manager), Lieux, ET Prescripteurs
        const promises = [
            secureFetch(`${SIRH_CONFIG.apiBaseUrl}/list-mobile-locations`),
            secureFetch(`${SIRH_CONFIG.apiBaseUrl}/list-prescripteurs`)
        ];

        // Si je suis chef, je charge aussi la liste des employés pour leur assigner des tâches
        const isManager = (currentUser.role !== 'EMPLOYEE');
        if (isManager) {
            promises.push(secureFetch(`${SIRH_CONFIG.apiBaseUrl}/read?limit=1000&status=Actif`));
        }

        const responses = await Promise.all(promises);
        const locs = await responses[0].json();
        const pres = await responses[1].json();
        const emps = isManager ? (await responses[2].json()).data : [];

        // 2. Construction des listes déroulantes
        
        // Liste Lieux
        let locOptions = locs.map(l => `<option value="${l.id}">${l.name}</option>`).join('');
        
        // Liste Médecins (Avec recherche possible plus tard, pour l'instant simple select)
        let presOptions = `<option value="">-- Aucun médecin précis --</option>` + 
                          pres.map(p => `<option value="${p.id}">${p.nom_complet} (${p.fonction})</option>`).join('');

        // Liste Employés (Seulement si Manager, sinon c'est MOI)
        let empFieldHtml = '';
        if (isManager) {
            let empOptions = emps.map(e => `<option value="${e.id}">${e.nom}</option>`).join('');
            empFieldHtml = `
                <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">Pour qui ?</label>
                <select id="sched-emp" class="swal2-input !mt-0">${empOptions}</select>
            `;
        } else {
            // Champ caché pour l'ID de l'employé connecté
            empFieldHtml = `<input type="hidden" id="sched-emp" value="${currentUser.id}">`;
        }

        // 3. LA MODALE DE PLANIFICATION (Style "Netreps" amélioré)
        const { value: form } = await Swal.fire({
            title: 'Planifier une visite',
            customClass: { popup: 'wide-modal' }, 

    html: `
    <div class="text-left space-y-6">
        <!-- Section Qui -->
        <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <label class="block text-[10px] font-black text-slate-400 uppercase mb-2">Assignation</label>
            ${empFieldHtml}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Gauche : Quand -->
            <div class="space-y-4">
                <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <label class="block text-[9px] font-black text-slate-400 uppercase mb-1">Date de la visite</label>
                    <input id="sched-date" type="date" class="w-full outline-none font-bold text-slate-700" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <label class="block text-[9px] font-black text-slate-400 uppercase mb-1">Heure de passage</label>
                    <input id="sched-start" type="time" class="w-full outline-none font-bold text-slate-700" value="09:00">
                </div>
            </div>

            <!-- Droite : Où -->
            <div class="space-y-4">
                <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <label class="block text-[9px] font-black text-slate-400 uppercase mb-1">Lieu / Pharmacie</label>
                    <select id="sched-loc" class="w-full outline-none font-bold text-blue-600 bg-transparent">${locOptions}</select>
                </div>
                <div class="bg-blue-50 p-3 rounded-xl border border-blue-100 shadow-sm">
                    <label class="block text-[9px] font-black text-blue-400 uppercase mb-1">Médecin à rencontrer</label>
                    <select id="sched-pres" class="w-full outline-none font-black text-blue-800 bg-transparent">${presOptions}</select>
                </div>
            </div>
        </div>

        <!-- Bas : Note -->
        <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <label class="block text-[10px] font-black text-slate-400 uppercase mb-2">Objectif de la mission</label>
            <textarea id="sched-notes" class="w-full bg-transparent outline-none text-sm h-20 resize-none" placeholder="Ex: Présentation du nouveau produit..."></textarea>
        </div>
    </div>
`,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Ajouter à mon agenda',
            confirmButtonColor: '#4f46e5',
            showCancelButton: true,
            cancelButtonText: 'Fermer',
            cancelButtonColor: '#94a3b8', 
            preConfirm: () => {
                return {
                    employee_id: document.getElementById('sched-emp').value,
                    location_id: document.getElementById('sched-loc').value,
                    prescripteur_id: document.getElementById('sched-pres').value || null, // On récupère le médecin
                    schedule_date: document.getElementById('sched-date').value,
                    start_time: document.getElementById('sched-start').value,
                    end_time: '18:00', 
                    notes: document.getElementById('sched-notes').value
                }
            }
        });

        // 4. Envoi au serveur
        if (form) {
            Swal.fire({ title: 'Planification...', didOpen: () => Swal.showLoading() });
            const response = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/add-schedule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (response.ok) {
                Swal.fire({ icon: 'success', title: 'Planifié !', timer: 1500, showConfirmButton: false });
                fetchMobileSchedules(); // Recharge la timeline
            }
        }
    } catch (e) {
        console.error(e);
        Swal.fire('Erreur', 'Impossible de charger les données.', 'error');
    }
}









async function deleteSchedule(id) {
    if(await Swal.fire({title:'Annuler cette mission ?', icon:'warning', showCancelButton:true}).then(r => r.isConfirmed)) {
        await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/delete-schedule`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({id})
        });
        fetchMobileSchedules();
    }
}


























    async function requestNotificationPermission() {
        if (!("Notification" in window)) {
            console.log("Ce navigateur ne supporte pas les notifications.");
            return;
        }

        if (Notification.permission !== "granted") {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                console.log("Permission notifications accordée !");
            }
        }
    }



async function secureFetch(url, options = {}) {
    // 0. SÉCURITÉ RÉSEAU IMMÉDIATE
    if (!navigator.onLine) {
        throw new Error("Vous êtes hors ligne. Vérifiez votre connexion internet.");
    }

    const token = localStorage.getItem('sirh_token');
    const headers = options.headers || {};
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const TIMEOUT_MS = 120000; 
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS); 

    try {
        // 2. APPEL RÉSEAU
        const response = await fetch(url, { 
            ...options, 
            headers, 
            signal: controller.signal 
        });

        clearTimeout(timeoutId); 

        // 3. GESTION DES ERREURS HTTP
        if (!response.ok) {
            let errorMessage = `Erreur serveur (${response.status})`;
            let specificMessage = null; 

            try {
                const errData = await response.json();
                if (errData.error) {
                    errorMessage = errData.error;
                    specificMessage = errData.error; 
                }
            } catch (e) { }

            // --- CORRECTION : DÉTECTION ET TRAITEMENT DE L'EXPIRATION ---
// --- CORRECTION : DÉTECTION ET TRAITEMENT DE L'EXPIRATION ---
            if (response.status === 401) { // 🛑 ON A RETIRÉ LE 403 ICI
                // 1. On informe l'utilisateur
                Swal.fire({
                    title: 'Session expirée',
                    text: 'Pour votre sécurité, vous avez été déconnecté. Veuillez vous reconnecter.',
                    icon: 'info',
                    confirmButtonColor: '#0f172a'
                });

                // 2. On lance la déconnexion
                if (typeof handleLogout === 'function') {
                    handleLogout(); 
                }
                throw new Error("Session expirée. Veuillez vous reconnecter.");
            }

            // NOUVEAU BLOC POUR LE 403 (On bloque l'action, mais on ne déconnecte pas !)
            if (response.status === 403) {
                console.warn("Accès refusé : L'utilisateur n'a pas la permission requise.");
                throw new Error(specificMessage || "Accès refusé. Vous n'avez pas les droits nécessaires.");
            }
            
            throw new Error(errorMessage);
        }

        return response;

    } catch (error) {
        // 4. GESTION DES ERREURS TECHNIQUES
        if (error.name === 'AbortError') {
            throw new Error("Le serveur démarre (Délai > 2min). Veuillez réessayer dans 30 secondes.");
        }
        if (error.message.includes('Failed to fetch')) {
            throw new Error("Erreur de connexion. Vérifiez votre accès internet.");
        }
        throw error; 
    }
}




async function handleLogin(e) { 
    e.preventDefault(); 
    // Déverrouille l'audio pour mobile
    NOTIF_SOUND.play().then(() => { NOTIF_SOUND.pause(); NOTIF_SOUND.currentTime = 0; }).catch(() => {});
    
    const u = document.getElementById('login-user').value.trim();
    const p = document.getElementById('login-pass').value.trim();
    const btn = document.getElementById('btn-login');
    const originalBtnText = btn.innerHTML; 
    
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Connexion...'; 
    btn.disabled = true;
    btn.classList.add('opacity-50', 'cursor-not-allowed');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
        const response = await fetch(`${URL_LOGIN}?u=${encodeURIComponent(u.toLowerCase())}&p=${encodeURIComponent(p)}`, { signal: controller.signal });
        clearTimeout(timeoutId); 
        
        const d = await response.json();
        
        // --- CAS 1 : CONNEXION RÉUSSIE ---
        if(d.status === "success") { 
            if(d.token) localStorage.setItem('sirh_token', d.token);
            
            let r = d.role || "EMPLOYEE"; if(Array.isArray(r)) r = r[0]; 
            
            const userData = { 
                nom: d.nom || u, 
                role: String(r).toUpperCase(), 
                id: d.id,
                employee_type: d.employee_type || 'OFFICE', 
                permissions: d.permissions || {} 
            };
            
            localStorage.setItem('sirh_user_session', JSON.stringify(userData));

            const Toast = Swal.mixin({
                toast: true,
                position: 'top', 
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
                background: '#ffffff',
                color: '#1e293b'
            });
            
            Toast.fire({
                icon: 'success',
                title: 'Connexion réussie',
                text: 'Bienvenue ' + userData.nom
            });
            
            await setSession(userData.nom, userData.role, userData.id, d.permissions, userData.employee_type); 
        }
        
        // --- CAS 2 : COMPTE RÉVOQUÉ (Employé Sorti) ---
        else if (d.status === "revoked") {
            Swal.fire({
                title: 'Accès Révoqué',
                text: d.message,
                icon: 'warning',
                confirmButtonColor: '#0f172a'
            });
        }
        
        // --- CAS 3 : IDENTIFIANTS INCORRECTS ---
        else { 
            Swal.fire('Refusé', d.message || 'Identifiant ou mot de passe incorrect', 'error'); 
        }

    } catch (error) {
        console.error(error);
        if (error.name === 'AbortError') { 
            Swal.fire('Délai dépassé', 'Le serveur démarre. Cela peut prendre 30 à 60 secondes. Veuillez réessayer.', 'warning'); 
        } else if (!navigator.onLine) {
            Swal.fire('Hors Ligne', 'Vous semblez déconnecté d\'internet.', 'error');
        } else { 
            Swal.fire('Erreur Système', 'Impossible de contacter le serveur. Réessayez.', 'error'); 
        }
    } finally {
        btn.innerHTML = originalBtnText; 
        btn.disabled = false; 
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}


async function refreshAllData(force = false) {
    const now = Date.now();
    const icon = document.getElementById('refresh-icon'); 
    if(icon) icon.classList.add('fa-spin');

    if(force) {
        const Toast = Swal.mixin({toast: true, position: 'top-end', showConfirmButton: false});
        Toast.fire({icon: 'info', title: 'Actualisation...'});
    }

    try {
        const tasks = [];
        const perms = currentUser.permissions || {}; 

        // 1. TACHES PUBLIQUES (GPS, Flash messages)
        if (force || (now - lastFetchTimes.global > 3600000)) {
            tasks.push(fetchCompanyConfig().catch(e => console.warn("GPS ignoré", e)));
        }
        tasks.push(fetchFlashMessage().catch(e => console.warn("Flash ignoré", e)));

        // 2. TACHES LIÉES À LA LISTE DES EMPLOYÉS (RH / Admin / Comptable)
        if (perms.can_see_employees) {
            if (force || employees.length === 0 || (now - lastFetchTimes.employees > REFRESH_THRESHOLD)) {
                // IMPORTANT : On ajoute la promesse de fetchData
                tasks.push(fetchData(false, 1));
                lastFetchTimes.employees = now;
            }
        }

        // 3. TACHES LIÉES AU DASHBOARD (Stats & Live Tracker)
        if (perms.can_see_dashboard) {
            tasks.push(fetchLiveAttendance());
        }

        // 4. TÂCHE ROBOT (Alertes)
        if (perms.can_send_announcements) {
            tasks.push(triggerRobotCheck());
        }

        // 5. TACHES SPÉCIFIQUES AUX VUES ACTIVES
        if (currentView === 'recruitment' && perms.can_see_recruitment) {
            tasks.push(fetchCandidates());
        }
        
        if (currentView === 'logs' && perms.can_see_audit) {
            tasks.push(fetchLogs());
        }
        
        // 6. ESPACE PERSONNEL
        if (currentView === 'my-profile') {
            tasks.push(fetchPayrollData());    
            tasks.push(fetchLeaveRequests());  
        }
        
        // 7. GESTION MANAGERIALE (Validation des congés)
        if (currentUser.role !== 'EMPLOYEE' && !perms.can_see_employees) {
            tasks.push(fetchLeaveRequests()); 
        }

        // --- ATTENTE DE TOUTES LES TÂCHES ---
        await Promise.all(tasks);
        
        // 8. Rendu final des graphiques (Si on est sur le Dashboard et qu'on a le droit)
        if (currentView === 'dash' && perms.can_see_dashboard) {
            // On attend que les graphiques soient dessinés
            await renderCharts();
        }

        if(force) {
            const Toast = Swal.mixin({toast: true, position: 'top-end', showConfirmButton: false, timer: 2000});
            Toast.fire({icon: 'success', title: 'Données à jour !'});
        }

        return true; // On confirme que tout est prêt

    } catch (error) {
        console.error("Erreur Sync:", error);
        return false;
    } finally {
        if(icon) setTimeout(() => icon.classList.remove('fa-spin'), 500);
    }
}







async function setSession(n, r, id, perms, type) { 
            
    currentUser = { nom: n, role: r, id: id, permissions: perms, employee_type: type || 'OFFICE' };
    
    // On cache les éléments par défaut (Permissions/Groupes)
    document.querySelectorAll('[data-perm]').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.menu-group').forEach(group => group.style.display = 'none');
    
    applyBranding();
    
    // 1. Préparation immédiate de l'écran
    const loginScreen = document.getElementById('login-screen');
    const loader = document.getElementById('initial-loader');
    const appLayout = document.getElementById('app-layout');

    if(loginScreen) loginScreen.classList.add('hidden');
    
    // On s'assure que le loader est bien au-dessus et opaque (fond bleu nuit actif)
    if (loader) {
        loader.classList.remove('fade-out', 'hidden');
        loader.style.opacity = '1';
        loader.style.zIndex = '9999';
    }
    
    // Remplissage des infos d'identité
    document.getElementById('name-display').innerText = n; 
    document.getElementById('role-display').innerText = r; 
    document.getElementById('avatar-display').innerText = n[0]; 
    document.body.className = "text-slate-900 overflow-hidden h-screen w-screen role-" + r.toLowerCase(); 

    // 2. Injecter les SKELETONS (Pendant que le loader cache tout)
    const skeletonRow = `<tr class="border-b"><td class="p-4 flex gap-3 items-center"><div class="w-10 h-10 rounded-full skeleton"></div><div class="space-y-2"><div class="h-3 w-24 rounded skeleton"></div></div></td><td class="p-4"><div class="h-3 w-32 rounded skeleton"></div></td><td class="p-4"><div class="h-6 w-16 rounded-lg skeleton"></div></td><td class="p-4"></td></tr>`;
    ['full-body', 'dashboard-body'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = skeletonRow.repeat(6);
    });

    try {
        // 3. CHARGEMENT DES DONNÉES CRITIQUES
        // Le logo et la barre de chargement restent ici tant que le serveur n'a pas répondu
        await Promise.all([
            refreshAllData(false), 
            syncClockInterface(), 
            fetchAndPopulateDepartments(),
            syncAllRoleSelects(),
            fetchContractTemplatesForSelection()
        ]);

        await applyModulesUI(); 
        applyPermissionsUI(perms);

        // 4. NAVIGATION PRÉEMPTIVE (On choisit la vue SOUS le loader)
        const savedView = localStorage.getItem('sirh_last_view');
        const buttonSelector = `button[onclick="switchView('${savedView}')"]`;
        const buttonExists = savedView ? document.querySelector(buttonSelector) : null;

        if (savedView && buttonExists && document.getElementById('view-' + savedView)) {
            switchView(savedView);
        } else {
            const hasDashAccess = document.querySelector(`button[onclick="switchView('dash')"]`);
            hasDashAccess ? switchView('dash') : switchView('my-profile');
        }

        // --- SEULE MODIFICATION ICI : On force la fermeture du menu sur mobile AVANT d'afficher l'app ---
        if (window.innerWidth < 768) {
            document.getElementById('sidebar').classList.add('-translate-x-full');
            const overlay = document.getElementById('sidebar-overlay');
            if (overlay) overlay.classList.add('hidden');
        }
        // ------------------------------------------------------------------------------------------------

        // 5. PHASE DE RÉVÉLATION (Zéro écran vide)
        // On active l'affichage technique de l'app (mais elle est à opacity: 0 via CSS)
        appLayout.classList.remove('hidden'); 

        // On utilise le double cycle pour garantir que le navigateur a "peint" l'app en mémoire
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                // L'application est prête en arrière-plan. On lance l'échange visuel.
                
                // On rend l'application opaque (ready)
                appLayout.classList.add('ready');

                if (loader) {
                    // On lance l'animation de sortie du loader (le logo et la barre s'effacent doucement)
                    loader.classList.add('fade-out');
                    
                    setTimeout(() => {
                        loader.classList.add('hidden');
                        document.body.style.backgroundColor = "#f1f5f9"; 
                        document.body.style.overflow = 'auto'; // On libère le scroll
                    }, 600); // Délai calé sur la transition CSS
                }
            });
        });

        applyWidgetPreferences(); 
        requestNotificationPermission();
        initDarkMode();
        
    } catch (e) {
        console.error("Erreur critique au démarrage de l'app:", e);
        if(loader) loader.classList.add('hidden');
        if(appLayout) appLayout.classList.remove('hidden');
        Swal.fire('Erreur', 'Données chargées avec des erreurs mineures.', 'warning');
    }
}



// ============================================================
// GESTION DU MOT DE PASSE OUBLIÉ (FLOW EN 2 ÉTAPES) ✅
// ============================================================
async function handleForgotPassword() {
    // ÉTAPE 1 : Demander l'email avec un design épuré
    const { value: email } = await Swal.fire({
        title: 'Mot de passe oublié ?',
        html: `
            <div class="text-center px-2">
                <p class="text-slate-500 text-sm mb-8 leading-relaxed">
                    Entrez votre email professionnel. Nous vous enverrons un <b>code de sécurité</b> pour réinitialiser votre accès.
                </p>
                <div class="text-left">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Adresse Email</label>
                    <input type="email" id="swal-email-input" class="swal2-input !m-0 !w-full" placeholder="nom@entreprise.com">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Envoyer le code',
        cancelButtonText: 'Annuler',
        confirmButtonColor: '#2563eb',
        reverseButtons: true, // Annuler à gauche, Envoyer à droite
        customClass: {
            popup: 'rounded-[2rem]',
            confirmButton: 'rounded-xl px-6 py-3 font-bold',
            cancelButton: 'rounded-xl px-6 py-3 font-bold'
        },
        preConfirm: () => {
            const email = document.getElementById('swal-email-input').value;
            if (!email || !email.includes('@')) {
                Swal.showValidationMessage('Veuillez entrer une adresse email valide');
                return false;
            }
            return email;
        }
    });

    if (!email) return;

    Swal.fire({ title: 'Vérification...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });

    try {
        const response = await fetch(`${SIRH_CONFIG.apiBaseUrl}/request-password-reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.toLowerCase().trim() })
        });

        const data = await response.json();

        if (data.status === "success") {
            // ÉTAPE 2 : Demander le code (Design harmonisé)
            const { value: formValues } = await Swal.fire({
                title: 'Vérifiez vos mails',
                html: `
                    <div class="text-center px-2">
                        <p class="text-slate-500 text-sm mb-8">Un code à 6 chiffres a été envoyé à <b>${email}</b>.</p>
                        <div class="grid grid-cols-1 gap-4 text-left">
                            <div>
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Code de sécurité</label>
                                <input id="swal-code" class="swal2-input !m-0 !text-center !text-2xl !font-black !tracking-[0.5em]" maxlength="6" placeholder="000000">
                            </div>
                            <div>
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Nouveau mot de passe</label>
                                <input id="swal-newpass" type="password" class="swal2-input !m-0" placeholder="••••••••">
                            </div>
                        </div>
                    </div>
                `,
                focusConfirm: false,
                showCancelButton: true,
                confirmButtonText: 'Changer le mot de passe',
                confirmButtonColor: '#10b981', // Vert pour le succès
                preConfirm: () => {
                    const code = document.getElementById('swal-code').value;
                    const pass = document.getElementById('swal-newpass').value;
                    if (!code || code.length < 6) {
                        Swal.showValidationMessage(`Entrez le code à 6 chiffres`);
                        return false;
                    }
                    if (pass.length < 6) {
                        Swal.showValidationMessage(`Le mot de passe doit faire 6 caractères min.`);
                        return false;
                    }
                    return { code, newPassword: pass };
                }
            });

            if (formValues) {
                Swal.fire({ title: 'Mise à jour...', didOpen: () => Swal.showLoading() });
                const resReset = await fetch(`${SIRH_CONFIG.apiBaseUrl}/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email.toLowerCase().trim(), code: formValues.code, newPassword: formValues.newPassword })
                });

                if (resReset.ok) {
                    Swal.fire({ icon: 'success', title: 'Succès !', text: 'Votre mot de passe a été modifié.', confirmButtonColor: '#2563eb' });
                } else {
                    const err = await resReset.json();
                    throw new Error(err.error || "Code invalide ou expiré");
                }
            }

        } else {
            throw new Error(data.error || "Utilisateur introuvable");
        }
    } catch (e) {
        Swal.fire('Échec', e.message, 'error');
    }
}


async function fetchTemplates() {
    const tbody = document.getElementById('templates-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4" class="p-6 text-center italic text-slate-400"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Chargement des modèles...</td></tr>';

    try {
        const r = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/list-templates`);
        const templates = await r.json();

        tbody.innerHTML = '';
        if (templates.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="p-10 text-center text-slate-400 italic">Aucun modèle de contrat configuré. Cliquez sur "Uploader" pour commencer.</td></tr>';
            return;
        }

templates.forEach(t => {
            // On sécurise le nom du fichier pour éviter les bugs si y'a des apostrophes
            const safeLabel = t.label.replace(/'/g, "\\'"); 

            tbody.innerHTML += `
                <tr class="border-b hover:bg-slate-50 transition-all group">
                    <td class="px-6 py-4 font-black uppercase text-blue-600 text-xs">${t.role_target}</td>
                    <td class="px-6 py-4">
                        <div class="font-bold text-slate-700 text-sm">${t.label}</div>
                        <div class="text-[9px] text-slate-400 uppercase font-medium">Modèle de document</div>
                    </td>
                    <td class="px-6 py-4">
                        <span class="bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-bold border border-blue-100">
                            <i class="fa-solid fa-file-word mr-1"></i> DOCX
                        </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <!-- CORRECTION : On appelle viewDocument qui va ouvrir le Modal -->
                        <button onclick="viewDocument('${t.template_file_url}', '${safeLabel}')" class="p-2 text-slate-400 hover:text-blue-600" title="Voir le fichier"><i class="fa-solid fa-eye"></i></button>
                        
                        <button onclick="deleteTemplate('${t.id}')" class="p-2 text-slate-200 hover:text-red-500" title="Supprimer"><i class="fa-solid fa-trash-can"></i></button>
                    </td>
                </tr>
            `;
        });
    } catch (e) {
        console.error("Erreur templates:", e);
        tbody.innerHTML = '<tr><td colspan="4" class="p-6 text-red-500 font-bold text-center text-xs">Erreur de chargement des modèles.</td></tr>';
    }
}




async function openAddTemplateModal() {
    // 1. On affiche un petit chargement pendant qu'on récupère les rôles
    Swal.fire({ title: 'Chargement des rôles...', didOpen: () => Swal.showLoading() });

    try {
        // 2. Récupération des rôles réels de Supabase
        const response = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/list-roles`);
        const roles = await response.json();

        // 3. On génère les options du menu déroulant dynamiquement
            const roleOptions = window.activeRolesList.map(r => 
                `<option value="${r.role_name}">${r.role_name}</option>`
            ).join('');

        // 4. On ouvre la vraie modale avec la liste à jour
        const { value: formValues } = await Swal.fire({
            title: 'Uploader un Modèle Word',
            html: `
                <div class="text-left">
                    <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">Rôle Cible (Base de données)</label>
                        <select id="swal-tpl-role" class="swal2-input !mt-0">
                            <option value="">-- Choisir le rôle ciblé --</option>
                            ${roleOptions}
                        </select>

                    <label class="block text-[10px] font-black text-slate-400 uppercase mt-4 mb-1">Libellé du modèle (ex: Contrat de garde)</label>
                    <input id="swal-tpl-label" class="swal2-input !mt-0" placeholder="Nom du document...">

                    <label class="block text-[10px] font-black text-slate-400 uppercase mt-4 mb-1">Fichier Word (.docx)</label>
                    <input type="file" id="swal-tpl-file" class="swal2-file !mt-0" accept=".docx">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Enregistrer le modèle',
            preConfirm: () => {
                const role = document.getElementById('swal-tpl-role').value;
                const label = document.getElementById('swal-tpl-label').value;
                const file = document.getElementById('swal-tpl-file').files[0];

                if (!role || !label || !file) {
                    Swal.showValidationMessage('Tous les champs sont obligatoires.');
                    return false;
                }
                return { role, label, file };
            }
        });

        // 5. Envoi au serveur (reste inchangé)
        if (formValues) {
            const fd = new FormData();
            fd.append('role_target', formValues.role);
            fd.append('label', formValues.label);
            fd.append('template_file', formValues.file);
            fd.append('agent', currentUser.nom);

            const upRes = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/upload-template`, {
                method: 'POST',
                body: fd
            });

            if (upRes.ok) {
                Swal.fire('Succès !', 'Modèle enregistré.', 'success');
                fetchTemplates();
            }
        }

    } catch (e) {
        console.error(e);
        Swal.fire('Erreur', 'Impossible de charger les rôles de la base.', 'error');
    }
}








// ============================================================
// MODULE : GESTION DU RÉPERTOIRE MÉDICAL
// ============================================================

// Variable globale pour stocker la liste (pour pouvoir modifier facilement)
window.allPrescripteurs = [];

async function fetchPrescripteursManagement() {
    const container = document.getElementById('prescripteurs-grid');
    if (!container) return;

    const mode = localStorage.getItem('sirh_view_pref_prescripteurs') || 'grid';
    
    // CORRECTION ANTI-BOUCLE : Mise à jour manuelle des boutons
    document.querySelectorAll(`.view-toggle-prescripteurs`).forEach(btn => {
        if(btn.dataset.mode === mode) {
            btn.classList.add('bg-blue-600', 'text-white');
            btn.classList.remove('bg-white', 'text-slate-600');
        } else {
            btn.classList.remove('bg-blue-600', 'text-white');
            btn.classList.add('bg-white', 'text-slate-600');
        }
    });

    container.innerHTML = '<div class="col-span-full text-center p-10"><i class="fa-solid fa-circle-notch fa-spin text-blue-500 text-2xl"></i></div>';

    try {
        const [presRes, locRes] = await Promise.all([
            secureFetch(`${SIRH_CONFIG.apiBaseUrl}/list-prescripteurs`),
            secureFetch(`${SIRH_CONFIG.apiBaseUrl}/list-mobile-locations`)
        ]);

        const prescripteurs = await presRes.json();
        const locations = await locRes.json();
        window.allPrescripteurs = prescripteurs;

        const locMap = {};
        locations.forEach(l => locMap[l.id] = l.name);

        container.innerHTML = '';
        if (prescripteurs.length === 0) {
            container.className = ""; 
            container.innerHTML = '<div class="text-center text-slate-400 py-10 italic">Répertoire vide.</div>';
            return;
        }

        const canManage = currentUser.permissions.can_manage_prescripteurs;

        if (mode === 'grid') {
            // --- VUE GRILLE ---
            container.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
            prescripteurs.forEach(p => {
                const lieuNom = p.location_id ? locMap[p.location_id] : 'Non assigné';
                container.innerHTML += `
                    <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all relative search-item-prescripteur" data-name="${p.nom_complet.toLowerCase()}">
                        ${canManage ? `
                        <div class="absolute top-4 right-4 flex gap-2">
                            <button onclick="openEditPrescripteurModal('${p.id}')" class="text-slate-300 hover:text-blue-600 bg-slate-50 p-1.5 rounded-lg"><i class="fa-solid fa-pen"></i></button>
                            <button onclick="deletePrescripteur('${p.id}')" class="text-slate-300 hover:text-red-500 bg-slate-50 p-1.5 rounded-lg"><i class="fa-solid fa-trash-can"></i></button>
                        </div>` : ''}
                        <div class="flex items-center gap-4 mb-3">
                            <div class="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">${p.nom_complet.charAt(0)}</div>
                            <div>
                                <h3 class="font-black text-slate-800 text-sm">${p.nom_complet}</h3>
                                <p class="text-[10px] font-bold text-blue-500 uppercase mt-0.5">${p.fonction || 'Santé'}</p>
                            </div>
                        </div>
                        <div class="space-y-2 mt-4 text-xs text-slate-500">
                            <div class="bg-slate-50 p-2 rounded-lg"><i class="fa-solid fa-hospital text-slate-400 mr-2"></i> ${lieuNom}</div>
                            <div class="bg-slate-50 p-2 rounded-lg font-mono"><i class="fa-solid fa-phone text-slate-400 mr-2"></i> ${p.telephone || '---'}</div>
                        </div>
                    </div>`;
            });
        } else {
            // --- VUE TABLEAU ---
            container.className = "bg-white rounded-xl shadow-xl border border-slate-200 overflow-x-auto";
            let html = `
                <table class="w-full text-left whitespace-nowrap">
                    <thead class="bg-slate-900 text-white text-[10px] uppercase font-bold">
                        <tr>
                            <th class="px-6 py-4">Identité</th>
                            <th class="px-6 py-4">Fonction</th>
                            <th class="px-6 py-4">Lieu d'exercice</th>
                            <th class="px-6 py-4">Contact</th>
                            ${canManage ? '<th class="px-6 py-4 text-right">Actions</th>' : ''}
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">`;
            
            prescripteurs.forEach(p => {
                const lieuNom = p.location_id ? locMap[p.location_id] : '<span class="italic text-slate-300">Non assigné</span>';
                html += `
                    <tr class="hover:bg-slate-50 transition-colors search-item-prescripteur" data-name="${p.nom_complet.toLowerCase()}">
                        <td class="px-6 py-4 flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">${p.nom_complet.charAt(0)}</div>
                            <span class="font-bold text-slate-800 text-sm uppercase">${p.nom_complet}</span>
                        </td>
                        <td class="px-6 py-4 text-[10px] font-black text-blue-500 uppercase tracking-widest">${p.fonction || 'Santé'}</td>
                        <td class="px-6 py-4 text-xs font-medium text-slate-600">${lieuNom}</td>
                        <td class="px-6 py-4 text-xs font-mono text-slate-500">${p.telephone || '---'}</td>
                        ${canManage ? `
                        <td class="px-6 py-4 text-right">
                            <button onclick="openEditPrescripteurModal('${p.id}')" class="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg mr-1"><i class="fa-solid fa-pen"></i></button>
                            <button onclick="deletePrescripteur('${p.id}')" class="p-2 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-lg"><i class="fa-solid fa-trash-can"></i></button>
                        </td>` : ''}
                    </tr>`;
            });
            html += `</tbody></table>`;
            container.innerHTML = html;
        }

    } catch (e) { console.error(e); }
}



async function openAddPrescripteurModal() {
    // On charge les lieux pour le menu déroulant
    let locOptions = '<option value="">-- Aucun / Cabinet Privé --</option>';
    try {
        const r = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/list-mobile-locations`);
        const locs = await r.json();
        locs.forEach(l => {
            locOptions += `<option value="${l.id}">${l.name}</option>`;
        });
    } catch(e) {}

    const { value: form } = await Swal.fire({
        title: 'Nouveau Prescripteur',
        html: `
            <div class="text-left">
                <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">Nom Complet (Ex: Dr. Zossougbo)</label>
                <input id="pres-nom" class="swal2-input !mt-0" placeholder="Nom...">

                <label class="block text-[10px] font-black text-slate-400 uppercase mt-3 mb-1">Fonction / Spécialité</label>
                <select id="pres-role" class="swal2-input !mt-0">
                    <option value="Médecin Généraliste">Médecin Généraliste</option>
                    <option value="Médecin Spécialiste">Médecin Spécialiste</option>
                    <option value="Pharmacien">Pharmacien</option>
                    <option value="Sage-femme">Sage-femme</option>
                    <option value="Infirmier Major">Infirmier Major</option>
                </select>

                <label class="block text-[10px] font-black text-slate-400 uppercase mt-3 mb-1">Lieu d'exercice principal</label>
                <select id="pres-loc" class="swal2-input !mt-0">
                    ${locOptions}
                </select>

                <label class="block text-[10px] font-black text-slate-400 uppercase mt-3 mb-1">Téléphone</label>
                <input id="pres-tel" type="tel" class="swal2-input !mt-0" placeholder="+229...">
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Enregistrer',
        confirmButtonColor: '#2563eb',
        preConfirm: () => {
            const nom = document.getElementById('pres-nom').value;
            if(!nom) return Swal.showValidationMessage("Le nom est obligatoire");
            return {
                nom_complet: nom,
                fonction: document.getElementById('pres-role').value,
                location_id: document.getElementById('pres-loc').value,
                telephone: document.getElementById('pres-tel').value
            }
        }
    });

    if (form) {
        Swal.fire({ title: 'Enregistrement...', didOpen: () => Swal.showLoading() });
        const res = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/add-prescripteur`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(form)
        });
        
        const data = await res.json();
        if (data.error) Swal.fire('Erreur', data.error, 'error');
        else {
            Swal.fire('Succès', 'Contact ajouté au répertoire.', 'success');
            fetchPrescripteursManagement();
        }
    }
}


async function openEditPrescripteurModal(id) {
    // 1. On retrouve les infos du médecin grâce à l'ID (depuis la mémoire locale)
    const p = window.allPrescripteurs.find(item => item.id === id);
    if (!p) return;

    // 2. On charge la liste des lieux pour le select
    let locOptions = '<option value="">-- Aucun / Cabinet Privé --</option>';
    try {
        const r = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/list-mobile-locations`);
        const locs = await r.json();
        locs.forEach(l => {
            const selected = (l.id === p.location_id) ? 'selected' : '';
            locOptions += `<option value="${l.id}" ${selected}>${l.name}</option>`;
        });
    } catch(e) {}

    // 3. On ouvre la modale PRÉ-REMPLIE
    const { value: form } = await Swal.fire({
        title: 'Modifier le contact',
        html: `
            <div class="text-left">
                <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">Nom Complet</label>
                <input id="edit-pres-nom" class="swal2-input !mt-0" value="${p.nom_complet}">

                <label class="block text-[10px] font-black text-slate-400 uppercase mt-3 mb-1">Fonction</label>
                <select id="edit-pres-role" class="swal2-input !mt-0">
                    <option value="Médecin Généraliste" ${p.fonction === 'Médecin Généraliste' ? 'selected' : ''}>Médecin Généraliste</option>
                    <option value="Médecin Spécialiste" ${p.fonction === 'Médecin Spécialiste' ? 'selected' : ''}>Médecin Spécialiste</option>
                    <option value="Pharmacien" ${p.fonction === 'Pharmacien' ? 'selected' : ''}>Pharmacien</option>
                    <option value="Sage-femme" ${p.fonction === 'Sage-femme' ? 'selected' : ''}>Sage-femme</option>
                    <option value="Infirmier Major" ${p.fonction === 'Infirmier Major' ? 'selected' : ''}>Infirmier Major</option>
                </select>

                <label class="block text-[10px] font-black text-slate-400 uppercase mt-3 mb-1">Lieu d'exercice</label>
                <select id="edit-pres-loc" class="swal2-input !mt-0">
                    ${locOptions}
                </select>

                <label class="block text-[10px] font-black text-slate-400 uppercase mt-3 mb-1">Téléphone</label>
                <input id="edit-pres-tel" type="tel" class="swal2-input !mt-0" value="${p.telephone || ''}">
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Sauvegarder',
        confirmButtonColor: '#2563eb',
        preConfirm: () => {
            return {
                id: id, // On garde l'ID pour savoir qui modifier
                nom_complet: document.getElementById('edit-pres-nom').value,
                fonction: document.getElementById('edit-pres-role').value,
                location_id: document.getElementById('edit-pres-loc').value,
                telephone: document.getElementById('edit-pres-tel').value
            }
        }
    });

    if (form) {
        Swal.fire({ title: 'Mise à jour...', didOpen: () => Swal.showLoading() });
        
        const res = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/update-prescripteur`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(form)
        });
        
        if (res.ok) {
            Swal.fire('Succès', 'Fiche mise à jour.', 'success');
            fetchPrescripteursManagement(); // On rafraîchit la grille
        } else {
            Swal.fire('Erreur', 'Impossible de modifier.', 'error');
        }
    }
}

async function deletePrescripteur(id) {
    const conf = await Swal.fire({ title: 'Supprimer ?', text: "Il ne sera plus proposé aux délégués.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' });
    if(conf.isConfirmed) {
        await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/delete-prescripteur`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({id})
        });
        fetchPrescripteursManagement();
    }
}

// Fonction de recherche rapide dans la grille (sans recharger le serveur)
function filterPrescripteursLocally() {
    const term = document.getElementById('search-prescripteur-input').value.toLowerCase();
    document.querySelectorAll('.search-item-prescripteur').forEach(el => {
        el.style.display = el.dataset.name.includes(term) ? '' : 'none';
    });
}


async function fetchCompanyConfig() {
    try {
        const response = await secureFetch(`${URL_GET_CONFIG}?agent=${encodeURIComponent(currentUser.nom)}&type=zones`);
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
            SIRH_CONFIG.gps.offices = data.map(z => {
                // On log pour debug si besoin : console.log("Zone brute reçue:", z);
                return {
                    name: z.Nom || z.name || "Bureau",
                    lat: parseFloat(z.Latitude || z.latitude || z.lat),
                    lon: parseFloat(z.Longitude || z.longitude || z.lon),
                    radius: parseInt(z.Rayon || z.rayon || z.radius) || 100
                };
            });
            console.log("✅ Configuration GPS mise à jour :", SIRH_CONFIG.gps.offices);
        }
    } catch (e) {
        console.warn("⚠️ Erreur zones GPS :", e);
    }
}


// --- SYNTHÈSE GLOBALE POUR LE MANAGER ---
async function renderPerformanceTable() {
    const body = document.getElementById('performance-table-body');
    if (!body) return;

    if (currentUser.role === 'EMPLOYEE' || !currentUser.permissions.can_see_employees) {
        return; // On arrête silencieusement, pas d'erreur serveur.
    }

    // On définit la période (Mois en cours)
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    body.innerHTML = '<tr><td colspan="4" class="p-10 text-center"><i class="fa-solid fa-circle-notch fa-spin text-blue-600"></i></td></tr>';

    try {
        const r = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/get-boss-summary?month=${month}&year=${year}`);
        const data = await r.json();

        body.innerHTML = '';
        if (data.length === 0) {
            body.innerHTML = '<tr><td colspan="4" class="p-10 text-center text-slate-400">Aucune activité ce mois-ci.</td></tr>';
            return;
        }

        // Mise à jour de la stat rapide
        let totalVisitesGlobal = 0;

        data.forEach(emp => {
            totalVisitesGlobal += emp.total;
            const lieuxUniques = [...new Set(emp.details.map(d => d.lieu))].length;

            body.innerHTML += `
                <tr class="hover:bg-slate-50 transition-all">
                    <td class="px-8 py-5">
                        <div class="font-black text-slate-800 uppercase text-sm">${emp.nom}</div>
                        <div class="text-[10px] text-slate-400 font-bold">${emp.matricule}</div>
                    </td>
                    <td class="px-8 py-5">
                        <span class="bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-black text-xs">${emp.total} visites</span>
                    </td>
                    <td class="px-8 py-5 text-sm font-bold text-slate-600">${lieuxUniques} sites visités</td>
                    <td class="px-8 py-5 text-right">
                        <button onclick="showDetailedEmpReport('${emp.nom}')" class="text-blue-600 font-black text-[10px] uppercase hover:underline">Détails par lieu</button>
                    </td>
                </tr>
            `;
        });

        document.getElementById('stat-visites-total').innerText = totalVisitesGlobal;
        
        // On stocke les données pour pouvoir afficher le détail au clic
        window.currentPerformanceData = data;

    } catch (e) { console.error(e); }
}

// Fonction pour voir le détail d'un employé précis au clic
function showDetailedEmpReport(empName) {
    const empData = window.currentPerformanceData.find(e => e.nom === empName);
    if (!empData) return;

    let html = '<div class="text-left space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scroll">';
    empData.details.forEach(visite => {
        html += `
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div class="flex justify-between font-bold text-xs text-slate-800 mb-1">
                    <span>${visite.lieu}</span>
                    <span class="text-blue-600">${new Date(visite.date).toLocaleDateString()}</span>
                </div>
                <p class="text-[10px] text-slate-500 italic">"${visite.notes || 'Pas de commentaire'}"</p>
                <div class="mt-2 text-[9px] font-black uppercase text-emerald-600">${visite.resultat}</div>
            </div>
        `;
    });
    html += '</div>';

    Swal.fire({
        title: `Activité de ${empName}`,
        html: html,
        width: '600px',
        confirmButtonText: 'Fermer',
        confirmButtonColor: '#0f172a'
    });
}


async function offerRegisterLocation(gps) {
    const { value: locName } = await Swal.fire({
        title: 'Lieu non répertorié',
        text: "Voulez-vous enregistrer ce point GPS comme un nouveau site ?",
        input: 'text',
        inputPlaceholder: 'Nom de la pharmacie / centre...',
        showCancelButton: true,
        confirmButtonText: 'Enregistrer le site'
    });

    if (locName) {
        const [lat, lon] = gps.split(',');
        await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/add-mobile-location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: locName,
                latitude: lat,
                longitude: lon,
                radius: 50,
                type_location: 'AUTO_GEOLOC'
            })
        });
        Swal.fire('Succès', 'Le lieu a été ajouté à la base de données.', 'success');
    }
}











async function triggerGlobalPush(title, message) {
    PremiumUI.play('notification');
    PremiumUI.vibrate('success');

    if (Notification.permission === "granted") {
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification(title, {
            body: message,
            icon: 'https://cdn-icons-png.flaticon.com/512/13594/13594876.png',
            badge: 'https://cdn-icons-png.flaticon.com/512/13594/13594876.png',
            vibrate: [100, 50, 100],
            data: { url: window.location.href }, // Pour rouvrir l'app au bon endroit
            actions: [
                { action: 'open', title: 'Voir maintenant' }
            ]
        });
    }
}









async function fetchData(forceUpdate = false, page = 1) { 
    console.log(`🚀 fetchData lancée. Page: ${page}, Role: ${currentUser.role}`);

    const CACHE_KEY = 'sirh_data_v1';
    const limit = 10; 

    if (forceUpdate) {
        localStorage.removeItem('sirh_data_v1'); // On vide le vieux cache
    }
    // --- NOUVEAU : Récupération centralisée des filtres ---
    // On utilise l'objet activeFilters (ou des valeurs par défaut si pas encore défini)
    const filters = typeof activeFilters !== 'undefined' ? activeFilters : {
        search: typeof currentSearchText !== 'undefined' ? currentSearchText : "",
        status: typeof currentStatusFilter !== 'undefined' ? currentStatusFilter : "all",
        type: "all",
        dept: "all"
    };

    // 1. Construction de l'URL avec TOUS les paramètres de filtrage pro
let fetchUrl = `${URL_READ}?page=${page}&limit=${limit}` +
                   `&search=${encodeURIComponent(filters.search)}` +
                   `&status=${filters.status}` +
                   `&type=${filters.type}` +
                   `&dept=${filters.dept}` +
                   `&role=${filters.role || 'all'}` +
                   `&agent=${encodeURIComponent(currentUser.nom)}`;

    if (currentUser.role === 'EMPLOYEE') {
        fetchUrl += `&target_id=${encodeURIComponent(currentUser.id)}`;
    }

    try {
        console.log("📞 Appel API (Deep Search Multi-Critères) vers :", fetchUrl);
        
        const r = await secureFetch(fetchUrl);
        const result = await r.json(); 

        const d = result.data || [];
        const meta = result.meta || { total: d.length, page: 1, last_page: 1 };

        console.log(`✅ Page ${meta.page} reçue :`, d.length, "enregistrements trouvés");
      
        // 3. MAPPING (CORRIGÉ POUR INCLURE TRANSPORT ET LOGEMENT)
        employees = d.map(x => {
            return { 
                id: x.id, 
                nom: x.nom, 
                date: x.date_embauche, 
                employee_type: x.employee_type || 'OFFICE', 
                poste: x.poste, 
                dept: x.departement || "Non défini", 
                Solde_Conges: parseFloat(x.solde_conges) || 0,
                limit: x.type_contrat === 'CDI' ? '365' : (x.type_contrat === 'CDD' ? '180' : '90'), 
                photo: x.photo_url || '', 
                statut: x.statut || 'Actif', 
                email: x.email, 
                telephone: x.telephone, 
                adresse: x.adresse, 
                date_naissance: x.date_naissance, 
                role: x.role || 'EMPLOYEE',
                manager_id: x.manager_id || '', 
                scope: x.management_scope || [],
                matricule: x.matricule || 'N/A',
                doc: x.contrat_pdf_url || '',
                cv_link: x.cv_url || '',
                id_card_link: x.id_card_url || '',
                diploma_link: x.diploma_url || '',
                attestation_link: x.attestation_url || '',
                lm_link: x.lm_url || '',
                // --- LES CHAMPS FINANCIERS ---
                salaire_base_fixe: parseFloat(x.salaire_brut_fixe) || 0,
                indemnite_transport: parseFloat(x.indemnite_transport) || 0, // AJOUTÉ
                indemnite_logement: parseFloat(x.indemnite_logement) || 0,   // AJOUTÉ
                // -----------------------------
                contract_status: x.contract_status || 'Non signé'
            };
        });

        // 4. Sauvegarde Cache
        localStorage.setItem(CACHE_KEY, JSON.stringify(employees));
        localStorage.setItem(CACHE_KEY + '_time', Date.now());

        // 5. Mise à jour du Tableau
        renderData();

        // --- MISE À JOUR DE LA NAVIGATION (PAGINATION FOOTER) ---
        const paginationFooter = document.getElementById('employee-pagination-footer');
        
        if (paginationFooter) {
            if (meta.last_page > 1) {
                paginationFooter.innerHTML = `
                    <button onclick="fetchData(true, ${meta.page - 1})" ${meta.page <= 1 ? 'disabled' : ''} 
                        class="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-600 disabled:opacity-30 hover:bg-slate-100 transition-all shadow-sm">
                        <i class="fa-solid fa-chevron-left"></i> Précédent
                    </button>
                    
                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        PAGE ${meta.page} / ${meta.last_page}
                    </span>
                    
                    <button onclick="fetchData(true, ${meta.page + 1})" ${meta.page >= meta.last_page ? 'disabled' : ''} 
                        class="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-600 disabled:opacity-30 hover:bg-slate-100 transition-all shadow-sm">
                        Suivant <i class="fa-solid fa-chevron-right"></i>
                    </button>
                `;
            } else {
                paginationFooter.innerHTML = `<span class="text-[10px] font-black text-slate-300 uppercase tracking-widest">Fin de liste</span>`;
            }
        }

        // 6. Mise à jour graphiques
        renderCharts();

        if (currentUser.role !== 'EMPLOYEE') {
            fetchLeaveRequests();
        }

    } catch (e) {
        console.error("❌ ERREUR FETCH:", e);
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            employees = JSON.parse(cached);
            renderData();
            loadMyProfile();
        } else {
            Swal.fire('Erreur Connexion', 'Impossible de charger vos informations.', 'error');
        }
    }
}




async function populateManagerSelects() {
    const createSelect = document.getElementById('f-manager');
    const editSelect = document.getElementById('edit-manager');
    if (!createSelect && !editSelect) return;

    try {
        // On appelle l'API avec une limite de 1000 et uniquement les actifs
        // On ajoute un paramètre agent pour la sécurité
        const response = await secureFetch(`${URL_READ}?limit=1000&status=Actif&agent=${encodeURIComponent(currentUser.nom)}`);
        const result = await response.json();
        const allActive = result.data || [];

        // On génère le HTML des options
        // On trie par nom pour que ce soit plus facile à trouver
        const optionsHtml = allActive
            .sort((a, b) => a.nom.localeCompare(b.nom))
            .map(e => `<option value="${e.id}">${e.nom} (${e.poste || 'Sans poste'})</option>`)
            .join('');

        const defaultOpt = `<option value="">-- Aucun / Autonome --</option>`;

        if (createSelect) createSelect.innerHTML = defaultOpt + optionsHtml;
        if (editSelect) editSelect.innerHTML = defaultOpt + optionsHtml;
        
        console.log(`👥 Liste des managers mise à jour (${allActive.length} personnes)`);
    } catch (e) {
        console.error("Erreur lors du chargement de la liste des responsables", e);
    }
}




function renderData() { 
    const b = document.getElementById('full-body'); 
    const d = document.getElementById('dashboard-body');
    if(!b || !d) return; 

    // 1. Détection de la permission "Maître" (RH/ADMIN)
    const canManage = currentUser.permissions?.can_see_employees === true;

    // 2. LOGIQUE ESTHÉTIQUE : On cache l'en-tête de la colonne si on n'est pas RH/ADMIN
    const headerAction = document.querySelector('th[data-perm="can_see_employees"]');
    if (headerAction) {
        headerAction.style.display = canManage ? '' : 'none';
    }

    b.innerHTML = ''; 
    d.innerHTML = ''; 
    
    let total = 0, alertes = 0, actifs = 0; 

    // --- 1. CALCUL DES STATS (Sur le périmètre filtré par le serveur) ---
    employees.forEach(e => { 
        total++; 
        const rawStatus = (e.statut || 'Actif').toLowerCase().trim();
        const isSortie = rawStatus.includes('sortie'); 
        
        if (rawStatus === 'actif') actifs++; 
        
        if(e.date && !isSortie) { 
            let sD = parseDateSmart(e.date);
            let eD = new Date(sD); 
            eD.setDate(eD.getDate() + (parseInt(e.limit) || 365)); 
            let dL = Math.ceil((eD - new Date()) / 86400000); 

            let isExpired = dL < 0;
            let isUrgent = dL <= 15;

            if(isExpired || isUrgent) {
                alertes++;
                // Dans le dashboard, on ne montre le bouton GÉRER que si on a le droit
                const manageBtn = canManage ? `<button class="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold" onclick="openEditModal('${escapeHTML(e.id)}')">GÉRER</button>` : '';

                d.innerHTML += `
                    <tr class="bg-white border-b">
                        <td class="p-4 text-sm font-bold text-slate-700">${escapeHTML(e.nom)}</td>
                        <td class="p-4 text-xs text-slate-500">${escapeHTML(e.poste)}</td>
                        <td class="p-4 ${isExpired ? 'text-red-600' : 'text-orange-600'} font-bold text-xs uppercase">${isExpired ? 'Expiré' : dL + ' j'}</td>
                        <td class="p-4 text-right">${manageBtn}</td>
                    </tr>`; 
            }
        }
    }); 

   // --- 2. FILTRAGE LOCAL CORRIGÉ ---
    let filteredEmployees = employees;
    if (typeof currentFilter !== 'undefined' && currentFilter !== 'all') {
        filteredEmployees = employees.filter(e => {
            const search = currentFilter.toLowerCase();
            const eStatut = (e.statut || "").toLowerCase();
            const eDept = (e.dept || "").toLowerCase();

        // MODIFICATION ICI : Le bouton "Actifs" doit montrer les gens "Actif" ET "En Poste"
        if (search === 'actifs' || search === 'actif') {
            return eStatut === 'actif' || eStatut === 'en poste';
        }

            return eStatut.includes(search) || eDept.includes(search);
        });
    }

    // --- 3. RENDU DU TABLEAU PRINCIPAL ---
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    paginatedEmployees.forEach(e => {
        const rawStatus = (e.statut || 'Actif').toLowerCase().trim();
        const isSortie = rawStatus.includes('sortie');
        const isConges = rawStatus.includes('cong');
        
        let bdgClass = isSortie ? "bg-slate-100 text-slate-500" : (isConges ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700");
        let bdgLabel = isSortie ? "SORTIE" : (isConges ? "CONGÉ" : (e.statut || 'Actif'));

        const av = e.photo && e.photo.length > 10 
            ? `<img src="${formatGoogleLink(e.photo)}" loading="lazy" class="w-10 h-10 rounded-full object-cover bg-slate-200 border border-slate-200">` 
            : `<div class="w-10 h-10 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-xs font-black text-slate-500">${escapeHTML(e.nom).substring(0,2).toUpperCase()}</div>`;
        
        // --- CELLULE ACTION (Supprimée du DOM si pas autorisé) ---
// --- DEBUT DU BLOC CORRIGÉ ---
        let actionCell = "";
        const perms = currentUser.permissions || {}; // Sécurité pour éviter les erreurs
        const safeId = escapeHTML(e.id);

        // On ouvre la cellule et le conteneur de boutons
        actionCell = `<td class="px-8 py-4 text-right"><div class="flex items-center justify-end gap-2">`;

        // 1. Bouton DOSSIER (📂)
        if (perms.can_view_employee_files) {
            actionCell += `<button onclick="openFullFolder('${safeId}')" title="Dossier" class="p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-500 hover:text-white transition-all"><i class="fa-solid fa-folder-open"></i></button>`;
        }

        // 2. Section CONTRATS (Brouillon, Signer, Scan)
        if (perms.can_manage_contracts) {
            const isSigned = (String(e.contract_status || '').toLowerCase().trim() === 'signé');
            actionCell += `<div class="h-4 w-[1px] bg-slate-200 mx-1"></div>`; // Séparateur
            
            if (!isSigned) {
                actionCell += `
                    <button onclick="generateDraftContract('${safeId}')" title="Brouillon" class="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"><i class="fa-solid fa-file-contract"></i></button>
                    <button onclick="openContractModal('${safeId}')" title="Signer" class="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><i class="fa-solid fa-pen-nib"></i></button>
                    <button onclick="triggerManualContractUpload('${safeId}')" title="Scan" class="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"><i class="fa-solid fa-file-arrow-up"></i></button>
                `;
            } else {
                actionCell += `<span class="text-[10px] font-black text-emerald-500 uppercase bg-emerald-50 px-2 py-1 rounded">Signé</span>`;
            }
        }

        // 3. Bouton IMPRIMER (🖨️)
        if (perms.can_print_badges) {
            actionCell += `<div class="h-4 w-[1px] bg-slate-200 mx-1"></div>`; // Séparateur
            actionCell += `<button onclick="printBadge('${safeId}')" class="text-slate-400 hover:text-blue-600 transition-all"><i class="fa-solid fa-print"></i></button>`;
        }

        // 4. Bouton ÉDITER (✏️)
        // Accessible si on peut gérer les contrats OU simplement modifier les infos de base
        if (perms.can_edit_employee_basic || perms.can_manage_contracts) {
            actionCell += `<button onclick="openEditModal('${safeId}')" class="text-slate-400 hover:text-slate-800 transition-all"><i class="fa-solid fa-pen"></i></button>`;
        }


        if (perms.can_delete_employees) {
             actionCell += `<button onclick="deleteEmployee('${safeId}')" class="p-2 text-red-200 hover:text-red-600 transition-colors ml-1" title="Supprimer"><i class="fa-solid fa-trash-can"></i></button>`;
         }

                
        // On ferme les balises
        actionCell += `</div></td>`;
        // --- FIN DU BLOC CORRIGÉ ---

        b.innerHTML += `
            <tr class="border-b hover:bg-slate-50 transition-colors">
                <td class="p-4 flex gap-3 items-center min-w-[200px]">
                    ${av}
                    <div>
                        <div class="font-bold text-sm text-slate-800 uppercase">${escapeHTML(e.nom)}</div>
                        <div class="text-[10px] text-slate-400 font-mono">${e.matricule}</div>
                    </div>
                </td>
                <td class="p-4 text-xs font-medium text-slate-500">${escapeHTML(e.poste)}</td>
                <td class="p-4"><span class="px-3 py-1 border rounded-lg text-[10px] font-black uppercase ${bdgClass}">${escapeHTML(bdgLabel)}</span></td>
                ${actionCell} 
            </tr>`;
    });

    // Mise à jour des compteurs UI
    document.getElementById('stat-total').innerText = total; 
    document.getElementById('stat-alert').innerText = alertes; 
    document.getElementById('stat-active').innerText = actifs;

    // Pagination
    const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
    document.querySelectorAll('.page-info-global').forEach(el => { el.innerText = `PAGE ${currentPage} / ${totalPages || 1}`; });
}




async function openAttendancePicker() {
    Swal.fire({
        title: 'Rapport de Présence',
        text: 'Quelle période souhaitez-vous consulter ?',
        icon: 'question',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: '🕒 Aujourd\'hui',
        denyButtonText: '📅 Mensuel (Cumul)',
        cancelButtonText: 'Annuler',
        confirmButtonColor: '#4f46e5',
        denyButtonColor: '#0f172a',
    }).then((result) => {
        if (result.isConfirmed) {
            fetchAttendanceReport('GLOBAL', 'today');
        } else if (result.isDenied) {
            fetchAttendanceReport('GLOBAL', 'monthly');
        }
    });
}


async function fetchAttendanceReport(mode = 'PERSONAL', period = 'monthly') {
    const container = document.getElementById('personal-report-container');
    
    if (mode === 'GLOBAL') {
        Swal.fire({ title: 'Chargement...', text: 'Analyse des présences en cours', didOpen: () => Swal.showLoading() });
    } else {
        if(container) container.innerHTML = '<div class="flex justify-center p-4"><i class="fa-solid fa-circle-notch fa-spin text-indigo-500"></i></div>';
    }

    try {
        const url = `${URL_READ_REPORT}?agent=${encodeURIComponent(currentUser.nom)}&requester_id=${encodeURIComponent(currentUser.id)}&mode=${mode}&period=${period}`;
        const r = await secureFetch(url);
        const rawReports = await r.json();

        // --- NORMALISATION DES DONNÉES ---
        const cleanReports = rawReports.map(rep => {
            if (period === 'today') {
                return {
                    nom: rep.nom || 'Inconnu',
                    matricule: rep.matricule || '-',
                    statut: rep.statut || 'ABSENT',
                    arrivee: rep.arrivee || '--:--',
                    duree: rep.duree || '0h 00m',
                    zone: rep.zone || '---'
                };
            } else {
                return {
                    mois: rep.mois || '-',
                    nom: rep.nom || 'Inconnu',
                    jours: rep.jours || 0,
                    heures: rep.heures || '0h 00m',
                    statut: 'Validé'
                };
            }
        });
        
        if (mode === 'GLOBAL') {
            Swal.close();
            let tableHtml = '';
            
            if (period === 'today') {
                // --- RAPPORT JOURNALIER (IMPECCABLE) ---
                const nbPresents = cleanReports.filter(r => r.statut === 'PRÉSENT').length;
                const nbPartis = cleanReports.filter(r => r.statut === 'PARTI').length;
                const nbAbsents = cleanReports.filter(r => r.statut === 'ABSENT' || r.statut === 'CONGÉ').length;

                tableHtml = `
                    <div class="grid grid-cols-3 gap-3 mb-6">
                        <div class="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 text-center">
                            <p class="text-[8px] font-black text-emerald-600 uppercase">En Poste</p>
                            <h4 class="text-xl font-black text-emerald-700">${nbPresents}</h4>
                        </div>
                        <div class="bg-blue-50 p-3 rounded-2xl border border-blue-100 text-center">
                            <p class="text-[8px] font-black text-blue-600 uppercase">Terminé</p>
                            <h4 class="text-xl font-black text-blue-700">${nbPartis}</h4>
                        </div>
                        <div class="bg-rose-50 p-3 rounded-2xl border border-rose-100 text-center">
                            <p class="text-[8px] font-black text-rose-600 uppercase">Absents</p>
                            <h4 class="text-xl font-black text-rose-700">${nbAbsents}</h4>
                        </div>
                    </div>
                    
                    <div class="flex justify-end mb-4">
                        <button onclick="downloadReportCSV('${period}')" class="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase shadow hover:bg-emerald-700 transition-all flex items-center gap-2"><i class="fa-solid fa-file-csv"></i> Exporter Excel</button>
                    </div>

                    <div class="overflow-x-auto max-h-[50vh] custom-scroll border rounded-xl">
                        <table class="w-full text-left whitespace-nowrap">
                            <thead class="bg-slate-900 text-white text-[9px] uppercase font-black sticky top-0">
                                <tr>
                                    <th class="p-3">Employé</th>
                                    <th class="p-3 text-center">Statut</th>
                                    <th class="p-3 text-center">Arrivée</th>
                                    <th class="p-3 text-center">Temps de Présence</th>
                                    <th class="p-3 text-right">Zone</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100 text-[11px]">
                `;

                cleanReports.forEach(item => {
                    let badgeClass = "bg-rose-100 text-rose-700"; // Absent par défaut
                    if (item.statut === 'PRÉSENT') badgeClass = "bg-emerald-100 text-emerald-700";
                    else if (item.statut === 'PARTI') badgeClass = "bg-blue-100 text-blue-700";
                    else if (item.statut === 'CONGÉ') badgeClass = "bg-amber-100 text-amber-700";

                    tableHtml += `
                        <tr class="${item.statut === 'ABSENT' ? 'opacity-60 bg-slate-50/50' : ''}">
                            <td class="p-3">
                                <div class="font-bold text-slate-700 uppercase">${item.nom}</div>
                                <div class="text-[9px] text-slate-400">ID: ${item.matricule}</div>
                            </td>
                            <td class="p-3 text-center">
                                <span class="px-2 py-0.5 rounded font-black text-[9px] ${badgeClass}">${item.statut}</span>
                            </td>
                            <td class="p-3 text-center font-mono font-bold text-slate-500">${item.arrivee}</td>
                            <td class="p-3 text-center">
                                <div class="font-black text-indigo-600">${item.duree}</div>
                                <div class="text-[8px] text-slate-400 font-bold uppercase">${item.statut === 'PRÉSENT' ? 'Live' : 'Total'}</div>
                            </td>
                            <td class="p-3 text-right text-slate-400 font-medium">${item.zone}</td>
                        </tr>
                    `;
                });
                
                if(cleanReports.length === 0) tableHtml += `<tr><td colspan="5" class="p-10 text-center text-slate-400 italic">Aucune donnée pour ce jour.</td></tr>`;

            } else {
                // --- RAPPORT MENSUEL (Impeccable par cumul amplitude) ---
                tableHtml = `
                    <div class="flex justify-end mb-4">
                        <button onclick="downloadReportCSV('${period}')" class="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase shadow hover:bg-emerald-700 transition-all flex items-center gap-2"><i class="fa-solid fa-file-csv"></i> Télécharger Cumul</button>
                    </div>
                    <div class="overflow-x-auto max-h-[60vh] custom-scroll border rounded-xl">
                        <table class="w-full text-left whitespace-nowrap border-collapse">
                            <thead class="bg-slate-900 text-white text-[9px] uppercase font-black sticky top-0">
                                <tr><th class="p-4">Mois</th><th class="p-4">Employé</th><th class="p-4 text-center">Jours Présence</th><th class="p-4 text-center">Heures Totales</th><th class="p-4 text-right">Statut</th></tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100 text-[11px]">
                `;

                cleanReports.forEach(item => {
                    tableHtml += `
                        <tr class="hover:bg-slate-50 transition-all">
                            <td class="p-4 font-bold text-slate-700 capitalize">${item.mois}</td>
                            <td class="p-4 font-medium uppercase">${item.nom}</td>
                            <td class="p-4 text-center font-black text-slate-800">${item.jours} j</td>
                            <td class="p-4 text-center font-mono text-indigo-600 font-black">${item.heures}</td>
                            <td class="p-4 text-right"><span class="bg-emerald-50 text-emerald-600 px-2 py-1 rounded font-bold text-[9px]">Validé</span></td>
                        </tr>`;
                });
                if(cleanReports.length === 0) tableHtml += `<tr><td colspan="5" class="p-10 text-center text-slate-400 italic">Aucune donnée mensuelle.</td></tr>`;
            }

            tableHtml += `</tbody></table></div>`;
            
            Swal.fire({
                title: period === 'today' ? 'Analyse des Présences (Live)' : 'Cumul de Présence Mensuel',
                html: tableHtml,
                width: '900px',
                confirmButtonText: 'Fermer',
                confirmButtonColor: '#0f172a',
                customClass: { popup: 'rounded-2xl' }
            });
            
            currentReportData = cleanReports; 
        } else {
            renderPersonalReport(cleanReports, container);
        }
    } catch (e) {
        console.error("Erreur rapport:", e);
        Swal.fire('Erreur', "Impossible de charger le rapport.", 'error');
    }
}


function renderPersonalReport(reports, container) {
    if (!container) return;
    if (!reports || reports.length === 0) {
        container.innerHTML = '<p class="text-xs text-slate-400 italic p-4 text-center">Aucun rapport disponible.</p>';
        return;
    }
    
    // --- TRI LONG TERME : On inverse l'ordre (le dernier arrivé en premier) ---
    // Si 'reports' vient d'Airtable, c'est souvent du plus ancien au plus récent.
    // On fait un reverse() simple pour afficher le dernier mois en haut.
    const sortedReports = [...reports].reverse(); 

    container.innerHTML = '';
    
    sortedReports.forEach(item => {
        // ... (Le reste de votre code d'affichage reste identique) ...
        // Utilisez 'item' ici
        let mois = item.mois || item['Mois/Année'] || '-';
        let heures = item.heures || item['Total Heures'] || 0;
        let jours = item.jours || item['Jours de présence'] || 0;
        const letter = mois !== '-' ? mois.charAt(0) : '?';
        
        container.innerHTML += `
            <div class="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white transition-colors">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg shadow-sm border border-indigo-200">${letter}</div>
                    <div><h4 class="font-bold text-slate-800 text-sm capitalize">${mois}</h4><p class="text-[10px] text-slate-500 font-medium">Cumul validé</p></div>
                </div>
                <div class="text-right">
                    <p class="text-sm font-black text-slate-800">${heures}h <span class="text-[10px] text-slate-400 font-normal">/ ${jours}j</span></p>
                    <span class="text-[9px] font-bold text-emerald-500 uppercase bg-emerald-50 px-2 py-0.5 rounded">Validé</span>
                </div>
            </div>
        `;
    });
}

 async function triggerManualContractUpload(employeeId) {
    const { value: file } = await Swal.fire({
        title: 'Contrat scanné / Physique',
        text: 'Sélectionnez le PDF ou prenez une photo du contrat signé manuellement.',
        input: 'file',
        inputAttributes: {
            'accept': 'application/pdf,image/*',
            'aria-label': 'Uploader le contrat'
        },
        showCancelButton: true,
        confirmButtonText: 'Envoyer le document',
        confirmButtonColor: '#10b981',
        cancelButtonText: 'Annuler'
    });

    if (file) {
        Swal.fire({
            title: 'Envoi en cours...',
            text: 'Le fichier est en cours d\'archivage dans Airtable',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        // Préparation du FormData
        const fd = new FormData();
        fd.append('id', employeeId);
        fd.append('contract_file', file); // Le fichier binaire
        fd.append('mode', 'manual_scan');
        fd.append('agent', currentUser.nom);

        try {
            // UTILISATION DE secureFetch POUR ENVOYER LE TOKEN
            const response = await secureFetch(URL_UPLOAD_SIGNED_CONTRACT, {
                method: 'POST',
                body: fd 
                // Note : On ne définit PAS de headers ici, 
                // secureFetch s'en occupe et le navigateur gère le "multipart/form-data"
            });

            if (response.ok) {
                Swal.fire('Succès !', 'Le contrat scanné a été enregistré avec succès.', 'success');
                refreshAllData(); 
            } else {
                // Si on arrive ici, secureFetch a déjà levé une erreur normalement
                throw new Error("Le serveur a répondu avec une erreur.");
            }
        } catch (error) {
            console.error("Erreur Upload:", error);
            Swal.fire('Échec', "Impossible d'envoyer le fichier : " + error.message, 'error');
        }
    }
}





// ============================================================
// GESTION DU DOUBLE AFFICHAGE (GRILLE / LISTE)
// ============================================================
function changeViewMode(section, mode) {
    // 1. Sauvegarde du choix dans le navigateur
    localStorage.setItem(`sirh_view_pref_${section}`, mode);
    
    // 2. Mise à jour visuelle des boutons (Bouton actif en bleu)
    document.querySelectorAll(`.view-toggle-${section}`).forEach(btn => {
        if(btn.dataset.mode === mode) {
            btn.classList.add('bg-blue-600', 'text-white');
            btn.classList.remove('bg-white', 'text-slate-600', 'hover:bg-slate-50');
        } else {
            btn.classList.remove('bg-blue-600', 'text-white');
            btn.classList.add('bg-white', 'text-slate-600', 'hover:bg-slate-50');
        }
    });

    // 3. Rechargement des données avec le bon format
    if (section === 'locations') fetchMobileLocations();
    if (section === 'prescripteurs') fetchPrescripteursManagement();
}


    function openLeaveModal() {
                document.getElementById('leave-modal').classList.remove('hidden');
                document.getElementById('leave-start').valueAsDate = new Date();
                document.getElementById('leave-end').valueAsDate = new Date();
            }



    async function submitLeaveRequest(e) {
                e.preventDefault();
                
                const fd = new FormData();
                fd.append('employee_id', currentUser.id);
                fd.append('nom', currentUser.nom);
                fd.append('type', document.querySelector('input[name="leave_type"]:checked').value);
                fd.append('date_debut', document.getElementById('leave-start').value);
                fd.append('date_fin', document.getElementById('leave-end').value);
                fd.append('motif', document.getElementById('leave-reason').value);
                fd.append('date_demande', new Date().toISOString());
                fd.append('agent', currentUser.nom);

                // Ajout du justificatif s'il a été pris en photo ou uploadé
                if (docBlobs.leave_justif) {
                    fd.append('justificatif', docBlobs.leave_justif, 'justificatif_conge.jpg');
                }

                Swal.fire({ title: 'Envoi...', text: 'Traitement de votre demande', didOpen: () => Swal.showLoading(), allowOutsideClick: false });

                try {
                    const response = await secureFetch(URL_LEAVE_REQUEST, { method: 'POST', body: fd });
                    if (response.ok) {
                        document.getElementById('leave-modal').classList.add('hidden');
                        e.target.reset();
                        docBlobs.leave_justif = null;
                        document.getElementById('leave-doc-preview').innerHTML = '<i class="fa-solid fa-camera"></i>';
                        Swal.fire('Succès', 'Votre demande de congé a été envoyée.', 'success');
                    }
                } catch (error) { 
                    Swal.fire('Erreur', "Échec de l'envoi : " + error.message, 'error'); 
                }
            }



           

function updateClockUI(statusMode) {
    const btn = document.getElementById('btn-clock');
    const dot = document.getElementById('clock-status-dot');
    const text = document.getElementById('clock-status-text');
    if(!btn) return; 

    // On nettoie les classes
    btn.className = "flex-1 md:flex-none px-8 py-4 rounded-2xl font-black uppercase transition-all flex items-center justify-center gap-2";
    dot.className = "w-3 h-3 rounded-full";

    if (statusMode === 'DONE') {
        // ÉTAT 3 : JOURNÉE FINIE -> GRIS ET BLOQUÉ
        btn.classList.add('bg-slate-200', 'text-slate-400', 'cursor-not-allowed', 'border', 'border-slate-300');
        btn.innerHTML = '<i class="fa-solid fa-lock"></i> <span>CLÔTURÉ</span>';
        btn.disabled = true; // Empêche physiquement le clic HTML
        dot.classList.add('bg-slate-300');
        if(text) { text.innerText = "FIN DE SERVICE"; text.className = "text-2xl font-black text-slate-400"; }
    }
    else if (statusMode === 'IN') {
        // ÉTAT 2 : EN POSTE -> ROUGE
        btn.classList.add('bg-red-500', 'text-white', 'shadow-lg', 'hover:bg-red-400', 'active:scale-95');
        btn.innerHTML = '<i class="fa-solid fa-person-walking-arrow-right"></i> <span>SORTIE</span>';
        btn.disabled = false;
        dot.classList.add('bg-emerald-500', 'shadow-[0_0_10px_rgba(16,185,129,0.5)]');
        if(text) { text.innerText = "EN POSTE"; text.className = "text-2xl font-black text-emerald-500"; }
    } 
    else {
        // ÉTAT 1 : DEHORS -> VERT
        btn.classList.add('bg-emerald-500', 'text-white', 'shadow-lg', 'hover:bg-emerald-400', 'active:scale-95');
        btn.innerHTML = '<i class="fa-solid fa-fingerprint"></i> <span>ENTRÉE</span>';
        btn.disabled = false;
        dot.classList.add('bg-red-500', 'shadow-[0_0_10px_rgba(239,68,68,0.5)]');
        if(text) { text.innerText = "NON POINTÉ"; text.className = "text-2xl font-black text-slate-800"; }
    }
}



async function syncClockInterface() {
    if (!currentUser || !currentUser.id) return;
    const userId = currentUser.id;

    try {
        const response = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/get-clock-status?employee_id=${userId}`);
        const data = await response.json();

        // On stocke la VÉRITÉ absolue du serveur
        localStorage.setItem(`clock_status_${userId}`, data.status);
        localStorage.setItem(`clock_finished_${userId}`, data.day_finished);

        // LOGIQUE D'AFFICHAGE DU BOUTON (Priorité au verrouillage)
        if (data.day_finished === true) {
            updateClockUI('DONE'); // Force le gris, peu importe le reste
        } else if (data.status === 'IN') {
            updateClockUI('IN'); // Rouge (Sortie)
        } else {
            updateClockUI('OUT'); // Vert (Entrée)
        }
    } catch (e) { console.error(e); }
}



async function handleClockInOut() {
    const userId = currentUser.id;
    const today = new Date().toLocaleDateString('fr-CA');
    
    // --- 1. INITIALISATION DES VARIABLES ---
    let formResult = null; 
    let outcome = null;
    let report = null;
    let proofBlob = null; 
    let isLastExit = false;
    let presentedProducts = []; 
    let prescripteur_id = null;
    let contact_nom_libre = null;
    let schedule_id = null;
    let forced_location_id = null;

    // Récupération du contexte si lancé depuis l'agenda
    const savedContext = localStorage.getItem('active_mission_context');
    if (savedContext) {
        const ctx = JSON.parse(savedContext);
        schedule_id = ctx.missionId;
        forced_location_id = ctx.locationId; 
    }

    const empData = employees.find(e => e.id === userId);
    const isMobile = (empData?.employee_type === 'MOBILE') || (currentUser?.employee_type === 'MOBILE');
    
    const currentStatus = localStorage.getItem(`clock_status_${userId}`) || 'OUT';
    const action = (currentStatus === 'IN') ? 'CLOCK_OUT' : 'CLOCK_IN';

    // Sécurité pour les fixes
    if (!isMobile) {
        const inDone = localStorage.getItem(`clock_in_done_${userId}`) === 'true';
        const outDone = localStorage.getItem(`clock_out_done_${userId}`) === 'true';
        if (inDone && outDone) return Swal.fire('Terminé', 'Votre journée est clôturée.', 'success');
        if (action === 'CLOCK_IN' && inDone) return Swal.fire('Oups', 'Entrée déjà validée.', 'info');
    }

    // --- 2. LOGIQUE DE SORTIE MOBILE (POP-UP) ---
    if (action === 'CLOCK_OUT' && isMobile) {
        Swal.fire({ title: 'Chargement...', text: 'Préparation du rapport...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });

        let products = [];
        let prescripteurs = [];
        try {
            const [prodRes, presRes] = await Promise.all([
                secureFetch(`${SIRH_CONFIG.apiBaseUrl}/list-products`),
                secureFetch(`${SIRH_CONFIG.apiBaseUrl}/list-prescripteurs`)
            ]);
            products = await prodRes.json();
            prescripteurs = await presRes.json();
        } catch (e) { console.error("Erreur chargement CRM", e); }

        Swal.close();

        let presOptions = `<option value="">-- Choisir un contact --</option>` + 
            prescripteurs.map(p => `<option value="${p.id}">${p.nom_complet} (${p.fonction})</option>`).join('') +
            `<option value="autre" class="font-bold text-blue-600">➕ Autre (Nouveau Contact)</option>`;

        let productsHtml = products.map(p => `
            <label class="cursor-pointer group flex-shrink-0">
                <input type="checkbox" name="presented_prods" value="${p.id}" data-name="${p.name}" class="peer sr-only">
                <div class="flex items-center gap-2 p-1.5 pr-3 border border-slate-200 rounded-full peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700 transition-all bg-white shadow-sm hover:border-blue-300">
                    <img src="${p.photo_url || 'https://via.placeholder.com/50'}" class="w-7 h-7 object-cover rounded-full border border-slate-100">
                    <span class="text-[10px] font-black uppercase whitespace-nowrap">${p.name}</span>
                </div>
            </label>`).join('');

        // CORRECTION : On enlève le "const { value: formResult }" pour utiliser la variable du haut
        const swalRes = await Swal.fire({
            title: 'Fin de visite',
            customClass: { popup: 'wide-modal' },
html: `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
        <!-- COLONNE GAUCHE : FORMULAIRE -->
        <div class="space-y-6">
            <div class="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <label class="text-[10px] font-black text-slate-400 uppercase mb-3 block">1. Identification Contact</label>
                <select id="swal-prescripteur" class="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500">${presOptions}</select>
                <div id="container-autre-nom" class="hidden mt-3">
                    <input id="swal-nom-libre" class="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm" placeholder="Nom du contact...">
                </div>
            </div>

            <div class="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <label class="text-[10px] font-black text-slate-400 uppercase mb-3 block">2. Résultat de visite</label>
                <select id="swal-outcome" class="w-full p-3 bg-white border border-slate-200 rounded-xl font-black text-blue-600 outline-none">
                    <option value="VU">✅ Présentation effectuée</option>
                    <option value="ABSENT">❌ Médecin Absent</option>
                    <option value="COMMANDE">💰 Commande prise</option>
                    <option value="RAS">👍 Visite de courtoisie</option>
                </select>
                
                <p class="text-[9px] font-black text-slate-400 uppercase mt-4 mb-2">Produits présentés</p>
                <div class="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto p-1">${productsHtml}</div>
            </div>
        </div>

        <!-- COLONNE DROITE : MÉDIA & NOTES -->
        <div class="space-y-6 flex flex-col">
            <!-- SELECTEUR MODE -->
            <div class="flex p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
                <button type="button" onclick="switchProofMode('photo')" id="btn-mode-photo" class="flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all bg-white shadow-sm text-blue-600">📸 Cachet</button>
                <button type="button" onclick="switchProofMode('sign')" id="btn-mode-sign" class="flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all text-slate-500">✍️ Signature</button>
            </div>

            <!-- ZONE MÉDIA -->
            <div id="proof-photo-area" class="h-44 bg-slate-900 rounded-2xl overflow-hidden relative border-2 border-slate-200 flex-shrink-0 shadow-inner">
                <video id="proof-video" autoplay playsinline class="w-full h-full object-cover"></video>
                <img id="proof-image" class="w-full h-full object-cover hidden absolute top-0 left-0">
                <canvas id="proof-canvas" class="hidden"></canvas>
                <button type="button" id="btn-snap" class="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white text-slate-900 px-4 py-2 rounded-full text-[10px] font-black shadow-xl">CAPTURER</button>
            </div>

            <div id="proof-sign-area" class="hidden h-44 flex-shrink-0">
                <canvas id="visit-signature-pad" class="signature-zone w-full h-full bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200"></canvas>
            </div>

            <!-- NOTES & CLOTURE -->
            <div class="flex-1 space-y-4">
                <textarea id="swal-report" class="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm h-24 resize-none outline-none focus:bg-white" placeholder="Vos observations..."></textarea>
                
                <label class="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100 cursor-pointer group">
                    <input type="checkbox" id="last-exit-check" class="w-5 h-5 accent-red-600">
                    <span class="text-[10px] font-black text-red-700 uppercase">Clôturer ma journée après cette visite</span>
                </label>
            </div>
        </div>
    </div>
`,
            confirmButtonText: 'Valider le rapport',
            confirmButtonColor: '#2563eb',
            showCancelButton: true,
            cancelButtonText: 'Annuler',
            cancelButtonColor: '#ef4444', 
            allowOutsideClick: false,
            didOpen: () => {
                // 1. GESTION DU CONTEXTE (Mission & Médecin) - Inchangé
                const ctxMem = localStorage.getItem('active_mission_context');
                if (ctxMem) {
                    const c = JSON.parse(ctxMem);
                    if (c.prescripteurId) document.getElementById('swal-prescripteur').value = c.prescripteurId;
                    if (c.preNotes) document.getElementById('swal-report').value = `[Objectif: ${c.preNotes}] \n`;
                }
                
                document.getElementById('swal-prescripteur').addEventListener('change', (e) => {
                    document.getElementById('container-autre-nom').classList.toggle('hidden', e.target.value !== 'autre');
                });

                // 2. INITIALISATION CAMÉRA
                const video = document.getElementById('proof-video');
                // On s'assure que proofStream est bien assigné à la variable globale
                navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                    .then(s => { 
                        proofStream = s; 
                        if (video) video.srcObject = s; 
                    })
                    .catch(err => console.error("Erreur Caméra:", err));

                // 3. LOGIQUE CAPTURE PHOTO - Sécurisée
                document.getElementById('btn-snap').onclick = () => {
                    if (!video || video.videoWidth === 0) return Swal.fire('Patientez', 'La caméra s\'initialise...', 'info');
                    
                    const canvas = document.getElementById('proof-canvas');
                    canvas.width = video.videoWidth; 
                    canvas.height = video.videoHeight;
                    canvas.getContext('2d').drawImage(video, 0, 0);
                    
                    canvas.toBlob(b => { 
                        if(!b) return;
                        proofBlob = b; 
                        const imgPreview = document.getElementById('proof-image');
                        imgPreview.src = URL.createObjectURL(b); 
                        imgPreview.classList.remove('hidden'); 
                    }, 'image/jpeg', 0.8);
                };

            // 4. INITIALISATION SIGNATURE (AVEC FONCTION DE REDIMENSIONNEMENT)
                const signCanvas = document.getElementById('visit-signature-pad');
                
                // On prépare la fonction de calcul de taille
                window.reinitVisitCanvas = () => {
                    const ratio = Math.max(window.devicePixelRatio || 1, 1);
                    // On ne recalcule que si l'élément est visible à l'écran
                    if (signCanvas.offsetWidth > 0) {
                        signCanvas.width = signCanvas.offsetWidth * ratio;
                        signCanvas.height = signCanvas.offsetHeight * ratio;
                        signCanvas.getContext("2d").scale(ratio, ratio);
                        if (window.visitSignPad) window.visitSignPad.clear();
                    }
                };

                // Création du pad (on utilise un fond transparent au début pour éviter les bugs)
                window.visitSignPad = new SignaturePad(signCanvas, { 
                    backgroundColor: 'rgba(255, 255, 255, 0)', 
                    penColor: 'rgb(0, 0, 128)' 
                });    

                // 5. FONCTION SWITCH MODE (CORRIGÉE)
               window.switchProofMode = (mode) => {
                    const isPhoto = mode === 'photo';
                    
                    // 1. Gestion du flux vidéo (Inchangé)
                    if (!isPhoto && proofStream) { 
                        proofStream.getTracks().forEach(t => t.stop()); 
                        proofStream = null; 
                    } 
                    else if (isPhoto && !proofStream) { 
                        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                            .then(s => { 
                                proofStream = s; 
                                const v = document.getElementById('proof-video');
                                if (v) v.srcObject = s; 
                            }); 
                    }

                    // 2. Mise à jour visuelle de l'interface (Inchangé)
                    document.getElementById('proof-photo-area').classList.toggle('hidden', !isPhoto);
                    document.getElementById('proof-sign-area').classList.toggle('hidden', isPhoto);
                    
                    // --- AJOUT : RÉINITIALISATION DU CANVAS SI ON PASSE EN MODE SIGNATURE ---
                    if (!isPhoto) {
                        // On attend 50ms que la zone soit bien affichée par le navigateur
                        setTimeout(() => {
                            if (typeof window.reinitVisitCanvas === 'function') {
                                window.reinitVisitCanvas();
                            }
                        }, 50);
                    }
                    // -----------------------------------------------------------------------

                    // 3. Mise à jour des styles de boutons (Inchangé)
                    document.getElementById('btn-mode-photo').className = isPhoto ? 'flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase bg-white shadow-sm text-blue-600' : 'flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase text-slate-500';
                    document.getElementById('btn-mode-sign').className = !isPhoto ? 'flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase bg-white shadow-sm text-blue-600' : 'flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase text-slate-500';
                    
                    window.currentProofMode = mode;
                };

                // 6. ACTIONS FINALES
                window.clearVisitSignature = () => { window.visitSignPad.clear(); };
                window.currentProofMode = 'photo'; // Mode par défaut
            },
            preConfirm: () => {
                let finalProof = proofBlob;
                if (window.currentProofMode === 'sign' && !window.visitSignPad.isEmpty()) {
                    finalProof = dataURLtoBlob(window.visitSignPad.toDataURL('image/png'));
                }
                return {
                    outcome: document.getElementById('swal-outcome').value,
                    report: document.getElementById('swal-report').value,
                    isLastExit: document.getElementById('last-exit-check').checked,
                    prescripteur_id: document.getElementById('swal-prescripteur').value,
                    contact_nom_libre: document.getElementById('swal-nom-libre').value,
                    selectedProducts: Array.from(document.querySelectorAll('input[name="presented_prods"]:checked')).map(i => ({id: i.value, name: i.dataset.name})),
                    proofFile: finalProof 
                };
            }
        });

        if (!swalRes.value) return; 
        formResult = swalRes.value;
        outcome = formResult.outcome;
        report = formResult.report;
        isLastExit = formResult.isLastExit;
        presentedProducts = formResult.selectedProducts;
        prescripteur_id = formResult.prescripteur_id;
        contact_nom_libre = formResult.contact_nom_libre;
    }

    // --- 3. POINTAGE GPS & ENVOI ---
    Swal.fire({ title: 'Vérification...', text: 'Analyse GPS...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });

    try {
        const ipRes = await fetch('https://api.ipify.org?format=json').then(r => r.json());
        const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
        const currentGps = `${pos.coords.latitude},${pos.coords.longitude}`;

        const fd = new FormData();
        fd.append('id', userId);
        fd.append('action', action);
        fd.append('gps', currentGps);
        fd.append('ip', ipRes.ip);
        fd.append('agent', currentUser.nom);
        
        // Sécurisation de l'envoi : on n'envoie les rapports que si on est en CLOCK_OUT
        if (action === 'CLOCK_OUT' && isMobile) {
            fd.append('outcome', outcome || 'VU');
            fd.append('report', report || '');
            if (prescripteur_id) fd.append('prescripteur_id', prescripteur_id);
            if (contact_nom_libre) fd.append('contact_nom_libre', contact_nom_libre);
            if (presentedProducts) fd.append('presentedProducts', JSON.stringify(presentedProducts));
            if (schedule_id) fd.append('schedule_id', schedule_id);
            if (forced_location_id) fd.append('forced_location_id', forced_location_id);
            
            if (formResult && formResult.proofFile) {
                Swal.update({ text: 'Compression de la preuve...' });
                const compressed = await compressImage(formResult.proofFile);
                fd.append('proof_photo', compressed, 'preuve_visite.jpg');
            }
            if (isLastExit) fd.append('is_last_exit', 'true');
        }

        const response = await secureFetch(URL_CLOCK_ACTION, { method: 'POST', body: fd });
        const resData = await response.json();

        if (response.ok) {
            const nowStr = new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
            if (typeof PremiumUI !== 'undefined') { PremiumUI.vibrate('success'); PremiumUI.play('success'); }
            
            localStorage.removeItem('active_mission_context');
            let nextState = (action === 'CLOCK_IN') ? 'IN' : 'OUT';
            localStorage.setItem(`clock_status_${userId}`, nextState);
            if (isLastExit || !isMobile) localStorage.setItem(`clock_finished_${userId}`, 'true');

            fetchMobileSchedules(); 
            updateClockUI(nextState);
            document.getElementById('clock-last-action').innerText = `Validé : ${action==='CLOCK_IN'?'Entrée':'Sortie'} à ${nowStr}`;
            Swal.fire('Succès', `Pointage validé : ${resData.zone}`, 'success');
        } else {
            throw new Error(resData.error);
        }
    } catch (e) {
        Swal.fire('Erreur', e.message, 'error');
    }
}


function dataURLtoBlob(dataurl) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){ u8arr[n] = bstr.charCodeAt(n); }
    return new Blob([u8arr], {type:mime});
}


function openFullFolder(id) {
    const e = employees.find(x => x.id === id); 
    if(!e) return;
    
    // 1. Remplissage de l'identité de base
    document.getElementById('folder-photo').src = formatGoogleLink(e.photo) || 'https://via.placeholder.com/150';
    document.getElementById('folder-name').innerText = e.nom; 
    document.getElementById('folder-id').innerText = "MATRICULE : " + e.matricule;
    document.getElementById('folder-poste').innerText = e.poste; 
    document.getElementById('folder-dept').innerText = e.dept;
    document.getElementById('folder-email').innerText = e.email || "Non renseigné"; 
    document.getElementById('folder-phone').innerText = e.telephone || "Non renseigné";
    document.getElementById('folder-address').innerText = e.adresse || "Non renseignée";
    
    // 2. Gestion des dates de contrat
    if(e.date) { 
        let sD = parseDateSmart(e.date); 
        document.getElementById('folder-start').innerText = sD.toLocaleDateString('fr-FR'); 
        let eD = new Date(sD); 
        eD.setDate(eD.getDate() + (parseInt(e.limit) || 365)); 
        document.getElementById('folder-end').innerText = eD.toLocaleDateString('fr-FR'); 
    }

    // --- 3. NOUVEAU : INSERTION DU BLOC RÉMUNÉRATION (SÉCURISÉ) ---
    // On cherche l'endroit dans la colonne de gauche (md:w-1/3) pour injecter le salaire
    const infoContainer = document.getElementById('folder-dept').parentElement.parentElement;
    
    // On vérifie si le bloc existe déjà pour ne pas le doubler
    const existingSalary = document.getElementById('folder-salary-block');
    if (existingSalary) existingSalary.remove();

    const salaryHtml = `
    <div id="folder-salary-block" class="mt-4 pt-4 border-t border-white/10">
        <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Salaire de Base Fixe</p>
        <div class="flex items-center gap-2">
            <p class="text-sm font-black text-blue-400 sensitive-value" onclick="toggleSensitiveData(this)">
                ${new Intl.NumberFormat('fr-FR').format(e.salaire_base_fixe || 0)} CFA
            </p>
            <i class="fa-solid fa-eye-slash text-[9px] text-slate-600"></i>
        </div>
    </div>`;
    
    infoContainer.insertAdjacentHTML('beforeend', salaryHtml);
    // -------------------------------------------------------------

    // 4. Remplissage de la grille des documents
    const grid = document.getElementById('folder-docs-grid'); 
    grid.innerHTML = '';

    const docs = [ 
        { label: 'Contrat Actuel', link: e.doc, icon: 'fa-file-signature', color: 'blue', key: 'contrat' }, 
        { label: 'Curriculum Vitae', link: e.cv_link, icon: 'fa-file-pdf', color: 'indigo', key: 'cv' }, 
        { label: 'Lettre Motivation', link: e.lm_link, icon: 'fa-envelope-open-text', color: 'pink', key: 'lm' },
        { label: 'Pièce d\'Identité', link: e.id_card_link, icon: 'fa-id-card', color: 'slate', key: 'id_card' }, 
        { label: 'Diplômes/Certifs', link: e.diploma_link, icon: 'fa-graduation-cap', color: 'emerald', key: 'diploma' },
        { label: 'Attestations / Autres', link: e.attestation_link, icon: 'fa-file-invoice', color: 'orange', key: 'attestation' } 
    ];

    docs.forEach(doc => { 
        const hasLink = doc.link && doc.link.length > 5; 
        const safeLabel = doc.label.replace(/'/g, "\\'");
        const canEdit = (currentUser.role === 'ADMIN' || currentUser.role === 'RH' || currentUser.role === 'MANAGER');

        grid.innerHTML += `
            <div class="p-4 rounded-2xl border ${hasLink ? 'bg-white shadow-sm border-slate-200' : 'bg-slate-100 opacity-50'} flex items-center justify-between group">
                <div class="flex items-center gap-3">
                    <div class="p-2.5 rounded-xl bg-${doc.color}-50 text-${doc.color}-600"><i class="fa-solid ${doc.icon}"></i></div>
                    <p class="text-xs font-bold text-slate-700">${doc.label}</p>
                </div>
                <div class="flex gap-2">
                    ${hasLink ? `<button onclick="viewDocument('${doc.link}', '${safeLabel}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Consulter"><i class="fa-solid fa-eye"></i></button>` : ''}
                    ${canEdit ? `<button onclick="updateSingleDoc('${doc.key}', '${e.id}')" class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Modifier"><i class="fa-solid fa-pen-to-square"></i></button>` : ''}
                </div>
            </div>`; 
    });        
    
    document.getElementById('folder-modal').classList.remove('hidden');
}
            
function closeFolderModal() { document.getElementById('folder-modal').classList.add('hidden'); }
    
        

function formatGoogleLink(link) {
        if (!link || link === '#' || link === 'null') {
            return 'https://ui-avatars.com/api/?background=cbd5e1&color=fff&size=128';
        }

        let url = String(link);

        // Si c'est un lien qui vient de Supabase Storage, on ne le transforme pas
        if (url.includes('supabase.co/storage')) {
            return url;
        }

        // Si c'est un lien Google Drive, on applique la transformation habituelle
        const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
        if (idMatch && idMatch[1]) {
            return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
        }

        return url;
    }



    // Nouvelle fonction helper pour extraire juste l'ID (nécessaire pour la preview)
    function getDriveId(link) {
        if (!link) return null;
        const str = String(link);
        const match = str.match(/\/d\/([a-zA-Z0-9_-]+)/) || str.match(/id=([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
    }




// --- MISE À JOUR DU CATALOGUE PRODUITS ---

async function fetchProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    
    grid.innerHTML = '<div class="col-span-full text-center p-10"><i class="fa-solid fa-circle-notch fa-spin text-blue-500 text-3xl"></i></div>';

    try {
        const r = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/list-products`);
        const products = await r.json();
        
        // On garde les produits en mémoire globale pour la recherche et le détail
        window.allProductsData = products;

        grid.innerHTML = '';
        if (products.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center text-slate-400 py-10 italic border-2 border-dashed rounded-[2rem]">Catalogue vide.</div>';
            return;
        }

        products.forEach(p => {
            const img = p.photo_url ? p.photo_url : 'https://via.placeholder.com/300x200?text=Pas+d\'image';
            
            // On ajoute la classe 'product-card' et le 'data-name' pour le filtrage local
            grid.innerHTML += `
                <div class="product-card bg-white rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all animate-fadeIn" 
                     data-id="${p.id}" data-name="${p.name.toLowerCase()}">
                    
                    <div class="h-48 bg-slate-50 relative overflow-hidden">
                        <img src="${img}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                        ${(currentUser.role === 'ADMIN') ? `
                        <button onclick="deleteProduct('${p.id}')" class="absolute top-3 right-3 w-8 h-8 bg-white/90 text-red-500 rounded-full shadow-lg hover:bg-red-500 hover:text-white transition-all">
                            <i class="fa-solid fa-trash-can text-xs"></i>
                        </button>` : ''}
                    </div>

                    <div class="p-5">
                        <div class="mb-4">
                            <h4 class="font-black text-slate-800 uppercase text-xs tracking-tighter line-clamp-1">${p.name}</h4>
                            <p class="text-[10px] text-slate-400 mt-1 line-clamp-2">${p.description || 'Aucune description disponible.'}</p>
                        </div>
                        
                        <!-- BOUTON VOIR LA FICHE -->
                        <button onclick="viewProductDetail('${p.id}')" class="w-full py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95">
                            Voir la fiche
                        </button>
                    </div>
                </div>`;
        });
    } catch (e) { console.error(e); }
}




function viewProductDetail(id) {
    const p = window.allProductsData.find(item => item.id == id);
    if (!p) return;

    const img = p.photo_url ? p.photo_url : 'https://via.placeholder.com/600x400?text=Pas+d\'image';

    Swal.fire({
        width: '850px',
        padding: '0',
        showConfirmButton: false,
        showCloseButton: true,
        customClass: { popup: 'rounded-[2rem] overflow-hidden' },
        html: `
            <div class="flex flex-col md:flex-row text-left bg-white h-auto md:h-[500px]">
                <!-- GAUCHE : IMAGE (60%) -->
                <div class="w-full md:w-[55%] bg-slate-100 relative group overflow-hidden">
                    <img src="${img}" class="w-full h-full object-cover">
                    <!-- Si tu as plusieurs photos plus tard, on mettra les flèches ici -->
                    <div class="absolute bottom-4 left-4 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-[10px] font-bold">
                        Réf: PROD-${p.id.substring(0,5).toUpperCase()}
                    </div>
                </div>

                <!-- DROITE : CONTENU (40%) -->
                <div class="w-full md:w-[45%] p-8 flex flex-col justify-between">
                    <div>
                        <span class="inline-block bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-4">
                            Détails Produit
                        </span>
                        <h3 class="text-3xl font-black text-slate-800 leading-tight mb-4 uppercase tracking-tighter">${p.name}</h3>
                        
                        <div class="h-[1px] w-12 bg-blue-500 mb-6"></div>
                        
                        <p class="text-sm text-slate-500 leading-relaxed italic mb-8 overflow-y-auto max-h-[180px] custom-scroll pr-2">
                            "${p.description || 'Aucune description détaillée n\'a été renseignée pour ce produit.'}"
                        </p>

                        <!-- Infos Supplémentaires -->
                        <div class="space-y-3">
                            <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <i class="fa-solid fa-box text-blue-500"></i>
                                <span class="text-[10px] font-bold text-slate-700 uppercase">Stock : Disponible</span>
                            </div>
                        </div>
                    </div>

                    <div class="mt-8 pt-6 border-t border-slate-100">
                        <button onclick="Swal.close()" class="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-blue-600 transition-all">
                            Fermer la fiche
                        </button>
                    </div>
                </div>
            </div>
        `
    });
}


// Fonction de recherche instantanée (Local)
function filterProductsLocally() {
    const term = document.getElementById('search-product-input').value.toLowerCase();
    document.querySelectorAll('.product-card').forEach(card => {
        const name = card.dataset.name;
        card.style.display = name.includes(term) ? '' : 'none';
    });
}

async function openAddProductModal() {
    const { value: file } = await Swal.fire({
        title: 'Nouveau Produit',
        html: `
            <input id="p-name" class="swal2-input" placeholder="Nom du médicament / produit">
            <textarea id="p-desc" class="swal2-textarea" placeholder="Description courte..."></textarea>
            <p class="text-[10px] font-black text-slate-400 uppercase mt-4">Photo du produit</p>
        `,
        input: 'file',
        inputAttributes: { 'accept': 'image/*', 'aria-label': 'Photo du produit' },
        showCancelButton: true,
        confirmButtonText: 'Enregistrer',
        preConfirm: (file) => {
            return {
                name: document.getElementById('p-name').value,
                description: document.getElementById('p-desc').value,
                photo: file
            }
        }
    });

    if (file && file.name) {
        Swal.fire({ title: 'Enregistrement...', didOpen: () => Swal.showLoading() });
        const fd = new FormData();
        fd.append('name', file.name);
        fd.append('description', file.description);
        fd.append('photo', file.photo);
        await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/add-product`, { method: 'POST', body: fd });
        fetchProducts();
        Swal.fire('Succès', 'Produit ajouté au catalogue', 'success');
    }
}











async function fetchMyActivityRecap() {
    console.log("🚀 DÉBUT fetchMyActivityRecap (Filtrage Chronologique)");
    
    const visitContainer = document.getElementById('my-today-visits');
    const dailyContainer = document.getElementById('my-month-dailies');
    if(!visitContainer) return;

    visitContainer.innerHTML = '<div class="text-center py-4"><i class="fa-solid fa-spinner fa-spin text-blue-500"></i></div>';
    if(dailyContainer) dailyContainer.innerHTML = '<div class="text-center py-4"><i class="fa-solid fa-spinner fa-spin text-blue-500"></i></div>';

    try {
        const timeHack = Date.now();
       const [visRes, daiRes] = await Promise.all([
            secureFetch(`${SIRH_CONFIG.apiBaseUrl}/read-visit-reports?limit=1000&personal=true&t=${timeHack}`), 
            secureFetch(`${SIRH_CONFIG.apiBaseUrl}/read-daily-reports?limit=100&personal=true&t=${timeHack}`)
        ]);

        const allVisits = await visRes.json();
        const allDailies = await daiRes.json();
        
        const now = new Date();
        const todayLocal = now.toLocaleDateString();

        // --- CALCUL DE LA LIMITE DES 31 JOURS ---
        const thirtyOneDaysAgo = new Date();
        thirtyOneDaysAgo.setDate(now.getDate() - 31);

        // 3. Filtrage Visites : Aujourd'hui seulement + Tri Récent en haut
        const myVisits = (allVisits.data || allVisits)
            .filter(v => {
                if (v.employee_id !== currentUser.id) return false;
                const vDate = new Date(v.check_in).toLocaleDateString();
                return vDate === todayLocal;
            })
            .sort((a, b) => new Date(b.check_in) - new Date(a.check_in)); // Tri décroissant

        console.log(`✅ VISITES D'AUJOURD'HUI : ${myVisits.length}`);

        // 4. Affichage Visites
        if (myVisits.length > 0) {
            visitContainer.innerHTML = myVisits.map(v => `
                <div class="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100 mb-2 animate-fadeIn">
                    <div>
                        <p class="text-[10px] font-black text-blue-700 uppercase">${v.lieu_nom}</p>
                        <p class="text-[9px] text-slate-400">
                            ${new Date(v.check_in).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                        </p>
                    </div>
                    <span class="text-[9px] font-bold bg-white px-2 py-1 rounded shadow-sm text-emerald-600">${v.outcome || 'VU'}</span>
                </div>
            `).join('');
        } else {
            visitContainer.innerHTML = '<div class="text-center py-6 border border-dashed rounded-xl"><p class="text-[10px] text-slate-400 italic">0 visite trouvée pour ce jour.</p></div>';
        }

        // 5. Filtrage Bilans : 31 derniers jours + Tri Récent en haut
        const myDailies = (allDailies.data || allDailies)
            .filter(d => {
                if (d.employee_id !== currentUser.id) return false;
                const dDate = new Date(d.report_date);
                return dDate >= thirtyOneDaysAgo; // Règle des 31 jours
            })
            .sort((a, b) => new Date(b.report_date) - new Date(a.report_date)); // Tri décroissant

        console.log(`✅ BILANS DES 31 JOURS : ${myDailies.length}`);

        // Affichage Bilans
        if (myDailies.length > 0) {
            dailyContainer.innerHTML = myDailies.map(d => `
                <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-2 animate-fadeIn">
                    <p class="text-[9px] font-black text-slate-500 mb-1">${new Date(d.report_date).toLocaleDateString('fr-FR', {weekday: 'short', day: 'numeric', month: 'short'})}</p>
                    <p class="text-[10px] text-slate-600 italic line-clamp-1">${d.summary}</p>
                </div>
            `).join('');
        } else {
            dailyContainer.innerHTML = '<div class="text-center py-6 border border-dashed rounded-xl"><p class="text-[10px] text-slate-400 italic">0 bilan sur les 31 derniers jours.</p></div>';
        }

    } catch (e) {
        console.error("❌ CRASH FETCH PROFIL:", e);
        visitContainer.innerHTML = '<p class="text-[10px] text-red-500">Erreur technique</p>';
    }
}


async function loadMyProfile() {
    console.log("🔍 --- DÉBUT CHARGEMENT PROFIL PERSONNEL ---");
    console.log("👤 Utilisateur connecté :", currentUser);
            
    // 1. Sécurité : Vérifier que l'utilisateur est bien connecté
    if (!currentUser || !currentUser.id) {
        console.error("❌ Pas d'utilisateur connecté ou ID manquant pour charger le profil.");
        Swal.fire('Erreur', 'Impossible de charger votre profil. Veuillez vous reconnecter.', 'error');
        return;
    }

    // --- 2. NETTOYAGE IMMÉDIAT DE L'INTERFACE POUR ÉVITER LE FLICKER ---
    document.getElementById('emp-name').innerText = "Chargement...";
    document.getElementById('emp-job').innerText = "Chargement...";
    document.getElementById('emp-email').value = "";
    document.getElementById('emp-phone').value = "";
    document.getElementById('emp-address').value = "";
    document.getElementById('emp-dob').value = "";
    document.getElementById('folder-docs-grid').innerHTML = '<div class="col-span-full text-center text-slate-400 py-10 italic">Chargement des documents...</div>';
    


    const photoEl = document.getElementById('emp-photo-real');
    const avatarEl = document.getElementById('emp-avatar');
    if (photoEl) photoEl.classList.add('hidden');
    if (avatarEl) {
        avatarEl.classList.remove('hidden');
        avatarEl.innerText = (currentUser.nom || "U").charAt(0).toUpperCase();
    }
    document.getElementById('emp-start-date').innerText = '--/--/----';
    document.getElementById('emp-end-date').innerText = '--/--/----';
    document.getElementById('leave-balance-display').innerText = '--';


    // --- 3. APPEL ASYNCHRONE AU SERVEUR ---
    try {
        const r = await secureFetch(`${URL_READ}?target_id=${encodeURIComponent(currentUser.id)}&agent=${encodeURIComponent(currentUser.nom)}`);
        const result = await r.json();
        const myRawData = result.data?.[0]; 

        if (!myRawData) {
            console.error("❌ ÉCHEC : Impossible de trouver votre profil.");
            Swal.fire('Erreur', 'Votre fiche employé est introuvable.', 'error');
            return;
        }

        // --- 4. MAPPING DES DONNÉES ---
        const myData = {
            id: myRawData.id, 
            nom: myRawData.nom, 
            date: myRawData.date_embauche, 
            employee_type: myRawData.employee_type || 'OFFICE', 
            poste: myRawData.poste, 
            dept: myRawData.departement || "Non défini", 
            solde_conges: parseFloat(myRawData.solde_conges) || 0,
            limit: myRawData.type_contrat === 'CDI' ? '365' : (myRawData.type_contrat === 'CDD' ? '180' : '90'), 
            photo: myRawData.photo_url || '', 
            statut: myRawData.statut || 'Actif', 
            email: myRawData.email, 
            telephone: myRawData.telephone, 
            adresse: myRawData.adresse, 
            date_naissance: myRawData.date_naissance, 
            role: myRawData.role || 'EMPLOYEE',
            matricule: myRawData.matricule || 'N/A',
            doc: myRawData.contrat_pdf_url || '',
            cv_link: myRawData.cv_url || '',
            id_card_link: myRawData.id_card_url || '',
            diploma_link: myRawData.diploma_url || '',
            attestation_link: myRawData.attestation_url || '',
            lm_link: myRawData.lm_url || '',
            contract_status: myRawData.contract_status || 'Non signé'
        };
        
        // --- 5. REMPLISSAGE DE L'INTERFACE ---
        document.getElementById('emp-name').innerText = myData.nom; 
        document.getElementById('emp-job').innerText = myData.poste;
        
        const nameDisplay = document.getElementById('name-display');
        if (nameDisplay) nameDisplay.innerText = myData.nom;

        if(myData.photo && myData.photo.length > 10) { 
            photoEl.src = formatGoogleLink(myData.photo); 
            photoEl.classList.remove('hidden'); 
            avatarEl.classList.add('hidden'); 
        }

        if(myData.date) { 
            let sD = parseDateSmart(myData.date); 
            document.getElementById('emp-start-date').innerText = sD.toLocaleDateString('fr-FR'); 
            let eD = new Date(sD); 
            eD.setDate(eD.getDate() + (parseInt(myData.limit) || 365)); 
            document.getElementById('emp-end-date').innerText = eD.toLocaleDateString('fr-FR'); 
        }

        document.getElementById('emp-email').value = myData.email || ""; 
        document.getElementById('emp-phone').value = myData.telephone || ""; 
        document.getElementById('emp-address').value = myData.adresse || ""; 
        document.getElementById('emp-dob').value = convertToInputDate(myData.date_naissance); 
        
        // Gestion des documents
        const dC = document.getElementById('doc-container'); 
        if (dC) {
            dC.innerHTML = '';
            const allDocs = [ 
                { label: 'Contrat Actuel', link: myData.doc, icon: 'fa-file-signature', color: 'blue', key: 'contrat' }, 
                { label: 'Curriculum Vitae', link: myData.cv_link, icon: 'fa-file-pdf', color: 'indigo', key: 'cv' }, 
                { label: 'Lettre Motivation', link: myData.lm_link, icon: 'fa-envelope-open-text', color: 'pink', key: 'lm' },
                { label: 'Pièce d\'Identité', link: myData.id_card_link, icon: 'fa-id-card', color: 'slate', key: 'id_card' }, 
                { label: 'Diplômes/Certifs', link: myData.diploma_link, icon: 'fa-graduation-cap', color: 'emerald', key: 'diploma' },
                { label: 'Attestations', link: myData.attestation_link, icon: 'fa-file-invoice', color: 'orange', key: 'attestation' } 
            ];

            const VISIBLE_LIMIT = 4;
            let gridHtml = '<div class="grid grid-cols-1 md:grid-cols-4 gap-4">'; 

            allDocs.forEach((doc, index) => {
                const hasLink = doc.link && doc.link.length > 5;
                const safeLabel = doc.label.replace(/'/g, "\\'");
                const hiddenClass = index >= VISIBLE_LIMIT ? 'hidden more-docs' : '';
                const isAdminOrRH = (currentUser.role === 'ADMIN' || currentUser.role === 'RH');
                const canEdit = isAdminOrRH || (doc.key === 'id_card');

                gridHtml += `
                    <div class="${hiddenClass} flex flex-col justify-between p-4 border border-slate-100 bg-white rounded-2xl hover:shadow-md transition-all group h-full">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="bg-${doc.color}-50 text-${doc.color}-600 p-3 rounded-xl shrink-0"><i class="fa-solid ${doc.icon} text-lg"></i></div>
                            <div class="overflow-hidden">
                                <p class="text-xs font-bold text-slate-700 truncate">${doc.label}</p>
                                <p class="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Document</p>
                            </div>
                        </div>
                        <div class="flex gap-2 mt-auto">
                            ${hasLink ? `<button onclick="viewDocument('${doc.link}', '${safeLabel}')" class="flex-1 py-2 text-[10px] font-bold uppercase bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all">Voir</button>` : `<div class="flex-1 py-2 text-[10px] font-bold uppercase bg-slate-50 text-slate-300 rounded-lg text-center cursor-not-allowed">Vide</div>`}
                            ${canEdit ? `<button onclick="updateSingleDoc('${doc.key}', '${myData.id}')" class="w-10 flex items-center justify-center bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-800 hover:text-white transition-all"><i class="fa-solid fa-pen"></i></button>` : ''}
                        </div>
                    </div>`;
            });
            gridHtml += '</div>';
            if (allDocs.length > VISIBLE_LIMIT) gridHtml += `<div class="text-center mt-4 pt-2 border-t border-slate-50"><button onclick="toggleMoreDocs(this)" class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-500 hover:text-blue-600 transition-all shadow-sm"><i class="fa-solid fa-circle-plus"></i> Voir plus</button></div>`;
            dC.innerHTML = gridHtml;
        }

        const leaveBalanceEl = document.getElementById('leave-balance-display');
        const solde = myData.solde_conges;
        if(leaveBalanceEl) {
            leaveBalanceEl.innerText = `${solde} jours`;
            leaveBalanceEl.className = solde <= 5 ? "text-4xl font-black mt-2 text-orange-600" : "text-4xl font-black mt-2 text-indigo-600";
        }

// --- LOGIQUE DE CHARGEMENT DES DONNÉES DE TERRAIN ---
        const mobileSection = document.getElementById('mobile-recap-section');
        
        if (myData.employee_type === 'MOBILE') {
            // Si c'est un agent de terrain, on affiche les blocs de récapitulatif (Visites/Bilans)
            if (mobileSection) mobileSection.classList.remove('hidden');
            
            // On lance le chargement de ses statistiques d'activité
            if (typeof fetchMyActivityRecap === 'function') {
                fetchMyActivityRecap();
            }
        } else {
            // Pour un employé de bureau, on cache les blocs de statistiques terrain
            if (mobileSection) mobileSection.classList.add('hidden');
        }
        
        // Note : Le bouton "Rapport de Fin de Journée" est maintenant géré 
        // automatiquement par applyPermissionsUI via l'attribut data-perm="can_submit_daily_report"
                
    } catch (e) {
        console.error("Erreur de chargement du profil personnel:", e);
        Swal.fire('Erreur', 'Impossible de charger votre profil.', 'error');
    }
}



function switchView(v) { 

    localStorage.setItem('sirh_last_view', v);       
    
    // --- 1. INITIALISATION DE L'ANIMATION (FADE OUT) ---
    const mainContainer = document.getElementById('main-scroll-container');
    if (mainContainer) {
        mainContainer.style.opacity = '0';
        mainContainer.style.transform = 'translateY(10px)';
        mainContainer.style.transition = 'none'; 
    }

    if (window.chatIntervalId) {
        clearInterval(window.chatIntervalId);
        window.chatIntervalId = null;
    }

    currentView = v;
    console.log("Vue active :", currentView);

    if(videoStream) { videoStream.getTracks().forEach(t => t.stop()); videoStream = null; }
    if(contractStream) { contractStream.getTracks().forEach(t => t.stop()); contractStream = null; }
    
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });

    const target = document.getElementById('view-' + v);
    if(target) target.classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('bg-blue-600', 'text-white');
    });
    
    const activeBtn = document.querySelector(`button[onclick="switchView('${v}')"]`);
    if(activeBtn) activeBtn.classList.add('bg-blue-600', 'text-white');

    if(mainContainer) {
        mainContainer.scrollTo(0, 0); 
    }
    window.scrollTo(0, 0); 

    // Logique de recherche et accounting
    const searchContainer = document.getElementById('global-search-container');
    if(v === 'employees' || v === 'logs') { 
        if(currentUser && currentUser.role !== 'EMPLOYEE') { 
            searchContainer.style.visibility = 'visible'; 
            searchContainer.style.opacity = '1'; 
        }
    } else { 
        searchContainer.style.visibility = 'hidden'; 
        searchContainer.style.opacity = '0'; 
    }
    
    
    if (v === 'dash') {
        renderCharts();
        fetchLiveAttendance();
    }

    // 2. Collaborateurs (Affichage de la liste)
    if (v === 'employees') {
        renderData();
    }

    if (v === 'catalog') {
        fetchProducts(); 
    }

    if (v === 'maintenance') {
        // Pas de chargement automatique nécessaire pour l'instant
        // On pourrait ajouter fetchServerStats() ici dans le futur (Vision 20 ans)
    }
            
    if (v === 'accounting') loadAccountingView();
    
            if (v === 'prescripteurs-list') fetchPrescripteursManagement();

    if(v === 'add-new') { 
        const form = document.getElementById('form-onboarding');
        if(form) form.reset(); 
        resetCamera(); 
        populateManagerSelects();
    }

    if (v === 'chat') {
        fetchMessages(); 
        initChatRealtime();
    } else {
        if (chatSubscription) {
            supabaseClient.removeChannel(chatSubscription);
            chatSubscription = null;
        }
    }

    // MODULES MOBILES
    if (v === 'mobile-locations') fetchMobileLocations();
    if (v === 'mobile-planning') fetchMobileSchedules();
    if (v === 'contract-templates') fetchTemplates();
    if (v === 'mobile-planning') fetchMobileSchedules();


    
    // Correction spécifique pour les rapports opérationnels
    if (v === 'mobile-reports') {
        fetchMobileReports();      // Charge la liste (visites ou bilans)
        renderPerformanceTable(); // Charge les stats (Total visites, synthèses)
    }

    if(v === 'settings') fetchZones(); 
    if(v === 'logs') fetchLogs(1); 
    if(v === 'recruitment') fetchCandidates();
    if(v === 'my-profile') {
        loadMyProfile(); 
        fetchPayrollData();
        fetchLeaveRequests(); 
    }

    // --- SEULE MODIFICATION ICI (Pour forcer la fermeture propre sur mobile) ---
    if(window.innerWidth < 768) { 
        const sb = document.getElementById('sidebar'); 
        if(!sb.classList.contains('-translate-x-full')) {
            toggleSidebar(true); 
        }
    }
    // -------------------------------------------------------------------------

    // --- 2. DÉCLENCHEMENT DE L'ANIMATION (FADE IN) ---
    setTimeout(() => {
        if (mainContainer) {
            mainContainer.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            mainContainer.style.opacity = '1';
            mainContainer.style.transform = 'translateY(0)';
        }
        if ("vibrate" in navigator) navigator.vibrate(8);
    }, 50);
}









// ============================================================
// LOGIQUE ACTIONS DE MASSE (MANQUANTE DANS TON FICHIER)
// ============================================================

function toggleBulkActions() {
    const checkboxes = document.querySelectorAll('.emp-select-checkbox:checked');
    const bar = document.getElementById('bulk-action-bar');
    const countSpan = document.getElementById('selected-count');

    if (bar && countSpan) {
        if (checkboxes.length > 0) {
            bar.classList.remove('hidden');
            countSpan.innerText = checkboxes.length;
        } else {
            bar.classList.add('hidden');
        }
    }
}





async function deleteEmployee(id) {
    // 1. On cherche le nom de l'employé pour personnaliser l'alerte
    const emp = employees.find(e => e.id === id);
    const empName = emp ? emp.nom : "ce collaborateur";

    // 2. Alerte de confirmation de sécurité
    const result = await Swal.fire({
        title: 'Suppression Définitive',
        text: `Êtes-vous sûr de vouloir supprimer ${empName} ? Cette action effacera son profil, son historique et ses accès au système.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444', // Rouge
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Oui, supprimer',
        cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
        Swal.fire({ title: 'Suppression en cours...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        try {
            // 3. Appel au serveur via secureFetch pour envoyer le token
            const response = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/delete-employee`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id, agent: currentUser.nom })
            });

            if (response.ok) {
                Swal.fire('Supprimé !', 'Le collaborateur a été retiré de la base.', 'success');
                // 4. On rafraîchit la liste immédiatement
                fetchData(true, 1); 
            } else {
                const err = await response.json();
                throw new Error(err.error || "Erreur serveur lors de la suppression.");
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Erreur', error.message, 'error');
        }
    }
}


async function openBulkManagerModal() {
    const selectedIds = Array.from(document.querySelectorAll('.emp-select-checkbox:checked')).map(cb => cb.value);
    
    if (selectedIds.length === 0) return;

    // On charge une liste large pour le select des managers potentiels
    try {
        const r = await secureFetch(`${URL_READ}?limit=500&status=Actif`); 
        const result = await r.json();
        const potentialManagers = result.data || [];

        let options = `<option value="">-- Aucun / Détacher --</option>`;
        potentialManagers.forEach(m => {
            // On évite de s'auto-sélectionner
            if (!selectedIds.includes(m.id)) {
                options += `<option value="${m.id}">${m.nom} (${m.poste})</option>`;
            }
        });

        const { value: managerId } = await Swal.fire({
            title: `Assigner ${selectedIds.length} personnes`,
            html: `
                <p class="text-sm text-slate-500 mb-4">Choisissez le responsable hiérarchique direct (N+1).</p>
                <select id="bulk-manager-select" class="swal2-input text-sm">${options}</select>
            `,
            showCancelButton: true,
            confirmButtonText: 'Valider',
            confirmButtonColor: '#0f172a',
            preConfirm: () => document.getElementById('bulk-manager-select').value
        });

        if (typeof managerId !== 'undefined') {
            Swal.fire({ title: 'Mise à jour...', didOpen: () => Swal.showLoading() });
            
            const res = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/bulk-assign-manager`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employee_ids: selectedIds, manager_id: managerId || null })
            });

            if (res.ok) {
                Swal.fire('Succès', 'Hiérarchie mise à jour !', 'success');
                fetchData(true); // On rafraîchit la liste
                document.getElementById('bulk-action-bar').classList.add('hidden');
            }
        }
    } catch (e) { 
        console.error(e);
        Swal.fire('Erreur', "Impossible de charger la liste ou de mettre à jour.", 'error'); 
    }
}





function toggleSidebar(forceClose = false) {
    const sb = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const isMobile = window.innerWidth < 768;

    // 1. On bascule la classe de translation (Cacher/Afficher) ou on force la fermeture
    if (forceClose === true) {
        sb.classList.add('-translate-x-full');
    } else {
        sb.classList.toggle('-translate-x-full');
    }

    // 2. On vérifie l'état RÉEL de la sidebar après l'action
    const isSidebarHidden = sb.classList.contains('-translate-x-full');

    if (isMobile) {
        // Sur mobile, on gère l'overlay sombre EN FONCTION de l'état de la sidebar
        if (isSidebarHidden) {
            overlay.classList.add('hidden');
        } else {
            overlay.classList.remove('hidden');
        }
    } else {
        // Sur ordinateur, on peut ajouter une petite animation de transition
        // Si la sidebar est cachée, on s'assure que l'overlay est caché
        overlay.classList.add('hidden');
    }
}

          
        
            function parseDateSmart(d){if(!d)return new Date();if(!isNaN(d)&&!String(d).includes('/'))return new Date((d-25569)*86400000);if(String(d).includes('/')){const p=d.split('/'); return new Date(p[2],p[1]-1,p[0]);}return new Date(d);}
            
            
            function convertToInputDate(dStr){if(!dStr) return ""; if(dStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dStr; if(dStr.includes('/')){const p=dStr.split('/'); return `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`;} return "";}
            
    
async function openEditModal(id) {
    const e = employees.find(x => x.id === id);
    if (!e) return;

    // DEBUG : Supprime ces lignes après le test
    console.log("--- DEBUG MODAL ---");
    console.log("ID recherché:", id);
    console.log("Rôle brut en BDD:", e.role);

    currentEditingOriginal = { ...e };

    document.getElementById('edit-modal').classList.remove('hidden');
    document.getElementById('edit-id-hidden').value = id;

    // --- VISIBILITÉ DES BLOCS ---
    const perms = currentUser.permissions || {};
    const blockStatus = document.getElementById('edit-block-status');
    const blockContract = document.getElementById('edit-block-contract');
    const blockHierarchy = document.getElementById('edit-block-hierarchy');

    if (blockContract) blockContract.style.display = perms.can_manage_contracts ? 'block' : 'none';
    if (blockHierarchy) blockHierarchy.style.display = perms.can_manage_contracts ? 'block' : 'none';
    if (blockStatus) blockStatus.style.display = (perms.can_manage_contracts || perms.can_edit_employee_basic) ? 'block' : 'none';
    
    // --- REMPLISSAGE DES DROPDOWNS ---
    await populateManagerSelects(); 

    const roleSelect = document.getElementById('edit-role');
    if (roleSelect) {
        // ON FORCE LA GÉNÉRATION DES OPTIONS IMMÉDIATEMENT
        const roles = window.activeRolesList || [];
        roleSelect.innerHTML = '<option value="">-- Sélectionner --</option>' + 
            roles.map(r => `<option value="${r.role_name}">${r.role_name}</option>`).join('');
    }

    // --- PETIT DÉLAI DE SÉCURITÉ POUR LE RENDU ---
    setTimeout(() => {
        // 1. Manager & Scope
        const mgrSelect = document.getElementById('edit-manager');
        if(mgrSelect) mgrSelect.value = e.manager_id || "";
        const scopeInput = document.getElementById('edit-scope');
        if(scopeInput) scopeInput.value = (e.scope || []).join(', ');

        // 2. Type & Statut
        document.getElementById('edit-type').value = e.employee_type || 'OFFICE';
        document.getElementById('edit-statut').value = e.statut || 'Actif';
        
            // 3. RÔLE (FORÇAGE ET SÉCURITÉ)
            if (roleSelect) {
            // On récupère la valeur propre
            const dbRole = String(e.role || '').trim().toUpperCase();
            
            // On essaie de trouver le match exact dans les options du menu
            let matchFound = false;
            for (let i = 0; i < roleSelect.options.length; i++) {
                if (roleSelect.options[i].value.toUpperCase() === dbRole) {
                    roleSelect.selectedIndex = i;
                    matchFound = true;
                    break;
                }
            }

            // Si le rôle de la BDD n'est pas trouvé dans la liste des options
            if (!matchFound) {
                console.warn("⚠️ Le rôle " + dbRole + " n'existe pas dans la config des permissions.");
                // On peut décider de mettre une option vide pour forcer le choix
                roleSelect.value = ""; 
            }
        }

        // 4. Département & Contrat
        const deptSelect = document.getElementById('edit-dept');
        if(deptSelect) deptSelect.value = e.dept || 'IT & Tech';
        const typeSelect = document.getElementById('edit-type-contrat');
        if(typeSelect) typeSelect.value = e.limit || '365';
        
        const dateInput = document.getElementById('edit-start-date');
        if (dateInput) {
            dateInput.value = e.date ? convertToInputDate(e.date) : new Date().toISOString().split('T')[0];
        }

        // 5. Finances
        if(document.getElementById('edit-salaire-fixe')) document.getElementById('edit-salaire-fixe').value = e.salaire_base_fixe || 0;
        if(document.getElementById('edit-indemnite-transport')) document.getElementById('edit-indemnite-transport').value = e.indemnite_transport || 0;
        if(document.getElementById('edit-indemnite-logement')) document.getElementById('edit-indemnite-logement').value = e.indemnite_logement || 0;

        document.getElementById('edit-init-check').checked = false;
        
        console.log("Rôle final affiché dans le menu:", roleSelect.value);
    }, 50); 
}


function updatePaginationUI(containerId, meta, callbackName) {
    const footer = document.getElementById(containerId);
    if (!footer) return;

    if (!meta || meta.last_page <= 1) {
        footer.innerHTML = `<span class="text-[10px] font-black text-slate-300 uppercase tracking-widest">Fin de liste</span>`;
        return;
    }

    footer.innerHTML = `
        <button onclick="${callbackName}(true, ${meta.page - 1})" ${meta.page <= 1 ? 'disabled' : ''} 
            class="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-600 disabled:opacity-30 hover:bg-slate-100 transition-all shadow-sm">
            <i class="fa-solid fa-chevron-left"></i> Précédent
        </button>
        
        <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            PAGE ${meta.page} / ${meta.last_page}
        </span>
        
        <button onclick="${callbackName}(true, ${meta.page + 1})" ${meta.page >= meta.last_page ? 'disabled' : ''} 
            class="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-600 disabled:opacity-30 hover:bg-slate-100 transition-all shadow-sm">
            Suivant <i class="fa-solid fa-chevron-right"></i>
        </button>
    `;
}


async function submitUpdate(e) {
    e.preventDefault(); 
    const id = document.getElementById('edit-id-hidden').value;
    
    // 1. Récupération des valeurs actuelles du formulaire
    const newVal = {
        statut: document.getElementById('edit-statut').value,
        role: document.getElementById('edit-role').value,
        dept: document.getElementById('edit-dept').value,
        limit: document.getElementById('edit-type-contrat').value,
        employee_type: document.getElementById('edit-type').value,
        start_date: document.getElementById('edit-start-date').value,
        manager_id: document.getElementById('edit-manager').value || null,
        salaire: document.getElementById('edit-salaire-fixe').value,
        transport: document.getElementById('edit-indemnite-transport').value,
        logement: document.getElementById('edit-indemnite-logement').value
    };

    // 2. Construction de l'objet de modifications (Delta)
    const changes = {};

    // Comparaison des champs de base
    if (newVal.statut !== currentEditingOriginal.statut) changes.statut = newVal.statut;
    if (newVal.role !== currentEditingOriginal.role) changes.role = newVal.role;
    if (newVal.dept !== currentEditingOriginal.dept) changes.dept = newVal.dept;
    if (newVal.employee_type !== currentEditingOriginal.employee_type) changes.employee_type = newVal.employee_type;
    
    // Comparaison du manager (attention au type null/string)
    if (newVal.manager_id != currentEditingOriginal.manager_id) {
        changes.manager_id = newVal.manager_id;
    }

    // Gestion de la hiérarchie (Scope)
    const scopeVal = document.getElementById('edit-scope').value;
    const scopeArray = scopeVal ? scopeVal.split(',').map(s=>s.trim()) : [];
    if (JSON.stringify(scopeArray) !== JSON.stringify(currentEditingOriginal.scope || [])) {
        changes.scope = JSON.stringify(scopeArray);
    }

    // --- LOGIQUE CONTRAT ---
    // Si la date de début ou la durée change, on signale qu'il faut recalculer la date de fin
    const originalDate = convertToInputDate(currentEditingOriginal.date);
    if (newVal.start_date !== originalDate || newVal.limit !== currentEditingOriginal.limit) {
        changes.start_date = newVal.start_date;
        changes.limit = newVal.limit;
        changes.recalculate_contract = "true"; // Signal pour le serveur
    }

    // --- LOGIQUE FINANCES ---
    if (parseFloat(newVal.salaire) !== parseFloat(currentEditingOriginal.salaire_base_fixe))
        changes.salaire_brut_fixe = newVal.salaire;
    
    if (parseFloat(newVal.transport) !== parseFloat(currentEditingOriginal.indemnite_transport))
        changes.indemnite_transport = newVal.transport;

    if (parseFloat(newVal.logement) !== parseFloat(currentEditingOriginal.indemnite_logement))
        changes.indemnite_logement = newVal.logement;

    // Checkbox spéciale
    const forceInit = document.getElementById('edit-init-check').checked;

    // 3. SÉCURITÉ : Si rien n'a changé, on arrête
    if (Object.keys(changes).length === 0 && !forceInit) {
        Swal.fire('Info', 'Aucune modification détectée.', 'info');
        closeEditModal();
        return;
    }

    // 4. ENVOI DES DONNÉES CIBLÉES
    Swal.fire({title: 'Mise à jour...', text: 'Synchronisation...', allowOutsideClick: false, didOpen: () => Swal.showLoading()}); 

    const params = new URLSearchParams({
        id: id,
        agent: currentUser.nom,
        force_init: forceInit,
        ...changes // On n'envoie que les clés présentes dans 'changes'
    });

    try {
        const response = await secureFetch(`${URL_UPDATE}?${params.toString()}`);
        if(response.ok) {
            closeEditModal(); 
            await Swal.fire('Succès', 'Les modifications ont été enregistrées.', 'success'); 
            refreshAllData(true); 
        } else {
            throw new Error("Erreur serveur lors de la mise à jour");
        }
    } catch(e) { 
        Swal.fire('Erreur', e.message, 'error'); 
    }
}





        function closeEditModal(){document.getElementById('edit-modal').classList.add('hidden');}
            
        async function printBadge(id) {
                const e = employees.find(x => x.id === id); 
                if(!e) return; 
                
                // On récupère le token
                const token = localStorage.getItem('sirh_token');
                
                Swal.fire({title:'Génération...', didOpen:()=>Swal.showLoading()});

                try {
                    // On construit l'URL
                    const url = `${URL_BADGE_GEN}?id=${encodeURIComponent(id)}&nom=${encodeURIComponent(e.nom)}&poste=${encodeURIComponent(e.poste)}&photo=${encodeURIComponent(formatGoogleLink(e.photo)||'')}&agent=${encodeURIComponent(currentUser.nom)}&token=${token}`;

                    // AU LIEU DE FAIRE window.open(url)...
                    // On va chercher le contenu (le code HTML du badge)
                    const response = await fetch(url);
                    
                    if (!response.ok) throw new Error("Erreur génération");

                    // On récupère le texte HTML
                    const htmlContent = await response.text();

                    // On ferme le loader
                    Swal.close();

                    // On ouvre une fenêtre vide
                    const w = window.open('', '_blank', 'width=400,height=600');
                    
                    // On écrit le HTML dedans manuellement
                    w.document.open();
                    w.document.write(htmlContent);
                    w.document.close();

                    // Petit délai pour laisser les images charger avant d'imprimer (si le HTML contient un script d'impression auto, ça marchera aussi)
                    w.onload = function() {
                        // Optionnel : forcer l'impression si le HTML ne le fait pas déjà
                        // w.print();
                    };

                } catch (error) {
                    console.error(error);
                    Swal.fire('Erreur', 'Impossible de générer le badge : ' + error.message, 'error');
                }
            }
            
            async function startCameraFeed(){try{videoStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'}});const v=document.getElementById('video-stream');v.srcObject=videoStream;v.classList.remove('hidden');document.getElementById('captured-image').classList.add('hidden');document.getElementById('btn-capture').classList.remove('hidden');document.getElementById('initial-controls').classList.add('hidden');document.getElementById('photo-placeholder').classList.add('hidden');}catch(e){Swal.fire('Erreur', 'Caméra bloquée', 'error');}}
            function handleFileUpload(e){const f=e.target.files[0];if(f){capturedBlob=f;const i=document.getElementById('captured-image');i.src=URL.createObjectURL(f);i.classList.remove('hidden');document.getElementById('video-stream').classList.add('hidden');document.getElementById('initial-controls').classList.add('hidden');document.getElementById('btn-retake').classList.remove('hidden');document.getElementById('photo-placeholder').classList.add('hidden');}}
            
            function takeSnapshot(){
                const v=document.getElementById('video-stream'),c=document.getElementById('camera-canvas');
                c.width=v.videoWidth;c.height=v.videoHeight;
                c.getContext('2d').drawImage(v,0,0);
                c.toBlob(b=>{
                    capturedBlob=b;
                    const i=document.getElementById('captured-image');
                    i.src=URL.createObjectURL(b);
                    i.classList.remove('hidden');
                    v.classList.add('hidden');
                    document.getElementById('btn-capture').classList.add('hidden');
                    document.getElementById('btn-retake').classList.remove('hidden');
                    if(videoStream){ videoStream.getTracks().forEach(t => t.stop()); videoStream = null; }
                },'image/jpeg',0.8);
            }       
        
            function resetCamera(){document.getElementById('captured-image').classList.add('hidden');document.getElementById('btn-retake').classList.add('hidden');document.getElementById('btn-capture').classList.add('hidden');document.getElementById('video-stream').classList.add('hidden');document.getElementById('initial-controls').classList.remove('hidden');document.getElementById('file-upload').value='';document.getElementById('photo-placeholder').classList.remove('hidden');capturedBlob=null;if(videoStream){videoStream.getTracks().forEach(t=>t.stop());videoStream=null;}}
            function triggerPhotoUpload(){document.getElementById('emp-upload-photo').click();}
            function previewPhoto(e){const f=e.target.files[0];if(f){const r=new FileReader();r.onload=function(ev){document.getElementById('emp-photo-real').src=ev.target.result;document.getElementById('emp-photo-real').classList.remove('hidden');document.getElementById('emp-avatar').classList.add('hidden');document.getElementById('save-btn-container').classList.remove('hidden');};r.readAsDataURL(f);}}
            
            
            function toggleEditMode(){const ids=['emp-email','emp-phone','emp-address','emp-dob'], btn=document.getElementById('save-btn-container'), dis=document.getElementById('emp-email').disabled; ids.forEach(i=>{const el=document.getElementById(i); el.disabled=!dis; if(!dis)el.classList.add('bg-white','ring-2','ring-blue-100'); else el.classList.remove('bg-white','ring-2','ring-blue-100');}); if(dis){btn.classList.remove('hidden');document.getElementById('emp-email').focus();}else{btn.classList.add('hidden');loadMyProfile();}}
                                                                    


async function triggerRobotCheck() {
    if (currentUser.role === 'ADMIN' || currentUser.role === 'RH') {
        try {
            const response = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/check-returns?agent=Robot`);
            const data = await response.json();
            
            if (data.alerts && data.alerts.length > 0) {
                // On affiche une notification visuelle à l'Admin
                data.alerts.forEach(alert => {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Alerte Absence',
                        text: alert.message,
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 10000
                    });
                });
            }
        } catch (e) { console.log("Robot en sommeil..."); }
    }
}







async function syncAllRoleSelects() {
    try {
        let roles;
        // 1. Vérification du cache
        const cached = sessionStorage.getItem('sirh_cache_roles');

        if (cached) {
            roles = JSON.parse(cached);
            console.log("✅ Rôles chargés depuis le cache (Instant)");
        } else {
            // 2. Appel serveur
            const response = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/list-roles`);
            roles = await response.json();
            // 3. Sauvegarde cache
            sessionStorage.setItem('sirh_cache_roles', JSON.stringify(roles));
        }

        window.activeRolesList = roles; 
        const optionsHtml = roles.map(r => `<option value="${r.role_name}">${r.role_name}</option>`).join('');

        // Mise à jour des formulaires
        ['f-role', 'edit-role'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = `<option value="">-- Sélectionner un rôle --</option>` + optionsHtml;
        });

        // Mise à jour des filtres (Correction de ton ancienne erreur d'accolade ici aussi)
        ['filter-role-select', 'filter-accounting-role'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = `<option value="all">Tous les rôles</option>` + optionsHtml;
        });

    } catch (e) {
        console.error("Erreur synchro rôles", e);
    }
}

    async function saveMyProfile() {
        Swal.fire({ title: 'Sauvegarde...', didOpen: () => Swal.showLoading() });

        // --- CORRECTION : Recherche sécurisée du Matricule ---
        // On nettoie les noms (enlève points, espaces) pour comparer "sena.broda" et "Sena Broda"
        const normalize = (s) => s ? s.toLowerCase().replace(/[\.\s_-]/g, '') : '';
        const searchNom = normalize(currentUser.nom);

        const myData = employees.find(e => 
            normalize(e.nom) === searchNom || 
            normalize(e.nom).includes(searchNom) || 
            searchNom.includes(normalize(e.nom))
        );

        // Si on trouve l'employé dans la liste, on prend son Matricule (myData.id)
        // Sinon on garde l'ID de secours
        const idToSend = (myData && myData.id) ? myData.id : currentUser.id;
        
        // Log pour vérifier dans ta console (F12) avant l'envoi
        console.log("Tentative d'envoi pour l'ID :", idToSend);

        const fd = new FormData();
        fd.append('id', idToSend); // Envoie le Matricule au lieu du Record ID
        fd.append('email', document.getElementById('emp-email').value);
        fd.append('phone', document.getElementById('emp-phone').value);
        fd.append('address', document.getElementById('emp-address').value);
        fd.append('dob', document.getElementById('emp-dob').value);
        fd.append('agent', currentUser.nom);
        fd.append('agent_role', currentUser.role); // ✅ AJOUTER CETTE LIGNE
        fd.append('doc_type', 'text_update'); 

        const pI = document.getElementById('emp-upload-photo');
        if (pI.files[0]) {
            fd.append('new_photo', pI.files[0]); 
        }

        try {
            const response = await secureFetch(URL_EMPLOYEE_UPDATE, { 
                method: 'POST', 
                body: fd 
            });
            
            if (response.ok) {
                Swal.fire('Succès', 'Votre profil a été mis à jour', 'success');
                toggleEditMode(); 
                fetchData(true); // On met à jour ses infos
            } else {
                throw new Error("Erreur serveur (" + response.status + ")");
            }
        } catch (e) {
            Swal.fire('Erreur', 'Échec de l\'enregistrement : ' + e.message, 'error');
        }
    }








async function handleOnboarding(e) {
                e.preventDefault();
                console.log("Tentative de création de profil...");

                // 1. Vérification de la photo de profil (Obligatoire)
                if (!capturedBlob) {
                    return Swal.fire('Attention', 'La photo de profil est obligatoire pour créer un compte.', 'warning');
                }

                const fd = new FormData();

                try {
                    // 2. Récupération sécurisée des champs texte
                    // On vérifie que les éléments existent avant de lire .value
                    const getVal = (id) => {
                        const el = document.getElementById(id);
                        return el ? el.value : "";
                    };

                    // CHAMPS GÉNERAUX ET HIÉRARCHIQUES
                    fd.append('manager_id', document.getElementById('f-manager').value);
                    const scopeVal = document.getElementById('f-scope').value;
                    fd.append('scope', scopeVal ? JSON.stringify(scopeVal.split(',').map(s=>s.trim())) : '[]');
                        
                    fd.append('nom', getVal('f-nom'));
                    fd.append('email', getVal('f-email'));
                    fd.append('telephone', getVal('f-phone'));
                    fd.append('dob', getVal('f-dob'));
                    fd.append('adresse', getVal('f-address'));
                    fd.append('date', getVal('f-date')); // date_embauche
                    fd.append('poste', getVal('f-poste'));
                    fd.append('dept', getVal('f-dept'));
                    fd.append('employee_type', getVal('f-type'));
                    fd.append('limit', getVal('f-limit')); // type_contrat
                    fd.append('role', getVal('f-role'));
                    
                    // NOUVEAUX CHAMPS CONTRACTUELS (INTÉGRATION COMPLÈTE)
                    fd.append('salaire_brut_fixe', getVal('f-salaire-fixe')); // Nouveau champ
                    fd.append('indemnite_transport', getVal('f-indemnite-transport')); // Nouveau champ
                    fd.append('indemnite_logement', getVal('f-indemnite-logement')); // Nouveau champ
                    fd.append('temps_travail', getVal('f-temps-travail')); // Nouveau champ
                    fd.append('lieu_naissance', getVal('f-lieu-naissance')); // Nouveau champ
                    fd.append('nationalite', getVal('f-nationalite')); // Nouveau champ
                    fd.append('contract_template_id', getVal('f-contract-template-selector')); // Nouveau champ pour le modèle choisi
                    fd.append('civilite', getVal('f-civilite'));
                    fd.append('duree_essai', getVal('f-duree-essai'));
                    fd.append('lieu_signature', getVal('f-lieu-signature'));
                    fd.append('contract_template_id', getVal('f-contract-template-selector'));
                    fd.append('agent', currentUser ? currentUser.nom : "Système");

                 // 3. Ajout de la photo de profil (Obligatoire)
                Swal.update({ text: 'Compression de la photo de profil...' });
                const compressedProfilePhoto = await compressImage(capturedBlob);
                fd.append('photo', compressedProfilePhoto, 'photo_profil.jpg');


                    // 4. Ajout des documents KYC (Optionnels)
                    if (docBlobs.id_card) fd.append('id_card', docBlobs.id_card, 'piece_identite.jpg');
                    if (docBlobs.cv) fd.append('cv', docBlobs.cv, 'cv.jpg');
                    if (docBlobs.diploma) fd.append('diploma', docBlobs.diploma, 'diplome.jpg');
                    if (docBlobs.attestation) fd.append('attestation', docBlobs.attestation, 'attestation.jpg');

                    // 5. Affichage du chargement
                    Swal.fire({
                        title: 'Création du dossier...',
                        text: 'Envoi des informations et des documents au serveur sécurisé',
                        didOpen: () => Swal.showLoading(),
                        allowOutsideClick: false
                    });

                    // 6. Envoi au serveur Render
                    const response = await secureFetch(URL_WRITE_POST, {
                        method: 'POST',
                        body: fd
                    });

                    if (response.ok) {
                        await Swal.fire({
                            icon: 'success',
                            title: 'Profil créé !',
                            text: 'Le collaborateur a été ajouté et ses accès ont été envoyés par email.',
                            confirmButtonColor: '#2563eb'
                        });

                        // --- NETTOYAGE COMPLET DU FORMULAIRE ---
                        e.target.reset(); 
                        resetCamera(); 
                        docBlobs = {
                            id_card: null,
                            cv: null,
                            diploma: null,
                            attestation: null,
                            leave_justif: null
                        };
                        const docIds = ['id_card', 'cv', 'diploma', 'attestation'];
                        docIds.forEach(id => {
                            const label = document.getElementById('btn-' + id);
                            const preview = document.getElementById('preview-' + id);
                            const icon = document.getElementById('icon-' + id);
                            
                            if (label) {
                                label.classList.remove('bg-emerald-50', 'border-emerald-200');
                                label.innerHTML = label.dataset.originalText || label.innerHTML;
                            }
                            if (preview) preview.classList.add('hidden');
                            if (icon) icon.classList.remove('hidden');
                        });

                        await fetchData(true); 
                        switchView('employees'); 
                    } else {
                        const errorData = await response.json();
                        throw new Error(errorData.error || "Erreur serveur");
                    }

                } catch (error) {
                    console.error("Erreur lors de l'onboarding:", error);
                    Swal.fire('Échec', "Impossible de créer le profil : " + error.message, 'error');
                }
            }










function toggleContractFieldsVisibility() {
    const selectedEmployeeType = document.getElementById('f-type').value;
    
    // Masquer tous les champs conditionnels par défaut
    document.querySelectorAll('.field-group-contract[data-employee-type]').forEach(el => {
        el.style.display = 'none';
    });

    // Afficher les champs communs à tous (ceux sans data-employee-type)
    document.querySelectorAll('.field-group-contract:not([data-employee-type])').forEach(el => {
        el.style.display = 'block';
    });

    // Afficher les champs spécifiques au type d'employé sélectionné
    document.querySelectorAll(`.field-group-contract[data-employee-type="${selectedEmployeeType}"]`).forEach(el => {
        el.style.display = 'block';
    });
}

// --- FONCTION POUR CHARGER LES MODÈLES DE CONTRAT DANS LE SELECTEUR ---
async function fetchContractTemplatesForSelection() {
    const selectElement = document.getElementById('f-contract-template-selector');
    if (!selectElement) return;

    try {
        const response = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/list-templates`);
        const templates = await response.json();

        let optionsHtml = '<option value="">-- Choisir un modèle --</option>';
        templates.forEach(tpl => {
        optionsHtml += `<option value="${tpl.id}">${tpl.label}</option>`;
        });
        selectElement.innerHTML = optionsHtml;
    } catch (e) {
        console.error("Erreur chargement modèles de contrat pour sélection", e);
        selectElement.innerHTML = '<option value="">Erreur de chargement</option>';
    }
}



            function startScanner(){
                let scannerInstance = null;
                Swal.fire({
                    title:'SCANNER', html:'<div id="reader"></div>',
                    didOpen:()=>{
                        scannerInstance = new Html5Qrcode("reader");
                        scannerInstance.start({facingMode:"environment"},{fps:10},d=>{
                            scannerInstance.stop().then(() => {
                                let id=d; try{id=new URL(d).searchParams.get("id")}catch(e){} 
                                secureFetch(`${URL_GATEKEEPER}?id=${encodeURIComponent(id)}&key=${SCAN_KEY}&agent=${encodeURIComponent(currentUser.nom)}`)
                                .then(r=>r.json()).then(d=>{
                                    if(d.status==="valid") Swal.fire('ACCÈS OK',d.nom,'success'); 
                                    else {Swal.fire({icon:'error',title:'REFUSÉ'}).then(()=>location.href=URL_REDIRECT_FAILURE);}
                                });
                            });
                        });
                    },
                    willClose: () => { if(scannerInstance) { scannerInstance.stop().catch(err => console.log("Stop Qr")); } }
                }); 
            }
            

        



async function fetchLiveAttendance() {
    // --- CORRECTION : SÉCURITÉ BASÉE SUR LA PERMISSION ---
    // Au lieu de vérifier si c'est un "EMPLOYEE", on vérifie s'il a le droit de voir le Dashboard.
    // Cela empêche le Comptable (qui n'est pas "EMPLOYEE" mais n'a pas ce droit) de déclencher l'erreur 403.
    if (!currentUser || !currentUser.permissions || !currentUser.permissions.can_see_dashboard) {
        return;
    }

    try {
        const r = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/live-attendance`);
        const data = await r.json();

        // Mise à jour des compteurs
        document.getElementById('live-presents-count').innerText = data.presents.length;
        document.getElementById('live-partis-count').innerText = data.partis.length;
        document.getElementById('live-absents-count').innerText = data.absents.length;

        // Fonction pour générer les petits avatars (INCHANGÉE)
        const renderAvatars = (list, containerId) => {
            const container = document.getElementById(containerId);
            container.innerHTML = '';
            list.slice(0, 5).forEach(emp => { // On en montre max 5 pour le design
                const imgUrl = emp.photo_url || `https://ui-avatars.com/api/?name=${emp.nom}&background=random`;
                container.innerHTML += `<img src="${imgUrl}" title="${emp.nom}" class="w-8 h-8 rounded-full border-2 border-white object-cover">`;
            });
            if(list.length > 5) {
                container.innerHTML += `<div class="w-8 h-8 rounded-full bg-white/20 border-2 border-white flex items-center justify-center text-[10px] font-bold">+${list.length - 5}</div>`;
            }
        };

        renderAvatars(data.presents, 'live-presents-list');
        renderAvatars(data.partis, 'live-partis-list');
        renderAvatars(data.absents, 'live-absents-list');

    } catch (e) { console.error("Erreur Live Tracker", e); }
}




// DANS app.js

async function applyModulesUI() {
    console.log("⚙️ Application de la configuration entreprise...");
    try {
        // 1. On récupère la config depuis Supabase
        const response = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/read-modules`);
        const modules = await response.json();

        // 2. On parcourt chaque module de la base de données
        modules.forEach(mod => {
            // On cherche TOUS les éléments HTML qui portent cette étiquette
            const elements = document.querySelectorAll(`[data-module="${mod.module_key}"]`);

            elements.forEach(el => {
                if (mod.is_active === true) {
                    // Si le module est ACTIF, on ne fait rien (on laisse l'élément visible)
                    // Sauf s'il était caché par une autre logique, on enlève 'hidden' au cas où
                    el.classList.remove('hidden');
                } else {
                    // Si le module est INACTIF, on le SUPPRIME du DOM
                    el.remove();
                    console.log(`🚫 Module masqué : ${mod.module_key}`);
                }
            });
        });
        
    } catch (e) {
        console.error("Erreur critique chargement modules:", e);
    }
}





async function fetchLogs(page = 1) { // Accepte un paramètre de page
    const tbody = document.getElementById('logs-body');
    if (!tbody) return;

    // Affiche un loader pendant le chargement
    tbody.innerHTML = '<tr><td colspan="4" class="p-6 text-center italic text-slate-400"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Chargement des logs...</td></tr>';
    
    logsPage = page; // Met à jour la page actuelle

    try {
        const r = await secureFetch(`${URL_READ_LOGS}?page=${page}&limit=20&agent=${encodeURIComponent(currentUser.nom)}`);
        const result = await r.json();

        const raw = result.data || [];
        const meta = result.meta || { total: raw.length, page: 1, last_page: 1 };

        logsTotalPages = meta.last_page; // Met à jour le nombre total de pages

        tbody.innerHTML = ''; // Vide l'ancien contenu

        if (raw.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="p-6 text-center text-slate-400 italic">Aucun log trouvé pour cette page.</td></tr>`;
            return;
        }

        raw.forEach(log => {
            const dateF = log.created_at ? new Date(log.created_at).toLocaleString('fr-FR', {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '-';
            
            tbody.innerHTML += `
                <tr class="border-b hover:bg-slate-50 transition-colors">
                    <td class="p-4 text-xs font-mono">${dateF}</td>
                    <td class="p-4 font-bold text-slate-700">${escapeHTML(log.agent || 'Système')}</td>
                    <td class="p-4"><span class="bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-black">${escapeHTML(log.action || '-')}</span></td>
                    <td class="p-4 text-xs text-slate-500">${escapeHTML(log.details || '-')}</td>
                </tr>`;
        });
        
        // --- INJECTION DES BOUTONS DE PAGINATION ---
        const logsContainer = document.getElementById('view-logs');
        const oldPagination = document.getElementById('logs-pagination-controls');
        if(oldPagination) oldPagination.remove(); // Supprime l'ancienne barre si elle existe

        const paginationHtml = `
            <div id="logs-pagination-controls" class="flex justify-between items-center mt-6 p-4 bg-white rounded-2xl border shadow-sm animate-fadeIn">
                <button onclick="fetchLogs(${logsPage - 1})" ${logsPage <= 1 ? 'disabled' : ''} 
                    class="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-600 disabled:opacity-30 hover:bg-slate-100 transition-all shadow-sm">
                    <i class="fa-solid fa-chevron-left"></i> Précédent
                </button>
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page ${logsPage} / ${logsTotalPages}</span>
                <button onclick="fetchLogs(${logsPage + 1})" ${logsPage >= logsTotalPages ? 'disabled' : ''} 
                    class="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-600 disabled:opacity-30 hover:bg-slate-100 transition-all shadow-sm">
                    Suivant <i class="fa-solid fa-chevron-right"></i>
                </button>
            </div>
        `;
        if(logsContainer) logsContainer.insertAdjacentHTML('beforeend', paginationHtml);

    } catch(e) { 
        console.error("Erreur fetchLogs:", e);
        tbody.innerHTML = `<tr><td colspan="4" class="text-red-500 p-4 font-bold text-center">${escapeHTML(e.message || "Erreur de chargement des logs.")}</td></tr>`;
    }
}


async function viewDocument(url, title) {
    if (!url || url === '#' || url === 'null') return;

    const urlLower = url.toLowerCase();
    const isDocx = urlLower.includes('.docx');
    const isBlob = url.startsWith('blob:'); // Détecte si c'est un fichier temporaire (Brouillon)

    let finalUrl = url;

    // 1. Si c'est un Word distant, on utilise le viewer Google
    if (isDocx && !isBlob) {
        finalUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
    } 
    // 2. Si c'est un PDF distant (Supabase/Drive), on ajoute l'anti-cache
    else if (!isBlob) {
        finalUrl = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
    }
    // 3. Si c'est un BLOB (ton brouillon), on garde l'URL pure, sinon le navigateur ne le trouve plus

Swal.fire({
        title: `<span class="text-sm font-black uppercase text-slate-500">${title}</span>`,
        html: `
            <!-- On utilise flex-col pour que le bouton prenne sa place en bas sans être écrasé -->
            <div class="flex flex-col h-[70vh] gap-4">
                
                <!-- La zone PDF prend tout l'espace restant (flex-1) -->
                <div class="flex-1 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-inner relative">
                    <iframe src="${finalUrl}" class="absolute inset-0 w-full h-full" frameborder="0"></iframe>
                </div>

                <!-- La barre d'action en bas, taille fixe (shrink-0) -->
                <div class="shrink-0 flex justify-between items-center bg-white pt-2">
                    <a href="${url}" target="_blank" download class="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-2">
                        <i class="fa-solid fa-download"></i> Télécharger l'original
                    </a>
                    <button onclick="Swal.close()" class="px-6 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase shadow-md hover:bg-slate-800 transition-all active:scale-95">
                        Fermer
                    </button>
                </div>

            </div>
        `,
        width: '900px',
        showConfirmButton: false,
        padding: '1.5rem', // On garde un padding raisonnable
        customClass: { popup: 'rounded-2xl viewer-modal' }
    });
}



    async function openHtmlInNewWindow(url) {
        if (!url.toLowerCase().includes('.html')) {
            window.open(url, '_blank');
            return;
        }

        try {
            // 1. On télécharge le contenu du contrat
            const response = await fetch(url);
            const text = await response.text();

            // 2. On crée un "Blob" (un fichier virtuel) en forçant le type HTML
            const blob = new Blob([text], { type: 'text/html' });
            const blobUrl = URL.createObjectURL(blob);

            // 3. On ouvre ce fichier virtuel dans un nouvel onglet
            window.open(blobUrl, '_blank');
        } catch (e) {
            console.error("Erreur d'ouverture:", e);
            window.open(url, '_blank'); // Fallback si ça rate
        }
    }






// 1. La Recherche (Serveur)

function filterTable() {
    const input = document.getElementById('search-input');
    
    // On annule le compte à rebours précédent
    clearTimeout(searchTimeout);

    // On lance un nouveau compte à rebours de 300ms
    searchTimeout = setTimeout(() => {
        activeFilters.search = input.value.trim(); // On enregistre le texte
        fetchData(true, 1); // On lance la recherche
    }, 300);
}

// 2. Le Filtre (Serveur)
function applySmartFilter(filterType) {
    currentStatusFilter = filterType;
    
    // Mise à jour visuelle des boutons (Active / Hover)
    document.querySelectorAll('.filter-chip').forEach(btn => {
        const isThisOne = btn.innerText.toLowerCase() === filterType.toLowerCase() || 
                          (filterType === 'all' && btn.innerText.toLowerCase() === 'tous');
        
        if(isThisOne) {
            btn.classList.add('bg-blue-600', 'text-white', 'border-blue-600', 'shadow-md');
            btn.classList.remove('bg-white', 'text-slate-600');
        } else {
            btn.classList.remove('bg-blue-600', 'text-white', 'border-blue-600', 'shadow-md');
            btn.classList.add('bg-white', 'text-slate-600');
        }
    });

    fetchData(true, 1); // On relance le filtre à la page 1
}




async function generateDraftContract(id) {
    const e = employees.find(x => x.id === id);
    if (!e) return;

    // 1. Affichage d'un loader pro
    Swal.fire({
        title: 'Génération du Brouillon...',
        text: 'Conversion du modèle en PDF sécurisé...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    try {
        const token = localStorage.getItem('sirh_token');
        
        // 2. Appel au serveur
        const response = await fetch(`${URL_CONTRACT_GENERATE}?id=${id}&token=${token}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            // Si le serveur renvoie une erreur (ex: modèle manquant)
            const err = await response.json();
            throw new Error(err.error || "Erreur lors de la génération");
        }

        // 3. RÉCUPÉRATION DU PDF (BLOB)
        // On ne crée plus de lien <a>, on récupère le flux binaire
        const blob = await response.blob();
        
        // 4. CRÉATION D'UNE URL VIRTUELLE
        const pdfUrl = window.URL.createObjectURL(blob);

        // 5. AFFICHAGE DANS TON MODAL EXISTANT
        // On ferme le loader et on appelle ta fonction de visualisation
        Swal.close();
        viewDocument(pdfUrl, `Prévisualisation Contrat : ${e.nom}`);

        // Note : On ne révoque pas l'URL immédiatement car l'iframe en a besoin pour afficher le PDF
        // Elle sera nettoyée à la fermeture ou au prochain chargement.

    } catch (error) {
        console.error("Erreur Brouillon:", error);
        Swal.fire('Erreur', error.message, 'error');
    }
}





                function openContractModal(id) {
                    document.getElementById('contract-id-hidden').value = id;
                    document.getElementById('contract-modal').classList.remove('hidden');
                    
                    // Initialisation du pad de signature sur le canvas
                    const canvas = document.getElementById('signature-pad');
                    signaturePad = new SignaturePad(canvas, {
                        backgroundColor: 'rgba(255, 255, 255, 0)', // Fond transparent
                        penColor: 'rgb(0, 0, 0)' // Encre noire
                    });

                    // Cette partie est CRUCIALE pour que la signature soit précise sur mobile (Retina display)
                    const ratio = Math.max(window.devicePixelRatio || 1, 1);
                    canvas.width = canvas.offsetWidth * ratio;
                    canvas.height = canvas.offsetHeight * ratio;
                    canvas.getContext("2d").scale(ratio, ratio);
                    signaturePad.clear(); // On vide le cadre au cas où
                }




async function fetchAndPopulateDepartments() {
    try {
        let depts;
        // 1. On vérifie le cache du navigateur
        const cached = sessionStorage.getItem('sirh_cache_depts');
        
        if (cached) {
            depts = JSON.parse(cached);
            console.log("✅ Départements chargés depuis le cache (Instant)");
        } else {
            // 2. Si pas en cache, on appelle le serveur
            const response = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/list-departments`);
            depts = await response.json();
            // 3. On sauvegarde pour la prochaine fois
            sessionStorage.setItem('sirh_cache_depts', JSON.stringify(depts));
        }

        const defaultOpt = `<option value="">-- Choisir un département --</option>`;
        const optionsHtml = depts.map(d => `<option value="${d.code}">${d.label}</option>`).join('');

        // Mise à jour de l'interface
        const acctDept = document.getElementById('filter-accounting-dept');
        if (acctDept) acctDept.innerHTML = `<option value="all">Tous les Départements</option>` + optionsHtml;

        ['f-dept', 'edit-dept'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = defaultOpt + optionsHtml;
        });

    } catch (e) {
        console.error("Erreur chargement départements", e);
    }
}
        
            function closeContractModal() { if(contractStream) contractStream.getTracks().forEach(t => t.stop()); document.getElementById('contract-modal').classList.add('hidden'); }
            async function startContractCamera() { try { contractStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }); const v = document.getElementById('contract-video'); v.srcObject = contractStream; v.classList.remove('hidden'); document.getElementById('contract-img-preview').classList.add('hidden'); document.getElementById('contract-icon').classList.add('hidden'); document.getElementById('btn-contract-capture').classList.remove('hidden'); } catch(e) { Swal.fire('Erreur', 'Caméra inaccessible', 'error'); } }
            
            function takeContractSnapshot() { 
                const v = document.getElementById('contract-video'); const c = document.createElement('canvas'); 
                c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0); 
                c.toBlob(blob => { 
                    contractBlob = blob; const img = document.getElementById('contract-img-preview'); 
                    img.src = URL.createObjectURL(blob); img.classList.remove('hidden'); v.classList.add('hidden'); 
                    document.getElementById('btn-contract-capture').classList.add('hidden'); 
                    if(contractStream) { contractStream.getTracks().forEach(t => t.stop()); contractStream = null; }
                }, 'image/jpeg', 0.8); 
            }
            
            function previewContractFile(e) { const file = e.target.files[0]; if(!file) return; contractBlob = file; if(file.type.includes('image')) { const img = document.getElementById('contract-img-preview'); img.src = URL.createObjectURL(file); img.classList.remove('hidden'); document.getElementById('contract-icon').classList.add('hidden'); } }
            function resetContractCamera() { contractBlob = null; document.getElementById('contract-img-preview').classList.add('hidden'); document.getElementById('contract-video').classList.add('hidden'); document.getElementById('contract-icon').classList.remove('hidden'); document.getElementById('btn-contract-capture').classList.add('hidden'); if(contractStream) contractStream.getTracks().forEach(t => t.stop()); }
            

            
    async function submitFlashMessage(e) {
        e.preventDefault();
        
        const msgInput = document.getElementById('flash-input-msg');
        const typeInput = document.getElementById('flash-input-type');
        const durationInput = document.getElementById('flash-input-duration');

        if(!msgInput || !durationInput) return;

        const msg = msgInput.value;
        const type = typeInput ? typeInput.value : "Info";
        const durationMinutes = parseFloat(durationInput.value);
        
        const now = new Date();
        // CALCUL : Maintenant + (Minutes choisies * 60 000 ms)
        const expirationDate = new Date(now.getTime() + (durationMinutes * 60000));

        Swal.fire({ title: 'Publication...', didOpen: () => Swal.showLoading() });

        try {
            const response = await secureFetch(URL_WRITE_FLASH, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: msg,
                    type: type,
                    sender: currentUser.nom,
                    date: now.toISOString(),
                    date_expiration: expirationDate.toISOString(),
                    agent: currentUser.nom
                })
            });

            if (response.ok) {
                document.getElementById('flash-modal').classList.add('hidden');
                const timeStr = expirationDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                Swal.fire('Succès !', `L'alerte est publiée. Elle expirera à ${timeStr}`, 'success');
                // On rafraîchit l'affichage pour voir le message immédiatement
                setTimeout(() => fetchFlashMessage(), 1000);
            }
        } catch (e) {
            console.error("Erreur envoi flash:", e);
            Swal.fire('Erreur', "Le serveur n'a pas reçu l'info. Vérifie ta connexion.", 'error');
        }
    }





function exportPayrollTemplate() {
    // 1. On récupère toutes les lignes affichées dans le tableau de comptabilité
    const rows = document.querySelectorAll('.accounting-row');
    
    if (rows.length === 0) {
        return Swal.fire('Oups', 'Aucun collaborateur affiché dans le tableau à exporter.', 'warning');
    }

    // 2. Définition des entêtes (7 colonnes au total)
    let csvContent = "\ufeffMATRICULE;NOM;POSTE;SALAIRE_BASE;INDEMNITES_FIXES;TOTAL_PRIMES;TOTAL_RETENUES\n";

    rows.forEach(row => {
        // On identifie l'index de la ligne via l'ID du div NET
        const netDisplay = row.querySelector('[id^="net-"]');
        if (!netDisplay) return;
        const index = netDisplay.id.split('-')[1];

        // 3. RÉCUPÉRATION DES INFOS "TÉLLES QU'ELLES SONT" À L'ÉCRAN
        const matricule = netDisplay.dataset.matricule || "";
        const nom = netDisplay.dataset.nom || "";
        const poste = netDisplay.dataset.poste || "";
        
        // On récupère les valeurs des champs (Base, Primes, Retenues)
        const baseCurrent = document.getElementById(`base-${index}`).value || 0;
        const indemCurrent = document.getElementById(`indem-constante-${index}`).innerText || 0;
        const primeCurrent = document.getElementById(`prime-${index}`).value || 0;
        const taxCurrent = document.getElementById(`tax-${index}`).value || 0; // On récupère la taxe calculée auto !

        // 4. Génération de la ligne avec les 7 colonnes remplies
        csvContent += `\t${matricule};${nom};${poste};${baseCurrent};${indemCurrent};${primeCurrent};${taxCurrent}\n`;
    });

    // 5. Téléchargement du fichier
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Saisie_Paie_${document.getElementById('pay-month').value}.csv`;
    link.click();
}



// --- 2. DÉCLENCHER L'OUVERTURE DU FICHIER ---
function triggerPayrollImport() {
    document.getElementById('payroll-csv-file').click();
}











async function handlePayrollImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    Swal.fire({ title: 'Analyse intelligente...', text: 'Lecture du fichier de Paie', didOpen: () => Swal.showLoading() });

    try {
        // 1. On exige uniquement la colonne MATRICULE (les autres sont optionnelles pour la mise à jour)
        const requiredColumns = ["matricule"];
        
        // 2. Le moteur fait le nettoyage (gère les guillemets, les virgules dans les chiffres, etc.)
        const parsedData = await CSVManager.parseAndValidate(file, requiredColumns);

        let updateCount = 0;

        // 3. Traitement des données
        parsedData.forEach(row => {
            const matricule = row['matricule'] ? row['matricule'].replace(/\t/g, '').trim() : null;
            if (!matricule) return; // Passe à la ligne suivante si vide

            // On cherche l'élément HTML correspondant à cet employé
            const netDisplay = document.querySelector(`div[data-matricule="${matricule}"]`);
            
            if (netDisplay) {
                const index = netDisplay.id.split('-')[1];
                
                const inputBase = document.getElementById(`base-${index}`);
                const displayIndem = document.getElementById(`indem-constante-${index}`);
                const inputPrime = document.getElementById(`prime-${index}`);
                const inputTax = document.getElementById(`tax-${index}`);

                let hasChanged = false;

                // On met à jour uniquement si la colonne existe dans le fichier Excel
                if (row['salaire_base'] !== undefined && inputBase) {
                    inputBase.value = parseInt(row['salaire_base']) || 0;
                    hasChanged = true;
                }

                if (row['indemnites_fixes'] !== undefined && displayIndem) {
                    displayIndem.innerText = parseInt(row['indemnites_fixes']) || 0;
                    hasChanged = true;
                }

                if (row['total_primes'] !== undefined && inputPrime) {
                    inputPrime.value = parseInt(row['total_primes']) || 0;
                    hasChanged = true;
                }

                if (row['total_retenues'] !== undefined && inputTax) {
                    inputTax.value = parseInt(row['total_retenues']) || 0;
                    inputTax.dataset.auto = "false"; // Désactive le calcul auto
                    hasChanged = true;
                }

                // Si on a modifié au moins un chiffre, on recalcule le net en temps réel
                if (hasChanged) {
                    calculateRow(index);
                    updateCount++;
                }
            }
        });

        if (updateCount > 0) {
            Swal.fire('Succès', `${updateCount} bulletin(s) mis à jour depuis le fichier.`, 'success');
        } else {
            Swal.fire('Info', 'Aucun matricule correspondant trouvé à l\'écran.', 'warning');
        }

    } catch (errMsg) {
        Swal.fire('Erreur de format', errMsg, 'error');
    } finally {
        event.target.value = ""; // Réinitialise l'input
    }
}



async function submitSignedContract() { 
    if (!signaturePad || signaturePad.isEmpty()) { 
        return Swal.fire('Attention', 'Veuillez signer avant de valider.', 'warning'); 
    }

    const id = document.getElementById('contract-id-hidden').value; 
    const signatureBase64 = signaturePad.toDataURL(); 

    Swal.fire({ 
        title: 'Signature en cours...', 
        text: 'Incrustation dans le document Word...', 
        didOpen: () => Swal.showLoading(),
        allowOutsideClick: false
    }); 

    try { 
        const r = await secureFetch(URL_UPLOAD_SIGNED_CONTRACT, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, signature: signatureBase64, agent: currentUser.nom }) 
        }); 
        
        const result = await r.json(); // On récupère le JSON, pas le texte HTML

        if (r.ok && result.status === "success") { 
            closeContractModal(); 
            
            // Succès ! On propose de voir le fichier
            Swal.fire({
                icon: 'success',
                title: 'Contrat Signé !',
                text: 'Le document Word a été généré avec votre signature.',
                showCancelButton: true,
                confirmButtonText: '📥 Télécharger',
                cancelButtonText: 'Fermer'
            }).then((choice) => {
                if (choice.isConfirmed) {
                    window.open(result.url, '_blank');
                }
            });
            refreshAllData(true); 
        } else {
            throw new Error(result.error || "Erreur lors de la signature");
        }
    } catch (e) { 
        console.error(e);
        Swal.fire('Erreur', e.message, 'error'); 
    } 
}


function showLeaveDetail(btn) {
    // 1. RÉCUPÉRATION DES DONNÉES
    const nom = btn.getAttribute('data-nom');
    const type = btn.getAttribute('data-type');
    const debut = btn.getAttribute('data-start');
    const fin = btn.getAttribute('data-end');
    const motif = btn.getAttribute('data-motif');
    const docLink = btn.getAttribute('data-doc');

    let documentHtml = '';
    const driveId = typeof getDriveId === 'function' ? getDriveId(docLink) : null;
    
    // --- STRATÉGIE DE CONFIDENTIALITÉ ---
    const canViewFiles = currentUser.permissions?.can_view_employee_files;

    if (!canViewFiles) {
        // Si l'utilisateur n'a pas le droit de voir les fichiers, on affiche un bloc verrouillé
        documentHtml = `
            <div class="mt-4 p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                <i class="fa-solid fa-lock text-slate-300 text-3xl mb-2"></i>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accès restreint aux pièces jointes</p>
                <p class="text-[9px] text-slate-400 mt-1 italic">Contactez un administrateur pour consulter le justificatif.</p>
            </div>`;
    } else {
        // Logique originale de gestion du document
        if (driveId) {
            const previewUrl = `https://drive.google.com/file/d/${driveId}/preview`;
            documentHtml = `
                <div class="mt-4 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 h-[200px]">
                    <iframe src="${previewUrl}" width="100%" height="100%" style="border:none;"></iframe>
                </div>`;
        } else if (docLink && docLink.length > 5 && docLink !== 'null') {
            documentHtml = `
                <div class="mt-4 text-center">
                    <p class="text-[10px] font-black text-slate-400 uppercase mb-2 text-left">Pièce Jointe</p>
                    <img src="${docLink}" class="max-h-[200px] w-full object-cover rounded-xl border shadow-sm cursor-pointer hover:scale-[1.02] transition-transform" 
                        onclick="window.open('${docLink}', '_blank')">
                </div>`;
        } else {
            documentHtml = `
                <div class="mt-4 p-4 rounded-xl border border-dashed border-slate-200 text-center text-slate-400">
                    <i class="fa-solid fa-file-circle-xmark mb-1"></i>
                    <p class="text-[10px] font-bold uppercase">Aucun justificatif</p>
                </div>`;
        }
    }

    // 2. AFFICHAGE DU POP-UP HORIZONTAL (Inchangé)
    Swal.fire({
        width: '850px',
        padding: '0',
        showConfirmButton: true,
        confirmButtonText: 'Fermer la fiche',
        confirmButtonColor: '#0f172a',
        customClass: { popup: 'rounded-[2rem] overflow-hidden' },
        html: `
            <div class="flex flex-col md:flex-row text-left bg-white">
                <div class="w-full md:w-[35%] bg-slate-50 p-8 border-r border-slate-100">
                    <p class="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2">Détails Demande</p>
                    <h3 class="text-2xl font-black text-slate-800 leading-tight mb-6">${nom}</h3>
                    <div class="space-y-6">
                        <div>
                            <label class="block text-[9px] font-black text-slate-400 uppercase mb-1">Nature de l'absence</label>
                            <span class="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide">
                                ${type}
                            </span>
                        </div>
                        <div class="grid grid-cols-1 gap-4">
                            <div class="p-3 bg-white rounded-xl border border-slate-200">
                                <p class="text-[9px] font-black text-slate-400 uppercase">Début (Matin)</p>
                                <p class="font-bold text-sm text-slate-700">${debut}</p>
                            </div>
                            <div class="p-3 bg-white rounded-xl border border-slate-200">
                                <p class="text-[9px] font-black text-slate-400 uppercase">Fin (Soir)</p>
                                <p class="font-bold text-sm text-slate-700">${fin}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="w-full md:w-[65%] p-8 flex flex-col justify-between">
                    <div>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Argumentaire / Motif</p>
                        <div class="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-slate-600 text-sm leading-relaxed italic shadow-inner max-h-[150px] overflow-y-auto custom-scroll">
                            "${motif}"
                        </div>
                        ${documentHtml}
                    </div>
                </div>
            </div>
        `
    });
}

function handleLogout() {
    // 1. Arrêter les flux caméra s'ils tournent
    if(videoStream) videoStream.getTracks().forEach(t => t.stop());
    if(contractStream) contractStream.getTracks().forEach(t => t.stop());

    // 2. VIDER TOTALEMENT LE CACHE ET LA MÉMOIRE
    localStorage.removeItem('sirh_token');
    localStorage.removeItem('sirh_user_session');
    localStorage.removeItem('sirh_last_view');
    // Optionnel : vider les préférences de widgets pour repartir à zéro
    const keys = Object.keys(localStorage);
    keys.forEach(k => { if(k.startsWith('pref_')) localStorage.removeItem(k); });

    // 3. CACHER L'INTERFACE IMMÉDIATEMENT (évite le flash au prochain login)
    const appLayout = document.getElementById('app-layout');
    if(appLayout) appLayout.classList.add('hidden');
    
    // 4. REDIRECTION PROPRE
    window.location.reload(); 
}


            async function syncOfflineData() {
                const queue = JSON.parse(localStorage.getItem('sirh_offline_queue') || '[]');
                
                if (queue.length === 0) return; // Rien à faire

                const Toast = Swal.mixin({toast: true, position: 'top-end', showConfirmButton: false});
                Toast.fire({icon: 'info', title: `Synchronisation de ${queue.length} pointage(s)...`});

                const remainingQueue = [];

                for (const item of queue) {
                    try {
                        // On tente d'envoyer
                        await secureFetch(URL_CLOCK_ACTION, { 
                            method: 'POST', 
                            headers: { 'Content-Type': 'application/json' }, 
                            body: JSON.stringify(item) 
                        });
                    } catch (e) {
                        console.error("Echec synchro item", item, e);
                        remainingQueue.push(item); // Si ça rate encore, on le garde pour la prochaine fois
                    }
                }

                // Mise à jour de la file d'attente (on ne garde que les échecs)
                localStorage.setItem('sirh_offline_queue', JSON.stringify(remainingQueue));

                if (remainingQueue.length === 0) {
                    Toast.fire({icon: 'success', title: 'Tous les pointages ont été synchronisés !'});
                    document.getElementById('clock-last-action').innerText = "Dernière action : " + new Date().toLocaleTimeString() + " (Synchronisé)";
                } else {
                    Toast.fire({icon: 'warning', title: `Reste ${remainingQueue.length} pointage(s) à envoyer.`});
                }
            }



            window.addEventListener('offline', () => { Swal.fire({ icon: 'warning', title: 'Connexion Perdue', text: 'Mode hors ligne.', toast: true, position: 'top-end', showConfirmButton: false, timer: 5000 }); document.body.classList.add('offline-mode'); });
        

            window.addEventListener('online', () => { 
                // 1. On ferme les alertes SweetAlert s'il y en a (comme "Pas de connexion")
                Swal.close();
                
                // 2. On affiche un petit toast vert
                const Toast = Swal.mixin({toast: true, position: 'top-end', showConfirmButton: false, timer: 3000});
                Toast.fire({ icon: 'success', title: 'Connexion Rétablie', text: 'Vous êtes de nouveau en ligne.' }); 
                
                // 3. On enlève le mode visuel hors ligne
                document.body.classList.remove('offline-mode'); 
                
                // 4. On synchronise les pointages en attente
                syncOfflineData();

                // 5. On rafraîchit les données visuelles
                if(currentUser) refreshAllData();
            });
        



async function fetchLeaveRequests() {
    if (!currentUser) return; 

    const body = document.getElementById('leave-requests-body');       
    const section = document.getElementById('manager-leave-section');  
    const myBody = document.getElementById('my-leave-requests-body');  

    const normalize = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    try {
        const r = await secureFetch(`${URL_READ_LEAVES}?agent=${encodeURIComponent(currentUser.nom)}`);
        const rawLeaves = await r.json();

        allLeaves = rawLeaves.map(l => {
            const clean = (v) => Array.isArray(v) ? v[0] : v;
            const rawNom = clean(l.Employees_nom || l.nom || l['Employé']);
            
            return {
                id: l.record_id || l.id || '',
                nom: rawNom ? String(rawNom).trim() : null,
                nomIndex: normalize(rawNom),
                statut: normalize(clean(l.Statut || l.statut)),
                type: normalize(clean(l.Type || l.type)),
                debut: clean(l['Date Début'] || l['Date de début'] || l.debut) ? parseDateSmart(clean(l['Date Début'] || l['Date de début'] || l.debut)) : null,
                fin: clean(l['Date Fin'] || l['Date de fin'] || l.fin) ? parseDateSmart(clean(l['Date Fin'] || l['Date de fin'] || l.fin)) : null,
                motif: clean(l.motif || l.Motif || "Aucun motif"),
                doc: clean(l.justificatif_link || l.Justificatif || l.doc || null),
                solde: l.solde_actuel || 0 
            };
        });

        // ============================================================
        // PARTIE 1 : TABLEAU DE VALIDATION (POUR MANAGER / ADMIN / RH)
        // ============================================================
        if (currentUser.role !== 'EMPLOYEE') {
            const pending = allLeaves.filter(l => l.statut === 'en attente');

            if (body && section) {
                section.classList.remove('hidden'); 
                body.innerHTML = '';

                // --- STRATÉGIE DE DÉCISION ---
                const canValidate = currentUser.permissions?.can_validate_leaves;

                if (pending.length > 0) {
                    pending.forEach(l => {
                        const cleanNom = (l.nom || 'Inconnu').replace(/"/g, '&quot;');
                        const cleanType = (l.type || 'Congé').replace(/"/g, '&quot;');
                        const cleanMotif = (l.motif || 'Aucun motif').replace(/"/g, '&quot;');
                        const cleanDoc = (l.doc || '').replace(/"/g, '&quot;');

                        const dStart = l.debut ? l.debut.toLocaleDateString('fr-FR') : '?';
                        const dEnd = l.fin ? l.fin.toLocaleDateString('fr-FR') : '?';
                        
                        const diffTime = l.fin && l.debut ? Math.abs(l.fin.getTime() - l.debut.getTime()) : 0;
                        const daysDifference = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                        const soldeColor = l.solde <= 5 ? 'text-orange-600' : 'text-emerald-600';

                        body.innerHTML += `
                            <tr class="border-b hover:bg-slate-50 transition-colors">
                                <td class="px-8 py-4">
                                    <div class="font-bold text-sm text-slate-700">${l.nom || 'Inconnu'}</div>
                                    <div class="text-[9px] font-black uppercase ${soldeColor} mb-1">
                                        Solde actuel : ${l.solde} JOURS
                                    </div>
                                    <div class="text-[10px] text-slate-400 font-normal uppercase">${l.type || 'Congé'}</div>
                                </td>
                                <td class="px-8 py-4 text-xs text-slate-500">${dStart} ➔ ${dEnd}</td>
                                <td class="px-8 py-4 text-right flex justify-end items-center gap-2">
                                    <button onclick="showLeaveDetail(this)" 
                                            data-nom="${cleanNom}"
                                            data-type="${cleanType}"
                                            data-start="${dStart}"
                                            data-end="${dEnd}"
                                            data-motif="${cleanMotif}"
                                            data-doc="${cleanDoc}"
                                            class="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm mr-2">
                                        <i class="fa-solid fa-eye"></i>
                                    </button>
                                    
                                    <!-- BOUTONS D'ACTION CONDITIONNELS -->
                                    ${canValidate ? `
                                        <button onclick="processLeave('${l.id}', 'Validé', ${daysDifference})" class="bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-md shadow-emerald-200">OUI</button>
                                        <button onclick="processLeave('${l.id}', 'Refusé', 0)" class="bg-white text-red-500 border border-red-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase">NON</button>
                                    ` : `
                                        <div class="px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-tighter">Lecture seule</div>
                                    `}
                                </td>
                            </tr>`;
                    });
                } else {
                    body.innerHTML = `
                        <tr>
                            <td colspan="3" class="px-8 py-10 text-center text-slate-400">
                                <div class="flex flex-col items-center gap-2">
                                    <i class="fa-solid fa-check-double text-2xl opacity-20"></i>
                                    <p class="text-xs font-bold uppercase tracking-widest">Aucune demande en attente</p>
                                </div>
                            </td>
                        </tr>`;
                }
            }
        }
        
        // PARTIE 2 : HISTORIQUE PERSONNEL (Inchangé)
        if (myBody) {
            myBody.innerHTML = '';
            const myNameNormalized = normalize(currentUser.nom);
            const myRequests = allLeaves.filter(l => l.nomIndex === myNameNormalized);

            if (myRequests.length === 0) {
                myBody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-slate-400 italic">Aucune demande soumise.</td></tr>';
            } else {
                myRequests.sort((a, b) => b.debut - a.debut);
                myRequests.forEach(r => {
                    const dStart = r.debut ? r.debut.toLocaleDateString('fr-FR') : '?';
                    const dEnd = r.fin ? r.fin.toLocaleDateString('fr-FR') : '?';
                    
                    let statusClass = 'bg-slate-100 text-slate-600';
                    let statusText = r.statut.toUpperCase();

                    if (r.statut.includes('attente')) {
                        statusClass = 'bg-yellow-50 text-yellow-700 border border-yellow-100';
                        statusText = '⏳ EN ATTENTE';
                    } else if (r.statut.includes('valid')) {
                        statusClass = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
                        statusText = '✅ APPROUVÉ';
                    } else if (r.statut.includes('refus')) {
                        statusClass = 'bg-red-50 text-red-700 border border-red-100';
                        statusText = '❌ REFUSÉ';
                    }

                    myBody.innerHTML += `
                        <tr class="hover:bg-slate-50 transition-colors border-b last:border-0">
                            <td class="px-6 py-4 text-xs font-bold text-slate-700">${dStart} <span class="text-slate-400 mx-1">au</span> ${dEnd}</td>
                            <td class="px-6 py-4 text-xs font-medium text-slate-500 capitalize">${r.type}</td>
                            <td class="px-6 py-4 text-xs text-slate-400 italic">${r.motif.substring(0, 25) + (r.motif.length > 25 ? '...' : '')}</td>
                            <td class="px-6 py-4 text-right">
                                <span class="px-2.5 py-1.5 rounded-lg text-[10px] font-black ${statusClass}">${statusText}</span>
                            </td>
                        </tr>`;
                });
            }
        }

        renderCharts();

    } catch (e) {
        console.error("Erreur fetchLeaveRequests:", e);
        if(myBody) myBody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-red-400">Erreur de chargement des congés.</td></tr>';
    }
}


async function fetchFlashMessage() {
        const container = document.getElementById('flash-container');
        if (!container) return;

        try {
            const r = await secureFetch(`${URL_READ_FLASH}?agent=${encodeURIComponent(currentUser.nom)}`);
            let messages = await r.json();
            if (!Array.isArray(messages)) messages = messages ? [messages] : [];

            const lastNotifId = localStorage.getItem('last_flash_id');

            container.innerHTML = '';
            const normalize = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

            messages.forEach((data, index) => {
                const msgText = data.Message || data.message;
                const msgSender = data.Sender || data.sender;
                const msgType = data.Type || data.type || 'Info';
                const msgId = String(data.id); // Utilisation de l'ID réel de la base de données

                // Filtrage : ne pas afficher si le message est vide ou si on en est l'auteur
                if (!msgText || normalize(msgSender) === normalize(currentUser.nom)) return;

                // --- LOGIQUE PUSH NOTIFICATION ---
                // Si c'est le message le plus récent et qu'on ne l'a pas encore notifié
                if (index === 0) {
                    if (lastNotifId !== msgId) {
                        triggerGlobalPush(`NOUVELLE ANNONCE : ${msgType}`, msgText);
                        localStorage.setItem('last_flash_id', msgId);
                    }
                }

                // Ne pas afficher si l'utilisateur a fermé cette annonce durant sa session
                const msgKey = `flash_closed_${msgId}`;
                if (sessionStorage.getItem(msgKey)) return;

                const styles = {
                    'Info': { bg: 'bg-gradient-to-r from-blue-600 to-indigo-600', icon: 'fa-circle-info' },
                    'Urgent': { bg: 'bg-gradient-to-r from-red-600 to-rose-600', icon: 'fa-triangle-exclamation' },
                    'Maintenance': { bg: 'bg-gradient-to-r from-yellow-500 to-orange-500', icon: 'fa-screwdriver-wrench' }
                };
                const st = styles[msgType] || styles['Info'];

                container.innerHTML += `
                    <div id="flash-msg-${msgId}" class="${st.bg} rounded-2xl p-4 text-white shadow-lg relative overflow-hidden mb-3">
                        <div class="relative z-10 flex items-start gap-4">
                            <div class="p-3 bg-white/20 rounded-xl"><i class="fa-solid ${st.icon} text-xl animate-pulse"></i></div>
                            <div class="flex-1">
                                <div class="flex justify-between items-start">
                                    <p class="text-[9px] font-black uppercase opacity-80">${msgType} • PAR ${msgSender.toUpperCase()}</p>
                                    <button onclick="closeSpecificFlash('${msgKey}', 'flash-msg-${msgId}')"><i class="fa-solid fa-xmark"></i></button>
                                </div>
                                <p class="font-bold text-sm">${msgText}</p>
                            </div>
                        </div>
                    </div>`;
            });
        } catch (e) { console.warn("Erreur chargement Flash:", e); }
    }


    // Fonction pour afficher les documents cachés
    function toggleMoreDocs(btn) {
        // Affiche tous les éléments cachés
        document.querySelectorAll('.more-docs').forEach(el => {
            el.classList.remove('hidden');
            el.classList.add('animate-fadeIn'); // Petit effet d'apparition
        });
        // Supprime le bouton après le clic
        btn.parentElement.remove();
    }




    // Nouvelle fonction intermédiaire pour décoder les données sécurisées
    function showLeaveDetailFromSafeData(safeNom, type, debut, fin, safeMotif, safeDocLink) {
        const nom = decodeURIComponent(safeNom);
        const motif = decodeURIComponent(safeMotif);
        const docLink = safeDocLink ? decodeURIComponent(safeDocLink) : null;
        
        // Appel de la vraie fonction d'affichage
        showLeaveDetail(nom, type, debut, fin, motif, docLink);
    }










async function runArchivingJob() {
    const confirm = await Swal.fire({
        title: 'Lancer la maintenance ?',
        text: "Cela va déplacer les vieilles données vers les archives et supprimer les anciennes photos de visite pour libérer de l'espace.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#0f172a',
        confirmButtonText: 'Oui, nettoyer maintenant'
    });

    if (confirm.isConfirmed) {
        Swal.fire({ title: 'Maintenance en cours...', didOpen: () => Swal.showLoading() });
        
        try {
            const r = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/run-archiving-job`, { method: 'POST' });
            const data = await r.json();
            
            Swal.fire({
                title: 'Terminé !',
                html: `
                    <div class="text-left text-sm">
                        <p><strong>Logs archivés :</strong> ${data.report.logs}</p>
                        <p><strong>Photos supprimées :</strong> ${data.report.photos_deleted}</p>
                        <p><strong>Employés archivés :</strong> ${data.report.employees}</p>
                    </div>
                `,
                icon: 'success'
            });
        } catch (e) {
            Swal.fire('Erreur', e.message, 'error');
        }
    }
}




async function processLeave(recordId, decision, daysToDeduct = 0) {
    // daysToDeduct est maintenant le nombre de jours calculé entre début et fin

    // 1. Demander confirmation à l'utilisateur
    const confirmation = await Swal.fire({
        title: decision === 'Validé' ? `Approuver ${daysToDeduct} jours de congé ?` : 'Refuser ce congé ?',
        // On affiche directement le nombre de jours dans le texte :
        text: decision === 'Validé' ? `La déduction de ${daysToDeduct} jours sera appliquée au solde de l'employé.` : "L'employé sera informé de cette décision.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Oui, confirmer',
        cancelButtonText: 'Annuler',
        confirmButtonColor: decision === 'Validé' ? '#10b981' : '#ef4444'
    });

    if (confirmation.isConfirmed) {
        // 2. Afficher un chargement
        Swal.fire({ 
            title: 'Traitement en cours...', 
            allowOutsideClick: false, 
            didOpen: () => Swal.showLoading() 
        });

        // NOUVEAU : On définit la déduction à daysToDeduct pour l'envoi à Make
        const finalDaysDeduct = (decision === 'Validé') ? daysToDeduct : 0;

        try {
            // 3. Envoyer l'ordre au serveur Render -> Make
            const response = await secureFetch(URL_LEAVE_ACTION, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: recordId, 
                    decision: decision, 
                    days_deduct: finalDaysDeduct, // <--- ENVOI AUTOMATIQUE DU NOMBRE
                    agent: currentUser.nom 
                })
            });

            if (response.ok) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Terminé',
                    text: `La demande a été marquée comme ${decision.toLowerCase()} et ${finalDaysDeduct} jours ont été déduits.`,
                    timer: 3000
                });
                // 4. On actualise tout pour voir le nouveau solde
                refreshAllData(true); 
            } else {
                throw new Error("Erreur du serveur");
            }
        } catch (e) {
            console.error("Erreur action congé:", e);
            Swal.fire('Erreur', "Impossible de valider l'action : " + e.message, 'error');
        }
    }
}


    // Fonction pour choisir entre Caméra et Fichier via une alerte
    function openDocCamera(target) {
        Swal.fire({
            title: 'Source du document',
            text: "Voulez-vous prendre une photo ou choisir un fichier ?",
            showCancelButton: true,
            confirmButtonText: '📸 Caméra',
            cancelButtonText: '📁 Fichier',
            confirmButtonColor: '#2563eb'
        }).then((result) => {
            if (result.isConfirmed) {
                startGenericCamera(target);
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                document.getElementById('f-' + target).click();
            }
        });
    }

    // Démarre la caméra pour n'importe quel doc
    async function startGenericCamera(target) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            Swal.fire({
                title: 'Capture',
                html: `<video id="temp-video" autoplay playsinline class="w-full rounded-xl"></video>`,
                confirmButtonText: 'CAPTURER',
                showCancelButton: true,
                didOpen: () => { document.getElementById('temp-video').srcObject = stream; }
            }).then((result) => {
                if (result.isConfirmed) {
                    const video = document.getElementById('temp-video');
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
                    canvas.getContext('2d').drawImage(video, 0, 0);
                    canvas.toBlob(blob => {
                        saveDoc(target, blob);
                        stream.getTracks().forEach(t => t.stop());
                    }, 'image/jpeg', 0.8);
                } else {
                    stream.getTracks().forEach(t => t.stop());
                }
            });
        } catch (e) { Swal.fire('Erreur', 'Caméra inaccessible', 'error'); }
    }

    // Aperçu et stockage du fichier (qu'il vienne du PC ou de la Caméra)
    function previewDocFile(event, target) {
        const file = event.target.files[0];
        if (file) saveDoc(target, file);
    }






      async function saveDoc(target, fileOrBlob) { // Rendre asynchrone
        // --- NOUVEAU : Compression si c'est une image ---
        Swal.update({ text: 'Compression du document en cours...' }); // Affiche un loader si nécessaire
        const processedFile = await compressImage(fileOrBlob);
        docBlobs[target] = processedFile; // Stocke la version compressée

        const preview = document.getElementById('preview-' + target);
        const icon = document.getElementById('icon-' + target);
        
        if(preview) {
            preview.src = URL.createObjectURL(processedFile); // Utilise processedFile ici
            preview.classList.remove('hidden');
            if(icon) icon.classList.add('hidden');
        } else if(target === 'leave_justif') {
            document.getElementById('leave-doc-preview').innerHTML = '<i class="fa-solid fa-check text-emerald-500"></i>';
        }
    }




    async function updateSingleDoc(docKey, employeeId) {
        const { value: file } = await Swal.fire({
            title: 'Mettre à jour le document',
            input: 'file',
            inputAttributes: { 'accept': 'image/*,application/pdf' },
            showCancelButton: true,
            confirmButtonText: 'Uploader',
            cancelButtonColor: '#ef4444',
            confirmButtonColor: '#2563eb'
        });


                if (file) {
            Swal.fire({ title: 'Envoi...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });
            const fd = new FormData();
            fd.append('id', employeeId);
            fd.append('agent', currentUser.nom);
            fd.append('agent_role', currentUser.role); 
            
            // --- NOUVEAU : COMPRESSION POUR LA MISE À JOUR ---
            Swal.update({ text: 'Compression du document en cours...' });
            const compressedFile = await compressImage(file);
            fd.append('new_photo', compressedFile); // Champ utilisé par ton serveur
            fd.append('doc_type', docKey); 
            
            try {
                const r = await secureFetch(URL_EMPLOYEE_UPDATE, { method: 'POST', body: fd });
                if (r.ok) {
                    Swal.fire('Succès', 'Document mis à jour', 'success');
                    refreshAllData();
                }
            } catch (e) { Swal.fire('Erreur', e.message, 'error'); }
        }     
    }



async function fetchCandidates() {
    const body = document.getElementById('candidates-body');
    body.innerHTML = '<tr><td colspan="4" class="p-8 text-center"><i class="fa-solid fa-circle-notch fa-spin text-blue-600 text-2xl"></i><p class="text-xs text-slate-400 mt-2 font-bold uppercase">Chargement des talents...</p></td></tr>';

    try {
        const r = await secureFetch(`${URL_READ_CANDIDATES}?agent=${encodeURIComponent(currentUser.nom)}`);
        let rawData = await r.json();
        
        let candidates = [];
        if (Array.isArray(rawData)) {
            candidates = rawData;
        } else if (typeof rawData === 'object' && rawData !== null) {
            candidates = rawData.data || rawData.items || [rawData];
        }

        body.innerHTML = '';

        if (candidates.length === 0) {
            body.innerHTML = '<tr><td colspan="4" class="p-8 text-center text-slate-400 font-bold bg-slate-50 rounded-xl border border-dashed border-slate-200">Aucune candidature en attente</td></tr>';
            return;
        }

        candidates.forEach(c => {
            // --- CORRECTION 1 : Utiliser nom_complet au lieu de nom ---
            const displayNom = c.nom_complet || c.Nom_complet || c.nom || "Inconnu";
            const safeNom = encodeURIComponent(displayNom);
            
            // --- CORRECTION 2 : Utiliser id au lieu de record_id ---
            const safeId = c.id; 

            const getAttachmentUrl = (attachment) => {
                if (!attachment) return null;
                if (Array.isArray(attachment) && attachment.length > 0) return attachment[0].url;
                if (typeof attachment === 'string' && attachment.startsWith('http')) return attachment;
                return null;
            };

            const cvLink = getAttachmentUrl(c.cv_url); // c.cv_url correspond à votre colonne Supabase
            const lMLink = getAttachmentUrl(c.lm_url);
            const dipLink = getAttachmentUrl(c.diploma_url);
            const attLink = getAttachmentUrl(c.attestation_url);
            const idCardLink = getAttachmentUrl(c.id_card_url);

            const safeCv = cvLink ? encodeURIComponent(cvLink) : '';
            const safeLm = lMLink ? encodeURIComponent(lMLink) : '';
            const safeDip = dipLink ? encodeURIComponent(dipLink) : '';
            const safeAtt = attLink ? encodeURIComponent(attLink) : '';
            const safeIdCard = idCardLink ? encodeURIComponent(idCardLink) : '';

            let stRaw = c.statut || 'Nouveau';
            let stLogic = stRaw.toString().toLowerCase().trim();
            
            let badgeClass = 'bg-slate-100 text-slate-600';
            
            if(stLogic.includes('entretien')) badgeClass = 'bg-blue-100 text-blue-700';
            else if(stLogic.includes('embauché') || stLogic.includes('validé')) badgeClass = 'bg-emerald-100 text-emerald-700';
            else if(stLogic.includes('refus')) badgeClass = 'bg-red-50 text-red-500';
            else if(stLogic.includes('nouveau')) badgeClass = 'bg-yellow-50 text-yellow-700';

            const btnDocs = `
                <button onclick="showCandidateDocs('${safeNom}', '${c.poste_vise || 'Candidat'}', '${safeCv}', '${safeLm}', '${safeDip}', '${safeAtt}', '${safeIdCard}')" 
                        class="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all mr-2" title="Ouvrir le dossier">
                    <i class="fa-solid fa-folder-open"></i>
                </button>
            `;

            let actionButtons = '';
            
            // --- CORRECTION 3 : Utiliser safeId (qui est c.id) dans les appels de fonction ---
            if (stLogic === 'nouveau' || !c.statut) {
                actionButtons = `
                    ${btnDocs}
                    <button onclick="handleCandidateAction('${safeId}', 'VALIDER_POUR_ENTRETIEN')" class="bg-blue-600 text-white hover:bg-blue-700 px-3 py-2 rounded-lg text-[10px] font-bold uppercase shadow-md shadow-blue-200 transition-all mr-2"><i class="fa-solid fa-calendar-check mr-1"></i> Entretien</button>
                    <button onclick="handleCandidateAction('${safeId}', 'REFUS_IMMEDIAT')" class="bg-white border border-red-100 text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all"><i class="fa-solid fa-xmark mr-1"></i> Refus</button>
                `;
            } else if (stLogic === 'entretien') {
                actionButtons = `
                    ${btnDocs}
                    <button onclick="handleCandidateAction('${safeId}', 'ACCEPTER_EMBAUCHE')" class="bg-emerald-500 text-white hover:bg-emerald-600 px-3 py-2 rounded-lg text-[10px] font-bold uppercase shadow-md shadow-emerald-200 transition-all mr-2"><i class="fa-solid fa-user-plus mr-1"></i> Embaucher</button>
                    <button onclick="handleCandidateAction('${safeId}', 'REFUS_APRES_ENTRETIEN')" class="bg-white border border-orange-100 text-orange-500 hover:bg-orange px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all"><i class="fa-solid fa-thumbs-down mr-1"></i> Refus</button>
                `;
            } else {
                actionButtons = `${btnDocs} <span class="text-[10px] font-bold text-slate-300 italic">Dossier Traité</span>`;
            }

            body.innerHTML += `
            <tr class="border-b hover:bg-slate-50 transition-colors group">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">${displayNom.charAt(0)}</div>
                        <div>
                            <!-- CORRECTION : Affichage de displayNom -->
                            <div class="font-bold text-sm text-slate-800">${displayNom}</div>
                            <div class="text-[10px] text-slate-400 font-mono">${c.email}</div>
                        </div>
                    </div>
                </td>
                <!-- CORRECTION : poste_vise au lieu de poste -->
                <td class="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-tight">${c.poste_vise || 'Non précisé'}</td>
                <td class="px-6 py-4 text-center">
                    <span class="${badgeClass} px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wide border border-black/5 shadow-sm">${stRaw}</span>
                </td>
                <td class="px-6 py-4 text-right flex justify-end items-center">
                    ${actionButtons}
                </td>
            </tr>`;
        });

    } catch (e) {
        console.error("Erreur Candidats:", e);
        body.innerHTML = `<tr><td colspan="4" class="p-6 text-center text-red-500 font-bold text-sm bg-red-50 rounded-xl border border-red-100">Erreur de chargement : ${e.message}</td></tr>`;
    }
}




    // Fonction DESIGN FINAL (Airtable Compatible + Scroll Vertical autorisé, Horizontal banni)
function showCandidateDocs(safeNom, poste, cv, lm, dip, att, idCard) {
    const nom = decodeURIComponent(safeNom);
    
    const docs = [
        { id: 'cv', label: 'CV', url: cv ? decodeURIComponent(cv) : null, icon: 'fa-file-user', color: 'blue' },
        { id: 'lm', label: 'Lettre Motiv.', url: lm ? decodeURIComponent(lm) : null, icon: 'fa-envelope-open-text', color: 'pink' },
        { id: 'id_card', label: 'Pièce Identité', url: idCard ? decodeURIComponent(idCard) : null, icon: 'fa-id-card', color: 'purple' },
        { id: 'dip', label: 'Diplôme', url: dip ? decodeURIComponent(dip) : null, icon: 'fa-graduation-cap', color: 'emerald' },
        { id: 'att', label: 'Attestation', url: att ? decodeURIComponent(att) : null, icon: 'fa-file-invoice', color: 'orange' }
    ];

    // --- COLONNE GAUCHE (Menu) ---
    let buttonsHtml = '<div class="flex flex-col gap-2 overflow-y-auto pr-1 custom-scroll" style="max-height: 350px;">';
    let firstDocUrl = null;
    let hasDocs = false;

    docs.forEach(d => {
        if (d.url && d.url !== 'null' && d.url.length > 5) {
            hasDocs = true;
            if (!firstDocUrl) firstDocUrl = d.url; 
            
            buttonsHtml += `
                <button onclick="changePreview('${d.url}', this)" 
                    class="doc-btn w-full flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all text-left group shadow-sm">
                    <div class="w-8 h-8 shrink-0 rounded-lg bg-${d.color}-50 flex items-center justify-center text-${d.color}-600 group-hover:scale-110 transition-transform">
                        <i class="fa-solid ${d.icon} text-sm"></i>
                    </div>
                    <div class="overflow-hidden flex-1 min-w-0">
                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-wide truncate">DOC</p>
                        <p class="text-xs font-bold text-slate-700 truncate">${d.label}</p>
                    </div>
                </button>
            `;
        }
    });
    buttonsHtml += '</div>';

    if (!hasDocs) {
        buttonsHtml = `<div class="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-slate-400 text-xs italic">Aucun document</div>`;
    }

    // --- LOGIQUE D'AFFICHAGE ---
    window.changePreview = function(url, btn) {
        // 1. Style des boutons
        document.querySelectorAll('.doc-btn').forEach(b => {
            b.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50/50');
            b.classList.add('bg-white', 'border-slate-200');
        });
        if(btn) {
            btn.classList.remove('bg-white', 'border-slate-200');
            btn.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50/50');
        }

        const viewerFrame = document.getElementById('doc-viewer-frame');
        const viewerImg = document.getElementById('doc-viewer-img');
        const extLink = document.getElementById('external-link-btn');
        const container = document.getElementById('preview-container');

        if(extLink) extLink.href = url;

        // 2. Détection IMAGE vs AUTRE (PDF)
        // On considère comme image : les extensions classiques OU les liens Airtable hébergeant des images
        // Les liens Airtable ressemblent souvent à v5.airtableusercontent...
        const isImageExtension = url.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i);
        const isAirtableImage = url.includes('airtableusercontent') && !url.toLowerCase().includes('.pdf');
        
        // SÉCURITÉ : Google Drive ID
        const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
        let finalUrl = url;
        
        if (driveMatch) {
            // Conversion Drive -> Image directe
            finalUrl = `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
            viewerFrame.classList.add('hidden');
            viewerImg.classList.remove('hidden');
            viewerImg.src = finalUrl;
        } 
        else if (isImageExtension || isAirtableImage) {
            // C'EST UNE IMAGE (Airtable ou autre)
            viewerFrame.classList.add('hidden');
            viewerImg.classList.remove('hidden');
            viewerImg.src = url;
            
            // Réglage du conteneur pour le scroll
            container.classList.remove('overflow-hidden');
            container.classList.add('overflow-y-auto', 'overflow-x-hidden');
        } 
        else {
            // C'EST UN PDF (ou autre fichier) -> IFRAME
            viewerImg.classList.add('hidden');
            viewerFrame.classList.remove('hidden');
            
            // Ajustement URL Drive pour PDF
            if(url.includes('drive.google.com') && url.includes('/view')) finalUrl = url.replace('/view', '/preview');
            
            viewerFrame.src = finalUrl;
            
            // Pour l'iframe, on laisse le conteneur hidden car l'iframe a son propre scroll
            container.classList.add('overflow-hidden');
            container.classList.remove('overflow-y-auto');
        }
    };

    // --- HTML SWEETALERT ---
    Swal.fire({
        title: null, 
        html: `
            <div class="flex flex-col md:flex-row h-[500px] gap-4 text-left">
                
                <!-- GAUCHE : MENU (25%) -->
                <div class="w-full md:w-[25%] flex flex-col h-full border-r border-slate-100 pr-2">
                    <div class="mb-4">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Candidat</p>
                        <h2 class="text-xl font-extrabold text-slate-800 leading-tight mb-1 truncate">${nom}</h2>
                        <span class="inline-block bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide">
                            ${poste}
                        </span>
                    </div>
                    
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Fichiers</p>
                    ${buttonsHtml}

                    <div class="mt-auto pt-2">
                        <button onclick="Swal.close()" class="w-full py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-colors uppercase">
                            Fermer
                        </button>
                    </div>
                </div>

                <!-- DROITE : APERÇU (75%) -->
                <!-- 
                     id="preview-container" : C'est lui qui gère le scroll.
                     overflow-x-hidden : TUE le scroll horizontal.
                     overflow-y-auto : ACTIVE le scroll vertical si l'image est grande.
                -->
                <div id="preview-container" class="w-full md:w-[75%] h-full bg-slate-900 rounded-xl border border-slate-200 relative flex flex-col items-center shadow-inner overflow-x-hidden overflow-y-auto custom-scroll">
                    
                    ${hasDocs ? `
                        <div class="absolute top-3 right-3 z-10 sticky">
                            <a id="external-link-btn" href="${firstDocUrl || '#'}" target="_blank" class="bg-white/90 backdrop-blur text-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm border hover:text-blue-600 transition-all flex items-center gap-1">
                                <i class="fa-solid fa-up-right-from-square"></i> Ouvrir
                            </a>
                        </div>
                        
                        <!-- IFRAME (PDF) : Prend 100% hauteur -->
                        <iframe id="doc-viewer-frame" src="" class="w-full h-full bg-white hidden" frameborder="0"></iframe>
                        
                        <!-- IMG : Largeur 100% (w-full) et Hauteur Auto (h-auto) 
                             Cela force l'image à toucher les bords gauche/droite (pas de scroll H)
                             mais à s'allonger vers le bas (scroll V) -->
                        <img id="doc-viewer-img" class="w-full h-auto min-h-full bg-black/5 hidden object-top">

                    ` : `
                        <div class="w-full h-full flex flex-col items-center justify-center text-slate-500">
                            <i class="fa-solid fa-file-circle-xmark text-5xl opacity-20 mb-3"></i>
                            <p class="text-xs font-medium">Aucun aperçu</p>
                        </div>
                    `}
                </div>
            </div>
        `,
        width: '1000px',
        showConfirmButton: false, 
        showCloseButton: false,
        padding: '1.5rem',
        customClass: { popup: 'rounded-[1.5rem] viewer-modal', htmlContainer: '!m-0' },
        didOpen: () => {
            const firstBtn = document.querySelector('.doc-btn');
            if(firstBtn) {
                const onclickStr = firstBtn.getAttribute('onclick');
                const url = onclickStr.split("'")[1];
                window.changePreview(url, firstBtn);
            }
        }
    });
}




    function convertToInputDate(dStr){
        if(!dStr) return ""; 
        // Si c'est déjà au format YYYY-MM-DD
        if(dStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dStr; 
        // Si c'est au format DD/MM/YYYY
        if(dStr.includes('/')){
            const p=dStr.split('/'); 
            return `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`;
        } 
        return "";
    }




async function handleCandidateAction(id, action) {
    const conf = {
        'VALIDER_POUR_ENTRETIEN': { t: 'Inviter en entretien ?', c: '#2563eb', txt: "Un email d'invitation sera envoyé automatiquement." },
        'REFUS_IMMEDIAT': { t: 'Refuser la candidature ?', c: '#ef4444', txt: "Un email de refus immédiat sera envoyé." },
        'ACCEPTER_EMBAUCHE': { t: 'Confirmer l\'embauche ?', c: '#10b981', txt: 'Cela créera le profil employé et enverra les accès.' },
        'REFUS_APRES_ENTRETIEN': { t: 'Refuser après entretien ?', c: '#f97316', txt: "Un email de refus personnalisé sera envoyé." }
    }[action];

    const res = await Swal.fire({ 
        title: conf.t, 
        text: conf.txt, 
        icon: 'question', 
        showCancelButton: true, 
        confirmButtonColor: conf.c, 
        confirmButtonText: 'Oui, confirmer',
        cancelButtonText: 'Annuler'
    });
    
    if (res.isConfirmed) {
        let employeeType = 'OFFICE'; // Valeur par défaut
        let chosenDept = 'À définir';

        // --- SI EMBAUCHE : ON DEMANDE LE TYPE ET LE DEPARTEMENT ---
        if (action === 'ACCEPTER_EMBAUCHE') {
            const depRes = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/list-departments`);
            const depts = await depRes.json();
            let deptOptions = depts.map(d => `<option value="${d.code}">${d.label}</option>`).join('');

            const { value: selection } = await Swal.fire({
                title: 'Paramètres d\'embauche',
                html: `
                    <div class="text-left">
                        <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">Type d'activité</label>
                        <select id="swal-emp-type" class="swal2-input !mt-0">
                            <option value="OFFICE">🏢 Bureau (Fixe)</option>
                            <option value="FIXED">🏠 Agent Site (Fixe)</option>
                            <option value="MOBILE">🚗 Délégué (Nomade)</option>
                        </select>

                        <label class="block text-[10px] font-black text-slate-400 uppercase mt-4 mb-1">Affectation Département</label>
                        <select id="swal-dept" class="swal2-input !mt-0">
                            <option value="">-- Sélectionner --</option>
                            ${deptOptions}
                        </select>
                    </div>
                `,
                focusConfirm: false,
                showCancelButton: true,
                confirmButtonColor: '#10b981',
                preConfirm: () => {
                    const type = document.getElementById('swal-emp-type').value;
                    const dept = document.getElementById('swal-dept').value;
                    if (!dept) {
                        Swal.showValidationMessage('Veuillez choisir un département');
                        return false;
                    }
                    return { employeeType: type, department: dept };
                }
            });

            if (!selection) return; // Annulation
            employeeType = selection.employeeType;
            chosenDept = selection.department;
        }

        // Affichage du loader
        Swal.fire({ 
            title: 'Action en cours...', 
            text: 'Mise à jour du dossier...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading() 
        });

        try {
            const response = await secureFetch(URL_CANDIDATE_ACTION, {
                method: 'POST', 
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    id: id, 
                    action: action, 
                    agent: currentUser.nom,
                    employee_type: employeeType,
                    departement: chosenDept 
                })
            });

            const result = await response.json();

            if (result && result.status === "success") {
                Swal.fire('Succès', 'Action effectuée avec succès.', 'success');
                fetchCandidates(); 
                if(action === 'ACCEPTER_EMBAUCHE') fetchData(true);
            } else {
                throw new Error(result.error || "Le serveur n'a pas confirmé l'action");
            }

        } catch(e) { 
            Swal.fire('Échec du traitement', e.message, 'error'); 
        }
    }
}




async function fetchZones() {
    const container = document.getElementById('zones-container');
    if (!container) return;

    try {
        const r = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/list-zones`);
        const zones = await r.json();
        
        container.innerHTML = '';
        zones.forEach(z => {
            container.innerHTML += `
                <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div class="flex justify-between items-start mb-4">
                        <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl">
                            <i class="fa-solid fa-building-shield"></i>
                        </div>
                        <button onclick="deleteZone(${z.id})" class="text-slate-300 hover:text-red-500 transition-colors">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                    <h3 class="font-black text-lg text-slate-800 uppercase tracking-tighter">${z.nom}</h3>
                    <p class="text-[10px] text-slate-400 font-bold uppercase mb-4">Rayon : ${z.rayon}m</p>
                    
                    <div class="bg-slate-50 p-3 rounded-xl text-[10px] font-mono text-slate-500">
                        LAT: ${z.latitude} <br> LON: ${z.longitude}
                    </div>
                    
                    <div class="mt-4 flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full ${z.actif ? 'bg-emerald-500' : 'bg-slate-300'}"></span>
                        <span class="text-[10px] font-black uppercase text-slate-400">${z.actif ? 'Zone Active' : 'Désactivée'}</span>
                    </div>
                </div>
            `;
        });
    } catch (e) { console.error(e); }
}




async function openAddZoneModal() {
    // On propose à l'admin d'utiliser sa position actuelle
    const { value: formValues } = await Swal.fire({
        title: 'Ajouter un nouveau siège',
        html:
            '<input id="swal-nom" class="swal2-input" placeholder="Nom (ex: Siège Cotonou)">' +
            '<input id="swal-lat" class="swal2-input" placeholder="Latitude">' +
            '<input id="swal-lon" class="swal2-input" placeholder="Longitude">' +
            '<input id="swal-ray" class="swal2-input" type="number" value="100" placeholder="Rayon (mètres)">' +
            '<button onclick="useCurrentLocation()" class="mt-2 text-[10px] font-black text-blue-600 uppercase underline">Utiliser ma position actuelle</button>',
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Enregistrer la zone',
        preConfirm: () => {
            return {
                nom: document.getElementById('swal-nom').value,
                lat: document.getElementById('swal-lat').value,
                lon: document.getElementById('swal-lon').value,
                rayon: document.getElementById('swal-ray').value
            }
        }
    });

    if (formValues) {
        if (!formValues.nom || !formValues.lat || !formValues.lon) return Swal.fire('Erreur', 'Tous les champs sont requis', 'error');

        const response = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/add-zone`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formValues)
        });

        if (response.ok) {
            Swal.fire('Zone ajoutée !', '', 'success');
            fetchZones();
            // On force la mise à jour de la config GPS globale
            fetchCompanyConfig();
        }
    }
}

// Helper pour capturer la position de l'admin
window.useCurrentLocation = function() {
    navigator.geolocation.getCurrentPosition((pos) => {
        document.getElementById('swal-lat').value = pos.coords.latitude;
        document.getElementById('swal-lon').value = pos.coords.longitude;
    });
}

async function deleteZone(id) {
    const confirm = await Swal.fire({ title: 'Supprimer cette zone ?', text: "Le pointage ne sera plus possible ici.", icon: 'warning', showCancelButton: true });
    if (confirm.isConfirmed) {
        await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/delete-zone`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        fetchZones();
        fetchCompanyConfig();
    }
}




function changePage(direction) {
                const totalPages = Math.ceil(employees.length / ITEMS_PER_PAGE);
                const newPage = currentPage + direction;
                
                if (newPage >= 1 && newPage <= totalPages) {
                    currentPage = newPage;
                    renderData();
                    
                    // --- CORRECTION DU SCROLL ---
                    // On remonte doucement vers le haut du tableau, pas tout en haut de la page
                    // Cela garde le focus visuel sur les données
                    const tableSection = document.getElementById('view-employees');
                    if(tableSection) {
                        tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            }





            // --- SÉCURITÉ XSS (NETTOYAGE DES DONNÉES) ---
            function escapeHTML(str) {
                if (str === null || str === undefined) return '';
                return String(str).replace(/[&<>'"]/g, 
                    tag => ({
                        '&': '&amp;',
                        '<': '&lt;',
                        '>': '&gt;',
                        "'": '&#39;',
                        '"': '&quot;'
                    }[tag]));
            }





    // --- FEEDBACK FICHIER ---
    function updateFileFeedback(inputId, labelId) {
        const input = document.getElementById(inputId);
        const label = document.getElementById(labelId); // Le bouton ou le conteneur visuel
        const file = input.files[0];

        if (file) {
            // Change le style pour dire "C'est bon !"
            if (label) {
                // Sauvegarde le texte original si pas déjà fait
                if (!label.dataset.originalText) label.dataset.originalText = label.innerHTML;
                
                // Affiche le nom et une icône verte
                label.innerHTML = `<i class="fa-solid fa-check-circle text-emerald-500 mr-2"></i> <span class="text-emerald-700 font-bold text-[10px] truncate">${file.name}</span>`;
                label.classList.add('bg-emerald-50', 'border-emerald-200');
                label.classList.remove('bg-white', 'bg-blue-50', 'text-slate-600', 'text-blue-600');
            }
        }
    }


            // --- GESTION INTELLIGENTE DU RÉSEAU ---
            window.addEventListener('online', () => { 
                // 1. On ferme les alertes SweetAlert s'il y en a (comme "Pas de connexion")
                Swal.close();
                
                // 2. On affiche un petit toast vert
                const Toast = Swal.mixin({toast: true, position: 'top-end', showConfirmButton: false, timer: 3000});
                Toast.fire({ icon: 'success', title: 'Connexion Rétablie', text: 'Vous êtes de nouveau en ligne.' }); 
                
                // 3. On enlève le mode visuel hors ligne
                document.body.classList.remove('offline-mode'); 
                
                // 4. Optionnel : On peut retenter de charger les données si on est connecté
                if(currentUser) refreshAllData();
            });

            window.addEventListener('offline', () => { 
                const Toast = Swal.mixin({toast: true, position: 'top-end', showConfirmButton: false, timer: 5000});
                Toast.fire({ icon: 'warning', title: 'Connexion Perdue', text: 'Mode hors ligne activé.' }); 
                document.body.classList.add('offline-mode'); 
            });


            function clearSignature() {
                if (signaturePad) signaturePad.clear();
            }                                                   




    function closeFlashBanner() {
        const banner = document.getElementById('flash-banner');
        if(banner.dataset.key) {
            sessionStorage.setItem(banner.dataset.key, 'true'); // Mémorise la fermeture pour la session
        }
        banner.classList.add('hidden');
    }

    function openFlashModal() {
        document.getElementById('flash-modal').classList.remove('hidden');
        document.getElementById('flash-input-msg').value = '';
    }
    



    // Nouvelle fonction pour fermer UN SEUL message de la pile
    function closeSpecificFlash(storageKey, elementId) {
        sessionStorage.setItem(storageKey, 'true');
        const el = document.getElementById(elementId);
        if (el) {
            el.style.opacity = '0';
            el.style.transform = 'translateX(20px)';
            setTimeout(() => el.remove(), 500);
        }
    }



async function fetchPayrollData() {
    const container = document.getElementById('payroll-container');
    const countLabel = document.getElementById('count-payroll');
    if (!container || !currentUser) return;

    try {
        const r = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/read-payroll?employee_id=${encodeURIComponent(currentUser.id)}&agent=${encodeURIComponent(currentUser.nom)}`);
        const payrolls = await r.json();
        
        container.innerHTML = '';
        if(countLabel) countLabel.innerText = payrolls.length || 0;

        if (!payrolls || payrolls.length === 0) {
            container.innerHTML = '<p class="col-span-full text-[10px] text-slate-400 italic text-center py-10">Aucun bulletin disponible</p>';
            return;
        }

        payrolls.forEach(p => {
            // On récupère le nom et le poste depuis l'objet lié
            const nomEmp = p.employees ? p.employees.nom : currentUser.nom;
            const posteEmp = p.employees ? p.employees.poste : "--";
            
            // Attention aux minuscules/majuscules venant de Supabase
            const montant = p.salaire_net ? new Intl.NumberFormat('fr-FR').format(p.salaire_net) + ' FCFA' : '--';
            const titre = `${p.mois} ${p.annee}`;
            const fileUrl = p.fiche_pdf_url; // Nom exact de ta colonne Supabase

                        container.innerHTML += `
                            <div class="flex flex-col justify-between p-4 border border-slate-100 bg-slate-50 rounded-xl hover:bg-white hover:border-blue-200 hover:shadow-md transition-all group">
                                <div class="flex items-start justify-between mb-3">
                                    <div class="bg-white border border-slate-100 text-emerald-600 p-2.5 rounded-xl shadow-sm">
                                        <i class="fa-solid fa-file-invoice text-xl"></i>
                                    </div>
                                    <button onclick="viewDocument('${fileUrl}', 'Bulletin ${titre}')" class="text-slate-300 hover:text-blue-600 transition-colors">
                                        <i class="fa-solid fa-eye"></i>
                                    </button>
                                </div>
                                <div>
                                    <p class="text-[10px] font-black text-slate-400 uppercase mb-1">${nomEmp}</p>
                                    <p class="text-xs font-bold text-slate-700 mb-1">Bulletin de ${titre}</p>
                                    
                                    <!-- MODIFICATION ICI : Ajout du Privacy Mode sur le montant -->
                                    <p class="text-[10px] text-emerald-600 font-black uppercase tracking-wide bg-emerald-50 inline-block px-2 py-1 rounded sensitive-value" 
                                       onclick="toggleSensitiveData(this)" 
                                       title="Cliquez pour afficher">
                                        ${montant}
                                    </p>
                                </div>
                            </div>
                        `;
        });
    } catch (e) {
        console.warn("Erreur bulletins:", e);
        container.innerHTML = '<p class="col-span-full text-[10px] text-red-400 italic text-center py-4">Erreur de chargement</p>';
    }
}


function exportToCSV() {
    if (employees.length === 0) {
        return Swal.fire('Erreur', 'Aucune donnée à exporter', 'warning');
    }

    // 1. Définir les colonnes à exporter
    const headers = ["Matricule", "Nom Complet", "Poste", "Departement", "Statut", "Email", "Telephone", "Date Embauche", "Duree Contrat"];
    
    // 2. Préparer les données
    let csvContent = headers.join(";") + "\n"; // Utilisation du point-virgule pour Excel France

    employees.forEach(e => {
        const row = [
            e.id,         // Index 0
            e.nom,        // Index 1
            e.poste,      // Index 2
            e.dept,       // Index 3
            e.statut,     // Index 4
            e.email || "",// Index 5
            e.telephone || "", // Index 6 (Le coupable)
            e.date || "", // Index 7
            e.limit       // Index 8
        ];
        
        // Nettoyage des données et formatage forcé pour Excel
        const cleanRow = row.map((val, index) => {
            let str = String(val).replace(/"/g, '""'); // Gère les guillemets internes
            
            // PROTECTION : Si c'est le Matricule (0) ou le Téléphone (6)
            // On ajoute \t (tabulation) au début pour forcer Excel à lire du TEXTE
            if (index === 0 || index === 6) {
                return `"\t${str}"`; 
            }
            
            return `"${str}"`;
        });
        csvContent += cleanRow.join(";") + "\n";
    });

    // 3. Créer le fichier et le télécharger
    // Utilisation du BOM UTF-8 (\ufeff) pour les accents et du Blob pour le binaire
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    const dateStr = new Date().toLocaleDateString('fr-FR').replace(/\//g, "-");
    
    link.setAttribute("href", url);
    link.setAttribute("download", `Rapport_Effectif_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    const Toast = Swal.mixin({toast: true, position: 'top-end', showConfirmButton: false, timer: 3000});
    Toast.fire({ icon: 'success', title: 'Exportation réussie !' });
}

    // 1. Initialisation (au chargement)
    function initDarkMode() {
        const isDark = localStorage.getItem('sirh_dark_mode') === 'true';
        if (isDark) {
            document.body.classList.add('dark-mode');
            updateDarkIcon(true);
        }
    }

    // 2. Basculement
    function toggleDarkMode() {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('sirh_dark_mode', isDark);
        updateDarkIcon(isDark);
        
        // Feedback sonore léger ou vibration
        if (navigator.vibrate) navigator.vibrate(50);
    }

    // 3. Mise à jour de l'icône
    function updateDarkIcon(isDark) {
        const icon = document.getElementById('dark-icon');
        const btn = document.querySelector('.dark-toggle-btn');
        if (isDark) {
            icon.classList.replace('fa-moon', 'fa-sun');
            btn.classList.replace('bg-slate-100', 'bg-slate-800');
            btn.classList.replace('text-slate-600', 'text-yellow-400');
        } else {
            icon.classList.replace('fa-sun', 'fa-moon');
            btn.classList.replace('bg-slate-800', 'bg-slate-100');
            btn.classList.replace('text-yellow-400', 'text-slate-600');
        }
    }





    // Fonction magique pour décider si on écrit en blanc ou en noir sur une couleur
    function getContrastColor(hexColor) {
        // Nettoyer le hex
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        // Calcul de la luminosité (formule standard)
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? '#1e293b' : '#ffffff'; // Si clair -> texte noir, si sombre -> texte blanc
    }

// 
function applyBranding() {
    const theme = SIRH_CONFIG.theme;

    // 1. Calcul des couleurs de texte intelligentes
    const textOnPrimary = getContrastColor(theme.primary);
    const textOnAccent = getContrastColor(theme.accent);

    // 2. Application des variables CSS
    const root = document.documentElement;
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--font-main', theme.fontFamily);
    root.style.setProperty('--base-size', theme.baseFontSize);
    root.style.setProperty('--text-on-primary', textOnPrimary);
    root.style.setProperty('--text-on-accent', textOnAccent);

    // 3. Sidebar : Nom et Logo
    const nameEls = document.querySelectorAll('.company-name-display');
    nameEls.forEach(el => {
        el.innerText = SIRH_CONFIG.company.name;
        el.style.color = textOnPrimary; // Le nom s'adapte à la couleur de fond
    });

    const logoSidebar = document.querySelector('.app-logo-display');
    if(logoSidebar) logoSidebar.src = SIRH_CONFIG.company.logo;

    // 4. Écran de Connexion
    const loginTitle = document.querySelector('#login-screen h1');
    if(loginTitle) loginTitle.innerText = SIRH_CONFIG.company.name;
    
    const loginIconContainer = document.querySelector('#login-screen .inline-flex');
    if(loginIconContainer && SIRH_CONFIG.company.logo) {
        loginIconContainer.innerHTML = `<img src="${SIRH_CONFIG.company.logo}" class="w-14 h-14 object-contain">`;
    }

    // 5. Titre du navigateur
    document.title = SIRH_CONFIG.company.name + " | Portail RH";

    console.log(`🎨 Branding intelligent appliqué (${textOnAccent} sur ${theme.accent})`);
}





let deferredPrompt; // Correction : retrait du "/" parasite
    const installBtn = document.getElementById('install-button');

    // On vérifie si le bouton existe dans le DOM avant d'ajouter les écouteurs
    if (installBtn) {
        window.addEventListener('beforeinstallprompt', (e) => {
            // Empêche le navigateur d'afficher la bannière automatique par défaut
            e.preventDefault();
            // On sauvegarde l'événement pour le déclencher plus tard au clic
            deferredPrompt = e;
            // On révèle le bouton d'installation personnalisé
            installBtn.classList.remove('hidden');

            // On vide les anciens événements pour éviter les doublons si l'event se déclenche plusieurs fois
            installBtn.onclick = async () => {
                if (deferredPrompt) {
                    // Affiche le pop-up système d'installation
                    deferredPrompt.prompt();
                    // Attend le choix de l'utilisateur
                    const { outcome } = await deferredPrompt.userChoice;
                    console.log(`Réponse de l'utilisateur à l'installation : ${outcome}`);
                    
                    // On cache le bouton peu importe le choix (accepté ou refusé)
                    installBtn.classList.add('hidden');
                    // On nettoie la variable pour ne pas réutiliser un prompt expiré
                    deferredPrompt = null;
                }
            };
        });

        // Si l'application est déjà installée ou vient d'être installée
        window.addEventListener('appinstalled', (evt) => {
            console.log('Application installée avec succès !');
            installBtn.classList.add('hidden');
            deferredPrompt = null;
        });
    }



    // Variable temporaire pour stocker les données du rapport affiché
    let currentReportData = [];

   function downloadReportCSV(period = 'monthly') {
    if (!currentReportData || currentReportData.length === 0) {
        return Swal.fire('Erreur', 'Aucune donnée à exporter.', 'warning');
    }

    let headers = [];
    let csvContent = "";

    if (period === 'today') {
        // --- EN-TÊTES POUR LE RAPPORT DU JOUR (LIVE) ---
        headers = ["Employé", "Matricule", "Statut", "Arrivée", "Durée Présence", "Zone"];
        csvContent = headers.join(";") + "\n";
        
        currentReportData.forEach(row => {
            const clean = (text) => text ? String(text).replace(/;/g, ",").replace(/\n/g, " ") : "---";
            
            // Correction ici : On utilise 'arrivee' au lieu de 'heure_arrivee'
            // Et on ajoute une sécurité pour éviter le crash si la valeur est vide
            let hAffiche = row.arrivee || "---";
            if (hAffiche && typeof hAffiche === 'string' && hAffiche.match(/(\d{2}:\d{2})/)) {
                hAffiche = hAffiche.match(/(\d{2}:\d{2})/)[1];
            }

            const rowData = [
                clean(row.nom),
                clean(row.matricule),
                clean(row.statut),
                clean(hAffiche),
                clean(row.duree),
                clean(row.zone)
            ];
            const cleanRow = rowData.map(val => `"${String(val).replace(/"/g, '""')}"`);
            csvContent += cleanRow.join(";") + "\n";
        });
        
    } else {
        // --- EN-TÊTES POUR LE RAPPORT MENSUEL (CUMUL) ---
        headers = ["Mois/Année", "Employé", "Jours Présence", "Total Heures", "Statut"];
        csvContent = headers.join(";") + "\n";

        currentReportData.forEach(row => {
            const clean = (text) => text ? String(text).replace(/;/g, ",").replace(/\n/g, " ") : "---";
            
            const rowData = [
                clean(row.mois),
                clean(row.nom),
                clean(row.jours),
                clean(row.heures), 
                "Validé"
            ];
            const cleanRow = rowData.map(val => `"${String(val).replace(/"/g, '""')}"`);
            csvContent += cleanRow.join(";") + "\n";
        });
    }

    // --- CRÉATION ET TÉLÉCHARGEMENT DU FICHIER ---
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    const dateStr = new Date().toLocaleDateString('fr-FR').replace(/\//g, "-");
    const fileName = period === 'today' ? `Presence_Live_${dateStr}.csv` : `Presence_Mensuelle_${dateStr}.csv`;
    
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    const Toast = Swal.mixin({toast: true, position: 'top-end', showConfirmButton: false, timer: 3000});
    Toast.fire({ icon: 'success', title: 'Exportation réussie !' });
}

// CONFIGURATION DES LIENS DU FORMULAIRE
const AIRTABLE_FORM_PUBLIC_LINK = "https://dom4002.github.io/recrutement_page/?shared=1&hdob=0&hlm=0&hdip=0&hid=0"; // Remplacez par votre lien de partage
const AIRTABLE_FORM_EDIT_LINK = "https://dom4002.github.io/recrutement_page/"; // Remplacez par le lien de votre vue formulaire sur Airtable

// Fonction pour copier le lien public
function copyFormLink() {
    navigator.clipboard.writeText(AIRTABLE_FORM_PUBLIC_LINK).then(() => {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
        
        Toast.fire({
            icon: 'success',
            title: 'Lien copié !',
            text: 'Vous pouvez maintenant l\'envoyer au candidat.'
        });
    }).catch(err => {
        Swal.fire('Erreur', 'Impossible de copier le lien automatiquement.', 'error');
    });
}

// Fonction pour ouvrir l'éditeur Airtable
function openFormEditor() {
    Swal.fire({
        title: 'Modifier le formulaire ?',
        text: "Vous allez être redirigé vers l'interface de modification d'Airtable.",
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Y aller',
        cancelButtonText: 'Annuler',
        confirmButtonColor: '#0f172a'
    }).then((result) => {
        if (result.isConfirmed) {
            window.open(AIRTABLE_FORM_EDIT_LINK, '_blank');
        }
    });
}



async function downloadHtmlAsPdf(url, title) {
        Swal.fire({
            title: 'Génération du PDF...',
            text: 'Veuillez patienter pendant la mise en page',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        try {
            // 1. Récupérer le contenu HTML du contrat
            const response = await fetch(url);
            const htmlSource = await response.text();

            // 2. Configuration optimisée pour html2pdf
            const opt = {
                margin:       [10, 10, 10, 10], // Marges en mm
                filename:     `${title || 'Contrat'}.pdf`,
                image:        { type: 'jpeg', quality: 1 },
                html2canvas:  { 
                    scale: 2, 
                    useCORS: true, // Crucial pour charger la signature et les images
                    letterRendering: true,
                    allowTaint: true,
                    logging: false
                },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            // 3. Exécution directe sur le texte source
            // On ne passe plus par un élément du DOM, on donne le HTML directement
            await html2pdf().set(opt).from(htmlSource).save();
            
            Swal.close();
        } catch (e) {
            console.error("Erreur génération PDF:", e);
            Swal.fire('Erreur', 'Impossible de générer le fichier PDF.', 'error');
        }
    }



function calculateRow(index) {
    const base = parseInt(document.getElementById(`base-${index}`).value) || 0;
    const prime = parseInt(document.getElementById(`prime-${index}`).value) || 0;
    const tax = parseInt(document.getElementById(`tax-${index}`).value) || 0;
    
    const net = base + prime - tax;
    const display = document.getElementById(`net-${index}`);
    
    // Formatage pro (1 500 000 CFA)
    const formattedNet = new Intl.NumberFormat('fr-FR').format(net) + " CFA";
    
    display.innerText = formattedNet;
    
    // On met à jour les données cachées pour l'envoi final
    display.dataset.net = net;
    display.dataset.base = base;
    display.dataset.prime = prime;
    display.dataset.tax = tax;
}

 




// --- CHARGEMENT DYNAMIQUE AVEC MULTI-FILTRES (SÉCURISÉ) ---
async function loadAccountingView() {
    const body = document.getElementById('accounting-table-body');
    if (!body) return;

    // 0. Charger les taux fiscaux si pas encore fait
    if (typeof fetchPayrollConstants === 'function' && Object.keys(payrollConstants).length === 0) {
        await fetchPayrollConstants();
    }

    // 1. Récupération des valeurs de TOUS les filtres
    const filters = {
        type: document.getElementById('filter-accounting-type').value,
        dept: document.getElementById('filter-accounting-dept').value,
        status: document.getElementById('filter-accounting-status').value,
        role: document.getElementById('filter-accounting-role') ? document.getElementById('filter-accounting-role').value : 'all', 
        agent: currentUser.nom
    };

    body.innerHTML = '<tr><td colspan="6" class="p-12 text-center"><i class="fa-solid fa-circle-notch fa-spin text-blue-600 text-3xl"></i><p class="text-[10px] font-black text-slate-400 uppercase mt-4">Filtrage des données en cours...</p></td></tr>';

    try {
        // 2. Construction de l'URL de recherche
        let url = `${SIRH_CONFIG.apiBaseUrl}/read?limit=1000&agent=${encodeURIComponent(filters.agent)}`;
        
        if (filters.type !== 'all') url += `&type=${filters.type}`;
        if (filters.dept !== 'all') url += `&dept=${encodeURIComponent(filters.dept)}`;
        if (filters.status !== 'all') url += `&status=${filters.status}`;
        if (filters.role !== 'all') url += `&role=${encodeURIComponent(filters.role)}`;


        const r = await secureFetch(url);
        const result = await r.json();
        const employeesToPay = result.data || [];

        body.innerHTML = '';
        if (employeesToPay.length === 0) {
            body.innerHTML = '<tr><td colspan="6" class="p-20 text-center text-slate-300 italic">Aucun collaborateur ne correspond à ces critères.</td></tr>';
            return;
        }

        // 3. Rendu du tableau (AVEC SÉCURITÉ ANTI-CRASH)
        employeesToPay.forEach((emp, index) => {
            // SÉCURITÉ : On s'assure que le nom et le matricule existent toujours
            const safeNom = emp.nom || "Inconnu";
            const safeMatricule = emp.matricule || "N/A";
            const safePoste = emp.poste || "Non défini";
            const initial = safeNom !== "Inconnu" ? safeNom.charAt(0).toUpperCase() : "?";
            
            // Chaîne de recherche sécurisée
            const searchString = `${safeNom.toLowerCase()} ${safeMatricule.toLowerCase()}`;

            // Calcul des indemnités
            const totalIndemnites = (parseFloat(emp.indemnite_transport) || 0) + (parseFloat(emp.indemnite_logement) || 0);

            body.innerHTML += `
                <tr class="hover:bg-blue-50/50 transition-all accounting-row animate-fadeIn" 
                    data-search="${searchString}">
                    
                    <!-- 1. COLLABORATEUR -->
                    <td class="px-6 py-5">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">${initial}</div>
                            <div>
                                <div class="font-black text-slate-800 text-[11px] uppercase">${safeNom}</div>
                                <div class="text-[9px] text-slate-400 font-bold">${safeMatricule} • ${safePoste}</div>
                            </div>
                        </div>
                    </td>

                    <!-- 2. BASE (MODIFIABLE) -->
                    <td class="px-4 py-5 text-center">
                        <input type="number" oninput="calculateRow(${index})" id="base-${index}" 
                               class="w-full p-2 bg-slate-50 border-none rounded-xl text-center font-black text-xs focus:ring-2 focus:ring-blue-500" 
                               value="${emp.salaire_brut_fixe || 0}">
                    </td>

                    <!-- 3. INDEMNITÉS FIXES -->
                    <td class="px-4 py-5 text-center">
                        <div class="bg-indigo-50 border border-indigo-100 rounded-xl py-2 shadow-sm">
                            <span id="indem-constante-${index}" class="text-indigo-700 font-black text-xs">${totalIndemnites}</span>
                            <p class="text-[7px] text-indigo-400 font-bold uppercase tracking-tighter">Fixe (Transp+Log)</p>
                        </div>
                    </td>
                    
                    <!-- 4. PRIMES VARIABLES -->
                    <td class="px-4 py-5 text-center">
                        <input type="number" oninput="calculateRow(${index})" id="prime-${index}" 
                               class="w-full p-2 bg-emerald-50 border-none rounded-xl text-center font-black text-xs text-emerald-600 focus:ring-2 focus:ring-emerald-500" 
                               value="0">
                    </td>

                    <!-- 5. RETENUES -->
                    <td class="px-4 py-5 text-center">
                        <input type="number" oninput="calculateRow(${index})" id="tax-${index}" 
                               class="w-full p-2 bg-red-50 border-none rounded-xl text-center font-black text-xs text-red-600 focus:ring-2 focus:ring-red-500" 
                               value="0">
                    </td>

                    <!-- 6. NET À PAYER -->
                    <td class="px-6 py-5 text-right">
                        <div class="text-sm font-black text-blue-600 sensitive-value" 
                             onclick="toggleSensitiveData(this)" 
                             id="net-${index}" 
                             data-id="${emp.id}" 
                             data-nom="${safeNom}" 
                             data-poste="${safePoste}" 
                             data-matricule="${safeMatricule}">0 CFA</div>
                    </td>
                </tr>`;
        });

        // 4. Calcul immédiat
        employeesToPay.forEach((_, i) => calculateRow(i));

    } catch (e) {
        console.error("Erreur de rendu paie:", e);
        body.innerHTML = '<tr><td colspan="6" class="p-10 text-center text-red-500 font-bold uppercase text-xs">Erreur d\'affichage des données</td></tr>';
    }
}


// --- RESET DES FILTRES ---
function resetAccountingFilters() {
    document.getElementById('search-accounting').value = "";
    document.getElementById('filter-accounting-type').value = "all";
    document.getElementById('filter-accounting-status').value = "Actif";
    document.getElementById('filter-accounting-dept').value = "all";
    if(document.getElementById('filter-accounting-role')) document.getElementById('filter-accounting-role').value = "all";
    loadAccountingView();
}



// --- RECHERCHE LOCALE INSTANTANÉE ---
function filterAccountingTableLocally() {
    const term = document.getElementById('search-accounting').value.toLowerCase();
    document.querySelectorAll('.accounting-row').forEach(row => {
        const text = row.getAttribute('data-search');
        row.style.display = text.includes(term) ? '' : 'none';
    });
}

// Fonction de calcul en temps réel
function calculateRow(index) {
    // 1. Récupération des valeurs de base
    const base = parseInt(document.getElementById(`base-${index}`).value) || 0;
    
    // 2. Récupération des indemnités fixes (Somme transport + logement affichée dans le tableau)
    const indemnitesFixes = parseInt(document.getElementById(`indem-constante-${index}`).innerText) || 0;
    
    // 3. AUTOMATISATION DES RETENUES (Stratégie Étape 4)
    // On récupère les taux chargés depuis la table 'salaries_config'
    const rateCNSS = payrollConstants['CNSS_EMPLOYEE_RATE'] || 0;
    const rateIRPP = payrollConstants['IRPP_BASE_RATE'] || 0;
    const totalTaxRate = rateCNSS + rateIRPP;

    const inputTax = document.getElementById(`tax-${index}`);

    // On calcule automatiquement la retenue seulement si le champ est à 0 
    // ou s'il est marqué comme étant en mode "auto"
    if (inputTax && (inputTax.value === "0" || inputTax.dataset.auto === "true")) {
        const estimationRetenues = Math.round(base * (totalTaxRate / 100));
        inputTax.value = estimationRetenues;
        inputTax.dataset.auto = "true"; // On garde la trace que c'est un calcul auto
    }

    // 4. Calcul final avec les primes variables saisies
    const primeVariable = parseInt(document.getElementById(`prime-${index}`).value) || 0;
    const retenues = parseInt(inputTax.value) || 0;
    
    const net = base + indemnitesFixes + primeVariable - retenues;
    
    // 5. Mise à jour visuelle (Format Premium)
    const display = document.getElementById(`net-${index}`);
    display.innerText = new Intl.NumberFormat('fr-FR').format(net) + " CFA";
    
    // 6. Stockage des données pour l'envoi final au serveur (Publish)
    display.dataset.net = net;
    display.dataset.base = base;
    display.dataset.prime = primeVariable;
    display.dataset.tax = retenues;
}




// Tout en haut de app.js
let payrollConstants = {};

// Fonction pour charger les taux
async function fetchPayrollConstants() {
    try {
        const r = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/read-config-salaries`); // On va créer cette route
        const data = await r.json();
        
        // On transforme le tableau en objet facile à lire : { "CNSS_EMPLOYEE_RATE": 3.6, ... }
        data.forEach(item => {
            payrollConstants[item.key_code] = item.value_number;
        });
        console.log("📊 Constantes de paie chargées :", payrollConstants);
    } catch (e) { console.error("Erreur constantes paie", e); }
}



async function generateAllPay() {
    const mois = document.getElementById('pay-month').value;
    const annee = document.getElementById('pay-year').value;
    const records = [];

    document.querySelectorAll('[id^="net-"]').forEach(el => {
        const index = el.id.split('-')[1]; // On récupère l'index de la ligne
        const netValue = parseInt(el.dataset.net) || 0;

        if (netValue > 0) {
            // On récupère les valeurs directement depuis les champs du tableau
            const baseVal = parseInt(document.getElementById(`base-${index}`).value) || 0;
            const indemVal = parseInt(document.getElementById(`indem-constante-${index}`).innerText) || 0;
            const primeVal = parseInt(document.getElementById(`prime-${index}`).value) || 0;
            const taxVal = parseInt(document.getElementById(`tax-${index}`).value) || 0;

            records.push({
                id: el.dataset.id,
                matricule: el.dataset.matricule,
                nom: el.dataset.nom,
                poste: el.dataset.poste,
                mois: mois, 
                annee: annee,
                salaire_base: baseVal,
                indemnites_fixes: indemVal, // AJOUTÉ : Somme Transport + Logement
                primes: primeVal,
                retenues: taxVal,
                salaire_net: netValue,
                taux_cnss: payrollConstants['CNSS_EMPLOYEE_RATE'] || 0,
                taux_irpp: payrollConstants['IRPP_BASE_RATE'] || 0
            });
        }
    });

    if (records.length === 0) return Swal.fire('Oups', 'Saisissez au moins un salaire.', 'warning');

    Swal.fire({ title: 'Édition en cours...', text: `Publication de ${records.length} bulletins`, allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const response = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/process-payroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payrollRecords: records, agent: currentUser.nom })
    });

    if (response.ok) {
        Swal.fire('Terminé !', 'Les bulletins sont maintenant dans les espaces personnels.', 'success');
        switchView('dash');
    }
}



// --- FONCTION POUR SUPPRIMER UN MODÈLE DE CONTRAT ---
async function deleteTemplate(id) {
    const confirm = await Swal.fire({
        title: 'Archiver ce modèle ?',
        text: "Il ne sera plus proposé pour les futurs contrats, mais restera conservé dans l'historique pour les employés actuels.",
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#0f172a',
        confirmButtonText: 'Oui, archiver',
        cancelButtonText: 'Annuler'
    });

    if (confirm.isConfirmed) {
        Swal.fire({ title: 'Suppression...', didOpen: () => Swal.showLoading() });

        try {
            const response = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/delete-template`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            });

            if (response.ok) {
                Swal.fire('Supprimé !', 'Le modèle a été retiré.', 'success');
                fetchTemplates(); // Rafraîchit le tableau
            } else {
                throw new Error("Erreur lors de la suppression sur le serveur.");
            }
        } catch (e) {
            console.error(e);
            Swal.fire('Erreur', e.message, 'error');
        }
    }
}


// 1. La fonction qui ouvre ou ferme le bloc quand on clique
function toggleWidget(widgetId) {
    const content = document.getElementById(widgetId + '-content');
    const icon = document.getElementById(widgetId + '-icon');

    // On bascule la classe 'hidden' (caché)
    const isNowHidden = content.classList.toggle('hidden');
    
    // On change l'icône (haut vers bas)
    if (isNowHidden) {
        icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
        localStorage.setItem('pref_' + widgetId, 'closed');
    } else {
        icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
        localStorage.setItem('pref_' + widgetId, 'open');
    }
}



function applyWidgetPreferences() {
    // On ajoute les IDs du menu (commençant par m-) à la liste
    const widgets = [
        'w-stats', 'w-live', 'w-charts', 'w-alerts', 'w-leaves', // Widgets Dashboard
        'm-perso', 'm-gestion', 'm-admin' // Sections Menu
    ];

    widgets.forEach(id => {
        const state = localStorage.getItem(`pref_${id}`);
        const content = document.getElementById(id + '-content');
        const icon = document.getElementById(id + '-icon');
        
        if (state === 'closed' && content && icon) {
            content.classList.add('hidden');
            icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
        }
    });
}



// --- LOGIQUE CHAT ---
let chatPolling = null;

// 1. Charger les messages
async function fetchMessages() {
    const container = document.getElementById('chat-container');
    if(!container) return;

    try {
        const response = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/read-messages?agent=${encodeURIComponent(currentUser.nom)}`);
        const messages = await response.json();

        // Petite optimisation : si le nombre de messages n'a pas changé, on ne redessine pas tout
        if (container.dataset.msgCount == messages.length) return;
        container.dataset.msgCount = messages.length;

        container.innerHTML = '';
        let lastDate = null;

        messages.forEach(msg => {
            // Gestion de la date (Afficher "Aujourd'hui" ou la date si ça change)
            const msgDate = new Date(msg.date);
            const dateStr = msgDate.toLocaleDateString();
            if (dateStr !== lastDate) {
                container.innerHTML += `<div class="flex justify-center my-4"><span class="bg-slate-100 text-slate-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">${dateStr}</span></div>`;
                lastDate = dateStr;
            }

            const isMe = (String(msg.sender_id) === String(currentUser.id));
            const time = msgDate.toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
            
            // Design différent pour MOI (Droite/Bleu) et les AUTRES (Gauche/Gris)
            const align = isMe ? 'justify-end' : 'justify-start';
            const bg = isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-600 rounded-tl-none';
            const metaAlign = isMe ? 'text-right' : 'text-left';


       
            let mediaHtml = '';
            if (msg.file && msg.file !== 'null' && msg.file !== '') {
                const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(msg.file);
                
                if (isImg) {
                    mediaHtml = `
                        <div class="mt-2 rounded-xl overflow-hidden border border-black/5 shadow-sm bg-white">
                            <img src="${msg.file}" class="w-full h-auto max-h-64 object-cover cursor-pointer hover:opacity-90 transition-all" onclick="window.open('${msg.file}', '_blank')">
                        </div>`;
                } else {
                    // Design pour les fichiers (PDF, DOC, etc.)
                    mediaHtml = `
                        <a href="${msg.file}" target="_blank" class="flex items-center gap-3 mt-2 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-all group">
                            <div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-blue-600 group-hover:scale-110 transition-transform">
                                <i class="fa-solid fa-file-lines text-lg"></i>
                            </div>
                            <div class="flex-1 overflow-hidden">
                                <p class="text-[11px] font-bold text-slate-700 truncate">${msg.file.split('/').pop().substring(13)}</p>
                                <p class="text-[9px] text-blue-500 font-black uppercase">Cliquez pour télécharger</p>
                            </div>
                        </a>`;
                }
            }



            container.innerHTML += `
                <div class="flex ${align} gap-3 mb-2 animate-fadeIn">
                    ${!isMe ? `<div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-200 shadow-sm">${msg.sender_name ? msg.sender_name.charAt(0) : '?'}</div>` : ''}
                    
                    <div class="max-w-[75%]">
                        ${!isMe ? `<p class="text-[9px] font-bold text-slate-400 ml-1 mb-1">${msg.sender_name || 'Inconnu'}</p>` : ''}
                        
                        <div class="p-4 rounded-2xl shadow-sm ${bg} text-sm font-medium leading-relaxed">
                            ${msg.message}
                            ${mediaHtml}
                        </div>
                        <p class="text-[9px] text-slate-300 mt-1 ${metaAlign} opacity-70">${time}</p>
                    </div>
                </div>
            `;
        });

        // Scroll tout en bas
        container.scrollTop = container.scrollHeight;

    } catch (e) { console.error("Chat Error", e); }
}



async function sendMessage(e) {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const fileInput = document.getElementById('chat-file');
    const btn = document.getElementById('btn-send-chat');

    const txt = input.value.trim();
    const hasFile = fileInput.files.length > 0;

    if (!txt && !hasFile) return; 

    btn.disabled = true;
    
    const fd = new FormData();
    fd.append('sender_id', currentUser.id);
    fd.append('agent', currentUser.nom);
    fd.append('message', txt);
    
if (hasFile) {
        // --- NOUVEAU : COMPRESSION POUR LE CHAT ---
        Swal.update({ text: 'Compression du fichier en cours...' });
        const compressedChatFile = await compressImage(fileInput.files[0]);
        fd.append('chat_file', compressedChatFile); 
    }

    try {
        const response = await fetch(`${SIRH_CONFIG.apiBaseUrl}/send-message`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('sirh_token')}` },
            body: fd
        });

        if (response.ok) {
            input.value = '';
            cancelFile(); // Vide l'aperçu et l'input file
            fetchMessages(); 
        }
    } catch (err) {
        console.error("Erreur envoi chat:", err);
    } finally {
        btn.disabled = false;
        input.focus();
    }
}




document.getElementById('chat-file').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const maxSize = 5 * 1024 * 1024; // LIMITE : 5 Mo

    if (file) {
        // 1. Vérification de la taille
        if (file.size > maxSize) {
            Swal.fire({
                icon: 'warning',
                title: 'Fichier trop lourd',
                text: 'La taille maximale autorisée est de 5 Mo.',
                confirmButtonColor: '#2563eb'
            });
            this.value = ""; // On annule la sélection
            return;
        }

        // 2. Gestion de l'aperçu visuel
        const previewImg = document.getElementById('chat-img-preview');
        const fileName = document.getElementById('chat-file-name');
        const container = document.getElementById('chat-preview-container');

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => { previewImg.src = event.target.result; };
            reader.readAsDataURL(file);
        } else {
            // Icône générique pour les documents (PDF, Excel, etc.)
            previewImg.src = "https://cdn-icons-png.flaticon.com/512/2991/2991112.png";
        }

        fileName.innerText = file.name;
        container.classList.remove('hidden');
        document.getElementById('file-indicator').classList.remove('hidden');
    }
});



// 2. Annuler le fichier si on s'est trompé
function cancelFile() {
    document.getElementById('chat-file').value = ""; // Vide l'input
    document.getElementById('chat-preview-container').classList.add('hidden'); // Cache la boîte
    document.getElementById('file-indicator').classList.add('hidden'); // Cache le petit point bleu
}



function closeEditor() {
    document.getElementById('editor-modal').classList.add('hidden');
}






function initChatRealtime() {
    if (chatSubscription) return; // On n'ouvre pas deux fois la connexion

    console.log("📡 Connexion au Chat Realtime...");

    chatSubscription = supabaseClient
        .channel('public:messages')
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages' 
        }, (payload) => {
            console.log('✨ Nouveau message reçu :', payload.new);
            
            // On recharge les messages pour afficher le nouveau
            fetchMessages(); 

            // Jouer le son si ce n'est pas nous l'expéditeur
            if (String(payload.new.sender_id) !== String(currentUser.id)) {
                NOTIF_SOUND.play().catch(() => {});
            }
        })
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('✅ Chat en direct activé !');
            }
        });
}





function applyPermissionsUI(perms) {
    const safePerms = perms || {}; 
    console.log("🛠️ Application des permissions UI (Mode Suppression Absolue)...", safePerms);

    // ÉTAPE 1 : Supprimer physiquement les éléments non autorisés du DOM
    // On ne se contente plus de cacher, on détruit l'élément HTML.
    document.querySelectorAll('[data-perm]').forEach(el => {
        const key = el.getAttribute('data-perm');
        
        if (safePerms[key] === true) {
            // L'utilisateur a le droit : on s'assure que c'est visible
            el.style.display = ''; 
            el.classList.remove('hidden'); 
        } else {
            // L'utilisateur n'a pas le droit : ON DÉTRUIT TOTALEMENT L'ÉLÉMENT !
            el.remove(); 
        }
    });

    // ÉTAPE 2 : Nettoyer les groupes de menus (menu-group) qui sont devenus vides
    document.querySelectorAll('.menu-group').forEach(group => {
        // On cible la zone qui contient les boutons (ex: m-perso-content)
        const contentArea = group.querySelector('[id$="-content"]');
        
        if (contentArea) {
            // Comme on a fait "el.remove()" plus haut, il suffit de compter les boutons restants
            // On cherche tous les éléments cliquables restants dans ce groupe
            const remainingItems = contentArea.querySelectorAll('.nav-btn, button, a');
            
            if (remainingItems.length > 0) {
                group.style.display = ''; // Il reste des autorisations, on laisse le titre du groupe
            } else {
                group.remove(); // Le groupe est totalement vide, ON LE DÉTRUIT AUSSI !
            }
        }
    });
}

// Garde bien ta détection de Pull-to-refresh juste en dessous
let touchStart = 0;
document.addEventListener('touchstart', e => touchStart = e.touches[0].pageY);
document.addEventListener('touchend', e => {
    const touchEnd = e.changedTouches[0].pageY;
    if (window.scrollY === 0 && touchEnd > touchStart + 150) {
        if (typeof PremiumUI !== 'undefined') PremiumUI.vibrate('click');
        refreshAllData(true);
    }
});


// --- IMPORT DE MASSE (CSV) ---

function triggerCSVImport() {
    document.getElementById('csv-file-input').click();
}


// --- NOUVELLE GESTION DES IMPORTS/EXPORTS POUR LES LIEUX ---

// 1. Télécharger le Modèle
function downloadLocationsTemplate() {
    // Ce sont les en-têtes exacts que le système cherchera
    const headers =["Nom_Lieu", "Latitude", "Longitude", "Adresse", "Type"];
    CSVManager.downloadTemplate(headers, "Modele_Import_Lieux.csv");
}

// 2. Exporter les lieux existants
async function exportLocations() {
    try {
        const r = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/list-mobile-locations`);
        const locs = await r.json();
        
        const cleanData = locs.map(l => ({
            "Nom_Lieu": l.name,
            "Latitude": l.latitude,
            "Longitude": l.longitude,
            "Adresse": l.address || "",
            "Type": l.type_location || ""
        }));

        CSVManager.exportData(cleanData, `Export_Lieux_${new Date().toISOString().split('T')[0]}.csv`);
    } catch(e) {
        Swal.fire('Erreur', "Impossible d'exporter les données", 'error');
    }
}

// 3. Gérer l'import du fichier
async function handleCSVFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    Swal.fire({ title: 'Analyse en cours...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
        // On exige uniquement que ces 3 colonnes soient présentes, peu importe leur position !
        const requiredColumns =["nom_lieu", "latitude", "longitude"];
        
        // Le Moteur CSV fait le sale boulot
        const parsedData = await CSVManager.parseAndValidate(file, requiredColumns);

        // Mapping propre pour envoyer au serveur
        const locationsToInsert = parsedData.map(row => ({
            name: row['nom_lieu'],
            latitude: parseFloat(row['latitude']?.replace(',', '.')), // Gère la virgule française
            longitude: parseFloat(row['longitude']?.replace(',', '.')),
            address: row['adresse'] || '',
            type_location: row['type'] || 'PHARMACIE',
            radius: 50,
            is_active: true
        })).filter(loc => !isNaN(loc.latitude) && !isNaN(loc.longitude)); // On vire les lignes où les GPS sont cassés

        if (locationsToInsert.length === 0) {
            throw new Error("Aucune donnée GPS valide trouvée dans le fichier.");
        }

        // Envoi au backend
        const response = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/import-locations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ locations: locationsToInsert })
        });

        if (response.ok) {
            Swal.fire('Succès !', `${locationsToInsert.length} lieux importés.`, 'success');
            fetchMobileLocations(); // Rafraîchit l'écran
        } else {
            const err = await response.json();
            throw new Error(err.error);
        }

    } catch (errMsg) {
        Swal.fire('Échec de l\'import', errMsg, 'error');
    } finally {
        event.target.value = ""; // Reset l'input file pour pouvoir ré-uploader le même fichier
    }
}

async function openDailyReportModal() {
    // On ajoute le champ pour la photo dans le HTML de l'alerte
    const { value: formValues } = await Swal.fire({
        title: 'Bilan de la journée',
        html: `
            <p class="text-[10px] text-slate-400 uppercase font-black mb-2">Résumé global de vos activités</p>


            <!-- CONTENEUR RELATIF -->
            <div class="relative">
                <textarea id="daily-summary" class="swal2-textarea" style="height: 100px; margin-top:0;" placeholder="Nombre de visites, difficultés..."></textarea>
                
                <!-- LE MICRO -->
                <button type="button" onclick="toggleDictation('daily-summary', this)" 
                    class="absolute bottom-3 right-3 p-2 rounded-full bg-white border border-slate-200 text-slate-400 shadow-sm hover:text-blue-600 transition-all z-10">
                    <i class="fa-solid fa-microphone"></i>
                </button>
            </div>
            
            <!-- NOUVEAU : Zone Photo -->
            <div class="my-4 text-left">
                <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">Photo du Rapport / Cahier (Optionnel)</label>
                <input type="file" id="daily-photo" class="block w-full text-xs text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-xs file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                " accept="image/*,application/pdf">
            </div>

            <div class="flex items-center gap-2 mt-4 p-3 bg-orange-50 rounded-xl border border-orange-100">
                <input type="checkbox" id="daily-restock" class="w-5 h-5 text-orange-600 rounded focus:ring-orange-500">
                <label for="daily-restock" class="text-xs font-bold text-orange-800">Besoin de stock / échantillons ?</label>
            </div>
        `,
        confirmButtonText: 'Envoyer le rapport',
        showCancelButton: true,
        confirmButtonColor: '#0f172a',
        cancelButtonText: 'Fermer',
        cancelButtonColor: '#94a3b8', 
        reverseButtons: true, 
        preConfirm: () => {
            return {
                summary: document.getElementById('daily-summary').value,
                needs_restock: document.getElementById('daily-restock').checked,
                photo: document.getElementById('daily-photo').files[0] // On récupère le fichier
            }
        }
    });

    if (formValues) {
        Swal.fire({ title: 'Envoi du rapport...', text: 'Téléversement de la photo en cours...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        
        try {
            // ON PASSE EN FORMDATA POUR ENVOYER LE FICHIER
            const fd = new FormData();
            fd.append('employee_id', currentUser.id);
            fd.append('summary', formValues.summary);
            fd.append('needs_restock', formValues.needs_restock);
            
            if (formValues.photo) {
                Swal.update({ text: 'Compression de la photo en cours...' });
                const compressedPhoto = await compressImage(formValues.photo);
                fd.append('report_doc', compressedPhoto); 
            }

            // Note: On ne met PAS de 'Content-Type': 'application/json' car c'est du FormData
            const response = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/submit-daily-report`, {
                method: 'POST',
                body: fd 
            });

            Swal.close(); 

            if (response.ok) {
                Swal.fire('Succès !', 'Votre bilan et la photo ont été transmis.', 'success');
            } else {
                throw new Error("Erreur serveur");
            }
        } catch (e) {
            Swal.close();
            console.error(e);
            Swal.fire('Erreur', "Le rapport n'a pas pu être envoyé.", 'error');
        }
    }
}


// --- LOGIQUE IMPORT CSV POUR LES SIÈGES (ZONES) ---

function triggerZonesCSVImport() {
    document.getElementById('csv-zones-input').click();
}




// ============================================================
// GESTION DES IMPORTS/EXPORTS : PRESCRIPTEURS
// ============================================================

function downloadPrescripteursTemplate() {
    const headers =["Nom_Complet", "Fonction", "Telephone"];
    CSVManager.downloadTemplate(headers, "Modele_Import_Prescripteurs.csv");
}

async function exportPrescripteurs() {
    try {
        const r = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/list-prescripteurs`);
        const data = await r.json();
        
        const cleanData = data.map(p => ({
            "Nom_Complet": p.nom_complet,
            "Fonction": p.fonction || "Médecin",
            "Telephone": p.telephone || ""
        }));

        CSVManager.exportData(cleanData, `Export_Prescripteurs_${new Date().toISOString().split('T')[0]}.csv`);
    } catch(e) { Swal.fire('Erreur', "Impossible d'exporter les données", 'error'); }
}

async function handlePrescripteursCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    Swal.fire({ title: 'Analyse en cours...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
        const requiredColumns = ["nom_complet", "fonction"];
        const parsedData = await CSVManager.parseAndValidate(file, requiredColumns);

        const dataToInsert = parsedData.map(row => ({
            nom_complet: row['nom_complet'],
            fonction: row['fonction'],
            telephone: row['telephone'] || null,
            is_active: true
        })).filter(p => p.nom_complet); // On ignore les lignes sans nom

        if (dataToInsert.length === 0) throw new Error("Aucune donnée valide trouvée.");

        const response = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/import-prescripteurs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prescripteurs: dataToInsert })
        });

        if (response.ok) {
            Swal.fire('Succès !', `${dataToInsert.length} contacts importés.`, 'success');
            fetchPrescripteursManagement();
        } else {
            const err = await response.json();
            throw new Error(err.error);
        }
    } catch (errMsg) {
        Swal.fire('Échec de l\'import', errMsg, 'error');
    } finally {
        event.target.value = "";
    }
}

// ============================================================
// MISE A JOUR DES IMPORTS/EXPORTS : SIÈGES (ZONES)
// ============================================================

function downloadZonesTemplate() {
    const headers =["Nom_Siege", "Latitude", "Longitude", "Rayon"];
    CSVManager.downloadTemplate(headers, "Modele_Import_Sieges.csv");
}

async function exportZones() {
    try {
        const r = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/list-zones`);
        const data = await r.json();
        const cleanData = data.map(z => ({ "Nom_Siege": z.nom, "Latitude": z.latitude, "Longitude": z.longitude, "Rayon": z.rayon }));
        CSVManager.exportData(cleanData, `Export_Sieges_${new Date().toISOString().split('T')[0]}.csv`);
    } catch(e) { Swal.fire('Erreur', "Export impossible", 'error'); }
}



// --- NOUVELLE GESTION DES IMPORTS POUR LES SIÈGES (ZONES) ---
async function handleZonesCSVFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    Swal.fire({ title: 'Analyse en cours...', text: 'Validation des données...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
        // 1. Définition des colonnes strictement requises (basées sur le modèle)
        const requiredColumns =["nom_siege", "latitude", "longitude"];
        
        // 2. Le Moteur CSV fait le parsing, vérifie les colonnes et gère les erreurs
        const parsedData = await CSVManager.parseAndValidate(file, requiredColumns);

        // 3. Mapping propre avec conversion sécurisée des chiffres
        const zones = parsedData.map(row => ({
            nom: row['nom_siege'],
            latitude: parseFloat(row['latitude']?.replace(',', '.')), // Remplace la virgule FR par un point US
            longitude: parseFloat(row['longitude']?.replace(',', '.')),
            rayon: row['rayon'] ? parseInt(row['rayon']) : 100, // Rayon par défaut à 100m si vide
            actif: true
        })).filter(z => !isNaN(z.latitude) && !isNaN(z.longitude)); // On rejette silencieusement les lignes sans GPS valide

        // 4. Sécurité finale avant envoi
        if (zones.length === 0) {
            throw new Error("Aucune donnée GPS valide n'a été trouvée dans le fichier.");
        }

        // 5. Envoi au serveur
        const response = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/import-zones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ zones })
        });

        if (response.ok) {
            Swal.fire('Succès !', `${zones.length} sièges importés avec succès.`, 'success');
            fetchZones();         // Rafraîchit le tableau à l'écran
            fetchCompanyConfig(); // Met à jour le périmètre GPS global de l'app
        } else {
            const err = await response.json();
            throw new Error(err.error || "Erreur lors de l'enregistrement serveur.");
        }

    } catch (errMsg) {
        Swal.fire('Échec de l\'import', errMsg, 'error');
    } finally {
        event.target.value = ""; // Réinitialise l'input pour pouvoir cliquer à nouveau sur le même fichier
    }
}





// ============================================================
// MODULE RAPPORTS : LOGIQUE COMPLÈTE (CORRIGÉE)
// ============================================================

let currentReportTab = 'visits';
let lastAuditData = []; 
window.reportViewMode = 'list'; 

// 1. CHANGER D'ONGLET
function changeReportTab(tab) {
    currentReportTab = tab;

    document.getElementById('filter-report-name').value = ""; 
    document.getElementById('stat-report-label').classList.remove('text-blue-400');

    document.querySelectorAll('.report-tab-btn').forEach(btn => {
        btn.classList.remove('text-blue-600', 'border-blue-600');
        btn.classList.add('text-slate-400', 'border-transparent');
    });
    const activeBtn = document.getElementById('tab-' + tab);
    if(activeBtn) {
        activeBtn.classList.remove('text-slate-400', 'border-transparent');
        activeBtn.classList.add('text-blue-600', 'border-blue-600');
    }
    
    if (tab === 'audit') {
        fetchGlobalAudit();
    } else {
        fetchMobileReports();
    }
}





 

async function fetchMobileReports(page = 1) {
    const container = document.getElementById('reports-list-container');
    const counterEl = document.getElementById('stat-visites-total');
    const labelEl = document.getElementById('stat-report-label');
    const nameFilter = document.getElementById('filter-report-name')?.value.toLowerCase() || "";
    const periodFilter = document.getElementById('filter-report-date')?.value || "month";

    if (!container) return;
    
    // Détection du rôle pour afficher ou non le bouton "Archiver"
    const isChef = currentUser.role !== 'EMPLOYEE';

    reportPage = page;
    container.innerHTML = '<div class="col-span-full text-center p-10"><i class="fa-solid fa-circle-notch fa-spin text-blue-500 text-2xl"></i></div>';

    try {
        const limit = 20;
        const endpoint = currentReportTab === 'visits' ? 'read-visit-reports' : 'read-daily-reports';
        const url = `${SIRH_CONFIG.apiBaseUrl}/${endpoint}?page=${page}&limit=${limit}&name=${encodeURIComponent(nameFilter)}&period=${periodFilter}`;
        
        const r = await secureFetch(url);
        const result = await r.json();

        const data = result.data || result; 
        const totalCount = result.meta?.total || data.length;
        reportTotalPages = result.meta?.last_page || 1;

        if(labelEl) labelEl.innerText = currentReportTab === 'visits' ? "TOTAL VISITES (MOIS)" : "TOTAL BILANS JOURNALIERS";
        if(counterEl) counterEl.innerText = totalCount; 

        container.innerHTML = '';
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center text-slate-400 py-10 uppercase font-black text-[10px] tracking-widest">Aucune donnée trouvée</div>';
            return;
        }

        let html = '';

        if (currentReportTab === 'visits') {
            const grouped = {};
            data.forEach(v => {
                const name = v.nom_agent || "Inconnu";
                if (!grouped[name]) grouped[name] = [];
                grouped[name].push(v);
            });

            html = `<div class="col-span-full space-y-4">`;
            for (const [name, visits] of Object.entries(grouped)) {
                const accordionId = `acc-vis-${name.replace(/\s+/g, '-')}`;
                html += `
                    <div class="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-visible animate-fadeIn">
                        <div onclick="toggleAccordion('${accordionId}')" class="bg-slate-900 px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-slate-800 transition-all">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">${name.charAt(0)}</div>
                                <span class="font-black text-white text-sm uppercase tracking-widest">${name}</span>
                            </div>
                            <div class="flex items-center gap-4">
                                <span class="bg-white/10 text-white px-3 py-1 rounded-full text-[10px] font-bold">${visits.length} VISITES ICI</span>
                                <i id="icon-${accordionId}" class="fa-solid fa-chevron-down text-white/50 transition-transform duration-300"></i>
                            </div>
                        </div>
                           <div id="${accordionId}" class="hidden bg-slate-50/50">
                                <div class="table-container"> <!-- AJOUT DU WRAPPER ICI -->
                                    <table class="w-full text-left border-collapse min-w-[800px]"> <!-- min-w pour empêcher la déformation -->
                                        <thead class="bg-slate-100 border-b">
                                            <tr class="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                <th class="p-4">👤 Contact & Lieu</th>
                                                <th class="p-4">📦 Détails de la visite</th>
                                                <th class="p-4 text-center">📸 Preuve</th>
                                                <th class="p-4 text-right">📝 Notes</th>
                                                ${isChef ? '<th class="p-4 text-center">Action</th>' : ''}
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-slate-100">`;
               
            visits.forEach(v => {
                    let durationText = "---";
                    if (v.duration) durationText = v.duration >= 60 ? `${Math.floor(v.duration / 60)}h ${v.duration % 60}m` : `${v.duration} min`;

                     let prodsHtml = "";
                    let prods = [];

                    try {
                        // 1. Premier niveau de nettoyage
                        if (typeof v.presented_products === 'string') {
                            prods = JSON.parse(v.presented_products);
                        } else if (Array.isArray(v.presented_products)) {
                            prods = v.presented_products;
                        }

                        // 2. Nettoyage individuel (C'est ici que ça corrige ton bug)
                        // On parcourt chaque élément et on force la conversion si c'est encore du texte
                        prods = prods.map(item => {
                            if (typeof item === 'string' && item.trim().startsWith('{')) {
                                try { return JSON.parse(item); } catch (e) { return item; }
                            }
                            return item;
                        });

                    } catch (e) { console.error("Erreur parsing produits", e); }
                    
                    // 3. Affichage
                    if (prods.length > 0) {
                        prodsHtml = `<div class="flex flex-wrap gap-1 mt-2">` + 
                            prods.map(p => {
                                // On cherche le nom partout (Majuscule, minuscule, etc.)
                                let nomAffiche = p;
                                
                                if (typeof p === 'object' && p !== null) {
                                    nomAffiche = p.NAME || p.Name || p.name || p.label || "Produit";
                                }
                                
                                return `<span class="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[8px] font-black uppercase border border-indigo-100 shadow-sm">${nomAffiche}</span>`;
                            }).join('') + 
                            `</div>`;
                    }

                    // GESTION DU RÉSULTAT VISUEL
                    let outcomeBadge = "";
                    if(v.outcome === 'COMMANDE') outcomeBadge = '<span class="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-black text-[9px] uppercase border border-emerald-200">💰 Commande</span>';
                    else if(v.outcome === 'ABSENT') outcomeBadge = '<span class="text-red-700 bg-red-100 px-2 py-0.5 rounded font-black text-[9px] uppercase border border-red-200">❌ Absent</span>';
                    else if(v.outcome === 'VU') outcomeBadge = '<span class="text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-black text-[9px] uppercase border border-blue-200">✅ Vu</span>';
                    else outcomeBadge = `<span class="text-slate-600 bg-slate-200 px-2 py-0.5 rounded font-black text-[9px] uppercase">👍 ${v.outcome || 'RAS'}</span>`;

                    html += `
                    <tr id="row-vis-${v.id}" class="hover:bg-blue-50/30 transition-colors group">
                        
                        <!-- COLONNE 1 : CONTACT ET LIEU -->
                        <td class="p-4 align-top">
                            <div class="flex items-start gap-3">
                                <div class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold shrink-0 border border-slate-200 shadow-sm group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                    <i class="fa-solid fa-user-doctor"></i>
                                </div>
                                <div>
                                    <div class="text-sm font-black text-slate-800 uppercase tracking-tighter">${v.contact_nom}</div>
                                    <div class="text-[9px] text-blue-600 font-bold uppercase tracking-widest mb-1">${v.contact_role}</div>
                                    <div class="text-[10px] text-slate-500 font-medium"><i class="fa-solid fa-location-dot mr-1 text-slate-300"></i>${v.lieu_nom}</div>
                                </div>
                            </div>
                        </td>

                        <!-- COLONNE 2 : RÉSULTAT ET PRODUITS -->
                        <td class="p-4 align-top">
                            <div class="flex items-center gap-2 mb-1">
                                ${outcomeBadge}
                                <span class="text-[9px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded"><i class="fa-regular fa-clock mr-1"></i>${v.check_in ? new Date(v.check_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'} (${durationText})</span>
                            </div>
                            ${prodsHtml}
                        </td>

                        <!-- COLONNE 3 : PREUVE -->
                        <td class="p-4 text-center align-top">
                            ${v.proof_url ? `<button onclick="viewDocument('${v.proof_url}', 'Preuve Cachet')" class="text-emerald-500 hover:scale-125 transition-transform bg-emerald-50 p-2 rounded-lg"><i class="fa-solid fa-camera-retro text-lg"></i></button>` : '<div class="p-2 text-slate-200"><i class="fa-solid fa-ban"></i></div>'}
                        </td>

                        <!-- COLONNE 4 : NOTES -->
                        <td class="p-4 text-right align-top relative">
                            <div class="text-[11px] text-slate-600 italic line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors" 
                                 onclick="toggleTextFixed(this)" title="Cliquez pour lire en entier" data-fixed="false">
                                "${v.notes || 'Aucun commentaire'}"
                            </div>
                        </td>

                        <!-- COLONNE 5 : ACTION (Si Chef) -->
                        ${isChef ? `
                        <td class="p-4 text-center align-top">
                            <button onclick="deleteVisitReport('${v.id}')" class="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Marquer comme traité">
                                <i class="fa-solid fa-check-double text-lg"></i>
                            </button>
                        </td>` : ''}
                    </tr>`;
            });

                html += `</tbody></table></div></div>`;
            }
            html += `</div>`;
        } 
                    
        else {
            const groupedDaily = {};
            data.forEach(rep => {
                const name = rep.employees?.nom || "Agent Inconnu";
                if (!groupedDaily[name]) groupedDaily[name] = [];
                groupedDaily[name].push(rep);
            });

            html = `<div class="col-span-full space-y-3">`;
            for (const [name, reports] of Object.entries(groupedDaily)) {
                const accordionId = `acc-day-${name.replace(/\s+/g, '-')}`;
                const hasStockAlert = reports.some(rp => rp.needs_restock);

                html += `
                    <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-visible animate-fadeIn">
                        <div onclick="toggleAccordion('${accordionId}')" class="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors">
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm">${name.charAt(0)}</div>
                                <div><h4 class="font-black text-slate-800 text-sm uppercase tracking-tighter">${name}</h4><p class="text-[10px] text-slate-400 font-bold uppercase">${reports.length} bilans</p></div>
                            </div>
                            <div class="flex items-center gap-3">
                                ${hasStockAlert ? `<span class="bg-orange-100 text-orange-600 px-2 py-1 rounded-lg text-[9px] font-black animate-pulse">ALERTE STOCK</span>` : ''}
                                <i id="icon-${accordionId}" class="fa-solid fa-chevron-down text-slate-300 transition-transform duration-300"></i>
                            </div>
                        </div>
                            <div id="${accordionId}" class="hidden border-t border-slate-100 bg-slate-50/50">
                                <div class="table-container"> <!-- AJOUT DU WRAPPER ICI -->
                                    <table class="w-full text-left min-w-[700px]"> <!-- min-w pour forcer le scroll propre -->
                                        <tbody class="divide-y divide-slate-100">`;
                
                reports.forEach(rep => {
                    const hours = Math.floor(rep.total_work_minutes / 60);
                    const mins = rep.total_work_minutes % 60;
                    const timeDisplay = hours > 0 ? `${hours}h ${mins}min` : `${mins} min`;
                            
                    let statsHtml = "";
                    if (rep.products_stats && Object.keys(rep.products_stats).length > 0) {
                        statsHtml = `<div class="flex flex-wrap gap-1 mt-2">`;
                        for (const [prodName, count] of Object.entries(rep.products_stats)) {
                            statsHtml += `<span class="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[8px] font-black border border-indigo-100 uppercase">${prodName} <span class="text-indigo-400">x${count}</span></span>`;
                        }
                        statsHtml += `</div>`;
                    }

                    html += `
                        <tr id="row-daily-${rep.id}" class="hover:bg-white transition-colors group relative">
                            <td class="px-6 py-4 w-1/4 align-top">
                                <div class="text-[10px] font-black text-indigo-500 uppercase">
                                    ${new Date(rep.report_date).toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'long'})}
                                </div>
                                <div class="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-blue-600 text-white rounded-lg shadow-sm">
                                    <i class="fa-solid fa-clock text-[9px]"></i>
                                    <span class="text-[10px] font-black uppercase">${timeDisplay}</span>
                                </div>
                                ${statsHtml}
                                <div class="mt-2 text-left">${rep.needs_restock ? '<span class="text-orange-500 text-[10px] font-bold"><i class="fa-solid fa-box-open"></i> REAPPRO</span>' : '<span class="text-emerald-400 text-[10px]">OK</span>'}</div>
                            </td>
                            <td class="px-6 py-4 w-2/4 align-top relative">
                                <div class="text-xs text-slate-600 italic line-clamp-1 cursor-pointer transition-all duration-300"
                                     onmouseenter="peakText(this)" onmouseleave="unpeakText(this)" onclick="toggleTextFixed(this)" data-fixed="false">
                                    ${rep.summary || "Aucun texte."}
                                </div>
                            </td>
                            <td class="px-6 py-4 w-1/4 align-top text-right">
                                <div class="flex items-center justify-end gap-3">
                                    ${rep.photo_url ? `<button onclick="viewDocument('${rep.photo_url}', 'Cahier')" class="text-blue-500 hover:scale-125 transition-transform"><i class="fa-solid fa-file-image text-lg"></i></button>` : '<i class="fa-solid fa-ban text-slate-200"></i>'}
                                    ${isChef ? `
                                    <button onclick="deleteDailyReport('${rep.id}')" class="text-slate-300 hover:text-red-500 transition-all" title="Marquer comme traité">
                                        <i class="fa-solid fa-check-double text-lg"></i>
                                    </button>` : ''}
                                </div>
                            </td>
                        </tr>`;
                });
                html += `</tbody></table></div></div>`;
            }
            html += `</div>`;
        }

        const paginationHtml = `
            <div class="col-span-full flex justify-between items-center mt-6 px-4">
                <button onclick="fetchMobileReports(${reportPage - 1})" ${reportPage <= 1 ? 'disabled' : ''} class="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase text-slate-600 disabled:opacity-30 transition-all shadow-sm"><i class="fa-solid fa-chevron-left mr-2"></i> Précédent</button>
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page ${reportPage} / ${reportTotalPages}</span>
                <button onclick="fetchMobileReports(${reportPage + 1})" ${reportPage >= reportTotalPages ? 'disabled' : ''} class="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase text-slate-600 disabled:opacity-30 transition-all shadow-sm">Suivant <i class="fa-solid fa-chevron-right ml-2"></i></button>
            </div>`;

        container.innerHTML = html + paginationHtml;

    } catch (e) {
        console.error("Erreur rapports:", e);
        container.innerHTML = '<div class="col-span-full text-center text-red-500 py-10 font-bold uppercase text-[10px]">Erreur de connexion</div>';
    }
}

// 1. Pour le survol (Ordinateur)
function peakText(el) {
    el.classList.remove('line-clamp-1');
    el.classList.add('whitespace-normal', 'bg-blue-50', 'p-3', 'rounded-xl', 'text-slate-800', 'border', 'border-blue-200', 'shadow-xl', 'z-50', 'relative');
}

// 2. Pour quitter le survol (Ordinateur)
function unpeakText(el) {
    if (el.dataset.fixed !== 'true') { // On ne ferme pas si l'utilisateur a cliqué pour le bloquer
        el.classList.add('line-clamp-1');
        el.classList.remove('whitespace-normal', 'bg-blue-50', 'p-3', 'rounded-xl', 'text-slate-800', 'border', 'border-blue-200', 'shadow-xl', 'z-50', 'relative');
    }
}

// 3. Pour le clic (Mobile ou blocage sur Ordinateur)
function toggleTextFixed(el) {
    const isFixed = el.dataset.fixed === 'true';
    el.dataset.fixed = isFixed ? 'false' : 'true';
    
    if (!isFixed) {
        peakText(el);
        el.classList.replace('bg-blue-50', 'bg-amber-50'); // Couleur différente pour dire "bloqué ouvert"
        el.classList.replace('border-blue-200', 'border-amber-200');
    } else {
        el.dataset.fixed = 'false';
        unpeakText(el);
    }
}



















function setEmployeeFilter(category, value) {
    // 1. On met à jour la mémoire
    activeFilters[category] = value;
    
    // 2. On change les couleurs des boutons pour que Bill voit ce qu'il a choisi
    // On cherche le groupe de boutons (ex: filter-group-status)
    const container = document.getElementById(`filter-group-${category}`);
    if (container) {
        container.querySelectorAll('.filter-chip').forEach(btn => {
            // Si le bouton correspond à la valeur cliquée -> Bleu
            if (btn.getAttribute('data-value') === value) {
                btn.className = "filter-chip px-3 py-1.5 rounded-lg text-[10px] font-black border bg-blue-600 text-white border-blue-600 shadow-md transition-all";
            } else {
                // Sinon -> Blanc
                btn.className = "filter-chip px-3 py-1.5 rounded-lg text-[10px] font-bold border bg-white text-slate-600 border-slate-200 hover:border-blue-300 transition-all";
            }
        });
    }

    // 3. On repart à la page 1 et on demande les données au serveur
    fetchData(true, 1);
}





async function renderCharts() {
    // --- GARDE-FOU DE SÉCURITÉ (NOUVEAU) ---
    // Si l'utilisateur n'a pas le droit de voir le dashboard, on arrête tout ici.
    // Cela empêche l'appel API inutile et l'erreur rouge dans la console.
    if (!currentUser || !currentUser.permissions || !currentUser.permissions.can_see_dashboard) {
        return;
    }
    // ----------------------------------------

    // --- 1. BLOC D'INTELLIGENCE VISUELLE (DÉBUT) ---
    const isSuperBoss = currentUser.permissions?.can_see_employees === true;

    // Mise à jour du titre principal du Dashboard
    const dashboardTitle = document.querySelector('#view-dash h2');
    if (dashboardTitle) {
        dashboardTitle.innerText = isSuperBoss ? "Analyse Globale de l'Entreprise" : "Pilotage de mon Équipe";
    }

    // Mise à jour du libellé de la carte noire "Absents"
    // On cible le petit texte au-dessus du chiffre 97
    const absentCardLabel = document.querySelector('#live-absents-list')?.parentElement?.querySelector('p');
    if (absentCardLabel) {
        absentCardLabel.innerText = isSuperBoss ? "ABSENTS / NON POINTÉS (TOTAL)" : "MEMBRES DE L'ÉQUIPE NON POINTÉS";
    }
    // --- FIN DU BLOC D'INTELLIGENCE VISUELLE ---
            
    try {
        const response = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/get-dashboard-stats`);
        const stats = await response.json();

        // 1. Synchronisation des chiffres du Dashboard
        if(document.getElementById('stat-total')) document.getElementById('stat-total').innerText = stats.total;
        if(document.getElementById('stat-active')) document.getElementById('stat-active').innerText = stats.actifs;

        // 2. Rendu Chart.js (Statut) - Ce graphique fonctionne
        if (chartStatusInstance) chartStatusInstance.destroy();
        const ctxStatus = document.getElementById('chartStatus')?.getContext('2d');
        if (ctxStatus) { // Vérifie si le contexte est disponible
            chartStatusInstance = new Chart(ctxStatus, {
                type: 'doughnut',
                data: {
                    labels: ['Actif', 'Congé', 'Sortie'],
                    datasets: [{
                        data: [stats.actifs, stats.enConge, stats.sortis],
                        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'], 
                        borderWidth: 0
                    }]
                },
                options: { 
                    plugins: { legend: { position: 'bottom' } }, 
                    cutout: '70%',
                    animation: { duration: 800 }
                }
            });
        } else {
            console.warn("Impossible d'obtenir le contexte du graphique de statut.");
        }


        // --- 3. RENDU CHART.JS (DÉPARTEMENT) - CORRIGÉ POUR ROBUSTESSE ---
        if (chartDeptInstance) chartDeptInstance.destroy();
        const ctxDept = document.getElementById('chartDept')?.getContext('2d'); // Utilise optional chaining (?)

        // Ajout de logs de débogage pour voir les données
        console.log("➡️ Données Département (stats.depts) :", stats.depts);
        console.log("➡️ Contexte du graphique Département (ctxDept) :", ctxDept);

        // On ne crée le graphique que si le contexte est valide ET qu'il y a des données
        if (ctxDept && Object.keys(stats.depts).length > 0) {
            chartDeptInstance = new Chart(ctxDept, {
                type: 'bar',
                data: {
                    labels: Object.keys(stats.depts),
                    datasets: [{ 
                        label: 'Collaborateurs', 
                        data: Object.values(stats.depts), 
                        backgroundColor: '#6366f1', 
                        borderRadius: 8 
                    }]
                },
                options: { 
                    scales: { 
                        y: { beginAtZero: true, ticks: { stepSize: 1 } }, 
                        x: { grid: { display: false } } 
                    }, 
                    plugins: { legend: { display: false } } 
                }
            });
        } else {
            // Message si le graphique ne peut pas être rendu (ex: pas de données)
            console.warn("Graphique de répartition par département non rendu : Contexte invalide ou aucune donnée.");
            const chartContainer = document.getElementById('chartDept')?.parentElement;
            if (chartContainer) {
                chartContainer.innerHTML = `
                    <p class="font-bold text-slate-700 mb-4 uppercase text-xs tracking-widest">Répartition par Département</p>
                    <div class="text-center text-slate-400 text-sm italic p-4 bg-slate-50 rounded-lg">
                        Aucune donnée départementale à afficher.
                    </div>
                `;
            }
        }

    } catch (e) {
        console.error("Erreur de mise à jour des statistiques globales:", e);
        // Si une erreur grave survient, on peut vider le canvas ou afficher un message général
        const chartContainer = document.getElementById('w-charts-content');
        if (chartContainer) chartContainer.innerHTML = '<p class="text-center text-red-500 font-bold p-6">Erreur de chargement des graphiques.</p>';
    }
}



function injectPaginationUI(containerId, meta, callbackName) {
    const container = document.getElementById(containerId);
    if (!container || !meta || meta.last_page <= 1) return;

    const html = `
        <div class="flex justify-between items-center mt-6 p-4 bg-white rounded-2xl border shadow-sm">
            <button onclick="${callbackName}(${meta.page - 1})" ${meta.page <= 1 ? 'disabled' : ''} 
                class="px-4 py-2 text-xs font-bold uppercase text-slate-500 disabled:opacity-20">
                <i class="fa-solid fa-arrow-left mr-2"></i> Précédent
            </button>
            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Page ${meta.page} / ${meta.last_page}
            </span>
            <button onclick="${callbackName}(${meta.page + 1})" ${meta.page >= meta.last_page ? 'disabled' : ''} 
                class="px-4 py-2 text-xs font-bold uppercase text-blue-600 disabled:opacity-20">
                Suivant <i class="fa-solid fa-arrow-right ml-2"></i>
            </button>
        </div>
    `;
    
    // On l'ajoute à la fin de la section
    container.insertAdjacentHTML('beforeend', html);
}



// 3. AUDIT GLOBAL (Mise à jour avec les 3 KPIs)
async function fetchGlobalAudit() {
    const container = document.getElementById('reports-list-container');
    const labelEl = document.getElementById('stat-report-label');
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    if (!container) return;
    container.innerHTML = '<div class="col-span-full text-center p-10"><i class="fa-solid fa-circle-notch fa-spin text-blue-500 text-3xl"></i></div>';

    try {
        const r = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/get-global-audit?month=${month}&year=${year}`);
        const data = await r.json();
        lastAuditData = data;
        
        if(labelEl) labelEl.innerText = "VISITES CUMULÉES (ÉQUIPE TERRAIN)";
        
        // Calculs des 3 KPIs
        const totalVisites = data.reduce((acc, row) => acc + row.total_visites, 0);
        const totalProduits = data.reduce((acc, row) => acc + (row.total_produits || 0), 0);
        const agentsActifs = data.filter(row => row.total_visites > 0).length;

        // Injection dans le HTML
        if(document.getElementById('stat-visites-total')) document.getElementById('stat-visites-total').innerText = totalVisites;
        if(document.getElementById('stat-produits-total')) document.getElementById('stat-produits-total').innerText = totalProduits;
        if(document.getElementById('stat-agents-actifs')) document.getElementById('stat-agents-actifs').innerText = agentsActifs;

        renderAuditTable(data);
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div class="col-span-full text-center text-red-500 py-10 font-bold">Erreur synthèse.</div>';
    }
}

// Mise à jour de la table pour inclure les produits
function renderAuditTable(data) {
    const container = document.getElementById('reports-list-container');
    let html = `
    <div class="col-span-full bg-white rounded-[2.5rem] shadow-xl border overflow-hidden animate-fadeIn mb-10">
        <div class="p-6 border-b flex justify-between items-center bg-slate-50">
            <div><h3 class="font-black text-slate-800 uppercase text-sm">Audit Global d'Activité (Mobiles)</h3></div>
            <button onclick="exportAuditToExcel()" class="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg">EXPORTER EXCEL</button>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-left">
                <thead class="bg-slate-900 text-white text-[10px] uppercase font-bold">
                    <tr>
                        <th class="px-6 py-5">Collaborateur</th>
                        <th class="px-6 py-5 text-center">Visites</th>
                        <th class="px-6 py-5 text-center">Produits Prés.</th> <!-- NOUVELLE COLONNE -->
                        <th class="px-6 py-5">Détail des Lieux</th>
                        <th class="px-6 py-5 text-center">Absences</th>
                        <th class="px-6 py-5 text-right">Dernière Obs.</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">`;
    
    data.forEach(row => {
        html += `
            <tr class="hover:bg-blue-50/50">
                <td class="px-6 py-4">
                    <div class="font-bold text-slate-800 uppercase text-xs">${row.nom}</div>
                    <div class="text-[9px] text-slate-400 font-mono">${row.matricule}</div>
                </td>
                <td class="px-6 py-4 text-center">
                    <span class="bg-blue-600 text-white px-3 py-1 rounded-full font-black text-xs">${row.total_visites}</span>
                </td>
                <td class="px-6 py-4 text-center">
                    <span class="bg-indigo-50 text-indigo-600 border border-indigo-200 px-3 py-1 rounded-full font-black text-xs">${row.total_produits || 0}</span>
                </td>
                <td class="px-6 py-4 text-[10px] text-slate-600 max-w-xs truncate" title="${row.detail_lieux}">
                    ${row.detail_lieux}
                </td>
                <td class="px-6 py-4 text-center">
                    ${row.jours_absence > 0 ? `<span class="text-red-600 font-bold text-[10px] bg-red-50 px-2 py-1 rounded">${row.jours_absence} JOURS</span>` : `<span class="text-slate-300 text-[10px]">-</span>`}
                </td>
                <td class="px-6 py-4 text-[10px] text-slate-500 italic max-w-[150px] truncate text-right">
                    ${row.dernier_rapport}
                </td>
            </tr>`;
    });
    
    html += `</tbody></table></div></div>`;
    container.innerHTML = html;
}

function exportAuditToExcel() {
    if (lastAuditData.length === 0) return;
    const headers = ["Matricule", "Nom", "Poste", "Visites Totales", "Details Lieux", "Jours Absence", "Dernier Rapport"];
    let csvContent = "\ufeff" + headers.join(";") + "\n";
    lastAuditData.forEach(row => {
        const line = [row.matricule, row.nom, row.poste, row.total_visites, row.detail_lieux.replace(/;/g, ','), row.jours_absence, row.dernier_rapport.replace(/\n/g, ' ').replace(/;/g, ',')];
        csvContent += line.join(";") + "\n";
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Audit_SIRH_${new Date().toLocaleDateString()}.csv`;
    link.click();
}

function setReportView(mode) {
    window.reportViewMode = mode;
    fetchMobileReports();
}








// --- UTILITAIRE : DICTÉE VOCALE (OPTIONNELLE) ---
let recognition;

function toggleDictation(targetId, btn) {
    // 1. Vérification de compatibilité (si le téléphone ne peut pas, on prévient)
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        return Swal.fire('Info', 'La dictée vocale n\'est pas disponible sur ce navigateur.', 'info');
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const target = document.getElementById(targetId);

    // 2. Si on clique pour arrêter
    if (recognition && recognition.started) {
        recognition.stop();
        return;
    }

    // 3. Configuration
    recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR'; // Français
    recognition.interimResults = false; 

    // 4. Démarrage (Feedback visuel)
    recognition.onstart = () => {
        recognition.started = true;
        btn.classList.remove('text-slate-400', 'bg-white');
        btn.classList.add('text-white', 'bg-red-500', 'animate-pulse'); // Devient rouge et pulse
        btn.innerHTML = '<i class="fa-solid fa-microphone-lines"></i>';
    };

    // 5. Fin (Retour à la normale)
    recognition.onend = () => {
        recognition.started = false;
        btn.classList.remove('text-white', 'bg-red-500', 'animate-pulse');
        btn.classList.add('text-slate-400', 'bg-white');
        btn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
    };

    // 6. Résultat (On AJOUTE le texte au lieu de remplacer)
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        // On ajoute un espace si le champ n'est pas vide
        const prefix = target.value ? " " : "";
        target.value += prefix + transcript;
    };

    recognition.start();
}



let inactivityTimer;

function resetInactivityTimer() {
    // Si l'utilisateur n'est pas connecté, on ne fait rien
    if (!currentUser) return;

    // On efface le compte à rebours précédent
    clearTimeout(inactivityTimer);

    // On lance un nouveau compte à rebours de 15 minutes (900 000 ms)
    inactivityTimer = setTimeout(() => {
        handleAutoLogout();
    }, 900000); 
}

function handleAutoLogout() {
    Swal.fire({
        title: 'Session expirée',
        text: 'Pour votre sécurité, vous avez été déconnecté suite à une longue inactivité.',
        icon: 'info',
        confirmButtonText: 'Se reconnecter',
        confirmButtonColor: '#0f172a'
    }).then(() => {
        handleLogout(); // Ta fonction de déconnexion existante
    });
}

// On écoute tous les mouvements de l'utilisateur
['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(name => {
    document.addEventListener(name, resetInactivityTimer);
});






function toggleSensitiveData(element) {
    // 1. On affiche la donnée
    element.classList.add('revealed');
    
    // 2. On joue une petite vibration pour le feeling pro
    if (navigator.vibrate) navigator.vibrate(10);

    // 3. Sécurité : On refloute automatiquement après 10 secondes
    setTimeout(() => {
        element.classList.remove('revealed');
    }, 10000); 
}



function toggleAccordion(id) {
    const content = document.getElementById(id);
    const icon = document.getElementById('icon-' + id);
    if (!content) return;
    const isHidden = content.classList.contains('hidden');
    if (isHidden) {
        content.classList.remove('hidden');
        if (icon) icon.style.transform = 'rotate(180deg)';
    } else {
        content.classList.add('hidden');
        if (icon) icon.style.transform = 'rotate(0deg)';
    }
}

async function deleteVisitReport(id) {
    const confirm = await Swal.fire({ title: 'Supprimer ?', text: "Cette visite sera retirée définitivement.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' });
    if (confirm.isConfirmed) {
        try {
            const r = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/delete-visit-report`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
            if (r.ok) { document.getElementById('row-vis-' + id).remove(); }
        } catch (e) { console.error(e); }
    }
}

async function deleteDailyReport(id) {
    try {
        const r = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/delete-daily-report`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
        if (r.ok) {
            const row = document.getElementById('row-daily-' + id);
            row.style.opacity = '0';
            setTimeout(() => row.remove(), 300);
        }
    } catch (e) { console.error(e); }
}


// Cette fonction décide quel moteur de recherche lancer selon l'onglet actif
function handleReportSearch() {
    const searchTerm = document.getElementById('filter-report-name').value.toLowerCase();

    if (currentReportTab === 'audit') {
        // Si on est sur l'audit, on filtre le tableau déjà chargé (très rapide)
        filterAuditTableLocally(searchTerm);
    } else {
        // Sinon, on lance la recherche classique (serveur) pour les visites ou bilans
        fetchMobileReports(1); 
    }
}





function filterAuditTableLocally(term) {
    const rows = document.querySelectorAll('#reports-list-container tbody tr');
    
    // On récupère nos 3 compteurs
    const counterVisites = document.getElementById('stat-visites-total');
    const counterProduits = document.getElementById('stat-produits-total');
    const counterAgents = document.getElementById('stat-agents-actifs');
    const labelEl = document.getElementById('stat-report-label');
    
    let sumVisits = 0;
    let sumProducts = 0;
    let activeAgents = 0;

    rows.forEach(row => {
        // On récupère le texte du nom (colonne 1)
        const agentInfo = row.cells[0].innerText.toLowerCase();
        
        // On récupère les chiffres des colonnes 2 (Visites) et 3 (Produits)
        const visitCount = parseInt(row.cells[1].innerText) || 0;
        const productCount = parseInt(row.cells[2].innerText) || 0;

        // Si la ligne correspond à la recherche
        if (agentInfo.includes(term)) {
            row.style.display = ""; // On affiche
            sumVisits += visitCount;
            sumProducts += productCount;
            if (visitCount > 0) activeAgents++;
        } else {
            row.style.display = "none"; // On cache
        }
    });

    // --- MISE À JOUR DE L'INTERFACE EN DIRECT ---
    if (counterVisites) counterVisites.innerText = sumVisits;
    if (counterProduits) counterProduits.innerText = sumProducts;
    if (counterAgents) counterAgents.innerText = activeAgents;

    if (labelEl) {
        if (term.length > 0) {
            labelEl.innerText = `RÉSULTAT POUR "${term.toUpperCase()}"`;
            labelEl.classList.add('text-blue-400'); // Passe en bleu pour montrer le filtre
        } else {
            labelEl.innerText = "VISITES CUMULÉES (ÉQUIPE TERRAIN)";
            labelEl.classList.remove('text-blue-400');
        }
    }
}





                if ('serviceWorker' in navigator) {
                    window.addEventListener('load', () => {
                        navigator.serviceWorker.register('./sw.js')
                            .then(reg => console.log('Service Worker enregistré', reg))
                            .catch(err => console.log('Erreur Service Worker', err));
                    });
                }






















































































































































