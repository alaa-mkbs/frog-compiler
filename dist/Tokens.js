var TokenType;
(function (TokenType) {
    TokenType["START"] = "START";
    TokenType["FINISH"] = "FINISH";
    TokenType["STARTBLOCK"] = "STARTBLOCK";
    TokenType["FINISHBLOCK"] = "FINISHBLOCK";
    TokenType["STARTCOND"] = "STARTCOND";
    TokenType["FINISHCOND"] = "FINISHCOND";
    TokenType["ENDINST"] = "ENDINST";
    TokenType["REPEAT"] = "REPEAT";
    TokenType["UNTIL"] = "UNTIL";
    TokenType["ID"] = "ID";
    TokenType["IF"] = "IF";
    TokenType["ELSE"] = "ELSE";
    TokenType["INTNUMBER"] = "INTNUMBER";
    TokenType["REELNUMBER"] = "REELNUMBER";
    TokenType["STRING"] = "STRING";
    TokenType["INT"] = "INT";
    TokenType["REEL"] = "REEL";
    TokenType["PRINT"] = "PRINT";
    TokenType["QUOT"] = "QUOT";
    TokenType["COMM"] = "COMM";
    TokenType["EQUAL"] = "EQUAL";
    TokenType["ASSIGN"] = "ASSIGN";
    TokenType["LESSTHEN"] = "LESSTHEN";
    TokenType["LESSEQ"] = "LESSEQ";
    TokenType["GREATERTHEN"] = "GREATERTHEN";
    TokenType["GREATEREQ"] = "GREATEREQ";
    TokenType["PLUS"] = "PLUS";
    TokenType["MINUS"] = "MINUS";
    TokenType["MULTIPLE"] = "MULTIPLE";
    TokenType["DIVISION"] = "DIVISION";
    TokenType["FINISHLINE"] = "FINISHLINE";
    TokenType["ENDFILE"] = "ENDFILE";
    TokenType["ERROR"] = "ERROR";
})(TokenType || (TokenType = {}));
export const TokenDesc = {
    [TokenType.START]: 'keyword for program start',
    [TokenType.FINISH]: 'keyword for program end',
    [TokenType.STARTBLOCK]: 'keyword for block start',
    [TokenType.FINISHBLOCK]: 'keyword for block end',
    [TokenType.STARTCOND]: 'condition start symbol',
    [TokenType.FINISHCOND]: 'condition end symbol',
    [TokenType.ENDINST]: 'end of instruction symbol',
    [TokenType.REPEAT]: 'keyword for loop start',
    [TokenType.UNTIL]: 'keyword for loop condition',
    [TokenType.ID]: 'identifier',
    [TokenType.IF]: 'conditional keyword',
    [TokenType.ELSE]: 'alternative branch keyword',
    [TokenType.INTNUMBER]: 'integer literal',
    [TokenType.REELNUMBER]: 'real number literal',
    [TokenType.STRING]: 'string literal',
    [TokenType.INT]: 'keyword for integer type declaration',
    [TokenType.REEL]: 'keyword for real type declaration',
    [TokenType.PRINT]: 'keyword for print',
    [TokenType.COMM]: 'comma separator',
    [TokenType.EQUAL]: 'assignment operator',
    [TokenType.LESSTHEN]: 'comparison operator',
    [TokenType.LESSEQ]: 'comparison operator',
    [TokenType.GREATERTHEN]: 'comparison operator',
    [TokenType.GREATEREQ]: 'comparison operator',
    [TokenType.PLUS]: 'addition operator',
    [TokenType.MINUS]: 'subtraction operator',
    [TokenType.MULTIPLE]: 'multiplication operator',
    [TokenType.DIVISION]: 'division operator',
    [TokenType.FINISHLINE]: 'end of line',
    [TokenType.ENDFILE]: 'end of file',
    [TokenType.ERROR]: 'invalid'
};
export { TokenType };
