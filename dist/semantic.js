import {} from './Tokens.js';
export default class Semantic {
    constructor(parses) {
        this.symbols = {};
        this.errors = [];
        this.output = [];
        this.parses = parses.filter(p => p.exp.trim() !== '');
    }
    analyze() {
        var _a, _b, _c, _d, _e, _f;
        this.errors = [];
        this.output = [];
        this.symbols = {};
        if (((_a = this.parses[0]) === null || _a === void 0 ? void 0 : _a.exp) !== 'FRG_Begin') {
            this.errors.push({ line: (_c = (_b = this.parses[0]) === null || _b === void 0 ? void 0 : _b.line) !== null && _c !== void 0 ? _c : 1, error: 'Program must start with FRG_Begin' });
        }
        if (((_d = this.parses[this.parses.length - 1]) === null || _d === void 0 ? void 0 : _d.exp) !== 'FRG_End') {
            const lastLine = (_f = (_e = this.parses[this.parses.length - 1]) === null || _e === void 0 ? void 0 : _e.line) !== null && _f !== void 0 ? _f : 1;
            this.errors.push({ line: lastLine, error: 'Program must end with FRG_End' });
        }
        this.executeProgram();
        console.log('Symbols', this.symbols);
    }
    executeProgram() {
        let i = 0;
        while (i < this.parses.length) {
            const parse = this.parses[i];
            if (!parse || parse.error) {
                i++;
                continue;
            }
            const exp = parse.exp;
            const line = parse.line;
            try {
                if (exp === 'FRG_Begin' || exp === 'FRG_End') {
                    i++;
                }
                else if (exp.startsWith('FRG_Int') || exp.startsWith('FRG_Real')) {
                    this.executeDeclaration(exp, line);
                    i++;
                }
                else if (exp.startsWith('FRG_Print')) {
                    this.executePrint(exp, line);
                    i++;
                }
                else if (exp.includes(':=')) {
                    this.executeAffectation(exp, line);
                    i++;
                }
                else if (exp.startsWith('If[')) {
                    i = this.executeIf(i);
                }
                else if (exp === 'Repeat') {
                    i = this.executeRepeat(i);
                }
                else if (exp === 'Begin') {
                    i = this.executeBeginBlock(i);
                }
                else if (exp === 'Else') {
                    this.errors.push({ line, error: 'Unexpected Else outside of If statement' });
                    i++;
                }
                else if (exp === 'End') {
                    this.errors.push({ line, error: 'Unexpected End without Begin' });
                    i++;
                }
                else {
                    this.errors.push({ line, error: `Unknown instruction: ${exp}` });
                    i++;
                }
            }
            catch (error) {
                this.errors.push({ line, error: `Execution error: ${error}` });
                i++;
            }
        }
    }
    executeIf(ifIndex) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const ifParse = this.parses[ifIndex];
        const condition = this.extractCondition((_a = ifParse === null || ifParse === void 0 ? void 0 : ifParse.exp) !== null && _a !== void 0 ? _a : "");
        const conditionResult = this.evaluateCondition(condition, (_b = ifParse === null || ifParse === void 0 ? void 0 : ifParse.line) !== null && _b !== void 0 ? _b : 0);
        let i = ifIndex + 1;
        const nextExp = i < this.parses.length ? (_c = this.parses[i]) === null || _c === void 0 ? void 0 : _c.exp : '';
        if (nextExp === 'Else' || nextExp === 'End') {
            // Single instruction 
            if (conditionResult) {
                if (i < this.parses.length) {
                    this.executeSingleInstruction(i);
                    i++;
                }
            }
            return i;
        }
        if (conditionResult) {
            // multi instr
            if (((_d = this.parses[i]) === null || _d === void 0 ? void 0 : _d.exp) === 'Begin') {
                i = this.executeBeginBlock(i);
            }
            else {
                this.executeSingleInstruction(i);
                i++;
            }
        }
        else {
            if (((_e = this.parses[i]) === null || _e === void 0 ? void 0 : _e.exp) === 'Begin') {
                i = this.skipBeginBlock(i);
            }
            else {
                i++;
            }
        }
        // check Else
        if (i < this.parses.length && ((_f = this.parses[i]) === null || _f === void 0 ? void 0 : _f.exp) === 'Else') {
            i++; // Skip Else
            if (conditionResult) {
                if (i < this.parses.length && ((_g = this.parses[i]) === null || _g === void 0 ? void 0 : _g.exp) === 'Begin') {
                    i = this.skipBeginBlock(i);
                }
                else {
                    i++;
                }
            }
            else {
                // else block
                if (i < this.parses.length && ((_h = this.parses[i]) === null || _h === void 0 ? void 0 : _h.exp) === 'Begin') {
                    i = this.executeBeginBlock(i);
                }
                else if (i < this.parses.length) {
                    this.executeSingleInstruction(i);
                    i++;
                }
            }
        }
        return i;
    }
    executeRepeat(repeatIndex) {
        var _a, _b, _c, _d, _e, _f, _g;
        const repeatLine = (_b = (_a = this.parses[repeatIndex]) === null || _a === void 0 ? void 0 : _a.line) !== null && _b !== void 0 ? _b : 0;
        let untilIndex = -1;
        // find Until
        for (let j = repeatIndex + 1; j < this.parses.length; j++) {
            if ((_c = this.parses[j]) === null || _c === void 0 ? void 0 : _c.exp.toLowerCase().startsWith('until')) {
                untilIndex = j;
                break;
            }
        }
        if (untilIndex === -1) {
            this.errors.push({ line: repeatLine, error: 'Repeat statement missing Until' });
            return repeatIndex + 1;
        }
        let iterationCount = 0;
        const maxIterations = 1000;
        do {
            let i = repeatIndex + 1;
            while (i < untilIndex) {
                const parse = this.parses[i];
                if (!parse)
                    break;
                const exp = parse.exp;
                if (exp.startsWith('If[')) {
                    i = this.executeIf(i);
                }
                else if (exp === 'Begin') {
                    i = this.executeBeginBlock(i);
                }
                else if (exp === 'Repeat') {
                    i = this.executeRepeat(i);
                }
                else {
                    this.executeSingleInstruction(i);
                    i++;
                }
            }
            const untilExp = (_e = (_d = this.parses[untilIndex]) === null || _d === void 0 ? void 0 : _d.exp) !== null && _e !== void 0 ? _e : "";
            const condition = this.extractCondition(untilExp);
            const conditionResult = this.evaluateCondition(condition, (_g = (_f = this.parses[untilIndex]) === null || _f === void 0 ? void 0 : _f.line) !== null && _g !== void 0 ? _g : 0);
            if (conditionResult)
                break;
            iterationCount++;
            if (iterationCount > maxIterations) {
                this.errors.push({ line: repeatLine, error: 'Possible infinite loop detected' });
                break;
            }
        } while (true);
        return untilIndex + 1;
    }
    executeBeginBlock(beginIndex) {
        var _a, _b, _c;
        let i = beginIndex + 1;
        let depth = 1;
        while (i < this.parses.length && depth > 0) {
            const exp = (_a = this.parses[i]) === null || _a === void 0 ? void 0 : _a.exp;
            if (exp === 'Begin')
                depth++;
            if (exp === 'End')
                depth--;
            if (depth > 0) {
                if (exp === null || exp === void 0 ? void 0 : exp.startsWith('If[')) {
                    i = this.executeIf(i);
                }
                else if (exp === 'Begin') {
                    i = this.executeBeginBlock(i);
                }
                else if (exp === 'Repeat') {
                    i = this.executeRepeat(i);
                }
                else {
                    this.executeSingleInstruction(i);
                    i++;
                }
            }
            else {
                i++;
            }
        }
        if (depth > 0) {
            this.errors.push({ line: (_c = (_b = this.parses[beginIndex]) === null || _b === void 0 ? void 0 : _b.line) !== null && _c !== void 0 ? _c : 0, error: 'Begin block missing End' });
        }
        return i;
    }
    skipBeginBlock(beginIndex) {
        var _a;
        let i = beginIndex + 1;
        let depth = 1;
        while (i < this.parses.length && depth > 0) {
            const exp = (_a = this.parses[i]) === null || _a === void 0 ? void 0 : _a.exp;
            if (exp === 'Begin')
                depth++;
            if (exp === 'End')
                depth--;
            i++;
        }
        return i;
    }
    executeSingleInstruction(index) {
        const parse = this.parses[index];
        if (!parse)
            return;
        const exp = parse.exp;
        const line = parse.line;
        if (exp.startsWith('FRG_Print')) {
            this.executePrint(exp, line);
        }
        else if (exp.includes(':=')) {
            this.executeAffectation(exp, line);
        }
    }
    executeDeclaration(exp, line) {
        const isInt = exp.startsWith('FRG_Int');
        const type = isInt ? 'FRG_Int' : 'FRG_Real';
        const varPart = exp.replace(isInt ? 'FRG_Int' : 'FRG_Real', '')
            .replace('#', '')
            .trim();
        const vars = varPart.split(',').map(v => v.trim()).filter(v => v !== '');
        for (const varName of vars) {
            if (this.symbols[varName]) {
                this.errors.push({ line, error: `Variable '${varName}' already declared` });
            }
            else {
                this.symbols[varName] = {
                    type,
                    init: false,
                    value: type === 'FRG_Int' ? 0 : 0.0
                };
            }
        }
    }
    executeAffectation(exp, line) {
        exp = exp.replace('#', '').trim();
        const [left, right] = exp.split(':=').map(part => part.trim());
        if (!left || !right) {
            this.errors.push({ line, error: 'Invalid assignment syntax' });
            return;
        }
        if (!this.symbols[left]) {
            this.errors.push({ line, error: `Variable '${left}' not declared` });
            return;
        }
        const value = this.evaluateExpression(right, line);
        if (this.symbols[left].type === 'FRG_Int') {
            this.symbols[left].value = Math.floor(value);
        }
        else {
            this.symbols[left].value = value;
        }
        this.symbols[left].init = true;
    }
    executePrint(exp, line) {
        exp = exp.replace('FRG_Print', '').replace('#', '').trim();
        if (exp.startsWith('"') && exp.endsWith('"')) {
            const str = exp.substring(1, exp.length - 1);
            this.output.push(str);
            return;
        }
        const vars = exp.split(',').map(v => v.trim());
        const results = [];
        for (const varName of vars) {
            if (varName && this.symbols[varName]) {
                if (!this.symbols[varName].init) {
                    this.errors.push({ line, error: `Variable '${varName}' used before initialization` });
                    results.push('undefined');
                }
                else {
                    results.push(String(this.symbols[varName].value));
                }
            }
            else if (varName) {
                this.errors.push({ line, error: `Variable '${varName}' not declared` });
                results.push('undefined');
            }
        }
        this.output.push(results.join(', '));
    }
    extractCondition(exp) {
        const start = exp.indexOf('[');
        const end = exp.indexOf(']');
        if (start === -1 || end === -1)
            return '';
        return exp.substring(start + 1, end).trim();
    }
    evaluateCondition(condition, line) {
        var _a, _b;
        const operators = ['<=', '>=', '<', '>', '==', '!='];
        let operator = '';
        let parts = [];
        for (const op of operators) {
            if (condition.includes(op)) {
                operator = op;
                parts = condition.split(op).map(p => p.trim());
                break;
            }
        }
        if (!operator || parts.length !== 2) {
            this.errors.push({ line, error: `Invalid condition: ${condition}` });
            return false;
        }
        const left = this.evaluateExpression((_a = parts[0]) !== null && _a !== void 0 ? _a : "", line);
        const right = this.evaluateExpression((_b = parts[1]) !== null && _b !== void 0 ? _b : "", line);
        switch (operator) {
            case '<=': return left <= right;
            case '>=': return left >= right;
            case '<': return left < right;
            case '>': return left > right;
            case '==': return Math.abs(left - right) < 0.0001;
            case '!=': return Math.abs(left - right) > 0.0001;
            default: return false;
        }
    }
    evaluateExpression(expr, line) {
        var _a, _b;
        expr = expr.trim();
        const num = parseFloat(expr);
        if (!isNaN(num))
            return num;
        if (this.symbols[expr]) {
            if (!((_a = this.symbols[expr]) === null || _a === void 0 ? void 0 : _a.init)) {
                this.errors.push({ line, error: `Variable '${expr}' used before initialization` });
                return 0;
            }
            return ((_b = this.symbols[expr]) === null || _b === void 0 ? void 0 : _b.value) || 0;
        }
        return this.evaluateArithmetic(expr, line);
    }
    evaluateArithmetic(expr, line) {
        var _a, _b, _c;
        let processedExpr = expr;
        const varNames = Object.keys(this.symbols).sort((a, b) => b.length - a.length);
        for (const varName of varNames) {
            let position = processedExpr.indexOf(varName);
            while (position !== -1) {
                const before = position === 0 ? '' : (_a = processedExpr[position - 1]) !== null && _a !== void 0 ? _a : "";
                const after = position + varName.length >= processedExpr.length ? '' : (_b = processedExpr[position + varName.length]) !== null && _b !== void 0 ? _b : "";
                const isWholeWord = !this.isAlphaNumeric(before) && !this.isAlphaNumeric(after);
                if (isWholeWord) {
                    const varData = this.symbols[varName];
                    if (!(varData === null || varData === void 0 ? void 0 : varData.init)) {
                        this.errors.push({ line, error: `Variable '${varName}' used before initialization` });
                        processedExpr = processedExpr.substring(0, position) + '0' + processedExpr.substring(position + varName.length);
                    }
                    else {
                        processedExpr = processedExpr.substring(0, position) + String(varData.value) + processedExpr.substring(position + varName.length);
                    }
                }
                position = processedExpr.indexOf(varName, position + 1);
            }
        }
        processedExpr = processedExpr.split(' ').join('');
        for (let i = 0; i < processedExpr.length; i++) {
            const char = (_c = processedExpr[i]) !== null && _c !== void 0 ? _c : "";
            if (!this.isValidExprChar(char)) {
                this.errors.push({ line, error: `Invalid character '${char}' in expression` });
                return 0;
            }
        }
        try {
            return this.calculateExpression(processedExpr);
        }
        catch (error) {
            this.errors.push({ line, error: `Invalid expression: ${expr}` });
            return 0;
        }
    }
    calculateExpression(expr) {
        let index = 0;
        const parseExpression = () => {
            let left = parseTerm();
            while (index < expr.length && (expr[index] === '+' || expr[index] === '-')) {
                const op = expr[index];
                index++;
                const right = parseTerm();
                if (op === '+')
                    left += right;
                else
                    left -= right;
            }
            return left;
        };
        const parseTerm = () => {
            let left = parseFactor();
            while (index < expr.length && (expr[index] === '*' || expr[index] === '/')) {
                const op = expr[index];
                index++;
                const right = parseFactor();
                if (op === '*')
                    left *= right;
                else
                    left /= right;
            }
            return left;
        };
        const parseFactor = () => {
            var _a;
            if (index >= expr.length)
                return 0;
            if (expr[index] === '(') {
                index++;
                const result = parseExpression();
                if (index >= expr.length || expr[index] !== ')') {
                    throw new Error('Missing closing parenthesis');
                }
                index++;
                return result;
            }
            if (expr[index] === '-') {
                index++;
                return -parseFactor();
            }
            let numStr = '';
            while (index < expr.length &&
                (this.isDigit((_a = expr[index]) !== null && _a !== void 0 ? _a : "") || expr[index] === '.')) {
                numStr += expr[index];
                index++;
            }
            if (numStr === '') {
                throw new Error('Expected number');
            }
            return parseFloat(numStr);
        };
        return parseExpression();
    }
    isAlphaNumeric(char) {
        if (!char)
            return false;
        return (char >= 'a' && char <= 'z') ||
            (char >= 'A' && char <= 'Z') ||
            (char >= '0' && char <= '9') ||
            char === '_';
    }
    isValidExprChar(char) {
        const validChars = '0123456789+-*/().';
        return validChars.includes(char);
    }
    isDigit(char) {
        return char >= '0' && char <= '9';
    }
    getSymbolTable() {
        return this.symbols;
    }
    getOutput() {
        return this.output.join('\n');
    }
    getErrors() {
        return this.errors.map(err => `Line ${err.line}: ${err.error}`).join('\n');
    }
    hasErrors() {
        return this.errors.length > 0;
    }
}
