(function () {
  const layout = document.querySelector('.layout');
  const dots = Array.from(document.querySelectorAll('.dot16'));
  const nameInitial = document.querySelector('.name-initial');
  const nameNext = document.querySelector('.name-next');
  const lines = Array.from(document.querySelectorAll('.connect-line'));
  const brandLabel = document.querySelector('.corner-label.brand');
  const objectLabel = document.querySelector('.corner-label.object');
  const experienceLabel = document.querySelector('.corner-label.experience');
  const materialLabel = document.querySelector('.corner-label.material');
  const selectedWorksBtn = document.querySelector('.selected-works-btn');
  const SCROLL_STATE_KEY = 'mainVirtualScroll';

  if (!layout || dots.length < 4) {
    return;
  }

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeOutBack = (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + (c3 * Math.pow(t - 1, 3)) + (c1 * Math.pow(t - 1, 2));
  };
  const easeOutBackSoft = (t) => {
    const c1 = 1.15;
    const c3 = c1 + 1;
    return 1 + (c3 * Math.pow(t - 1, 3)) + (c1 * Math.pow(t - 1, 2));
  };
  const dotRadius = 8;
  const lineGap = 9;
  const labelInset = 52;
  let virtualScroll = 0;
  let dotProgressState = 0;
  let dotVelocity = 0;
  let lineProgressState = 0;
  let lineVelocity = 0;
  let autoPlayEnabled = false;
  let autoPlayStartAt = 0;
  const autoPlayHoldDuration = 1000;
  const autoPlayMotionDuration = 5000;

  const getTimeline = () => {
    const dotStart = window.innerWidth * 0.08;
    const dotDistance = Math.max(1, window.innerWidth * 1.3);
    const lineStart = dotStart + dotDistance + (window.innerWidth * 0.06);
    const lineDistance = Math.max(1, window.innerWidth * 1.45);
    return {
      dotStart,
      dotDistance,
      lineStart,
      lineDistance,
      maxVirtualScroll: lineStart + lineDistance,
    };
  };

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

      const { dotStart, dotDistance, lineStart, lineDistance, maxVirtualScroll } = getTimeline();
      virtualScroll = clamp(parsed, 0, maxVirtualScroll);
      dotProgressState = clamp((virtualScroll - dotStart) / dotDistance, 0, 1);
      lineProgressState = clamp((virtualScroll - lineStart) / lineDistance, 0, 1);
      dotVelocity = 0;
      lineVelocity = 0;
      return virtualScroll > 0;
    } catch (_error) {
      return false;
    }
  };

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

  const hasRestoredState = isReloadNavigation ? false : restoreScrollState();
  autoPlayEnabled = !hasRestoredState;
  autoPlayStartAt = performance.now();

  let scheduled = false;

  const updateDots = () => {
    if (autoPlayEnabled) {
      const { maxVirtualScroll } = getTimeline();
      const elapsed = performance.now() - autoPlayStartAt;
      if (elapsed <= autoPlayHoldDuration) {
        virtualScroll = 0;
      } else {
        const t = clamp((elapsed - autoPlayHoldDuration) / autoPlayMotionDuration, 0, 1);
        const eased = easeOutCubic(t);
        virtualScroll = maxVirtualScroll * eased;
        if (t >= 1) {
          autoPlayEnabled = false;
        }
      }
      if (elapsed >= autoPlayHoldDuration + autoPlayMotionDuration) {
        autoPlayEnabled = false;
      }
    }

    const halfW = layout.clientWidth / 2;
    const halfH = layout.clientHeight / 2;
    const targetAspect = 1.9; // always wider than tall
    const maxRectWidth = layout.clientWidth * 0.78;
    const maxRectHeight = layout.clientHeight * 0.56;
    const rectWidth = Math.min(maxRectWidth, maxRectHeight * targetAspect);
    const rectHeight = rectWidth / targetAspect;
    const leftX = halfW - (rectWidth / 2);
    const rightX = halfW + (rectWidth / 2);
    const topY = halfH - (rectHeight / 2);
    const bottomY = halfH + (rectHeight / 2);

    const { dotStart, dotDistance, lineStart, lineDistance } = getTimeline();
    const rawDotProgress = clamp((virtualScroll - dotStart) / dotDistance, 0, 1);
    const rawLineProgress = clamp((virtualScroll - lineStart) / lineDistance, 0, 1);
    const dotDelta = rawDotProgress - dotProgressState;
    dotVelocity += dotDelta * 0.12;
    dotVelocity *= 0.82;
    dotProgressState = clamp(dotProgressState + dotVelocity, 0, 1);
    const progress = dotProgressState;
    const eased = clamp(easeOutBackSoft(progress), 0, 1);
    const lineDelta = rawLineProgress - lineProgressState;
    lineVelocity += lineDelta * 0.1;
    lineVelocity *= 0.76;
    lineProgressState = clamp(lineProgressState + lineVelocity, 0, 1);
    const lineProgress = lineProgressState;

    const offsets = [
      [leftX - halfW, topY - halfH],
      [rightX - halfW, topY - halfH],
      [leftX - halfW, bottomY - halfH],
      [rightX - halfW, bottomY - halfH],
    ];

    const centerX = halfW;
    const centerY = halfH;
    const pointTLRect = { x: centerX + (offsets[0][0] * eased), y: centerY + (offsets[0][1] * eased) };
    const pointTRRect = { x: centerX + (offsets[1][0] * eased), y: centerY + (offsets[1][1] * eased) };
    const pointBLRect = { x: centerX + (offsets[2][0] * eased), y: centerY + (offsets[2][1] * eased) };
    const pointBRRect = { x: centerX + (offsets[3][0] * eased), y: centerY + (offsets[3][1] * eased) };

    let pointTL = pointTLRect;
    let pointTR = pointTRRect;
    let pointBL = pointBLRect;
    let pointBR = pointBRRect;
    const pointOffsets = [
      [pointTL.x - centerX, pointTL.y - centerY],
      [pointTR.x - centerX, pointTR.y - centerY],
      [pointBL.x - centerX, pointBL.y - centerY],
      [pointBR.x - centerX, pointBR.y - centerY],
    ];

    dots.slice(0, 4).forEach((dot, index) => {
      const [x, y] = pointOffsets[index];
      dot.style.setProperty('--x', `${x}px`);
      dot.style.setProperty('--y', `${y}px`);
    });

    if (lines.length >= 4) {
      const orderedPoints = [pointBL, pointBR, pointTR, pointTL, pointBL];

      lines.slice(0, 4).forEach((line, index) => {
        const from = orderedPoints[index];
        const to = orderedPoints[index + 1];
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const length = Math.hypot(dx, dy);

        if (length <= 0.001) {
          line.style.opacity = '0';
          return;
        }

        const ux = dx / length;
        const uy = dy / length;
        const inset = Math.min(dotRadius + lineGap, length / 2);

        const x1 = from.x + (ux * inset);
        const y1 = from.y + (uy * inset);
        const x2 = to.x - (ux * inset);
        const y2 = to.y - (uy * inset);

        const trimmedLength = Math.hypot(x2 - x1, y2 - y1);
        let segmentProgressLinear = clamp((lineProgress * 4) - index, 0, 1);
        const segmentProgress = clamp(easeOutBack(segmentProgressLinear), 0, 1);

        line.setAttribute('x1', `${x1}`);
        line.setAttribute('y1', `${y1}`);
        line.setAttribute('x2', `${x2}`);
        line.setAttribute('y2', `${y2}`);
        line.style.opacity = segmentProgress > 0 ? '1' : '0';
        line.style.strokeDasharray = `${trimmedLength}`;
        line.style.strokeDashoffset = `${trimmedLength * (1 - segmentProgress)}`;
      });

      if (brandLabel && objectLabel && experienceLabel && materialLabel) {
        const placeLabel = (el, x, y, alignRight, alignBottom) => {
          const width = el.offsetWidth || 0;
          const height = el.offsetHeight || 0;
          const left = alignRight ? x - width : x;
          const top = alignBottom ? y - height : y;
          el.style.left = `${left}px`;
          el.style.top = `${top}px`;
          el.style.textAlign = alignRight ? 'right' : 'left';
        };

        placeLabel(experienceLabel, pointTL.x + labelInset, pointTL.y + labelInset, false, false);
        placeLabel(objectLabel, pointTR.x - labelInset, pointTR.y + labelInset, true, false);
        placeLabel(materialLabel, pointBL.x + labelInset, pointBL.y - labelInset, false, true);
        placeLabel(brandLabel, pointBR.x - labelInset, pointBR.y - labelInset, true, true);

        const reveal = (el, threshold) => {
          const local = clamp((lineProgress - threshold) / 0.12, 0, 1);
          const easedLocal = easeOutCubic(local);
          el.style.opacity = `${easedLocal}`;
          el.style.transform = `translateY(${24 * (1 - easedLocal)}px)`;
          el.style.pointerEvents = easedLocal > 0.02 ? 'auto' : 'none';
        };

        reveal(brandLabel, 0.13);
        reveal(objectLabel, 0.38);
        reveal(experienceLabel, 0.63);
        reveal(materialLabel, 0.88);
      }
    }

    if (selectedWorksBtn) {
      const revealLocal = clamp((lineProgress - 0.96) / 0.06, 0, 1);
      const revealEased = easeOutCubic(revealLocal);
      selectedWorksBtn.style.opacity = `${revealEased}`;
      selectedWorksBtn.style.transform = `translate(-50%, -50%) translateY(${14 * (1 - revealEased)}px)`;
      selectedWorksBtn.style.pointerEvents = revealEased > 0.8 ? 'auto' : 'none';
    }

    if (nameInitial && nameNext) {
      const transitionProgress = clamp((progress - 0.12) / 0.72, 0, 1);
      const outProgress = clamp(transitionProgress / 0.3, 0, 1);
      const inProgress = clamp((transitionProgress - 0.08) / 0.7, 0, 1);
      const inEased = easeOutCubic(inProgress);

      const initialShift = -26 + (72 * outProgress);
      const nextShift = 90 * (1 - inEased);

      const initialOpacity = 1 - outProgress;
      const nextOpacity = inEased;
      const nameNextOutProgress = clamp(lineProgress / 0.22, 0, 1);
      const nameNextOutEased = easeOutCubic(nameNextOutProgress);
      const nameNextExitShift = 42 * nameNextOutEased;
      const nameNextVisibleOpacity = nextOpacity * (1 - nameNextOutEased);

      nameInitial.style.opacity = `${initialOpacity}`;
      nameInitial.style.transform = `translate(-50%, calc(-50% + ${initialShift}px))`;

      nameNext.style.opacity = `${nameNextVisibleOpacity}`;
      nameNext.style.transform = `translate(-50%, calc(-50% + ${nextShift + nameNextExitShift}px))`;
    }

    scheduled = false;
    persistScrollState();

    if (
      Math.abs(rawDotProgress - dotProgressState) > 0.0005 ||
      Math.abs(dotVelocity) > 0.0005 ||
      Math.abs(rawLineProgress - lineProgressState) > 0.0005 ||
      Math.abs(lineVelocity) > 0.0005 ||
      autoPlayEnabled
    ) {
      requestUpdate();
    }
  };

  const requestUpdate = () => {
    if (scheduled) {
      return;
    }

    scheduled = true;
    window.requestAnimationFrame(updateDots);
  };

  window.addEventListener('resize', requestUpdate);
  window.addEventListener('wheel', (event) => {
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      event.preventDefault();
    }
  }, { passive: false });

  requestUpdate();
})();
