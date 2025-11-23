import Lexer from './Lexer.js';
import Parser from './Parser.js';
import Semantic from './Semantic.js';
import type { Parse, Token } from './Tokens.js';

class Ui {
  private code: string = '';
  private tokens: Token[];
  private parsers: Parse[];
  private errors: string;

  private fileCode: HTMLInputElement | null;
  private filePath: HTMLInputElement | null;

  private lexBtn: HTMLButtonElement | null;
  private synBtn: HTMLButtonElement | null;
  private semBtn: HTMLButtonElement | null;

  private clearBtn: HTMLButtonElement | null;
  private compileBtn: HTMLButtonElement | null;

  private codeField: HTMLTextAreaElement | null;
  private analyserField: HTMLTextAreaElement | null;
  private resultField: HTMLTextAreaElement | null;

  constructor() {
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

    this.lexerHandler();
    this.FileUploadedHandler();
    this.btnsHandler();
  }

  FileUploadedHandler(): void {
    this.fileCode?.addEventListener('change', (e) => {
      const input = e.target as HTMLInputElement;
      if (this.filePath && input.files && input.files.length > 0) {
        const selectedFile = input.files[0];
        if (selectedFile) {
          this.filePath.textContent = selectedFile.name;
          const reader = new FileReader();
          reader.onload = (event) => {
            const fileContent = event.target?.result as string;
            if (this.codeField) {
              this.clearHandler();
              this.codeField.value = fileContent;
              this.code = this.codeField.value;
              this.lexerHandler();
            }
          };
          reader.readAsText(selectedFile);
        }
      }
    });
  }

  clearHandler(): void {
    if (this.code) this.code = '';
    if (this.fileCode) this.fileCode.value = '';
    if (this.filePath) this.filePath.textContent = '';
    if (this.codeField) this.codeField.value = '';
    if (this.analyserField) this.analyserField.innerHTML = '';
    if (this.resultField) this.resultField.innerHTML = '';
    if (this.tokens) this.tokens = [];
    if (this.parsers) this.parsers = [];
    if (this.errors) this.errors = '';

    console.clear();

    const activeClassName = document.querySelectorAll('.active');

    activeClassName?.forEach((el) => {
      el.classList.remove('active');
    });
  }

  lexerHandler(): void {
    if (!this.codeField?.value) return;
    else this.code = this.codeField.value;

    const lex = new Lexer(this.code);
    this.tokens = lex.readFile();

    if (this.tokens) {
      if (this.analyserField) this.analyserField.innerHTML = lex.getLexResult();
      if (this.lexBtn) {
        this.btnsRemoveActive();
        this.lexBtn.classList.add('active');
      }
    }
  }

  parserHandler(): void {
    const prs = new Parser(this.tokens);
    this.parsers = prs.parseInput();
    if (this.parsers) {
      if (this.analyserField) this.analyserField.innerHTML = prs.getParseResult(this.parsers);
      if (this.synBtn) {
        this.btnsRemoveActive();
        this.synBtn.classList.add('active');
      }
    }
  }

  semanticsHandler(): void {
    const thereAreAError = this.tokens.some((item) => item.errorMsg) || this.parsers.some((item) => item.error);
    if (this.tokens.length === 0 || this.parsers.length === 0 || thereAreAError) return;
    const sem = new Semantic(this.parsers);
    sem.analyze();
    this.errors = sem.getErrors();
    if (this.errors) {
      if (this.analyserField) this.analyserField.innerHTML = `<p class='error'>${this.errors}</p>`;
    } else {
      if (this.analyserField) this.analyserField.innerHTML = `<p >No errors found</p><h3 class='var-title'>Variables list:</h3>${sem.getSymbolTable()}`;
      if (this.resultField) this.resultField.innerHTML = sem.getOutput();
    }
    if (this.semBtn) {
      this.btnsRemoveActive();
      this.semBtn.classList.add('active');
    }
  }

  resultHandler() {
    const lex = new Lexer(this.code);
    this.tokens = lex.readFile();
  }

  btnsRemoveActive() {
    this.lexBtn?.classList.remove('active');
    this.synBtn?.classList.remove('active');
    this.semBtn?.classList.remove('active');
  }

  btnsHandler() {
    this.clearBtn?.addEventListener('click', () => this.clearHandler());
    this.compileBtn?.addEventListener('click', () => {
      this.tokens = [];
      this.parsers = [];
      this.errors = '';
      if(this.resultField) this.resultField.innerHTML = 'click on semantic analyser to see the result';
      this.lexerHandler();
    });
    this.lexBtn?.addEventListener('click', () => {
      if(!this.codeField?.value) return;
      this.lexerHandler();
    });
    this.synBtn?.addEventListener('click', () => {
      if(!this.codeField?.value) return;
      if(!this.tokens.length) return;
      this.parserHandler();
    });
    this.semBtn?.addEventListener('click', () => {
      if(!this.codeField?.value) return;
      this.semanticsHandler();
    });
  }
}

new Ui();
