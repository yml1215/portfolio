(function () {
  const layout = document.querySelector('.layout');
  const dots = Array.from(document.querySelectorAll('.project-dot'));
  const constellationLines = Array.from(document.querySelectorAll('.constellation-line'));
  const nameLabel = document.querySelector('.name-label');
  const squareMessage = document.querySelector('.square-message');
  const scrollHint = document.getElementById('scrollHint');
  const SCROLL_STATE_KEY = 'mainScrollProgressV2';

  if (!layout || dots.length !== 6) {
    return;
  }

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeOutBackSoft = (t) => {
    const c1 = 1.1;
    const c3 = c1 + 1;
    return 1 + (c3 * Math.pow(t - 1, 3)) + (c1 * Math.pow(t - 1, 2));
  };
  const easeInOutCubic = (t) => (t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOutExpoSoft = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -6 * t));

  const spreadRange = 3200;
  const wheelSpeed = 1.05;
  const safePadding = 36;
  const minDotDistance = 110;
  const labelGap = 20;
  let labelWidth = 48;
  let labelHeight = 64;
  const minLabelGap = 16;
  const lineConnections = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 0],
    [0, 3],
    [1, 4],
  ];
  const floatSeeds = dots.map((_, i) => ({
    xPhase: (i + 1) * 0.9,
    yPhase: (i + 1) * 1.3,
    xSpeed: 0.18 + (i * 0.02),
    ySpeed: 0.14 + (i * 0.018),
  }));

  let virtualScroll = 0;
  let progressState = 0;
  let velocity = 0;
  let scheduled = false;
  let targets = [];
  let labelMetrics = [];

  dots.forEach((dot) => {
    const thumbSrc = dot.dataset.thumb;
    if (!thumbSrc || dot.querySelector('.project-thumb')) {
      return;
    }
    const img = document.createElement('img');
    img.className = 'project-thumb';
    img.src = thumbSrc;
    img.alt = '';
    img.loading = 'lazy';
    dot.appendChild(img);
  });

  const persistScrollState = () => {
    try {
      sessionStorage.setItem(SCROLL_STATE_KEY, String(virtualScroll));
    } catch (_error) {
      // Ignore storage failures.
    }
  };

  const restoreScrollState = () => {
    try {
      const raw = sessionStorage.getItem(SCROLL_STATE_KEY);
      if (!raw) {
        return false;
      }
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) {
        return false;
      }
      virtualScroll = clamp(parsed, 0, spreadRange);
      progressState = clamp(virtualScroll / spreadRange, 0, 1);
      velocity = 0;
      return virtualScroll > 0;
    } catch (_error) {
      return false;
    }
  };

  const hideScrollHint = (immediate) => {
    if (!scrollHint) {
      return;
    }

    if (immediate) {
      scrollHint.remove();
      return;
    }

    window.setTimeout(() => {
      scrollHint.classList.add('is-hidden');
      window.setTimeout(() => scrollHint.remove(), 240);
    }, 1700);
  };

  const getLabelBox = (point, metricWidth) => {
    const top = point.y - (labelHeight / 2);
    const bottom = top + labelHeight;
    if (point.side === 'left') {
      const right = point.x - labelGap;
      return {
        left: right - metricWidth,
        right,
        top,
        bottom,
      };
    }
    const left = point.x + labelGap;
    return {
      left,
      right: left + metricWidth,
      top,
      bottom,
    };
  };

  const boxesOverlap = (a, b, gap) => (
    a.left < (b.right + gap) &&
    a.right > (b.left - gap) &&
    a.top < (b.bottom + gap) &&
    a.bottom > (b.top - gap)
  );

  const isValidCandidate = (candidate, points, metricWidth) => {
    const candidateBox = getLabelBox(candidate, metricWidth);
    return points.every((p, idx) => {
      const dotOk = Math.hypot(p.x - candidate.x, p.y - candidate.y) >= minDotDistance;
      const otherMetric = labelMetrics[idx] || { width: 180 };
      const otherBox = getLabelBox(p, otherMetric.width);
      const labelOk = !boxesOverlap(candidateBox, otherBox, minLabelGap);
      return dotOk && labelOk;
    });
  };

  const measureLabelMetrics = () => {
    const rootFontSize = Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16;
    labelWidth = rootFontSize * 3.9;
    labelHeight = rootFontSize * 5.2;
    labelMetrics = dots.map(() => ({
      width: labelWidth,
      side: 'right',
    }));
  };

  const buildTargets = () => {
    const w = layout.clientWidth;
    const h = layout.clientHeight;
    const minY = safePadding + (labelHeight / 2);
    const maxY = Math.max(minY + 1, h - safePadding - (labelHeight / 2));

    const points = [];
    let guard = 0;

    while (points.length < dots.length && guard < 6000) {
      guard += 1;
      const metric = labelMetrics[points.length] || { width: 180 };
      const preferRight = Math.random() > 0.35;
      const rightMinX = safePadding + 8;
      const rightMaxX = Math.max(rightMinX + 1, w - safePadding - labelGap - metric.width - 8);
      const leftMinX = safePadding + labelGap + metric.width + 8;
      const leftMaxX = Math.max(leftMinX + 1, w - safePadding - 8);
      const canRight = rightMaxX > rightMinX;
      const canLeft = leftMaxX > leftMinX;
      const useRight = (preferRight && canRight) || !canLeft;
      const minX = useRight ? rightMinX : leftMinX;
      const maxX = useRight ? rightMaxX : leftMaxX;
      const candidate = {
        x: minX + Math.random() * (maxX - minX),
        y: minY + Math.random() * (maxY - minY),
        side: useRight ? 'right' : 'left',
      };
      if (isValidCandidate(candidate, points, metric.width)) {
        points.push(candidate);
      }
    }

    while (points.length < dots.length) {
      const metric = labelMetrics[points.length] || { width: 180 };
      const rightMinX = safePadding + 8;
      const rightMaxX = Math.max(rightMinX + 1, w - safePadding - labelGap - metric.width - 8);
      const leftMinX = safePadding + labelGap + metric.width + 8;
      const leftMaxX = Math.max(leftMinX + 1, w - safePadding - 8);
      const canRight = rightMaxX > rightMinX;
      const useRight = canRight;
      const minX = useRight ? rightMinX : leftMinX;
      const maxX = useRight ? rightMaxX : leftMaxX;
      let picked = null;
      let attempts = 0;
      while (!picked && attempts < 500) {
        attempts += 1;
        const candidate = {
          x: minX + Math.random() * (maxX - minX),
          y: minY + Math.random() * (maxY - minY),
          side: useRight ? 'right' : 'left',
        };
        if (isValidCandidate(candidate, points, metric.width)) {
          picked = candidate;
        }
      }

      points.push(picked || {
        x: minX + Math.random() * (maxX - minX),
        y: minY + Math.random() * (maxY - minY),
        side: useRight ? 'right' : 'left',
      });
    }

    targets = points;
    dots.forEach((dot, index) => {
      const side = targets[index]?.side || 'right';
      dot.classList.toggle('label-left', side === 'left');
    });
  };

  const update = () => {
    const rawProgress = clamp(virtualScroll / spreadRange, 0, 1);
    const delta = rawProgress - progressState;
    velocity += delta * 0.085;
    velocity *= 0.86;
    progressState = clamp(progressState + velocity, 0, 1);

    const eased = clamp(easeOutBackSoft(progressState), 0, 1);
    const centerX = layout.clientWidth / 2;
    const centerY = layout.clientHeight / 2;
    const time = performance.now() * 0.001;
    const phaseSquareInEnd = 0.4;
    const phaseSquareHoldEnd = 0.68;
    const phaseCollapseEnd = 0.82;
    const splitStart = 0.14;
    const squareProgress = clamp(progressState / phaseSquareInEnd, 0, 1);
    const squareSplitProgress = clamp((progressState - splitStart) / (phaseSquareInEnd - splitStart), 0, 1);
    const squareEnterT = easeOutBackSoft(squareSplitProgress);
    const collapseProgress = clamp((progressState - phaseSquareHoldEnd) / (phaseCollapseEnd - phaseSquareHoldEnd), 0, 1);
    const collapseT = easeInOutCubic(collapseProgress);
    const constellationProgress = clamp((progressState - phaseCollapseEnd) / (1 - phaseCollapseEnd), 0, 1);
    const constellationT = clamp(easeOutExpoSoft(constellationProgress), 0, 1);
    const floatFactor = constellationProgress;
    const floatAmp = 28 * floatFactor;
    const squareHalfWidth = Math.min(layout.clientWidth * 0.28, 360);
    const squareHalfHeight = Math.min(layout.clientHeight * 0.2, 230);
    const squareTargets = [
      { x: centerX - squareHalfWidth, y: centerY - squareHalfHeight }, // LT
      { x: centerX + squareHalfWidth, y: centerY - squareHalfHeight }, // RT
      { x: centerX - squareHalfWidth, y: centerY + squareHalfHeight }, // LB
      { x: centerX + squareHalfWidth, y: centerY + squareHalfHeight }, // RB
    ];
    const points = [];

    dots.forEach((dot, index) => {
      const target = targets[index] || { x: centerX, y: centerY };
      const squareTarget = squareTargets[index] || { x: centerX, y: centerY };
      let baseX = centerX;
      let baseY = centerY;

      if (progressState < phaseSquareInEnd) {
        if (progressState < splitStart) {
          baseX = centerX;
          baseY = centerY;
        } else {
          baseX = centerX + ((squareTarget.x - centerX) * squareEnterT);
          baseY = centerY + ((squareTarget.y - centerY) * squareEnterT);
        }
      } else if (progressState < phaseSquareHoldEnd) {
        baseX = squareTarget.x;
        baseY = squareTarget.y;
      } else if (progressState < phaseCollapseEnd) {
        baseX = squareTarget.x + ((centerX - squareTarget.x) * collapseT);
        baseY = squareTarget.y + ((centerY - squareTarget.y) * collapseT);
      } else {
        baseX = centerX + ((target.x - centerX) * constellationT);
        baseY = centerY + ((target.y - centerY) * constellationT);
      }

      const seed = floatSeeds[index];
      const floatX =
        (Math.sin((time * seed.xSpeed) + seed.xPhase) * 0.72 + Math.sin((time * (seed.xSpeed * 0.53)) + (seed.xPhase * 1.7)) * 0.28) * floatAmp;
      const floatY =
        (Math.cos((time * seed.ySpeed) + seed.yPhase) * 0.68 + Math.cos((time * (seed.ySpeed * 0.49)) + (seed.yPhase * 1.5)) * 0.32) * floatAmp;
      const x = baseX + floatX;
      const y = baseY + floatY;
      dot.style.left = `${x}px`;
      dot.style.top = `${y}px`;

      let dotOpacity = 1;
      if (index < 4) {
        // First four dots exist from the start and overlap at the center,
        // so they read visually as a single dot before splitting.
        dotOpacity = 1;
      } else {
        dotOpacity = clamp((progressState - phaseCollapseEnd) / 0.12, 0, 1);
      }
      dot.style.opacity = `${dotOpacity}`;

      const revealThumbs = constellationProgress > 0.62;
      dot.classList.toggle('is-revealed', revealThumbs);
      dot.style.pointerEvents = constellationProgress > 0.38 ? 'auto' : 'none';
      points.push({ x, y });
    });

    if (constellationLines.length) {
      const lineOpacity = clamp((constellationProgress - 0.2) / 0.52, 0, 1);
      constellationLines.forEach((line, index) => {
        const pair = lineConnections[index];
        if (!pair || !points[pair[0]] || !points[pair[1]]) {
          line.style.opacity = '0';
          return;
        }
        const from = points[pair[0]];
        const to = points[pair[1]];
        line.setAttribute('x1', `${from.x}`);
        line.setAttribute('y1', `${from.y}`);
        line.setAttribute('x2', `${to.x}`);
        line.setAttribute('y2', `${to.y}`);
        line.style.opacity = `${lineOpacity}`;
      });
    }

    if (nameLabel) {
      const nameFade = 1 - clamp((progressState - 0.1) / 0.24, 0, 1);
      nameLabel.style.opacity = `${nameFade}`;
    }

    if (squareMessage) {
      const fadeIn = clamp((progressState - 0.2) / 0.16, 0, 1);
      const fadeOut = 1 - clamp((progressState - 0.68) / 0.14, 0, 1);
      const msgOpacity = Math.min(fadeIn, fadeOut);
      squareMessage.style.opacity = `${msgOpacity}`;
      squareMessage.style.transform = `translate(-50%, calc(-50% + ${(1 - msgOpacity) * 10}px))`;
    }

    const shouldKeepAnimating = constellationProgress > 0.02;
    scheduled = false;
    if (Math.abs(rawProgress - progressState) > 0.0005 || Math.abs(velocity) > 0.0005 || shouldKeepAnimating) {
      requestUpdate();
    }
  };

  const requestUpdate = () => {
    if (scheduled) {
      return;
    }
    scheduled = true;
    window.requestAnimationFrame(update);
  };

  measureLabelMetrics();
  buildTargets();
  const navigationEntries = performance.getEntriesByType('navigation');
  const navigationType = navigationEntries.length > 0 ? navigationEntries[0].type : '';
  const isReloadNavigation = navigationType === 'reload';
  if (isReloadNavigation) {
    try {
      sessionStorage.removeItem(SCROLL_STATE_KEY);
    } catch (_error) {
      // Ignore storage failures.
    }
  }
  const hasRestoredState = !isReloadNavigation && restoreScrollState();
  hideScrollHint(hasRestoredState);
  requestUpdate();

  window.addEventListener('resize', () => {
    measureLabelMetrics();
    buildTargets();
    requestUpdate();
  });

  window.addEventListener('wheel', (event) => {
    const primaryDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX)
      ? event.deltaY
      : event.deltaX;
    if (primaryDelta === 0) {
      return;
    }
    virtualScroll = clamp(virtualScroll + (primaryDelta * wheelSpeed), 0, spreadRange);
    persistScrollState();
    requestUpdate();
    event.preventDefault();
  }, { passive: false });
})();
