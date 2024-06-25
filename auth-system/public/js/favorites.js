async function addToFavorite(userId, paintingId, painting_img, painting_name) {
    const token = localStorage.getItem('token');

    console.log("token for postman: ", token);
    try {
        const response = await fetch('http://localhost:5000/favorite/addFavorite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({userId, paintingId, painting_img, painting_name})
        });

        if (response.ok) {
            alert('Pictura adăugată la favorite cu succes!');
        } else {
            // Try to parse JSON response
            try {
                const errorData = await response.json();
                alert(`Eroare: ${errorData.message}`);
            } catch (jsonError) {
                // Handle non-JSON response
                const text = await response.text();
                console.error('Non-JSON error response:', text);
                alert(`Eroare: ${response.status} ${response.statusText}`);
            }
        }
    } catch (error) {
        console.error('Error adding favorite:', error);
        alert('A apărut o eroare la adăugarea picturii la favorite.');
    }
}


async function removeFavorite(userId, paintingId) {
    const token = localStorage.getItem('token');
    console.log(userId, paintingId);
    const response = await fetch('/favorite/removeFavorite', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({userId, paintingId})
    });

    if (response.ok) {
        alert('Pictura a fost ștearsă din favorite cu succes!');
        location.reload();
    } else {
        const errorData = await response.json();
        alert(`Eroare: ${errorData.message}`);
    }
}

