// search-bar.js

document.addEventListener('DOMContentLoaded', () => {
    const searchBar = document.getElementById('nav-search-input');
    searchBar.addEventListener('input', handleSearchInput);
});

function handleSearchInput(event) {
    const query = event.target.value.toUpperCase();
    const searchResults = document.getElementById('nav-search-results');
    searchResults.innerHTML = '';  // Clear previous results

    if (query.length === 0) {
        searchResults.style.display = 'none'; // Hide search results if query is empty
        return;
    }

    const filteredPaintings = paintings.filter(painting =>
        painting.title.toUpperCase().includes(query) || painting.name.toUpperCase().includes(query)
    );

    if (filteredPaintings.length > 0) {
        filteredPaintings.forEach(painting => {
            const artElement = document.createElement('div');
            artElement.classList.add('nav-search-result-item');
            artElement.innerHTML = `
                <img src="${painting.image}" alt="${painting.title}" />
                <div>
                    <h3>${painting.title}</h3>
                    <p>${painting.name}</p>
                </div>
            `;
            artElement.addEventListener('click', () => {
                showPaintingDetails(painting);
                searchResults.innerHTML = '';  // Clear search results after selection
                searchResults.style.display = 'none'; // Hide search results after selection
            });
            searchResults.appendChild(artElement);
        });
        searchResults.style.display = 'block'; // Show search results
    } else {
        searchResults.innerHTML = '<p>No paintings found</p>';
        searchResults.style.display = 'block'; // Show "No paintings found"
    }
}

function toggleSearchBar() {
    const searchContainer = document.getElementById('nav-search-container');
    searchContainer.style.display = searchContainer.style.display === 'block' ? 'none' : 'block';
}

window.handleSearchInput = handleSearchInput;
window.Search = handleSearchInput;
window.toggleSearchBar = toggleSearchBar;
