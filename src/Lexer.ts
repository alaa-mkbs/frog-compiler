import { type Token, TokenType, TokenDesc } from './Tokens.js';

class Lexer {
  private code: string;
  private p: number = 0;
  private currentChar: string;
  private lexResult: string = '';

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

    while (this.currentChar && /[0-9.]/.test(this.currentChar)) {
      value += this.currentChar;
      this.nextChar();
    }

    if (/^[0-9]+\.[0-9]+$/.test(value)) {
      return { type: TokenType.REELNUMBER, value };
    }

    if (/^[0-9]+$/.test(value)) {
      return { type: TokenType.INTNUMBER, value };
    }

    return { type: TokenType.ERROR, value: value, errorMsg: 'Invalid number' };
    
    throw new Error(`Invalid number '${value}' at position ${this.p}`);
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
      return { type: TokenType.STRING, value };
    } else {
      return { type: TokenType.ERROR, value: value, errorMsg: 'Invalid string' };
    }
  }

  public getKeyword(): Token {
    let value = '';
    while (this.currentChar && /[a-zA-Z0-9_]/.test(this.currentChar)) {
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
      return { type, value };
    }

    return { type: TokenType.ID, value: value };
  }

  public createToken(): Token {
    if (this.skipWhiteSpace()) return this.createToken();
    if (this.skipComment()) return this.createToken();
    if (/[0-9]/.test(this.currentChar)) return this.getNumber();
    if (/[a-zA-Z]/.test(this.currentChar)) return this.getKeyword();
    if (this.currentChar === ':' && this.code[this.p + 1] === '=') {
      this.nextChar();
      this.nextChar();
      return { type: TokenType.ASSIGN, value: ':=' };
    }
    if (this.currentChar === '<' && this.code[this.p + 1] === '=') {
      this.nextChar();
      this.nextChar();
      return { type: TokenType.LESSEQ, value: '<=' };
    }
    if (this.currentChar === '>' && this.code[this.p + 1] === '=') {
      this.nextChar();
      this.nextChar();
      return { type: TokenType.GREATEREQ, value: '>=' };
    }
    if (this.currentChar === '"') return this.getString();

    switch (this.currentChar) {
      case '+':
        this.nextChar();
        return { type: TokenType.PLUS, value: '+' };
      case '-':
        this.nextChar();
        return { type: TokenType.MINUS, value: '-' };
      case '*':
        this.nextChar();
        return { type: TokenType.MULTIPLE, value: '*' };
      case '/':
        this.nextChar();
        return { type: TokenType.DIVISION, value: '/' };
      case '<':
        this.nextChar();
        return { type: TokenType.LESSTHEN, value: '<' };
      case '>':
        this.nextChar();
        return { type: TokenType.GREATERTHEN, value: '>' };
      case '[':
        this.nextChar();
        return { type: TokenType.STARTCOND, value: '[' };
      case ']':
        this.nextChar();
        return { type: TokenType.FINISHCOND, value: ']' };
      case ',':
        this.nextChar();
        return { type: TokenType.COMM, value: ',' };
      case '#':
        this.nextChar();
        return { type: TokenType.ENDINST, value: '#' };
      case '\r':
        this.nextChar();
        return this.createToken();
      case '\0':
        return { type: TokenType.ENDFILE, value: '\\0' };
      case '\n':
        this.nextChar();
        return { type: TokenType.FINISHLINE, value: '\n' };
      default:
        const errorChar = this.currentChar;
        this.nextChar();
        return { type: TokenType.ERROR, value: errorChar, errorMsg: 'Invalid character' };
    }
  }

public readFile() {
  const tokens: Token[] = [];
  let token: Token;
  do {
    token = this.createToken();
    tokens.push(token);
  } while (token.type !== TokenType.ENDFILE);
  console.log(tokens)
  this.setTokensDesc(tokens);
  return tokens;
}

  public setTokensDesc(tokens: Token[]): void {
    tokens.forEach((tok) => {
      if (tok.type !== TokenType.ENDFILE && tok.type !== TokenType.FINISHLINE) {
        if (tok.errorMsg)
          this.lexResult += `<span class="error">${tok.value}: ${tok.errorMsg}</span>\n`;
        else this.lexResult += `${tok.value}: ${TokenDesc[tok.type]}\n`;
      }
    });
  }
}

export default Lexer;
