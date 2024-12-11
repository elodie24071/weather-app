const apiKey = '4449c22514a546208bd144247240212';
const villeInput = document.getElementById('ville');
const conditionDuJour = document.getElementById('conditiondujour');
const degre = document.querySelector('.degre p');
const iconMeteo = document.querySelector('.icon_meteo img');
const dateElement = document.querySelector('.date p:first-child');
const dateDetailElement = document.querySelector('.date p:last-child');

// Fonction MAJ affichage météo
function updateWeatherDisplay(data) {
    const temp = data.current.temp_c;
    const condition = data.current.condition.text;
    const icon = data.current.condition.icon;

    // t° arrondie
    degre.textContent = `${Math.round(temp)}°C`;
    conditionDuJour.textContent = condition;
    iconMeteo.src = `https:${icon}`;
    villeInput.value = data.location.name;

    // MAJ date 
    const date = new Date(data.location.localtime);
    dateElement.textContent = date.toLocaleDateString('fr-FR', { weekday: 'long' });
    dateDetailElement.textContent = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });

    updateForecast(data.location.name);
}

// Fonction météo ville spécifique
function getWeatherByCity(city) {
    fetch(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}&aqi=no`)
        // Convertit la réponse JSON en objet JS
        .then(response => response.json())
        .then(data => {
            if (data && data.current) {
                updateWeatherDisplay(data);
            }
        })
        .catch(error => console.error('Erreur lors de la récupération des données météo:', error));
}

// Fonction météo géoloc de l'utilisateur
function getWeatherByGeolocation() {
    navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        fetch(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${latitude},${longitude}&aqi=no`)
            .then(response => response.json())
            .then(data => {
                if (data && data.current) {
                    updateWeatherDisplay(data);
                }
            })
            .catch(error => console.error('Erreur lors de la récupération des données météo par géolocalisation:', error));
    }, error => {
        console.error('Erreur de géolocalisation:', error);
        // Ville par défaut en cas d'erreur
        getWeatherByCity('Paris');
    });
}

// Fonction MAJ prévisions météo (4 jours suivants)
function updateForecast(city) {
  fetch(`https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=5&aqi=no`)
      .then(response => response.json())
      .then(data => {
          if (data && data.forecast) {
              const forecastDays = data.forecast.forecastday;
              const joursElements = document.querySelectorAll('.jours');
              
              // MAJ données pour les 4 jours suivants
              for (let i = 1; i < 5; i++) {
                  const jour = forecastDays[i];
                  const jourElement = joursElements[i-1];
                  
                  if (jourElement && jour) {
                      jourElement.querySelector('h3').textContent = new Date(jour.date).toLocaleDateString('fr-FR', { weekday: 'long' });
                      jourElement.querySelector('p.text-xs').textContent = jour.day.condition.text;
                      jourElement.querySelector('img').src = `https:${jour.day.condition.icon}`;
                      jourElement.querySelector('.bloc3 p').textContent = `${Math.round(jour.day.maxtemp_c)}°C`;
                  }
              }
          }
      })
      .catch(error => console.error('Erreur lors de la récupération des prévisions:', error));
}

document.addEventListener('DOMContentLoaded', getWeatherByGeolocation);

// Delai pour recherche
let debounceTimer;
villeInput.addEventListener('input', () => {
    // réinitialise timer
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        // lance recherche après 1min
        getWeatherByCity(villeInput.value);
    }, 7000);
});

// Installation PWA
let deferredPrompt;
const installButton = document.getElementById('installButton');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installButton.classList.remove('hidden');
});

installButton.addEventListener('click', (e) => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('L\'utilisateur a accepté l\'installation');
            } else {
                console.log('L\'utilisateur a refusé l\'installation');
            }
            deferredPrompt = null;
        });
    } else if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
        showIOSInstallInstructions();
    }
});

function showIOSInstallInstructions() {
    const iosInstructions = document.createElement('div');
    iosInstructions.innerHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white p-4 rounded-lg max-w-sm text-black">
                <h2 class="text-xl font-bold mb-2">Installation sur iOS</h2>
                <p class="mb-4">Pour installer l'application sur votre appareil iOS :</p>
                <ol class="list-decimal list-inside mb-4">
                    <li>Appuyez sur l'icône de partage</li>
                    <li>Faites défiler et appuyez sur "Ajouter à l'écran d'accueil"</li>
                    <li>Appuyez sur "Ajouter" en haut à droite</li>
                </ol>
                <button id="closeIOSInstructions" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Fermer</button>
            </div>
        </div>
    `;
    document.body.appendChild(iosInstructions);
    document.getElementById('closeIOSInstructions').addEventListener('click', () => {
        iosInstructions.remove();
    });
}

// Afficher le bouton d'installation pour iOS
if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
    installButton.classList.remove('hidden');
}

