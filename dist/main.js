import Lexer from './Lexer.js';
import Parser from './Parser.js';
import Semantic from './Semantic.js';
class Ui {
    constructor() {
        this.code = '';
        this.code = '';
        this.tokens = [];
        this.parsers = [];
        this.errors = '';
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
        setTimeout(() => {
            this.editor = window.editor;
            this.lexerHandler();
        }, 150);
        this.FileUploadedHandler();
        this.btnsHandler();
    }
    FileUploadedHandler() {
        var _a;
        (_a = this.fileCode) === null || _a === void 0 ? void 0 : _a.addEventListener('change', (e) => {
            const input = e.target;
            if (input.files && input.files.length > 0) {
                const selectedFile = input.files[0];
                if (selectedFile) {
                    if (this.filePath) {
                        this.filePath.textContent = selectedFile.name;
                    }
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        var _a;
                        const fileContent = (_a = event.target) === null || _a === void 0 ? void 0 : _a.result;
                        if (this.editor && this.editor.setValue) {
                            this.editor.setValue(fileContent);
                        }
                        else if (this.codeField) {
                            this.codeField.value = fileContent;
                        }
                        this.code = fileContent;
                        setTimeout(() => this.lexerHandler(), 100);
                    };
                    reader.readAsText(selectedFile);
                }
            }
        });
    }
    clearHandler() {
        this.code = '';
        this.tokens = [];
        this.parsers = [];
        this.errors = '';
        if (this.fileCode) {
            this.fileCode.value = '';
        }
        if (this.filePath) {
            this.filePath.textContent = '';
        }
        const editorExists = this.editor && this.editor.setValue;
        if (editorExists) {
            this.editor.setValue('');
            if (this.editor.clearHistory)
                this.editor.clearHistory();
            if (this.editor.refresh) {
                setTimeout(() => this.editor.refresh(), 50);
            }
        }
        if (this.codeField) {
            this.codeField.value = '';
        }
        if (this.analyserField)
            this.analyserField.innerHTML = '';
        if (this.resultField)
            this.resultField.innerHTML = '';
        console.clear();
        document.querySelectorAll('.active').forEach((el) => {
            el.classList.remove('active');
        });
        if (this.lexBtn)
            this.lexBtn.classList.add('active');
    }
    lexerHandler() {
        var _a;
        const codeValue = this.editor && typeof this.editor.getValue === 'function' ? this.editor.getValue() : (_a = this.codeField) === null || _a === void 0 ? void 0 : _a.value;
        if (!codeValue || codeValue.trim() === '')
            return;
        this.code = codeValue;
        const lex = new Lexer(this.code);
        this.tokens = lex.readFile();
        if (this.tokens && this.analyserField) {
            this.analyserField.innerHTML = lex.getLexResult();
            if (this.lexBtn) {
                this.btnsRemoveActive();
                this.lexBtn.classList.add('active');
            }
        }
    }
    parserHandler() {
        const prs = new Parser(this.tokens);
        this.parsers = prs.parseInput();
        if (this.parsers && this.analyserField) {
            this.analyserField.innerHTML = prs.getParseResult(this.parsers);
            if (this.synBtn) {
                this.btnsRemoveActive();
                this.synBtn.classList.add('active');
            }
        }
    }
    semanticsHandler() {
        const thereAreAError = this.tokens.some((item) => item.errorMsg) || this.parsers.some((item) => item.error);
        if (this.tokens.length === 0 || this.parsers.length === 0 || thereAreAError)
            return;
        const sem = new Semantic(this.parsers);
        sem.analyze();
        this.errors = sem.getErrors();
        if (this.errors) {
            if (this.analyserField) {
                this.analyserField.innerHTML = `<p class='error'>${this.errors}</p>`;
            }
        }
        else {
            if (this.analyserField) {
                this.analyserField.innerHTML = `<p>No errors found</p><h3 class='var-title'>Variables list:</h3>${sem.getSymbolTable()}`;
            }
            if (this.resultField) {
                this.resultField.innerHTML = sem.getOutput();
            }
        }
        if (this.semBtn) {
            this.btnsRemoveActive();
            this.semBtn.classList.add('active');
        }
    }
    btnsRemoveActive() {
        var _a, _b, _c;
        (_a = this.lexBtn) === null || _a === void 0 ? void 0 : _a.classList.remove('active');
        (_b = this.synBtn) === null || _b === void 0 ? void 0 : _b.classList.remove('active');
        (_c = this.semBtn) === null || _c === void 0 ? void 0 : _c.classList.remove('active');
    }
    btnsHandler() {
        var _a, _b, _c, _d, _e;
        (_a = this.clearBtn) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
            this.clearHandler();
        });
        (_b = this.compileBtn) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => {
            this.tokens = [];
            this.parsers = [];
            this.errors = '';
            if (this.resultField) {
                this.resultField.innerHTML = 'click on semantic analyser to see the result';
            }
            this.lexerHandler();
        });
        (_c = this.lexBtn) === null || _c === void 0 ? void 0 : _c.addEventListener('click', () => {
            var _a;
            const codeValue = this.editor && typeof this.editor.getValue === 'function' ? this.editor.getValue() : (_a = this.codeField) === null || _a === void 0 ? void 0 : _a.value;
            if (!codeValue || codeValue.trim() === '')
                return;
            this.lexerHandler();
        });
        (_d = this.synBtn) === null || _d === void 0 ? void 0 : _d.addEventListener('click', () => {
            var _a;
            const codeValue = this.editor && typeof this.editor.getValue === 'function' ? this.editor.getValue() : (_a = this.codeField) === null || _a === void 0 ? void 0 : _a.value;
            if (!codeValue || codeValue.trim() === '')
                return;
            if (!this.tokens.length)
                return;
            this.parserHandler();
        });
        (_e = this.semBtn) === null || _e === void 0 ? void 0 : _e.addEventListener('click', () => {
            var _a;
            const codeValue = this.editor && typeof this.editor.getValue === 'function' ? this.editor.getValue() : (_a = this.codeField) === null || _a === void 0 ? void 0 : _a.value;
            if (!codeValue || codeValue.trim() === '')
                return;
            this.semanticsHandler();
        });
    }
}
new Ui();
