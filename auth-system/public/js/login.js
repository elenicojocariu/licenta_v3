// public/login.js

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form');

    loginForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        //console.log('Sending request with:', { email, password });
        //console.log("token:", token);
        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',

                },
                body: JSON.stringify({email, password})
            });

            const result = await response.json();
            console.log(result);
            if (response.ok) {
                alert(result.message);
                const token = result.token;
                localStorage.setItem('token', token);
                console.log('Token:', token); // Loghează doar token-ul în consolă
                console.log('Login successful');
                window.location.href = 'home.html'; // Sau pagina către care vrei să redirecționezi utilizatorul după login
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('An error occurred:', error.message);
        }
    });

    document.getElementById('toggle-password').addEventListener('click', function () {
        const passwordField = document.getElementById('password');
        const toggleIcon = document.getElementById('toggle-password');
        if (passwordField.type === 'password') {
            passwordField.type = 'text';
            toggleIcon.classList.remove('fa-eye');
            toggleIcon.classList.add('fa-eye-slash');
        } else {
            passwordField.type = 'password';
            toggleIcon.classList.remove('fa-eye-slash');
            toggleIcon.classList.add('fa-eye');
        }
    });
});
