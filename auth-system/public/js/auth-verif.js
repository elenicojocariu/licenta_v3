
async function authenticateUser() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Nu ești autentificat!');
        window.location.href = 'http://localhost:5000/login';
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/auth/verifyToken', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            userId = data.userId;
        } else {
            const errorData = await response.json();
            console.error('Token verification failed:', errorData);
            throw new Error('Token invalid');
        }
    } catch (error) {
        alert('Autentificarea a eșuat, te rugăm să te autentifici din nou.');
        localStorage.removeItem('token');
        window.location.href = 'http://localhost:5000/login';
    }
}
