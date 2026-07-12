// One-time script (already run): moved the hardcoded quotes that used to live in
// data/*.js into Supabase. Those files now live under legacy/data/ for reference.
// Requires Node 18+ (for global fetch). Never runs in the browser, never ships with the site.

import { books } from '../legacy/data/books.js';
import { quotes as strategiesOfWar } from '../legacy/data/33strategiesOfWarQuotes.js';
import { quotes as mastery } from '../legacy/data/masteryQuotes.js';
import { quotes as goals } from '../legacy/data/goalQuotes.js';
import { quotes as monk } from '../legacy/data/monkQoutes.js';
import { quotes as familyBusiness } from '../legacy/data/FamilyBusinessQuotes.js';
import { quotes as millionaireFastlane } from '../legacy/data/millionaireFastLaneQuotes.js';
import { quotes as fiveAmClub } from '../legacy/data/5amClubQuotes.js';
import { quotes as secretsOfClosingSell } from '../legacy/data/secretsOfClosingSellQuotes.js';
import { quotes as lawsOfHumanNature } from '../legacy/data/lawsOfHumanNatureQuotes.js';
import { quotes as richestManInBabylon } from '../legacy/data/richestManInBabylonQuotes.js';
import { quotes as richDadPoorDad } from '../legacy/data/richDadPoorDadQuotes.js';
import { quotes as winFriends } from '../legacy/data/winFriendsQuotes.js';
import { quotes as habits7 } from '../legacy/data/7habits.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if(!SUPABASE_URL || !SERVICE_ROLE_KEY){
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars before running this script.');
  process.exit(1);
}

// Maps each book's existing page slug (books.js "link") to its hardcoded quotes array.
// Books with link "coming-soon" have no quotes file and are skipped here.
const quotesByLink = {
  'Quotes-From-33-Strategies-Of-War': strategiesOfWar,
  'Quotes-from-Mastery': mastery,
  'Quotes-From-Goals-by-Brian-Tracy': goals,
  'Quotes-From-The-Monk-Who-Sold-His-Ferrari': monk,
  'Quotes-From-How-To-Lead-The-Family-Business': familyBusiness,
  'Quotes-From-The-Millionaire-Fastlane': millionaireFastlane,
  'Quotes-from-The-5am-Club': fiveAmClub,
  'Quotes-From-Secrets-Of-Closing-A-Sell': secretsOfClosingSell,
  'Quotes-From-Laws-of-Human-Nature': lawsOfHumanNature,
  'Quotes-From-The-Richest-Man-In-Babylon': richestManInBabylon,
  'Quotes-From-Rich-Dad-Poor-Dad': richDadPoorDad,
  'Quotes-From-How-To-Win-Friends-And-Influence-People': winFriends,
  'Quotes-From-7-Habits-of-Highly-Effective-People': habits7,
};

function toSlug(title){
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Quotes were hand-numbered in the original text ("1. ...", "2. ..."); the new
// `position` column replaces that, and the site adds the number back at render time.
function stripLeadingNumber(text){
  return text.replace(/^\d+\.\s*/, '');
}

async function supabaseRequest(path, options){
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options?.headers ?? {}),
    },
  });

  if(!response.ok){
    throw new Error(`${path} failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

async function migrate(){
  const seenSlugs = new Set();

  for(const book of books){
    const isComingSoon = book.link === 'coming-soon';
    const slug = isComingSoon ? toSlug(book.title) : book.link;

    if(seenSlugs.has(slug)){
      console.log(`Skipping duplicate slug "${slug}" for "${book.title}"`);
      continue;
    }
    seenSlugs.add(slug);

    const [insertedBook] = await supabaseRequest('books', {
      method: 'POST',
      body: JSON.stringify({
        slug,
        title: book.title,
        image: book.image,
        status: isComingSoon ? 'coming_soon' : 'published',
      }),
    });

    console.log(`Inserted book "${book.title}" (id ${insertedBook.id})`);

    const quotes = quotesByLink[book.link];
    if(!quotes) continue;

    const quoteRows = quotes.map((text, index) => ({
      book_id: insertedBook.id,
      text: stripLeadingNumber(text),
      position: index + 1,
    }));

    await supabaseRequest('quotes', {
      method: 'POST',
      body: JSON.stringify(quoteRows),
    });

    console.log(`  -> inserted ${quoteRows.length} quotes`);
  }

  console.log('Migration complete.');
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
