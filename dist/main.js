import Lexer from './Lexer.js';
import Parser from './Parser.js';
import Semantic from './Semantic.js';
class Ui {
    constructor() {
        this.code = '';
        this.code = '';
        this.tokens = [];
        this.parsers = [];
        this.fileCode = document.querySelector('#fileUploaded');
        this.filePath = document.querySelector('#filePath');
        this.lexBtn = document.querySelector('#lxAnalyser');
        this.synBtn = document.querySelector('#syAnalyser');
        this.semBtn = document.querySelector('#seAnalyser');
        this.clearBtn = document.querySelector('#clear');
        this.compileBtn = document.querySelector('#compile');
        this.codeField = document.querySelector('#codeUploaded');
        this.analyserField = document.querySelector('#codeAfterAnalyze');
        this.resultField = document.querySelector('#codeResult');
        this.lexerHandler();
        this.FileUploadedHandler();
        this.btnsHandler();
    }
    FileUploadedHandler() {
        var _a;
        (_a = this.fileCode) === null || _a === void 0 ? void 0 : _a.addEventListener('change', (e) => {
            const input = e.target;
            if (this.filePath && input.files && input.files.length > 0) {
                const selectedFile = input.files[0];
                if (selectedFile) {
                    this.filePath.textContent = selectedFile.name;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        var _a;
                        const fileContent = (_a = event.target) === null || _a === void 0 ? void 0 : _a.result;
                        if (this.codeField) {
                            this.clearHandler();
                            this.codeField.value = fileContent;
                            this.code = this.codeField.value;
                        }
                    };
                    reader.readAsText(selectedFile);
                }
            }
        });
    }
    clearHandler() {
        if (this.code)
            this.code = '';
        if (this.fileCode)
            this.fileCode.value = '';
        if (this.filePath)
            this.filePath.textContent = '';
        if (this.codeField)
            this.codeField.value = '';
        if (this.analyserField)
            this.analyserField.value = '';
        if (this.resultField)
            this.resultField.value = '';
        console.clear();
        const activeClassName = document.querySelectorAll('.active');
        activeClassName === null || activeClassName === void 0 ? void 0 : activeClassName.forEach((el) => {
            el.classList.remove('active');
        });
    }
    lexerHandler() {
        var _a;
        if (!((_a = this.codeField) === null || _a === void 0 ? void 0 : _a.value))
            return;
        else
            this.code = this.codeField.value;
        const lex = new Lexer(this.code);
        this.tokens = lex.readFile();
        if (this.tokens) {
            if (this.analyserField)
                this.analyserField.innerHTML = lex.getLexResult();
            if (this.lexBtn) {
                this.btnsRemoveActive();
                this.lexBtn.classList.add('active');
            }
        }
    }
    parserHandler() {
        var _a;
        if (!((_a = this.codeField) === null || _a === void 0 ? void 0 : _a.value))
            return;
        else
            this.code = this.codeField.value;
        const lex = new Lexer(this.code);
        this.tokens = lex.readFile();
        if (this.tokens) {
            const prs = new Parser(this.tokens);
            this.parsers = prs.parseInput();
            if (this.parsers) {
                if (this.analyserField)
                    this.analyserField.innerHTML = prs.getParseResult(this.parsers);
                if (this.synBtn) {
                    this.btnsRemoveActive();
                    this.synBtn.classList.add('active');
                    // const sem = new Semantic(this.parsers);
                }
            }
        }
    }
    btnsRemoveActive() {
        var _a, _b, _c;
        (_a = this.lexBtn) === null || _a === void 0 ? void 0 : _a.classList.remove('active');
        (_b = this.synBtn) === null || _b === void 0 ? void 0 : _b.classList.remove('active');
        (_c = this.semBtn) === null || _c === void 0 ? void 0 : _c.classList.remove('active');
    }
    btnsHandler() {
        var _a, _b, _c, _d;
        (_a = this.clearBtn) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => this.clearHandler());
        (_b = this.compileBtn) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => {
            this.lexerHandler();
        });
        (_c = this.lexBtn) === null || _c === void 0 ? void 0 : _c.addEventListener('click', () => {
            this.lexerHandler();
        });
        (_d = this.synBtn) === null || _d === void 0 ? void 0 : _d.addEventListener('click', () => {
            this.parserHandler();
        });
    }
}
new Ui();
