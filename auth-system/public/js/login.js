

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form');
    const unconfirmedEmailModal = document.getElementById('unconfirmed-email-modal');
    const closeUnconfirmedEmailBtn = document.getElementById('close-unconfirmed-email');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

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
                console.log(result.message);

                const token = result.token;
                const userId = result.userId;

                localStorage.setItem('token', token);
                localStorage.setItem('userId', userId);

                console.log('Token:', token); // Loghează doar token-ul în consolă
                console.log('Login successful');
                window.location.href = 'home.html'; // Sau pagina către care vrei să redirecționezi utilizatorul după login
            } else {
                console.log(result.message);
                if (result.message === 'Please confirm your email before logging in.') {
                    // Show the modal for unconfirmed email
                    unconfirmedEmailModal.style.display = 'block';
                } else {
                    console.log(result.message); // Handle other error messages
                    errorMessage.textContent = result.message || 'Email or password is incorrect';
                    errorMessage.style.display = 'block';
                }

            }
        } catch (error) {
            console.error('An error occurred:', error.message);
        }
    });

    closeUnconfirmedEmailBtn.addEventListener('click', function () {
        unconfirmedEmailModal.style.display = 'none';
    });

    window.onclick = function (event){
        if(event.target == unconfirmedEmailModal){
            unconfirmedEmailModal.style.display = 'none';
        }
    }

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

    const forgotPasswordBtn = document.querySelector('.forgot-password-btn');
    const forgotPasswordModal = document.getElementById('forgot-password-modal');
    const emailSentModal = document.getElementById('email-sent-modal');
    const closeModal = document.querySelector('.close');
    const emailSentOkBtn = document.getElementById('email-sent-ok-btn');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const emailSentMsg = document.getElementById('email-sent-msg');

    // Deschide fereastra modală pentru forgot password
    forgotPasswordBtn.addEventListener('click', function () {
        forgotPasswordModal.style.display = 'block';
    });

    // Închide fereastra modală
    closeModal.addEventListener('click', function () {
        forgotPasswordModal.style.display = 'none';
    });

    // Închide modalul de confirmare email trimis
    emailSentOkBtn.addEventListener('click', function () {
        emailSentModal.style.display = 'none';
    });

    // Trimite cererea pentru resetare parolă
    forgotPasswordForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        const email = document.getElementById('forgot-email').value;

        try {
            const response = await fetch('http://localhost:5000/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                const maskedEmail = maskEmail(email);
                emailSentMsg.textContent = `We sent an email to ${maskedEmail} with a link to get back into your account.`;
                forgotPasswordModal.style.display = 'none';
                emailSentModal.style.display = 'block';
            } else {
                alert('There was a problem sending the email. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('There was a problem sending the email. Please try again.');
        }
    });

    // Funcție pentru a masca emailul
    function maskEmail(email) {
        const [localPart, domain] = email.split('@');
        return `${localPart[0]}*******${localPart.slice(-1)}@${domain}`;
    }


});
