(function () {
    'use strict';

    const form = document.getElementById('demoRequestForm');
    if (!form) return;

    const submitButton = form.querySelector('.demo-submit');
    const submitLabel = form.querySelector('.demo-submit-label');
    const submitError = document.getElementById('demoSubmitError');
    const success = document.getElementById('demoSuccess');
    let submitting = false;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const fields = {
        contactName: {
            input: document.getElementById('demo-name'),
            error: document.getElementById('demo-name-error'),
            message: 'Please enter your full name.'
        },
        email: {
            input: document.getElementById('demo-email'),
            error: document.getElementById('demo-email-error'),
            message: 'Please enter a valid work email.'
        },
        companyName: {
            input: document.getElementById('demo-company'),
            error: document.getElementById('demo-company-error'),
            message: 'Please enter your company or organisation.'
        }
    };

    function clearFieldError(field) {
        field.input.removeAttribute('aria-invalid');
        field.input.removeAttribute('aria-describedby');
        field.error.textContent = '';
    }

    function showFieldError(field) {
        field.input.setAttribute('aria-invalid', 'true');
        field.input.setAttribute('aria-describedby', field.error.id);
        field.error.textContent = field.message;
    }

    function validate() {
        let firstInvalid = null;

        Object.values(fields).forEach(clearFieldError);
        submitError.textContent = '';

        if (!fields.contactName.input.value.trim()) {
            showFieldError(fields.contactName);
            firstInvalid = firstInvalid || fields.contactName.input;
        }

        if (!emailPattern.test(fields.email.input.value.trim())) {
            showFieldError(fields.email);
            firstInvalid = firstInvalid || fields.email.input;
        }

        if (!fields.companyName.input.value.trim()) {
            showFieldError(fields.companyName);
            firstInvalid = firstInvalid || fields.companyName.input;
        }

        if (firstInvalid) firstInvalid.focus();
        return !firstInvalid;
    }

    function setBusy(isBusy) {
        submitButton.disabled = isBusy;
        submitButton.setAttribute('aria-busy', String(isBusy));
        submitLabel.textContent = isBusy ? 'Sending request…' : 'Request a demo';
    }

    Object.values(fields).forEach((field) => {
        field.input.addEventListener('input', () => clearFieldError(field));
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (submitting || !validate()) return;
        submitting = true;

        setBusy(true);

        const payload = {
            engagementType: 'Drona demo',
            contactName: fields.contactName.input.value.trim(),
            email: fields.email.input.value.trim(),
            companyName: fields.companyName.input.value.trim(),
            strategicContext: document.getElementById('demo-context').value.trim(),
            company_website: document.getElementById('demo-website').value,
            submittedAt: new Date().toISOString()
        };

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);
        try {
            const response = await fetch('/api/consult', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok || result?.success !== true) {
                if (response.status === 429) {
                    throw new Error('Too many requests have been sent. Please wait a few minutes and try again.');
                }
                throw new Error(result?.message || 'We could not send your request. Please try again.');
            }

            form.hidden = true;
            document.querySelector('.demo-form-heading').hidden = true;
            success.hidden = false;
            success.focus();
        } catch (error) {
            submitError.textContent = error.name === 'AbortError'
                ? 'The connection timed out. Your details are still here. Please try again.'
                : error.message || 'We could not send your request. Please try again.';
            submitError.focus?.();
        } finally {
            clearTimeout(timeout);
            submitting = false;
            setBusy(false);
        }
    });
})();
