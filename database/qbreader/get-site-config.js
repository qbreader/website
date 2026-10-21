import { siteConfig } from './collections.js';

/**
 * Gets a site config document, such as the markdown for the home page's feature of the day.
 * @param {string} _id - The identifier of the config document.
 * @returns {Promise<{_id: string, markdown: string} | null>} The document, or `null` if it has not been set.
 */
export default async function getSiteConfig (_id) {
  return await siteConfig.findOne({ _id });
}
