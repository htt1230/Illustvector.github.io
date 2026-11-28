"use strict";

function layerPositions(list) {
  return new Map([...list.children].filter((row) => row.dataset.layerId).map((row) => [
    row.dataset.layerId, row.getBoundingClientRect().top,
  ]));
}

function animateLayerOrder(list, before) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for (const row of list.querySelectorAll("[data-layer-id]")) {
    const previous = before.get(row.dataset.layerId);
    if (previous === undefined) continue;
    const offset = previous - row.getBoundingClientRect().top;
    if (Math.abs(offset) < 1) continue;
    row.animate(
      [{ transform: "translateY(" + offset + "px)" }, { transform: "translateY(0)" }],
      { duration: 200, easing: "cubic-bezier(.2,.8,.2,1)" },
    );
  }
}

function setupLayerDrag(list, onMove) {
  const panel = list.closest(".inspector");
  const threshold = 5;
  let drag = null;
  let skipClick = false;

  function viewportContainsPointer() {
    const box = panel.getBoundingClientRect();
    return drag.clientX >= box.left && drag.clientX <= box.right &&
      drag.clientY >= box.top && drag.clientY <= box.bottom;
  }

  function updatePositions() {
    const { row, scope, entries, tops, centers, heights, gap, height, from, clientY, grabOffset, placeholder } = drag;
    const start = clientY - scope.getBoundingClientRect().top - grabOffset;
    // Pick the closest row center using its untransformed position.
    const center = start + height / 2;
    let nearest = Infinity;
    for (const [index, candidate] of centers.entries()) {
      const distance = Math.abs(center - candidate);
      if (distance >= nearest) break;
      drag.to = index;
      nearest = distance;
    }
    row.style.setProperty("--layer-offset", start - tops[from] + "px");

    const order = entries.map((_, index) => index);
    order.splice(from, 1);
    order.splice(drag.to, 0, from);
    let top = tops[0];
    for (const index of order) {
      if (index === from) placeholder.style.top = top + "px";
      else entries[index].style.setProperty("--layer-offset", top - tops[index] + "px");
      top += heights[index] + gap;
    }
  }

  function autoScroll() {
    if (!drag?.placeholder) return;
    if (viewportContainsPointer()) {
      const box = panel.getBoundingClientRect();
      const edge = Math.min(42, box.height / 4);
      const above = Math.max(0, edge - (drag.clientY - box.top));
      const below = Math.max(0, edge - (box.bottom - drag.clientY));
      const previous = panel.scrollTop;
      if (above || below) panel.scrollTop += (below - above) / edge * 11;
      if (panel.scrollTop !== previous) updatePositions();
    }
    drag.frame = requestAnimationFrame(autoScroll);
  }

  function finish(drop = false) {
    if (!drag) return false;
    const { row, scope, entries, from, to, pointerId, placeholder, frame } = drag;
    const destination = drop && placeholder && from !== to && viewportContainsPointer()
      ? entries.length - 1 - to : -1;
    const before = destination >= 0 ? layerPositions(scope) : null;
    drag = null;
    if (placeholder) {
      skipClick = true;
      cancelAnimationFrame(frame);
      placeholder.remove();
      row.classList.remove("is-dragging");
      for (const entry of entries) entry.style.removeProperty("--layer-offset");
      if (list.hasPointerCapture(pointerId)) list.releasePointerCapture(pointerId);
    }
    if (destination >= 0) onMove(Number(row.dataset.layerId), destination, before);
    return true;
  }

  list.addEventListener("pointerdown", (event) => {
    skipClick = false;
    if (drag || event.button !== 0 || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.pointerType === "touch" && !event.target.closest(".layer-grip")) return;
    const row = event.target.closest(".layer-select")?.closest("[data-layer-id]");
    const scope = row?.parentElement;
    if (scope !== list || list.childElementCount < 2) return;
    drag = {
      row,
      scope,
      pointerId: event.pointerId,
      startY: event.clientY,
      grabOffset: event.clientY - row.getBoundingClientRect().top,
    };
  });

  window.addEventListener("pointermove", (event) => {
    if (drag?.pointerId !== event.pointerId) return;
    if (!drag.placeholder) {
      if (Math.abs(event.clientY - drag.startY) < threshold) return;
      drag.entries = [...drag.scope.children].filter((entry) =>
        entry.dataset.layerId && entry.dataset.guideRow === drag.row.dataset.guideRow);
      if (drag.entries.length < 2) {
        finish();
        return;
      }
      drag.from = drag.entries.indexOf(drag.row);
      if (drag.from < 0) {
        finish();
        return;
      }
      for (const entry of drag.entries) entry.getAnimations().forEach((animation) => animation.cancel());
      drag.tops = drag.entries.map((entry) => entry.offsetTop);
      drag.heights = drag.entries.map((entry) => entry.offsetHeight);
      drag.centers = drag.heights.map((height, index) => drag.tops[index] + height / 2);
      drag.gap = drag.tops[1] - drag.tops[0] - drag.heights[0];
      drag.height = drag.heights[drag.from];
      drag.placeholder = document.createElement("div");
      drag.placeholder.className = "layer-placeholder";
      drag.placeholder.setAttribute("aria-hidden", "true");
      drag.placeholder.style.height = drag.height + "px";
      drag.scope.append(drag.placeholder);
      list.setPointerCapture(event.pointerId);
      drag.row.classList.add("is-dragging");
      drag.frame = requestAnimationFrame(autoScroll);
    }
    drag.clientX = event.clientX;
    drag.clientY = event.clientY;
    updatePositions();
  });
  window.addEventListener("pointerup", (event) => {
    if (drag?.pointerId !== event.pointerId) return;
    if (drag.placeholder) {
      drag.clientX = event.clientX;
      drag.clientY = event.clientY;
      updatePositions();
    }
    finish(true);
  });
  window.addEventListener("pointercancel", (event) => {
    if (drag?.pointerId === event.pointerId) finish();
  });
  list.addEventListener("lostpointercapture", (event) => {
    if (drag?.pointerId === event.pointerId) finish();
  });
  window.addEventListener("blur", () => finish());
  list.addEventListener("click", (event) => {
    if (!skipClick || !event.detail) return;
    skipClick = false;
    event.stopImmediatePropagation();
    event.preventDefault();
  }, true);

  return {
    cancel: finish,
    get active() { return Boolean(drag?.placeholder); },
  };
}
