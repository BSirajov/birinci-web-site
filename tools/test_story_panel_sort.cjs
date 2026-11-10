const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/site.js'), 'utf8');
let activeLanguage = 'az';
const sandbox = {Intl, currentPageLang: () => activeLanguage, visibleCatalogLabel: s => String(s || '').replace(/^(?:§\s*)?\d+(?:\.\d+)*\.?\s+/, '').trim()};
vm.createContext(sandbox);
vm.runInContext(source.slice(source.indexOf('  const storyGroupCollators ='), source.indexOf('  const groupedStoryNavMarkup =')) + '\nthis.sortGroups = sortedStoryNavGroups;', sandbox);
const alphabets = {
 az: 'A B C Ç D E Ə F G Ğ H X I İ J K Q L M N O Ö P R S Ş T U Ü V Y Z',
 en: 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z',
 de: 'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z',
 ru: 'А Б В Г Д Е Ё Ж З И Й К Л М Н О П Р С Т У Ф Х Ц Ч Ш Щ Ъ Ы Ь Э Ю Я',
 ky: 'А Б В Г Д Е Ё Ж З И Й К Л М Н Ң О Ө П Р С Т У Ү Ф Х Ц Ч Ш Щ Ъ Ы Ь Э Ю Я',
};
const result = {};
for (const [lang, alphabet] of Object.entries(alphabets)) {
 activeLanguage = lang;
 const letters = alphabet.split(' ');
 const input = letters.map((letter, i) => ({slug: letter, title: (i % 2 ? '… «' : ' — ') + (i % 2 ? letter.toLocaleLowerCase(lang) : letter)})).reverse();
 const snapshot = JSON.stringify(input);
 const sorted = sandbox.sortGroups(input);
 assert.deepEqual(Array.from(sorted, x => x.slug), letters, lang + ' alphabet, case, leading punctuation');
 assert.equal(JSON.stringify(input), snapshot, 'input order must remain unchanged');
 assert.ok(sorted.every(x => input.includes(x)), 'preserve original group objects');
 for (const letter of letters) {
  const pair = [{slug: 'first', title: letter.toLocaleLowerCase(lang)}, {slug: 'second', title: letter}];
  assert.deepEqual(Array.from(sandbox.sortGroups(pair), x => x.slug), ['first','second'], lang + ' stable case-insensitive ties');
 }
 const raw = fs.readFileSync(path.join(root, lang, 'assets/stories-data.js'), 'utf8');
 const catalog = JSON.parse(raw.slice(raw.indexOf('=') + 1).trim().replace(/;$/, ''));
 const groups = sandbox.sortGroups(catalog.categories);
 result[lang] = Array.from(groups, g => ({slug:g.slug, title:g.title}));
 console.log(lang + ': ' + groups.map(g => g.title).join(' → '));
}
// German dictionary collation keeps umlauts with their base letters, not after Z.
assert.deepEqual(Array.from(sandbox.sortGroups(['B','Ä','A','Z','Ö','O','Ü','U'].map(title => ({title})), 'de'), g => g.title), ['A','Ä','B','O','Ö','U','Ü','Z']);
console.log('PASS: five alphabets, case, leading punctuation, dynamic language, and nonmutation.');
// Exercise browsers whose ICU data silently resolves AZ/KY to English.
const fallbackSandbox = {
 Intl: {Collator: function () { return new Intl.Collator('en', {sensitivity:'accent'}); }},
 currentPageLang: () => activeLanguage,
 visibleCatalogLabel: sandbox.visibleCatalogLabel,
};
vm.createContext(fallbackSandbox);
vm.runInContext(source.slice(source.indexOf('  const storyGroupCollators ='), source.indexOf('  const groupedStoryNavMarkup =')) + '\nthis.sortGroups = sortedStoryNavGroups;', fallbackSandbox);
for (const lang of ['az', 'ky']) {
 activeLanguage = lang;
 const letters = alphabets[lang].split(' ');
 const groups = letters.map((letter, i) => ({slug:letter, title:'«' + (i % 2 ? letter.toLocaleLowerCase(lang) : letter)})).reverse();
 assert.deepEqual(Array.from(fallbackSandbox.sortGroups(groups), g => g.slug), letters, lang + ' missing ICU fallback');
}
console.log('PASS: Azerbaijani and Kyrgyz alphabet fallback without native locale data.');
if (process.env.STORY_SORT_REPORT) fs.writeFileSync(process.env.STORY_SORT_REPORT, JSON.stringify(result, null, 2) + '\n');
