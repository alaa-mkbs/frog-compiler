import Lexer from './Lexer.js';
import Parser from './parser.js';

class Ui {
  private code: string = "";

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
    this.code = "";

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

    this.analyzerHandler();
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
            }
          };
          reader.readAsText(selectedFile);
        }
      }
    });
  }

  clearHandler():void {
    if(this.code) this.code = "";
    if(this.fileCode) this.fileCode.value = "";
    if(this.filePath) this.filePath.textContent = "";
    if(this.codeField) this.codeField.value = "";
    if(this.analyserField) this.analyserField.value = "";
    if(this.resultField) this.resultField.value = "";

    const activeClassName = document.querySelectorAll(".active");

    activeClassName?.forEach((el) => {
      el.classList.remove("active");
    })
  }

  analyzerHandler():void {
      if(!this.codeField?.value) return;
      else this.code = this.codeField.value;

    const lex = new Lexer(this.code);
    const tokens = lex.readFile();
    if (this.analyserField) this.analyserField.value = lex.getLexResult();
    if(this.lexBtn) this.lexBtn.classList.add("active");
    const prs = new Parser(tokens);
  }

  btnsHandler() {
    this.clearBtn?.addEventListener("click", () => this.clearHandler());
    this.compileBtn?.addEventListener("click", () => {this.analyzerHandler();});
  }
}

new Ui();
