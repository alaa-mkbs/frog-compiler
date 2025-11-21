import { TokenType, TokenDesc } from './Tokens.js';
class Lexer {
    constructor(code) {
        var _a;
        this.p = 0;
        this.lexResult = '';
        this.line = 0;
        this.code = code;
        this.currentChar = (_a = this.code[0]) !== null && _a !== void 0 ? _a : '\0';
    }
    getLexResult() {
        return this.lexResult;
    }
    nextChar() {
        var _a;
        this.p++;
        this.currentChar = (_a = this.code[this.p]) !== null && _a !== void 0 ? _a : '\0';
    }
    skipWhiteSpace() {
        let skipped = false;
        while (this.currentChar === ' ' || this.currentChar === '\t' || this.currentChar === '\r') {
            skipped = true;
            this.nextChar();
        }
        return skipped;
    }
    skipComment() {
        if (this.code[this.p] && this.code[this.p] === '#' && this.code[this.p + 1] === '#') {
            this.nextChar();
            this.nextChar();
            while (this.currentChar !== '\n' && this.currentChar !== '\0') {
                this.nextChar();
            }
            if (this.currentChar === '\n')
                this.nextChar();
            return true;
        }
        return false;
    }
    getNumber() {
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
        }
        else {
            return { type: TokenType.INTNUMBER, value, line: this.line };
        }
    }
    isNumeric(c) {
        return c >= '0' && c <= '9';
    }
    getString() {
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
        }
        else {
            return { type: TokenType.ERROR, value: value, line: this.line, errorMsg: 'Invalid string' };
        }
    }
    getKeyword() {
        let value = '';
        if (this.isAlphabet(this.currentChar) || this.currentChar === '_') {
            value += this.currentChar;
            this.nextChar();
        }
        while (this.currentChar && this.isKeywordChar(this.currentChar)) {
            value += this.currentChar;
            this.nextChar();
        }
        const keywords = {
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
    isKeywordChar(n) {
        return this.isAlphabet(n) || n === '_' || this.isNumeric(n);
    }
    isAlphabet(n) {
        return typeof n === 'string' && n.length === 1 && n.toLocaleLowerCase() !== n.toUpperCase();
    }
    createToken() {
        if (this.skipWhiteSpace())
            return this.createToken();
        if (this.skipComment())
            return this.createToken();
        if (this.isNumeric(this.currentChar))
            return this.getNumber();
        if (this.isAlphabet(this.currentChar))
            return this.getKeyword();
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
        if (this.currentChar === '"')
            return this.getString();
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
    readFile() {
        const tokens = [];
        let token;
        do {
            token = this.createToken();
            tokens.push(token);
        } while (token.type !== TokenType.ENDFILE);
        console.log(tokens);
        this.setTokensDesc(tokens);
        return tokens;
    }
    setTokensDesc(tokens) {
        tokens.forEach((tok) => {
            if (tok.type !== TokenType.ENDFILE && tok.type !== TokenType.FINISHLINE) {
                if (tok.errorMsg)
                    this.lexResult += `<p class="error"><span class="line-number">${tok.line + 1}</span>: ${tok.value}: ${tok.errorMsg}</p>`;
                else
                    this.lexResult += `<p><span class="line-number">${tok.line + 1}</span>: ${tok.value}: ${TokenDesc[tok.type]}\n</p>`;
            }
        });
    }
}
export default Lexer;
