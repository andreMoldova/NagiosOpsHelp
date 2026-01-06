// ==UserScript==
// @name         Nagios Service Filter (My Services)
// @namespace    https://nagios.local/
// @version      1.0.0
// @description  Filters Nagios status page to show only services owned by the current team.
// @match        *://*/nagios/cgi-bin/status.cgi*
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  const allowedSuffixes = [
    '_ITWV',
    '_ITSA',
    '_ITSYMM',
    '_ITGW',
    '_ITRADIO',
    '_ITMARKET',
    '_ITSKD',
    '_CONTENT',
  ];

  const storageKey = 'nagios-my-services-only';
  const defaultEnabled = true;

  const isAllowedService = (serviceName) => {
    if (!serviceName) {
      return false;
    }
    const normalized = serviceName.toUpperCase();
    return allowedSuffixes.some((suffix) => normalized.includes(suffix));
  };

  const extractServiceName = (row) => {
    const link = row.querySelector('a[href*="service="]');
    if (!link) {
      return null;
    }

    const text = link.textContent?.trim();
    if (text) {
      return text;
    }

    const href = link.getAttribute('href') || '';
    const match = href.match(/[?&]service=([^&]+)/i);
    return match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : null;
  };

  const filterRows = (enabled) => {
    const rows = Array.from(document.querySelectorAll('table.status tr'));
    let previousHidden = false;

    rows.forEach((row) => {
      const isServiceRow = row.querySelector('a[href*="service="]');
      if (isServiceRow) {
        const serviceName = extractServiceName(row);
        const allowed = isAllowedService(serviceName);
        const hidden = enabled && !allowed;
        row.style.display = hidden ? 'none' : '';
        previousHidden = hidden;
        return;
      }

      const cells = Array.from(row.querySelectorAll('td'));
      const isSpacerRow =
        cells.length > 0 &&
        cells.every((cell) => !cell.textContent?.trim()) &&
        row.querySelectorAll('a').length === 0;

      if (isSpacerRow && previousHidden) {
        row.style.display = 'none';
      } else if (isSpacerRow) {
        row.style.display = '';
      }
    });
  };

  const createToggle = () => {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '12px';
    container.style.right = '12px';
    container.style.zIndex = '9999';

    const button = document.createElement('button');
    button.type = 'button';
    button.style.padding = '6px 10px';
    button.style.background = '#0b5ed7';
    button.style.color = '#fff';
    button.style.border = '1px solid #0b5ed7';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    button.style.fontSize = '12px';

    const setButtonLabel = (enabled) => {
      button.textContent = enabled ? 'My services: ON' : 'My services: OFF';
    };

    const stored = localStorage.getItem(storageKey);
    let enabled = stored === null ? defaultEnabled : stored === 'true';

    setButtonLabel(enabled);
    filterRows(enabled);

    button.addEventListener('click', () => {
      enabled = !enabled;
      localStorage.setItem(storageKey, String(enabled));
      setButtonLabel(enabled);
      filterRows(enabled);
    });

    container.appendChild(button);
    document.body.appendChild(container);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createToggle);
  } else {
    createToggle();
  }
})();
