import { siteConfig } from './collections.js';

/**
 * Gets a site config document, such as the markdown for the home page's feature of the day.
 * @param {string} name - The name of the config document.
 * @returns {Promise<{name: string, markdown: string} | null>} The document, or `null` if it has not been set.
 */
export default async function getSiteConfig (name) {
  return await siteConfig.findOne({ name });
}
