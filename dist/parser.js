import { TokenType } from './Tokens.js';
export default class Parser {
    constructor(tokens) {
        this.currentTokenIndex = 0;
        this.tokens = tokens;
        this.parseInput();
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
    getTokenValue() {
        var _a, _b;
        return (_b = (_a = this.tokens[this.currentTokenIndex]) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : '';
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
        return true;
    }
    parseLine() {
        // skip \n
        while (this.isMyType(TokenType.FINISHLINE)) {
            this.nextToken();
            return this.parseLine();
        }
        if (this.isMyType(TokenType.ENDFILE))
            return { exp: '', desc: 'EOF' };
        switch (this.getCurrentToken().type) {
            case TokenType.INT:
            case TokenType.REEL:
                return this.parseDeclaration();
            case TokenType.ID:
                return this.parseAffectation();
            case TokenType.IF:
                return this.parseCondition();
        }
        console.log(this.getCurrentToken());
        // if (this.isMyType(TokenType.INT) || this.isMyType(TokenType.REEL)) {
        //   return this.parseDeclaration();
        // }
        throw new Error('error others');
    }
    parseDeclaration() {
        const typeToken = this.getCurrentToken();
        let exp = typeToken.value + ' ';
        this.nextToken();
        if (!this.isMyType(TokenType.ID)) {
            throw new Error('Expected identifier after type');
        }
        while (this.isMyType(TokenType.ID)) {
            exp += this.getTokenValue();
            this.nextToken();
            if (this.isMyType(TokenType.COMM)) {
                exp += this.getTokenValue() + ' ';
                this.nextToken();
                if (!this.isMyType(TokenType.ID)) {
                    throw new Error('Expected identifier after comma');
                }
            }
            else {
                break;
            }
        }
        if (this.isMyType(TokenType.ENDINST)) {
            exp += ' ' + this.getTokenValue();
        }
        else {
            throw new Error("Expected '#' at end of declaration");
        }
        this.nextToken();
        return {
            exp: exp,
            desc: typeToken.type === TokenType.INT ? 'Integer declaration' : 'Real declaration',
        };
    }
    parseAffectation() {
        let lExp = this.getCurrentToken().value;
        this.nextToken();
        if (!this.isMyType(TokenType.EQUAL)) {
            throw new Error('Expected equal after id');
        }
        this.nextToken();
        let rExp = this.parseExpression();
        this.nextToken(); // #
        return {
            exp: lExp + ':=' + rExp + '#',
            desc: 'Assign value',
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
        throw new Error(`Expected identifier or number, got ${tok.value}`);
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
            TokenType.EQUAL,
        ].includes(type);
    }
    parseOperator() {
        const tok = this.getCurrentToken();
        if (!this.isOperator(tok.type)) {
            throw new Error(`Expected operator, got ${tok.value}`);
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
            left = left + op + right;
        }
        return left;
    }
    parseCondition() {
        this.nextToken(); // skip 'If'
        // Skip '[' if exists
        if (this.isMyType(TokenType.STARTCOND))
            this.nextToken();
        // Read condition until ']'
        let condStr = "";
        while (!this.isMyType(TokenType.FINISHCOND) && !this.isMyType(TokenType.ENDFILE)) {
            condStr += this.getCurrentToken().value + " ";
            this.nextToken();
        }
        if (this.isMyType(TokenType.FINISHCOND))
            this.nextToken();
        // Then block
        let thenStr = "";
        while (!this.isMyType(TokenType.ELSE) &&
            !this.isMyType(TokenType.FINISHBLOCK) &&
            !this.isMyType(TokenType.ENDFILE)) {
            thenStr += this.getCurrentToken().value + " ";
            this.nextToken();
        }
        // Else block (optional)
        let elseStr = "";
        if (this.isMyType(TokenType.ELSE)) {
            this.nextToken(); // skip 'Else'
            // Check for Begin/End block
            if (this.isMyType(TokenType.STARTBLOCK)) {
                this.nextToken(); // skip 'Begin'
                while (!this.isMyType(TokenType.FINISHBLOCK)) {
                    elseStr += this.getCurrentToken().value + " ";
                    this.nextToken();
                }
                this.nextToken(); // skip 'End'
            }
            else {
                while (!this.isMyType(TokenType.FINISHBLOCK) && !this.isMyType(TokenType.ENDFILE)) {
                    elseStr += this.getCurrentToken().value + " ";
                    this.nextToken();
                }
            }
        }
        const expStr = `If ${condStr.trim()} Then ${thenStr.trim()}${elseStr ? " Else " + elseStr.trim() : ""}`;
        return {
            exp: expStr + "#",
            desc: "Condition statement"
        };
    }
}
