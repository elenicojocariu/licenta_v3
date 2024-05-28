document.addEventListener('DOMContentLoaded', function () {
    const registerForm = document.getElementById('register-form');

    registerForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        const firstName = document.getElementById('first-name').value;
        const lastName = document.getElementById('last-name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        const registerData = { first_name: firstName, last_name: lastName, email, password };

        try {
            const response = await fetch('/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(registerData)
            });

            const result = await response.json();
            if (response.ok) {
                const token = result.token;
                console.log('Token:', token);
                localStorage.setItem('token', token);
                window.location.href = 'index.html';
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('An error occurred:', error.message);
        }
    });
});
