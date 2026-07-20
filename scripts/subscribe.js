import { supabase } from './supabaseClient.js';

const form = document.querySelector('.js-subscribe-form');
const statusEl = document.querySelector('.js-subscribe-status');

if(form){
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const honeypot = form.querySelector('.js-subscribe-honeypot');
    if(honeypot && honeypot.value.trim() !== ''){
      // A real visitor never sees or fills this field — only a bot filling
      // every input blindly would. Pretend success without submitting
      // anything, so it doesn't learn the submission was rejected.
      form.reset();
      statusEl.classList.remove('is-error');
      statusEl.textContent = "You're on the list — thank you!";
      return;
    }

    const emailInput = form.querySelector('.js-subscribe-email');
    const email = emailInput.value.trim();

    statusEl.textContent = 'Subscribing...';
    statusEl.classList.remove('is-error');

    const { error } = await supabase.from('subscribers').insert({ email });

    if(error){
      statusEl.classList.add('is-error');
      statusEl.textContent = error.code === '23505'
        ? "You're already subscribed!"
        : 'Something went wrong. Please try again.';
      return;
    }

    form.reset();
    statusEl.textContent = "You're on the list — thank you!";
  });
}
