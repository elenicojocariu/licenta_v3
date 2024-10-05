
document.addEventListener('DOMContentLoaded', () => {
    const searchBar = document.getElementById('nav-search-input');
    searchBar.addEventListener('input', handleSearchInput);

    const closeButton = document.getElementById('nav-search-close');
    closeButton.addEventListener('click', () => {
        const searchContainer = document.getElementById('nav-search-container');
        searchContainer.style.display = 'none';
        searchBar.value = '';
        const searchResults = document.getElementById('nav-search-results');
        searchResults.innerHTML = '';
        searchResults.style.display = 'none';
    });
});
let debounceTimeoutt;
function handleSearchInput(event) {
    clearTimeout(debounceTimeoutt);
    debounceTimeoutt = setTimeout(() => {
        const query = event.target.value.toUpperCase();
        const searchResults = document.getElementById('nav-search-results');
        searchResults.innerHTML = '';

        if (query.length === 0) {
            searchResults.style.display = 'none';
            return;
        }

        const filteredPaintings = paintings.filter(painting =>
            painting.title.toUpperCase().includes(query) ||
            painting.name.toUpperCase().includes(query)
        );

        if (filteredPaintings.length > 0) {
            const fragment = document.createDocumentFragment(); // Creează un fragment de document

            filteredPaintings.forEach(painting => {
                const highlightedTitle = highlightMatch(painting.title, query);
                const highlightedName = highlightMatch(painting.name, query);

                const artElement = document.createElement('div');
                artElement.classList.add('nav-search-result-item');
                artElement.innerHTML = `
        <img src="${painting.image}" alt="${painting.title}" />
        <div>
            <h3>${highlightedTitle}</h3>
            <p>${highlightedName}</p>
        </div>
    `;
                artElement.addEventListener('click', () => {
                    showPaintingDetails(painting);
                    searchResults.innerHTML = '';  // Curăță rezultatele după selecție
                    searchResults.style.display = 'none'; // Ascunde rezultatele după selecție
                });
                fragment.appendChild(artElement); // Adaugă fiecare element în fragment, nu direct în DOM
            });

            searchResults.appendChild(fragment); // Adaugă fragmentul în DOM odată ce toate elementele au fost create

            searchResults.style.display = 'block';
        } else {
            searchResults.innerHTML = '<p>No paintings found</p>';
            searchResults.style.display = 'block';
        }
    }, 300); // Așteaptă 300ms după ultima tastare
}

function highlightMatch(text, query) {
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return text.replace(regex, '<strong class="highlight">$1</strong>');
}


document.addEventListener('DOMContentLoaded', () => {
    const closeButton = document.getElementById('nav-search-close');

    // Adaugă un eveniment de click pe butonul de închidere
    closeButton.addEventListener('click', () => {
        const searchContainer = document.getElementById('nav-search-container');
        const logoContainer = document.querySelector('.logo-container');

        searchContainer.style.display = 'none'; // Ascunde bara de căutare
        logoContainer.classList.remove('hidden'); // Reapare logo-ul
    });
});

function toggleSearchBar() {
    const searchContainer = document.getElementById('nav-search-container');
    const logoContainer = document.querySelector('.logo-container'); // Selectează logo-ul

    // Verifică dacă bara de căutare este vizibilă
    if (searchContainer.style.display === 'none' || !searchContainer.style.display) {
        searchContainer.style.display = 'block'; // Afișează bara de căutare
        logoContainer.classList.add('hidden'); // Ascunde logo-ul
        document.getElementById('nav-search-input').focus(); // Focus pe input
    } else {
        searchContainer.style.display = 'none'; // Ascunde bara de căutare
        logoContainer.classList.remove('hidden'); // Afișează logo-ul
    }
}




window.handleSearchInput = handleSearchInput;
window.Search = handleSearchInput;
window.toggleSearchBar = toggleSearchBar;
