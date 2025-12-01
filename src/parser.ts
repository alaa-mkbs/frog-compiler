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
  let lastSignificantParse: Parse | null = null; // Track last meaningful parse
  
  while (!this.isMyType(TokenType.ENDFILE)) {
    parse = this.parseLine();
    
    // Check block structure
    if (parse.exp === 'Begin') {
      blockStack.push({ type: 'Begin', line: parse.line });
    } else if (parse.exp === 'End') {
      if (blockStack.length === 0 || blockStack[blockStack.length - 1]?.type !== 'Begin') {
        parse.error = true;
        parse.desc = 'End without matching Begin';
      } else {
        blockStack.pop();
      }
    } else if (parse.exp === 'Else') {
      // Check if we're in an If context
      let inIfContext = false;
      
      // Look backwards through parses to find if we're after an If statement
      for (let i = parses.length - 1; i >= 0; i--) {
        const prev = parses[i];
        if (!prev) continue;
        
        // Found an If statement
        if (prev.exp.startsWith('If[')) {
          inIfContext = true;
          break;
        }
        
        // Found End - check if it closes an If block
        if (prev.exp === 'End') {
          // Keep looking for the Begin that this End closes
          let depth = 1;
          for (let j = i - 1; j >= 0; j--) {
            const check = parses[j];
            if (!check) continue;
            if (check.exp === 'End') depth++;
            if (check.exp === 'Begin') {
              depth--;
              if (depth === 0) {
                // Found matching Begin, now check if If is right before it
                if (j > 0 && parses[j - 1]?.exp.startsWith('If[')) {
                  inIfContext = true;
                  break;
                }
              }
            }
          }
          if (inIfContext) break;
        }
        
        // If we hit FRG_Begin, Repeat, or another control structure, stop
        if (prev.exp === 'FRG_Begin' || prev.exp === 'Repeat' || prev.exp === 'FRG_End') {
          break;
        }
      }
      
      if (!inIfContext) {
        parse.error = true;
        parse.desc = 'Else without matching If';
      }
    } else if (parse.exp === 'Repeat') {
      blockStack.push({ type: 'Repeat', line: parse.line });
    } else if (parse.exp.toLowerCase().startsWith('until')) {
      if (blockStack.length === 0 || blockStack[blockStack.length - 1]?.type !== 'Repeat') {
        parse.error = true;
        parse.desc = 'Until without matching Repeat';
      } else {
        blockStack.pop();
      }
    }
    
    console.log(parse);
    parses.push(parse);
  }
  
  // Check for unclosed blocks
  for (const unclosed of blockStack) {
    if (unclosed.type === 'Begin') {
      parses.push({
        exp: '',
        desc: `Unclosed Begin block at line ${unclosed.line}`,
        error: true,
        line: unclosed.line
      });
    } else if (unclosed.type === 'Repeat') {
      parses.push({
        exp: '',
        desc: `Repeat without matching Until at line ${unclosed.line}`,
        error: true,
        line: unclosed.line
      });
    }
  }
  
  console.log(parses);
  return parses;
}

  private parseLine(): Parse {
    // skip \n
    while (this.isMyType(TokenType.FINISHLINE)) {
      this.nextToken();
      // return this.parseLine();
    }

    if (this.isMyType(TokenType.ENDFILE)) return { exp: '', desc: 'EOF', error: false, line: this.getCurrentToken().line };

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
        return { exp: 'Else', desc: 'Else condition', error: false, line: this.getCurrentToken().line };
      case TokenType.STARTBLOCK:
        this.nextToken();
        return { exp: 'Begin', desc: 'Start block', error: false, line: this.getCurrentToken().line };
      case TokenType.FINISHBLOCK:
        this.nextToken();
        return { exp: 'End', desc: 'End block', error: false, line: this.getCurrentToken().line };
      case TokenType.START:
        this.nextToken();
        return { exp: 'FRG_Begin', desc: 'Start programme', error: false, line: this.getCurrentToken().line };
      case TokenType.FINISH:
        this.nextToken();
        return { exp: 'FRG_End', desc: 'End programme', error: false, line: this.getCurrentToken().line };
      case TokenType.REPEAT:
        this.nextToken();
        return { exp: 'Repeat', desc: 'Start Do WHile loop', error: false, line: this.getCurrentToken().line };
      case TokenType.UNTIL:
        return this.parseWhileLoop();
      default:
        const currentToken = this.getCurrentToken();
        this.nextToken();
        console.log('here');
        console.log(currentToken);
        console.log(this.getCurrentToken());
        if (currentToken.type === TokenType.ERROR) {
          return {
            exp: currentToken.value,
            desc: 'Invalid token',
            error: true,
            line: currentToken.line + 1,
          };
        }

        return {
          exp: currentToken.value,
          desc: 'Unexpected in this context',
          error: true,
          line: currentToken.line + 1,
        };
    }
  }

  private parseDeclaration() {
    const typeToken = this.getCurrentToken();
    let exp = typeToken.value + ' ';
    this.nextToken();

    if (!this.isMyType(TokenType.ID)) {
      return { exp: exp, desc: 'Expected identifier after type', error: true, line: this.getCurrentToken().line };
    }

    while (this.isMyType(TokenType.ID)) {
      exp += this.getCurrentToken().value;
      this.nextToken();
      if (this.isMyType(TokenType.COMM)) {
        exp += this.getCurrentToken().value + ' ';
        this.nextToken();
        if (!this.isMyType(TokenType.ID)) {
          return { exp: exp, desc: 'Expected identifier after comma', error: true, line: this.getCurrentToken().line };
        }
      } else {
        break;
      }
    }

    if (this.isMyType(TokenType.ENDINST)) {
      exp += ' ' + this.getCurrentToken().value;
    } else {
      return { exp: exp, desc: 'Expected "#" at end of declaration', error: true, line: this.getCurrentToken().line };
    }
    this.nextToken();

    return {
      exp: exp,
      desc: typeToken.type === TokenType.INT ? 'Integer declaration' : 'Real declaration',
      error: false,
      line: this.getCurrentToken().line,
    };
  }

  private parseAffectation() {
    let lExp = this.getCurrentToken().value;
    this.nextToken();

    if (!this.isMyType(TokenType.ASSIGN)) {
      return { exp: lExp, desc: 'Expected assign after id', error: true, line: this.getCurrentToken().line };
    }
    this.nextToken();

    let rExp = this.parseExpression();
    if (rExp === null) return { exp: lExp, desc: 'syntax error', error: true, line: this.getCurrentToken().line };

    if (this.getCurrentToken().type !== TokenType.ENDINST)
      return { exp: lExp + ':=' + rExp, desc: 'Expected "#" at end of affectation', error: true, line: this.getCurrentToken().line };

    this.nextToken();
    return {
      exp: lExp + ':=' + rExp + '#',
      desc: 'Assign value',
      error: false,
      line: this.getCurrentToken().line,
    };
  }

  private parseFactor() {
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

    if (!this.isOperator(this.getCurrentToken().type)) {
      return left;
    }

    while (this.isOperator(this.getCurrentToken().type)) {
      const op = this.parseOperator();
      const right = this.parseFactor();
      if (left) left = left + op + right;
    }

    return left;
  }

private parseIfCondition() {
  let exp = this.getCurrentToken().value;
  this.nextToken();

  if (!this.isMyType(TokenType.STARTCOND)) {
    return { exp: exp, desc: 'Expected [ after if', error: true, line: this.getCurrentToken().line };
  }
  
  exp += this.getCurrentToken().value;
  this.nextToken();

  // Parse left side (ID or NUMBER)
  let left = this.parseFactor();
  if (!left) {
    return { exp: exp, desc: 'Expected identifier or number in condition', error: true, line: this.getCurrentToken().line };
  }
  exp += left;

  // Must have comparison operator
  const comparisonOps = [TokenType.LESSTHEN, TokenType.GREATERTHEN, TokenType.LESSEQ, TokenType.GREATEREQ];
  if (!comparisonOps.includes(this.getCurrentToken().type)) {
    return { exp: exp, desc: 'Expected comparison operator (<, >, <=, >=)', error: true, line: this.getCurrentToken().line };
  }
  
  exp += this.getCurrentToken().value;
  this.nextToken();

  // Parse right side (ID or NUMBER)
  let right = this.parseFactor();
  if (!right) {
    return { exp: exp, desc: 'Expected identifier or number after operator', error: true, line: this.getCurrentToken().line };
  }
  exp += right;

  if (!this.isMyType(TokenType.FINISHCOND)) {
    return { exp: exp, desc: 'Expected ] after if condition', error: true, line: this.getCurrentToken().line };
  }
  
  exp += this.getCurrentToken().value;
  this.nextToken();

  return {
    exp: exp,
    desc: 'If condition',
    error: false,
    line: this.getCurrentToken().line,
  };
}

private parseWhileLoop() {
  let exp = this.getCurrentToken().value;
  this.nextToken();

  if (!this.isMyType(TokenType.STARTCOND)) {
    return { exp: exp, desc: 'Expected [ after until', error: true, line: this.getCurrentToken().line };
  }
  
  exp += this.getCurrentToken().value;
  this.nextToken();

  // Parse left side (ID or NUMBER)
  let left = this.parseFactor();
  if (!left) {
    return { exp: exp, desc: 'Expected identifier or number in until condition', error: true, line: this.getCurrentToken().line };
  }
  exp += left;

  // Must have comparison operator
  const comparisonOps = [TokenType.LESSTHEN, TokenType.GREATERTHEN, TokenType.LESSEQ, TokenType.GREATEREQ];
  if (!comparisonOps.includes(this.getCurrentToken().type)) {
    return { exp: exp, desc: 'Expected comparison operator (<, >, <=, >=) in until condition', error: true, line: this.getCurrentToken().line };
  }
  
  exp += this.getCurrentToken().value;
  this.nextToken();

  // Parse right side (ID or NUMBER)
  let right = this.parseFactor();
  if (!right) {
    return { exp: exp, desc: 'Expected identifier or number after operator', error: true, line: this.getCurrentToken().line };
  }
  exp += right;

  if (!this.isMyType(TokenType.FINISHCOND)) {
    return { exp: exp, desc: 'Expected ] after until condition', error: true, line: this.getCurrentToken().line };
  }
  
  exp += this.getCurrentToken().value;
  this.nextToken();

  return {
    exp: exp,
    desc: 'Until condition',
    error: false,
    line: this.getCurrentToken().line,
  };
}

  private parsePrint() {
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
            return { exp, desc: 'Expected identifier after comma', error: true, line: this.getCurrentToken().line };
          }
        } else {
          break;
        }

        if (this.isMyType(TokenType.ENDFILE)) {
          return { exp, desc: 'Unexpected end of input', error: true, line: this.getCurrentToken().line };
        }
      }
    } else {
      return { exp, desc: 'Expected string or identifier after FRG_Print', error: true, line: this.getCurrentToken().line };
    }

    if (this.isMyType(TokenType.ENDINST)) {
      exp += ' ' + this.getCurrentToken().value;
      this.nextToken();
    } else {
      return { exp, desc: 'Expected "#" at end of print', error: true, line: this.getCurrentToken().line };
    }

    return {
      exp,
      desc: typeToken === 'string' ? 'Print a string' : 'Print value of variable',
      error: false,
      line: this.getCurrentToken().line,
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
