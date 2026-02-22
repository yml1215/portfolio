(function () {
  const items = Array.from(document.querySelectorAll('.project-item'));
  const mediaImage = document.querySelector('[data-project-media]');

  if (!items.length || !mediaImage) {
    return;
  }

  const closeItem = (item) => {
    const trigger = item.querySelector('.project-trigger');
    const panel = item.querySelector('.project-panel');
    if (!trigger || !panel) {
      return;
    }

    item.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    panel.style.maxHeight = '0px';
  };

  const openItem = (item) => {
    const trigger = item.querySelector('.project-trigger');
    const panel = item.querySelector('.project-panel');
    if (!trigger || !panel) {
      return;
    }

    item.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    panel.style.maxHeight = `${panel.scrollHeight}px`;

    const nextSrc = trigger.dataset.image;
    const nextAlt = trigger.dataset.alt || '';
    if (!nextSrc) {
      return;
    }

    const currentSrc = mediaImage.getAttribute('src') || '';
    if (currentSrc === nextSrc) {
      mediaImage.alt = nextAlt;
      return;
    }

    mediaImage.classList.add('is-swapping');
    window.setTimeout(() => {
      mediaImage.src = nextSrc;
      mediaImage.alt = nextAlt;
    }, 120);
    window.setTimeout(() => {
      mediaImage.classList.remove('is-swapping');
    }, 260);
  };

  items.forEach((item) => {
    const trigger = item.querySelector('.project-trigger');
    if (!trigger) {
      return;
    }

    trigger.addEventListener('click', () => {
      items.forEach((candidate) => {
        if (candidate !== item) {
          closeItem(candidate);
        }
      });
      openItem(item);
    });
  });

  items.forEach((item) => {
    if (item.classList.contains('is-open')) {
      openItem(item);
    } else {
      closeItem(item);
    }
  });

  window.addEventListener('resize', () => {
    const openPanel = document.querySelector('.project-item.is-open .project-panel');
    if (openPanel) {
      openPanel.style.maxHeight = `${openPanel.scrollHeight}px`;
    }
  });
})();
