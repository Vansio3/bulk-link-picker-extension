let isShiftPressed = false;
let isDragging = false;
let startX, startY;
let underlinedLinks = [];

const selectionBox = document.createElement('div');
selectionBox.id = 'selection-box';

const linkCounter = document.createElement('div');
linkCounter.id = 'link-counter';

// --- Event Listeners ---

document.addEventListener('keydown', e => {
  if (e.key === 'Shift') {
    isShiftPressed = true;
  }
});

document.addEventListener('keyup', e => {
  if (e.key === 'Shift') {
    isShiftPressed = false;
    if (isDragging) {
      isDragging = false;
      cleanUpDOM();
      chrome.runtime.sendMessage({ action: 'updateBadge', count: '' }).catch(() => {});
    }
  }
});

window.addEventListener('blur', () => {
  isShiftPressed = false;
  if (isDragging) {
    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    cleanUpDOM();
    chrome.runtime.sendMessage({ action: 'updateBadge', count: '' }).catch(() => {});
  }
});

document.addEventListener('mousedown', e => {
  if (isShiftPressed) {
    e.preventDefault();
    isDragging = true;

    startX = e.pageX;
    startY = e.pageY;

    selectionBox.style.left = `${startX}px`;
    selectionBox.style.top = `${startY}px`;
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    document.body.appendChild(selectionBox);

    linkCounter.style.left = `${startX}px`;
    linkCounter.style.top = `${startY}px`;
    linkCounter.textContent = '0';
    document.body.appendChild(linkCounter);

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp, { once: true });
  }
});

function onMouseMove(e) {
  if (isDragging) {
    const width = e.pageX - startX;
    const height = e.pageY - startY;

    const newLeft = width > 0 ? startX : e.pageX;
    const newTop = height > 0 ? startY : e.pageY;

    selectionBox.style.left = `${newLeft}px`;
    selectionBox.style.top = `${newTop}px`;
    selectionBox.style.width = `${Math.abs(width)}px`;
    selectionBox.style.height = `${Math.abs(height)}px`;

    linkCounter.style.left = `${e.pageX}px`;
    linkCounter.style.top = `${e.pageY}px`;

    updateLinkCounterAndStyle();
  }
}

function onMouseUp() {
  if (isDragging) {
    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);

    const selectedLinks = getLinksInSelection();
    const urlsToOpen = Array.from(new Set(selectedLinks.map(link => link.href)));

    if (urlsToOpen.length > 0) {
      chrome.runtime.sendMessage({ action: 'openTabs', urls: urlsToOpen });
      // Apply the "visited" style to the links.
      selectedLinks.forEach(link => {
        link.classList.add('link-opened-by-extension');
      });
    }

    cleanUpDOM();
    chrome.runtime.sendMessage({ action: 'updateBadge', count: '' }).catch(() => {});
  }
}

// --- Helper Functions ---

function getLinksInSelection() {
  const links = document.querySelectorAll('a');
  const selectedLinks = [];

  if (!document.body.contains(selectionBox)) {
    return [];
  }

  const rect = selectionBox.getBoundingClientRect();

  links.forEach(link => {
    const linkRect = link.getBoundingClientRect();
    if (
      link.href &&
      linkRect.right > rect.left &&
      linkRect.left < rect.right &&
      linkRect.bottom > rect.top &&
      linkRect.top < rect.bottom &&
      link.innerText.trim() !== ''
    ) {
      selectedLinks.push(link);
    }
  });
  return selectedLinks;
}

function updateLinkCounterAndStyle() {
  const currentLinksInSelection = getLinksInSelection();
  const currentLinkSet = new Set(currentLinksInSelection);
  const underlinedLinkSet = new Set(underlinedLinks);

  // Remove underline from links that are no longer selected
  for (const link of underlinedLinks) {
    if (!currentLinkSet.has(link)) {
      link.classList.remove('link-being-selected');
    }
  }

  // Add underline to new links in selection
  for (const link of currentLinksInSelection) {
    if (!underlinedLinkSet.has(link)) {
      link.classList.add('link-being-selected');
    }
  }

  underlinedLinks = currentLinksInSelection;

  const uniqueUrls = new Set(currentLinksInSelection.map(link => link.href));
  const count = uniqueUrls.size;
  linkCounter.textContent = count;
  chrome.runtime.sendMessage({ action: 'updateBadge', count: count > 0 ? count.toString() : '' }).catch(() => {});
}


function cleanUpDOM() {
  if (document.body.contains(selectionBox)) {
    document.body.removeChild(selectionBox);
  }
  if (document.body.contains(linkCounter)) {
    document.body.removeChild(linkCounter);
  }
   underlinedLinks.forEach(link => {
    link.classList.remove('link-being-selected');
  });
  underlinedLinks = [];
}