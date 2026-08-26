(function () {
    'use strict';

    var SHEET_ID = '1ngFj_4NdfiIEkBZeJK90sVQEFIiTdSS7Y0A_0DZwZl4';
    var MC_GID = '817509336';
    var SHEET_EDIT_URL = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit?gid=' + MC_GID + '#gid=' + MC_GID;
    var GVIZ_URL = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID +
        '/gviz/tq?tqx=out:json&gid=' + MC_GID + '&t=' + Date.now();

    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function cellText(cell) {
        if (!cell) return '';
        if (cell.f != null && cell.f !== '') return String(cell.f).trim();
        if (cell.v == null || cell.v === '') return '';
        return String(cell.v).trim();
    }

    function isPlaceholderLink(value) {
        var v = (value || '').trim().toLowerCase();
        return !v || v === '/' || v === '-' || v === 'n/a' || v === 'link' || v === 'facebook' || v === 'instagram';
    }

    function renderLinkOrText(value) {
        var v = (value || '').trim();
        if (isPlaceholderLink(v)) return '';
        if (/^https?:\/\//i.test(v)) {
            return '<a href="' + escapeHtml(v) + '" target="_blank" rel="noopener">LINK</a>';
        }
        return escapeHtml(v);
    }

    function colIndex(cols, matcher) {
        for (var i = 0; i < cols.length; i++) {
            var label = ((cols[i] && cols[i].label) || '').toLowerCase().replace(/\s+/g, ' ').trim();
            if (matcher(label)) return i;
        }
        return -1;
    }

    function valueAt(row, index) {
        if (index < 0 || !row || !row.c) return '';
        return cellText(row.c[index]);
    }

    function findColumns(cols) {
        return {
            role: colIndex(cols, function (l) { return l === 'role' || l.indexOf('role') === 0; }),
            name: colIndex(cols, function (l) { return l === 'name' || l.indexOf('name') === 0; }),
            phone: colIndex(cols, function (l) { return l.indexOf('phone number 2') === -1 && l.indexOf('phone') !== -1; }),
            phone2: colIndex(cols, function (l) { return l.indexOf('phone number 2') !== -1 || l.indexOf('phone 2') !== -1; }),
            email: colIndex(cols, function (l) { return l.indexOf('aiesec') !== -1 && l.indexOf('email') !== -1; }),
            extraEmail: colIndex(cols, function (l) { return l.indexOf('extra') !== -1 && l.indexOf('email') !== -1; }),
            nickname: colIndex(cols, function (l) { return l.indexOf('nickname') !== -1; }),
            previous: colIndex(cols, function (l) { return l.indexOf('previous') !== -1; }),
            year: colIndex(cols, function (l) { return l.indexOf('year') !== -1; }),
            telegram: colIndex(cols, function (l) { return l.indexOf('telegram') !== -1; }),
            facebook: colIndex(cols, function (l) { return l.indexOf('facebook') !== -1; }),
            instagram: colIndex(cols, function (l) { return l.indexOf('instagram') !== -1; })
        };
    }

    function buildRowHtml(row, cols) {
        var role = valueAt(row, cols.role);
        var name = valueAt(row, cols.name);
        if (!role && !name) return '';
        if (/^role$/i.test(role)) return '';

        var cells = [
            escapeHtml(role),
            escapeHtml(name),
            escapeHtml(valueAt(row, cols.phone)),
            escapeHtml(valueAt(row, cols.phone2)),
            escapeHtml(valueAt(row, cols.email)),
            escapeHtml(valueAt(row, cols.extraEmail)),
            escapeHtml(valueAt(row, cols.nickname)),
            escapeHtml(valueAt(row, cols.previous)),
            escapeHtml(valueAt(row, cols.year)),
            escapeHtml(valueAt(row, cols.telegram)),
            renderLinkOrText(valueAt(row, cols.facebook)),
            renderLinkOrText(valueAt(row, cols.instagram))
        ];
        return '<tr><td>' + cells.join('</td><td>') + '</td></tr>';
    }

    function renderTable(data) {
        var tbody = document.getElementById('mc-2627-body');
        var status = document.getElementById('mc-2627-status');
        if (!tbody) return;

        var table = data && data.table;
        if (!table || !table.rows || !table.cols) {
            throw new Error('Unexpected sheet format');
        }

        var cols = findColumns(table.cols);
        var html = '';
        for (var i = 0; i < table.rows.length; i++) {
            html += buildRowHtml(table.rows[i], cols);
        }

        if (!html) {
            tbody.innerHTML = '<tr><td colspan="12">No MC 26.27 rows found in the sheet yet.</td></tr>';
        } else {
            tbody.innerHTML = html;
        }

        if (status) {
            status.innerHTML = 'Live from the AIESEC in Egypt sheet · updates appear when you refresh · <a href="' +
                SHEET_EDIT_URL + '" target="_blank" rel="noopener">Open sheet</a>';
        }
    }

    function fail(message) {
        var tbody = document.getElementById('mc-2627-body');
        var status = document.getElementById('mc-2627-status');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="12">' + escapeHtml(message) +
                ' <a href="' + SHEET_EDIT_URL + '" target="_blank" rel="noopener">Open the sheet</a></td></tr>';
        }
        if (status) {
            status.innerHTML = 'Could not load live data. <a href="' + SHEET_EDIT_URL +
                '" target="_blank" rel="noopener">Open sheet</a>';
        }
    }

    function finish() {
        window.dispatchEvent(new Event('contactlist:tablesready'));
    }

    function load() {
        var tbody = document.getElementById('mc-2627-body');
        if (!tbody) {
            finish();
            return;
        }

        window.google = window.google || {};
        window.google.visualization = window.google.visualization || {};
        window.google.visualization.Query = window.google.visualization.Query || {};
        window.google.visualization.Query.setResponse = function (payload) {
            try {
                if (!payload || payload.status !== 'ok') {
                    throw new Error((payload && payload.errors && payload.errors[0] && payload.errors[0].detailed_message) || 'Sheet is not public');
                }
                renderTable(payload);
            } catch (err) {
                fail(err.message || 'Could not read the sheet.');
            }
            finish();
        };

        var script = document.createElement('script');
        script.src = GVIZ_URL;
        script.onerror = function () {
            fail('Could not reach Google Sheets.');
            finish();
        };
        document.head.appendChild(script);

        setTimeout(function () {
            if (!tbody.querySelector('tr[data-loading]') && tbody.getAttribute('data-loaded') === '1') return;
            if (tbody.querySelector('tr[data-loading]')) {
                fail('The sheet took too long to load. Make sure it is shared with “Anyone with the link”.');
                finish();
            }
        }, 12000);
    }

    var originalRender = renderTable;
    renderTable = function (data) {
        originalRender(data);
        var tbody = document.getElementById('mc-2627-body');
        if (tbody) tbody.setAttribute('data-loaded', '1');
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', load);
    } else {
        load();
    }
})();
