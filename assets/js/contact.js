(function () {
  var form = document.querySelector('[data-contact-form]');
  if (!form) {
    return;
  }

  var status = document.querySelector('[data-form-status]');
  var tokenInput = form.querySelector('input[name="recaptcha_token"]');
  var siteKey = form.getAttribute('data-sitekey');
  var submitting = false;

  function setStatus(message, state) {
    if (!status) {
      return;
    }
    status.textContent = message || '';
    if (state) {
      status.setAttribute('data-state', state);
    } else {
      status.removeAttribute('data-state');
    }
  }

  var params = new URLSearchParams(window.location.search);
  if (params.get('sent') === '1') {
    setStatus('Message sent. We will call you shortly.', 'success');
  } else if (params.get('error') === '1') {
    setStatus('Submission failed. Please call (604) 800-3900 for immediate help.', 'error');
  }

  form.addEventListener('submit', function (event) {
    if (submitting) {
      return;
    }

    event.preventDefault();

    if (!window.grecaptcha || !siteKey || !tokenInput) {
      setStatus('Could not load spam protection. Please call (604) 800-3900.', 'error');
      return;
    }

    setStatus('Securing your request...', '');

    window.grecaptcha.ready(function () {
      window.grecaptcha
        .execute(siteKey, { action: 'contact_form_submit' })
        .then(function (token) {
          tokenInput.value = token;
          submitting = true;
          form.submit();
        })
        .catch(function () {
          setStatus('Verification failed. Please retry or call (604) 800-3900.', 'error');
        });
    });
  });
})();
