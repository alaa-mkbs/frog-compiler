import { TokenType } from './Tokens.js';
export default class Parser {
    constructor(tokens) {
        this.currentTokenIndex = 0;
        this.tokens = tokens;
    }
    nextToken() {
        if (this.currentTokenIndex < this.tokens.length - 1)
            this.currentTokenIndex++;
    }
    getCurrentToken() {
        var _a;
        return ((_a = this.tokens[this.currentTokenIndex]) !== null && _a !== void 0 ? _a : {
            type: TokenType.ERROR,
            value: '',
            errorMsg: 'Unexpected end of input',
        });
    }
    isMyType(type) {
        var _a;
        return ((_a = this.tokens[this.currentTokenIndex]) === null || _a === void 0 ? void 0 : _a.type) === type;
    }
    parseInput() {
        let parses = [];
        let parse;
        while (!this.isMyType(TokenType.ENDFILE)) {
            parse = this.parseLine();
            console.log(parse);
            parses.push(parse);
        }
        console.log(parses);
        return parses;
    }
    parseLine() {
        // skip \n
        while (this.isMyType(TokenType.FINISHLINE)) {
            this.nextToken();
            return this.parseLine();
        }
        if (this.isMyType(TokenType.ENDFILE))
            return { exp: '', desc: 'EOF', error: false };
        switch (this.getCurrentToken().type) {
            case TokenType.INT:
            case TokenType.REEL:
                return this.parseDeclaration();
            case TokenType.PRINT:
                return this.parsePrint();
            case TokenType.ID:
                return this.parseAffectation();
            case TokenType.IF:
                return this.parseIfCondition();
            case TokenType.ELSE:
                this.nextToken();
                return { exp: 'Else', desc: 'Else condition', error: false };
            case TokenType.STARTBLOCK:
                this.nextToken();
                return { exp: 'Begin', desc: 'Start block', error: false };
            case TokenType.FINISHBLOCK:
                this.nextToken();
                return { exp: 'End', desc: 'End block', error: false };
            case TokenType.START:
                this.nextToken();
                return { exp: 'FRG_Begin', desc: 'Start programme', error: false };
            case TokenType.FINISH:
                this.nextToken();
                return { exp: 'FRG_End', desc: 'End programme', error: false };
            case TokenType.REPEAT:
                this.nextToken();
                return { exp: 'Repeat', desc: 'Start Do WHile loop', error: false };
            case TokenType.UNTIL:
                return this.parseWhileLoop();
            default:
                const currentToken = this.getCurrentToken();
                this.nextToken();
                if (Object.values(TokenType).includes(currentToken.type))
                    return { exp: currentToken.value, desc: 'Unexpected in this context', error: true };
                else
                    return { exp: currentToken.value, desc: 'Invalid token', error: true };
        }
    }
    parseDeclaration() {
        const typeToken = this.getCurrentToken();
        let exp = typeToken.value + ' ';
        this.nextToken();
        if (!this.isMyType(TokenType.ID)) {
            return { exp: exp, desc: 'Expected identifier after type', error: true };
        }
        while (this.isMyType(TokenType.ID)) {
            exp += this.getCurrentToken().value;
            this.nextToken();
            if (this.isMyType(TokenType.COMM)) {
                exp += this.getCurrentToken().value + ' ';
                this.nextToken();
                if (!this.isMyType(TokenType.ID)) {
                    return { exp: exp, desc: 'Expected identifier after comma', error: true };
                }
            }
            else {
                break;
            }
        }
        if (this.isMyType(TokenType.ENDINST)) {
            exp += ' ' + this.getCurrentToken().value;
        }
        else {
            return { exp: exp, desc: 'Expected "#" at end of declaration', error: true };
        }
        this.nextToken();
        return {
            exp: exp,
            desc: typeToken.type === TokenType.INT ? 'Integer declaration' : 'Real declaration',
            error: false,
        };
    }
    parseAffectation() {
        let lExp = this.getCurrentToken().value;
        this.nextToken();
        if (!this.isMyType(TokenType.ASSIGN)) {
            return { exp: lExp, desc: 'Expected assign after id', error: true };
        }
        this.nextToken();
        let rExp = this.parseExpression();
        if (rExp === null)
            return { exp: lExp, desc: 'syntax error', error: true };
        if (this.getCurrentToken().type !== TokenType.ENDINST)
            return { exp: lExp + ':=' + rExp, desc: 'Expected "#" at end of affectation', error: true };
        this.nextToken();
        return {
            exp: lExp + ':=' + rExp + '#',
            desc: 'Assign value',
            error: false,
        };
    }
    parseFactor() {
        const tok = this.getCurrentToken();
        if (this.isMyType(TokenType.ID)) {
            this.nextToken();
            return tok.value;
        }
        if (this.isMyType(TokenType.INTNUMBER)) {
            this.nextToken();
            return tok.value;
        }
        if (this.isMyType(TokenType.REELNUMBER)) {
            this.nextToken();
            return tok.value;
        }
        return null;
    }
    isOperator(type) {
        return [
            TokenType.PLUS,
            TokenType.MINUS,
            TokenType.MULTIPLE,
            TokenType.DIVISION,
            TokenType.LESSTHEN,
            TokenType.GREATERTHEN,
            TokenType.LESSEQ,
            TokenType.GREATEREQ,
            TokenType.ASSIGN,
            TokenType.EQUAL,
        ].includes(type);
    }
    parseOperator() {
        const tok = this.getCurrentToken();
        if (!this.isOperator(tok.type)) {
            return { exp: tok.value, desc: 'Expected operator', error: true };
        }
        this.nextToken();
        return tok.value;
    }
    parseExpression() {
        let left = this.parseFactor();
        if (!this.isOperator(this.getCurrentToken().type)) {
            return left;
        }
        while (this.isOperator(this.getCurrentToken().type)) {
            const op = this.parseOperator();
            const right = this.parseFactor();
            if (left)
                left = left + op + right;
        }
        return left;
    }
    parseIfCondition() {
        let exp = this.getCurrentToken().value;
        this.nextToken();
        if (this.isMyType(TokenType.STARTCOND)) {
            exp += this.getCurrentToken().value;
            this.nextToken();
        }
        else {
            return { exp: exp, desc: 'Expected [ after if', error: true };
        }
        let condStr = this.parseExpression();
        if (!condStr)
            return {
                exp: exp,
                desc: 'Invalid expression inside If condition',
                error: true,
            };
        exp += condStr;
        if (this.isMyType(TokenType.FINISHCOND)) {
            exp += this.getCurrentToken().value;
            this.nextToken();
        }
        else {
            return { exp: exp, desc: 'Expected ] after if condition', error: true };
        }
        return {
            exp: exp,
            desc: 'If condition',
            error: false,
        };
    }
    parseWhileLoop() {
        let exp = this.getCurrentToken().value;
        this.nextToken();
        if (this.isMyType(TokenType.STARTCOND)) {
            exp += this.getCurrentToken().value;
            this.nextToken();
        }
        let condStr = '';
        while (!this.isMyType(TokenType.FINISHCOND) && !this.isMyType(TokenType.ENDFILE)) {
            condStr += this.getCurrentToken().value + ' ';
            this.nextToken();
        }
        exp += condStr;
        if (this.isMyType(TokenType.FINISHCOND)) {
            exp += this.getCurrentToken().value;
            this.nextToken();
        }
        return {
            exp: exp,
            desc: 'WHile condition',
            error: false,
        };
    }
    parsePrint() {
        let typeToken = 'string';
        let exp = this.getCurrentToken().value + ' ';
        this.nextToken();
        if (this.isMyType(TokenType.STRING)) {
            exp += this.getCurrentToken().value;
            this.nextToken();
        }
        else if (this.isMyType(TokenType.ID)) {
            typeToken = 'id';
            while (true) {
                exp += this.getCurrentToken().value;
                this.nextToken();
                if (this.isMyType(TokenType.COMM)) {
                    exp += this.getCurrentToken().value + ' ';
                    this.nextToken();
                    if (!this.isMyType(TokenType.ID)) {
                        return { exp, desc: 'Expected identifier after comma', error: true };
                    }
                }
                else {
                    break;
                }
                if (this.isMyType(TokenType.ENDFILE)) {
                    return { exp, desc: 'Unexpected end of input', error: true };
                }
            }
        }
        else {
            return { exp, desc: 'Expected string or identifier after FRG_Print', error: true };
        }
        if (this.isMyType(TokenType.ENDINST)) {
            exp += ' ' + this.getCurrentToken().value;
            this.nextToken();
        }
        else {
            return { exp, desc: 'Expected "#" at end of print', error: true };
        }
        return {
            exp,
            desc: typeToken === 'string' ? 'Print a string' : 'Print value of variable',
            error: false,
        };
    }
    getParseResult(parsers) {
        let parseResult = '';
        parsers.forEach((par) => {
            if (par.desc === 'EOF')
                return;
            if (par.error)
                parseResult += `<span class="error">${par.exp}: ${par.desc}</span>\n`;
            else
                parseResult += `${par.exp}: ${par.desc}\n`;
        });
        return parseResult;
    }
}
