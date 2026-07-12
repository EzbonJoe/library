import { supabase } from './supabaseClient.js';

const CATEGORIES = ['Business', 'Psychology', 'Philosophy', 'Money', 'Relationships', 'Leadership', 'Success', 'Habits', 'Spirituality', 'Productivity'];

function slugFromTitle(title){
  const cleaned = title.trim().replace(/[^a-zA-Z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `Quotes-From-${cleaned}`;
}

async function uploadCoverImage(file){
  const ext = file.name.split('.').pop();
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from('covers').upload(path, file);
  if(error) throw error;

  const { data } = supabase.storage.from('covers').getPublicUrl(path);
  return data.publicUrl;
}

const loginSection = document.querySelector('.js-login-section');
const adminSection = document.querySelector('.js-admin-section');
const loginForm = document.querySelector('.js-login-form');
const loginError = document.querySelector('.js-login-error');
const logoutButton = document.querySelector('.js-logout-button');

const quoteForm = document.querySelector('.js-quote-form');
const quoteBookSelect = document.querySelector('.js-quote-book');
const quoteTextInput = document.querySelector('.js-quote-text');
const quoteStatus = document.querySelector('.js-quote-status');

const bookForm = document.querySelector('.js-book-form');
const bookTitleInput = document.querySelector('.js-book-title');
const bookAuthorInput = document.querySelector('.js-book-author');
const bookCategorySelect = document.querySelector('.js-book-category');
const bookSlugInput = document.querySelector('.js-book-slug');
const bookImageFileInput = document.querySelector('.js-book-image-file');
const bookStatusSelect = document.querySelector('.js-book-status');
const bookStatusText = document.querySelector('.js-book-status-text');

const recentQuotesEl = document.querySelector('.js-recent-quotes');
const booksManageEl = document.querySelector('.js-books-manage');
const booksSearchInput = document.querySelector('.js-books-search');
const quotesBookFilter = document.querySelector('.js-quotes-book-filter');
const quotesSearchInput = document.querySelector('.js-quotes-search');

let allBooks = [];

function showLoggedIn(){
  loginSection.hidden = true;
  adminSection.hidden = false;
  loadBooksDropdown();
  loadQuotesManage();
  loadBooksManage();
}

function showLoggedOut(){
  loginSection.hidden = false;
  adminSection.hidden = true;
}

function categoryOptionsHTML(selected){
  return `<option value="">— none —</option>` + CATEGORIES
    .map((category) => `<option ${category === selected ? 'selected' : ''}>${category}</option>`)
    .join('');
}

async function loadBooksDropdown(){
  const { data: books, error } = await supabase
    .from('books')
    .select('id, title')
    .order('title');

  if(error){
    console.error(error);
    return;
  }

  allBooks = books;

  const optionsHTML = books
    .map((book) => `<option value="${book.id}">${book.title}</option>`)
    .join('');

  quoteBookSelect.innerHTML = optionsHTML;
  quotesBookFilter.innerHTML = `<option value="">All books (recent 20)</option>${optionsHTML}`;
}

async function loadQuotesManage(){
  const bookId = quotesBookFilter.value;
  const search = quotesSearchInput.value.trim();

  let query = supabase.from('quotes').select('id, text, featured, books(title)');

  if(bookId){
    query = query.eq('book_id', bookId).order('position');
  }else{
    query = query.order('created_at', { ascending: false }).limit(20);
  }

  if(search){
    query = query.ilike('text', `%${search}%`);
  }

  const { data: quotes, error } = await query;

  if(error){
    console.error(error);
    return;
  }

  recentQuotesEl.innerHTML = quotes
    .map((quote) => `
      <div class="recent-quote" data-id="${quote.id}">
        <div class="recent-quote-book">${quote.books.title}</div>
        <textarea class="js-edit-quote-text recent-quote-text">${quote.text}</textarea>
        <div class="recent-quote-actions">
          <button type="button" class="js-save-quote">Save</button>
          <button type="button" class="js-feature-quote ${quote.featured ? 'is-featured' : ''}">
            ${quote.featured ? '★ Featured' : '☆ Set as Featured'}
          </button>
          <button type="button" class="js-delete-quote">Delete</button>
        </div>
      </div>
    `)
    .join('');

  recentQuotesEl.querySelectorAll('.recent-quote').forEach((row) => {
    const id = row.dataset.id;

    row.querySelector('.js-save-quote').addEventListener('click', async (event) => {
      const text = row.querySelector('.js-edit-quote-text').value.trim();
      if(!text) return;

      const button = event.target;
      button.textContent = 'Saving...';
      const { error } = await supabase.from('quotes').update({ text }).eq('id', id);
      button.textContent = error ? 'Save' : 'Saved ✓';
      if(error) alert(error.message);
      else setTimeout(() => { button.textContent = 'Save'; }, 1500);
    });

    row.querySelector('.js-delete-quote').addEventListener('click', async () => {
      if(!confirm('Delete this quote?')) return;
      await supabase.from('quotes').delete().eq('id', id);
      loadQuotesManage();
    });

    row.querySelector('.js-feature-quote').addEventListener('click', async () => {
      await supabase.from('quotes').update({ featured: false }).eq('featured', true);
      await supabase.from('quotes').update({ featured: true }).eq('id', id);
      loadQuotesManage();
    });
  });
}

async function loadBooksManage(){
  const { data: books, error } = await supabase
    .from('books')
    .select('id, title, author, category, status, image, slug')
    .order('title');

  if(error){
    console.error(error);
    return;
  }

  const search = booksSearchInput.value.trim().toLowerCase();
  const filteredBooks = search
    ? books.filter((book) =>
        book.title.toLowerCase().includes(search) ||
        (book.author ?? '').toLowerCase().includes(search))
    : books;

  if(filteredBooks.length === 0){
    booksManageEl.innerHTML = '<p class="admin-hint">No books match that search.</p>';
    return;
  }

  booksManageEl.innerHTML = filteredBooks.map((book) => `
    <div class="manage-book-card" data-id="${book.id}">
      <div class="manage-book-header">
        <img class="manage-book-cover" src="${book.image}" alt="" loading="lazy">
        <div>
          <div class="manage-book-title">${book.title}</div>
          <div class="manage-book-slug">${book.slug}</div>
        </div>
      </div>

      <div class="manage-book-fields">
        <label>Author
          <input type="text" class="js-edit-author" value="${book.author ?? ''}">
        </label>
        <label>Category
          <select class="js-edit-category">${categoryOptionsHTML(book.category)}</select>
        </label>
        <label>Status
          <select class="js-edit-status">
            <option value="published" ${book.status === 'published' ? 'selected' : ''}>Published</option>
            <option value="coming_soon" ${book.status === 'coming_soon' ? 'selected' : ''}>Coming soon</option>
          </select>
        </label>
        <label>Replace cover (optional)
          <input type="file" accept="image/*" class="js-edit-image-file">
        </label>
      </div>

      <div class="manage-book-actions">
        <button type="button" class="js-save-book">Save</button>
        <button type="button" class="js-delete-book">Delete</button>
      </div>
    </div>
  `).join('');

  booksManageEl.querySelectorAll('.manage-book-card').forEach((card) => {
    const id = card.dataset.id;
    const saveButton = card.querySelector('.js-save-book');

    saveButton.addEventListener('click', async () => {
      const author = card.querySelector('.js-edit-author').value.trim() || null;
      const category = card.querySelector('.js-edit-category').value || null;
      const status = card.querySelector('.js-edit-status').value;
      const file = card.querySelector('.js-edit-image-file').files[0];

      const updates = { author, category, status };

      if(file){
        saveButton.textContent = 'Uploading...';
        try{
          updates.image = await uploadCoverImage(file);
        }catch(error){
          alert(error.message);
          saveButton.textContent = 'Save';
          return;
        }
      }

      const { error } = await supabase.from('books').update(updates).eq('id', id);
      saveButton.textContent = 'Save';

      if(error){
        alert(error.message);
      }else if(updates.image){
        loadBooksManage();
      }
    });

    card.querySelector('.js-delete-book').addEventListener('click', async () => {
      if(!confirm('Delete this book and all of its quotes? This cannot be undone.')) return;
      await supabase.from('books').delete().eq('id', id);
      loadBooksManage();
      loadBooksDropdown();
    });
  });
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginError.textContent = '';

  const email = document.querySelector('.js-login-email').value;
  const password = document.querySelector('.js-login-password').value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if(error){
    loginError.textContent = error.message;
  }
});

logoutButton.addEventListener('click', async () => {
  await supabase.auth.signOut();
});

quoteForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  quoteStatus.textContent = '';

  const bookId = quoteBookSelect.value;
  const text = quoteTextInput.value.trim();

  if(!bookId || !text) return;

  const { data: lastQuote } = await supabase
    .from('quotes')
    .select('position')
    .eq('book_id', bookId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = (lastQuote?.position ?? 0) + 1;

  const { error } = await supabase
    .from('quotes')
    .insert({ book_id: bookId, text, position: nextPosition });

  if(error){
    quoteStatus.textContent = error.message;
    return;
  }

  quoteTextInput.value = '';
  quoteStatus.textContent = 'Quote added.';
  loadQuotesManage();
});

let booksSearchTimer;
booksSearchInput.addEventListener('input', () => {
  clearTimeout(booksSearchTimer);
  booksSearchTimer = setTimeout(() => loadBooksManage(), 250);
});

quotesBookFilter.addEventListener('change', () => {
  loadQuotesManage();
});

let quotesSearchTimer;
quotesSearchInput.addEventListener('input', () => {
  clearTimeout(quotesSearchTimer);
  quotesSearchTimer = setTimeout(() => loadQuotesManage(), 300);
});

bookTitleInput.addEventListener('input', () => {
  const title = bookTitleInput.value.trim();
  bookSlugInput.placeholder = title ? slugFromTitle(title) : 'Quotes-From-My-Book';
});

bookForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const title = bookTitleInput.value.trim();
  const slug = bookSlugInput.value.trim() || slugFromTitle(title);
  const file = bookImageFileInput.files[0];

  bookStatusText.textContent = 'Uploading cover...';

  let image;
  try{
    image = await uploadCoverImage(file);
  }catch(error){
    bookStatusText.textContent = error.message;
    return;
  }

  const { error } = await supabase.from('books').insert({
    title,
    author: bookAuthorInput.value.trim() || null,
    category: bookCategorySelect.value || null,
    slug,
    image,
    status: bookStatusSelect.value,
  });

  if(error){
    bookStatusText.textContent = error.message;
    return;
  }

  bookForm.reset();
  bookStatusText.textContent = 'Book added.';
  loadBooksDropdown();
  loadBooksManage();
});

supabase.auth.onAuthStateChange((_event, session) => {
  if(session){
    showLoggedIn();
  }else{
    showLoggedOut();
  }
});
