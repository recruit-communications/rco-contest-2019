// ==UserScript==
// @name         AtCoder Standings for RCO Contest
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Provide standings for Nihonbashi Half Marathon
// @author       Recruit Communications Co., Ltd.
// @license      MIT License
// @include      https://atcoder.jp/contests/rco-contest-*/standings
// @include      https://atcoder.jp/contests/rco-contest-*/standings/group
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 各問題の順位からスコアを計算して表示
    var rcoMode = function() {

        // ヘッダ修正
        $('th[data-name="score"]').text('順位の積');

        // 元の順位表をクリア
        $('div#standings-panel-heading').remove();
        $('tbody tr').remove();
        $('ul.pagination').remove();
        $('span.pull-right').remove()

        var taskNames = standings.TaskInfo.map((t) => t.TaskScreenName);
        var data = standings.StandingsData;
        var sorted = new Array(taskNames.length);

        // 片方に no-sub だったときのダミーデータ追加
        for (var i = 0; i < sorted.length; i++) {
            data.forEach((d) => {
                if (d.TaskResults[taskNames[i]] == undefined) {
                    d.TaskResults[taskNames[i]] = {'Score': 0};
                }
            })
        }

        for (var i = 0; i < sorted.length; i++) {
            sorted[i] = data.map((d) => d.TaskResults[taskNames[i]].Score).sort((a, b) => b - a);
            data.forEach((d) => {
                d.TaskResults[taskNames[i]].rank = sorted[i].indexOf(d.TaskResults[taskNames[i]].Score || 0) + 1
            });
        }
        data.forEach(function(d) {
            d.score = Object.values(d.TaskResults).map((e) => e.rank).reduce((a, b) => a * b, 1);
            d.sub_score = Math.min.apply(null, Object.values(d.TaskResults).map((e) => e.rank));
        });

        var sorted_overall_score = data.map((d) => [d.score, d.sub_score])
            .sort((a, b) => a[0] - b[0] || a[1] - b[1]).map((d) => d.join());
        data.forEach((d) => d.rank = sorted_overall_score.indexOf([d.score, d.sub_score].join()) + 1);

        // 順位表に行を追加
        var createLine = function(line, d) {
            var name = d.UserScreenName;

            // 自分の行かどうか
            line.push(d.UserScreenName == userScreenName ? '<tr class="info standings-me">' : '<tr>');

            // 順位
            line.push(`<td class="standings-rank">${d.rank}</td><td class="standings-username">`);

            // ユーザ
            line.push(`<img src="//img.atcoder.jp/assets/flag/${d.Country}.png" style="vertical-align: middle;"> `);
            var deco = d.Rating >= 3200 ? `<img src='//img.atcoder.jp/assets/icon/crown${d.Rating - d.Rating%400}.gif'> ` : '';
            var style = d.Rating >= 3200 && d.UserScreenName in userColor ? `style="color:${userColor[d.UserScreenName]};"` : '';
            line.push(`<a class="username" href="https://atcoder.jp/user/${encodeURIComponent(name)}"><span class="${getRatingClass(d)}" ${style}>${deco}${name}</span></a>`);
            line.push('<span class="standings-user-btn">');
            if (viewSubmissions) {
                line.push(`&nbsp;<a href="/contests/${encodeURIComponent(contestScreenName)}/submissions/?f.User=${encodeURIComponent(name)}">`);
                line.push(`<span class="glyphicon glyphicon-search black" aria-hidden="true" data-html="true" data-toggle="tooltip" title="" data-original-title="${name}さんの提出を見る">`);
                line.push('</span></a>');
            }
            line.push('</span></td>');

            // コンテスト
            if (location.pathname.endsWith('/group')) {
                line.push(`<td><a href="/contests/${d.Additional["standings.groupContestData"].ContestScreenName.split('.')[0]}">${d.Additional["standings.groupContestData"].ContestName}</a></td>`);
            }

            // 順位の積
            line.push(`<td class="center standings-result"><p><span class="standings-score">${d.score}</span></p></td>`);

            // tasks
            for (var t of taskNames) {
                line.push('<td class="center standings-result"><p>');
                line.push(`<span class="standings-ac">${d.TaskResults[t].rank}</span>`);
                if (t.Pending) line.push('&nbsp;<span class="glyphicon glyphicon-hourglass"></span>');
                line.push(`<br>${scoreTime(d.TaskResults[t])}`);
                line.push('</p></td>');
            }

            line.push('</tr>');
            return line;
        };

        var addLines = () => {
            $('tbody').append(data.reduce(createLine, []).join(''));
        };

        // ソート
        var sortBy = (orderBy, desc) => {
            var cmp = (a, b) => {
                if (orderBy == 'rank' || orderBy == 'score') return a.score - b.score || a.sub_score - b.sub_score;
                if (orderBy == 'standings.groupContestData') return a.Additional[orderBy].ContestName.localeCompare(b.Additional[orderBy].ContestName);
                return a.TaskResults[orderBy].rank - b.TaskResults[orderBy].rank;
            };
            data.sort(desc ? cmp : (a, b) => -cmp(a, b));
        };
        $('th.sort-th').click(function(e) {
            if (e.target.tagName.toLowerCase() == "a") return;
            var orderBy = $(this).attr('data-name');
            var desc = $(this).hasClass('sort-asc');
            sortBy(orderBy, desc);
            $('tbody tr').remove();
            addLines();
        });
        $('th[data-name="rating"]').off().removeClass('sort-th').addClass('th');  // 名前と rate でのソートは無効化

        sortBy('rank', true);
        addLines();

        $('#standings-tbody [data-toggle="tooltip"]').tooltip();

        // 自分のところまでスクロール
        if ($('tr.standings-me').offset()) {
          $("html, body").animate({ scrollTop: $('tr.standings-me').offset().top - 200 }, 200);
        }
        $('.tooltip-label').tooltip({placement:'top'});
    };

    var scoreTime = function(d){
        if (d.Score) {
            var e = d.Elapsed / 1000000000;
            return d.Score/100 + ' / ' + Math.floor(e/60) + ':' + ('0'+e%60).slice(-2);
        }
        else {
            return '-';
        }
    };

    var escapeAttrValue = function(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

    var getRatingClass = function(row) {
        var rating = row.Rating;
        if (rating == -1) return "user-admin";
        if (row.Competitions == 0) return "user-unrated";
        if (rating >= 2800) return "user-red";
        if (rating >= 2400) return "user-orange";
        if (rating >= 2000) return "user-yellow";
        if (rating >= 1600) return "user-blue";
        if (rating >= 1200) return "user-cyan";
        if (rating >= 800) return "user-green";
        if (rating >= 400) return "user-brown";
        if (rating >= 1) return "user-gray";
        return "user-unrated";
    };

    var setRCOMode = function(){
        Cookies.set('rcocon-mode', '1');
    };

    var unsetRCOMode = function(){
        Cookies.remove('rcocon-mode');
    };

    var isRCOModeEnabled = function(){
        // rcocon-mode=1 がセットされていると通常の順位表になる
        return Cookies.get('rcocon-mode') === '1';
    };

    $('span.h2').after('<input type="checkbox" id="rcocon-mode"><label for="rcocon-mode">RCO日本橋ハーフマラソンの順位にする</label>');

    $('#rcocon-mode').change(function(){
        if ($('#rcocon-mode').is(':checked')) {
            setRCOMode();
            location.reload();
        }
        else {
            // Cookieをセットしてリロード
            unsetRCOMode();
            location.reload();
        }
    });

    if (isRCOModeEnabled()) {
        $('#rcocon-mode').prop('checked', true);
        rcoMode();
    }
})();