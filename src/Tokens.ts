enum TokenType {
  START = 'START', // FRG_Begin
  FINISH = 'FINISH', // FRG_End
  STARTBLOCK = 'STARTBLOCK', // Begin
  FINISHBLOCK = 'FINISHBLOCK', // End
  STARTCOND = 'STARTCOND', // [
  FINISHCOND = 'FINISHCOND', // ] 
  ENDINST = 'ENDINST', // #
  REPEAT = 'REPEAT',
  UNTIL = "UNTIL",

  ID = 'ID', // x, x_, abc123, abc_123
  IF = 'IF', // If
  ELSE = 'ELSE', // Else 

  INTNUMBER = 'INTNUMBER', // 5
  REELNUMBER = 'REELNUMBER', // 5.3
  STRING = 'STRING', // "Hello :)"
  INT = 'INT', // FRG_Int
  REEL = 'REEL', // FRG_Real

  COMM = 'COMM', // ,
  EQUAL = 'EQUAL', // :=
  LESSTHEN = 'LESSTHEN', // < 
  LESSEQ = 'LESSEQ', // <=
  GREATERTHEN = 'GREATERTHEN', // >
  GREATEREQ = 'GREATEREQ', // >=
  PLUS = 'PLUS', // +
  MINUS = 'MINUS', // -
  MULTIPLE = 'MULTIPLE', // *
  DIVISION = 'DIVISION', // /

  FINISHLINE = "FINISHLINE", // \n
  ENDFILE = "ENDFILE", // EOF

  ERROR = "ERROR"
}


export const TokenDesc: { [key: string]: string } = {
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


interface Token {
  type: TokenType;
  value: string;
  errorMsg?: string,
}

interface Parse {
  exp: string,
  desc: string
}


export { type Token, TokenType, type Parse };
