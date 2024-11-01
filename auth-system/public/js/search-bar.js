
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
            const fragment = document.createDocumentFragment();

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
                    searchResults.innerHTML = '';
                    searchResults.style.display = 'none';
                });
                fragment.appendChild(artElement);
            });

            searchResults.appendChild(fragment);

            searchResults.style.display = 'block';
        } else {
            searchResults.innerHTML = '<p>No paintings found</p>';
            searchResults.style.display = 'block';
        }
    }, 300);
}

function highlightMatch(text, query) {
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return text.replace(regex, '<strong class="highlight">$1</strong>');
}


document.addEventListener('DOMContentLoaded', () => {
    const closeButton = document.getElementById('nav-search-close');

    closeButton.addEventListener('click', () => {
        const searchContainer = document.getElementById('nav-search-container');
        const logoContainer = document.querySelector('.logo-container');

        searchContainer.style.display = 'none';
        logoContainer.classList.remove('hidden');
    });
});

function toggleSearchBar() {
    const searchContainer = document.getElementById('nav-search-container');
    const logoContainer = document.querySelector('.logo-container');

    if (searchContainer.style.display === 'none' || !searchContainer.style.display) {
        searchContainer.style.display = 'block';
        logoContainer.classList.add('hidden');
        document.getElementById('nav-search-input').focus();
    } else {
        searchContainer.style.display = 'none';
        logoContainer.classList.remove('hidden');
    }
}

window.handleSearchInput = handleSearchInput;
window.Search = handleSearchInput;
window.toggleSearchBar = toggleSearchBar;
