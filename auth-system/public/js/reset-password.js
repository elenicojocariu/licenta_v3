document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    // Fetch user's email from the token (optional, if token stores email)
    //const userEmailElement = document.getElementById('user-email');
    //userEmailElement.textContent = 'user@example.com'; // Replace with actual logic

    const resetForm = document.getElementById('reset-password-form');
    const popupMessage = document.getElementById('popup-message');
    const popupText = document.getElementById('popup-text');
    const popupCloseBtn = document.getElementById('popup-close-btn');

    resetForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (newPassword !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token, newPassword })
            });

            const result = await response.json();
            if (response.ok) {
                popupText.textContent = "You changed your password";
                popupMessage.style.display = 'block';
            } else {
                alert(result.message || 'Error resetting password');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while resetting the password.');
        }
    });

    popupCloseBtn.addEventListener('click', function() {
        popupMessage.style.display = 'none';
        window.location.href = '/login.html';
    });
});