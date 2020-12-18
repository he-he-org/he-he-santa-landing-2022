const fs = require('fs');
const contentful = require('contentful');

const PRESENT_ENTRY_TYPE = 'secretSantaPresent';

const CONTENTFUL_SECRET_KEY = process.env.CONTENTFUL_SECRET_KEY;
const CONTENTFUL_SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
const CONTENTFUL_STATIC_TEXT_ID = process.env.CONTENTFUL_STATIC_TEXT_ID;

if (!CONTENTFUL_SECRET_KEY) {
  throw new Error(`Unable to read env variable CONTENTFUL_SECRET_KEY`)
}
if (!CONTENTFUL_SPACE_ID) {
  throw new Error(`Unable to read env variable CONTENTFUL_SPACE_ID`)
}
if (!CONTENTFUL_SPACE_ID) {
  throw new Error(`Unable to read env variable CONTENTFUL_STATIC_TEXT_ID`)
}


(async () => {
  try {
    for (const {lang, locale} of [
      { lang: 'en', locale: 'en-US' },
      { lang: 'ru', locale: 'ru-RU' },
    ]) {
      const client = contentful.createClient({
        space: CONTENTFUL_SPACE_ID,
        accessToken: CONTENTFUL_SECRET_KEY,
      });

      const presents = await client.getEntries({
        locale: locale,
        order: 'fields.price',
        content_type: PRESENT_ENTRY_TYPE,
        'fields.presentForUs[ne]': true,
      })

      const { fields: staticTexts } = await client.getEntry(CONTENTFUL_STATIC_TEXT_ID, { locale });

      const specialPresents = await client.getEntries({
        locale: locale,
        order: 'fields.presentForUs,fields.price',
        content_type: PRESENT_ENTRY_TYPE,
        'fields.presentForUs': true,
      })

      fs.writeFileSync(`content/_index.${lang}.md`, JSON.stringify(
        {
          ...staticTexts,
          'presents': [
            ...presents.items,
            ...specialPresents.items,
          ].map(({ sys, fields }) => ({ id: sys.id, ...fields })),
        },
        null,
        2,
      ))

    }

    console.log('Content downloaded')
  } catch (e) {
    console.error(e.message)
    process.exit(1);
  }
})()
