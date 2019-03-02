"use strict";
var framework;
(function (framework) {
    var FileParser = /** @class */ (function () {
        function FileParser(filename, content) {
            this.filename = filename;
            this.content = [];
            for (var _i = 0, _a = content.trim().split('\n'); _i < _a.length; _i++) {
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
        FileParser.prototype.reportError = function (msg) {
            msg = this.filename + ": line " + (this.y + 1) + ": " + msg;
            alert(msg);
            throw new Error(msg);
        };
        return FileParser;
    }());
    framework.FileParser = FileParser;
    var FileSelector = /** @class */ (function () {
        function FileSelector(callback) {
            var _this = this;
            this.callback = callback;
            this.inputFile = document.getElementById("inputFile");
            this.outputFile = document.getElementById("outputFile");
            this.reloadButton = document.getElementById("reloadButton");
            this.reloadFilesClosure = function () {
                _this.reloadFiles();
            };
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
        function RichSeekBar(callback) {
            var _this = this;
            this.callback = callback;
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
            this.seekRange.addEventListener('change', function () {
                _this.setValue(parseInt(_this.seekRange.value));
            });
            this.seekNumber.addEventListener('change', function () {
                _this.setValue(parseInt(_this.seekNumber.value));
            });
            this.seekRange.addEventListener('input', function () {
                _this.setValue(parseInt(_this.seekRange.value));
            });
            this.seekNumber.addEventListener('input', function () {
                _this.setValue(parseInt(_this.seekNumber.value));
            });
            this.fpsInput.addEventListener('change', function () {
                if (_this.intervalId !== null) {
                    _this.play();
                }
            });
            this.firstButton.addEventListener('click', function () {
                _this.stop();
                _this.setValue(_this.getMin());
            });
            this.prevButton.addEventListener('click', function () {
                _this.stop();
                _this.setValue(_this.getValue() - 1);
            });
            this.nextButton.addEventListener('click', function () {
                _this.stop();
                _this.setValue(_this.getValue() + 1);
            });
            this.lastButton.addEventListener('click', function () {
                _this.stop();
                _this.setValue(_this.getMax());
            });
            this.playClosure = function () {
                _this.play();
            };
            this.stopClosure = function () {
                _this.stop();
            };
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
            var preValue = this.seekNumber.valueAsNumber;
            this.seekRange.value = this.seekNumber.value = value.toString();
            if (this.callback !== undefined) {
                this.callback(value, preValue);
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
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        };
        RichSeekBar.prototype.play = function () {
            var _this = this;
            this.playButton.removeEventListener('click', this.playClosure);
            this.playButton.addEventListener('click', this.stopClosure);
            this.runIcon.classList.remove('play');
            this.runIcon.classList.add('stop');
            if (this.getValue() == this.getMax()) {
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
            if (typeof reader.result == 'string')
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
        function FileExporter(canvas) {
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
            var parser = new framework.FileParser('<input-file>', content);
            this.N = parser.getInt();
            this.M = parser.getInt();
            parser.getNewline();
            var B = this.B = Array(this.N);
            for (var i = 0; i < this.N; i++) {
                B[i] = Array(this.N);
                for (var j = 0; j < this.N; j++) {
                    B[i][j] = parser.getInt();
                }
                parser.getNewline();
            }
        }
        return InputFile;
    }());
    var OutputFile = /** @class */ (function () {
        function OutputFile(inputFile, content) {
            var parser = new framework.FileParser('<output-file>', content);
            this.commands = [];
            while (!parser.isEOF()) {
                var r = parser.getInt();
                var c = parser.getInt();
                var s = parser.getInt();
                if (r < 0 || r + s > inputFile.N)
                    parser.reportError("\u5EA7\u6A19\u304C\u7BC4\u56F2\u5916\u3067\u3059");
                if (c < 0 || c + s > inputFile.N)
                    parser.reportError("\u5EA7\u6A19\u304C\u7BC4\u56F2\u5916\u3067\u3059");
                if (s <= 0)
                    parser.reportError("\u6B63\u65B9\u5F62\u306E\u30B5\u30A4\u30BA\u306F\u6B63\u3067\u3042\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059");
                this.commands.push([r, c, s]);
                parser.getNewline();
            }
            if (this.commands.length > inputFile.M)
                parser.reportError(inputFile.M + " \u56DE\u3088\u308A\u591A\u3044\u64CD\u4F5C\u3092\u884C\u304A\u3046\u3068\u3057\u307E\u3057\u305F");
        }
        return OutputFile;
    }());
    var TesterFrame = /** @class */ (function () {
        function TesterFrame(input, output, previousFrame, command, B) {
            this.input = input;
            this.output = output;
            this.previousFrame = previousFrame;
            this.command = command;
            this.B = B;
            this.score = calcScore(input.N, this.B);
            if (this.score == input.N * input.N) {
                this.score += input.M - output.commands.length;
            }
        }
        TesterFrame.createInitialFrame = function (input, output) {
            return new TesterFrame(input, output, null, null, input.B);
        };
        TesterFrame.createNextFrame = function (previousFrame, command) {
            var B = previousFrame.B.map(function (x) { return Object.assign({}, x); }); // deep copy
            var r = command[0], c = command[1], s = command[2];
            for (var i = 0; i < s; i++) {
                for (var j = 0; j < s; j++) {
                    B[r + j][c + s - 1 - i] = previousFrame.B[r + i][c + j];
                }
            }
            return new TesterFrame(previousFrame.input, previousFrame.output, previousFrame, command, B);
        };
        return TesterFrame;
    }());
    function calcScore(N, B) {
        var color = function (r, c) {
            var hi = r < N / 2 ? 0 : 2;
            var lo = c < N / 2 ? 0 : 1;
            return hi | lo;
        };
        var score = 0;
        for (var i = 0; i < N; i++) {
            for (var j = 0; j < N; j++) {
                if (B[i][j] == color(i, j))
                    score++;
            }
        }
        return score;
    }
    var Tester = /** @class */ (function () {
        function Tester(inputContent, outputContent) {
            var input = new InputFile(inputContent);
            var output = new OutputFile(input, outputContent);
            this.frames = [TesterFrame.createInitialFrame(input, output)];
            for (var _i = 0, _a = output.commands; _i < _a.length; _i++) {
                var command = _a[_i];
                var lastFrame = this.frames[this.frames.length - 1];
                this.frames.push(TesterFrame.createNextFrame(lastFrame, command));
            }
        }
        return Tester;
    }());
    var Visualizer = /** @class */ (function () {
        function Visualizer() {
            this.bgColor = '#111';
            this.borderColor = '#eee';
            this.cellRound = 3;
            this.cellMargin = 1;
            this.canvas = document.getElementById("canvas");
            var size = 600;
            this.height = size; // pixels
            this.width = size; // pixels
            this.ctx = this.canvas.getContext('2d');
            if (this.ctx == null) {
                alert('unsupported browser');
            }
            this.commandInput = document.getElementById("commandInput");
            this.scoreInput = document.getElementById("scoreInput");
            var lo = 0;
            var hi = 210;
            this.styles = [
                "rgb(" + hi + ", " + lo + ", " + lo + ")",
                "rgb(" + hi + ", " + hi + ", " + lo + ")",
                "rgb(" + lo + ", " + hi + ", " + lo + ")",
                "rgb(30, 30, " + hi + ")",
            ];
            this.textStyles = [
                "rgb(0, 0, 0)",
                "rgb(0, 0, 0)",
                "rgb(0, 0, 0)",
                "rgb(210, 210, 210)",
            ];
            this.ctx.lineJoin = 'round';
            this.ctx.font = '20px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
        }
        Visualizer.prototype.draw = function (frame, prev) {
            this.commandInput.value = frame.command ? frame.command.join(' ') : '';
            this.scoreInput.value = frame.score.toString();
            var cellSize = this.height / frame.input.N;
            if (prev) {
                this.drawPartial(frame, prev, cellSize);
            }
            else {
                this.drawAll(frame, cellSize);
            }
        };
        Visualizer.prototype.drawPartial = function (frame, prev, cellSize) {
            if (frame.command == null)
                return;
            var _a = frame.command, r = _a[0], c = _a[1], s = _a[2];
            // this.ctx.fillStyle = this.bgColor;
            // this.ctx.fillRect(c * cellSize, r * cellSize, s * cellSize, s * cellSize);
            for (var i = 0; i < s; i++) {
                for (var j = 0; j < s; j++) {
                    if (frame.B[r + i][c + j] != prev.B[r + i][c + j]) {
                        this.eraseCell(r + i, c + j, cellSize);
                        this.drawCell(r + i, c + j, frame.B[r + i][c + j], cellSize);
                    }
                }
            }
            if (prev.command)
                this.unHighlightSubSquare.apply(this, [cellSize].concat(prev.command));
            this.highlightSubSquare.apply(this, [cellSize].concat(frame.command));
        };
        Visualizer.prototype.drawAll = function (frame, cellSize) {
            this.ctx.fillStyle = this.bgColor;
            this.ctx.fillRect(0, 0, this.width, this.height);
            for (var i = 0; i < frame.input.N; i++) {
                for (var j = 0; j < frame.input.N; j++) {
                    this.drawCell(i, j, frame.B[i][j], cellSize);
                }
            }
            if (frame.command)
                this.highlightSubSquare.apply(this, [cellSize].concat(frame.command));
        };
        Visualizer.prototype.drawCell = function (y, x, c, cellSize) {
            this.ctx.strokeStyle = this.ctx.fillStyle = this.styles[c];
            this.ctx.lineWidth = this.cellRound;
            var cr = this.ctx.lineWidth;
            var cr2 = cr / 2;
            this.ctx.strokeRect(x * cellSize + this.cellMargin + cr2, y * cellSize + this.cellMargin + cr2, cellSize - this.cellMargin * 2 - cr, cellSize - this.cellMargin * 2 - cr);
            this.ctx.fillRect(x * cellSize + this.cellMargin + cr2, y * cellSize + this.cellMargin + cr2, cellSize - this.cellMargin * 2 - cr, cellSize - this.cellMargin * 2 - cr);
            this.ctx.strokeStyle = this.ctx.fillStyle = this.styles[c];
            this.ctx.strokeStyle = this.ctx.fillStyle = this.textStyles[c];
            this.ctx.fillText(c.toString(), (x + 0.5) * cellSize, (y + 0.5) * cellSize);
        };
        Visualizer.prototype.eraseCell = function (y, x, cellSize) {
            this.ctx.fillStyle = this.bgColor;
            this.ctx.fillRect(x * cellSize + this.cellMargin, y * cellSize + this.cellMargin, cellSize - this.cellMargin * 2, cellSize - this.cellMargin * 2);
        };
        Visualizer.prototype.highlightSubSquare = function (cellSize, r, c, s) {
            this.ctx.lineWidth = 1;
            this.ctx.strokeStyle = this.borderColor;
            this.ctx.strokeRect(c * cellSize, r * cellSize, s * cellSize, s * cellSize);
        };
        Visualizer.prototype.unHighlightSubSquare = function (cellSize, r, c, s) {
            this.ctx.lineWidth = 2;
            this.ctx.strokeStyle = this.bgColor;
            this.ctx.strokeRect(c * cellSize, r * cellSize, s * cellSize, s * cellSize);
        };
        Visualizer.prototype.getCanvas = function () {
            return this.canvas;
        };
        return Visualizer;
    }());
    var App = /** @class */ (function () {
        function App() {
            var _this = this;
            this.tester = null;
            this.visualizer = new Visualizer();
            this.exporter = new framework.FileExporter(this.visualizer.getCanvas());
            this.seek = new framework.RichSeekBar(function (curValue, preValue) {
                if (_this.tester) {
                    if (preValue == curValue - 1) {
                        _this.visualizer.draw(_this.tester.frames[curValue], _this.tester.frames[preValue]);
                    }
                    else {
                        _this.visualizer.draw(_this.tester.frames[curValue], null);
                    }
                }
            });
            this.loader = new framework.FileSelector(function (inputContent, outputContent) {
                _this.tester = new Tester(inputContent, outputContent);
                _this.seek.setMinMax(0, _this.tester.frames.length - 1);
                _this.seek.setValue(_this.tester.frames.length - 1);
                _this.visualizer.draw(_this.tester.frames[_this.tester.frames.length - 1], null);
            });
        }
        return App;
    }());
    visualizer.App = App;
})(visualizer || (visualizer = {}));
window.onload = function () {
    new visualizer.App();
};
//# sourceMappingURL=index.js.map