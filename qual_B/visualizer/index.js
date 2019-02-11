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
                if (words.length === 1 && words[0] === '') {
                    words.pop();
                }
                this.content.push(words);
            }
            this.y = 0;
            this.x = 0;
        }
        FileParser.prototype.isEOF = function () {
            return this.content.length <= this.y;
        };
        FileParser.prototype.isEOL = function () {
            return this.isEOF() || this.content[this.y].length == this.x;
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
    var RichSeekBar = /** @class */ (function () {
        function RichSeekBar() {
            var _this = this;
            this.seekRange = document.getElementById("seekRange");
            this.seekNumber = document.getElementById("seekNumber");
            this.fpsInput = document.getElementById("fpsInput");
            this.firstButton = document.getElementById("firstButton");
            this.prevButton = document.getElementById("prevButton");
            this.playButton = document.getElementById("playButton");
            this.nextButton = document.getElementById("nextButton");
            this.lastButton = document.getElementById("lastButton");
            this.runIcon = document.getElementById("runIcon");
            this.intervalId = null;
            this.setMinMax(-1, -1);
            this.seekRange.addEventListener('change', function () { _this.setValue(parseInt(_this.seekRange.value)); });
            this.seekNumber.addEventListener('change', function () { _this.setValue(parseInt(_this.seekNumber.value)); });
            this.seekRange.addEventListener('input', function () { _this.setValue(parseInt(_this.seekRange.value)); });
            this.seekNumber.addEventListener('input', function () { _this.setValue(parseInt(_this.seekNumber.value)); });
            this.fpsInput.addEventListener('change', function () { if (_this.intervalId !== null) {
                _this.play();
            } });
            this.firstButton.addEventListener('click', function () { _this.stop(); _this.setValue(_this.getMin()); });
            this.prevButton.addEventListener('click', function () { _this.stop(); _this.setValue(_this.getValue() - 1); });
            this.nextButton.addEventListener('click', function () { _this.stop(); _this.setValue(_this.getValue() + 1); });
            this.lastButton.addEventListener('click', function () { _this.stop(); _this.setValue(_this.getMax()); });
            this.playClosure = function () { _this.play(); };
            this.stopClosure = function () { _this.stop(); };
            this.playButton.addEventListener('click', this.playClosure);
        }
        RichSeekBar.prototype.setMinMax = function (min, max) {
            this.seekRange.min = this.seekNumber.min = min.toString();
            this.seekRange.max = this.seekNumber.max = max.toString();
            this.seekRange.step = this.seekNumber.step = '1';
            this.setValue(min);
        };
        RichSeekBar.prototype.getMin = function () {
            return parseInt(this.seekRange.min);
        };
        RichSeekBar.prototype.getMax = function () {
            return parseInt(this.seekRange.max);
        };
        RichSeekBar.prototype.setValue = function (value) {
            value = Math.max(this.getMin(), Math.min(this.getMax(), value)); // clamp
            this.seekRange.value = this.seekNumber.value = value.toString();
            if (this.callback !== undefined) {
                this.callback(value);
            }
        };
        RichSeekBar.prototype.getValue = function () {
            return parseInt(this.seekRange.value);
        };
        RichSeekBar.prototype.getDelay = function () {
            var fps = parseInt(this.fpsInput.value);
            return Math.floor(1000 / fps);
        };
        RichSeekBar.prototype.resetInterval = function () {
            if (this.intervalId !== undefined) {
                clearInterval(this.intervalId);
                this.intervalId = undefined;
            }
        };
        RichSeekBar.prototype.play = function () {
            var _this = this;
            this.playButton.removeEventListener('click', this.playClosure);
            this.playButton.addEventListener('click', this.stopClosure);
            this.runIcon.classList.remove('play');
            this.runIcon.classList.add('stop');
            if (this.getValue() == this.getMax()) { // if last, go to first
                this.setValue(this.getMin());
            }
            this.resetInterval();
            this.intervalId = setInterval(function () {
                if (_this.getValue() == _this.getMax()) {
                    _this.stop();
                }
                else {
                    _this.setValue(_this.getValue() + 1);
                }
            }, this.getDelay());
        };
        RichSeekBar.prototype.stop = function () {
            this.playButton.removeEventListener('click', this.stopClosure);
            this.playButton.addEventListener('click', this.playClosure);
            this.runIcon.classList.remove('stop');
            this.runIcon.classList.add('play');
            this.resetInterval();
        };
        return RichSeekBar;
    }());
    framework.RichSeekBar = RichSeekBar;
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
    var FileExporter = /** @class */ (function () {
        function FileExporter(canvas, seek) {
            var saveAsImage = document.getElementById("saveAsImage");
            saveAsImage.addEventListener('click', function () {
                saveUrlAsLocalFile(canvas.toDataURL('image/png'), 'canvas.png');
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
            this.A = [];
            var parser = new framework.FileParser('<input-file>', content);
            this.N = parser.getInt();
            this.M = parser.getInt();
            parser.getNewline();
            for (var i = 0; i < this.N; i++) {
                var row = [];
                for (var j = 0; j < this.N; j++) {
                    row.push(parser.getInt());
                }
                this.A.push(row);
                parser.getNewline();
            }
        }
        return InputFile;
    }());
    ;
    var OutputFile = /** @class */ (function () {
        function OutputFile(content, inputFile) {
            var parser = new framework.FileParser('<output-file>', content);
            this.commands = [];
            var seenEmpty = false;
            for (var i = 0; !parser.isEOF(); ++i) {
                if (parser.isEOL()) {
                    seenEmpty = true;
                    parser.getNewline();
                    continue;
                }
                if (seenEmpty) {
                    parser.reportError("elements after empty line");
                }
                var type = parser.getWord();
                if (type !== "1" && type !== "2") {
                    parser.reportError("unknown command type: " + type);
                }
                var isRm = type === "2";
                var r = parser.getInt();
                var c = parser.getInt();
                if (r < 0 || inputFile.N <= r || c < 0 || inputFile.N <= c) {
                    parser.reportError("poisition (" + r + ", " + c + ") is out of range");
                }
                parser.getNewline();
                this.commands.push([isRm, r, c]);
            }
            if (this.commands.length > inputFile.M) {
                parser.reportError("too many output");
            }
        }
        return OutputFile;
    }());
    ;
    var TesterFrame = /** @class */ (function () {
        function TesterFrame(something1, something2) {
            this.board = [];
            if (something1 instanceof InputFile) { // initial frame
                this.input = something1;
                this.previousFrame = null;
                this.age = 0;
                this.command = null;
                for (var _i = 0, _a = this.input.A; _i < _a.length; _i++) {
                    var row = _a[_i];
                    this.board.push(row);
                }
                this.scoreDelta = 0;
                this.scoreSum = 0;
            }
            else if (something1 instanceof TesterFrame) { // successor frame
                this.previousFrame = something1;
                this.age = this.previousFrame.age + 1;
                this.input = this.previousFrame.input;
                this.command = something2;
                // apply the command
                this.board = JSON.parse(JSON.stringify(this.previousFrame.board)); // deep copy
                var r = this.command[1];
                var c = this.command[2];
                if ((this.board[r][c] & TesterFrame.VISITED) !== 0) {
                    console.log("[warning] line " + this.age + ": \u533A\u753B (" + r + ", " + c + ") \u306F\u53CE\u7A6B\u6E08\u307F\u3067\u3059");
                    this.scoreDelta = 0;
                }
                else if (this.command[0]) {
                    var queue = [[r, c]];
                    var K = this.board[r][c];
                    this.board[r][c] |= TesterFrame.VISITED;
                    for (var i = 0; i < queue.length; i++) {
                        var cr = queue[i][0];
                        var cc = queue[i][1];
                        for (var j = 0; j < 4; j++) {
                            var nr = cr + TesterFrame.DR[j];
                            var nc = cc + TesterFrame.DC[j];
                            if (nr < 0 || this.input.N <= nr || nc < 0 || this.input.N <= nc) {
                                continue;
                            }
                            if (this.board[nr][nc] !== K) {
                                continue;
                            }
                            queue.push([nr, nc]);
                            this.board[nr][nc] |= TesterFrame.VISITED;
                        }
                    }
                    if (queue.length < K) {
                        console.log("[warning] line " + this.age + ": \u533A\u753B (" + r + ", " + c + ") \u3092\u53CE\u7A6B\u3067\u304D\u307E\u305B\u3093");
                        this.scoreDelta = 0;
                        for (var _b = 0, queue_1 = queue; _b < queue_1.length; _b++) {
                            var pos = queue_1[_b];
                            this.board[pos[0]][pos[1]] ^= TesterFrame.VISITED;
                        }
                    }
                    else {
                        this.scoreDelta = K * queue.length;
                        this.removed = queue;
                    }
                }
                else {
                    this.board[r][c]++;
                    this.scoreDelta = 0;
                }
                this.scoreSum = this.previousFrame.scoreSum + this.scoreDelta;
            }
        }
        TesterFrame.VISITED = 1 << 16;
        TesterFrame.DR = [-1, 0, 1, 0];
        TesterFrame.DC = [0, 1, 0, -1];
        return TesterFrame;
    }());
    ;
    var Tester = /** @class */ (function () {
        function Tester(inputContent, outputContent) {
            var input = new InputFile(inputContent);
            var output = new OutputFile(outputContent, input);
            this.frames = [new TesterFrame(input)];
            for (var _i = 0, _a = output.commands; _i < _a.length; _i++) {
                var command = _a[_i];
                var lastFrame = this.frames[this.frames.length - 1];
                this.frames.push(new TesterFrame(lastFrame, command));
            }
        }
        return Tester;
    }());
    ;
    var Visualizer = /** @class */ (function () {
        function Visualizer() {
            this.canvas = document.getElementById("canvas"); // TODO: IDs should be given as arguments
            var size = 800;
            this.canvas.height = size; // pixels
            this.canvas.width = size; // pixels
            this.ctx = this.canvas.getContext('2d');
            if (this.ctx == null) {
                alert('unsupported browser');
            }
            this.scoreDeltaInput = document.getElementById("scoreDeltaInput");
            this.scoreSumInput = document.getElementById("scoreSumInput");
            this.operationInput = document.getElementById("operationInput");
            this.showRemovedCheck = document.getElementById("showRemovedCheck");
        }
        Visualizer.prototype.draw = function (frame) {
            if (frame.age === 0) {
                this.scoreDeltaInput.value = "";
                this.scoreSumInput.value = "0";
                this.operationInput.value = "";
            }
            else {
                this.scoreDeltaInput.value = frame.scoreDelta.toString();
                this.scoreSumInput.value = frame.scoreSum.toString();
                this.operationInput.value = "[" + (frame.command[0] ? "収穫　" : "手入れ") + "]  (" + frame.command[1] + "," + frame.command[2] + ")";
            }
            var N = frame.board.length;
            var lenH = this.canvas.height / N;
            var lenW = this.canvas.width / N;
            this.ctx.font = lenH - 1 + "px monospace";
            this.ctx.lineWidth = 1;
            for (var i_1 = 0; i_1 < N; i_1++) {
                for (var j = 0; j < N; j++) {
                    if ((frame.board[i_1][j] & TesterFrame.VISITED) !== 0) {
                        var v = frame.board[i_1][j] ^ TesterFrame.VISITED;
                        var colorIdx = Math.min(v, Visualizer.removedColors.length - 1);
                        this.ctx.fillStyle = this.showRemovedCheck.checked ? Visualizer.removedColors[colorIdx] : 'white';
                    }
                    else {
                        var colorIdx = Math.min(frame.board[i_1][j], Visualizer.colors.length - 1);
                        this.ctx.fillStyle = Visualizer.colors[colorIdx];
                    }
                    this.ctx.fillRect(j * lenW, i_1 * lenH, lenW, lenH);
                }
            }
            for (var i_2 = 0; i_2 < N; i_2++) {
                for (var j = 0; j < N; j++) {
                    var str = '';
                    if ((frame.board[i_2][j] & TesterFrame.VISITED) !== 0) {
                        if (this.showRemovedCheck.checked) {
                            this.ctx.fillStyle = 'gray';
                            str = '' + (frame.board[i_2][j] ^ TesterFrame.VISITED);
                        }
                    }
                    else {
                        this.ctx.fillStyle = frame.board[i_2][j] > 6 ? 'white' : 'black';
                        str = '' + frame.board[i_2][j];
                    }
                    var metric = this.ctx.measureText(str);
                    var w = metric.width;
                    this.ctx.fillText(str, (j + 0.5) * lenW - w / 2, (i_2 + 1) * lenH - 2);
                }
            }
            this.ctx.strokeStyle = 'gray';
            for (var i = 0; i <= N; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, i * lenH);
                this.ctx.lineTo(N * lenW, i * lenH);
                this.ctx.stroke();
            }
            for (var i = 0; i <= N; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(i * lenW, 0);
                this.ctx.lineTo(i * lenW, N * lenH);
                this.ctx.stroke();
            }
            this.ctx.lineWidth = 3;
            this.ctx.strokeStyle = 'black';
            if (frame.removed != null) {
                var _loop_1 = function (removePos) {
                    var r = removePos[0];
                    var c = removePos[1];
                    this_1.ctx.beginPath();
                    if (!frame.removed.find(function (e) { return e[0] === r - 1 && e[1] === c; })) {
                        this_1.ctx.moveTo(c * lenW, r * lenH);
                        this_1.ctx.lineTo((c + 1) * lenW, r * lenH);
                    }
                    if (!frame.removed.find(function (e) { return e[0] === r + 1 && e[1] === c; })) {
                        this_1.ctx.moveTo(c * lenW, (r + 1) * lenH);
                        this_1.ctx.lineTo((c + 1) * lenW, (r + 1) * lenH);
                    }
                    if (!frame.removed.find(function (e) { return e[0] === r && e[1] === c - 1; })) {
                        this_1.ctx.moveTo(c * lenW, r * lenH);
                        this_1.ctx.lineTo(c * lenW, (r + 1) * lenH);
                    }
                    if (!frame.removed.find(function (e) { return e[0] === r && e[1] === c + 1; })) {
                        this_1.ctx.moveTo((c + 1) * lenW, r * lenH);
                        this_1.ctx.lineTo((c + 1) * lenW, (r + 1) * lenH);
                    }
                    this_1.ctx.stroke();
                };
                var this_1 = this;
                for (var _i = 0, _a = frame.removed; _i < _a.length; _i++) {
                    var removePos = _a[_i];
                    _loop_1(removePos);
                }
            }
            this.ctx.strokeStyle = 'red';
            if (frame.command != null) {
                var r = frame.command[1];
                var c = frame.command[2];
                this.ctx.strokeRect(c * lenW, r * lenH, lenW, lenH);
            }
        };
        Visualizer.prototype.getCanvas = function () {
            return this.canvas;
        };
        Visualizer.colors = [
            '#ffffff', '#e1f5fe', '#b3e5fc', '#81d4fa', '#4fc3f7',
            '#29b6f6', '#03a9f4', '#039be5', '#0288d1', '#0277bd',
            '#01579b',
        ];
        Visualizer.removedColors = [
            '#ffffff', '#fff8e1', '#ffecb3', '#ffe082', '#ffd54f',
            '#ffca28', '#ffc107', '#ffb300', '#ffa000', '#ff8f00',
            '#ff6f00',
        ];
        return Visualizer;
    }());
    ;
    var App = /** @class */ (function () {
        function App() {
            var _this = this;
            this.visualizer = new Visualizer();
            this.loader = new framework.FileSelector();
            this.seek = new framework.RichSeekBar();
            this.exporter = new framework.FileExporter(this.visualizer.getCanvas(), this.seek);
            this.seek.callback = function (value) {
                if (_this.tester !== undefined) {
                    _this.visualizer.draw(_this.tester.frames[value]);
                }
            };
            this.loader.callback = function (inputContent, outputContent) {
                _this.tester = new Tester(inputContent, outputContent);
                _this.seek.setMinMax(0, _this.tester.frames.length - 1);
                _this.seek.setValue(0);
                _this.seek.play();
            };
            this.visualizer.showRemovedCheck.addEventListener('change', function () {
                if (_this.tester !== undefined) {
                    _this.visualizer.draw(_this.tester.frames[_this.seek.getValue()]);
                }
            });
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