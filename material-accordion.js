(function () {
  const items = Array.from(document.querySelectorAll('.material-item[data-media-key]'));
  const galleries = Array.from(document.querySelectorAll('.media-gallery[data-media-gallery]'));

  if (!items.length || !galleries.length) {
    return;
  }

  const setActiveGallery = (key) => {
    galleries.forEach((gallery) => {
      const isActive = gallery.dataset.mediaGallery === key;
      gallery.classList.toggle('is-active', isActive);
    });
  };

  const closeOtherItems = (activeItem) => {
    items.forEach((item) => {
      if (item !== activeItem) {
        closeItem(item);
      }
    });
  };

  const openItem = (item) => {
    const panel = item.querySelector('.material-panel');
    const inner = item.querySelector('.material-panel-inner');
    const trigger = item.querySelector('.material-trigger');
    if (!panel || !inner || !trigger) {
      return;
    }
    closeOtherItems(item);
    item.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    panel.style.maxHeight = `${inner.scrollHeight}px`;
    setActiveGallery(item.dataset.mediaKey);
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
    const openItemNode = document.querySelector('.material-item.is-open');
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
