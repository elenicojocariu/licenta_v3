// js/az-listing.js
function displayArtmovements() {
    artmovementsList.innerHTML = '';
    console.log('Displaying Artmovements:', artmovements); // Debugging line

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

// Restul codului din az-listing.js
const artistsList = document.getElementById('artists-list');
const pageNumberElement = document.getElementById('page-number');
const filterModal = document.getElementById('filter-modal');
const artmovementsList = document.getElementById('artmovements-list');
const itemsPerPage = 20;
let currentPage = 1;
let artists = [];
let artmovements = [];
let selectedArtmovements = new Set();
let artworksData = [];

async function fetchArtists() {
    try {
        const response = await fetch('/api/artworks');
        const data = await response.json();
        console.log('Fetched Data:', data);
        artworksData = data;
        artists = extractArtists(data);
        console.log("artistssssss: ", artists);
        artmovements = extractArtmovements(data);
        console.log('Extracted Artmovements:', artmovements); // Debugging line
        console.log('Number of Artmovements:', artmovements.length);

        displayArtmovements();
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

function displayArtists() {
    artistsList.innerHTML = '';
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const filteredArtists = filterArtistsByArtmovement(artists);
    const paginatedArtists = filteredArtists.slice(start, end);

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

    pageNumberElement.textContent = currentPage;
}

function filterArtistsByArtmovement(artists) {
    if (selectedArtmovements.size === 0) {
        return artists;
    }

    let filteredArtists = [];
    selectedArtmovements.forEach(selectedArtmovement => {
        if (artworksData[selectedArtmovement]) {
            artworksData[selectedArtmovement].forEach(item => {
                let artistName = item.name || 'Unknown Artist';
                if (!filteredArtists.some(artist => artist.name === artistName)) {
                    let artist = {
                        name: artistName,
                        image: item.image || 'placeholder.jpg' // Fallback image
                    };
                    filteredArtists.push(artist);
                }
            });
        }
    });

    return filteredArtists;
}

function nextPage() {
    if (currentPage * itemsPerPage < filterArtistsByArtmovement(artists).length) {
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
    currentPage = 1;
    displayArtists();
    closeFilterModal();
}

window.onclick = function(event) {
    if (event.target == filterModal) {
        filterModal.style.display = 'none';
    }
}

fetchArtists();
