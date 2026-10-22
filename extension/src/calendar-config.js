// Public OAuth client IDs (not secrets). Empty means that provider is unavailable in this build.
// Google: Web application client, redirect https://<extension-id>.chromiumapp.org/
// Microsoft: Single-page application platform, same redirect URI.
// Firefox builds use a different redirect (browser.identity.getRedirectURL(), *.extensions.allizom.org); register it too.
export const googleClientId = '';
export const microsoftClientId = '';
