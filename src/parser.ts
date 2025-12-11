import { TokenType, type Token, type Parse } from './Tokens.js';

export default class Parser {
  private tokens: Token[];
  private currentTokenIndex: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private nextToken() {
    if (this.currentTokenIndex < this.tokens.length - 1) this.currentTokenIndex++;
  }

  private getCurrentToken(): Token {
    return (
      this.tokens[this.currentTokenIndex] ?? {
        type: TokenType.ERROR,
        value: '',
        errorMsg: 'Unexpected end of input',
        line: this.tokens[this.currentTokenIndex]?.line ?? 0,
      }
    );
  }

  private isMyType(type: TokenType): boolean {
    return this.tokens[this.currentTokenIndex]?.type === type;
  }

public parseInput() {
  let parses: Parse[] = [];
  let parse: Parse;
  let blockStack: { type: string; line: number }[] = [];
  let controlStack: { type: 'If' | 'Else' | 'Repeat'; line: number; needsInstruction: boolean }[] = [];

  while (!this.isMyType(TokenType.ENDFILE)) {
    parse = this.parseLine();

    if (parse.exp.startsWith('If[')) {
      controlStack.push({ type: 'If', line: parse.line, needsInstruction: true });
    } else if (parse.exp === 'Else') {
      let foundIf = false;
      for (let i = controlStack.length - 1; i >= 0; i--) {
        if (controlStack[i]?.type === 'If') {
          foundIf = true;
          controlStack.splice(i, 1);
          controlStack.push({ type: 'Else', line: parse.line, needsInstruction: true });
          break;
        }
      }

      if (!foundIf) {
        parse.error = true;
        parse.desc = 'Else without matching If';
      }
    } else if (parse.exp === 'Begin') {
      const lastControl = controlStack[controlStack.length - 1];

      if (lastControl && lastControl.needsInstruction) {
        lastControl.needsInstruction = false;
        blockStack.push({ type: 'Begin', line: parse.line });
      } else if (blockStack.some((b) => b.type === 'Repeat')) {
        blockStack.push({ type: 'Begin', line: parse.line });
      } else if (this.isOrphanContext(parses)) {
        parse.error = true;
        parse.desc = 'Unexpected Begin - not preceded by If, Else';
      } else {
        blockStack.push({ type: 'Begin', line: parse.line });
      }
    } else if (parse.exp === 'End') {
      if (blockStack.length === 0 || blockStack[blockStack.length - 1]?.type !== 'Begin') {
        parse.error = true;
        parse.desc = 'End without matching Begin';
      } else {
        blockStack.pop();
        // Check if this End closes an If/Else block
        if (controlStack.length > 0) {
          const lastControl = controlStack[controlStack.length - 1];
          // Only pop if it's an Else or if it's an If without an upcoming Else
          if (lastControl && !lastControl.needsInstruction) {
            if (lastControl.type === 'Else') {
              controlStack.pop();
            } else if (lastControl.type === 'If' && !this.isElseNext()) {
              controlStack.pop();
            }
          }
        }
      }
    } else if (parse.exp === 'Repeat') {
      blockStack.push({ type: 'Repeat', line: parse.line });
      controlStack.push({ type: 'Repeat', line: parse.line, needsInstruction: true });
    } else if (parse.exp.toLowerCase().startsWith('until')) {
      if (blockStack.length === 0 || blockStack[blockStack.length - 1]?.type !== 'Repeat') {
        parse.error = true;
        parse.desc = 'Until without matching Repeat';
      } else {
        blockStack.pop();
        for (let i = controlStack.length - 1; i >= 0; i--) {
          if (controlStack[i]?.type === 'Repeat') {
            controlStack.splice(i, 1);
            break;
          }
        }
      }
    } else if (parse.exp !== 'FRG_Begin' && parse.exp !== 'FRG_End' && parse.exp.trim() !== '' && !parse.error) {
      if (controlStack.length > 0) {
        const lastControl = controlStack[controlStack.length - 1];
        if (lastControl && lastControl.needsInstruction) {
          lastControl.needsInstruction = false;

          if (lastControl.type === 'If') {
            // Don't pop yet - wait to see if there's an Else
            // The pop will happen at End if no Else follows
          } else if (lastControl.type === 'Else') {
            controlStack.pop();
          }
        }
      }
    }

    parses.push(parse);
  }

  for (const unclosed of blockStack) {
    if (unclosed.type === 'Begin') {
      parses.push({
        exp: '',
        desc: `Unclosed Begin block at line ${unclosed.line}`,
        error: true,
        line: unclosed.line,
      });
    } else if (unclosed.type === 'Repeat') {
      parses.push({
        exp: '',
        desc: `Repeat without matching Until at line ${unclosed.line}`,
        error: true,
        line: unclosed.line,
      });
    }
  }

  return parses;
}

  private isOrphanContext(parses: Parse[]): boolean {
    if (parses.length === 0) return false;

    for (let i = parses.length - 1; i >= 0; i--) {
      const prev = parses[i];
      if (!prev) continue;

      if (i > 0 && parses[i - 1]?.exp.startsWith('If[')) {
        if (prev.exp.includes(':=') || prev.exp.startsWith('FRG_Print')) {
          return true;
        }
      }

      if (prev.exp === 'End') {
        let depth = 1;
        for (let j = i - 1; j >= 0 && depth > 0; j--) {
          const check = parses[j];
          if (!check) continue;
          if (check.exp === 'End') depth++;
          if (check.exp === 'Begin') {
            depth--;
            if (depth === 0) {
              if (j > 0) {
                const before = parses[j - 1];
                if (before?.exp.startsWith('If[') || before?.exp === 'Else') {
                  return true;
                }
              }
            }
          }
        }
      }

      if (prev.exp === 'FRG_Begin' || prev.exp === 'Repeat') {
        return false;
      }
    }

    return false;
  }

  private isElseNext(): boolean {
    let nextIndex = this.currentTokenIndex;
    while (nextIndex < this.tokens.length && this.tokens[nextIndex]?.type === TokenType.FINISHLINE) {
      nextIndex++;
    }
    return nextIndex < this.tokens.length && this.tokens[nextIndex]?.type === TokenType.ELSE;
  }

  private parseLine(): Parse {
    const currentLine = this.getCurrentToken().line;

    // skip \n
    while (this.isMyType(TokenType.FINISHLINE)) {
      this.nextToken();
    }

    if (this.isMyType(TokenType.ENDFILE)) return { exp: '', desc: 'EOF', error: false, line: currentLine };

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
        const elseLine = this.getCurrentToken().line;
        this.nextToken();
        return { exp: 'Else', desc: 'Else condition', error: false, line: elseLine };
      case TokenType.STARTBLOCK:
        const beginLine = this.getCurrentToken().line;
        this.nextToken();
        return { exp: 'Begin', desc: 'Start block', error: false, line: beginLine };
      case TokenType.FINISHBLOCK:
        const endLine = this.getCurrentToken().line;
        this.nextToken();
        return { exp: 'End', desc: 'End block', error: false, line: endLine };
      case TokenType.START:
        const startLine = this.getCurrentToken().line;
        this.nextToken();
        return { exp: 'FRG_Begin', desc: 'Start programme', error: false, line: startLine };
      case TokenType.FINISH:
        const finishLine = this.getCurrentToken().line;
        this.nextToken();
        return { exp: 'FRG_End', desc: 'End programme', error: false, line: finishLine };
      case TokenType.REPEAT:
        const repeatLine = this.getCurrentToken().line;
        this.nextToken();
        return { exp: 'Repeat', desc: 'Start Do While loop', error: false, line: repeatLine };
      case TokenType.UNTIL:
        return this.parseWhileLoop();
      default:
        const currentToken = this.getCurrentToken();
        this.nextToken();
        if (currentToken.type === TokenType.ERROR) {
          return {
            exp: currentToken.value,
            desc: 'Invalid token',
            error: true,
            line: currentToken.line,
          };
        }

        return {
          exp: currentToken.value,
          desc: 'Unexpected in this context',
          error: true,
          line: currentToken.line,
        };
    }
  }

private parseDeclaration() {
  const typeToken = this.getCurrentToken();
  const declLine = typeToken.line;
  let exp = typeToken.value + ' ';
  this.nextToken();

  const reservedKeywords = ['FRG_Begin', 'FRG_End', 'Begin', 'End', 'If', 'Else', 'FRG_Int', 'FRG_Real', 'FRG_Print', 'Repeat', 'until'];

  const currentToken = this.getCurrentToken();
  
  if (!this.isMyType(TokenType.ID)) {
    if (reservedKeywords.includes(currentToken.value)) {
      return {
        exp: exp + currentToken.value,
        desc: `Cannot use reserved keyword '${currentToken.value}' as variable name`,
        error: true,
        line: declLine,
      };
    }
    return { exp: exp, desc: 'Expected identifier after type', error: true, line: declLine };
  }

  while (this.isMyType(TokenType.ID)) {
    const varName = this.getCurrentToken().value;

    if (reservedKeywords.includes(varName)) {
      return {
        exp: exp + varName,
        desc: `Cannot use reserved keyword '${varName}' as variable name`,
        error: true,
        line: declLine,
      };
    }

    exp += varName;
    this.nextToken();

    if (this.isMyType(TokenType.COMM)) {
      exp += this.getCurrentToken().value + ' ';
      this.nextToken();

      const nextToken = this.getCurrentToken();
      
      if (!this.isMyType(TokenType.ID)) {
        if (reservedKeywords.includes(nextToken.value)) {
          return {
            exp: exp + nextToken.value,
            desc: `Cannot use reserved keyword '${nextToken.value}' as variable name`,
            error: true,
            line: declLine,
          };
        }
        return { exp: exp, desc: 'Expected identifier after comma', error: true, line: declLine };
      }
    } else {
      break;
    }
  }

  if (this.isMyType(TokenType.ENDINST)) {
    exp += ' ' + this.getCurrentToken().value;
    this.nextToken();
  } else {
    return { exp: exp, desc: 'Expected "#" at end of declaration', error: true, line: declLine };
  }

  return {
    exp: exp,
    desc: typeToken.type === TokenType.INT ? 'Integer declaration' : 'Real declaration',
    error: false,
    line: declLine,
  };
}

  private parseAffectation() {
    const affLine = this.getCurrentToken().line;
    let lExp = this.getCurrentToken().value;
    this.nextToken();

    if (!this.isMyType(TokenType.ASSIGN)) {
      return { exp: lExp, desc: 'Expected assign after id', error: true, line: affLine };
    }
    this.nextToken();

    let rExp = this.parseExpression();
    if (rExp === null) return { exp: lExp, desc: 'syntax error', error: true, line: affLine };

    if (this.getCurrentToken().type !== TokenType.ENDINST)
      return { exp: lExp + ':=' + rExp, desc: 'Expected "#" at end of affectation', error: true, line: affLine };

    this.nextToken();
    return {
      exp: lExp + ':=' + rExp + '#',
      desc: 'Assign value',
      error: false,
      line: affLine,
    };
  }

  private parseFactor(): string | null {
    const tok = this.getCurrentToken();

    if (this.isMyType(TokenType.MINUS)) {
      this.nextToken();
      const factor = this.parseFactor();
      if (factor === null) return null;
      return '-' + factor;
    }

    if (this.isMyType(TokenType.PLUS)) {
      this.nextToken();
      return this.parseFactor();
    }

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

  private isOperator(type: TokenType) {
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

  private parseOperator() {
    const tok = this.getCurrentToken();

    if (!this.isOperator(tok.type)) {
      return { exp: tok.value, desc: 'Expected operator', error: true, line: this.getCurrentToken().line };
    }

    this.nextToken();
    return tok.value;
  }

  private parseExpression() {
    let left = this.parseFactor();

    if (left === null) return null;

    if (!this.isOperator(this.getCurrentToken().type)) {
      return left;
    }

    while (this.isOperator(this.getCurrentToken().type)) {
      const op = this.parseOperator();
      if (typeof op === 'object' && op.error) return null;
      const right = this.parseFactor();
      if (right === null) return null;
      left = left + op + right;
    }

    return left;
  }

private parseIfCondition() {
  const ifLine = this.getCurrentToken().line;
  let exp = this.getCurrentToken().value;
  this.nextToken();

  if (!this.isMyType(TokenType.STARTCOND)) {
    return { exp: exp, desc: 'Expected [ after if', error: true, line: ifLine };
  }

  exp += this.getCurrentToken().value;
  this.nextToken();

  let left = this.parseFactor();
  if (!left) {
    return { exp: exp, desc: 'Expected identifier or number in condition', error: true, line: ifLine };
  }
  exp += left;

  const comparisonOps = [TokenType.LESSTHEN, TokenType.GREATERTHEN, TokenType.LESSEQ, TokenType.GREATEREQ, TokenType.EQUAL];
  if (!comparisonOps.includes(this.getCurrentToken().type)) {
    return { exp: exp, desc: 'Expected comparison operator (<, >, <=, >=, =)', error: true, line: ifLine };
  }

  exp += this.getCurrentToken().value;
  this.nextToken();

  let right = this.parseFactor();
  if (!right) {
    return { exp: exp, desc: 'Expected identifier or number after operator', error: true, line: ifLine };
  }
  exp += right;

  if (!this.isMyType(TokenType.FINISHCOND)) {
    return { exp: exp, desc: 'Expected ] after if condition', error: true, line: ifLine };
  }

  exp += this.getCurrentToken().value;
  this.nextToken();

  return {
    exp: exp,
    desc: 'If condition',
    error: false,
    line: ifLine,
  };
}

private parseWhileLoop() {
  const untilLine = this.getCurrentToken().line;
  let exp = this.getCurrentToken().value;
  this.nextToken();

  if (!this.isMyType(TokenType.STARTCOND)) {
    return { exp: exp, desc: 'Expected [ after until', error: true, line: untilLine };
  }

  exp += this.getCurrentToken().value;
  this.nextToken();

  let left = this.parseFactor();
  if (!left) {
    return { exp: exp, desc: 'Expected identifier or number in until condition', error: true, line: untilLine };
  }
  exp += left;

  const comparisonOps = [TokenType.LESSTHEN, TokenType.GREATERTHEN, TokenType.LESSEQ, TokenType.GREATEREQ, TokenType.EQUAL];
  if (!comparisonOps.includes(this.getCurrentToken().type)) {
    return { exp: exp, desc: 'Expected comparison operator (<, >, <=, >=, =) in until condition', error: true, line: untilLine };
  }

  exp += this.getCurrentToken().value;
  this.nextToken();

  let right = this.parseFactor();
  if (!right) {
    return { exp: exp, desc: 'Expected identifier or number after operator', error: true, line: untilLine };
  }
  exp += right;

  if (!this.isMyType(TokenType.FINISHCOND)) {
    return { exp: exp, desc: 'Expected ] after until condition', error: true, line: untilLine };
  }

  exp += this.getCurrentToken().value;
  this.nextToken();

  return {
    exp: exp,
    desc: 'Until condition',
    error: false,
    line: untilLine,
  };
}

  private parsePrint() {
    const printLine = this.getCurrentToken().line;
    let typeToken = 'string';
    let exp = this.getCurrentToken().value + ' ';
    this.nextToken();

    if (this.isMyType(TokenType.STRING)) {
      exp += this.getCurrentToken().value;
      this.nextToken();
    } else if (this.isMyType(TokenType.ID)) {
      typeToken = 'id';

      while (true) {
        exp += this.getCurrentToken().value;
        this.nextToken();

        if (this.isMyType(TokenType.COMM)) {
          exp += this.getCurrentToken().value + ' ';
          this.nextToken();

          if (!this.isMyType(TokenType.ID)) {
            return { exp, desc: 'Expected identifier after comma', error: true, line: printLine };
          }
        } else {
          break;
        }

        if (this.isMyType(TokenType.ENDFILE)) {
          return { exp, desc: 'Unexpected end of input', error: true, line: printLine };
        }
      }
    } else {
      return { exp, desc: 'Expected string or identifier after FRG_Print', error: true, line: printLine };
    }

    if (this.isMyType(TokenType.ENDINST)) {
      exp += ' ' + this.getCurrentToken().value;
      this.nextToken();
    } else {
      return { exp, desc: 'Expected "#" at end of print', error: true, line: printLine };
    }

    return {
      exp,
      desc: typeToken === 'string' ? 'Print a string' : 'Print value of variable',
      error: false,
      line: printLine,
    };
  }

  public getParseResult(parsers: Parse[]): string {
    let parseResult = '';
    parsers.forEach((par) => {
      if (par.desc === 'EOF') return;
      if (par.error) parseResult += `<p class="error"><span class="line-number">${par.line}:</span> ${par.exp}: ${par.desc}</p>`;
      else parseResult += `<p><span class="line-number">${par.line}:</span> ${par.exp}: ${par.desc}\n</p>`;
    });
    return parseResult;
  }
}
