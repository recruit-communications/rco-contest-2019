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

    const saveSvgAsLocalFile = (svgString: string, filename: string) => {
        const canvas: HTMLCanvasElement = <HTMLCanvasElement> document.getElementById("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx == null) return;
        const DOMURL = window.URL;
        const img = new Image();
        const imgsrc = `data:image/svg+xml;charset=utf-8;base64,${btoa(decodeURIComponent(encodeURIComponent(svgString)))}`;
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
            const png = canvas.toDataURL("image/png");
            saveUrlAsLocalFile(png, filename)
            DOMURL.revokeObjectURL(png);
        };
        img.src = imgsrc;
    }

    export class FileExporter {
        constructor() {
            const saveAsImage = <HTMLInputElement> document.getElementById("saveAsImage");
            saveAsImage.addEventListener('click', () => {
                const svgString = new XMLSerializer().serializeToString(document.querySelector('svg'));
                saveSvgAsLocalFile(svgString, 'visualizer.png');
            });
        }
    }
}

module visualizer {
    class InputFile {
        public N: number;
        public P: [number, number][] = [];

        constructor(content: string) {
            const parser = new framework.FileParser('<input-file>', content.trim());
            this.N = parser.getInt();
            parser.getNewline();
            for (let i = 0; i < this.N; i++) {
                const x = parser.getInt();
                const y = parser.getInt();
                parser.getNewline();
                this.P.push([x, y]);
            }
            if (!parser.isEOF()) parser.reportError(`Too long file.`);
        }
    };

    class OutputFile {
        public perm: number[] = [];

        constructor(content: string, inputFile: InputFile) {
            const N = inputFile.N;
            const parser = new framework.FileParser('<output-file>', content.trim());
            const used: boolean[] = new Array(N);
            for (let i = 0; i < N; i++) {
                const p = parser.getInt();
                if (p < 0 || p >= N) parser.reportError(`${p} is out of range.`);
                this.perm.push(p);
                parser.getNewline();
                used[p] = true;
            }
            for (let i = 0; i < N; i++) {
                if (!used[i]) parser.reportError(`${i} is not used.`);
            }
            if (!parser.isEOF()) parser.reportError(`Too long file.`);
        }
    };

    class TesterFrame {
        public input: InputFile;
        public output: OutputFile;
        public average: number;
        public dists: number[] = [];
        public variance: number = 0;
        public score: number;

        constructor(input: InputFile, output: OutputFile) {
            this.input = input;
            this.output = output;
            let sum = 0;

            for (let i = 1; i <= input.N; i++) {
                const pre = input.P[output.perm[i - 1]];
                const cur = input.P[output.perm[i % input.N]];
                const dist = Math.hypot(pre[0] - cur[0], pre[1] - cur[1]);
                this.dists.push(dist);
                sum += dist;
            }
            this.average = sum / input.N;

            for (let i = 0; i < input.N; i++) {
                this.variance += (this.dists[i] - this.average) * (this.dists[i] - this.average);
            }
            this.variance /= input.N;
            this.score = Math.ceil(1e6 / (1 + this.variance));
        }
    };

    class Tester {
        public frame: TesterFrame;
        constructor(inputContent: string, outputContent: string) {
            const input = new InputFile( inputContent);
            const output = new OutputFile(outputContent, input);
            this.frame = new TesterFrame(input, output);
        }
    };

    class Visualizer {
        private svg: any;
        private averageInput: HTMLInputElement;
        private varianceInput: HTMLInputElement;
        private scoreInput: HTMLInputElement;
        private tooltipDiv: HTMLDivElement;
        private size = 800;
        private margin = 10;
        private scoreHeight = 20;
        private histHeight = 100;

        constructor() {
            this.svg = SVG('drawing').size(this.margin + this.size + this.margin, this.margin + this.scoreHeight + this.size + this.margin + this.histHeight + this.margin);
            this.averageInput = <HTMLInputElement> document.getElementById("averageInput");
            this.varianceInput = <HTMLInputElement> document.getElementById("varianceInput");
            this.scoreInput = <HTMLInputElement> document.getElementById("scoreInput");
            this.tooltipDiv = <HTMLDivElement> document.getElementById("tooltip");
        }

        public draw(frame: TesterFrame) {
            this.svg.clear();
            this.svg.rect(this.margin + this.size + this.margin, this.scoreHeight + this.size + this.margin + this.histHeight + this.margin).fill({color: '#fff'}).move(0, this.margin);
            this.drawScore(frame);
            this.drawHist(frame);
            this.drawLines(frame);
        }

        private drawScore(frame: TesterFrame) {
            const text = `average: ${frame.average.toPrecision(9)}, variance: ${frame.variance.toPrecision(9)}, score: ${frame.score}`;
            this.svg.text(text).move(this.margin, this.margin).font({fill: '#222', size: 17});
        }

        private drawHist(frame: TesterFrame) {
            const numBar = 30;
            const dists = frame.dists;
            const avg = frame.average;
            const mi = Math.min(...dists);
            const ma = Math.max(...dists) + 1e-5;
            const range = ma - mi;
            const span = range / numBar;
            const hists:number[] = new Array(numBar);
            hists.fill(0);
            for (let d of dists) {
                hists[Math.floor((d - mi) / span)]++;
            }
            const mode = Math.max(...hists);
            const initialStroke = {width: 0};
            const focusedStroke = {width: 1};
            const histTop = this.margin + this.scoreHeight + this.size + this.margin;

            // ヒストグラム本体
            for (let i = 0; i < numBar; i++) {
                const l = this.size / numBar * i + this.margin + 1;
                const w = this.size / numBar - 2;
                const h = this.histHeight / mode * hists[i] * 0.9;
                const t = histTop + this.histHeight - h;
                const html = `${(mi + span * i).toPrecision(6)}-${(mi + span * (i+1)).toPrecision(6)}<br>${hists[i]}`;
                const bar = this.svg.rect(w, h).move(l, t).fill(this.color(frame, mi + (i + 0.5) * span, 30)).stroke(initialStroke);
                bar.mouseover((evt) => {bar.stroke(focusedStroke); this.showTooltip(evt, html)})
                   .mouseout((evt) => {bar.stroke(initialStroke); this.hideTooltip(evt)})
            }

            // 平均値
            {
                const x = this.margin + this.size / numBar * ((avg - mi) / span);
                const t = histTop;
                const b = t + this.histHeight;
                const html = `average: ${avg.toPrecision(9)}`;
                const initialStroke = {width: 2, opacity: 0.5};
                const focusedStroke = {width: 5, opacity: 1};
                const avgLine = this.svg.line(x, t, x, b).stroke(initialStroke);
                avgLine.mouseover((evt) => {avgLine.stroke(focusedStroke); this.showTooltip(evt, html)})
                   .mouseout((evt) => {avgLine.stroke(initialStroke); this.hideTooltip(evt)})
            }

            // 最小値
            {
                const x = this.margin;
                const t = histTop;
                // const b = t + this.histHeight;
                // this.svg.line(x, t, x, b).stroke({width: 2, color: this.color(frame, mi, 30)});
                this.svg.text(mi.toPrecision(6)).move(x, t).font({fill: '#222', size: 17});
            }

            // 最大値
            {
                const x = this.margin + this.size;
                const t = histTop;
                // const b = t + this.histHeight;
                // this.svg.line(x, t, x, b).stroke({width: 2, color: this.color(frame, ma, 30)});
                this.svg.text(ma.toPrecision(6)).move(x, t).font({fill: '#222', size: 17}).attr({'text-anchor': 'end'});
            }
        }

        private drawLines(frame: TesterFrame) {
            this.averageInput.value = frame.average.toPrecision(9);
            this.varianceInput.value = frame.variance.toPrecision(9);
            this.scoreInput.value = frame.score.toString();
            const input = frame.input;
            const output = frame.output;
            const initialStroke = {width: 2};
            const focusedStroke = {width: 5};
            for (let i = 1; i <= frame.input.N; i++) {
                const p = output.perm[i - 1];
                const q = output.perm[i % input.N];
                const pre = input.P[p];
                const cur = input.P[q];
                const line = this.svg.line(this.x(pre[0]), this.y(pre[1]), this.x(cur[0]), this.y(cur[1]))
                    .stroke({width: 2, linecap: 'round', color: this.color(frame, frame.dists[i-1], 30)});
                const html = `${p} to ${q}<br>${frame.dists[i-1].toPrecision(6)}`;

                line.mouseover((evt) => {line.stroke(focusedStroke); this.showTooltip(evt, html);})
                    .mouseout((evt) =>{line.stroke(initialStroke); this.hideTooltip(evt);})
                    ;
            }
        }

        private showTooltip(evt: MouseEvent, htmlText: string) {
            this.tooltipDiv.innerHTML = htmlText;
            this.tooltipDiv.style.display = "block";
            this.tooltipDiv.style.left = (evt.clientX + 10) + 'px';
            this.tooltipDiv.style.top = (evt.clientY + 10) + 'px';
        }

        private hideTooltip(evt) {
            this.tooltipDiv.style.display = "none";
        }

        private color(frame: TesterFrame, dist: number, threshold: number) {
            const diff = dist - frame.average;
            const col = 120 + 120 * diff / threshold;
            const h = Math.max(0, Math.min(240, col));
            const s = Math.min(100, Math.floor(20 + 80 * Math.abs(diff) / threshold));
            return `hsl(${h}, ${s}%, 50%)`;
        }

        private y(py: number) {
            return this.margin + this.scoreHeight + py / 500 * this.size;
        }

        private x(px: number) {
            return this.margin + px / 500 * this.size;
        }

        public getSvg() {
            return document.getElementById('drawing');
        }
    };

    export class App {
        public visualizer: Visualizer;
        public tester?: Tester;
        public loader: framework.FileSelector;
        public exporter: framework.FileExporter;

        constructor() {
            this.visualizer = new Visualizer();
            this.loader = new framework.FileSelector();
            this.exporter = new framework.FileExporter();

            this.loader.callback = (inputContent: string, outputContent: string) => {
                this.tester = new Tester(inputContent, outputContent);
                this.visualizer.draw(this.tester.frame);
            }
        }
    }
}

window.onload = () => {
    if (location.host != 'atcoder.jp') {
        document.body.style.paddingTop = '40px';
    }
    new visualizer.App();
};
