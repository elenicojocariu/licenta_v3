// js/list-a-painting.js

document.addEventListener('DOMContentLoaded', function() {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');

    flatpickr(startDateInput, {
        dateFormat: 'Y-m-d',
        minDate: 'today',
        plugins: [
            new rangePlugin({ input: endDateInput })
        ],
        onChange: function(selectedDates, dateStr, instance) {
            if (selectedDates.length === 1) {
                // Deschide calendarul pentru end date când se selectează start date
                endDateInput._flatpickr.open();
            }
        }
    });

    flatpickr(endDateInput, {
        dateFormat: 'Y-m-d'
    });

    function sendContactForm(event) {
        event.preventDefault();
        // Cod pentru trimiterea formularului
    }
});
