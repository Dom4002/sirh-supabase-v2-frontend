


            let docBlobs = {
                id_card: null,
                cv: null,
                diploma: null,
                attestation: null,
                leave_justif: null
            };

let logsPage = 1;
let logsTotalPages = 1;

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

// On place ça en haut du fichier app.js
let activeFilters = {
    search: "",   // Ce qui est tapé dans la barre de recherche
    status: "all", // Le bouton Statut cliqué
    type: "all",   // Le bouton Activité cliqué
    dept: "all"    // Le bouton Département cliqué
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
            baseFontSize: "14px" // Taille de base (14px ou 16px recommandé)
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
        apiBaseUrl: "https://sirh-secure-backend.onrender.com/api"
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


            // Variable globale qui stockera les infos du bureau
            let companyConfig = {
                latitude: null,      
                longitude: null,     
                radius: 100,         // Rayon par défaut (mètres)
                geo_required: false  // Force le GPS ou non
            };

            let currentUser = null, employees = [], videoStream = null, capturedBlob = null, contractBlob = null, contractStream = null, signaturePad = null;
         
            
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
                
                // === CORRECTION ICI : ON PASSE u.permissions ===
                setSession(u.nom, u.role, u.id, u.permissions);
                            
                                            
                                // On laisse le loader 1 seconde (1000ms) pour faire "Pro"
                                setTimeout(() => {
                                    const loader = document.getElementById('initial-loader');
                                    loader.style.opacity = '0';
                                    loader.style.transform = 'scale(1.1)'; // Petit effet de zoom en disparaissant
                                    setTimeout(() => loader.classList.add('hidden'), 700);
                                }, 1200);

                            
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

// --- 1. GESTION DES LIEUX ---
async function fetchMobileLocations() {
    const grid = document.getElementById('locations-grid');
    if (!grid) return;
    
    try {
        const r = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/list-mobile-locations`);
        const data = await r.json();
        
        grid.innerHTML = '';
        if (data.length === 0) grid.innerHTML = '<div class="col-span-full text-center text-slate-400 py-10">Aucun lieu configuré.</div>';

        data.forEach(loc => {
            grid.innerHTML += `
                <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative">
                    <button onclick="deleteMobileLocation('${loc.id}')" class="absolute top-4 right-4 text-slate-300 hover:text-red-500"><i class="fa-solid fa-trash"></i></button>
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-lg"><i class="fa-solid fa-location-dot"></i></div>
                        <div>
                            <h3 class="font-bold text-slate-800">${loc.name}</h3>
                            <p class="text-[10px] font-black text-slate-400 uppercase">${loc.type_location}</p>
                        </div>
                    </div>
                    <p class="text-xs text-slate-500 mb-2"><i class="fa-solid fa-map-pin mr-1"></i> ${loc.address || 'Coordonnées GPS'}</p>
                    <div class="flex gap-2 text-[10px] font-mono bg-slate-50 p-2 rounded-lg text-slate-500">
                        <span>Lat: ${loc.latitude.toFixed(4)}</span>
                        <span>Lon: ${loc.longitude.toFixed(4)}</span>
                        <span>Rayon: ${loc.radius}m</span>
                    </div>
                </div>
            `;
        });
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

// --- 2. GESTION DES PLANNINGS ---
async function fetchMobileSchedules() {
    const tbody = document.getElementById('planning-body');
    if (!tbody) return;

    try {
        const r = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/list-schedules`);
        const data = await r.json();

        tbody.innerHTML = '';
        if (data.length === 0) tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-slate-400">Aucune mission planifiée.</td></tr>';

        data.forEach(s => {
            let statusColor = 'bg-slate-100 text-slate-500';
            if (s.status === 'CHECKED_IN') statusColor = 'bg-blue-100 text-blue-700 animate-pulse';
            if (s.status === 'COMPLETED') statusColor = 'bg-emerald-100 text-emerald-700';
            if (s.status === 'MISSED') statusColor = 'bg-red-100 text-red-700';

            tbody.innerHTML += `
                <tr class="border-b hover:bg-slate-50">
                    <td class="px-6 py-4">
                        <div class="font-bold text-sm text-slate-800">${new Date(s.schedule_date).toLocaleDateString()}</div>
                        <div class="text-xs text-slate-500">${s.start_time.slice(0,5)} - ${s.end_time.slice(0,5)}</div>
                    </td>
                    <td class="px-6 py-4 text-sm font-medium">${s.employee_name}</td>
                    <td class="px-6 py-4 text-sm text-slate-600">
                        <i class="fa-solid fa-location-dot mr-1 text-blue-400"></i> ${s.location_name}
                    </td>
                    <td class="px-6 py-4 text-center">
                        <span class="px-2 py-1 rounded-md text-[10px] font-black uppercase ${statusColor}">${s.status}</span>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <button onclick="deleteSchedule('${s.id}')" class="text-slate-300 hover:text-red-500"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    } catch (e) { console.error(e); }
}

async function openAddScheduleModal() {
    // On charge les listes pour les dropdowns
    const [empsRes, locsRes] = await Promise.all([
        secureFetch(`${SIRH_CONFIG.apiBaseUrl}/read`),
        secureFetch(`${SIRH_CONFIG.apiBaseUrl}/list-mobile-locations`)
    ]);
    const emps = await empsRes.json();
    const locs = await locsRes.json();

    // Filtrer pour ne garder que les employés "mobiles" (si tu utilises le type)
    // const mobileEmps = emps.filter(e => e.employee_type !== 'OFFICE'); 
    const mobileEmps = emps; // Pour l'instant on affiche tout le monde

    let empOptions = mobileEmps.map(e => `<option value="${e.id}">${e.nom} (${e.matricule})</option>`).join('');
    let locOptions = locs.map(l => `<option value="${l.id}">${l.name}</option>`).join('');

    const { value: form } = await Swal.fire({
        title: 'Nouvelle Mission',
        html: `
            <label class="block text-left text-xs font-bold text-slate-500 mb-1">Agent</label>
            <select id="sched-emp" class="swal2-input mb-3">${empOptions}</select>
            
            <label class="block text-left text-xs font-bold text-slate-500 mb-1">Lieu</label>
            <select id="sched-loc" class="swal2-input mb-3">${locOptions}</select>
            
            <div class="grid grid-cols-2 gap-2">
                <div><label class="text-xs">Date</label><input id="sched-date" type="date" class="swal2-input"></div>
                <div><label class="text-xs">Début</label><input id="sched-start" type="time" class="swal2-input"></div>
            </div>
            <label class="block text-left text-xs font-bold text-slate-500 mt-2 mb-1">Notes</label>
            <input id="sched-notes" class="swal2-input" placeholder="Ex: Livrer échantillon A">
        `,
        focusConfirm: false,
        showCancelButton: true,
        preConfirm: () => {
            return {
                employee_id: document.getElementById('sched-emp').value,
                location_id: document.getElementById('sched-loc').value,
                schedule_date: document.getElementById('sched-date').value,
                start_time: document.getElementById('sched-start').value,
                end_time: '18:00', // Valeur par défaut ou ajouter un input
                notes: document.getElementById('sched-notes').value
            }
        }
    });

    if (form) {
        await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/add-schedule`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(form)
        });
        fetchMobileSchedules();
        Swal.fire('Planifié !', '', 'success');
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

    // --- CORRECTION ICI : ON PASSE DE 60000 à 120000 (2 minutes) ---
    // Cela laisse le temps à Render/Make de se réveiller sans planter
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

            if (response.status === 401 || response.status === 403) {
                if (specificMessage) {
                    throw new Error(`AUTH_ERROR_SPECIFIC:${specificMessage}`);
                }
                throw new Error("Session expirée. Veuillez vous reconnecter.");
            }
            
            throw new Error(errorMessage);
        }

        return response;

    } catch (error) {
        // 4. GESTION DES ERREURS TECHNIQUES
        if (error.name === 'AbortError') {
            // Message plus clair pour l'utilisateur
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
                    
// --- DANS app.js (handleLogin) ---
if(d.status === "success") { 
    // 1. On enregistre le token
    if(d.token) localStorage.setItem('sirh_token', d.token);
    
    // 2. On prépare les données de session
    let r = d.role || "EMPLOYEE"; if(Array.isArray(r)) r = r[0]; 
    
    // === CORRECTION ICI : ON AJOUTE LES PERMISSIONS DANS L'OBJET ===
    const userData = { 
        nom: d.nom || u, 
        role: String(r).toUpperCase(), 
        id: d.id,
        employee_type: d.employee_type || 'OFFICE', 
        permissions: d.permissions || {} // <--- C'EST CETTE LIGNE QUI MANQUAIT
    };
    
    localStorage.setItem('sirh_user_session', JSON.stringify(userData));

    const Toast = Swal.mixin({toast: true, position: 'top-end', showConfirmButton: false, timer: 2000});
    Toast.fire({icon: 'success', title: 'Bienvenue ' + userData.nom});
    
    // 3. ON APPELLE setSession
    await setSession(userData.nom, userData.role, userData.id, d.permissions); 
}
                    
                    else { 
                        // Ce bloc reste inchangé
                        Swal.fire('Refusé', 'Identifiant ou mot de passe incorrect', 'error'); 
                    }
                } catch (error) {
                    // Ce bloc reste inchangé
                    console.error(error);
                    if (error.name === 'AbortError') { 
                        Swal.fire('Délai dépassé', 'Le serveur démarre . Cela peut prendre 30 à 60 secondes. Veuillez réessayer dans un instant.', 'warning'); 
                    } else if (!navigator.onLine) {
                        Swal.fire('Hors Ligne', 'Vous semblez déconnecté d\'internet.', 'error');
                    } else { 
                        Swal.fire('Erreur Système', 'Impossible de contacter le serveur. Réessayez.', 'error'); 
                    }
                } finally {
                    // Ce bloc reste inchangé
                    btn.innerHTML = originalBtnText; btn.disabled = false; btn.classList.remove('opacity-50', 'cursor-not-allowed');
                }
            }




// --- 1. CHARGER LA LISTE DES MODÈLES DANS LE TABLEAU ---
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
                        <button onclick="window.open('${t.template_file_url}', '_blank')" class="p-2 text-slate-400 hover:text-blue-600" title="Voir le fichier"><i class="fa-solid fa-eye"></i></button>
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

// --- 2. OUVRIR LA MODALE D'UPLOAD (C'est la fonction manquante !) ---
async function openAddTemplateModal() {
    const { value: formValues } = await Swal.fire({
        title: 'Uploader un Modèle Word',
        html: `
            <div class="text-left">
                <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">Rôle visé (Le nom doit être identique au rôle Supabase)</label>
                <select id="swal-tpl-role" class="swal2-input !mt-0">
                    <option value="EMPLOYEE">EMPLOYEE (Standard)</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="SECURITY">SECURITY (Sécurité)</option>
                    <option value="DELEGATE">DELEGATE (Délégué)</option>
                    <option value="OFFICE">OFFICE (Bureau)</option>
                </select>

                <label class="block text-[10px] font-black text-slate-400 uppercase mt-4 mb-1">Libellé du modèle (ex: CDI Délégué 2026)</label>
                <input id="swal-tpl-label" class="swal2-input !mt-0" placeholder="Nom du document...">

                <label class="block text-[10px] font-black text-slate-400 uppercase mt-4 mb-1">Fichier Word (.docx)</label>
                <input type="file" id="swal-tpl-file" class="swal2-file !mt-0" accept=".docx">
                <p class="text-[8px] text-slate-400 mt-1 italic">Utilisez les balises {{nom_complet}}, {{salaire_base}}, etc.</p>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Uploader le modèle',
        confirmButtonColor: '#2563eb',
        preConfirm: () => {
            const role = document.getElementById('swal-tpl-role').value;
            const label = document.getElementById('swal-tpl-label').value;
            const file = document.getElementById('swal-tpl-file').files[0];

            if (!label || !file) {
                Swal.showValidationMessage('Veuillez remplir tous les champs et choisir un fichier.');
                return false;
            }
            if (!file.name.endsWith('.docx')) {
                Swal.showValidationMessage('Seuls les fichiers .docx sont acceptés.');
                return false;
            }
            return { role, label, file };
        }
    });

    if (formValues) {
        Swal.fire({ title: 'Envoi en cours...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });

        const fd = new FormData();
        fd.append('role_target', formValues.role);
        fd.append('label', formValues.label);
        fd.append('template_file', formValues.file); // Le nom du champ doit être template_file
        fd.append('agent', currentUser.nom);

        try {
            const response = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/upload-template`, {
                method: 'POST',
                body: fd
            });

            if (response.ok) {
                Swal.fire('Succès !', 'Le modèle de contrat a été enregistré.', 'success');
                fetchTemplates(); // Recharge le tableau
            } else {
                throw new Error("Erreur serveur lors de l'upload.");
            }
        } catch (e) {
            Swal.fire('Erreur', e.message, 'error');
        }
    }
}

async function setSession(n, r, id, perms) {
    currentUser = { nom: n, role: r, id: id, permissions: perms };
    applyBranding();
    
    // 1. Cacher le login IMMÉDIATEMENT, mais GARDER le loader (pour le style)
    document.getElementById('login-screen').classList.add('hidden');
    const loader = document.getElementById('initial-loader');
    const appLayout = document.getElementById('app-layout');
    
    if (loader) {
        loader.classList.remove('hidden'); // S'assure qu'il est visible
        loader.style.opacity = '1';
    }

    // 2. Préparer l'identité visuelle de base (arrière-plan)
    document.getElementById('name-display').innerText = n; 
    document.getElementById('role-display').innerText = r; 
    document.getElementById('avatar-display').innerText = n[0]; 

    document.body.className = "text-slate-900 overflow-hidden h-screen w-screen role-" + r.toLowerCase(); 

    // 3. Injecter les SKELETONS dans les tableaux
    const skeletonRow = `<tr class="border-b"><td class="p-4 flex gap-3 items-center"><div class="w-10 h-10 rounded-full skeleton"></div><div class="space-y-2"><div class="h-3 w-24 rounded skeleton"></div></div></td><td class="p-4"><div class="h-3 w-32 rounded skeleton"></div></td><td class="p-4"><div class="h-6 w-16 rounded-lg skeleton"></div></td><td class="p-4"></td></tr>`;
    ['full-body', 'dashboard-body'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = skeletonRow.repeat(6);
    });

    // 4. RÉVÉLATION DE L'INTERFACE DÈS QUE POSSIBLE
    appLayout.classList.remove('hidden'); 
    appLayout.classList.add('ready');     
    
    setTimeout(() => {
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.classList.add('hidden');
                document.body.style.backgroundColor = "#f1f5f9"; 
            }, 800); 
        }
    }, 100); 


    // 5. CHARGEMENT DES DONNÉES EN ARRIÈRE-PLAN (NON BLOQUANT POUR L'UI)
    try {
        refreshAllData(false); 
        syncClockInterface(); 
        fetchAndPopulateDepartments();
        
        // --- NOUVEAU : CHARGEMENT DES MODÈLES DE CONTRAT POUR LE SELECTEUR ---
        // S'assure que les options sont prêtes avant d'ouvrir la vue "add-new"
        fetchContractTemplatesForSelection(); 

        // --- NOUVEAU : Écouteur pour le type d'employé (si le select existe) ---
        // Il est important de s'assurer que l'élément est dans le DOM avant d'ajouter l'écouteur
        const fTypeSelect = document.getElementById('f-type');
        if (fTypeSelect) {
            fTypeSelect.removeEventListener('change', toggleContractFieldsVisibility); // Évite les écouteurs dupliqués
            fTypeSelect.addEventListener('change', toggleContractFieldsVisibility);
            toggleContractFieldsVisibility(); // Appel initial pour masquer/afficher les champs
        }

        await applyModulesUI(); 
        applyPermissionsUI(perms);

        // 6. LOGIQUE DE NAVIGATION VERS LA VUE PAR DÉFAUT (ou sauvegardée)
        const searchContainer = document.getElementById('global-search-container');
        if (searchContainer) {
            searchContainer.style.display = perms?.can_see_employees ? 'block' : 'none';
        }

        const savedView = localStorage.getItem('sirh_last_view');
        
        if (savedView && document.getElementById('view-' + savedView)) {
            switchView(savedView);
        } else {
            if (perms?.can_see_dashboard) {
                switchView('dash');
            } else {
                switchView('my-profile'); 
            }
        }

        applyWidgetPreferences(); 
        requestNotificationPermission();
        initDarkMode();
        
    } catch (e) {
        console.error("Erreur critique au démarrage de l'app:", e);
        Swal.fire('Erreur', 'Impossible de démarrer l\'application. Réessayez.', 'error');
    }
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
            text: 'Le fichier est en cours d\'archivage...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        const fd = new FormData();
        fd.append('id', employeeId);
        fd.append('contract_file', file);
        fd.append('mode', 'manual_scan');
        fd.append('agent', currentUser.nom);

        try {
            const response = await fetch(URL_UPLOAD_SIGNED_CONTRACT, {
                method: 'POST',
                body: fd
            });

            if (response.ok) {
                Swal.fire('Succès !', 'Contrat scanné enregistré.', 'success');
                refreshAllData();
            } else {
                throw new Error("Erreur serveur lors de l'upload");
            }
        } catch (error) {
            Swal.fire('Échec', error.message, 'error');
        }
    }
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

        // 1. GPS & Flash (inchangé)
        if (force || (now - lastFetchTimes.global > 3600000)) {
            tasks.push(fetchCompanyConfig().catch(e => console.warn("GPS ignoré", e)));
        }
        tasks.push(fetchFlashMessage().catch(e => console.warn("Flash ignoré", e)));

        // --- GESTION OPTIMISÉE DU CHARGEMENT DES EMPLOYÉS ---
        // On appelle fetchData (pour la liste paginée des collaborateurs)
        // UNIQUEMENT si on n'est PAS sur la vue 'my-profile'
        // et si la liste est vide ou si un rafraîchissement forcé est demandé.
        if (currentView !== 'my-profile' && (force || employees.length === 0 || (now - lastFetchTimes.employees > REFRESH_THRESHOLD))) {
            await fetchData(false, 1); // Toujours charger la page 1 par défaut pour la liste des collaborateurs
            lastFetchTimes.employees = now;
        }

        // 3. Autres chargements spécifiques (pour les modules actifs)
        if (currentView === 'recruitment') tasks.push(fetchCandidates());
        if (currentView === 'logs') tasks.push(fetchLogs());
        
        // Pour la vue 'Mon Profil' : on déclenche spécifiquement les données qui s'y trouvent
        // (loadMyProfile() est déclenché par switchView('my-profile'))
        if (currentView === 'my-profile') {
            // loadMyProfile(); // <-- Cette ligne est bien commentée/retirée, car switchView() le fait
            tasks.push(fetchPayrollData());    // On va chercher les bulletins de paie de l'utilisateur
            tasks.push(fetchLeaveRequests());  // On va chercher les demandes de congés de l'utilisateur
        }
        
        // Pour les managers/admin (ceux qui ne sont pas 'EMPLOYEE'),
        // on charge leurs demandes de congés à valider et le tracker en direct.
        // Ce bloc est séparé du 'my-profile' pour éviter les confusions de rôle.
        if (currentUser.role !== 'EMPLOYEE') {
            tasks.push(fetchLeaveRequests()); // Pour les demandes en attente du manager
            tasks.push(triggerRobotCheck());  // Robot de surveillance des retours de congés
            tasks.push(fetchLiveAttendance()); // Tracker de présence en direct
        }
        // Il n'y a plus de `else` ici car toutes les conditions sont gérées par les `if` précédents.

        // On attend que toutes les requêtes asynchrones soient terminées
        await Promise.all(tasks);
        
        // Mise à jour finale de l'interface du Dashboard si on est dessus
        if (currentView === 'dash') renderCharts();

        if(force) {
            const Toast = Swal.mixin({toast: true, position: 'top-end', showConfirmButton: false, timer: 2000});
            Toast.fire({icon: 'success', title: 'Données à jour !'});
        }

    } catch (error) {
        console.error("Erreur Sync:", error); // Log l'erreur pour le débogage
    } finally {
        // Enlève l'icône de chargement après un petit délai
        if(icon) setTimeout(() => icon.classList.remove('fa-spin'), 500);
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

        // 3. MAPPING (TON CODE ORIGINAL CONSERVÉ TEL QUEL)
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

    // --- 2. FILTRAGE LOCAL (Recherche / Chips) ---
    let filteredEmployees = employees;
    if (typeof currentFilter !== 'undefined' && currentFilter !== 'all') {
        filteredEmployees = employees.filter(e => {
            const search = currentFilter.toLowerCase();
            return (e.statut || "").toLowerCase().includes(search) || (e.dept || "").toLowerCase().includes(search);
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
        let actionCell = "";
        if (canManage) {
            const isSigned = (String(e.contract_status || '').toLowerCase().trim() === 'signé');
            const safeId = escapeHTML(e.id);

            actionCell = `
            <td class="px-8 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                    <button onclick="openFullFolder('${safeId}')" title="Dossier" class="p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-500 hover:text-white transition-all"><i class="fa-solid fa-folder-open"></i></button>
                    <div class="h-4 w-[1px] bg-slate-200 mx-1"></div>
                    ${!isSigned ? `
                        <button onclick="generateDraftContract('${safeId}')" title="Brouillon" class="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"><i class="fa-solid fa-file-contract"></i></button>
                        <button onclick="openContractModal('${safeId}')" title="Signer" class="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><i class="fa-solid fa-pen-nib"></i></button>
                        <button onclick="triggerManualContractUpload('${safeId}')" title="Scan" class="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"><i class="fa-solid fa-file-arrow-up"></i></button>
                    ` : `<span class="text-[10px] font-black text-emerald-500 uppercase bg-emerald-50 px-2 py-1 rounded">Signé</span>`}
                    <div class="h-4 w-[1px] bg-slate-200 mx-1"></div>
                    <button onclick="printBadge('${safeId}')" class="text-slate-400 hover:text-blue-600 transition-all"><i class="fa-solid fa-print"></i></button>
                    <button onclick="openEditModal('${safeId}')" class="text-slate-400 hover:text-slate-800 transition-all"><i class="fa-solid fa-pen"></i></button>
                </div>
            </td>`;
        }

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
        Swal.fire({ title: 'Chargement...', text: 'Récupération des données en cours', didOpen: () => Swal.showLoading() });
    } else {
        if(container) container.innerHTML = '<div class="flex justify-center p-4"><i class="fa-solid fa-circle-notch fa-spin text-indigo-500"></i></div>';
    }

    try {
        const url = `${URL_READ_REPORT}?agent=${encodeURIComponent(currentUser.nom)}&requester_id=${encodeURIComponent(currentUser.id)}&mode=${mode}&period=${period}`;
        const r = await secureFetch(url);
        const rawReports = await r.json();

        // --- DEBUT : NORMALISATION DES DONNÉES POUR L'EXPORT ET L'AFFICHAGE ---
        const cleanReports = rawReports.map(rep => {
            // Récupère la valeur du nom (gère les listes)
            let nomRaw = rep.nom || rep['nom (from Employé)'] || rep.Employé || 'Inconnu';
            let nomAffiche = Array.isArray(nomRaw) ? nomRaw[0] : nomRaw;

            // Retourne un objet avec des clés simples et sans accents
            return {
                mois: rep.mois || rep['Mois/Année'] || '-',
                nom: nomAffiche,
                jours: rep.jours || rep['Jours de présence'] || 0,
                heures: rep.heures || rep['Total Heures'] || 0,
                statut: rep.Statut || 'Clôturé',
                // Pour le rapport "Today" :
                heure_arrivee: rep.heure || rep.Heure || '--:--',
                zone: rep.zone || rep.Zone || 'Bureau'
            };
        });
        // --- FIN : NORMALISATION ---
        
        if (mode === 'GLOBAL') {
            let tableHtml = '';
            
            if (period === 'today') {
                // --- RAPPORT JOURNALIER ---
                const totalActifs = employees.filter(e => e.statut === 'Actif').length;
                const presents = cleanReports.length; // <-- UTILISE cleanReports
                const taux = totalActifs > 0 ? Math.round((presents / totalActifs) * 100) : 0;

                tableHtml = `
                    <div class="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <div class="text-center sm:text-left">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taux de présence (Actifs)</p>
                            <h3 class="text-2xl font-black text-indigo-600">${presents} / ${totalActifs} <span class="text-sm text-slate-400">Présents</span></h3>
                        </div>
                        <div class="w-16 h-16 rounded-full border-4 border-indigo-100 flex items-center justify-center font-black text-indigo-600 bg-white shadow-sm">${taux}%</div>
                        <button onclick="downloadReportCSV('${period}')" class="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase shadow hover:bg-emerald-700 transition-all flex items-center gap-2"><i class="fa-solid fa-file-csv"></i> Excel</button>
                    </div>
                    <div class="overflow-x-auto max-h-[50vh]">
                        <table class="w-full text-left whitespace-nowrap">
                            <thead class="bg-slate-100 text-[10px] uppercase font-black text-slate-500 sticky top-0">
                                <tr><th class="p-3">Employé</th><th class="p-3 text-center">Arrivée</th><th class="p-3 text-center">Zone</th><th class="p-3 text-right">Statut</th></tr>
                            </thead>
                            <tbody class="divide-y divide-slate-50 text-xs">
                `;

                // UTILISE cleanReports ICI
                cleanReports.forEach(item => {
                    let hAffiche = item.heure_arrivee.match(/(\d{2}:\d{2})/) ? item.heure_arrivee.match(/(\d{2}:\d{2})/)[1] : item.heure_arrivee;

                    tableHtml += `
                        <tr>
                            <td class="p-3 font-bold text-slate-700">${item.nom}</td>
                            <td class="p-3 text-center font-mono text-blue-600">${hAffiche}</td>
                            <td class="p-3 text-center text-slate-500">${item.zone}</td>
                            <td class="p-3 text-right"><span class="bg-emerald-50 text-emerald-600 px-2 py-1 rounded font-bold text-[9px]">PRÉSENT</span></td>
                        </tr>
                    `;
                });
                
                if(cleanReports.length === 0) tableHtml += `<tr><td colspan="4" class="p-10 text-center text-slate-400 italic">Aucun pointage aujourd'hui.</td></tr>`;

            } else {
                // --- RAPPORT MENSUEL ---
                tableHtml = `
                    <div class="flex justify-end mb-4">
                        <button onclick="downloadReportCSV('${period}')" class="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase shadow hover:bg-emerald-700 transition-all flex items-center gap-2"><i class="fa-solid fa-file-csv"></i> Télécharger Cumul</button>
                    </div>
                    <div class="overflow-x-auto max-h-[60vh]">
                        <table class="w-full text-left whitespace-nowrap">
                            <thead class="bg-slate-100 text-[10px] uppercase font-black text-slate-500 sticky top-0">
                                <tr><th class="p-3">Mois</th><th class="p-3">Employé</th><th class="p-3 text-center">Jours Prés.</th><th class="p-3 text-center">Heures Tot.</th><th class="p-3 text-right">Statut</th></tr>
                            </thead>
                            <tbody class="divide-y divide-slate-50 text-xs">
                `;

                // UTILISE cleanReports ICI
                cleanReports.forEach(item => {
                    tableHtml += `
                        <tr>
                            <td class="p-3 font-bold text-slate-700">${item.mois}</td>
                            <td class="p-3 font-medium">${item.nom}</td>
                            <td class="p-3 text-center font-bold text-slate-800">${item.jours}</td>
                            <td class="p-3 text-center font-mono text-blue-600">${item.heures}h</td>
                            <td class="p-3 text-right"><span class="bg-emerald-50 text-emerald-600 px-2 py-1 rounded font-bold text-[9px]">Clôturé</span></td>
                        </tr>`;
                });
                if(cleanReports.length === 0) tableHtml += `<tr><td colspan="5" class="p-10 text-center text-slate-400 italic">Aucune donnée mensuelle trouvée.</td></tr>`;
            }

            tableHtml += `</tbody></table></div>`;
            Swal.fire({
                title: period === 'today' ? 'Pointages du Jour' : 'Rapport Mensuel',
                html: tableHtml,
                width: '850px',
                confirmButtonText: 'Fermer',
                confirmButtonColor: '#0f172a'
            });
            currentReportData = cleanReports; // <-- ENREGISTRE LES DONNÉES NORMALISÉES
        } else {
            // Mode Personnel (Mon Profil)
            renderPersonalReport(cleanReports, container); // <-- UTILISE cleanReports
        }
    } catch (e) {
        console.error("Erreur rapport:", e);
        Swal.fire('Erreur', "Impossible de charger les données du serveur.", 'error');
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



            function updateClockUI(isIn) {
                const btn = document.getElementById('btn-clock');
                const dot = document.getElementById('clock-status-dot');
                const text = document.getElementById('clock-status-text');
                if(!btn) return; 
                if (isIn) {
                    btn.classList.remove('bg-emerald-500', 'hover:bg-emerald-400');
                    btn.classList.add('bg-red-500', 'hover:bg-red-400');
                    btn.innerHTML = '<i class="fa-solid fa-person-walking-arrow-right"></i> <span>SORTIE</span>';
                    dot.classList.remove('bg-red-500'); dot.classList.add('bg-emerald-500', 'shadow-emerald-500/50');
                    text.innerText = "EN POSTE"; text.classList.add('text-emerald-500'); text.classList.remove('text-slate-800');
                } else {
                    btn.classList.remove('bg-red-500', 'hover:bg-red-400');
                    btn.classList.add('bg-emerald-500', 'hover:bg-emerald-400');
                    btn.innerHTML = '<i class="fa-solid fa-fingerprint"></i> <span>ENTRÉE</span>';
                    dot.classList.remove('bg-emerald-500'); dot.classList.add('bg-red-500', 'shadow-red-500/50');
                    text.innerText = "NON POINTÉ"; text.classList.remove('text-emerald-500'); text.classList.add('text-slate-800');
                }
            }










async function syncClockInterface() {
    if (!currentUser || !currentUser.id) return;
    const userId = currentUser.id;

    try {
        const response = await fetch(`${SIRH_CONFIG.apiBaseUrl}/get-clock-status?employee_id=${userId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('sirh_token')}` }
        });
        const data = await response.json();

        // On met à jour la mémoire locale
        localStorage.setItem(`clock_status_${userId}`, data.status);
        localStorage.setItem(`clock_in_done_${userId}`, data.in_done);
        localStorage.setItem(`clock_out_done_${userId}`, data.out_done);

        const isMobile = data.employee_type === 'MOBILE';

        // LOGIQUE D'AFFICHAGE DU BOUTON
        if (data.status === 'IN') {
            updateClockUI(true); // Bouton Rouge (SORTIE)
        } else {
            updateClockUI(false); // Bouton Vert (ENTRÉE)
            
            // SI JOURNÉE TERMINÉE (Fixe ou Mobile ayant validé sa dernière sortie)
            if (data.out_done) { 
                const btn = document.getElementById('btn-clock');
                const text = document.getElementById('clock-status-text');
                if(btn) {
                    btn.innerHTML = '<i class="fa-solid fa-check-double"></i> <span>TERMINÉ</span>';
                    btn.classList.replace('bg-emerald-50', 'bg-slate-400'); 
                    btn.classList.replace('bg-emerald-500', 'bg-slate-400'); // Sécurité couleur
                }
                if(text) text.innerText = "JOURNÉE CLÔTURÉE";
            }
        }
    } catch (e) { console.error(e); }
}


async function handleClockInOut() {
    const userId = currentUser.id;
    const today = new Date().toLocaleDateString('fr-CA');
    
    const empData = employees.find(e => e.id === userId);
    const isMobile = (empData?.employee_type === 'MOBILE') || (currentUser?.employee_type === 'MOBILE');
    
    const lastActionDate = localStorage.getItem(`clock_date_${userId}`);
    if (lastActionDate !== today) {
        localStorage.setItem(`clock_date_${userId}`, today);
        localStorage.setItem(`clock_status_${userId}`, 'OUT');
        localStorage.setItem(`clock_in_done_${userId}`, 'false');
        localStorage.setItem(`clock_out_done_${userId}`, 'false');
        updateClockUI(false); 
    }

    const currentStatus = localStorage.getItem(`clock_status_${userId}`) || 'OUT';
    const action = (currentStatus === 'IN') ? 'CLOCK_OUT' : 'CLOCK_IN';

    // Sécurité pour les fixes
    if (!isMobile) {
        const inDone = localStorage.getItem(`clock_in_done_${userId}`) === 'true';
        const outDone = localStorage.getItem(`clock_out_done_${userId}`) === 'true';
        if (inDone && outDone) return Swal.fire('Terminé', 'Votre journée est clôturée.', 'success');
        if (action === 'CLOCK_IN' && inDone) return Swal.fire('Oups', 'Entrée déjà validée.', 'info');
    }

    let outcome = null;
    let report = null;
    let proofStream = null;
    let proofBlob = null; 
    let isLastExit = false;
    let presentedProducts = []; // --- AJOUT PRODUITS : Variable pour stocker la sélection ---

    // --- BLOC CAMÉRA LIVE POUR LA SORTIE MOBILE ---
    if (action === 'CLOCK_OUT' && isMobile) {
        
        // --- AJOUT PRODUITS : Récupération de la liste des produits avant d'ouvrir le pop-up ---
        let products = [];
        try {
            const prodRes = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/list-products`);
            products = await prodRes.json();
        } catch (e) { console.error("Erreur chargement produits", e); }

        // --- AJOUT PRODUITS : Génération du HTML des miniatures ---
        let productsHtml = products.map(p => `
            <label class="cursor-pointer group">
                <input type="checkbox" name="presented_prods" value="${p.id}" data-name="${p.name}" class="peer sr-only">
                <div class="p-2 border border-slate-200 rounded-xl flex flex-col items-center gap-1 peer-checked:border-blue-500 peer-checked:bg-blue-50 transition-all hover:border-blue-200">
                    <img src="${p.photo_url || 'https://via.placeholder.com/50'}" class="w-10 h-10 object-cover rounded-lg">
                    <span class="text-[7px] font-black uppercase text-slate-500 text-center leading-tight">${p.name}</span>
                </div>
            </label>
        `).join('');

        const { value: formValues } = await Swal.fire({
            title: 'Fin de visite',
            html: `
                <div class="text-left mb-2">
                    <label class="text-[10px] font-black text-slate-400 uppercase">Résultat de la visite</label>
                    <select id="swal-outcome" class="swal2-input mt-1">
                        <option value="VU">✅ Visite effectuée</option>
                        <option value="ABSENT">❌ Médecin Absent</option>
                        <option value="COMMANDE">💰 Commande prise</option>
                        <option value="RAS">👍 Passage simple</option>
                    </select>
                </div>

                <!-- --- AJOUT PRODUITS : Zone de sélection --- -->
                <p class="text-[9px] font-black text-slate-400 uppercase mb-2 mt-4 text-left">Produits présentés (Cochez)</p>
                <div class="grid grid-cols-4 gap-2 mb-4 max-h-40 overflow-y-auto p-1 custom-scroll">
                    ${productsHtml || '<p class="text-[10px] text-slate-400 col-span-4 italic text-center">Aucun produit actif dans le catalogue</p>'}
                </div>

                <div class="bg-slate-900 rounded-xl overflow-hidden relative mb-4 border-2 border-slate-200" style="height: 220px;">
                    <video id="proof-video" autoplay playsinline class="w-full h-full object-cover"></video>
                    <img id="proof-image" class="w-full h-full object-cover hidden absolute top-0 left-0">
                    <canvas id="proof-canvas" class="hidden"></canvas>
                    <div class="absolute bottom-2 left-0 right-0 flex justify-center gap-2 z-10">
                        <button type="button" id="btn-snap" class="bg-white text-slate-900 px-4 py-1 rounded-full text-xs font-bold shadow-lg">CAPTURER LE CACHET</button>
                        <button type="button" id="btn-retry" class="hidden bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">REFAIRE</button>
                    </div>
                </div>

                <div class="relative mt-2">
                    <textarea id="swal-report" class="swal2-textarea" style="height: 80px; margin-top:0;" placeholder="Écrivez vos notes ici..."></textarea>
                    <button type="button" onclick="toggleDictation('swal-report', this)" 
                        class="absolute bottom-3 right-3 p-2 rounded-full bg-white border border-slate-200 text-slate-400 shadow-sm hover:text-blue-600 transition-all z-10">
                        <i class="fa-solid fa-microphone"></i>
                    </button>
                </div>
            
                <div class="mt-4 p-3 bg-red-50 rounded-xl border border-red-100 flex items-center gap-3">
                    <input type="checkbox" id="last-exit-check" class="w-5 h-5 accent-red-600">
                    <label for="last-exit-check" class="text-[10px] font-black text-red-700 uppercase text-left">C'est ma dernière sortie (Fin de journée)</label>
                </div>
            `,
            confirmButtonText: 'Valider & Sortir',
            confirmButtonColor: '#ef4444',
            allowOutsideClick: false,
            didOpen: () => {
                const video = document.getElementById('proof-video');
                const img = document.getElementById('proof-image');
                const canvas = document.getElementById('proof-canvas');
                const btnSnap = document.getElementById('btn-snap');
                const btnRetry = document.getElementById('btn-retry');

                navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                    .then(stream => { proofStream = stream; video.srcObject = stream; })
                    .catch(err => Swal.showValidationMessage("Caméra bloquée"));

                btnSnap.onclick = () => {
                    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
                    canvas.getContext('2d').drawImage(video, 0, 0);
                    canvas.toBlob(blob => {
                        proofBlob = blob;
                        img.src = URL.createObjectURL(blob);
                        video.classList.add('hidden'); img.classList.remove('hidden');
                        btnSnap.classList.add('hidden'); btnRetry.classList.remove('hidden');
                    }, 'image/jpeg', 0.8);
                };

                btnRetry.onclick = () => {
                    proofBlob = null; video.classList.remove('hidden');
                    img.classList.add('hidden'); btnSnap.classList.remove('hidden');
                    btnRetry.classList.add('hidden');
                };
            },
            willClose: () => { if(proofStream) proofStream.getTracks().forEach(t => t.stop()); },
preConfirm: () => {
                const outcomeVal = document.getElementById('swal-outcome').value;
                
                // 1. Vérification de la photo (Obligatoire si VU)
                if (outcomeVal === 'VU' && !proofBlob) {
                    Swal.showValidationMessage('📸 Photo du cachet obligatoire !');
                    return false;
                }

                // 2. --- AJOUT PRODUITS : Collecte des cases cochées ---
                // On transforme la NodeList en Array pour utiliser .map
                const selected = Array.from(document.querySelectorAll('input[name="presented_prods"]:checked')).map(i => ({
                    id: i.value,
                    name: i.dataset.name || "Produit" // Sécurité si le nom manque
                }));

                // 3. Retour de l'objet complet
                return { 
                    outcome: outcomeVal, 
                    report: document.getElementById('swal-report').value,
                    isLastExit: document.getElementById('last-exit-check').checked,
                    presentedProducts: selected // <-- On retourne bien le tableau
                };
            }
        });
if (!formValues) return; 

        outcome = formValues.outcome;
        report = formValues.report;
        isLastExit = formValues.isLastExit;
        presentedProducts = formValues.presentedProducts; 

        if (proofBlob) {
            Swal.update({ text: 'Compression de la photo en cours...' });
            proofBlob = await compressImage(proofBlob);
        }
    } // <--- Fermeture du bloc if (action === 'CLOCK_OUT')
    
    // --- POINTAGE GPS & ENVOI ---
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
        
        if (outcome) fd.append('outcome', outcome);
        if (report) fd.append('report', report);
        if (proofBlob) fd.append('proof_photo', proofBlob, 'capture.jpg');
        if (isLastExit) fd.append('is_last_exit', 'true');
        
        // --- CORRECTION ICI : Le nom doit être 'presentedProducts' pour matcher le serveur ---
        if (presentedProducts && presentedProducts.length > 0) {
            fd.append('presentedProducts', JSON.stringify(presentedProducts));
        }

        const response = await secureFetch(URL_CLOCK_ACTION, { method: 'POST', body: fd });
        const resData = await response.json();

        if (response.ok) {
            if (isLastExit) localStorage.setItem(`clock_out_done_${userId}`, 'true');
            syncClockInterface();
            Swal.fire('Succès', `Pointage validé : ${resData.zone}`, 'success');
        } else { throw new Error(resData.error); }
    } catch (e) { Swal.fire('Erreur', e.message, 'error'); }
}




    function openFullFolder(id) {
        const e = employees.find(x => x.id === id); if(!e) return;
        
        document.getElementById('folder-photo').src = formatGoogleLink(e.photo) || 'https://via.placeholder.com/150';
        document.getElementById('folder-name').innerText = e.nom; 
        document.getElementById('folder-id').innerText = "MATRICULE : " + e.matricule;
        document.getElementById('folder-poste').innerText = e.poste; 
        document.getElementById('folder-dept').innerText = e.dept;
        document.getElementById('folder-email').innerText = e.email || "Non renseigné"; 
        document.getElementById('folder-phone').innerText = e.telephone || "Non renseigné";
        document.getElementById('folder-address').innerText = e.adresse || "Non renseignée";
        
        if(e.date) { 
            let sD = parseDateSmart(e.date); 
            document.getElementById('folder-start').innerText = sD.toLocaleDateString('fr-FR'); 
            let eD = new Date(sD); eD.setDate(eD.getDate() + (parseInt(e.limit) || 365)); 
            document.getElementById('folder-end').innerText = eD.toLocaleDateString('fr-FR'); 
        }
        
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

 
    // DANS LA FONCTION openFullFolder(id)

        docs.forEach(doc => { 
            const hasLink = doc.link && doc.link.length > 5; 
            const safeLabel = doc.label.replace(/'/g, "\\'");

            // --- RÈGLE DE GESTION ---
            // Admin, RH et Manager ont le droit de modifier les dossiers des autres
            const canEdit = (currentUser.role === 'ADMIN' || currentUser.role === 'RH' || currentUser.role === 'MANAGER');

            grid.innerHTML += `
                <div class="p-4 rounded-2xl border ${hasLink ? 'bg-white shadow-sm border-slate-200' : 'bg-slate-100 opacity-50'} flex items-center justify-between group">
                    <div class="flex items-center gap-3">
                        <div class="p-2.5 rounded-xl bg-${doc.color}-50 text-${doc.color}-600"><i class="fa-solid ${doc.icon}"></i></div>
                        <p class="text-xs font-bold text-slate-700">${doc.label}</p>
                    </div>
                    <div class="flex gap-2">
                        <!-- BOUTON VOIR -->
                        ${hasLink ? `<button onclick="viewDocument('${doc.link}', '${safeLabel}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Consulter"><i class="fa-solid fa-eye"></i></button>` : ''}
                        
                        <!-- BOUTON MODIFIER (Pour les chefs) -->
                        ${canEdit ? `
                        <button onclick="updateSingleDoc('${doc.key}', '${e.id}')" class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Modifier">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>` : ''}
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




async function fetchProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    grid.innerHTML = '<div class="col-span-full text-center p-10"><i class="fa-solid fa-circle-notch fa-spin text-blue-500 text-3xl"></i></div>';

    try {
        const r = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/list-products`);
        const products = await r.json();
        
        grid.innerHTML = '';
        if (products.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center text-slate-400 py-10 italic border-2 border-dashed rounded-[2rem]">Catalogue vide.</div>';
            return;
        }

        products.forEach(p => {
            // Utilise p.photo_url car c'est le nom dans ta base Supabase
            const img = p.photo_url ? p.photo_url : 'https://via.placeholder.com/150';
            
            grid.innerHTML += `
                <div class="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all">
                    <div class="h-48 bg-slate-50 relative">
                        <img src="${img}" class="w-full h-full object-cover">
                        ${(currentUser.role === 'ADMIN') ? `<button onclick="deleteProduct('${p.id}')" class="absolute top-3 right-3 w-8 h-8 bg-white/90 text-red-500 rounded-full shadow-lg"><i class="fa-solid fa-trash"></i></button>` : ''}
                    </div>
                    <div class="p-6">
                        <h4 class="font-black text-slate-800 uppercase text-sm">${p.name}</h4>
                        <p class="text-[10px] text-slate-400 mt-2 line-clamp-3">${p.description || ''}</p>
                    </div>
                </div>`;
        });
    } catch (e) { console.error(e); }
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
    console.log("🚀 DÉBUT fetchMyActivityRecap");
    
    const visitContainer = document.getElementById('my-today-visits');
    const dailyContainer = document.getElementById('my-month-dailies');
    if(!visitContainer) return;

    visitContainer.innerHTML = '<div class="text-center py-4"><i class="fa-solid fa-spinner fa-spin text-blue-500"></i></div>';

    try {
        // 1. On force le rafraîchissement avec un timestamp (?t=...) pour contourner le cache
        const timeHack = Date.now();
        const [visRes, daiRes] = await Promise.all([
            secureFetch(`${SIRH_CONFIG.apiBaseUrl}/read-visit-reports?limit=1000&t=${timeHack}`), 
            secureFetch(`${SIRH_CONFIG.apiBaseUrl}/read-daily-reports?limit=100&t=${timeHack}`)
        ]);

        const allVisits = await visRes.json();
        const allDailies = await daiRes.json();
        
        // 2. On calcule la date du jour LOCALE (Bénin)
        const now = new Date();
        const todayLocal = now.toLocaleDateString(); // ex: "19/02/2026"
        const currentMonthLocal = (now.getMonth() + 1) + "/" + now.getFullYear(); // ex: "2/2026"

        console.log("📅 DATE AUJOURD'HUI (Local) :", todayLocal);
        console.log("👤 ID UTILISATEUR CONNECTÉ :", currentUser.id);

        // 3. Filtrage avec logs détaillés
        const myVisits = (allVisits.data || allVisits).filter(v => {
            // Est-ce que c'est moi ?
            if (v.employee_id !== currentUser.id) return false;

            // Conversion de la date de visite
            const visitDateObj = new Date(v.check_in);
            const visitDateLocal = visitDateObj.toLocaleDateString();
            
            // LOG pour voir pourquoi ça échoue
            // console.log(`🔍 Test Visite ${v.lieu_nom} : ${visitDateLocal} vs ${todayLocal}`);

            return visitDateLocal === todayLocal;
        });

        console.log(`✅ VISITES TROUVÉES : ${myVisits.length}`);

        // 4. Affichage Visites
        if (myVisits.length > 0) {
            visitContainer.innerHTML = myVisits.map(v => `
                <div class="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100 mb-2">
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

        // 5. Filtrage Bilans
        const myDailies = (allDailies.data || allDailies).filter(d => {
            if (d.employee_id !== currentUser.id) return false;
            const dDate = new Date(d.report_date);
            const dMonth = (dDate.getMonth() + 1) + "/" + dDate.getFullYear();
            return dMonth === currentMonthLocal;
        });

        console.log(`✅ BILANS TROUVÉS : ${myDailies.length}`);

        // Affichage Bilans
        if (myDailies.length > 0) {
            dailyContainer.innerHTML = myDailies.map(d => `
                <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-2">
                    <p class="text-[9px] font-black text-slate-500 mb-1">${new Date(d.report_date).toLocaleDateString()}</p>
                    <p class="text-[10px] text-slate-600 italic line-clamp-1">${d.summary}</p>
                </div>
            `).join('');
        } else {
            dailyContainer.innerHTML = '<div class="text-center py-6 border border-dashed rounded-xl"><p class="text-[10px] text-slate-400 italic">0 bilan ce mois-ci.</p></div>';
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
    
    // --- CHARGEMENTS AUTOMATIQUES CORRIGÉS ---
    
    // 1. Dashboard (Statistiques et Live Tracker)
    if (v === 'dash') {
        renderCharts();
        fetchLiveAttendance();
    }

    // 2. Collaborateurs (Affichage de la liste)
    if (v === 'employees') {
        renderData();
    }

                        // Dans app.js, modifie switchView
            if (v === 'catalog') {
                fetchProducts(); // <--- C'est ça qui recharge la liste quand on clique
            }

    if (v === 'maintenance') {
        // Pas de chargement automatique nécessaire pour l'instant
        // On pourrait ajouter fetchServerStats() ici dans le futur (Vision 20 ans)
    }
            
    if (v === 'accounting') loadAccountingView();

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

    if(window.innerWidth < 768) { 
        const sb = document.getElementById('sidebar'); 
        if(!sb.classList.contains('-translate-x-full')) toggleSidebar(); 
    }

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







            function toggleSidebar(){const sb=document.getElementById('sidebar'), o=document.getElementById('sidebar-overlay'); if(sb.classList.contains('-translate-x-full')){sb.classList.remove('-translate-x-full');o.classList.remove('hidden');}else{sb.classList.add('-translate-x-full');o.classList.add('hidden');}}
        


          
        
            function parseDateSmart(d){if(!d)return new Date();if(!isNaN(d)&&!String(d).includes('/'))return new Date((d-25569)*86400000);if(String(d).includes('/')){const p=d.split('/'); return new Date(p[2],p[1]-1,p[0]);}return new Date(d);}
            
            
            function convertToInputDate(dStr){if(!dStr) return ""; if(dStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dStr; if(dStr.includes('/')){const p=dStr.split('/'); return `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`;} return "";}
            
    

async function openEditModal(id) {
    // 1. ON TROUVE L'EMPLOYÉ EN PREMIER (Ligne déplacée en haut)
    const e = employees.find(x => x.id === id);
    
    if (e) {
        // 2. On affiche la modale
        document.getElementById('edit-modal').classList.remove('hidden');
        document.getElementById('edit-id-hidden').value = id;

        // 3. Charger la liste des managers
        await populateManagerSelects(); 

        // 4. Maintenant on peut utiliser 'e' sans erreur
        const mgrSelect = document.getElementById('edit-manager');
        if(mgrSelect) mgrSelect.value = e.manager_id || "";
    
        const scopeInput = document.getElementById('edit-scope');
        if(scopeInput) scopeInput.value = (e.scope || []).join(', ');

        // Remplissage des autres champs
        document.getElementById('edit-type').value = e.employee_type || 'OFFICE';
        document.getElementById('edit-statut').value = e.statut || 'Actif';
        
        const roleSelect = document.getElementById('edit-role');
        if(roleSelect) roleSelect.value = e.role || 'EMPLOYEE';
        
        const deptSelect = document.getElementById('edit-dept');
        if(deptSelect) deptSelect.value = e.dept || 'IT & Tech';

        const typeSelect = document.getElementById('edit-type-contrat');
        if(typeSelect) typeSelect.value = e.limit || '365';
        
        const dateInput = document.getElementById('edit-start-date');
        if (dateInput) {
            dateInput.value = e.date ? convertToInputDate(e.date) : new Date().toISOString().split('T')[0];
        }

        const initCheck = document.getElementById('edit-init-check');
        if(initCheck) initCheck.checked = false;
    }
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
        
        // Récupération des valeurs
        const statut = document.getElementById('edit-statut').value;
        const role = document.getElementById('edit-role') ? document.getElementById('edit-role').value : 'EMPLOYEE';
        const dept = document.getElementById('edit-dept') ? document.getElementById('edit-dept').value : '';
        const typeContrat = document.getElementById('edit-type-contrat').value;
        const typeActivité = document.getElementById('edit-type').value;

        
        // NOUVEAU : Récupération Date & Checkbox
        const newStartDate = document.getElementById('edit-start-date').value;
        const forceInit = document.getElementById('edit-init-check').checked;

        Swal.fire({title: 'Mise à jour...', text: 'Synchronisation...', allowOutsideClick: false, didOpen: () => Swal.showLoading()}); 
            const managerId = document.getElementById('edit-manager').value;
            const scopeVal = document.getElementById('edit-scope').value;
            const scopeArray = scopeVal ? scopeVal.split(',').map(s=>s.trim()) : [];
        // Construction propre des paramètres pour Supabase
        const params = new URLSearchParams({
            id: id,
            agent: currentUser.nom,
            statut: statut,
            role: role,
            dept: dept,
            limit: typeContrat,
            start_date: newStartDate,
            employee_type: typeActivité, 
            force_init: forceInit,
            manager_id: managerId,
            scope: JSON.stringify(scopeArray) // On encode le tableau
        });

        try {
            const response = await secureFetch(`${URL_UPDATE}?${params.toString()}`);
            if(response.ok) {
                closeEditModal(); 
                await Swal.fire('Succès', 'Contrat et dossier mis à jour', 'success'); 

                // Mise à jour globale (Liste + Graphiques + Stats)
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
            optionsHtml += `<option value="${tpl.role_target}">${tpl.label} (pour ${tpl.role_target})</option>`;
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
    if (currentUser.role === 'EMPLOYEE') return;

    try {
        const r = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/live-attendance`);
        const data = await r.json();

        // Mise à jour des compteurs
        document.getElementById('live-presents-count').innerText = data.presents.length;
        document.getElementById('live-partis-count').innerText = data.partis.length;
        document.getElementById('live-absents-count').innerText = data.absents.length;

        // Fonction pour générer les petits avatars
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






async function applyModulesUI() {
    const response = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/read-modules`);
    const modules = await response.json();

    modules.forEach(mod => {
        // On cherche tous les éléments liés au module (ex: MOD_MOBILE_WORKFORCE)
        document.querySelectorAll(`[data-module="${mod.module_key}"]`).forEach(el => {
            if (mod.is_active) {
                el.style.display = ''; // Montre
            } else {
                el.remove(); // SUPPRIME carrément l'élément du menu (plus propre que 'none')
            }
        });
    });
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
        if (!url || url === '#' || url === 'null') {
            return Swal.fire('Oups', 'Aucun document disponible.', 'info');
        }

        const isHtmlFile = url.toLowerCase().includes('.html');
        let htmlContent = "";

        if (isHtmlFile) {
            try {
                const response = await fetch(url);
                htmlContent = await response.text();
            } catch (e) {
                console.error("Erreur de lecture:", e);
            }
        }

        Swal.fire({
            title: `<span class="text-sm font-bold uppercase text-slate-500">${title || 'Document'}</span>`,
            html: `
                <div class="flex justify-end gap-2 mb-2">
                    ${isHtmlFile ? `
                        <button onclick="downloadHtmlAsPdf('${url}', '${title}')" class="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase shadow-sm flex items-center gap-2">
                            <i class="fa-solid fa-file-pdf"></i> Télécharger PDF
                        </button>
                    ` : ''}
                </div>
                <div class="rounded-xl overflow-hidden border border-slate-200 bg-slate-100" style="height: 70vh;">
                    ${isHtmlFile ? 
                        `<iframe id="iframe-html-viewer" width="100%" height="100%" style="border:none;"></iframe>` : 
                        `<iframe src="${url}" width="100%" height="100%" style="border:none;" allow="autoplay"></iframe>`
                    }
                </div>
                <div class="mt-2 text-right">
                    <a href="javascript:void(0)" onclick="openHtmlInNewWindow('${url}')" class="text-xs font-bold text-blue-600 hover:underline">
                        <i class="fa-solid fa-external-link-alt"></i> Ouvrir dans une nouvelle fenêtre
                    </a>
                </div>
            `,
            width: '80%',
            showConfirmButton: true,
            confirmButtonText: 'Fermer',
            confirmButtonColor: '#0f172a',
            padding: '1rem',
            didOpen: () => {
                if (isHtmlFile && htmlContent) {
                    const iframe = document.getElementById('iframe-html-viewer');
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    iframeDoc.open();
                    iframeDoc.write(htmlContent);
                    iframeDoc.close();
                }
            }
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

    Swal.fire({
        title: 'Génération en cours...',
        text: 'Préparation du document Word...',
        didOpen: () => Swal.showLoading()
    });

    try {
        const token = localStorage.getItem('sirh_token');
        // On fait un fetch avec le token dans le header pour la sécurité
        const response = await fetch(`${URL_CONTRACT_GENERATE}?id=${id}&token=${token}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Erreur lors de la génération");
        }

        // On récupère le fichier (Blob)
        const blob = await response.blob();
        
        // On crée un lien invisible pour forcer le téléchargement
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Contrat_${e.nom.replace(/\s+/g, '_')}.docx`; // Nom du fichier
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        Swal.close();
        const Toast = Swal.mixin({toast: true, position: 'top-end', showConfirmButton: false, timer: 3000});
        Toast.fire({ icon: 'success', title: 'Document téléchargé' });

    } catch (error) {
        console.error(error);
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
        const response = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/list-departments`);
        const depts = await response.json();

        // On prépare le HTML
        const optionsHtml = depts.map(d => `<option value="${d.code}">${d.label}</option>`).join('');
        const defaultOpt = `<option value="">-- Choisir un département --</option>`;

        // On remplit les deux selects (Création et Edition)
        const fDept = document.getElementById('f-dept');
        const editDept = document.getElementById('edit-dept');

        if (fDept) fDept.innerHTML = defaultOpt + optionsHtml;
        if (editDept) editDept.innerHTML = defaultOpt + optionsHtml;
        
        console.log("✅ Départements synchronisés");
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



async function submitSignedContract() { 
        // On vérifie si l'employé a dessiné quelque chose
        if (!signaturePad || signaturePad.isEmpty()) { 
            return Swal.fire('Attention', 'Veuillez apposer votre signature avant de valider.', 'warning'); 
        }

        const id = document.getElementById('contract-id-hidden').value; 
        
        // MAGIE : On transforme le dessin en texte Base64
        const signatureBase64 = signaturePad.toDataURL(); 

        Swal.fire({ 
            title: 'Signature en cours...', 
            text: 'Incrustation de votre signature dans le contrat PDF', 
            didOpen: () => Swal.showLoading(),
            allowOutsideClick: false
        }); 

        try { 
            // On envoie le texte de la signature à ton Webhook au lieu du fichier
            const r = await secureFetch(URL_UPLOAD_SIGNED_CONTRACT, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, // INDISPENSABLE pour Supabase/Node
                body: JSON.stringify({ 
                    id: id, 
                    signature: signatureBase64, 
                    agent: currentUser.nom 
                }) 
            }); 
            
            if (r.ok) { 
                // On récupère le HTML du contrat signé renvoyé par le serveur
                const signedHtml = await r.text();

                Swal.fire('Succès', 'Le contrat a été signé numériquement et archivé avec succès.', 'success'); 
                closeContractModal(); 
                refreshAllData(true); 

                // OUVERTURE AUTOMATIQUE DU CONTRAT SIGNÉ (Comme avant)
                const win = window.open("", "_blank");
                win.document.write(signedHtml);
                win.document.close();
            } 
        } catch (e) { 
            console.error(e);
            Swal.fire('Erreur', "Échec technique lors de la signature : " + e.message, 'error'); 
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

    // Gestion du document (Preview ou Image)
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

    // 2. AFFICHAGE DU POP-UP HORIZONTAL
    Swal.fire({
        width: '850px', // Plus large pour le mode horizontal
        padding: '0',
        showConfirmButton: true,
        confirmButtonText: 'Fermer la fiche',
        confirmButtonColor: '#0f172a',
        customClass: { popup: 'rounded-[2rem] overflow-hidden' },
        html: `
            <div class="flex flex-col md:flex-row text-left bg-white">
                
                <!-- COLONNE GAUCHE : INFOS (35%) -->
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

                <!-- COLONNE DROITE : MOTIF & DOC (65%) -->
                <div class="w-full md:w-[65%] p-8 flex flex-col justify-between">
                    <div>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Argumentaire / Motif</p>
                        
                        <!-- ZONE DE TEXTE AVEC SCROLL INTERNE -->
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
                if(videoStream) videoStream.getTracks().forEach(t => t.stop());
                if(contractStream) contractStream.getTracks().forEach(t => t.stop());


                localStorage.removeItem('sirh_last_view');
                // NETTOYAGE COMPLET
                localStorage.removeItem('sirh_token');
                localStorage.removeItem('sirh_user_session'); // Supprime l'identité sauvegardée
                location.reload();
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
    // CORRECTION 1 : On ne bloque plus les employés ici !
    if (!currentUser) return; 

    const body = document.getElementById('leave-requests-body');       // Tableau Manager
    const section = document.getElementById('manager-leave-section');  // Section Manager
    const myBody = document.getElementById('my-leave-requests-body');  // Tableau Personnel

    // Fonction de nettoyage interne
    const normalize = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    try {
        const r = await secureFetch(`${URL_READ_LEAVES}?agent=${encodeURIComponent(currentUser.nom)}`);
        const rawLeaves = await r.json();

        // Mapping des données
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
                // RÉCUPÉRATION DU SOLDE (Vient de la jointure serveur)
                solde: l.solde_actuel || 0 
            };
        });

// ============================================================
        // PARTIE 1 : TABLEAU DE VALIDATION (POUR MANAGER / ADMIN / RH)
        // ============================================================
        if (currentUser.role !== 'EMPLOYEE') {
            const pending = allLeaves.filter(l => l.statut === 'en attente');

            if (body && section) {
                // FORCE LE BLOC À RESTER VISIBLE
                section.classList.remove('hidden'); 
                body.innerHTML = '';

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

                        // Logique de couleur pour le solde
                        const soldeColor = l.solde <= 5 ? 'text-orange-600' : 'text-emerald-600';

                        body.innerHTML += `
                            <tr class="border-b hover:bg-slate-50 transition-colors">
                                <td class="px-8 py-4">
                                    <div class="font-bold text-sm text-slate-700">${l.nom || 'Inconnu'}</div>
                                    <!-- AJOUT DU SOLDE ICI -->
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
                                    <button onclick="processLeave('${l.id}', 'Validé', ${daysDifference})" class="bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-md shadow-emerald-200">OUI</button>
                                    <button onclick="processLeave('${l.id}', 'Refusé', 0)" class="bg-white text-red-500 border border-red-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase">NON</button>
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
        // ============================================================
        // PARTIE 2 : HISTORIQUE PERSONNEL (POUR TOUT LE MONDE)
        // ============================================================
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
                            <a id="external-link-btn" href="${firstDocUrl || '#'}" target="_blank" class="bg-white/90 backdrop-blur text-slate-700 px-3 py-1.5 rounded-lg te
xt-[10px] font-bold shadow-sm border hover:text-blue-600 transition-all flex items-center gap-1">
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
        customClass: { popup: 'rounded-[1.5rem]', htmlContainer: '!m-0' },
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
                        <p class="text-[10px] text-emerald-600 font-black uppercase tracking-wide bg-emerald-50 inline-block px-2 py-1 rounded">${montant}</p>
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
                e.id,
                e.nom,
                e.poste,
                e.dept,
                e.statut,
                e.email || "",
                e.telephone || "",
                e.date || "",
                e.limit
            ];
            
            // Nettoyage des données pour éviter les bugs de virgules/guillemets
            const cleanRow = row.map(val => `"${String(val).replace(/"/g, '""')}"`);
            csvContent += cleanRow.join(";") + "\n";
        });

        // 3. Créer le fichier et le télécharger
        // Utilisation du BOM UTF-8 (\ufeff) pour que Excel affiche bien les accents (é, à, etc.)
        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        
        const dateStr = new Date().toLocaleDateString().replace(/\//g, "-");
        
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


    let deferredPrompt;
    const installBtn = document.getElementById('install-button');

    window.addEventListener('beforeinstallprompt', (e) => {
        // Empêche Chrome d'afficher le pop-up automatique
        e.preventDefault();
        // Garde l'événement pour plus tard
        deferredPrompt = e;
        // Affiche notre bouton personnalisé
        installBtn.classList.remove('hidden');

        installBtn.addEventListener('click', async () => {
            // Affiche le vrai pop-up d'installation
            deferredPrompt.prompt();
            // Attend la réponse de l'utilisateur
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                console.log('L\'utilisateur a installé l\'app');
            }
            // On cache le bouton car l'installation est faite ou demandée
            installBtn.classList.add('hidden');
            deferredPrompt = null;
        });
    });

    // Cache le bouton si l'app est déjà installée
    window.addEventListener('appinstalled', () => {
        installBtn.classList.add('hidden');
        deferredPrompt = null;
    });



    // Variable temporaire pour stocker les données du rapport affiché
    let currentReportData = [];

    function downloadReportCSV(period = 'monthly') {
    if (!currentReportData || currentReportData.length === 0) {
        return Swal.fire('Erreur', 'Aucune donnée à exporter.', 'warning');
    }

    let headers = [];
    let csvContent = "";

    if (period === 'today') {
        // En-têtes pour le rapport du jour
        headers = ["Employe", "Heure Arrivee", "Zone", "Statut"];
        csvContent = headers.join(";") + "\n";
        
        currentReportData.forEach(row => {
            const clean = (text) => String(text).replace(/;/g, ",").replace(/\n/g, " ");
            let heureAffichee = row.heure_arrivee.match(/(\d{2}:\d{2})/) ? row.heure_arrivee.match(/(\d{2}:\d{2})/)[1] : row.heure_arrivee;
            
            const rowData = [
                clean(row.nom),
                clean(heureAffichee),
                clean(row.zone),
                'PRÉSENT' 
            ];
            const cleanRow = rowData.map(val => `"${String(val).replace(/"/g, '""')}"`);
            csvContent += cleanRow.join(";") + "\n";
        });
        
    } else {
        // En-têtes pour le rapport mensuel (Ton code qui marche bien)
        headers = ["Mois/Annee", "Employe", "Jours Presence", "Total Heures", "Statut"];
        csvContent = headers.join(";") + "\n";

        currentReportData.forEach(row => {
            const clean = (text) => String(text).replace(/;/g, ",").replace(/\n/g, " ");
            
            const rowData = [
                clean(row.mois),
                clean(row.nom),
                clean(row.jours),
                clean(row.heures).replace('h', ''), 
                clean(row.statut)
            ];
            const cleanRow = rowData.map(val => `"${String(val).replace(/"/g, '""')}"`);
            csvContent += cleanRow.join(";") + "\n";
        });
    }

    // 3. Créer le fichier et le télécharger
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    const dateStr = new Date().toLocaleDateString('fr-FR').replace(/\//g, "-");
    link.setAttribute("href", url);
    link.setAttribute("download", `Rapport_Presence_${dateStr}.csv`);
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



    function loadAccountingView() {
    const body = document.getElementById('accounting-table-body');
    body.innerHTML = '';

    employees.filter(e => e.statut === 'Actif').forEach((emp, index) => {
        body.innerHTML += `
            <tr class="hover:bg-blue-50/30 transition-all">
                <td class="px-6 py-4">
                    <div class="font-bold text-slate-800">${emp.nom}</div>
                    <div class="text-[10px] text-slate-400 font-mono">${emp.poste}</div>
                </td>
                <td class="px-4 py-4">
                    <input type="number" oninput="calculateRow(${index})" id="base-${index}" class="pay-base w-full p-2 bg-slate-50 rounded-lg text-center font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-500" value="0">
                </td>
                <td class="px-4 py-4">
                    <input type="number" oninput="calculateRow(${index})" id="prime-${index}" class="pay-prime w-full p-2 bg-slate-50 rounded-lg text-center font-bold outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500" value="0">
                </td>
                <td class="px-4 py-4">
                    <input type="number" oninput="calculateRow(${index})" id="tax-${index}" class="pay-tax w-full p-2 bg-slate-50 rounded-lg text-center font-bold outline-none focus:bg-white focus:ring-2 focus:ring-red-500" value="0">
                </td>
                <td class="px-6 py-4 text-right">
                    <div class="text-lg font-black text-blue-600" id="net-${index}" 
                        data-id="${emp.id}" data-nom="${emp.nom}" data-poste="${emp.poste}">0 CFA</div>
                </td>
            </tr>
        `;
    });
}

// Fonction de calcul en temps réel
function calculateRow(index) {
    const base = parseInt(document.getElementById(`base-${index}`).value) || 0;
    const prime = parseInt(document.getElementById(`prime-${index}`).value) || 0;
    const tax = parseInt(document.getElementById(`tax-${index}`).value) || 0;
    
    const net = base + prime - tax;
    const display = document.getElementById(`net-${index}`);
    display.innerText = new Intl.NumberFormat('fr-FR').format(net) + " CFA";
    display.dataset.net = net;
    display.dataset.base = base;
    display.dataset.prime = prime;
    display.dataset.tax = tax;
}

async function generateAllPay() {
    const mois = document.getElementById('pay-month').value;
    const annee = document.getElementById('pay-year').value;
    const records = [];

    document.querySelectorAll('[id^="net-"]').forEach(el => {
        const netValue = parseInt(el.dataset.net) || 0;
        if (netValue > 0) {
            records.push({
                id: el.dataset.id,
                nom: el.dataset.nom,
                poste: el.dataset.poste,
                mois: mois, annee: annee,
                salaire_base: el.dataset.base,
                primes: el.dataset.prime,
                retenues: el.dataset.tax,
                salaire_net: netValue
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
    console.log("🛠️ Application des permissions UI (Correction Indépendance)...", safePerms);

    // ÉTAPE 1 : Gérer la visibilité de CHAQUE ÉLÉMENT individuellement
    // On ne se limite plus aux "buttons", on prend tout ce qui a [data-perm]
    document.querySelectorAll('[data-perm]').forEach(el => {
        const key = el.getAttribute('data-perm');
        
        if (safePerms[key] === true) {
            // On réinitialise le display pour laisser le CSS (Flex/Block) reprendre le dessus
            el.style.display = ''; 
            el.classList.remove('hidden'); 
        } else {
            // On force la disparition sans affecter les voisins
            el.style.display = 'none';
        }
    });

    // ÉTAPE 2 : Gérer la visibilité des GROUPES DE MENUS ( menu-group )
    // On vérifie s'il reste au moins un élément visible (public ou autorisé)
    document.querySelectorAll('.menu-group').forEach(group => {
        // On cible la zone qui contient les boutons (ex: m-perso-content)
        const contentArea = group.querySelector('[id$="-content"]');
        
        if (contentArea) {
            // On regarde TOUS les enfants directs de la zone de contenu
            const children = Array.from(contentArea.children);
            
            // Le groupe reste visible si au moins un de ses enfants n'est pas en "display: none"
            const hasVisibleContent = children.some(child => {
                return window.getComputedStyle(child).display !== 'none';
            });

            if (hasVisibleContent) {
                group.style.display = ''; // On laisse le groupe (titre + boutons) visible
            } else {
                group.style.display = 'none'; // On cache tout si le groupe est devenu vide
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






async function handleCSVFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    Swal.fire({ title: 'Analyse intelligente...', text: 'Mappage des colonnes en cours', didOpen: () => Swal.showLoading() });

    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");
        if (lines.length < 2) return Swal.fire('Erreur', 'Le fichier est vide ou mal formé.', 'error');

        // 1. Détection du délimiteur (; ou ,)
        const firstLine = lines[0];
        const delimiter = firstLine.includes(';') ? ';' : ',';
        const headers = firstLine.split(delimiter).map(h => h.trim().toLowerCase());

        // 2. Mapping automatique (On cherche les index des colonnes)
        const map = {
            name: headers.findIndex(h => h.includes('nom') || h.includes('name') || h.includes('lieu') || h.includes('pharmacie')),
            lat: headers.findIndex(h => h.includes('lat')),
            lon: headers.findIndex(h => h.includes('lon') || h.includes('long')),
            zone: headers.findIndex(h => h.includes('zone') || h.includes('secteur')),
            addr: headers.findIndex(h => h.includes('adresse') || h.includes('addr'))
        };

        // Vérification minimale : il faut au moins Nom, Lat et Lon
        if (map.name === -1 || map.lat === -1 || map.lon === -1) {
            return Swal.fire('Erreur de format', 'Impossible de trouver les colonnes obligatoires (Nom, Latitude, Longitude).', 'error');
        }

        const locations = [];

        // 3. Lecture des données
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(delimiter);
            if (cols.length < 3) continue;

            const lat = parseFloat(cols[map.lat]?.replace(',', '.'));
            const lon = parseFloat(cols[map.lon]?.replace(',', '.'));

            if (!isNaN(lat) && !isNaN(lon)) {
                locations.push({
                    name: cols[map.name].trim(),
                    latitude: lat,
                    longitude: lon,
                    zone_name: map.zone !== -1 ? (cols[map.zone]?.trim() || 'GENERALE') : 'GENERALE',
                    address: map.addr !== -1 ? (cols[map.addr]?.trim() || '') : '',
                    is_active: true,
                    radius: 50 // Rayon par défaut
                });
            }
        }

        // 4. Envoi au serveur
        if (locations.length > 0) {
            try {
                const response = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/import-locations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ locations })
                });

                Swal.close();
                if (response.ok) {
                    Swal.fire('Succès !', `${locations.length} lieux importés avec succès.`, 'success');
                    fetchMobileLocations(); // Rafraîchit la grille
                }
            } catch (err) {
                Swal.fire('Échec', err.message, 'error');
            }
        } else {
            Swal.fire('Oups', 'Aucune donnée valide trouvée dans le fichier.', 'warning');
        }
    };
    reader.readAsText(file);
    // On reset l'input pour pouvoir ré-importer le même fichier si besoin
    event.target.value = "";
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

async function handleZonesCSVFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    Swal.fire({ title: 'Analyse...', text: 'Mappage des sièges en cours', didOpen: () => Swal.showLoading() });

    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");
        if (lines.length < 2) return Swal.fire('Erreur', 'Fichier vide', 'error');

        const delimiter = lines[0].includes(';') ? ';' : ',';
        const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());

        // Mapping des colonnes
        const map = {
            nom: headers.findIndex(h => h.includes('nom') || h.includes('siege') || h.includes('office')),
            lat: headers.findIndex(h => h.includes('lat')),
            lon: headers.findIndex(h => h.includes('lon') || h.includes('long')),
            rayon: headers.findIndex(h => h.includes('rayon') || h.includes('radius'))
        };

        if (map.nom === -1 || map.lat === -1 || map.lon === -1) {
            return Swal.fire('Format incorrect', 'Colonnes Nom, Latitude et Longitude obligatoires.', 'error');
        }

        const zones = [];
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(delimiter);
            if (cols.length < 3) continue;

            zones.push({
                nom: cols[map.nom].trim(),
                latitude: parseFloat(cols[map.lat].replace(',', '.')),
                longitude: parseFloat(cols[map.lon].replace(',', '.')),
                rayon: map.rayon !== -1 ? parseInt(cols[map.rayon]) : 100,
                actif: true
            });
        }

        if (zones.length > 0) {
            try {
                const response = await secureFetch(`${SIRH_CONFIG.apiBaseUrl}/import-zones`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ zones })
                });

                if (response.ok) {
                    Swal.fire('Succès !', `${zones.length} sièges importés.`, 'success');
                    fetchZones(); // Rafraîchit la grille
                }
            } catch (err) {
                Swal.fire('Échec', err.message, 'error');
            }
        }
    };
    reader.readAsText(file);
    event.target.value = ""; // Reset input
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
    
    reportPage = page;
    container.innerHTML = '<div class="col-span-full text-center p-10"><i class="fa-solid fa-circle-notch fa-spin text-blue-500 text-3xl"></i></div>';

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
            // --- VISITES (Onglet 1) ---
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
                            <table class="w-full text-left border-collapse">
                                <thead class="bg-slate-100 border-b">
                                    <tr class="text-[9px] font-black text-slate-400 uppercase">
                                        <th class="p-4 w-1/4">Lieu visité</th>
                                        <th class="p-4 w-1/4">Heure</th>
                                        <th class="p-4 w-1/4 text-center">Preuve</th>
                                        <th class="p-4 w-1/4 text-right">Note (Toucher pour lire)</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">`;
               
visits.forEach(v => {
                    // --- LOGIQUE DE NETTOYAGE ULTIME ---
                    let productsList = [];
                    let raw = v.presented_products;

                    // 1. On transforme le gros bloc en tableau
                    if (typeof raw === 'string') {
                        try { productsList = JSON.parse(raw); } catch(e) { productsList = []; }
                    } else if (Array.isArray(raw)) {
                        productsList = raw;
                    }

                    // 2. On nettoie CHAQUE élément du tableau un par un
                    // C'est ici que ça coinçait : parfois les éléments sont eux-mêmes du texte JSON
                    let prodsHtml = "";
                    if (productsList && productsList.length > 0) {
                        prodsHtml = `<div class="flex flex-wrap gap-1 mt-1">` + 
                            productsList.map(p => {
                                let item = p;
                                
                                // Si l'élément est une chaine de caractères qui ressemble à du JSON, on la parse encore
                                if (typeof item === 'string' && item.trim().startsWith('{')) {
                                    try { item = JSON.parse(item); } catch(e) {}
                                }

                                // Maintenant on cherche le nom (Majuscule ou Minuscule)
                                let finalName = "Produit";
                                if (typeof item === 'object' && item !== null) {
                                    finalName = item.NAME || item.name || item.Name || "Inconnu";
                                } else {
                                    finalName = item; // C'est juste du texte simple
                                }

                                return `<span class="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[8px] border border-blue-100 font-black uppercase tracking-tighter">${finalName}</span>`;
                            }).join('') + 
                        `</div>`;
                    }

                    // --- RENDU HTML ---
                    html += `
                        <tr id="row-vis-${v.id}" class="hover:bg-white transition-colors group">
                            <td class="px-4 py-3 align-top">
                                <div class="text-xs font-bold text-blue-600 uppercase break-words">${v.lieu_nom || 'Inconnu'}</div>
                                ${prodsHtml} <!-- PRODUITS PROPRES -->
                            </td>
                            <td class="px-4 py-3 align-top text-[10px] font-mono text-slate-500">${v.check_in ? new Date(v.check_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</td>
                            <td class="px-4 py-3 align-top text-center">
                                ${v.proof_url ? `<button onclick="viewDocument('${v.proof_url}', 'Cachet')" class="text-emerald-500 hover:scale-110 transition-transform"><i class="fa-solid fa-camera-retro text-lg"></i></button>` : '<i class="fa-solid fa-ban text-slate-200"></i>'}
                            </td>
                            <td class="px-4 py-3 align-top text-right relative">
                                <div class="text-[10px] text-slate-400 italic line-clamp-1 cursor-pointer transition-all duration-300"
                                     onmouseenter="peakText(this)" 
                                     onmouseleave="unpeakText(this)" 
                                     onclick="toggleTextFixed(this)"
                                     data-fixed="false">
                                    ${v.notes || 'R.A.S'}
                                </div>
                                <div class="flex justify-end gap-2 mt-2">
                                    <button onclick="event.stopPropagation(); deleteVisitReport('${v.id}')" class="text-slate-200 hover:text-red-500 transition-colors"><i class="fa-solid fa-trash-can text-xs"></i></button>
                                </div>
                            </td>
                        </tr>`;
                });
                html += `</tbody></table></div></div>`;
            }
            html += `</div>`;
        } 
else {
            // --- BILANS JOURNALIERS (Onglet 2) ---
            const groupedDaily = {};
            
            // 1. D'abord, on regroupe les données par nom d'agent
            data.forEach(rep => {
                const name = rep.employees?.nom || "Agent Inconnu";
                if (!groupedDaily[name]) groupedDaily[name] = [];
                groupedDaily[name].push(rep);
            });

            html = `<div class="col-span-full space-y-3">`;

            // 2. Ensuite, on génère l'affichage pour chaque groupe
            for (const [name, reports] of Object.entries(groupedDaily)) {
                const accordionId = `acc-day-${name.replace(/\s+/g, '-')}`;
                const hasStockAlert = reports.some(rp => rp.needs_restock);

                html += `
                    <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-visible animate-fadeIn">
                        <!-- En-tête Accordéon -->
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

                        <!-- Contenu Accordéon -->
                        <div id="${accordionId}" class="hidden border-t border-slate-100 bg-slate-50/50">
                            <table class="w-full text-left">
                                <tbody class="divide-y divide-slate-100">`;
                
                // 3. Boucle sur les rapports de cet agent spécifique
                reports.forEach(rep => {
                    // --- CALCUL DES STATS PRODUITS (Intégré ici) ---
                    let statsHtml = "";
                    if (rep.products_stats && Object.keys(rep.products_stats).length > 0) {
                        statsHtml = `<div class="flex flex-wrap gap-1 mt-2">`;
                        for (const [prodName, count] of Object.entries(rep.products_stats)) {
                            statsHtml += `<span class="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[8px] font-black border border-indigo-100 uppercase">${prodName} <span class="text-indigo-400">x${count}</span></span>`;
                        }
                        statsHtml += `</div>`;
                    } else {
                        statsHtml = `<div class="mt-1 text-[8px] text-slate-300 italic">Aucun produit détecté</div>`;
                    }

                    // --- GÉNÉRATION DE LA LIGNE ---
                    html += `
                        <tr id="row-daily-${rep.id}" class="hover:bg-white transition-colors group relative">
                            <td class="px-6 py-4 w-1/4 align-top">
                                <div class="text-[10px] font-black text-indigo-500 uppercase">${new Date(rep.report_date).toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'long'})}</div>
                                ${statsHtml} <!-- Insertion des stats ici -->
                                <div class="text-center mt-2 text-left">${rep.needs_restock ? '<span class="text-orange-500 text-[10px] font-bold"><i class="fa-solid fa-box-open"></i> REAPPRO</span>' : '<span class="text-emerald-400 text-[10px]">OK</span>'}</div>
                            </td>
                            
                            <!-- ZONE DE TEXTE INTELLIGENTE -->
                            <td class="px-6 py-4 w-2/4 align-top relative">
                                <div class="text-xs text-slate-600 italic line-clamp-1 cursor-pointer transition-all duration-300"
                                     onmouseenter="peakText(this)" 
                                     onmouseleave="unpeakText(this)" 
                                     onclick="toggleTextFixed(this)"
                                     data-fixed="false">
                                    ${rep.summary || "Aucun texte."}
                                </div>
                            </td>

                            <td class="px-6 py-4 w-1/4 align-top text-right">
                                <div class="flex items-center justify-end gap-3">
                                    ${rep.photo_url ? `<button onclick="viewDocument('${rep.photo_url}', 'Cahier')" class="text-blue-500 hover:scale-125 transition-transform"><i class="fa-solid fa-file-image text-lg"></i></button>` : '<i class="fa-solid fa-ban text-slate-200"></i>'}
                                    <button onclick="deleteDailyReport('${rep.id}')" class="text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><i class="fa-solid fa-check"></i></button>
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

// --- SYSTÈME DE LECTURE INTELLIGENTE DES NOTES ---

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


// 3. AUDIT GLOBAL
async function fetchGlobalAudit() {
    const container = document.getElementById('reports-list-container');
    const counterEl = document.getElementById('stat-visites-total');
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
        if(labelEl) labelEl.innerText = "VISITES CUMULÉES (ÉQUIPE)";
        const totalEquipe = data.reduce((acc, row) => acc + row.total_visites, 0);
        if(counterEl) counterEl.innerText = totalEquipe;
        renderAuditTable(data);
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div class="col-span-full text-center text-red-500 py-10 font-bold">Erreur synthèse.</div>';
    }
}

function renderAuditTable(data) {
    const container = document.getElementById('reports-list-container');
    let html = `<div class="col-span-full bg-white rounded-[2.5rem] shadow-xl border overflow-hidden animate-fadeIn mb-10"><div class="p-6 border-b flex justify-between items-center bg-slate-50"><div><h3 class="font-black text-slate-800 uppercase text-sm">Audit Global d'Activité</h3></div><button onclick="exportAuditToExcel()" class="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg">EXPORTER EXCEL</button></div><div class="overflow-x-auto"><table class="w-full text-left"><thead class="bg-slate-900 text-white text-[10px] uppercase font-bold"><tr><th class="px-6 py-5">Collaborateur</th><th class="px-6 py-5 text-center">Visites</th><th class="px-6 py-5">Lieux visités</th><th class="px-6 py-5 text-center">Absences</th><th class="px-6 py-5">Dernière Obs.</th></tr></thead><tbody class="divide-y divide-slate-100">`;
    data.forEach(row => {
        html += `<tr class="hover:bg-blue-50/50"><td class="px-6 py-4"><div class="font-bold text-slate-800 uppercase text-xs">${row.nom}</div><div class="text-[9px] text-slate-400 font-mono">${row.matricule}</div></td><td class="px-6 py-4 text-center"><span class="bg-blue-600 text-white px-3 py-1 rounded-full font-black text-xs">${row.total_visites}</span></td><td class="px-6 py-4 text-[10px] text-slate-600 max-w-xs truncate">${row.detail_lieux}</td><td class="px-6 py-4 text-center"><span class="text-red-600 font-bold text-[10px]">${row.jours_absence} JOURS</span></td><td class="px-6 py-4 text-[10px] text-slate-500 italic max-w-xs truncate">${row.dernier_rapport}</td></tr>`;
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
    const counterEl = document.getElementById('stat-visites-total');
    const labelEl = document.getElementById('stat-report-label');
    
    let sumVisits = 0;
    let resultsCount = 0;

    rows.forEach(row => {
        // On récupère le texte du nom (colonne 1) et du matricule pour la recherche
        const agentInfo = row.cells[0].innerText.toLowerCase();
        
        // On cible précisément le chiffre dans la bulle bleue (colonne 2)
        const visitCount = parseInt(row.cells[1].querySelector('span').innerText) || 0;

        if (agentInfo.includes(term)) {
            row.style.display = "";
            sumVisits += visitCount; // On additionne les vraies visites
            resultsCount++;
        } else {
            row.style.display = "none";
        }
    });

    // --- MISE À JOUR DE L'INTERFACE ---
    if (counterEl) counterEl.innerText = sumVisits;

    if (labelEl) {
        if (term.length > 0) {
            labelEl.innerText = `RÉSULTAT POUR "${term.toUpperCase()}"`;
            labelEl.classList.add('text-blue-400'); // Change la couleur pour alerter que c'est un filtre
        } else {
            labelEl.innerText = "VISITES CUMULÉES (ÉQUIPE)";
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



















































