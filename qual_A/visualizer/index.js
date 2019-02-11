"use strict";
var framework;
(function (framework) {
    var FileParser = /** @class */ (function () {
        function FileParser(filename, content) {
            this.filename = filename;
            this.content = [];
            for (var _i = 0, _a = content.split('\n'); _i < _a.length; _i++) {
                var line = _a[_i];
                var words = line.trim().split(new RegExp('\\s+'));
                this.content.push(words);
            }
            this.y = 0;
            this.x = 0;
        }
        FileParser.prototype.isEOF = function () {
            return this.content.length <= this.y;
        };
        FileParser.prototype.getWord = function () {
            if (this.isEOF()) {
                this.reportError('a word expected, but EOF');
            }
            if (this.content[this.y].length <= this.x) {
                this.reportError('a word expected, but newline');
            }
            var word = this.content[this.y][this.x];
            this.x += 1;
            return word;
        };
        FileParser.prototype.getInt = function () {
            var word = this.getWord();
            if (!word.match(new RegExp('^[-+]?[0-9]+$'))) {
                this.reportError("a number expected, but word " + JSON.stringify(this.content[this.y][this.x]));
            }
            return parseInt(word);
        };
        FileParser.prototype.getNewline = function () {
            if (this.isEOF()) {
                this.reportError('newline expected, but EOF');
            }
            if (this.x < this.content[this.y].length) {
                this.reportError("newline expected, but word " + JSON.stringify(this.content[this.y][this.x]));
            }
            this.x = 0;
            this.y += 1;
        };
        FileParser.prototype.unwind = function () {
            if (this.x == 0) {
                this.y -= 1;
                this.x = this.content[this.y].length - 1;
            }
            else {
                this.x -= 1;
            }
        };
        FileParser.prototype.reportError = function (msg) {
            msg = this.filename + ": line " + (this.y + 1) + ": " + msg;
            alert(msg);
            throw new Error(msg);
        };
        return FileParser;
    }());
    framework.FileParser = FileParser;
    var FileSelector = /** @class */ (function () {
        function FileSelector() {
            var _this = this;
            this.inputFile = document.getElementById("inputFile");
            this.outputFile = document.getElementById("outputFile");
            this.reloadButton = document.getElementById("reloadButton");
            this.reloadFilesClosure = function () { _this.reloadFiles(); };
            this.inputFile.addEventListener('change', this.reloadFilesClosure);
            this.outputFile.addEventListener('change', this.reloadFilesClosure);
            this.reloadButton.addEventListener('click', this.reloadFilesClosure);
        }
        FileSelector.prototype.reloadFiles = function () {
            var _this = this;
            if (this.inputFile.files == null || this.inputFile.files.length == 0)
                return;
            loadFile(this.inputFile.files[0], function (inputContent) {
                if (_this.outputFile.files == null || _this.outputFile.files.length == 0)
                    return;
                loadFile(_this.outputFile.files[0], function (outputContent) {
                    _this.inputFile.removeEventListener('change', _this.reloadFilesClosure);
                    _this.outputFile.removeEventListener('change', _this.reloadFilesClosure);
                    _this.reloadButton.classList.remove('disabled');
                    if (_this.callback !== undefined) {
                        _this.callback(inputContent, outputContent);
                    }
                });
            });
        };
        return FileSelector;
    }());
    framework.FileSelector = FileSelector;
    var loadFile = function (file, callback) {
        var reader = new FileReader();
        reader.readAsText(file);
        reader.onloadend = function () {
            callback(reader.result);
        };
    };
    var saveUrlAsLocalFile = function (url, filename) {
        var anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        var evt = document.createEvent('MouseEvent');
        evt.initEvent("click", true, true);
        anchor.dispatchEvent(evt);
    };
    var saveSvgAsLocalFile = function (svgString, filename) {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        if (ctx == null)
            return;
        var DOMURL = window.URL;
        var img = new Image();
        var imgsrc = "data:image/svg+xml;charset=utf-8;base64," + btoa(decodeURIComponent(encodeURIComponent(svgString)));
        img.onload = function () {
            ctx.drawImage(img, 0, 0);
            var png = canvas.toDataURL("image/png");
            saveUrlAsLocalFile(png, filename);
            DOMURL.revokeObjectURL(png);
        };
        img.src = imgsrc;
    };
    var FileExporter = /** @class */ (function () {
        function FileExporter() {
            var saveAsImage = document.getElementById("saveAsImage");
            saveAsImage.addEventListener('click', function () {
                var svgString = new XMLSerializer().serializeToString(document.querySelector('svg'));
                saveSvgAsLocalFile(svgString, 'visualizer.png');
            });
        }
        return FileExporter;
    }());
    framework.FileExporter = FileExporter;
})(framework || (framework = {}));
var visualizer;
(function (visualizer) {
    var InputFile = /** @class */ (function () {
        function InputFile(content) {
            this.P = [];
            var parser = new framework.FileParser('<input-file>', content.trim());
            this.N = parser.getInt();
            parser.getNewline();
            for (var i = 0; i < this.N; i++) {
                var x = parser.getInt();
                var y = parser.getInt();
                parser.getNewline();
                this.P.push([x, y]);
            }
            if (!parser.isEOF())
                parser.reportError("Too long file.");
        }
        return InputFile;
    }());
    ;
    var OutputFile = /** @class */ (function () {
        function OutputFile(content, inputFile) {
            this.perm = [];
            var N = inputFile.N;
            var parser = new framework.FileParser('<output-file>', content.trim());
            var used = new Array(N);
            for (var i = 0; i < N; i++) {
                var p = parser.getInt();
                if (p < 0 || p >= N)
                    parser.reportError(p + " is out of range.");
                this.perm.push(p);
                parser.getNewline();
                used[p] = true;
            }
            for (var i = 0; i < N; i++) {
                if (!used[i])
                    parser.reportError(i + " is not used.");
            }
            if (!parser.isEOF())
                parser.reportError("Too long file.");
        }
        return OutputFile;
    }());
    ;
    var TesterFrame = /** @class */ (function () {
        function TesterFrame(input, output) {
            this.dists = [];
            this.variance = 0;
            this.input = input;
            this.output = output;
            var sum = 0;
            for (var i = 1; i <= input.N; i++) {
                var pre = input.P[output.perm[i - 1]];
                var cur = input.P[output.perm[i % input.N]];
                var dist = Math.hypot(pre[0] - cur[0], pre[1] - cur[1]);
                this.dists.push(dist);
                sum += dist;
            }
            this.average = sum / input.N;
            for (var i = 0; i < input.N; i++) {
                this.variance += (this.dists[i] - this.average) * (this.dists[i] - this.average);
            }
            this.variance /= input.N;
            this.score = Math.ceil(1e6 / (1 + this.variance));
        }
        return TesterFrame;
    }());
    ;
    var Tester = /** @class */ (function () {
        function Tester(inputContent, outputContent) {
            var input = new InputFile(inputContent);
            var output = new OutputFile(outputContent, input);
            this.frame = new TesterFrame(input, output);
        }
        return Tester;
    }());
    ;
    var Visualizer = /** @class */ (function () {
        function Visualizer() {
            this.size = 800;
            this.margin = 10;
            this.scoreHeight = 20;
            this.histHeight = 100;
            this.svg = SVG('drawing').size(this.margin + this.size + this.margin, this.margin + this.scoreHeight + this.size + this.margin + this.histHeight + this.margin);
            this.averageInput = document.getElementById("averageInput");
            this.varianceInput = document.getElementById("varianceInput");
            this.scoreInput = document.getElementById("scoreInput");
            this.tooltipDiv = document.getElementById("tooltip");
        }
        Visualizer.prototype.draw = function (frame) {
            this.svg.clear();
            this.svg.rect(this.margin + this.size + this.margin, this.scoreHeight + this.size + this.margin + this.histHeight + this.margin).fill({ color: '#fff' }).move(0, this.margin);
            this.drawScore(frame);
            this.drawHist(frame);
            this.drawLines(frame);
        };
        Visualizer.prototype.drawScore = function (frame) {
            var text = "average: " + frame.average.toPrecision(9) + ", variance: " + frame.variance.toPrecision(9) + ", score: " + frame.score;
            this.svg.text(text).move(this.margin, this.margin).font({ fill: '#222', size: 17 });
        };
        Visualizer.prototype.drawHist = function (frame) {
            var _this = this;
            var numBar = 30;
            var dists = frame.dists;
            var avg = frame.average;
            var mi = Math.min.apply(Math, dists);
            var ma = Math.max.apply(Math, dists) + 1e-5;
            var range = ma - mi;
            var span = range / numBar;
            var hists = new Array(numBar);
            hists.fill(0);
            for (var _i = 0, dists_1 = dists; _i < dists_1.length; _i++) {
                var d = dists_1[_i];
                hists[Math.floor((d - mi) / span)]++;
            }
            var mode = Math.max.apply(Math, hists);
            var initialStroke = { width: 0 };
            var focusedStroke = { width: 1 };
            var histTop = this.margin + this.scoreHeight + this.size + this.margin;
            var _loop_1 = function (i) {
                var l = this_1.size / numBar * i + this_1.margin + 1;
                var w = this_1.size / numBar - 2;
                var h = this_1.histHeight / mode * hists[i] * 0.9;
                var t = histTop + this_1.histHeight - h;
                var html = (mi + span * i).toPrecision(6) + "-" + (mi + span * (i + 1)).toPrecision(6) + "<br>" + hists[i];
                var bar = this_1.svg.rect(w, h).move(l, t).fill(this_1.color(frame, mi + (i + 0.5) * span, 30)).stroke(initialStroke);
                bar.mouseover(function (evt) { bar.stroke(focusedStroke); _this.showTooltip(evt, html); })
                    .mouseout(function (evt) { bar.stroke(initialStroke); _this.hideTooltip(evt); });
            };
            var this_1 = this;
            // ヒストグラム本体
            for (var i = 0; i < numBar; i++) {
                _loop_1(i);
            }
            // 平均値
            {
                var x = this.margin + this.size / numBar * ((avg - mi) / span);
                var t = histTop;
                var b = t + this.histHeight;
                var html_1 = "average: " + avg.toPrecision(9);
                var initialStroke_1 = { width: 2, opacity: 0.5 };
                var focusedStroke_1 = { width: 5, opacity: 1 };
                var avgLine_1 = this.svg.line(x, t, x, b).stroke(initialStroke_1);
                avgLine_1.mouseover(function (evt) { avgLine_1.stroke(focusedStroke_1); _this.showTooltip(evt, html_1); })
                    .mouseout(function (evt) { avgLine_1.stroke(initialStroke_1); _this.hideTooltip(evt); });
            }
            // 最小値
            {
                var x = this.margin;
                var t = histTop;
                // const b = t + this.histHeight;
                // this.svg.line(x, t, x, b).stroke({width: 2, color: this.color(frame, mi, 30)});
                this.svg.text(mi.toPrecision(6)).move(x, t).font({ fill: '#222', size: 17 });
            }
            // 最大値
            {
                var x = this.margin + this.size;
                var t = histTop;
                // const b = t + this.histHeight;
                // this.svg.line(x, t, x, b).stroke({width: 2, color: this.color(frame, ma, 30)});
                this.svg.text(ma.toPrecision(6)).move(x, t).font({ fill: '#222', size: 17 }).attr({ 'text-anchor': 'end' });
            }
        };
        Visualizer.prototype.drawLines = function (frame) {
            var _this = this;
            this.averageInput.value = frame.average.toPrecision(9);
            this.varianceInput.value = frame.variance.toPrecision(9);
            this.scoreInput.value = frame.score.toString();
            var input = frame.input;
            var output = frame.output;
            var initialStroke = { width: 2 };
            var focusedStroke = { width: 5 };
            var _loop_2 = function (i) {
                var p = output.perm[i - 1];
                var q = output.perm[i % input.N];
                var pre = input.P[p];
                var cur = input.P[q];
                var line = this_2.svg.line(this_2.x(pre[0]), this_2.y(pre[1]), this_2.x(cur[0]), this_2.y(cur[1]))
                    .stroke({ width: 2, linecap: 'round', color: this_2.color(frame, frame.dists[i - 1], 30) });
                var html = p + " to " + q + "<br>" + frame.dists[i - 1].toPrecision(6);
                line.mouseover(function (evt) { line.stroke(focusedStroke); _this.showTooltip(evt, html); })
                    .mouseout(function (evt) { line.stroke(initialStroke); _this.hideTooltip(evt); });
            };
            var this_2 = this;
            for (var i = 1; i <= frame.input.N; i++) {
                _loop_2(i);
            }
        };
        Visualizer.prototype.showTooltip = function (evt, htmlText) {
            this.tooltipDiv.innerHTML = htmlText;
            this.tooltipDiv.style.display = "block";
            this.tooltipDiv.style.left = (evt.clientX + 10) + 'px';
            this.tooltipDiv.style.top = (evt.clientY + 10) + 'px';
        };
        Visualizer.prototype.hideTooltip = function (evt) {
            this.tooltipDiv.style.display = "none";
        };
        Visualizer.prototype.color = function (frame, dist, threshold) {
            var diff = dist - frame.average;
            var col = 120 + 120 * diff / threshold;
            var h = Math.max(0, Math.min(240, col));
            var s = Math.min(100, Math.floor(20 + 80 * Math.abs(diff) / threshold));
            return "hsl(" + h + ", " + s + "%, 50%)";
        };
        Visualizer.prototype.y = function (py) {
            return this.margin + this.scoreHeight + py / 500 * this.size;
        };
        Visualizer.prototype.x = function (px) {
            return this.margin + px / 500 * this.size;
        };
        Visualizer.prototype.getSvg = function () {
            return document.getElementById('drawing');
        };
        return Visualizer;
    }());
    ;
    var App = /** @class */ (function () {
        function App() {
            var _this = this;
            this.visualizer = new Visualizer();
            this.loader = new framework.FileSelector();
            this.exporter = new framework.FileExporter();
            this.loader.callback = function (inputContent, outputContent) {
                _this.tester = new Tester(inputContent, outputContent);
                _this.visualizer.draw(_this.tester.frame);
            };
        }
        return App;
    }());
    visualizer.App = App;
})(visualizer || (visualizer = {}));
window.onload = function () {
    if (location.host != 'atcoder.jp') {
        document.body.style.paddingTop = '40px';
    }
    new visualizer.App();
};
//# sourceMappingURL=index.js.map