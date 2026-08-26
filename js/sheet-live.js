(function () {
    'use strict';

    var SHEET_ID = '1ngFj_4NdfiIEkBZeJK90sVQEFIiTdSS7Y0A_0DZwZl4';
    var SHEET_HOME = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit';

    var SECTIONS = [
        { id: 'mc-2526', gid: '1547061093', kind: 'mc', cols: 11 },
        { id: 'mc-2627', gid: '817509336', kind: 'mc', cols: 12 },
        { id: 'lc-lcp', gid: '817120236', kind: 'lc', cols: 12 },
        { id: 'lc-tm', gid: '1737203365', kind: 'lc', cols: 12 },
        { id: 'lc-ogv', gid: '2077362824', kind: 'lc', cols: 12 },
        { id: 'lc-igv', gid: '1141905406', kind: 'lc', cols: 12 },
        { id: 'lc-ogt', gid: '415272296', kind: 'lc', cols: 12 },
        { id: 'lc-igta', gid: '216502838', kind: 'lc', cols: 12 },
        { id: 'lc-igte', gid: '2099907944', kind: 'lc', cols: 12 },
        { id: 'lc-b2c', gid: '2025687208', kind: 'lc', cols: 12 },
        { id: 'lc-b2b', gid: '1113947137', kind: 'lc', cols: 12 },
        { id: 'lc-bd', gid: '1937455596', kind: 'lc', cols: 12 },
        { id: 'lc-fnl', gid: '1885546657', kind: 'lc', cols: 12 }
    ];

    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function cellText(cell) {
        if (!cell) return '';
        if (cell.f != null && String(cell.f).trim() !== '') return String(cell.f).trim();
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
            lc: colIndex(cols, function (l) { return l === 'lcs' || l === 'lc' || l.indexOf('lcs') === 0; }),
            role: colIndex(cols, function (l) { return l === 'role' || /(^| )role$/.test(l); }),
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

    function buildMcRow(row, cols, includeTelegram) {
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
            escapeHtml(valueAt(row, cols.year))
        ];
        if (includeTelegram) cells.push(escapeHtml(valueAt(row, cols.telegram)));
        cells.push(renderLinkOrText(valueAt(row, cols.facebook)));
        cells.push(renderLinkOrText(valueAt(row, cols.instagram)));
        return '<tr><td>' + cells.join('</td><td>') + '</td></tr>';
    }

    function buildLcRow(row, cols) {
        var lc = valueAt(row, cols.lc);
        var name = valueAt(row, cols.name);
        var role = valueAt(row, cols.role);
        if (!lc && !name && !role) return '';
        if (/^lcs$/i.test(lc) || /^role$/i.test(role)) return '';
        var cells = [
            escapeHtml(lc),
            escapeHtml(name),
            escapeHtml(role),
            escapeHtml(valueAt(row, cols.phone)),
            escapeHtml(valueAt(row, cols.phone2)),
            escapeHtml(valueAt(row, cols.email)),
            escapeHtml(valueAt(row, cols.extraEmail)),
            escapeHtml(valueAt(row, cols.nickname)),
            escapeHtml(valueAt(row, cols.previous)),
            escapeHtml(valueAt(row, cols.year)),
            renderLinkOrText(valueAt(row, cols.facebook)),
            renderLinkOrText(valueAt(row, cols.instagram))
        ];
        return '<tr><td>' + cells.join('</td><td>') + '</td></tr>';
    }

    function sheetUrl(gid) {
        return SHEET_HOME + '?gid=' + gid + '#gid=' + gid;
    }

    function setStatus(section, message, ok) {
        var el = document.getElementById(section.id + '-status');
        if (!el) return;
        var link = ' <a href="' + sheetUrl(section.gid) + '" target="_blank" rel="noopener">Open this tab</a>';
        el.innerHTML = message + (ok ? link : link);
    }

    function renderSection(section, payload) {
        var tbody = document.getElementById(section.id + '-body');
        if (!tbody) return;
        var table = payload && payload.table;
        if (!table || !table.rows || !table.cols) throw new Error('Unexpected sheet format');
        var cols = findColumns(table.cols);
        var html = '';
        for (var i = 0; i < table.rows.length; i++) {
            html += section.kind === 'mc'
                ? buildMcRow(table.rows[i], cols, section.cols === 12)
                : buildLcRow(table.rows[i], cols);
        }
        tbody.innerHTML = html || '<tr><td colspan="' + section.cols + '">No rows in this sheet tab yet.</td></tr>';
        tbody.setAttribute('data-loaded', '1');
        setStatus(section, 'Live from Google Sheet · refresh the page to see new edits.', true);
    }

    function failSection(section, message) {
        var tbody = document.getElementById(section.id + '-body');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="' + section.cols + '">' + escapeHtml(message) + '</td></tr>';
        }
        setStatus(section, message, false);
    }

    function parseGvizText(text) {
        var start = text.indexOf('{');
        var end = text.lastIndexOf('}');
        if (start < 0 || end < start) throw new Error('Could not parse sheet response');
        return JSON.parse(text.slice(start, end + 1));
    }

    function fetchGviz(gid) {
        var url = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID +
            '/gviz/tq?tqx=out:json&gid=' + gid + '&t=' + Date.now();
        return fetch(url, { cache: 'no-store' }).then(function (res) {
            if (!res.ok) throw new Error('Sheet HTTP ' + res.status);
            return res.text();
        }).then(parseGvizText);
    }

    function fetchLocal(gid) {
        var url = '../data/' + gid + '.json?t=' + Date.now();
        return fetch(url, { cache: 'no-store' }).then(function (res) {
            if (!res.ok) throw new Error('local ' + res.status);
            return res.json();
        });
    }

    function loadSection(section) {
        return fetchLocal(section.gid).catch(function () {
            return fetchGviz(section.gid);
        }).then(function (payload) {
            if (!payload || payload.status === 'error') {
                throw new Error('The sheet tab is not publicly viewable.');
            }
            renderSection(section, payload);
        }).catch(function (err) {
            failSection(section, err.message || 'Could not load this tab.');
        });
    }

    function finish() {
        window.dispatchEvent(new Event('contactlist:tablesready'));
    }

    function load() {
        var jobs = SECTIONS.map(loadSection);
        Promise.all(jobs).then(finish).catch(finish);
        setTimeout(function () {
            finish();
        }, 15000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', load);
    } else {
        load();
    }
})();
