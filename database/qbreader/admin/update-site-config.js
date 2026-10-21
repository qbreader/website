import { siteConfig } from '../collections.js';

/**
 * Creates or replaces the markdown of a site config document.
 * @param {string} name - The name of the config document.
 * @param {string} markdown - The markdown text to store.
 * @returns The result of the update operation.
 */
export default async function updateSiteConfig (name, markdown) {
  return await siteConfig.updateOne(
    { name },
    { $set: { markdown } },
    { upsert: true }
  );
}
