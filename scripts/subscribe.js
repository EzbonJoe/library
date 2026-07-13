import { supabase } from './supabaseClient.js';

const form = document.querySelector('.js-subscribe-form');
const statusEl = document.querySelector('.js-subscribe-status');

if(form){
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

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
