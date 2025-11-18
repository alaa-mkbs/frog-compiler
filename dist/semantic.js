export default class Semantic {
    constructor(parses) {
        this.symbols = {};
        this.parses = parses;
        this.symbols = {};
        this.readParsers();
    }
    readParsers() {
        var _a;
        let i = 0;
        let stack = [];
        while (i < this.parses.length) {
            const exp = (_a = this.parses[i]) === null || _a === void 0 ? void 0 : _a.exp;
            if (exp === null || exp === void 0 ? void 0 : exp.includes(':=')) {
                this.executeAffectation(exp);
            }
            i++;
        }
    }
    executeAffectation(exp) {
        const [left, right] = exp.split(':=').map((c) => c.replace('#', ''));
        const value = this.executeExpression(right !== null && right !== void 0 ? right : '');
        if (left)
            this.symbols[left] = value.toString();
        console.log(this.symbols[left]);
    }
    executeExpression(right) {
        Object.keys(this.symbols).forEach((v) => {
            if (this.symbols[v])
                right = right.replaceAll(v, this.symbols[v]);
        });
        try {
            return eval(right);
        }
        catch (_a) {
            throw new Error("error");
        }
    }
}
