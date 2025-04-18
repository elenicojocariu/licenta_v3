const fs = require('fs');
const axios = require('axios');

//citesc fisierul
fs.readFile('titles_with_urls.json', 'utf8', async (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }


    const titlesWithUrls = JSON.parse(data);

    //creez artMovements din titlesWithUrls
    const baseWikiartUrl = "https://www.wikiart.org";
    const artMovements = Object.keys(titlesWithUrls).map(title => ({
        name: title,
        url: `${baseWikiartUrl}${titlesWithUrls[title]}?json=3&layout=new&page=1&resultType=masonry`
    }));

    //extrag operele de arta din artist
    const extractArtworks = async (artistUrl) => {
        const artworksUrl = `${artistUrl}/mode/all-paintings-by-alphabet?json=2&layout=new&page=1&resultType=masonry`;
        try {
            const response = await axios.get(artworksUrl, {
                headers: {
                    "Accept": "application/json",
                    "Accept-Encoding": "gzip, deflate, br, zstd",
                    "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36"
                }
            });

            if (response.data && response.data.Paintings) {
                return response.data.Paintings.map(painting => ({
                    title: painting.title,
                    image: painting.image
                }));
            } else {
                console.error(`No 'Paintings' field found in response from ${artworksUrl}`);
                return [];
            }
        } catch (error) {
            console.error(`Error fetching artworks from ${artworksUrl}:`, error);
            return [];
        }
    };

    //extrag artistii din URL
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

                const artistsWithArtworks = await Promise.all(artistsData.map(async artist => {
                    const artworks = await extractArtworks(`${baseWikiartUrl}${artist.artistUrl}`);
                    return {
                        name: artist.title,
                        image: artist.image,
                        url: artist.artistUrl,
                        artworks: artworks
                    };
                }));

                return artistsWithArtworks;
            } else {
                console.error(`No 'Artists' field found in response from ${url}`);
                return [];
            }
        } catch (error) {
            console.error(`Error fetching artists from ${url}:`, error);
            return [];
        }
    };

    const allArtMovements = {};

    //parcurg fiecare artmovement si extragartistii si operele de arta
    for (const movement of artMovements) {
        const {name, url} = movement;
        try {
            const artists = await extractArtists(url);
            console.log(`Artists for ${name}: ${JSON.stringify(artists, null, 2)}`);
            allArtMovements[name] = artists;
        } catch (error) {
            console.error(`Error extracting artists for ${name}:`, error);
        }
    }

    //salvez separat
    fs.writeFile('all_art_movements_and_artists2.json', JSON.stringify(allArtMovements, null, 2), err => {
        if (err) {
            console.error('Error writing file:', err);
        } else {
            console.log('All art movements and artists have been saved to all_art_movements_and_artists2.json');
        }
    });
});
