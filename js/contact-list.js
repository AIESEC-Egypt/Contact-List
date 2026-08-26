(function () {
    'use strict';

    var COPY_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

    function getToast() {
        var existing = document.getElementById('contact-copy-toast');
        if (existing) return existing;
        var toast = document.createElement('div');
        toast.id = 'contact-copy-toast';
        toast.className = 'copy-toast';
        toast.setAttribute('aria-live', 'polite');
        document.body.appendChild(toast);
        return toast;
    }

    function showToast(message) {
        var toast = getToast();
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toast._hide);
        toast._hide = setTimeout(function () {
            toast.classList.remove('show');
        }, 1800);
    }

    function copyToClipboard(text) {
        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        }
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            return Promise.resolve();
        } finally {
            document.body.removeChild(ta);
        }
    }

    function getEmailColumnIndices(ths) {
        var indices = [];
        for (var i = 0; i < ths.length; i++) {
            var text = (ths[i].textContent || '').toLowerCase();
            if (text.indexOf('email') !== -1) indices.push(i);
        }
        return indices;
    }

    /** Only the aiesec.net email column (for "Copy all emails") */
    function getAiesecEmailColumnIndices(ths) {
        var indices = [];
        for (var i = 0; i < ths.length; i++) {
            var text = (ths[i].textContent || '').toLowerCase();
            if (text.indexOf('aiesec') !== -1 && text.indexOf('email') !== -1) indices.push(i);
        }
        return indices;
    }

    function getPhoneColumnIndices(ths) {
        var indices = [];
        for (var i = 0; i < ths.length; i++) {
            var text = (ths[i].textContent || '').toLowerCase();
            if (text.indexOf('phone') !== -1 || (text.indexOf('contact') !== -1 && (text.indexOf('whatsapp') !== -1 || text.indexOf('telegram') !== -1))) {
                indices.push(i);
            }
        }
        return indices;
    }

    function formatEgyptianPhone(str) {
        var raw = (str || '').trim();
        if (!raw) return raw;
        var digits = raw.replace(/\D/g, '');
        /* Do not apply Egyptian +20 to non-Egyptian numbers (e.g. Brazilian +55, Tunisian +216) */
        if (raw.indexOf('+55') !== -1 || (digits.length >= 12 && digits.indexOf('55') === 0)) {
            return raw;
        }
        if (raw.indexOf('+216') !== -1 || (digits.length >= 9 && digits.indexOf('216') === 0)) {
            return raw;
        }
        if (digits.length === 12 && digits.indexOf('20') === 0) {
            return '(+20) ' + digits.slice(2);
        }
        if (digits.length === 11 && digits.charAt(0) === '0') {
            return '(+20) ' + digits.slice(1);
        }
        if (digits.length === 10) {
            return '(+20) ' + digits;
        }
        if (digits.length === 11 && digits.charAt(0) === '1') {
            return '(+20) ' + digits.slice(1);
        }
        if (digits.length >= 10) {
            return '(+20) ' + digits.slice(-10);
        }
        return raw;
    }

    function formatTablePhoneCells(table) {
        var thead = table.querySelector('thead');
        var tbody = table.querySelector('tbody');
        if (!thead || !tbody) return;
        var ths = thead.querySelectorAll('th');
        var phoneCols = getPhoneColumnIndices(ths);
        var rows = tbody.querySelectorAll('tr');
        for (var r = 0; r < rows.length; r++) {
            var cells = rows[r].querySelectorAll('td');
            var rowText = (rows[r].textContent || '').toLowerCase();
            var isLauraRow = rowText.indexOf('laura covre') !== -1;
            for (var c = 0; c < phoneCols.length; c++) {
                var colIndex = phoneCols[c];
                if (colIndex >= cells.length) continue;
                var cell = cells[colIndex];
                var text = (cell.textContent || '').trim();
                if (!text) continue;
                if (isLauraRow) continue; // keep Laura's numbers exactly as entered
                var formatted = formatEgyptianPhone(text);
                if (formatted !== text) {
                    cell.textContent = formatted;
                }
            }
        }
    }

    function makeCopyableCell(td, label) {
        var text = (td.textContent || '').trim();
        var span = document.createElement('span');
        span.className = 'contact-copy-cell';
        var textSpan = document.createElement('span');
        textSpan.className = 'contact-copy-cell-text';
        textSpan.textContent = text;
        span.appendChild(textSpan);

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'copy-btn';
        btn.innerHTML = COPY_ICON_SVG;
        btn.setAttribute('aria-label', label);

        btn.addEventListener('click', function () {
            copyToClipboard(text).then(function () {
                showToast('Copied!');
            }).catch(function () {
                showToast('Copy failed');
            });
        });

        span.appendChild(btn);
        td.textContent = '';
        td.appendChild(span);
    }

    function initTableCopyButtons(table) {
        var thead = table.querySelector('thead');
        var tbody = table.querySelector('tbody');
        if (!thead || !tbody) return;

        var ths = thead.querySelectorAll('th');
        var emailCols = getEmailColumnIndices(ths);
        var phoneCols = getPhoneColumnIndices(ths);
        var copyableCols = [];
        emailCols.forEach(function (i) { copyableCols.push({ index: i, type: 'email' }); });
        phoneCols.forEach(function (i) { copyableCols.push({ index: i, type: 'phone' }); });

        var rows = tbody.querySelectorAll('tr');
        for (var r = 0; r < rows.length; r++) {
            var cells = rows[r].querySelectorAll('td');
            for (var c = 0; c < copyableCols.length; c++) {
                var col = copyableCols[c];
                if (col.index < cells.length) {
                    var cell = cells[col.index];
                    if (cell.querySelector('.contact-copy-cell')) continue;
                    var text = (cell.textContent || '').trim();
                    if (!text) continue;
                    var label = col.type === 'email' ? 'Copy email' : 'Copy number';
                    makeCopyableCell(cell, label);
                }
            }
        }
    }

    function getCellText(cell) {
        var wrap = cell.querySelector('.contact-copy-cell');
        if (wrap && wrap.firstChild) {
            return (wrap.firstChild.textContent || '').trim();
        }
        return (cell.textContent || '').trim();
    }

    function collectValuesFromTable(table, columnIndices) {
        var set = {};
        var rows = table.querySelectorAll('tbody tr');
        for (var r = 0; r < rows.length; r++) {
            var cells = rows[r].querySelectorAll('td');
            for (var j = 0; j < columnIndices.length; j++) {
                var idx = columnIndices[j];
                if (idx < cells.length) {
                    var val = getCellText(cells[idx]);
                    if (val) set[val] = true;
                }
            }
        }
        return Object.keys(set);
    }

    function initSectionCopyAll(section) {
        var table = section.querySelector('.contact-table');
        if (!table) return;

        var ths = table.querySelectorAll('thead th');
        var phoneCols = getPhoneColumnIndices(ths);
        var aiesecEmailCols = getAiesecEmailColumnIndices(ths);

        var btnEmails = section.querySelector('.btn-copy-all[data-copy="emails"]');
        var btnNumbers = section.querySelector('.btn-copy-all[data-copy="numbers"]');

        if (btnEmails && aiesecEmailCols.length) {
            btnEmails.addEventListener('click', function () {
                var emails = collectValuesFromTable(table, aiesecEmailCols);
                var text = emails.join('\n');
                if (!text) {
                    showToast('No emails in this section');
                    return;
                }
                copyToClipboard(text).then(function () {
                    showToast('Copied ' + emails.length + ' email(s)');
                }).catch(function () {
                    showToast('Copy failed');
                });
            });
        }

        if (btnNumbers && phoneCols.length) {
            btnNumbers.addEventListener('click', function () {
                var numbers = collectValuesFromTable(table, phoneCols);
                var text = numbers.join('\n');
                if (!text) {
                    showToast('No numbers in this section');
                    return;
                }
                copyToClipboard(text).then(function () {
                    showToast('Copied ' + numbers.length + ' number(s)');
                }).catch(function () {
                    showToast('Copy failed');
                });
            });
        }
    }

    function slugify(text) {
        return (text || '').trim().toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
    }

    function getSectionId(section) {
        var heading = section.querySelector('.section-title, .function-title');
        var name = heading ? heading.textContent.trim() : '';
        if (!name) return null;
        var id = slugify(name);
        if (id === 'lc-term') return null;
        return id ? 'section-' + id : null;
    }

    function isLcTable(table) {
        var first = table.querySelector('thead th');
        return first && (first.textContent || '').toLowerCase().indexOf('lc') !== -1;
    }

    function getLcListFromTable(table) {
        var rows = table.querySelectorAll('tbody tr');
        var lcs = [];
        for (var i = 0; i < rows.length; i++) {
            var first = rows[i].querySelector('td');
            var name = first ? (first.textContent || '').trim() : '';
            if (name) lcs.push(name);
        }
        return lcs;
    }

    function getRowForLc(table, lcName) {
        var rows = table.querySelectorAll('tbody tr');
        for (var i = 0; i < rows.length; i++) {
            var first = rows[i].querySelector('td');
            var name = first ? (first.textContent || '').trim() : '';
            if (name === lcName) return rows[i];
        }
        return null;
    }

    function getCellText(cell) {
        var wrap = cell.querySelector('.contact-copy-cell');
        if (wrap && wrap.firstChild) return (wrap.firstChild.textContent || '').trim();
        return (cell.textContent || '').trim();
    }

    function buildLcViewTable(lcName, sectionsWithLcTables, headerLabels) {
        var thead = document.createElement('thead');
        var headerRow = document.createElement('tr');
        var th0 = document.createElement('th');
        th0.textContent = 'Function';
        headerRow.appendChild(th0);
        for (var h = 0; h < headerLabels.length; h++) {
            var th = document.createElement('th');
            th.textContent = headerLabels[h];
            headerRow.appendChild(th);
        }
        thead.appendChild(headerRow);

        var tbody = document.createElement('tbody');
        for (var s = 0; s < sectionsWithLcTables.length; s++) {
            var fnName = sectionsWithLcTables[s].name;
            var row = sectionsWithLcTables[s].row;
            var tr = document.createElement('tr');
            var tdFn = document.createElement('td');
            tdFn.textContent = fnName;
            tr.appendChild(tdFn);
            var cells = row.querySelectorAll('td');
            for (var c = 1; c < cells.length; c++) {
                var td = document.createElement('td');
                td.textContent = getCellText(cells[c]);
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }

        var table = document.createElement('table');
        table.className = 'contact-table lc-view-table';
        table.appendChild(thead);
        table.appendChild(tbody);
        return table;
    }

    function initQuickAccess() {
        var bar = document.getElementById('quick-access-bar');
        var functionsEl = document.getElementById('quick-access-functions');
        var btnLcs = document.getElementById('btn-lcs-dropdown');
        var dropdown = document.getElementById('lcs-dropdown');
        var panel = document.getElementById('lc-view-panel');
        var lcNameEl = document.getElementById('lc-view-lc-name');
        var tableContainer = document.getElementById('lc-view-table-container');
        var btnClose = document.getElementById('btn-close-lc-view');

        if (!bar || !functionsEl || !btnLcs || !dropdown) return;

        var sections = document.querySelectorAll('.contact-section');
        var lcSections = [];
        var headerLabels = [];
        var lcList = [];

        for (var i = 0; i < sections.length; i++) {
            var section = sections[i];
            var id = getSectionId(section);
            if (id) {
                section.id = id;
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn-quick-section';
                btn.textContent = section.querySelector('.section-title, .function-title').textContent.trim();
                btn.addEventListener('click', function (sid) {
                    var el = document.getElementById(sid);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }.bind(null, id));
                functionsEl.appendChild(btn);
            }

            var table = section.querySelector('.contact-table');
            if (table && isLcTable(table)) {
                var heading = section.querySelector('.section-title, .function-title');
                var fnName = heading ? heading.textContent.trim() : '';
                if (!lcList.length) {
                    var ths = table.querySelectorAll('thead th');
                    for (var t = 1; t < ths.length; t++) headerLabels.push((ths[t].textContent || '').trim());
                    lcList = getLcListFromTable(table);
                }
                lcSections.push({ name: fnName, table: table });
            }
        }

        for (var k = 0; k < lcList.length; k++) {
            var item = document.createElement('button');
            item.type = 'button';
            item.className = 'lcs-dropdown-item';
            item.textContent = lcList[k];
            item.setAttribute('role', 'menuitem');
            (function (lc) {
                item.addEventListener('click', function () {
                    var sectionData = [];
                    for (var s = 0; s < lcSections.length; s++) {
                        var row = getRowForLc(lcSections[s].table, lc);
                        if (row) sectionData.push({ name: lcSections[s].name, row: row });
                    }
                    tableContainer.innerHTML = '';
                    if (sectionData.length && headerLabels.length) {
                        var table = buildLcViewTable(lc, sectionData, headerLabels);
                        tableContainer.appendChild(table);
                        initTableCopyButtons(table);
                    }
                    lcNameEl.textContent = lc;
                    panel.setAttribute('aria-hidden', 'false');
                    dropdown.classList.remove('show');
                    btnLcs.setAttribute('aria-expanded', 'false');
                });
            })(lcList[k]);
            dropdown.appendChild(item);
        }

        btnLcs.addEventListener('click', function () {
            var open = dropdown.classList.toggle('show');
            btnLcs.setAttribute('aria-expanded', open ? 'true' : 'false');
        });

        document.addEventListener('click', function (e) {
            if (dropdown.classList.contains('show') && !dropdown.contains(e.target) && e.target !== btnLcs) {
                dropdown.classList.remove('show');
                btnLcs.setAttribute('aria-expanded', 'false');
            }
        });

        if (btnClose && panel) {
            btnClose.addEventListener('click', function () {
                panel.setAttribute('aria-hidden', 'true');
            });
        }

        /* Copy all emails / numbers for LC view table */
        var btnLcCopyEmails = panel && panel.querySelector('.btn-copy-all[data-copy="emails"]');
        var btnLcCopyNumbers = panel && panel.querySelector('.btn-copy-all[data-copy="numbers"]');
        if (btnLcCopyEmails && tableContainer) {
            btnLcCopyEmails.addEventListener('click', function () {
                var table = tableContainer.querySelector('.contact-table');
                if (!table) {
                    showToast('No table');
                    return;
                }
                var ths = table.querySelectorAll('thead th');
                var aiesecEmailCols = getAiesecEmailColumnIndices(ths);
                var emails = aiesecEmailCols.length ? collectValuesFromTable(table, aiesecEmailCols) : [];
                var text = emails.join('\n');
                if (!text) {
                    showToast('No emails in this section');
                    return;
                }
                copyToClipboard(text).then(function () {
                    showToast('Copied ' + emails.length + ' email(s)');
                }).catch(function () {
                    showToast('Copy failed');
                });
            });
        }
        if (btnLcCopyNumbers && tableContainer) {
            btnLcCopyNumbers.addEventListener('click', function () {
                var table = tableContainer.querySelector('.contact-table');
                if (!table) {
                    showToast('No table');
                    return;
                }
                var ths = table.querySelectorAll('thead th');
                var phoneCols = getPhoneColumnIndices(ths);
                var numbers = collectValuesFromTable(table, phoneCols);
                var text = numbers.join('\n');
                if (!text) {
                    showToast('No numbers in this section');
                    return;
                }
                copyToClipboard(text).then(function () {
                    showToast('Copied ' + numbers.length + ' number(s)');
                }).catch(function () {
                    showToast('Copy failed');
                });
            });
        }
    }

    function initRowSelection() {
        document.addEventListener('click', function (e) {
            if (e.target.closest('.copy-btn')) return;
            var row = e.target.closest('.contact-table tbody tr');
            if (!row) return;
            var table = row.closest('table');
            if (!table) return;
            var alreadySelected = row.classList.contains('selected');
            table.querySelectorAll('tbody tr.selected').forEach(function (r) { r.classList.remove('selected'); });
            if (!alreadySelected) row.classList.add('selected');
        });
    }

    var started = false;

    function init() {
        if (started) return;
        started = true;

        var tables = document.querySelectorAll('.contact-table');
        for (var i = 0; i < tables.length; i++) {
            formatTablePhoneCells(tables[i]);
            initTableCopyButtons(tables[i]);
        }

        var sections = document.querySelectorAll('.contact-section');
        for (var j = 0; j < sections.length; j++) {
            initSectionCopyAll(sections[j]);
        }

        initQuickAccess();
        initRowSelection();
    }

    window.ContactList = { init: init };

    if (document.body && document.body.getAttribute('data-wait-live-sheet') === 'true') {
        window.addEventListener('contactlist:tablesready', init);
    } else if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
