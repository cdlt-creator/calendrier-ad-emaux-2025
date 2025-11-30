// ------------------------------------------------------------------------------------------------------
// ⚠️ IMPORTANT : REMPLACEZ CETTE CHAÎNE PAR L'URL DE DÉPLOIEMENT DE VOTRE APPS SCRIPT (Web App URL)
// ------------------------------------------------------------------------------------------------------
const APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxWrdi9dEkmfFFgSnLRYuJpEgM-oTB3Zq3Z6WVrrvV3MgSUo-qtZXpN976-A4iAOcBs/exec'; 

console.log("Script Calendrier AD Émaux chargé.");

// -------------------------------------------------------------------------------------------------------
// FONCTIONS ASYNCHRONES / TRAITEMENT DU FORMULAIRE (DOIVENT ÊTRE EN HAUT)
// -------------------------------------------------------------------------------------------------------
async function submitToGSheet(dayNumber, userEmail, userResponse, isCorrect, rgpdConsent) {
    const formData = new FormData();
    formData.append('dayNumber', dayNumber);
    formData.append('userEmail', userEmail);
    formData.append('userAnswer', userResponse);
    formData.append('correct', isCorrect ? 'Oui' : 'Non');
    formData.append('rgpd_consent', rgpdConsent ? 'Oui' : 'Non'); 

    try {
        await fetch(APP_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', 
            body: formData
        });
        return { success: true };

    } catch (error) {
        console.error("Erreur lors de l'envoi des données à Google Sheets :", error);
        return { success: false, error: error.message };
    }
}


// FONCTION : Traitement du formulaire
async function handleFormSubmit(e, data) {
    e.preventDefault();
    const form = e.target;
    const email = form.querySelector('input[name="email"]').value;
    const selectedOption = form.querySelector(`input[name="reponse_jour_${data.day}"]:checked`);
    const rgpd = form.querySelector('input[name="rgpd_consent"]').checked;

    if (!selectedOption) {
        alert("Veuillez sélectionner une réponse.");
        return;
    }
    
    const hp = form.querySelector('input[name="hp_field"]').value;
    if (hp) {
        console.warn("Honeypot activé. Soumission ignorée.");
        return; 
    }


    const userResponse = selectedOption.value;
    const isCorrect = (userResponse === data.correctAnswer);

    const submitBtn = form.querySelector('.btn-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi en cours...';

    const submissionResult = await submitToGSheet(data.day, email, userResponse, isCorrect, rgpd); 
    
    submitBtn.disabled = false;
    submitBtn.textContent = 'Je valide et participe';


    if (!submissionResult.success) {
        alert("Une erreur de connexion est survenue. Votre participation n'a peut-être pas été enregistrée. Veuillez réessayer.");
        return; 
    }

    // --- SUCCÈS : GESTION LOCALE ET VISUELLE ---

    localStorage.setItem(`door_${data.day}_submitted`, 'true');
    const door = document.getElementById(`day-${data.day}`);
    if (door) {
        door.classList.add('submitted');
        
        const doorFront = door.querySelector('.door-front');
        doorFront.innerHTML = `
            <div class="submitted-content">
                <img src="${data.image}" alt="Aperçu jour ${data.day}" class="submitted-preview-img">
                <small>✅ Répondu</small>
            </div>
        `;
        
        const doorBack = door.querySelector('.door-back');
        doorBack.innerHTML = `<img src="${data.image}" alt="Image du jour ${data.day}" style="width:100%; height:100%; object-fit:cover;">`;
    }

    // --- AFFICHAGE DU MESSAGE DE CONFIRMATION ---
    
    const correctAnswerValue = data.correctAnswer;
    const correctOption = data.options.find(opt => opt.value === correctAnswerValue);
    const correctAnswerText = correctOption ? correctOption.text : 'Réponse non trouvée'; 

    const mainPopupContent = document.getElementById('popup-quiz-content');
    let messageContent = '';

    if (isCorrect) {
        messageContent = `
            <h4 style="color: green;">🎉 Bravo ! Bonne Réponse !</h4>
            <p>Votre participation est enregistrée.</p>
            <p style="font-size: 0.9em; margin-top: 20px;">Rendez-vous demain pour une nouvelle question !</p>
        `;
    } else {
        messageContent = `
            <h4 style="color: var(--primary-marine);">Dommage !</h4>
            <p>La bonne réponse était : <strong>${correctAnswerText}</strong></p>
            <p>Votre participation est enregistrée. Tentez à nouveau votre chance demain !</p>
        `;
    }

    mainPopupContent.innerHTML = `
        <a href="#" class="close-btn" onclick="closePopup()" style="position: absolute; top: 15px; right: 25px;">&times;</a>
        <div style="padding: 40px; text-align: center;">
            ${messageContent}
            <button onclick="closePopup()" class="cta-button" style="margin-top: 30px;">Fermer</button>
        </div>
    `;
}


// FONCTION : Construire et ouvrir la Pop-up
function openPopupWithData(data) {
    const popupContent = document.getElementById('popup-quiz-content');
    const overlay = document.getElementById('door-overlay');

    // --- GESTION SPÉCIFIQUE DU JOUR 25 ---
    if (data.day === 25) {
        
        popupContent.innerHTML = `
            <a href="#" class="close-btn" onclick="closePopup()">&times;</a>
            <div class="winner-announcement" style="text-align: center; padding: 40px;">
                <h2 style="color: var(--accent-gold); font-family: 'Playfair Display', serif; font-size: 2.5em; margin-bottom: 0;">Joyeux Noël ! 🎉</h2>
                <h1 style="color: var(--primary-marine); font-family: 'Playfair Display', serif; font-size: 3em; margin-top: 5px; margin-bottom: 30px;">Jour du Grand Tirage au Sort</h1>
                
                <p style="font-size: 1.2em; margin-bottom: 20px; font-weight: bold;">
                    Merci à tous d'avoir participé à notre Calendrier de l'Avent !
                </p>
                
                <div style="padding: 20px; background-color: var(--light-bg); border: 2px solid var(--accent-gold); border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                    <p style="font-size: 1.2em; margin: 5px 0;">Le tirage au sort aura lieu ce **25 décembre**.</p>
                    <p style="font-size: 1.2em; margin: 5px 0; font-weight: 700; color: var(--primary-marine);">Le gagnant sera contacté personnellement par e-mail début janvier !</p>
                </div>
                
                <p style="margin-top: 30px; font-style: italic; font-size: 0.9em;">Bonnes fêtes de fin d'année à tous.</p>
                
                <button onclick="closePopup()" class="cta-button" style="margin-top: 30px;">Fermer</button>
            </div>
        `;
        overlay.classList.add('active');
        return; 
    }
    
    // Génération des boutons radio HTML
    let optionsHTML = '';
    data.options.forEach((opt) => {
        optionsHTML += `
            <label>
                <input type="radio" name="reponse_jour_${data.day}" value="${opt.value}" required>
                ${opt.text}
            </label>
        `;
    });

    // Injection du HTML dynamique 
    popupContent.innerHTML = `
        <img src="${data.image}" alt="Image jour ${data.day}">
        <h4>${data.title} (Jour ${data.day})</h4>
        <p style="font-weight:bold; margin-bottom:15px;">${data.question}</p>
        
        <form id="current-quiz-form" class="quiz-form" data-day="${data.day}">
            <div class="quiz-options">
                ${optionsHTML}
            </div>
            
            <input type="text" name="hp_field" class="honeypot" tabindex="-1" autocomplete="off">
            <input type="email" name="email" placeholder="Votre e-mail (obligatoire)" required>

            <div class="rgpd-checkbox-container">
                <input type="checkbox" id="rgpd_check" name="rgpd_consent" value="true" required> 
                <label for="rgpd_check">J'accepte d'être recontacté(e) et de recevoir la newsletter.</label>
            </div>

            <button type="submit" class="btn-submit">Je valide et participe</button>
            <small>Réponse correcte = 1 chance de gagner.</small>
        </form>
    `;

    // Afficher la pop-up
    overlay.classList.add('active');

    // Gérer la soumission du formulaire généré
    const form = document.getElementById('current-quiz-form');
    form.addEventListener('submit', async function(e) {
        await handleFormSubmit(e, data); 
    });
}


// FONCTION DE CLIC PRINCIPALE
const doorClickHandler = function(e) {
    const doorElement = e.currentTarget; 
    const day = parseInt(doorElement.dataset.day);

    if (doorElement.classList.contains('locked') || doorElement.classList.contains('submitted')) {
        return;
    }

    const data = qcmData.find(d => d.day === day); 

    if (data) {
        openPopupWithData(data); 
    } else {
        console.error("Aucune donnée trouvée pour le jour " + day + ". Veuillez vérifier qcm_data.js.");
    }
};


// -------------------------------------------------------------------------------------------------------
// BLOC D'INITIALISATION DU DOM 
// -------------------------------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const doors = document.querySelectorAll('.door');
    
    const currentDay = 25; // Mode test, à remplacer par new Date().getDate(); 

    doors.forEach(door => {
        const day = parseInt(door.dataset.day);
        
        // 1. GESTION DU VERROUILLAGE/DEVERROUILLAGE
        if (day > currentDay) {
             door.classList.add('locked');
        } else {
             door.classList.add('unlocked');
        }

        // 2. GESTION DES SOUMISSIONS
        if (localStorage.getItem(`door_${day}_submitted`) === 'true') {
            door.classList.add('submitted');
            
            const data = qcmData.find(d => d.day === day);
            if (data) {
                const doorFront = door.querySelector('.door-front');
                doorFront.innerHTML = `
                    <div class="submitted-content">
                        <img src="${data.image}" alt="Aperçu jour ${day}" class="submitted-preview-img">
                        <small>✅ Répondu</small>
                    </div>
                `;
                const doorBack = door.querySelector('.door-back');
                doorBack.innerHTML = `<img src="${data.image}" alt="Image du jour ${day}" style="width:100%; height:100%; object-fit:cover;">`;
            }
        }

        // 3. Ajout des écouteurs de clic
        door.addEventListener('click', doorClickHandler);
    });
}); // <--- FIN CORRECTE DU DOMContentLoaded

// -------------------------------------------------------------------------------------------------------
// FONCTIONS GLOBALES (DÉFINIES EN DEHORS DE DOMContentLoaded POUR ÊTRE ACCESSIBLES PAR LE HTML)
// -------------------------------------------------------------------------------------------------------

window.closePopup = function() {
    document.getElementById('door-overlay').classList.remove('active');
};

window.closePopupIfClickedOutside = function(e) {
    const targetId = e.target.id;
    if (targetId === 'door-overlay') {
        window.closePopup();
    } else if (targetId === 'reglement-overlay') {
        window.closeReglement();
    } 
    // gdpr-info-overlay ne doit pas se fermer ici
};


window.openReglement = function() {
    document.getElementById('reglement-overlay').classList.add('active');
};

window.closeReglement = function() {
    document.getElementById('reglement-overlay').classList.remove('active');
};

window.resetCalendar = function() {
    if (confirm("Attention : Réinitialiser tout le calendrier ? Cette action ne supprime pas les entrées déjà enregistrées dans le Google Sheet.")) {
        localStorage.clear();
        location.reload();
    }
};
    
window.openGdprInfo = function() {
    document.getElementById('gdpr-info-overlay').classList.add('active');
};

window.acceptGdprInfo = function() {
    localStorage.setItem('hasAcceptedGdprInfo', 'true'); 
    document.getElementById('gdpr-info-overlay').classList.remove('active');
};
