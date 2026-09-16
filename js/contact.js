/* ============================================================
   SpendWise
   File: js/contact.js
   Contact form validation, success message, FAQ accordion
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', function () {

    var form = document.getElementById('contactForm');
    var successBox = document.getElementById('formSuccess');

    /* ---------- validation helpers ---------- */
    function setError(id, message) {
        var input = document.getElementById(id);
        var box = document.getElementById(id + 'Error');
        if (input) { input.classList.add('input-error'); }
        if (box) { box.textContent = message; }
    }

    function clearError(id) {
        var input = document.getElementById(id);
        var box = document.getElementById(id + 'Error');
        if (input) { input.classList.remove('input-error'); }
        if (box) { box.textContent = ''; }
    }

    function isEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(value);
    }

    function isPhone(value) {
        return /^[0-9+\-\s]{10,15}$/.test(value);
    }

    /* ---------- live clearing ---------- */
    ['name', 'email', 'phone', 'subject', 'message'].forEach(function (id) {
        var field = document.getElementById(id);
        if (!field) { return; }
        field.addEventListener('input', function () { clearError(id); });
    });

    /* ---------- submit ---------- */
    if (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();

            var name = document.getElementById('name');
            var email = document.getElementById('email');
            var phone = document.getElementById('phone');
            var subject = document.getElementById('subject');
            var message = document.getElementById('message');

            ['name', 'email', 'phone', 'subject', 'message'].forEach(clearError);
            if (successBox) { successBox.classList.add('hidden'); }

            var valid = true;

            if (name.value.trim().length < 3) {
                setError('name', 'Name must be at least 3 characters.');
                valid = false;
            }

            if (email.value.trim() === '') {
                setError('email', 'Enter your email address.');
                valid = false;
            } else if (!isEmail(email.value.trim())) {
                setError('email', 'Enter a valid email, like you@example.com');
                valid = false;
            }

            if (phone.value.trim() !== '' && !isPhone(phone.value.trim())) {
                setError('phone', 'Use 10 to 15 digits only.');
                valid = false;
            }

            if (subject.value === '') {
                setError('subject', 'Choose a subject.');
                valid = false;
            }

            if (message.value.trim().length < 10) {
                setError('message', 'Message must be at least 10 characters.');
                valid = false;
            }

            if (!valid) {
                SW.showToast('Fix the highlighted fields and send again.', 'error');
                return;
            }

            /* success */
            if (successBox) {
                successBox.innerHTML = '<i class="fa-solid fa-circle-check"></i> Thanks ' +
                    SW.escape(name.value.trim()) +
                    ', your message has been received. We will reply at ' +
                    SW.escape(email.value.trim()) + '.';
                successBox.classList.remove('hidden');
                successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            SW.showToast('Message sent.', 'success');
            form.reset();
        });
    }

    /* ---------- FAQ accordion ---------- */
    var questions = document.querySelectorAll('.faq-question');
    Array.prototype.forEach.call(questions, function (button) {
        button.addEventListener('click', function () {
            var item = button.parentElement;
            var wasOpen = item.classList.contains('open');

            Array.prototype.forEach.call(
                document.querySelectorAll('.faq-item'),
                function (faq) { faq.classList.remove('open'); }
            );

            if (!wasOpen) { item.classList.add('open'); }
        });
    });
});
