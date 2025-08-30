// lib/i129fCoords.js
// Coordinates are in PDF "points" (1/72 inch). Origin (0,0) is bottom-left of the page.
// Update x/y to place text in the correct boxes. Use /api/i129f/debug-grid (below) to find coords.

export const COORDS = [
  // --- EXAMPLES: replace with your real positions ---
  // Petitioner name (you can split name into parts or use a single line)
  { key: 'petitioner_last_name',  page: 0, x: 120, y: 700, size: 10, maxWidth: 180 },
  { key: 'petitioner_first_name', page: 0, x: 320, y: 700, size: 10, maxWidth: 180 },
  { key: 'petitioner_middle_name',page: 0, x: 520, y: 700, size: 10, maxWidth: 100 },

  // Date of birth
  { key: 'petitioner_dob',        page: 0, x: 120, y: 676, size: 10, maxWidth: 140 },

  // Place of birth
  { key: 'petitioner_birth_city',    page: 0, x: 120, y: 652, size: 10, maxWidth: 180 },
  { key: 'petitioner_birth_country', page: 0, x: 320, y: 652, size: 10, maxWidth: 180 },

  // Example checkbox (draw an "X")
  // { key: 'petitioner_us_citizen_yes', page: 0, x: 120, y: 628, size: 12, asCheckbox: true },
  // { key: 'petitioner_us_citizen_no',  page: 0, x: 160, y: 628, size: 12, asCheckbox: true },

  // Add as many rows as needed for your form boxes...
];
