import type { Parse } from './Tokens.js';

export default class Semantic {
  private symbols: Record<string, string> = {};
  private parses: Parse[];

  constructor(parses: Parse[]) {
    this.parses = parses;
    this.symbols = {};
    this.readParsers();
  }

  readParsers() {
    let i = 0;
    let stack = [];

    while (i < this.parses.length) {
      const exp = this.parses[i]?.exp;

      if (exp?.includes(':=')) {
        this.executeAffectation(exp);
      }
      i++;
    }
  }

  executeAffectation(exp: string) {
    const [left, right] = exp.split(':=').map((c) => c.replace('#', ''));

    const value = this.executeExpression(right ?? '');

    if(left)
    this.symbols[left] = value.toString();

    console.log(this.symbols[left] )
  }

  executeExpression(right: string): number {
    Object.keys(this.symbols).forEach((v: string) => {
      if (this.symbols[v]) right = right.replaceAll(v, this.symbols[v]);
    });
    try {
      return eval(right);
    } catch {
      throw new Error("error");
    }

  }
}
