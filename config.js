// Site configuration for whatmightwebecome.com — edit by hand, then commit and push.
window.WMWB = {
  releaseDate: "2026-12-14",  // the status line shows "Pre-order; released 14 December 2026" before the date and "Released 14 December 2026" after
  retailers: [
    { name: "Amazon (Kindle pre-order)", url: "https://www.amazon.com/dp/B0HQCVGB9L", enabled: true },   // ASIN B0HQCVGB9L, pre-order live 4 Nov 2026
    { name: "Amazon paperback", url: "", enabled: false },
    { name: "Amazon hardcover", url: "", enabled: false },
    { name: "Barnes & Noble", url: "", enabled: false },
    { name: "Kobo", url: "", enabled: false },
    { name: "Apple Books", url: "", enabled: false },
    { name: "Bookshop.org", url: "", enabled: false }
  ],
  contactEmail: "hello@whatmightwebecome.com",   // forwards to elias@; leave empty to hide the contact line
  siteUrl: "https://whatmightwebecome.com"   // canonical/OG/sitemap
};
