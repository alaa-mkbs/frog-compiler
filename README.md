# 🐸 Frog Mini Compiler

A simple compiler built from scratch for the "Frog" programming language. This project implements the three main phases of compilation: lexical analysis, syntax analysis, and semantic analysis with code execution.

## 📋 Table of Contents
- [Overview](#overview)
- [Language Syntax](#language-syntax)
- [Compilation Phases](#compilation-phases)
- [Implementation Details](#implementation-details)
- [How to Use](#how-to-use)

## 🎯 Overview

This is a mini compiler for a simple programming language called "Frog". The compiler takes `.frog` files as input and processes them through three phases to execute the code and display results. It supports variable declarations, assignments, conditional statements, loops, and print operations.

## 📝 Language Syntax

### Keywords
- `FRG_Begin` / `FRG_End` - Program boundaries
- `FRG_Int` / `FRG_Real` - Variable type declarations
- `FRG_Print` - Output statement
- `Begin` / `End` - Block delimiters
- `If` / `Else` - Conditional statements
- `Repeat` / `until` - Do-while loop

### Operators
- Arithmetic: `+`, `-`, `*`, `/`
- Comparison: `<`, `>`, `<=`, `>=`, `==`
- Assignment: `:=`

### Special Symbols
- `#` - End of instruction
- `[` `]` - Condition brackets
- `,` - Variable separator
- `##` - Comments

### Example Program
```frog
FRG_Begin
FRG_Int i, j #
i := 10 #
If [i < 20]
    FRG_Print "Small number" #
Else
    FRG_Print "Big number" #
FRG_End
```

## 🔧 Compilation Phases

### 1. Lexical Analysis (Lexer)
Breaks down the source code into tokens - the smallest meaningful units like keywords, identifiers, numbers, and operators.

### 2. Syntax Analysis (Parser)
Checks if the tokens follow the correct grammar rules and builds a parse tree representing the program structure.

### 3. Semantic Analysis (Semantic Analyzer)
Validates the meaning of the program (type checking, variable declarations) and executes the code to produce output.

## 💻 Implementation Details

### Phase 1: Lexical Analysis - `Lexer.ts`

The Lexer class is responsible for scanning the source code character by character and converting it into tokens.

#### Key Methods:

**`nextChar()`**
- Moves the pointer to the next character in the source code
- Updates `currentChar` with the new character or `\0` if end of file

**`skipWhiteSpace()`**
- Skips over spaces, tabs, and carriage returns
- Returns `true` if any whitespace was skipped
- This keeps tokens clean without unnecessary spaces

**`skipComment()`**
- Detects comments that start with `##`
- Skips all characters until the end of line
- Returns `true` if a comment was found and skipped

**`getNumber()`**
- Reads consecutive digits to form a number
- Handles decimal points for real numbers (like 3.14)
- Checks if the character after `.` is a digit before treating it as decimal
- Returns either `INTNUMBER` or `REELNUMBER` token

**`getString()`**
- Starts when a `"` is encountered
- Reads all characters until the closing `"`
- Returns an `ERROR` token if the string is not properly closed
- This handles string literals like `"Hello World"`

**`getKeyword()`**
- Reads alphabetic characters, digits, and underscores
- Builds up an identifier or keyword
- Checks against a keyword map to determine the token type
- If not a keyword, returns an `ID` token for variable names

**`createToken()`**
- Main tokenization logic
- First tries to skip whitespace and comments
- Then determines what type of token to create based on the current character:
  - Numbers → calls `getNumber()`
  - Letters → calls `getKeyword()`
  - Special two-character operators like `:=`, `<=`, `>=`
  - Single-character operators and symbols
  - String literals starting with `"`
- Returns error tokens for invalid characters

**`readFile()`**
- Main entry point for lexical analysis
- Repeatedly calls `createToken()` until reaching end of file
- Collects all tokens in an array
- Calls `setTokensDesc()` to format output for display

**How it works together:**
The Lexer maintains a position pointer (`p`) and current character. It processes the source code sequentially, identifying patterns that match different token types. For example, when it sees a digit, it knows to collect all following digits (and maybe a decimal point) to form a complete number token. The line number is tracked throughout to help with error reporting later.

---

### Phase 2: Syntax Analysis - `Parser.ts`

The Parser takes the token stream from the Lexer and checks if it follows the grammar rules of the Frog language. It builds a parse tree structure.

#### Key Methods:

**`nextToken()` and `getCurrentToken()`**
- Navigate through the token array
- `getCurrentToken()` returns the current token or an error token if we've gone past the end
- `nextToken()` advances to the next token

**`isMyType(type)`**
- Helper method to check if the current token matches a specific type
- Makes the code cleaner and more readable

**`parseInput()`**
- Main entry point for parsing
- Loops through all tokens until reaching `ENDFILE`
- Calls `parseLine()` for each statement
- Returns an array of parse results

**`parseLine()`**
- Skips newline tokens since they're not meaningful
- Acts as a dispatcher based on the current token type:
  - Type declarations (`FRG_Int`, `FRG_Real`) → `parseDeclaration()`
  - Print statements → `parsePrint()`
  - Identifiers → `parseAffectation()` (assignments)
  - If statements → `parseIfCondition()`
  - Block delimiters, loops, etc. → simple parse objects
- Returns error parse objects for unexpected tokens

**`parseDeclaration()`**
- Handles variable declarations like `FRG_Int x, y, z #`
- Expects: type keyword → identifier(s) → optional commas → `#`
- Builds the expression string as it validates
- Checks for commas followed by identifiers for multiple declarations
- Returns error if the pattern is not followed correctly

**`parseAffectation()`**
- Handles assignments like `x := 5 + 3 #`
- Expects: identifier → `:=` → expression → `#`
- Calls `parseExpression()` to handle the right-hand side
- Validates that the statement ends with `#`

**`parseExpression()` and `parseFactor()`**
- `parseFactor()` handles individual values (identifiers, integers, real numbers)
- `parseExpression()` handles operations between factors
- Builds expression strings like "x+5*2" by:
  - Getting the left factor
  - Checking for operators
  - Getting the right factor
  - Repeating for chained operations

**`parseIfCondition()`**
- Handles if statements like `If [x < 10]`
- Expects: `If` → `[` → condition expression → `]`
- Uses `parseExpression()` to validate the condition
- Returns error if brackets are missing or condition is invalid

**`parseWhileLoop()`**
- Handles until conditions for repeat loops: `until [i <= 5]`
- Similar structure to if conditions
- Collects everything between `[` and `]` as the condition

**`parsePrint()`**
- Handles print statements: `FRG_Print "text" #` or `FRG_Print x, y #`
- Can print either:
  - String literals in quotes
  - One or more variables separated by commas
- Validates proper ending with `#`

**`getParseResult()`**
- Formats the parse results for display
- Shows line numbers, expressions, and descriptions
- Highlights errors in red using CSS classes

**How it works together:**
The Parser is like a grammar checker. It moves through tokens and verifies that they appear in valid sequences. For example, when it sees `FRG_Int`, it expects to find at least one identifier, possibly followed by commas and more identifiers, and finally a `#`. If this pattern is violated, it reports an error with the line number. The parsing methods call each other recursively to handle nested structures like expressions within conditions.

---

### Phase 3: Semantic Analysis - `Semantic.ts`

The Semantic Analyzer validates the meaning of the program and executes it. This is where type checking, variable initialization tracking, and actual code execution happen.

#### Key Data Structures:

**`symbols`** - Symbol table storing:
- Variable name as key
- Type (`FRG_Int` or `FRG_Real`)
- Initialization status
- Current value

**`errors`** - Array of semantic errors found
**`output`** - Array of output strings from print statements

#### Key Methods:

**`analyze()`**
- Main entry point for semantic analysis
- Validates that the program starts with `FRG_Begin` and ends with `FRG_End`
- Calls `executeProgram()` to process the entire program

**`executeProgram()`**
- Main execution loop through all parsed statements
- Uses a while loop with index tracking to handle control flow
- Dispatches to specific execution methods based on statement type:
  - Declarations → `executeDeclaration()`
  - Assignments → `executeAffectation()`
  - Print → `executePrint()`
  - If → `executeIf()`
  - Repeat → `executeRepeat()`
  - Blocks → `executeBeginBlock()`
- Skips statements marked with errors from parsing phase

**`executeDeclaration()`**
- Processes variable declarations like `FRG_Int x, y #`
- Extracts variable names by removing keywords and `#`
- Splits on commas to handle multiple declarations
- Checks if variable is already declared (error if yes)
- Adds variables to symbol table with:
  - Correct type
  - `init: false` (not initialized yet)
  - Default value (0 for int, 0.0 for real)

**`executeAffectation()`**
- Handles assignments like `x := 10 + 5 #`
- Splits on `:=` to get left (variable) and right (expression)
- Checks if the variable was declared
- Calls `evaluateExpression()` to compute the right-hand side value
- Stores the computed value in the symbol table
- For integers, uses `Math.floor()` to ensure integer values
- Marks the variable as initialized

**`executePrint()`**
- Handles print statements for both strings and variables
- For string literals: extracts text between quotes and adds to output
- For variables:
  - Splits on commas for multiple variables
  - Checks each variable exists and is initialized
  - Adds error if variable not declared or not initialized
  - Joins variable values with commas for output

**`executeIf()`**
- Most complex execution method due to control flow
- Extracts and evaluates the condition using `evaluateCondition()`
- Handles both single-statement and block forms:
  - Single: `If [condition] statement`
  - Block: `If [condition] Begin ... End`
- If condition is true: executes the if-branch
- If condition is false: skips if-branch, executes else-branch if present
- Uses `executeBeginBlock()` for blocks or `executeSingleInstruction()` for single statements
- Uses `skipBeginBlock()` to skip over blocks when condition is false
- Returns the index where execution should continue

**`executeRepeat()`**
- Implements do-while loop execution
- First finds the matching `until` statement
- Executes loop body repeatedly until condition becomes true
- Loop body execution:
  - Processes all statements between `Repeat` and `until`
  - Handles nested structures (if statements, blocks, nested loops)
- After each iteration:
  - Evaluates the until condition
  - Breaks if condition is true
- Has max iteration limit (1000) to prevent infinite loops

**`executeBeginBlock()` and `skipBeginBlock()`**
- `executeBeginBlock()` executes all statements within a Begin/End block
- Uses depth counter to handle nested blocks correctly
- Processes statements until matching `End` is found
- `skipBeginBlock()` skips over a block without executing it
- Used when an if condition is false and we need to skip the block

**`executeSingleInstruction()`**
- Helper to execute a single statement (print or assignment)
- Used by if statements for single-line branches

**`evaluateExpression()`**
- Converts an expression string to a numeric value
- Handles three cases:
  1. Direct numbers: `"5"` → 5
  2. Variables: `"x"` → looks up value in symbol table
  3. Arithmetic expressions: `"x+5*2"` → calls `evaluateArithmetic()`
- Checks if variables are initialized before using them

**`evaluateArithmetic()`**
- Complex method that evaluates mathematical expressions
- First phase - Variable substitution:
  - Replaces all variable names with their values
  - Sorts variables by length (longest first) to avoid partial matches
  - Uses whole-word matching to prevent "i" matching in "width"
  - Checks initialization before substitution
- Second phase - Validation:
  - Removes spaces
  - Checks each character is valid (digits, operators, parentheses, decimal)
- Third phase - Calculation:
  - Calls `calculateExpression()` to compute the result

**`calculateExpression()`**
- Implements a recursive descent parser for arithmetic
- Respects operator precedence: parentheses > multiplication/division > addition/subtraction
- Three parsing functions:
  - `parseExpression()`: handles + and -
  - `parseTerm()`: handles * and /
  - `parseFactor()`: handles numbers, negative numbers, and parentheses
- Works by recursively parsing the expression string
- Moves an index through the expression as it parses

**`evaluateCondition()`**
- Evaluates comparison conditions like `x < 10` or `i <= 20`
- Extracts the operator from the condition string
- Splits into left and right sides
- Evaluates both sides as expressions
- Performs the comparison based on operator
- Uses small epsilon (0.0001) for equality checks with floating point

**`extractCondition()`**
- Helper to extract condition text from between `[` and `]`

**Helper Methods:**
- `isAlphaNumeric()`, `isValidExprChar()`, `isDigit()` - Character checking utilities
- `getSymbolTable()`, `getOutput()`, `getErrors()` - Getters for results
- `hasErrors()` - Check if any errors occurred

**How it works together:**
The Semantic Analyzer acts as both validator and interpreter. It maintains a symbol table to track all variables, their types, and values. As it processes each statement, it checks semantic rules (variables must be declared before use, must be initialized before reading) and simultaneously executes the code. The execution methods handle control flow by carefully managing indices into the parse array, allowing jumps for if statements and loops. Expression evaluation is done through careful parsing that respects operator precedence and handles variable substitution. All errors are collected and can be displayed to the user along with the program output.

---

### UI Integration - `main.ts`

The `Ui` class manages the web interface and coordinates all three compilation phases.

#### Key Methods:

**`FileUploadedHandler()`**
- Listens for file upload events
- Reads the file content using FileReader API
- Loads the content into the code textarea
- Automatically triggers lexical analysis

**`clearHandler()`**
- Resets all state variables and UI elements
- Clears the code editor, analysis results, and output
- Removes active styling from buttons

**`lexerHandler()`**
- Creates a Lexer instance with the current code
- Runs `readFile()` to tokenize the code
- Displays lexer results in the analysis panel
- Marks the lexical analyzer button as active

**`parserHandler()`**
- Creates a Parser instance with tokens from lexer
- Runs `parseInput()` to build parse tree
- Displays parser results
- Marks the syntax analyzer button as active

**`semanticsHandler()`**
- Checks if there are any lexer or parser errors first
- Creates a Semantic instance with parse results
- Runs `analyze()` to validate and execute
- Displays either errors or success message with output
- Marks the semantic analyzer button as active

**`btnsHandler()`**
- Sets up event listeners for all buttons:
  - Clear: resets everything
  - Compile: runs lexer, parser, semantic in sequence
  - Individual analyzer buttons: run specific phases

**How it works together:**
The UI class acts as the controller that orchestrates the compilation pipeline. When a user uploads a file or clicks compile, it runs the code through each phase in order, displaying results after each step. The three-button interface lets users see the intermediate results of each compilation phase, which is great for learning and debugging.

## 🚀 How to Use

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/frog-compiler.git
cd frog-compiler
```

2. **Open the application**
- Simply open `index.html` in a web browser
- Or use a local server for better experience

3. **Write or upload code**
- Type directly in the code editor, or
- Click "choose frog file" to upload a `.frog` file

4. **Analyze the code**
- Click "Lexical Analyser" to see tokens
- Click "Syntax Analyser" to see parse results
- Click "Semantic Analyser" to validate and execute
- Or click "Compile" to run all phases at once

5. **View results**
- Analysis results appear in the middle panel
- Program output appears in the bottom "result" section
- Errors are highlighted in red with line numbers

## 🛠️ Technologies Used

- **TypeScript** - For type-safe development
- **HTML/CSS** - For the web interface
- **Vanilla JavaScript** - No frameworks, pure implementation

## 📚 Learning Outcomes

Building this compiler taught me:
- How tokenization works in real compilers
- The importance of grammar rules and parsing
- How symbol tables track variable information
- How to implement control flow (if/else, loops)
- How to evaluate expressions with proper precedence
- The three-phase architecture of compilers

## 🐛 Known Limitations

- No function/procedure support
- Limited to integer and real number types
- No string operations beyond printing
- Simple error recovery (stops at first semantic error per line)
- No optimization phase

## 📄 License

This project is open source and available for educational purposes.

---

Made with 🐸 for learning compiler design