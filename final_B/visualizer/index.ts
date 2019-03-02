module framework {
    export class FileParser {
        private readonly filename: string;
        private readonly content: string[][];
        private y: number;
        private x: number;

        constructor(filename: string, content: string) {
            this.filename = filename;
            this.content = [];
            for (const line of content.trim().split('\n')) {
                const words = line.trim().split(new RegExp('\\s+'));
                this.content.push(words);
            }
            this.y = 0;
            this.x = 0;
        }

        public isEOF(): boolean {
            return this.content.length <= this.y;
        }

        public getWord(): string {
            if (this.isEOF()) {
                this.reportError('a word expected, but EOF');
            }
            if (this.content[this.y].length <= this.x) {
                this.reportError('a word expected, but newline');
            }
            const word = this.content[this.y][this.x];
            this.x += 1;
            return word;
        }

        public getInt(): number {
            const word = this.getWord();
            if (!word.match(new RegExp('^[-+]?[0-9]+$'))) {
                this.reportError(`a number expected, but word ${JSON.stringify(this.content[this.y][this.x])}`);
            }
            return parseInt(word);
        }

        public getNewline() {
            if (this.isEOF()) {
                this.reportError('newline expected, but EOF');
            }
            if (this.x < this.content[this.y].length) {
                this.reportError(`newline expected, but word ${JSON.stringify(this.content[this.y][this.x])}`);
            }
            this.x = 0;
            this.y += 1;
        }

        public reportError(msg: string) {
            msg = `${this.filename}: line ${this.y + 1}: ${msg}`;
            alert(msg);
            throw new Error(msg);
        }
    }

    export class FileSelector {
        public callback: (inputContent: string, outputContent: string) => void;

        private inputFile: HTMLInputElement;
        private outputFile: HTMLInputElement;
        private reloadButton: HTMLInputElement;

        constructor(callback: (inputContent: string, outputContent: string) => void) {
            this.callback = callback;
            this.inputFile = <HTMLInputElement>document.getElementById("inputFile");
            this.outputFile = <HTMLInputElement>document.getElementById("outputFile");
            this.reloadButton = <HTMLInputElement>document.getElementById("reloadButton");

            this.reloadFilesClosure = () => {
                this.reloadFiles();
            };
            this.inputFile.addEventListener('change', this.reloadFilesClosure);
            this.outputFile.addEventListener('change', this.reloadFilesClosure);
            this.reloadButton.addEventListener('click', this.reloadFilesClosure);
        }

        private readonly reloadFilesClosure: () => void;

        reloadFiles() {
            if (this.inputFile.files == null || this.inputFile.files.length == 0) return;
            loadFile(this.inputFile.files[0], (inputContent: string) => {
                if (this.outputFile.files == null || this.outputFile.files.length == 0) return;
                loadFile(this.outputFile.files[0], (outputContent: string) => {
                    this.reloadButton.classList.remove('disabled');
                    if (this.callback !== undefined) {
                        this.callback(inputContent, outputContent);
                    }
                });
            });
        }
    }

    export class RichSeekBar {
        private readonly callback: (curValue: number, preValue: number) => void;

        private readonly seekRange: HTMLInputElement;
        private readonly seekNumber: HTMLInputElement;
        private readonly fpsInput: HTMLInputElement;
        private readonly firstButton: HTMLInputElement;
        private readonly prevButton: HTMLInputElement;
        private readonly playButton: HTMLInputElement;
        private readonly nextButton: HTMLInputElement;
        private readonly lastButton: HTMLInputElement;
        private readonly runIcon: HTMLElement;
        private readonly playClosure: () => void;
        private readonly stopClosure: () => void;
        private intervalId: number | null;

        constructor(callback: (curValue: number, preValue: number) => void) {
            this.callback = callback;
            this.seekRange = <HTMLInputElement>document.getElementById("seekRange");
            this.seekNumber = <HTMLInputElement>document.getElementById("seekNumber");
            this.fpsInput = <HTMLInputElement>document.getElementById("fpsInput");
            this.firstButton = <HTMLInputElement>document.getElementById("firstButton");
            this.prevButton = <HTMLInputElement>document.getElementById("prevButton");
            this.playButton = <HTMLInputElement>document.getElementById("playButton");
            this.nextButton = <HTMLInputElement>document.getElementById("nextButton");
            this.lastButton = <HTMLInputElement>document.getElementById("lastButton");
            this.runIcon = <HTMLElement>document.getElementById("runIcon");
            this.intervalId = null;

            this.setMinMax(-1, -1);
            this.seekRange.addEventListener('change', () => {
                this.setValue(parseInt(this.seekRange.value));
            });
            this.seekNumber.addEventListener('change', () => {
                this.setValue(parseInt(this.seekNumber.value));
            });
            this.seekRange.addEventListener('input', () => {
                this.setValue(parseInt(this.seekRange.value));
            });
            this.seekNumber.addEventListener('input', () => {
                this.setValue(parseInt(this.seekNumber.value));
            });
            this.fpsInput.addEventListener('change', () => {
                if (this.intervalId !== null) {
                    this.play();
                }
            });
            this.firstButton.addEventListener('click', () => {
                this.stop();
                this.setValue(this.getMin());
            });
            this.prevButton.addEventListener('click', () => {
                this.stop();
                this.setValue(this.getValue() - 1);
            });
            this.nextButton.addEventListener('click', () => {
                this.stop();
                this.setValue(this.getValue() + 1);
            });
            this.lastButton.addEventListener('click', () => {
                this.stop();
                this.setValue(this.getMax());
            });
            this.playClosure = () => {
                this.play();
            };
            this.stopClosure = () => {
                this.stop();
            };
            this.playButton.addEventListener('click', this.playClosure);
        }

        public setMinMax(min: number, max: number) {
            this.seekRange.min = this.seekNumber.min = min.toString();
            this.seekRange.max = this.seekNumber.max = max.toString();
            this.seekRange.step = this.seekNumber.step = '1';
            this.setValue(min);
        }

        public getMin(): number {
            return parseInt(this.seekRange.min);
        }

        public getMax(): number {
            return parseInt(this.seekRange.max);
        }

        public setValue(value: number) {
            value = Math.max(this.getMin(),
                Math.min(this.getMax(), value));  // clamp
            const preValue = this.seekNumber.valueAsNumber;
            this.seekRange.value = this.seekNumber.value = value.toString();
            if (this.callback !== undefined) {
                this.callback(value, preValue);
            }
        }

        public getValue(): number {
            return parseInt(this.seekRange.value);
        }

        public getDelay(): number {
            const fps = parseInt(this.fpsInput.value);
            return Math.floor(1000 / fps);
        }

        private resetInterval() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        }

        public play() {
            this.playButton.removeEventListener('click', this.playClosure);
            this.playButton.addEventListener('click', this.stopClosure);
            this.runIcon.classList.remove('play');
            this.runIcon.classList.add('stop');
            if (this.getValue() == this.getMax()) {  // if last, go to first
                this.setValue(this.getMin());
            }
            this.resetInterval();
            this.intervalId = setInterval(() => {
                if (this.getValue() == this.getMax()) {
                    this.stop();
                } else {
                    this.setValue(this.getValue() + 1);
                }
            }, this.getDelay());
        }

        public stop() {
            this.playButton.removeEventListener('click', this.stopClosure);
            this.playButton.addEventListener('click', this.playClosure);
            this.runIcon.classList.remove('stop');
            this.runIcon.classList.add('play');
            this.resetInterval();
        }
    }

    const loadFile = (file: File, callback: (value: string) => void) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onloadend = function () {
            if (typeof reader.result == 'string') callback(reader.result);
        }
    };

    const saveUrlAsLocalFile = (url: string, filename: string) => {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        const evt = document.createEvent('MouseEvent');
        evt.initEvent("click", true, true);
        anchor.dispatchEvent(evt);
    };

    export class FileExporter {
        constructor(canvas: HTMLCanvasElement) {
            const saveAsImage = <HTMLInputElement>document.getElementById("saveAsImage");

            saveAsImage.addEventListener('click', () => {
                saveUrlAsLocalFile(canvas.toDataURL('image/png'), 'canvas.png');
            });
        }
    }
}

module visualizer {
    class InputFile {
        public N: number;
        public M: number;
        public B: number[][];

        constructor(content: string) {
            const parser = new framework.FileParser('<input-file>', content);

            this.N = parser.getInt();
            this.M = parser.getInt();
            parser.getNewline();

            const B = this.B = Array(this.N);
            for (let i = 0; i < this.N; i++) {
                B[i] = Array(this.N);
                for (let j = 0; j < this.N; j++) {
                    B[i][j] = parser.getInt();
                }
                parser.getNewline();
            }
        }
    }

    class OutputFile {
        public commands: [number, number, number][];

        constructor(inputFile: InputFile, content: string) {
            const parser = new framework.FileParser('<output-file>', content);
            this.commands = [];
            while (!parser.isEOF()) {
                const r = parser.getInt();
                const c = parser.getInt();
                const s = parser.getInt();
                if (r < 0 || r + s > inputFile.N) parser.reportError(`座標が範囲外です`);
                if (c < 0 || c + s > inputFile.N) parser.reportError(`座標が範囲外です`);
                if (s <= 0) parser.reportError(`正方形のサイズは正である必要があります`);
                this.commands.push([r, c, s]);
                parser.getNewline();
            }
            if (this.commands.length > inputFile.M) parser.reportError(`${inputFile.M} 回より多い操作を行おうとしました`);
        }
    }

    class TesterFrame {
        public score: number;

        constructor(public input: InputFile,
                    public output: OutputFile,
                    public previousFrame: TesterFrame | null,
                    public command: [number, number, number] | null,
                    public B: number[][]
        ) {
            this.score = calcScore(input.N, this.B);
            if (this.score == input.N * input.N) {
                this.score += input.M - output.commands.length;
            }
        }

        static createInitialFrame(input: InputFile, output: OutputFile) {
            return new TesterFrame(input, output, null, null, input.B);
        }

        static createNextFrame(previousFrame: TesterFrame, command: [number, number, number]) {
            const B = previousFrame.B.map(x => Object.assign({}, x));  // deep copy
            const [r, c, s] = command;
            for (let i = 0; i < s; i++) {
                for (let j = 0; j < s; j++) {
                    B[r + j][c + s - 1 - i] = previousFrame.B[r + i][c + j];
                }
            }
            return new TesterFrame(previousFrame.input, previousFrame.output, previousFrame, command, B);
        }
    }

    function calcScore(N: number, B: number[][]) {
        const color = (r: number, c: number) => {
            const hi = r < N / 2 ? 0 : 2;
            const lo = c < N / 2 ? 0 : 1;
            return hi | lo;
        };

        let score = 0;
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                if (B[i][j] == color(i, j)) score++;
            }
        }
        return score;
    }

    class Tester {
        public frames: TesterFrame[];

        constructor(inputContent: string, outputContent: string) {
            const input = new InputFile(inputContent);
            const output = new OutputFile(input, outputContent);
            this.frames = [TesterFrame.createInitialFrame(input, output)];
            for (const command of output.commands) {
                let lastFrame = this.frames[this.frames.length - 1];
                this.frames.push(TesterFrame.createNextFrame(lastFrame, command));
            }
        }
    }

    class Visualizer {
        private readonly canvas: HTMLCanvasElement;
        private readonly ctx: CanvasRenderingContext2D;
        private readonly height: number;
        private readonly width: number;
        private readonly styles: [string, string, string, string];
        private readonly textStyles: [string, string, string, string];
        private readonly bgColor = '#111';
        private readonly borderColor = '#eee';
        private readonly cellRound = 3;
        private readonly cellMargin = 1;
        private commandInput: HTMLInputElement;
        private scoreInput: HTMLInputElement;

        constructor() {
            this.canvas = <HTMLCanvasElement>document.getElementById("canvas");
            const size = 600;
            this.height = size;  // pixels
            this.width = size;  // pixels
            this.ctx = <CanvasRenderingContext2D>this.canvas.getContext('2d');
            if (this.ctx == null) {
                alert('unsupported browser');
            }
            this.commandInput = <HTMLInputElement>document.getElementById("commandInput");
            this.scoreInput = <HTMLInputElement>document.getElementById("scoreInput");
            const lo = 0;
            const hi = 210;
            this.styles = [
                `rgb(${hi}, ${lo}, ${lo})`, // r
                `rgb(${hi}, ${hi}, ${lo})`, // y
                `rgb(${lo}, ${hi}, ${lo})`, // g
                `rgb(30, 30, ${hi})`, // b
            ];
            this.textStyles = [
                `rgb(0, 0, 0)`, // r
                `rgb(0, 0, 0)`, // y
                `rgb(0, 0, 0)`, // g
                `rgb(210, 210, 210)`, // b
            ];
            this.ctx.lineJoin = 'round';
            this.ctx.font = '20px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
        }

        public draw(frame: TesterFrame, prev: TesterFrame | null) {
            this.commandInput.value = frame.command ? frame.command.join(' ') : '';
            this.scoreInput.value = frame.score.toString();
            const cellSize = this.height / frame.input.N;
            if (prev) {
                this.drawPartial(frame, prev, cellSize);
            } else {
                this.drawAll(frame, cellSize);
            }
        }

        private drawPartial(frame: TesterFrame, prev: TesterFrame, cellSize: number) {
            if (frame.command == null) return;
            const [r, c, s] = frame.command;

            // this.ctx.fillStyle = this.bgColor;
            // this.ctx.fillRect(c * cellSize, r * cellSize, s * cellSize, s * cellSize);

            for (let i = 0; i < s; i++) {
                for (let j = 0; j < s; j++) {
                    if (frame.B[r + i][c + j] != prev.B[r + i][c + j]) {
                        this.eraseCell(r + i, c + j, cellSize);
                        this.drawCell(r + i, c + j, frame.B[r + i][c + j], cellSize);
                    }
                }
            }
            if (prev.command) this.unHighlightSubSquare(cellSize, ...prev.command);
            this.highlightSubSquare(cellSize, ...frame.command);
        }

        private drawAll(frame: TesterFrame, cellSize: number) {
            this.ctx.fillStyle = this.bgColor;
            this.ctx.fillRect(0, 0, this.width, this.height);
            for (let i = 0; i < frame.input.N; i++) {
                for (let j = 0; j < frame.input.N; j++) {
                    this.drawCell(i, j, frame.B[i][j], cellSize);
                }
            }
            if (frame.command) this.highlightSubSquare(cellSize, ...frame.command);
        }

        private drawCell(y: number, x: number, c: number, cellSize: number) {
            this.ctx.strokeStyle = this.ctx.fillStyle = this.styles[c];
            this.ctx.lineWidth = this.cellRound;
            const cr = this.ctx.lineWidth;
            const cr2 = cr / 2;
            this.ctx.strokeRect(x * cellSize + this.cellMargin + cr2, y * cellSize + this.cellMargin + cr2, cellSize - this.cellMargin * 2 - cr, cellSize - this.cellMargin * 2 - cr);
            this.ctx.fillRect(x * cellSize + this.cellMargin + cr2, y * cellSize + this.cellMargin + cr2, cellSize - this.cellMargin * 2 - cr, cellSize - this.cellMargin * 2 - cr);
            this.ctx.strokeStyle = this.ctx.fillStyle = this.styles[c];
            this.ctx.strokeStyle = this.ctx.fillStyle = this.textStyles[c];
            this.ctx.fillText(c.toString(), (x + 0.5) * cellSize, (y + 0.5) * cellSize);
        }

        private eraseCell(y: number, x: number, cellSize: number) {
            this.ctx.fillStyle = this.bgColor;
            this.ctx.fillRect(x * cellSize + this.cellMargin, y * cellSize + this.cellMargin, cellSize - this.cellMargin * 2, cellSize - this.cellMargin * 2);
        }

        private highlightSubSquare(cellSize: number, r: number, c: number, s: number) {
            this.ctx.lineWidth = 1;
            this.ctx.strokeStyle = this.borderColor;
            this.ctx.strokeRect(c * cellSize, r * cellSize, s * cellSize, s * cellSize);
        }

        private unHighlightSubSquare(cellSize: number, r: number, c: number, s: number) {
            this.ctx.lineWidth = 2;
            this.ctx.strokeStyle = this.bgColor;
            this.ctx.strokeRect(c * cellSize, r * cellSize, s * cellSize, s * cellSize);
        }

        public getCanvas(): HTMLCanvasElement {
            return this.canvas;
        }
    }

    export class App {
        public visualizer: Visualizer;
        public tester: Tester | null = null;
        public loader: framework.FileSelector;
        public seek: framework.RichSeekBar;
        public exporter: framework.FileExporter;

        constructor() {
            this.visualizer = new Visualizer();
            this.exporter = new framework.FileExporter(this.visualizer.getCanvas());
            this.seek = new framework.RichSeekBar((curValue: number, preValue: number) => {
                if (this.tester) {
                    if (preValue == curValue - 1) {
                        this.visualizer.draw(this.tester.frames[curValue], this.tester.frames[preValue]);
                    } else {
                        this.visualizer.draw(this.tester.frames[curValue], null);
                    }
                }
            });

            this.loader = new framework.FileSelector((inputContent: string, outputContent: string) => {
                this.tester = new Tester(inputContent, outputContent);
                this.seek.setMinMax(0, this.tester.frames.length - 1);
                this.seek.setValue(this.tester.frames.length - 1);
                this.visualizer.draw(this.tester.frames[this.tester.frames.length - 1], null);
            });
        }
    }
}

window.onload = () => {
    new visualizer.App();
};
