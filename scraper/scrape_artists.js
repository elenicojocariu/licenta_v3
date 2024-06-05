const fs = require('fs');
const axios = require('axios');

// Citește fișierul titles_with_urls.json
fs.readFile('titles_with_urls.json', 'utf8', async (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }

    // Parsează JSON-ul
    const titlesWithUrls = JSON.parse(data);

    // Creează obiectul artMovements din titlesWithUrls
    const baseWikiartUrl = "https://www.wikiart.org";
    const artMovements = Object.keys(titlesWithUrls).map(title => ({
        name: title,
        url: `${baseWikiartUrl}${titlesWithUrls[title]}?json=3&layout=new&page=1&resultType=masonry`
    }));

    // Funcție pentru a extrage artiștii dintr-un URL
    const extractArtists = async (url) => {
        try {
            const response = await axios.get(url, {
                headers: {
                    "Accept": "application/json",
                    "Accept-Encoding": "gzip, deflate, br, zstd",
                    "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36"
                }
            });

            if (response.data && response.data.Artists) {
                const artistsData = response.data.Artists;
                return artistsData.map(artist => ({
                    name: artist.title,
                    image: artist.image
                }));
            } else {
                console.error(`No 'Artists' field found in response from ${url}`);
                return [];
            }
        } catch (error) {
            console.error(`Error fetching artists from ${url}:`, error);
            return [];
        }
    };

    // Obiect pentru a stoca toate mișcările artistice și artiștii
    const allArtMovements = {};

    // Parcurge fiecare mișcare artistică și extrage artiștii
    for (const movement of artMovements) {
        const { name, url } = movement;
        try {
            const artists = await extractArtists(url);
            console.log(`Artists for ${name}:`, artists);
            allArtMovements[name] = artists;
        } catch (error) {
            console.error(`Error extracting artists for ${name}:`, error);
        }
    }

    // Salvează toate mișcările artistice și artiștii într-un fișier separat
    fs.writeFile('all_art_movements_and_artists.json', JSON.stringify(allArtMovements, null, 2), err => {
        if (err) {
            console.error('Error writing file:', err);
        } else {
            console.log('All art movements and artists have been saved to all_art_movements_and_artists.json');
        }
    });
});
