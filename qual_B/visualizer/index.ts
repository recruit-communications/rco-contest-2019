declare var GIF: any;  // for https://github.com/jnordberg/gif.js

module framework {
    export class FileParser {
        private filename: string;
        private content: string[][];
        private y: number;
        private x: number

        constructor(filename: string, content: string) {
            this.filename = filename;
            this.content = [];
            for (const line of content.split('\n')) {
                const words = line.trim().split(new RegExp('\\s+'));
                if (words.length === 1 && words[0] === '') {
                    words.pop();
                }
                this.content.push(words);
            }
            this.y = 0;
            this.x = 0;
        }

        public isEOF(): boolean {
            return this.content.length <= this.y;
        }

        public isEOL(): boolean {
            return this.isEOF() || this.content[this.y].length == this.x;
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
            if (! word.match(new RegExp('^[-+]?[0-9]+$'))) {
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

        public unwind() {
            if (this.x == 0) {
                this.y -= 1;
                this.x = this.content[this.y].length - 1;
            } else {
                this.x -= 1;
            }
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

        constructor() {
            this.inputFile = <HTMLInputElement> document.getElementById("inputFile");
            this.outputFile = <HTMLInputElement> document.getElementById("outputFile");
            this.reloadButton = <HTMLInputElement> document.getElementById("reloadButton");

            this.reloadFilesClosure = () => { this.reloadFiles(); };
            this. inputFile.addEventListener('change', this.reloadFilesClosure);
            this.outputFile.addEventListener('change', this.reloadFilesClosure);
            this.reloadButton.addEventListener('click', this.reloadFilesClosure);
        }

        private reloadFilesClosure: () => void;
        reloadFiles() {
            if (this.inputFile.files == null || this.inputFile.files.length == 0) return;
            loadFile(this.inputFile.files[0], (inputContent: string) => {
                if (this.outputFile.files == null || this.outputFile.files.length == 0) return;
                loadFile(this.outputFile.files[0], (outputContent: string) => {
                    this.inputFile.removeEventListener('change', this.reloadFilesClosure);
                    this.outputFile.removeEventListener('change', this.reloadFilesClosure);
                    this.reloadButton.classList.remove('disabled');
                    if (this.callback !== undefined) {
                        this.callback(inputContent, outputContent);
                    }
                });
            });
        }
    }

    export class RichSeekBar {
        public callback: (value: number) => void;

        private seekRange: HTMLInputElement;
        private seekNumber: HTMLInputElement;
        private fpsInput: HTMLInputElement;
        private firstButton: HTMLInputElement;
        private prevButton: HTMLInputElement;
        private playButton: HTMLInputElement;
        private nextButton: HTMLInputElement;
        private lastButton: HTMLInputElement;
        private runIcon: HTMLElement;
        private intervalId: number;
        private playClosure: () => void;
        private stopClosure: () => void;

        constructor() {
            this.seekRange  = <HTMLInputElement> document.getElementById("seekRange");
            this.seekNumber = <HTMLInputElement> document.getElementById("seekNumber");
            this.fpsInput = <HTMLInputElement> document.getElementById("fpsInput");
            this.firstButton = <HTMLInputElement> document.getElementById("firstButton");
            this.prevButton = <HTMLInputElement> document.getElementById("prevButton");
            this.playButton = <HTMLInputElement> document.getElementById("playButton");
            this.nextButton = <HTMLInputElement> document.getElementById("nextButton");
            this.lastButton = <HTMLInputElement> document.getElementById("lastButton");
            this.runIcon = document.getElementById("runIcon");
            this.intervalId = null;

            this.setMinMax(-1, -1);
            this.seekRange .addEventListener('change', () => { this.setValue(parseInt(this.seekRange .value)); });
            this.seekNumber.addEventListener('change', () => { this.setValue(parseInt(this.seekNumber.value)); });
            this.seekRange .addEventListener('input',  () => { this.setValue(parseInt(this.seekRange .value)); });
            this.seekNumber.addEventListener('input',  () => { this.setValue(parseInt(this.seekNumber.value)); });
            this.fpsInput.addEventListener('change', () => { if (this.intervalId !== null) { this.play(); } });
            this.firstButton.addEventListener('click', () => { this.stop(); this.setValue(this.getMin()); });
            this.prevButton .addEventListener('click', () => { this.stop(); this.setValue(this.getValue() - 1); });
            this.nextButton .addEventListener('click', () => { this.stop(); this.setValue(this.getValue() + 1); });
            this.lastButton .addEventListener('click', () => { this.stop(); this.setValue(this.getMax()); });
            this.playClosure = () => { this.play(); };
            this.stopClosure = () => { this.stop(); };
            this.playButton.addEventListener('click', this.playClosure);
        }

        public setMinMax(min: number, max: number) {
            this.seekRange.min   = this.seekNumber.min   = min.toString();
            this.seekRange.max   = this.seekNumber.max   = max.toString();
            this.seekRange.step  = this.seekNumber.step  = '1';
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
            this.seekRange.value = this.seekNumber.value = value.toString();
            if (this.callback !== undefined) {
                this.callback(value);
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
            if (this.intervalId !== undefined) {
                clearInterval(this.intervalId);
                this.intervalId = undefined;
            }
        }
        public play() {
            this.playButton.removeEventListener('click', this.playClosure);
            this.playButton.   addEventListener('click', this.stopClosure);
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
            this.playButton.   addEventListener('click', this.playClosure);
            this.runIcon.classList.remove('stop');
            this.runIcon.classList.add('play');
            this.resetInterval();
        }
    }

    const loadFile = (file: File, callback: (value: string) => void) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onloadend = function () {
            callback(reader.result);
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
        constructor(canvas: HTMLCanvasElement, seek: RichSeekBar) {
            const saveAsImage = <HTMLInputElement> document.getElementById("saveAsImage");

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
        public A: number[][] = [];

        constructor(content: string) {
            const parser = new framework.FileParser('<input-file>', content);
            this.N = parser.getInt();
            this.M = parser.getInt();
            parser.getNewline();
            for (let i = 0; i < this.N; i++) {
                const row: number[] = [];
                for (let j = 0; j < this.N; j++) {
                    row.push(parser.getInt());
                }
                this.A.push(row);
                parser.getNewline();
            }
        }
    };

    class OutputFile {
        public commands: [boolean, number, number][];

        constructor(content: string, inputFile: InputFile) {
            const parser = new framework.FileParser('<output-file>', content);
            this.commands = [];
            let seenEmpty = false;
            for (let i = 0; !parser.isEOF(); ++ i) {
                if (parser.isEOL()) {
                    seenEmpty = true;
                    parser.getNewline();
                    continue;
                }
                if (seenEmpty) {
                    parser.reportError("elements after empty line");
                }
                const type = parser.getWord();
                if (type !== "1" && type !== "2") {
                    parser.reportError(`unknown command type: ${type}`);
                }
                const isRm = type === "2";
                const r = parser.getInt();
                const c = parser.getInt();
                if (r < 0 || inputFile.N <= r || c < 0 || inputFile.N <= c) {
                    parser.reportError(`poisition (${r}, ${c}) is out of range`);
                }
                parser.getNewline();
                this.commands.push([ isRm, r, c ]);
            }
            if (this.commands.length > inputFile.M) {
                parser.reportError(`too many output`);
            }
        }
    };

    class TesterFrame {
        static VISITED = 1 << 16;
        static DR = [-1, 0, 1, 0];
        static DC = [0, 1, 0, -1];
        public input: InputFile;
        public previousFrame: TesterFrame | null;
        public age: number;
        public board: number[][] = [];
        public removed: [number, number][] | null;
        public command: [ boolean, number, number ] | null;
        public scoreDelta: number;
        public scoreSum: number;

        constructor(input: InputFile);
        constructor(frame: TesterFrame, command: [boolean, number, number]);
        constructor(something1: any, something2?: any) {
            if (something1 instanceof InputFile) {  // initial frame
                this.input = something1 as InputFile;
                this.previousFrame = null;
                this.age = 0;
                this.command = null;
                for (const row of this.input.A) {
                    this.board.push(row);
                }
                this.scoreDelta = 0;
                this.scoreSum = 0;
            } else if (something1 instanceof TesterFrame) {  // successor frame
                this.previousFrame = something1 as TesterFrame;
                this.age = this.previousFrame.age + 1;
                this.input = this.previousFrame.input;
                this.command = something2 as [boolean, number, number];

                // apply the command
                this.board = JSON.parse(JSON.stringify(this.previousFrame.board));  // deep copy
                const r = this.command[1];
                const c = this.command[2];
                if ((this.board[r][c] & TesterFrame.VISITED) !== 0) {
                    console.log(`[warning] line ${this.age}: 区画 (${r}, ${c}) は収穫済みです`);
                    this.scoreDelta = 0;
                } else if (this.command[0]) {
                    const queue: [number, number][] = [[r, c]];
                    const K = this.board[r][c];
                    this.board[r][c] |= TesterFrame.VISITED;
                    for (let i = 0; i < queue.length; i++) {
                        const cr = queue[i][0];
                        const cc = queue[i][1];
                        for (let j = 0; j < 4; j++) {
                            const nr = cr + TesterFrame.DR[j];
                            const nc = cc + TesterFrame.DC[j];
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
                        console.log(`[warning] line ${this.age}: 区画 (${r}, ${c}) を収穫できません`);
                        this.scoreDelta = 0;
                        for (const pos of queue) {
                            this.board[pos[0]][pos[1]] ^= TesterFrame.VISITED;
                        }
                    } else {
                        this.scoreDelta = K * queue.length;
                        this.removed = queue;
                    }
                } else {
                    this.board[r][c]++;
                    this.scoreDelta = 0;
                }
                this.scoreSum = this.previousFrame.scoreSum + this.scoreDelta;
            }
        }
    };

    class Tester {
        public frames: TesterFrame[];
        constructor(inputContent: string, outputContent: string) {
            const input  = new  InputFile( inputContent);
            const output = new OutputFile(outputContent, input);
            this.frames = [ new TesterFrame(input) ];
            for (const command of output.commands) {
                let lastFrame = this.frames[this.frames.length - 1];
                this.frames.push( new TesterFrame(lastFrame, command) );
            }
        }
    };

    class Visualizer {
        private canvas: HTMLCanvasElement;
        private ctx: CanvasRenderingContext2D;
        private scoreDeltaInput: HTMLInputElement;
        private scoreSumInput: HTMLInputElement;
        private operationInput: HTMLInputElement;
        showRemovedCheck: HTMLInputElement;
        static colors = [
            '#ffffff', '#e1f5fe', '#b3e5fc', '#81d4fa', '#4fc3f7',
            '#29b6f6', '#03a9f4', '#039be5', '#0288d1', '#0277bd',
            '#01579b',
        ];
        static removedColors = [
            '#ffffff', '#fff8e1', '#ffecb3', '#ffe082', '#ffd54f',
            '#ffca28', '#ffc107', '#ffb300', '#ffa000', '#ff8f00',
            '#ff6f00',
        ];

        constructor() {
            this.canvas = <HTMLCanvasElement> document.getElementById("canvas");  // TODO: IDs should be given as arguments
            const size = 800;
            this.canvas.height = size;  // pixels
            this.canvas.width  = size;  // pixels
            this.ctx = this.canvas.getContext('2d');
            if (this.ctx == null) {
                alert('unsupported browser');
            }
            this.scoreDeltaInput = <HTMLInputElement> document.getElementById("scoreDeltaInput");
            this.scoreSumInput = <HTMLInputElement> document.getElementById("scoreSumInput");
            this.operationInput = <HTMLInputElement> document.getElementById("operationInput");
            this.showRemovedCheck = <HTMLInputElement> document.getElementById("showRemovedCheck");
        }

        public draw(frame: TesterFrame) {
            if (frame.age === 0) {
                this.scoreDeltaInput.value = "";
                this.scoreSumInput.value = "0";
                this.operationInput.value = "";
            } else {
                this.scoreDeltaInput.value = frame.scoreDelta.toString();
                this.scoreSumInput.value = frame.scoreSum.toString();
                this.operationInput.value = `[${frame.command[0] ? "収穫　" : "手入れ"}]  (${frame.command[1]},${frame.command[2]})`
            }
            const N = frame.board.length;
            const lenH = this.canvas.height / N;
            const lenW = this.canvas.width / N;

            this.ctx.font = `${lenH - 1}px monospace`;
            this.ctx.lineWidth = 1;
            for (let i = 0; i < N; i++) {
                for (let j = 0; j < N; j++) {
                    if ((frame.board[i][j] & TesterFrame.VISITED) !== 0) {
                        const v = frame.board[i][j] ^ TesterFrame.VISITED;
                        const colorIdx = Math.min(v, Visualizer.removedColors.length - 1);
                        this.ctx.fillStyle = this.showRemovedCheck.checked ? Visualizer.removedColors[colorIdx] : 'white';
                    } else {
                        const colorIdx = Math.min(frame.board[i][j], Visualizer.colors.length - 1);
                        this.ctx.fillStyle = Visualizer.colors[colorIdx];
                    }
                    this.ctx.fillRect(j * lenW, i * lenH, lenW, lenH);
                }
            }
            for (let i = 0; i < N; i++) {
                for (let j = 0; j < N; j++) {
                    let str = '';
                    if ((frame.board[i][j] & TesterFrame.VISITED) !== 0) {
                        if (this.showRemovedCheck.checked) {
                            this.ctx.fillStyle = 'gray';
                            str = '' + (frame.board[i][j] ^ TesterFrame.VISITED);
                        }
                    } else {
                        this.ctx.fillStyle = frame.board[i][j] > 6 ? 'white' : 'black';
                        str = '' + frame.board[i][j];
                    }
                    const metric = this.ctx.measureText(str);
                    const w = metric.width;
                    this.ctx.fillText(str, (j + 0.5) * lenW - w / 2, (i + 1) * lenH - 2);
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
                for (const removePos of frame.removed) {
                    const r = removePos[0];
                    const c = removePos[1];
                    this.ctx.beginPath();
                    if (!frame.removed.find((e) => e[0] === r - 1 && e[1] === c)) {
                        this.ctx.moveTo(c * lenW, r * lenH);
                        this.ctx.lineTo((c + 1) * lenW, r * lenH);
                    }
                    if (!frame.removed.find((e) => e[0] === r + 1 && e[1] === c)) {
                        this.ctx.moveTo(c * lenW, (r + 1) * lenH);
                        this.ctx.lineTo((c + 1) * lenW, (r + 1) * lenH);
                    }
                    if (!frame.removed.find((e) => e[0] === r && e[1] === c - 1)) {
                        this.ctx.moveTo(c * lenW, r * lenH);
                        this.ctx.lineTo(c * lenW, (r + 1) * lenH);
                    }
                    if (!frame.removed.find((e) => e[0] === r && e[1] === c + 1)) {
                        this.ctx.moveTo((c + 1) * lenW, r * lenH);
                        this.ctx.lineTo((c + 1) * lenW, (r + 1) * lenH);
                    }
                    this.ctx.stroke();
                }
            }
            this.ctx.strokeStyle = 'red';
            if (frame.command != null) {
                const r = frame.command[1];
                const c = frame.command[2];
                this.ctx.strokeRect(c * lenW, r * lenH, lenW, lenH);
            }
        }

        public getCanvas(): HTMLCanvasElement {
            return this.canvas;
        }
    };

    export class App {
        public visualizer: Visualizer;
        public tester: Tester;
        public loader: framework.FileSelector;
        public seek: framework.RichSeekBar;
        public exporter: framework.FileExporter;

        constructor() {
            this.visualizer = new Visualizer();
            this.loader = new framework.FileSelector();
            this.seek = new framework.RichSeekBar();
            this.exporter = new framework.FileExporter(this.visualizer.getCanvas(), this.seek);

            this.seek.callback = (value: number) => {
                if (this.tester !== undefined) {
                    this.visualizer.draw(this.tester.frames[value]);
                }
            };

            this.loader.callback = (inputContent: string, outputContent: string) => {
                this.tester = new Tester(inputContent, outputContent);
                this.seek.setMinMax(0, this.tester.frames.length - 1);
                this.seek.setValue(0);
                this.seek.play();
            }

            this.visualizer.showRemovedCheck.addEventListener('change', () => {
                if (this.tester !== undefined) {
                    this.visualizer.draw(this.tester.frames[this.seek.getValue()]);
                }
            });
        }
    }
}

window.onload = () => {
    if (location.host != 'atcoder.jp') {
        document.body.style.paddingTop = '40px';
    }
    new visualizer.App();
};
