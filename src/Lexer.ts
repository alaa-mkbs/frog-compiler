import { type Token, TokenType, TokenDesc } from './Tokens.js';

class Lexer {
  private code: string;
  private p: number = 0;
  private currentChar: string;
  private lexResult: string = '';
  private line: number = 0;

  constructor(code: string) {
    this.code = code;
    this.currentChar = this.code[0] ?? '\0';
  }

  public getLexResult(): string {
    return this.lexResult;
  }

  public nextChar(): void {
    this.p++;
    this.currentChar = this.code[this.p] ?? '\0';
  }

  public skipWhiteSpace(): boolean {
    let skipped = false;
    while (this.currentChar === ' ' || this.currentChar === '\t' || this.currentChar === '\r') {
      skipped = true;
      this.nextChar();
    }
    return skipped;
  }

  public skipComment(): boolean {
    if (this.code[this.p] && this.code[this.p] === '#' && this.code[this.p + 1] === '#') {
      this.nextChar();
      this.nextChar();
      while (this.currentChar !== '\n' && this.currentChar !== '\0') {
        this.nextChar();
      }
      if (this.currentChar === '\n') this.nextChar();
      return true;
    }
    return false;
  }

  public getNumber(): Token {
    let value = '';
    let hasDecimal = false;

    while (this.currentChar && this.isNumeric(this.currentChar)) {
      value += this.currentChar;
      this.nextChar();
    }

    if (this.currentChar === '.') {
      const nextChar = this.code[this.p + 1];
      if (nextChar && nextChar >= '0' && nextChar <= '9') {
        hasDecimal = true;
        value += this.currentChar; // Add the '.'
        this.nextChar();

        while (this.currentChar && this.isNumeric(this.currentChar)) {
          value += this.currentChar;
          this.nextChar();
        }
      }
    }

    if (hasDecimal) {
      return { type: TokenType.REELNUMBER, value, line: this.line };
    } else {
      return { type: TokenType.INTNUMBER, value, line: this.line };
    }
  }

  isNumeric(c: string): boolean {
    return c >= '0' && c <= '9';
  }

  public getString(): Token {
    let value = this.currentChar;
    this.nextChar();

    while (this.currentChar !== '"' && this.currentChar !== '\0' && this.currentChar !== '\n') {
      value += this.currentChar;
      this.nextChar();
    }

    if (this.currentChar === '"') {
      value += this.currentChar;
      this.nextChar();
      return { type: TokenType.STRING, value, line: this.line };
    } else {
      return { type: TokenType.ERROR, value: value, line: this.line, errorMsg: 'Invalid string' };
    }
  }

  public getKeyword(): Token {
    let value = '';

    if (this.isAlphabet(this.currentChar) || this.currentChar === '_') {
      value += this.currentChar;
      this.nextChar();
    }

    while (this.currentChar && this.isKeywordChar(this.currentChar)) {
      value += this.currentChar;
      this.nextChar();
    }

    const keywords: { [key: string]: TokenType } = {
      FRG_Begin: TokenType.START,
      FRG_End: TokenType.FINISH,
      Begin: TokenType.STARTBLOCK,
      End: TokenType.FINISHBLOCK,
      If: TokenType.IF,
      Else: TokenType.ELSE,
      FRG_Int: TokenType.INT,
      FRG_Real: TokenType.REEL,
      FRG_Print: TokenType.PRINT,
      Repeat: TokenType.REPEAT,
      until: TokenType.UNTIL,
    };

    const type = keywords[value];
    if (type !== undefined) {
      return { type, value, line: this.line };
    }

    return { type: TokenType.ID, value: value, line: this.line };
  }

  isKeywordChar(n: string) {
    return this.isAlphabet(n) || n === '_' || this.isNumeric(n);
  }

  isAlphabet(n: string) {
    return typeof n === 'string' && n.length === 1 && n.toLocaleLowerCase() !== n.toUpperCase();
  }

  public createToken(): Token {
    if (this.skipWhiteSpace()) return this.createToken();
    if (this.skipComment()) return this.createToken();

    if (this.isNumeric(this.currentChar)) return this.getNumber();
    if (this.isAlphabet(this.currentChar)) return this.getKeyword();

    if (this.currentChar === ':' && this.code[this.p + 1] === '=') {
      this.nextChar();
      this.nextChar();
      return { type: TokenType.ASSIGN, value: ':=', line: this.line };
    }
    if (this.currentChar === '<' && this.code[this.p + 1] === '=') {
      this.nextChar();
      this.nextChar();
      return { type: TokenType.LESSEQ, value: '<=', line: this.line };
    }
    if (this.currentChar === '>' && this.code[this.p + 1] === '=') {
      this.nextChar();
      this.nextChar();
      return { type: TokenType.GREATEREQ, value: '>=', line: this.line };
    }
    if (this.currentChar === '"') return this.getString();

    switch (this.currentChar) {
      case '+':
        this.nextChar();
        return { type: TokenType.PLUS, value: '+', line: this.line };
      case '-':
        this.nextChar();
        return { type: TokenType.MINUS, value: '-', line: this.line };
      case '*':
        this.nextChar();
        return { type: TokenType.MULTIPLE, value: '*', line: this.line };
      case '/':
        this.nextChar();
        return { type: TokenType.DIVISION, value: '/', line: this.line };
      case '<':
        this.nextChar();
        return { type: TokenType.LESSTHEN, value: '<', line: this.line };
      case '>':
        this.nextChar();
        return { type: TokenType.GREATERTHEN, value: '>', line: this.line };
      case '[':
        this.nextChar();
        return { type: TokenType.STARTCOND, value: '[', line: this.line };
      case ']':
        this.nextChar();
        return { type: TokenType.FINISHCOND, value: ']', line: this.line };
      case ',':
        this.nextChar();
        return { type: TokenType.COMM, value: ',', line: this.line };
      case '#':
        this.nextChar();
        return { type: TokenType.ENDINST, value: '#', line: this.line };
      case '\r':
        this.nextChar();
        return this.createToken();
      case '\0':
        return { type: TokenType.ENDFILE, value: '\\0', line: this.line };
      case '\n':
        this.line++;
        this.nextChar();
        return { type: TokenType.FINISHLINE, value: '\n', line: this.line };
      default:
        const errorChar = this.currentChar;
        this.nextChar();
        return { type: TokenType.ERROR, value: errorChar, errorMsg: 'Invalid character', line: this.line };
    }
  }

  public readFile() {
    const tokens: Token[] = [];
    let token: Token;
    do {
      token = this.createToken();
      tokens.push(token);
    } while (token.type !== TokenType.ENDFILE);
    console.log(tokens);
    this.setTokensDesc(tokens);
    return tokens;
  }

  public setTokensDesc(tokens: Token[]): void {
    tokens.forEach((tok) => {
      if (tok.type !== TokenType.ENDFILE && tok.type !== TokenType.FINISHLINE) {
        if (tok.errorMsg) this.lexResult += `<p class="error"><span class="line-number">${tok.line + 1}</span>: ${tok.value}: ${tok.errorMsg}</p>`;
        else this.lexResult += `<p><span class="line-number">${tok.line + 1}</span>: ${tok.value}: ${TokenDesc[tok.type]}\n</p>`;
      }
    });
  }
}

export default Lexer;
