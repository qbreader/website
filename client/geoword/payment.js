/* globals Stripe */
// source: https://docs.stripe.com/payments/quickstart

import { titleCase } from '../scripts/utilities/strings.js';

const search = new URLSearchParams(window.location.search);
const packetName = search.get('packetName');
document.getElementById('packet-name').textContent = titleCase(packetName);

// This is your test publishable API key.
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51NManVKG9mAb0mOpZxtFcYWRju7COWAwtirGyd01es3bEJhqSZd8SdSsOPgyj2LizN0QYjLumsWiOoB2nKadXrt100bTtyHh8m';
// Note: as per https://www.npmjs.com/package/@stripe/stripe-js:
// To be PCI compliant, you must load Stripe.js directly from https://js.stripe.com.
// You cannot include it in a bundle or host it yourself.
const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);

let elements;

fetch('/api/geoword/cost?' + new URLSearchParams({ packetName }))
  .then(response => response.json())
  .then(data => {
    const { cost } = data;
    document.getElementById('cost').textContent = (cost / 100).toFixed(2);
  });

initialize();
checkStatus();

document.querySelector('#payment-form').addEventListener('submit', handleSubmit);

let emailAddress = '';
// Fetches a payment intent and captures the client secret
async function initialize () {
  const response = await fetch('/api/geoword/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ packetName })
  });
  const { clientSecret } = await response.json();

  const isDarkTheme = (window.localStorage.getItem('color-theme') === 'dark') || (!window.localStorage.getItem('color-theme') && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const appearance = {
    theme: isDarkTheme ? 'night' : 'stripe'
  };
  elements = stripe.elements({ appearance, clientSecret });

  const linkAuthenticationElement = elements.create('linkAuthentication');
  linkAuthenticationElement.mount('#link-authentication-element');

  linkAuthenticationElement.on('change', (event) => {
    emailAddress = event.value.email;
  });

  const paymentElementOptions = {
    layout: 'tabs'
  };

  const paymentElement = elements.create('payment', paymentElementOptions);
  paymentElement.mount('#payment-element');
}

async function handleSubmit (e) {
  e.preventDefault();
  setLoading(true);

  const { error } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      // Make sure to change this to your payment completion page
      return_url: window.location.origin + '/geoword/confirmation',
      receipt_email: emailAddress
    }
  });

  // This point will only be reached if there is an immediate error when
  // confirming the payment. Otherwise, your customer will be redirected to
  // your `return_url`. For some payment methods like iDEAL, your customer will
  // be redirected to an intermediate site first to authorize the payment, then
  // redirected to the `return_url`.
  if (error.type === 'card_error' || error.type === 'validation_error') {
    showMessage(error.message);
  } else {
    showMessage('An unexpected error occurred.');
  }

  setLoading(false);
}

// Fetches the payment intent status after payment submission
async function checkStatus () {
  const clientSecret = new URLSearchParams(window.location.search).get(
    'payment_intent_client_secret'
  );

  if (!clientSecret) {
    return;
  }

  const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

  switch (paymentIntent.status) {
    case 'succeeded':
      showMessage('Payment succeeded!');
      break;
    case 'processing':
      showMessage('Your payment is processing.');
      break;
    case 'requires_payment_method':
      showMessage('Your payment was not successful, please try again.');
      break;
    default:
      showMessage('Something went wrong.');
      break;
  }
}

// ------- UI helpers -------

function showMessage (messageText) {
  const messageContainer = document.querySelector('#payment-message');

  messageContainer.classList.remove('hidden');
  messageContainer.textContent = messageText;

  setTimeout(function () {
    messageContainer.classList.add('hidden');
    messageContainer.textContent = '';
  }, 4000);
}

// Show a spinner on payment submission
function setLoading (isLoading) {
  if (isLoading) {
    // Disable the button and show a spinner
    document.querySelector('#submit').disabled = true;
    document.querySelector('#spinner').classList.remove('hidden');
    document.querySelector('#button-text').classList.add('hidden');
  } else {
    document.querySelector('#submit').disabled = false;
    document.querySelector('#spinner').classList.add('hidden');
    document.querySelector('#button-text').classList.remove('hidden');
  }
}
