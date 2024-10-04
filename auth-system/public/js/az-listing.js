const artistsList = document.getElementById('artists-list');
const pageNumberElement = document.getElementById('page-number');
const filterModal = document.getElementById('filter-modal');
const artmovementsList = document.getElementById('artmovements-list');
const alphabetFilter = document.getElementById('alphabet-filter');
const itemsPerPage = 20;
let currentPage = 1;
let artists = [];
let artmovements = [];
let selectedArtmovements = new Set();
let artworksData = [];
let selectedLetters = new Set();

async function fetchArtists() {
    try {
        const response = await fetch('/api/artworks');
        const data = await response.json();
        artworksData = data;
        artists = extractArtists(data);
        artmovements = extractArtmovements(data);
        displayArtmovements();
        displayAlphabetFilter();
        artists.sort((a, b) => a.name.localeCompare(b.name)); // Sort artists alphabetically by name
        displayArtists();
    } catch (error) {
        console.error('Error fetching artworks:', error);
    }
}

function extractArtists(data) {
    let artists = [];
    let artistNames = new Set();

    data.forEach(periodData => {
        Object.values(periodData).forEach(period => {
            if (Array.isArray(period)) {
                period.forEach(item => {
                    let artistName = item.name || 'Unknown Artist';
                    if (!artistNames.has(artistName)) {
                        artistNames.add(artistName);
                        let artist = {
                            name: artistName,
                            image: item.image || 'placeholder.jpg', // Fallback image
                        };
                        artists.push(artist);
                    }
                });
            }
        });
    });

    return artists;
}

function extractArtmovements(data) {
    let artmovementsSet = new Set();

    data.forEach(periodData => {
        Object.keys(periodData).forEach(period => {
            if (period !== '_id') {
                artmovementsSet.add(period);
            }
        });
    });

    return Array.from(artmovementsSet);
}

function displayArtmovements() {
    artmovementsList.innerHTML = '';

    artmovements.forEach(artmovement => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = artmovement;
        checkbox.value = artmovement;

        const label = document.createElement('label');
        label.htmlFor = artmovement;
        label.textContent = artmovement;

        const div = document.createElement('div');
        div.appendChild(checkbox);
        div.appendChild(label);

        artmovementsList.appendChild(div);
    });
}

function displayArtists() {
    artistsList.innerHTML = '';
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const filteredArtists = filterArtistsByArtmovement(artists);
    const alphabetFilteredArtists = filterArtistsByAlphabet(filteredArtists);
    const paginatedArtists = alphabetFilteredArtists.slice(start, end);

    const previousBtn = document.getElementById('previous-btn');
    const nextBtn = document.getElementById('next-btn'); // Adăugat pentru a manipula butonul "Next"

    if (currentPage === 1) {
        previousBtn.style.display = 'none'; // Ascunde butonul "Previous"
    } else {
        previousBtn.style.display = 'block'; // Afișează butonul "Previous"
    }

    if (paginatedArtists.length === 0) {
        artistsList.innerHTML = '<p>No artists found.</p>';
    } else {
        paginatedArtists.forEach(artist => {
            const artistDiv = document.createElement('div');
            artistDiv.classList.add('artist');
            artistDiv.innerHTML = `
                <a href="artist.html?name=${encodeURIComponent(artist.name)}">
                    <img src="${artist.image}" alt="${artist.name}" loading="lazy">
                    <p>${artist.name}</p>
                </a>
            `;
            artistsList.appendChild(artistDiv);
        });
    }

    // Verificare dacă este ultima pagină
    if (currentPage * itemsPerPage >= alphabetFilteredArtists.length) {
        nextBtn.style.display = 'none'; // Ascunde butonul "Next" dacă este ultima pagină
    } else {
        nextBtn.style.display = 'block'; // Afișează butonul "Next"
    }

    pageNumberElement.textContent = currentPage;
}



function filterArtistsByArtmovement(artists) {
    if (selectedArtmovements.size === 0) {
        return artists;
    }

    let filteredArtists = [];
    artworksData.forEach(periodData => {
        Object.keys(periodData).forEach(period => {
            if (selectedArtmovements.has(period)) {
                // Verifică dacă periodData[period] este un array înainte de a aplica forEach
                if (Array.isArray(periodData[period])) {
                    periodData[period].forEach(item => {
                        let artistName = item.name || 'Unknown Artist';
                        if (!filteredArtists.some(artist => artist.name === artistName)) {
                            let artist = {
                                name: artistName,
                                image: item.image || 'placeholder.jpg'
                            };
                            filteredArtists.push(artist);
                        }
                    });
                }
            }
        });
    });

    return filteredArtists;
}


function filterArtistsByAlphabet(artists) {
    if (selectedLetters.size === 0) {
        return artists;
    }
    return artists.filter(artist => selectedLetters.has(artist.name.charAt(0).toUpperCase()));
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayArtists();
    }
}
function nextPage() {
    if (currentPage * itemsPerPage < filterArtistsByAlphabet(filterArtistsByArtmovement(artists)).length) {
        currentPage++;
        displayArtists();
    }
}


function openFilterModal() {
    filterModal.style.display = 'block';
}

function closeFilterModal() {
    filterModal.style.display = 'none';
}

function applyFilter() {
    selectedArtmovements.clear();
    const checkboxes = artmovementsList.querySelectorAll('input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => selectedArtmovements.add(checkbox.value));
    console.log('Selected Artmovements:', Array.from(selectedArtmovements)); // Debugging line
    updateSelectedArtmovementsDisplay(); // Update the display of selected art movements
    currentPage = 1;
    displayArtists();
    closeFilterModal();
}
function updateSelectedArtmovementsDisplay() {
    const selectedArtmovementsList = document.getElementById('selected-artmovements-list');
    selectedArtmovementsList.innerHTML = ''; // Curăță lista precedentă

    selectedArtmovements.forEach(artmovement => {
        const li = document.createElement('li');
        li.classList.add('selected-artmovement-item'); // Adaugă o clasă pentru styling

        // Creează un span pentru numele mișcării de artă
        const artmovementName = document.createElement('span');
        artmovementName.textContent = artmovement;

        // Creează butonul mic de "X" pentru eliminare
        const removeButton = document.createElement('button-remove');
        removeButton.textContent = '✖'; // Folosește simbolul de "X"
        removeButton.classList.add('remove-artmovement-button'); // Adaugă o clasă pentru styling
        removeButton.onclick = () => {
            selectedArtmovements.delete(artmovement); // Elimină mișcarea de artă din selecție
            currentPage = 1; // Resetează pagina curentă
            displayArtists(); // Reafișează artiștii
            updateSelectedArtmovementsDisplay(); // Actualizează lista de mișcări selectate
        };

        li.appendChild(artmovementName);
        li.appendChild(removeButton);
        selectedArtmovementsList.appendChild(li); // Adaugă elementul la listă
    });
}


window.onclick = function(event) {
    if (event.target === filterModal) {
        filterModal.style.display = 'none';
    }
}

function displayAlphabetFilter() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    alphabet.split('').forEach(letter => {
        const letterButton = document.createElement('button');
        letterButton.textContent = letter;
        letterButton.classList.add('alphabet-button');

        // Check if the letter is currently selected and apply the active class
        if (selectedLetters.has(letter)) {
            letterButton.classList.add('active'); // Add active class if selected
        }

        letterButton.addEventListener('click', () => {
            if (selectedLetters.has(letter)) {
                // If the letter is already selected, deselect it
                selectedLetters.delete(letter); // Remove from selected letters
                letterButton.classList.remove('active'); // Remove active class
            } else {
                // Select the letter
                selectedLetters.add(letter); // Add to selected letters
                letterButton.classList.add('active'); // Add active class
            }
            currentPage = 1; // Reset to the first page
            displayArtists(); // Refresh the artist list
        });

        alphabetFilter.appendChild(letterButton);
    });
}

// Lazy load images using Intersection Observer API
document.addEventListener('DOMContentLoaded', () => {
    const lazyImages = document.querySelectorAll('img.lazy-image');

    if ('IntersectionObserver' in window) {
        const lazyImageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const lazyImage = entry.target;
                    lazyImage.src = lazyImage.dataset.src; // Set real image source
                    lazyImage.classList.remove('lazy-image');
                    lazyImageObserver.unobserve(lazyImage); // Stop observing the image
                }
            });
        });

        lazyImages.forEach(lazyImage => {
            lazyImageObserver.observe(lazyImage);
        });
    } else {
        // Fallback for browsers that don't support Intersection Observer
        lazyImages.forEach(lazyImage => {
            lazyImage.src = lazyImage.dataset.src;
        });
    }
});



fetchArtists();
