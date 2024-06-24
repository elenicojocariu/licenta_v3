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
let selectedLetter = '';

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
            artmovementsSet.add(period);
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

    if (paginatedArtists.length === 0) {
        artistsList.innerHTML = '<p>No artists found.</p>';
    } else {
        paginatedArtists.forEach(artist => {
            const artistDiv = document.createElement('div');
            artistDiv.classList.add('artist');
            artistDiv.innerHTML = `
                <a href="artist.html?name=${encodeURIComponent(artist.name)}">
                    <img src="${artist.image}" alt="${artist.name}">
                    <p>${artist.name}</p>
                </a>
            `;
            artistsList.appendChild(artistDiv);
        });
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
        });
    });

    return filteredArtists;
}

function filterArtistsByAlphabet(artists) {
    if (!selectedLetter) {
        return artists;
    }
    return artists.filter(artist => artist.name.charAt(0).toUpperCase() === selectedLetter);
}

function nextPage() {
    if (currentPage * itemsPerPage < filterArtistsByAlphabet(filterArtistsByArtmovement(artists)).length) {
        currentPage++;
        displayArtists();
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
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
    selectedArtmovementsList.innerHTML = ''; // Clear previous list
    selectedArtmovements.forEach(artmovement => {
        const li = document.createElement('li');
        li.textContent = artmovement;
        selectedArtmovementsList.appendChild(li);
    });
}

window.onclick = function(event) {
    if (event.target == filterModal) {
        filterModal.style.display = 'none';
    }
}

function displayAlphabetFilter() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    alphabet.split('').forEach(letter => {
        const letterButton = document.createElement('button');
        letterButton.textContent = letter;
        letterButton.classList.add('alphabet-button');
        letterButton.addEventListener('click', () => {
            selectedLetter = letter;
            currentPage = 1;
            displayArtists();
        });
        alphabetFilter.appendChild(letterButton);
    });
}

fetchArtists();
