const fs = require('fs');

// citim data.json
fs.readFile('art-movements.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }


    const jsonData = JSON.parse(data);

    //lista pt titluti
    const titlesWithUrls = {};


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


    console.log(titlesWithUrls);

    //salvez titulurile intr un fisier separat
    fs.writeFile('titles_with_urls.json', JSON.stringify(titlesWithUrls, null, 2), err => {
        if (err) {
            console.error('Error writing file:', err);
        } else {
            console.log('Titles with URLs saved in titles_with_urls.json');
        }
    });
});
