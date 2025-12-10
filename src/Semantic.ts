import { type Parse } from './Tokens.js';

interface VarType {
  type: 'FRG_Int' | 'FRG_Real';
  init: boolean;
  value?: number;
}

interface Symbol {
  [name: string]: VarType;
}

export default class Semantic {
  private symbols: Symbol = {};
  private parses: Parse[];
  private errors: { line: number; error: string }[] = [];
  private output: string[] = [];

  constructor(parses: Parse[]) {
    this.parses = parses.filter((p) => p.exp.trim() !== '');
  }

  analyze() {
    this.errors = [];
    this.output = [];
    this.symbols = {};

    if (this.parses[0]?.exp !== 'FRG_Begin') {
      this.errors.push({ line: this.parses[0]?.line ?? 1, error: 'Program must start with FRG_Begin' });
    }

    if (this.parses[this.parses.length - 1]?.exp !== 'FRG_End') {
      const lastLine = this.parses[this.parses.length - 1]?.line ?? 1;
      this.errors.push({ line: lastLine, error: 'Program must end with FRG_End' });
    }

    this.executeProgram();

    console.log('Symbols', this.symbols);
  }

  private executeProgram() {
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
        } else if (exp.startsWith('FRG_Int') || exp.startsWith('FRG_Real')) {
          this.executeDeclaration(exp, line);
          i++;
        } else if (exp.startsWith('FRG_Print')) {
          this.executePrint(exp, line);
          i++;
        } else if (exp.includes(':=')) {
          this.executeAffectation(exp, line);
          i++;
        } else if (exp.startsWith('If[')) {
          i = this.executeIf(i);
        } else if (exp === 'Repeat') {
          i = this.executeRepeat(i);
        } else if (exp === 'Begin') {
          i = this.executeBeginBlock(i);
        } else if (exp === 'Else') {
          this.errors.push({ line, error: 'Unexpected Else outside of If statement' });
          i++;
        } else if (exp === 'End') {
          this.errors.push({ line, error: 'Unexpected End without Begin' });
          i++;
        } else {
          this.errors.push({ line, error: `Unknown instruction: ${exp}` });
          i++;
        }
      } catch (error) {
        this.errors.push({ line, error: `Execution error: ${error}` });
        i++;
      }
    }
  }

  private executeIf(ifIndex: number): number {
    const ifParse = this.parses[ifIndex];
    const condition = this.extractCondition(ifParse?.exp ?? '');
    const conditionResult = this.evaluateCondition(condition, ifParse?.line ?? 0);

    let i = ifIndex + 1;

    const nextExp = i < this.parses.length ? this.parses[i]?.exp : '';

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
      if (this.parses[i]?.exp === 'Begin') {
        i = this.executeBeginBlock(i);
      } else {
        this.executeSingleInstruction(i);
        i++;
      }
    } else {
      if (this.parses[i]?.exp === 'Begin') {
        i = this.skipBeginBlock(i);
      } else {
        i++;
      }
    }

    // check Else
    if (i < this.parses.length && this.parses[i]?.exp === 'Else') {
      i++; // Skip Else

      if (conditionResult) {
        if (i < this.parses.length && this.parses[i]?.exp === 'Begin') {
          i = this.skipBeginBlock(i);
        } else {
          i++;
        }
      } else {
        // else block
        if (i < this.parses.length && this.parses[i]?.exp === 'Begin') {
          i = this.executeBeginBlock(i);
        } else if (i < this.parses.length) {
          this.executeSingleInstruction(i);
          i++;
        }
      }
    }

    return i;
  }

  private executeRepeat(repeatIndex: number): number {
    const repeatLine = this.parses[repeatIndex]?.line ?? 0;
    let untilIndex = -1;

    // find Until
    for (let j = repeatIndex + 1; j < this.parses.length; j++) {
      if (this.parses[j]?.exp.toLowerCase().startsWith('until')) {
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
        if (!parse) break;

        const exp = parse.exp;

        if (exp.startsWith('If[')) {
          i = this.executeIf(i);
        } else if (exp === 'Begin') {
          i = this.executeBeginBlock(i);
        } else if (exp === 'Repeat') {
          i = this.executeRepeat(i);
        } else {
          this.executeSingleInstruction(i);
          i++;
        }
      }

      const untilExp = this.parses[untilIndex]?.exp ?? '';
      const condition = this.extractCondition(untilExp);
      const conditionResult = this.evaluateCondition(condition, this.parses[untilIndex]?.line ?? 0);

      if (conditionResult) break;

      iterationCount++;
      if (iterationCount > maxIterations) {
        this.errors.push({ line: repeatLine, error: 'Possible infinite loop detected' });
        break;
      }
    } while (true);

    return untilIndex + 1;
  }

  private executeBeginBlock(beginIndex: number): number {
    let i = beginIndex + 1;
    let depth = 1;

    while (i < this.parses.length && depth > 0) {
      const exp = this.parses[i]?.exp;

      if (exp === 'Begin') depth++;
      if (exp === 'End') depth--;

      if (depth > 0) {
        if (exp?.startsWith('If[')) {
          i = this.executeIf(i);
        } else if (exp === 'Begin') {
          i = this.executeBeginBlock(i);
        } else if (exp === 'Repeat') {
          i = this.executeRepeat(i);
        } else {
          this.executeSingleInstruction(i);
          i++;
        }
      } else {
        i++;
      }
    }

    if (depth > 0) {
      this.errors.push({ line: this.parses[beginIndex]?.line ?? 0, error: 'Begin block missing End' });
    }

    return i;
  }

  private skipBeginBlock(beginIndex: number): number {
    let i = beginIndex + 1;
    let depth = 1;

    while (i < this.parses.length && depth > 0) {
      const exp = this.parses[i]?.exp;
      if (exp === 'Begin') depth++;
      if (exp === 'End') depth--;
      i++;
    }

    return i;
  }

  private executeSingleInstruction(index: number) {
    const parse = this.parses[index];
    if (!parse) return;

    const exp = parse.exp;
    const line = parse.line;

    if (exp.startsWith('FRG_Print')) {
      this.executePrint(exp, line);
    } else if (exp.includes(':=')) {
      this.executeAffectation(exp, line);
    }
  }

  private executeDeclaration(exp: string, line: number) {
    const isInt = exp.startsWith('FRG_Int');
    const type = isInt ? 'FRG_Int' : 'FRG_Real';

    const varPart = exp
      .replace(isInt ? 'FRG_Int' : 'FRG_Real', '')
      .replace('#', '')
      .trim();

    const vars = varPart
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v !== '');

    for (const varName of vars) {
      if (this.symbols[varName]) {
        this.errors.push({ line, error: `Variable '${varName}' already declared` });
      } else {
        this.symbols[varName] = {
          type,
          init: false,
          value: NaN,
        };
      }
    }
  }

  private executeAffectation(exp: string, line: number) {
    exp = exp.replace('#', '').trim();
    const [left, right] = exp.split(':=').map((part) => part.trim());

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
    } else {
      this.symbols[left].value = value;
    }

    this.symbols[left].init = true;
  }

  private executePrint(exp: string, line: number) {
    exp = exp.replace('FRG_Print', '').replace('#', '').trim();

    if (exp.startsWith('"') && exp.endsWith('"')) {
      const str = exp.substring(1, exp.length - 1);
      this.output.push(str);
      return;
    }

    const vars = exp.split(',').map((v) => v.trim());
    const results: string[] = [];

    for (const varName of vars) {
      if (varName && this.symbols[varName]) {
        if (!this.symbols[varName].init) {
          this.errors.push({ line, error: `Variable '${varName}' used before initialization` });
          results.push('undefined');
        } else {
          results.push(String(this.symbols[varName].value));
        }
      } else if (varName) {
        this.errors.push({ line, error: `Variable '${varName}' not declared` });
        results.push('undefined');
      }
    }

    this.output.push(results.join(', '));
  }

  private extractCondition(exp: string): string {
    const start = exp.indexOf('[');
    const end = exp.indexOf(']');
    if (start === -1 || end === -1) return '';
    return exp.substring(start + 1, end).trim();
  }

private evaluateCondition(condition: string, line: number): boolean {
  const operators = ['<=', '>=', '<', '>', '='];
  let operator = '';
  let parts: string[] = [];

  for (const op of operators) {
    if (condition.includes(op)) {
      operator = op;
      parts = condition.split(op).map((p) => p.trim());
      break;
    }
  }

  if (!operator || parts.length !== 2) {
    this.errors.push({ line, error: `Invalid condition: ${condition}` });
    return false;
  }

  const left = this.evaluateExpression(parts[0] ?? '', line);
  const right = this.evaluateExpression(parts[1] ?? '', line);

  switch (operator) {
    case '<=':
      return left <= right;
    case '>=':
      return left >= right;
    case '<':
      return left < right;
    case '>':
      return left > right;
    case '=':
      return Math.abs(left - right) < 0.0001;
    default:
      return false;
  }
}

  private evaluateExpression(expr: string, line: number): number {
    expr = expr.trim();

    if (this.isNumericString(expr)) {
      return parseFloat(expr);
    }

    if (this.symbols[expr]) {
      if (!this.symbols[expr]?.init) {
        this.errors.push({ line, error: `Variable '${expr}' used before initialization` });
        return 0;
      }
      return this.symbols[expr]?.value || 0;
    }

    return this.evaluateArithmetic(expr, line);
  }

  private isNumericString(s: string): boolean {
    if (!s || s.length === 0) return false;
    let i = 0;
    if (s[0] === '+' || s[0] === '-') {
      if (s.length === 1) return false;
      i = 1;
    }
    let dotSeen = false;
    let digitSeen = false;
    for (; i < s.length; i++) {
      const ch = s[i] ?? 0;
      if (ch >= '0' && ch <= '9') {
        digitSeen = true;
        continue;
      }
      if (ch === '.') {
        if (dotSeen) return false;
        dotSeen = true;
        continue;
      }
      return false;
    }
    return digitSeen;
  }

  private evaluateArithmetic(expr: string, line: number): number {
    let processedExpr = expr;

    const varNames = Object.keys(this.symbols).sort((a, b) => b.length - a.length);

    for (const varName of varNames) {
      // CHECK: Skip uninitialized variables and report error
      if (!this.symbols[varName]?.init) {
        // Check if this variable is actually used in the expression
        const regex = new RegExp(`\\b${varName}\\b`);
        if (regex.test(processedExpr)) {
          this.errors.push({ line, error: `Variable '${varName}' used before initialization` });
          // Replace with 0 to allow expression to continue
          let position = processedExpr.search(regex);
          while (position !== -1) {
            const before = position === 0 ? '' : processedExpr[position - 1] ?? '';
            const after = position + varName.length >= processedExpr.length ? '' : processedExpr[position + varName.length] ?? '';
            const isWholeWord = !this.isAlphaNumeric(before) && !this.isAlphaNumeric(after);

            if (isWholeWord) {
              processedExpr = processedExpr.substring(0, position) + '0' + processedExpr.substring(position + varName.length);
            }
            position = processedExpr.search(regex);
            if (position <= 0) break; // Prevent infinite loop
          }
        }
        continue;
      }

      let position = processedExpr.indexOf(varName);
      while (position !== -1) {
        const before = position === 0 ? '' : processedExpr[position - 1] ?? '';
        const after = position + varName.length >= processedExpr.length ? '' : processedExpr[position + varName.length] ?? '';
        const isWholeWord = !this.isAlphaNumeric(before) && !this.isAlphaNumeric(after);

        if (isWholeWord) {
          const value = String(this.symbols[varName].value);
          processedExpr = processedExpr.substring(0, position) + value + processedExpr.substring(position + varName.length);
          position = processedExpr.indexOf(varName, position + value.length);
        } else {
          position = processedExpr.indexOf(varName, position + 1);
        }
      }
    }

    processedExpr = processedExpr.split(' ').join('');

    for (let i = 0; i < processedExpr.length; i++) {
      const char = processedExpr[i] ?? '';
      if (!this.isValidExprChar(char)) {
        this.errors.push({ line, error: `Invalid character '${char}' in expression` });
        return 0;
      }
    }

    try {
      return this.calculateExpression(processedExpr);
    } catch (error) {
      if (error instanceof Error && error.message === 'Division by zero is impossible') {
        this.errors.push({ line, error: 'Division by zero is impossible' });
      } else {
        this.errors.push({ line, error: `Invalid expression: ${expr}` });
      }
      return 0;
    }
  }

  private calculateExpression(expr: string): number {
    let tokens = this.tokenize(expr);
    return this.parseExpression(tokens);
  }

  private tokenize(expr: string): string[] {
    const tokens: string[] = [];
    let i = 0;

    while (i < expr.length) {
      const char = expr[i] ?? '';

      if (char === ' ' || char === '\t') {
        i++;
        continue;
      }

      if (this.isDigit(char) || char === '.') {
        let num = '';
        while (i < expr.length && (this.isDigit(expr[i] ?? '') || expr[i] === '.')) {
          num += expr[i];
          i++;
        }
        tokens.push(num);
      } else if (char === '+' || char === '-' || char === '*' || char === '/' || char === '(' || char === ')') {
        tokens.push(char);
        i++;
      } else {
        i++;
      }
    }

    return tokens;
  }

  private parseExpression(tokens: string[]): number {
    let left = this.parseTerm(tokens);

    while (tokens.length > 0 && (tokens[0] === '+' || tokens[0] === '-')) {
      const op = tokens.shift();
      const right = this.parseTerm(tokens);

      if (op === '+') {
        left += right;
      } else {
        left -= right;
      }
    }

    return left;
  }

  private parseTerm(tokens: string[]): number {
    let left = this.parseFactor(tokens);

    while (tokens.length > 0 && (tokens[0] === '*' || tokens[0] === '/')) {
      const op = tokens.shift();
      const right = this.parseFactor(tokens);

      if (op === '*') {
        left *= right;
      } else {
        if (right === 0) {
          throw new Error('Division by zero is impossible');
        }
        left /= right;
      }
    }

    return left;
  }

  private parseFactor(tokens: string[]): number {
    if (tokens.length === 0) {
      throw new Error('Unexpected end of expression');
    }

    const token = tokens.shift();

    if (token === '(') {
      const result = this.parseExpression(tokens);
      if (tokens.length === 0 || tokens.shift() !== ')') {
        throw new Error('Missing closing parenthesis');
      }
      return result;
    }

    if (token === '-') {
      return -this.parseFactor(tokens);
    }

    if (token && !isNaN(parseFloat(token))) {
      return parseFloat(token);
    }

    throw new Error(`Invalid token: ${token}`);
  }

  private isAlphaNumeric(char: string): boolean {
    if (!char) return false;
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || (char >= '0' && char <= '9') || char === '_';
  }

  private isValidExprChar(char: string): boolean {
    const validChars = '0123456789+-*/().';
    return validChars.includes(char);
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  public getSymbolTable(): string {
    return Object.entries(this.symbols)
      .map(([varName, info]: [string, VarType]) => `<p>${varName}: type: ${info.type}, init: ${info.init}, value: ${info.value}</p>`)
      .join('');
  }

  public getOutput(): string {
    return this.output.join('\n');
  }

  public getErrors(): string {
    this.errors.sort((a, b) => a.line - b.line);
    return this.errors.map((err) => `Line ${err.line}: ${err.error}`).join('\n');
  }

  public hasErrors(): boolean {
    return this.errors.length > 0;
  }
}
