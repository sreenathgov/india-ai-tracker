/**
 * careers-apply.js — client validation and submission for the per-role
 * application form on /careers/<slug>/.
 *
 * The screening questions are rendered from data/careers.json, so this file
 * never names one. It reads `data-question-id`, `data-required` and `maxlength`
 * off the textareas, which is the same contract api/apply.js validates against
 * server-side. Editing a role's questions stays a pure data edit.
 */

(function () {
    'use strict';

    const form = document.getElementById('applyForm');
    if (!form) return;

    const heading = document.getElementById('applyHeading');
    const success = document.getElementById('applySuccess');
    const submitButton = form.querySelector('.crd-submit');
    const submitLabel = form.querySelector('.crd-submit__label');
    const submitError = document.getElementById('applyError');

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Vercel caps a serverless request body at 4.5 MB and base64 inflates by
    // roughly a third, so 3 MB of PDF is the largest that reliably lands.
    const MAX_CV_BYTES = 3 * 1024 * 1024;

    const el = (id) => document.getElementById(id);

    const nameInput = el('ap-name');
    const emailInput = el('ap-email');
    const locationInput = el('ap-location');
    const noticeInput = el('ap-notice');
    const linkedinInput = el('ap-linkedin');
    const portfolioInput = el('ap-portfolio');
    const cvUrlInput = el('ap-cv-url');
    const cvFileInput = el('ap-cv-file');
    const honeypotInput = el('ap-website');

    const questionInputs = Array.from(form.querySelectorAll('[data-question-id]'));

    // -----------------------------------------------------------------------
    // Field errors
    // -----------------------------------------------------------------------

    function errorNodeFor(input) {
        return document.getElementById(input.id + '-error');
    }

    function clearError(input) {
        const node = errorNodeFor(input);
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-describedby');
        if (input.closest('.crd-field')) input.closest('.crd-field').classList.remove('has-error');
        if (node) node.textContent = '';
    }

    function showError(input, message) {
        const node = errorNodeFor(input);
        input.setAttribute('aria-invalid', 'true');
        if (input.closest('.crd-field')) input.closest('.crd-field').classList.add('has-error');
        if (node) {
            node.textContent = message;
            input.setAttribute('aria-describedby', node.id);
        }
    }

    const validatable = [
        nameInput, emailInput, linkedinInput, portfolioInput, cvUrlInput, cvFileInput
    ].concat(questionInputs).filter(Boolean);

    validatable.forEach((input) => {
        input.addEventListener('input', () => clearError(input));
        input.addEventListener('change', () => clearError(input));
    });

    // -----------------------------------------------------------------------
    // Character counters
    // -----------------------------------------------------------------------

    questionInputs.forEach((textarea) => {
        const counter = form.querySelector(`[data-counter-for="${textarea.id}"]`);
        if (!counter) return;

        const value = counter.querySelector('span');
        const max = Number(textarea.getAttribute('maxlength')) || 0;

        const update = () => {
            const used = textarea.value.length;
            if (value) value.textContent = String(used);
            counter.classList.toggle('is-near-limit', max > 0 && used >= max * 0.9);
        };

        textarea.addEventListener('input', update);
        update();
    });

    // -----------------------------------------------------------------------
    // Validation
    // -----------------------------------------------------------------------

    function isUsableUrl(value) {
        try {
            const url = new URL(value);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (err) {
            return false;
        }
    }

    function validateOptionalUrl(input, firstInvalid) {
        const value = input.value.trim();
        if (!value || isUsableUrl(value)) return firstInvalid;
        showError(input, 'Enter a full link, starting with https://');
        return firstInvalid || input;
    }

    function validate() {
        let firstInvalid = null;

        validatable.forEach(clearError);
        if (submitError) submitError.textContent = '';

        if (!nameInput.value.trim()) {
            showError(nameInput, 'Please tell us your name.');
            firstInvalid = firstInvalid || nameInput;
        }

        if (!EMAIL_RE.test(emailInput.value.trim())) {
            showError(emailInput, 'Please enter an email address we can reply to.');
            firstInvalid = firstInvalid || emailInput;
        }

        [linkedinInput, portfolioInput, cvUrlInput].filter(Boolean).forEach((input) => {
            firstInvalid = validateOptionalUrl(input, firstInvalid);
        });

        const file = cvFileInput && cvFileInput.files && cvFileInput.files[0];
        if (file) {
            const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
            if (!isPdf) {
                showError(cvFileInput, 'Please attach a PDF, or paste a link instead.');
                firstInvalid = firstInvalid || cvFileInput;
            } else if (file.size > MAX_CV_BYTES) {
                showError(cvFileInput, 'That file is over 3 MB. Compress it, or paste a link instead.');
                firstInvalid = firstInvalid || cvFileInput;
            }
        }

        questionInputs.forEach((textarea) => {
            const answer = textarea.value.trim();
            const max = Number(textarea.getAttribute('maxlength')) || 0;

            if (textarea.getAttribute('data-required') === 'true' && !answer) {
                showError(textarea, 'This one matters to us — please give it a go.');
                firstInvalid = firstInvalid || textarea;
            } else if (max > 0 && answer.length > max) {
                showError(textarea, `Please keep this under ${max} characters.`);
                firstInvalid = firstInvalid || textarea;
            }
        });

        if (firstInvalid) firstInvalid.focus();
        return !firstInvalid;
    }

    // -----------------------------------------------------------------------
    // Submission
    // -----------------------------------------------------------------------

    function setBusy(isBusy) {
        submitButton.disabled = isBusy;
        submitButton.setAttribute('aria-busy', String(isBusy));
        if (submitLabel) submitLabel.textContent = isBusy ? 'Sending…' : 'Send application';
    }

    /** Strips the `data:application/pdf;base64,` prefix Brevo does not want. */
    function readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('We could not read that file. Try a link instead.'));
            reader.onload = () => {
                const result = String(reader.result || '');
                const comma = result.indexOf(',');
                if (comma === -1) {
                    reject(new Error('We could not read that file. Try a link instead.'));
                    return;
                }
                resolve(result.slice(comma + 1));
            };
            reader.readAsDataURL(file);
        });
    }

    async function buildPayload() {
        const payload = {
            roleSlug: form.getAttribute('data-role-slug'),
            roleTitle: form.getAttribute('data-role-title'),
            fullName: nameInput.value.trim(),
            email: emailInput.value.trim(),
            location: locationInput ? locationInput.value.trim() : '',
            noticePeriod: noticeInput ? noticeInput.value.trim() : '',
            linkedin: linkedinInput ? linkedinInput.value.trim() : '',
            portfolio: portfolioInput ? portfolioInput.value.trim() : '',
            cvUrl: cvUrlInput ? cvUrlInput.value.trim() : '',
            answers: questionInputs.map((textarea) => ({
                id: textarea.getAttribute('data-question-id'),
                answer: textarea.value.trim()
            })),
            company_website: honeypotInput ? honeypotInput.value : '',
            submittedAt: new Date().toISOString()
        };

        const file = cvFileInput && cvFileInput.files && cvFileInput.files[0];
        if (file) {
            payload.cvFile = {
                name: file.name,
                content: await readFileAsBase64(file)
            };
        }

        return payload;
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!validate()) return;

        setBusy(true);

        try {
            const payload = await buildPayload();

            const response = await fetch('/api/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('That is a lot of applications in a short window. '
                        + 'Please wait a few minutes and try again.');
                }
                if (response.status === 413) {
                    throw new Error('That attachment is too large to send. '
                        + 'Paste a link to your CV instead.');
                }
                throw new Error(result.message || 'We could not send your application. Please try again.');
            }

            form.hidden = true;
            if (heading) heading.hidden = true;
            if (success) {
                success.hidden = false;
                success.focus();
            }
        } catch (error) {
            if (submitError) {
                submitError.textContent = error.message
                    || 'We could not send your application. Please try again.';
            }
        } finally {
            setBusy(false);
        }
    });
})();
