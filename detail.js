(function () {
  const key = 'selectedDetailCorner';
  let corner = 'tl';

  try {
    const saved = sessionStorage.getItem(key);
    if (saved === 'tl' || saved === 'tr' || saved === 'bl' || saved === 'br') {
      corner = saved;
    }
  } catch (_error) {
    // Ignore storage failures.
  }

  document.body.classList.add(`corner-${corner}`);
})();
