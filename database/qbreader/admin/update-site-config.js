import { siteConfig } from '../collections.js';

/**
 * Creates or replaces the markdown of a site config document.
 * @param {string} _id - The identifier of the config document.
 * @param {string} markdown - The markdown text to store.
 * @returns The result of the update operation.
 */
export default async function updateSiteConfig (_id, markdown) {
  return await siteConfig.updateOne(
    { _id },
    { $set: { markdown } },
    { upsert: true }
  );
}
