(function () {
  const items = Array.from(document.querySelectorAll('.paupi-item'));
  const galleries = Array.from(document.querySelectorAll('.media-gallery[data-media-gallery]'));

  if (!items.length) {
    return;
  }

  const setActiveGallery = (key) => {
    if (!galleries.length) {
      return;
    }
    galleries.forEach((gallery) => {
      gallery.classList.toggle('is-active', gallery.dataset.mediaGallery === key);
    });
  };

  const closeItem = (item) => {
    const panel = item.querySelector('.material-panel');
    const inner = item.querySelector('.material-panel-inner');
    const trigger = item.querySelector('.material-trigger');
    if (!panel || !inner || !trigger) {
      return;
    }
    panel.style.maxHeight = `${inner.scrollHeight}px`;
    window.requestAnimationFrame(() => {
      item.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      panel.style.maxHeight = '0px';
    });
  };

  const openItem = (item) => {
    const panel = item.querySelector('.material-panel');
    const inner = item.querySelector('.material-panel-inner');
    const trigger = item.querySelector('.material-trigger');
    if (!panel || !inner || !trigger) {
      return;
    }
    items.forEach((candidate) => {
      if (candidate !== item) {
        closeItem(candidate);
      }
    });
    item.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    panel.style.maxHeight = `${inner.scrollHeight}px`;
    setActiveGallery(item.dataset.mediaKey);
  };

  items.forEach((item) => {
    const trigger = item.querySelector('.material-trigger');
    const panel = item.querySelector('.material-panel');
    if (!trigger || !panel) {
      return;
    }
    trigger.setAttribute('aria-expanded', 'false');
    panel.style.maxHeight = '0px';

    trigger.addEventListener('click', () => {
      if (item.classList.contains('is-open')) {
        closeItem(item);
        return;
      }
      openItem(item);
    });
  });

  window.addEventListener('resize', () => {
    const openItemNode = document.querySelector('.paupi-item.is-open');
    if (!openItemNode) {
      return;
    }
    const panel = openItemNode.querySelector('.material-panel');
    const inner = openItemNode.querySelector('.material-panel-inner');
    if (!panel || !inner) {
      return;
    }
    panel.style.maxHeight = `${inner.scrollHeight}px`;
  });
})();
