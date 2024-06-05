const fs = require('fs');

// Citește fișierul data.json
fs.readFile('art-movements.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }

    // Parsează JSON-ul
    const jsonData = JSON.parse(data);

    // Listă pentru a stoca titlurile
    const titlesWithUrls = {};

    // Iterează prin secțiunea "DictionariesWithCategories"
    const dictionariesWithCategories = jsonData.DictionariesWithCategories;
    for (const categoryId in dictionariesWithCategories) {
        if (dictionariesWithCategories.hasOwnProperty(categoryId)) {
            dictionariesWithCategories[categoryId].forEach(dictionary => {
                const title = dictionary.Title;
                const url = dictionary.Url;
                if (title && url) {
                    titlesWithUrls[title] = url;
                }
            });
        }
    }

    // Afișează titlurile
    console.log(titlesWithUrls);

    // Dacă vrei să salvezi titlurile într-un fișier separat
    fs.writeFile('titles_with_urls.json', JSON.stringify(titlesWithUrls, null, 2), err => {
        if (err) {
            console.error('Error writing file:', err);
        } else {
            console.log('Titles with URLs have been saved to titles_with_urls.json');
        }
    });
});
