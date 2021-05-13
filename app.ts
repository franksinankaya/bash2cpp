const fs = require('fs');
import { readFileSync } from 'fs';
import { assert } from 'console';
const file = readFileSync(process.argv[2], 'utf-8');
const babylon = require('babylon');

class ConvertBash {
    private builtindefs: any = ["echo", "cd", "printf"]
    private functiondefs: any = []
    private asyncs: any = []
    private redirects: any = []
    private pipelines: any = []
    private lines: any
    private currentrowstart: any
    private currentrowend: any

    public setLines(str: any) {
        this.lines = str
    }

    private escapeDoubleQuotes(str:any) {
        return str.replace(/\\([\s\S])|(")/g, "\\$1$2");
    }

    private terminate(command: any) {
        console.log('unknown command: ' + JSON.stringify(command));
        throw new Error();
    }

    private getIdentifier(expression:any, argument: any, asenv: any = true): string {
        let str = expression.substring(argument.start, argument.end);

        if (str[0] == "$") {
            str = str.substring(1)
        }
        let val = ""
        if (asenv)
            val = "get_env(\"" + str + "\").c_str()"
        else
            val = str
        return val
    }

    private convertArithmeticASTBinaryExpression(arithmeticAST: any, expression: any): string {
        let leftvalue
        if (arithmeticAST.left.type == "NumericLiteral") {
            leftvalue = arithmeticAST.left.value
        }
        else if (arithmeticAST.left.type == "Identifier") {
            leftvalue = this.getIdentifier(expression, arithmeticAST.left)
            leftvalue = "mystoiz(" + leftvalue + ")"
        }
        else {
            this.terminate(expression)
        }
        let rightvalue
        if (arithmeticAST.right.type == "NumericLiteral") {
            rightvalue = arithmeticAST.right.value
        }
        else if (arithmeticAST.right.type == "Identifier") {
            rightvalue = this.getIdentifier(expression, arithmeticAST.right)
            rightvalue = "mystoiz(" + rightvalue + ")"
        }
        else {
            this.terminate(expression)
        }
        switch (arithmeticAST.operator) {
            case "**":
                return leftvalue + " ^ " + rightvalue
            default:
                return leftvalue + " " + arithmeticAST.operator + " " + rightvalue
        }
    }
    private convertArithmeticAST(arithmeticAST: any, expression: any, position:any = null): string {
        if (arithmeticAST.type == "UpdateExpression") {
            let val = ""
            let identifier = ""
            if (arithmeticAST.argument.type == "Identifier") {
                identifier = arithmeticAST.name ? arithmeticAST.name : arithmeticAST.argument.name
                val = this.getIdentifier(expression, arithmeticAST.argument)
            } else {
                this.terminate(expression)
            }
            let ret = ""
            switch (arithmeticAST.operator) {
                case "++":
                    if (arithmeticAST.prefix)
                        ret = "pre_increment(\"" + identifier + "\")"
                    else
                        ret = "post_increment(\"" + identifier + "\")"
                    break;
                case "--":
                    if (arithmeticAST.prefix)
                        ret = "pre_decrement(\"" + identifier + "\")"
                    else
                        ret = "post_decrement(\"" + identifier + "\")"
                    break;
                default:
                    this.terminate(expression)
            }
            if (position && position.start > 0)
                ret = "\" + " + ret + "+ \""
            return ret
        }
        if (arithmeticAST.type == "BinaryExpression") {
            return this.convertArithmeticASTBinaryExpression(arithmeticAST, expression)
        }
        if (arithmeticAST.type == "AssignmentExpression") {
            let leftvalue
            let leftstoi = ""
            if (arithmeticAST.left.type == "Identifier") {
                leftvalue = "\"" + arithmeticAST.left.name + "\""
                leftstoi = "mystoiz(" + this.getIdentifier(expression, arithmeticAST.left) + ")"
            }
            else {
                this.terminate(expression)
            }
            let rightvalue
            if (arithmeticAST.right.type == "NumericLiteral") {
                rightvalue = arithmeticAST.right.value
            }
            else if (arithmeticAST.right.type == "Identifier") {
                rightvalue = this.getIdentifier(expression, arithmeticAST.right)
                rightvalue = "mystoiz(" + rightvalue + ")"
            }
            else if (arithmeticAST.right.type == "BinaryExpression") {
                rightvalue = this.convertArithmeticASTBinaryExpression(arithmeticAST.right, expression)
            }
            else {
                this.terminate(expression)
            }
            switch (arithmeticAST.operator) {
                case "%=":
                    return "set_env(" + leftvalue + ", " + leftstoi + " % " +  rightvalue + ")"
                case "/=":
                    return "set_env(" + leftvalue + ", " + leftstoi + " / " +  rightvalue + ")"
                case "*=":
                    return "set_env(" + leftvalue + ", " + leftstoi + " * " +  rightvalue + ")"
                case "+=":
                    return "set_env(" + leftvalue + ", " + leftstoi + " + " +  rightvalue + ")"
                case "-=":
                    return "set_env(" + leftvalue + ", " + leftstoi + " - " + rightvalue + ")"
                case "=":
                    return "set_env(" + leftvalue + ", " + rightvalue + ")"
                default:
                    this.terminate(expression)
            }
        }
        this.terminate(expression)
    }
    private convertArithmeticExpansion(command: any, expression:any, ast:any): string {
        if ((command.loc.start < 0) || (command.loc.end < 0)) {
            return ""
        }
        return this.convertArithmeticAST(ast, expression, command.loc)
    }
    private convertLogicalExpression(command: any): string {
        const [clause, thenval, elseval] = this.convertIfStatement(command, command.left, command.right)

        if (command.op == "and")
            return "if (" + clause + ") { \n" + thenval + "\n}\n" + (elseval ? "else\n{\n" + elseval + "}" : "");
        else if (command.op == "or")
            return "if (" + clause + ") { \n" + "\n }\n" + (thenval ? "else \n{ \n" + thenval + " } " : "");
        else
            this.terminate(command)
    }

    private isStringTerminated(str: any): boolean {
        if ((str.charAt(str.length - 2) != "\\") &&
            (str.charAt(str.length - 1) == "\"")
        )
            return true
       return false
    }

    private singleQuoteBalanced(expansionarr: any, expansion: any): boolean {
        if ((expansion.indexOf("'") == 0) && ("'" == expansion.substr(expansion.length - 1)))
            return true;

        return false
    }

    private convertQuotes(expansionarr: any, expansion: any): string{
        let stringexpression = true
        let stringtermination = true
        let singlequotebalanced = false /*this.singleQuoteBalanced(expansionarr, expansion)*/

        let singlquotecount = (expansion.match(/'/g) || []).length;

        if (expansionarr) {
            for (let i = 0; i < expansionarr.length; i++) {
                if (expansionarr[i].loc && (expansionarr[i].loc.start < 0))
                    continue

                stringexpression = false;

                if (expansionarr[i].loc && (expansionarr[i].loc.start >= 0))
                    stringtermination = false

            }
        }
        if (expansion.indexOf("\\\"\" + ") == 0)
            expansion = expansion.substring(6)
        else if (expansion.indexOf("\\\"") == 0) {
            expansion = expansion.substring(2)
            expansion = "\"" + expansion
        }
        else if (expansion.indexOf("\" + ") == 0)
            expansion = expansion.substring(4)
        else if (expansion.charAt(0) == "\"" && (expansion.charAt(1) == " ") && stringexpression)
            expansion = "\"" + expansion
        else if (singlequotebalanced){
            expansion = expansion.substring(1)
            expansion = "\"" + expansion
        }
        else if ((expansion.charAt(0) != "\"") && (!this.isStringTerminated(expansion)) && stringexpression) {
            expansion = "\"" + expansion
            if (stringtermination) expansion = expansion + "\""
        }
        else if ((expansion.charAt(0) == "\"") && (expansion.length == 1) && stringexpression) {
            expansion = expansion + "\""
        }
        else if (expansion.indexOf("\"\" + ") == 0)
            expansion = expansion.substring(5)
        else if (expansion.indexOf("\"'") == 0)
            expansion = expansion.substring(2)

        if (expansion.length > 1) {
            if ("\\\"" == expansion.substr(expansion.length - 2))
                expansion = expansion.substring(0, expansion.length - 2)
            else if ("\\\'" == expansion.substr(expansion.length - 2))
                expansion = expansion.substring(0, expansion.length - 2)
            else if ("+ \"" == expansion.substr(expansion.length - 3))
                expansion = expansion.substring(0, expansion.length - 3)
            else if (("'\"" == expansion.substr(expansion.length - 2)) && (singlquotecount == 2) && singlequotebalanced) 
                expansion = expansion.substring(0, expansion.length - 2)
            else if (singlequotebalanced) {
                expansion = expansion.substring(0, expansion.length - 1)
                expansion = expansion + "\""
            }
        }

        return expansion
    }

    private validExpansion(command: any): boolean {
        if (!command.expansion)
            return false;
        for (let i = 0; i < command.expansion.length; i++) {
            if (command.expansion[i].loc.start > 0)
                return true;
        }
        return false
    }

    /*
     * type: 'AssignmentWord',
	 * text: String,
	 * expansion: Array<ArithmeticExpansion |
					 CommandExpansion |
					 ParameterExpansion>
     */
    private getAssignmentPair(command: any): [string, string, boolean, boolean] {
        var isexpansion = false
        if (this.validExpansion(command)) {
            const text = this.convertWord(command)
            const equalpos = text.indexOf("=")
            const variableName = text.substr(0, equalpos)
            let variableValue = text.substr(equalpos + 1, text.length)
            if (variableValue.indexOf("\\\"") == 0) {
                variableValue = variableValue.substr(2)
                variableValue = "\"" + variableValue
            }
            else if (variableValue.indexOf("\\\'") == 0) {
                variableValue = variableValue.substr(2)
                variableValue = "\'" + variableValue
            }

            let expansion = variableValue
            expansion = this.convertQuotes(command.expansion, expansion)
            if ((expansion[0] != "\"") && (command.expansion[0].loc.start > 0) &&
                (command.text[command.expansion[0].loc.start - 1] != "=") &&
                (command.text[command.expansion[0].loc.start - 1] != "\"")
                )
                expansion = "\"" + expansion

            isexpansion = true
            return [variableName, expansion, false, isexpansion]
            //return `set_env("${variableName}", ${expansion})`;
        }

        let variableValue

        const equalpos = command.text.indexOf("=")
        if (equalpos == -1)
            return [command.text, "", false, isexpansion]
        const variableName = command.text.substr(0, equalpos)
        variableValue = command.text.substr(equalpos + 1, command.text.length)
        let startindex = 0

        if (variableValue.indexOf("~") != -1) {
            variableValue = this.replaceAll(variableValue, "~", "\" + get_env(\"HOME\") + \"")
            variableValue = "\"" + variableValue + "\""
            isexpansion = true
            return [variableName, variableValue, false, isexpansion]
            //return `set_env("${variableName}", ${variableValue})`;
        }

        variableValue = this.convertQuotes(command.expansion, variableValue)
        if (!variableValue.startsWith('"') && !this.isNumeric(variableValue))
            return [variableName, variableValue, true, isexpansion]
        return [variableName, variableValue, false, isexpansion]

        // auto-quote value if it doesn't start with quote
        //if (!variableValue.startsWith('"') && !this.isNumeric(variableValue))
        //    return `set_env("${variableName}", "${variableValue}")`;
        //return `set_env("${variableName}", ${variableValue})`;
    }

    private convertAssignment(command: any): string {
        let [variableName, variableValue, needsquote, expansion] = this.getAssignmentPair(command)
        if (this.validExpansion(command) || expansion) {
            if (!needsquote)
                return `set_env("${variableName}", ${variableValue})`;
            return `set_env("${variableName}", "${variableValue}")`;
        } else {
            if (!needsquote)
                return `setenv("${variableName}", ${variableValue}, 1)`;
            return `setenv("${variableName}", "${variableValue}", 1)`;
        }
    }

    private isNumeric(val: any): boolean {
        return /^\d+$/.test(val);
    }

    private isAlphaNumeric(str) {
        let code, i, len;

        for (i = 0, len = str.length; i < len; i++) {
            code = str.charCodeAt(i);
            if (!(code > 47 && code < 58) && // numeric (0-9)
                !(code > 64 && code < 91) && // upper alpha (A-Z)
                !(code > 96 && code < 123)) { // lower alpha (a-z)
                return false;
            }
        }
        return true;
    }

    private convertCondition(leftValue: any, rightValue: any, opValue: any, rightexpansion: any, leftexpansion: any): [string, string] {
        let op = ""
        let clause = ""

        switch (opValue) {
            case "-eq":
                if (rightexpansion)
                    rightValue = "mystoi(" + rightValue + ") "
                if (leftexpansion)
                    leftValue = "mystoi(" + leftValue + ") "
                op = "=="
                clause = leftValue + op + " " + rightValue + " "
                break
            case "-ne":
                if (rightexpansion)
                    rightValue = "mystoi(" + rightValue + ") "
                op = "!="
                if (leftexpansion)
                    leftValue = "mystoi(" + leftValue + ") "

                clause = leftValue + op + " " + rightValue + " "
                break
            case "-gt":
            case ">":
                if (rightexpansion)
                    rightValue = "mystoi(" + rightValue + ") "
                if (leftexpansion)
                    leftValue = "mystoi(" + leftValue + ") "
                op = ">"
                clause = leftValue + op + " " + rightValue + " "
                break
            case "-ge":
            case ">=":
                if (rightexpansion)
                    rightValue = "mystoi(" + rightValue + ") "
                if (leftexpansion)
                    leftValue = "mystoi(" + leftValue + ") "
                op = ">="
                clause = leftValue  + op + " " + rightValue + " "
                break
            case "-lt":
            case "<":
                if (rightexpansion)
                    rightValue = "mystoi(" + rightValue + ") "
                if (leftexpansion)
                    leftValue = "mystoi(" + leftValue + ") "
                op = "<"
                clause = leftValue + op + " " + rightValue + " "
                break
            case "-le":
            case "<=":
                if (rightexpansion)
                    rightValue = "mystoi(" + rightValue + ") "
                if (leftexpansion)
                    leftValue = "mystoi(" + leftValue + ") "
                op = "<="
                clause = leftValue  + op + " " + rightValue + " "
                break
            case "-e":
            case "-a":
                clause = "fileexists(" + (!rightexpansion ? "\"" : "") + rightValue + (!rightexpansion ? "\"" : "") + ")"
                break
            case "-s":
                clause = "fileexists_sizenonzero(" + (!rightexpansion ? "\"" : "") + rightValue + (!rightexpansion ? "\"" : "") + ")"
                break
            case "!-s":
                clause = "!fileexists_sizenonzero(" + (!rightexpansion ? "\"" : "") + rightValue + (!rightexpansion ? "\"" : "") + ")"
                break
            case "!-e":
            case "!-a":
                clause = "!fileexists(" + (!rightexpansion ? "\"" : "") + rightValue + (!rightexpansion ? "\"" : "") + ")"
                break
            case "-b":
                clause = "blockfileexists(" + (!rightexpansion ? "\"" : "") + rightValue + (!rightexpansion ? "\"" : "") + ")"
                break
            case "-f":
                clause = "regularfileexists(" + (!rightexpansion ? "\"" : "") + rightValue + (!rightexpansion ? "\"" : "") + ")"
                break
            case "!-b":
                clause = "!blockfileexists(" + (!rightexpansion ? "\"" : "") + rightValue + (!rightexpansion ? "\"" : "") + ")"
                break
            case "!-f":
                clause = "!regularfileexists(" + (!rightexpansion ? "\"" : "") + rightValue + (!rightexpansion ? "\"" : "") + ")"
                break
            case "-p":
                clause = "pipefileexists(" + (!rightexpansion ? "\"" : "") + rightValue + (!rightexpansion ? "\"" : "") + ")"
                break
            case "-h":
            case "-L":
                clause = "linkfileexists(" + (!rightexpansion ? "\"" : "") + rightValue + (!rightexpansion ? "\"" : "") + ")"
                break
            case "!-p":
                clause = "!pipefileexists(" + (!rightexpansion ? "\"" : "") + rightValue + (!rightexpansion ? "\"" : "") + ")"
                break
            case "!-h":
            case "!-L":
                clause = "!linkfileexists(" + (!rightexpansion ? "\"" : "") + rightValue + (!rightexpansion ? "\"" : "") + ")"
                break
            case "-S":
                clause = "socketfileexists(" + (!rightexpansion ? "\"" : "") + rightValue + (!rightexpansion ? "\"" : "") + ")"
                break
            case "-c":
                clause = "charfileexists(" + (!rightexpansion ? "\"" : "") + rightValue + (!rightexpansion ? "\"" : "") + ")"
                break
            case "!-S":
                clause = "!socketfileexists(" + (!rightexpansion ? "\"" : "") + rightValue + (!rightexpansion ? "\"" : "") + ")"
                break
            case "!-c":
                clause = "!charfileexists(" + (!rightexpansion ? "\"" : "") + rightValue + (!rightexpansion ? "\"" : "") + ")"
                break
            case "-r":
                clause = "filereadable(" + (!rightexpansion ? "\"" : "") + rightValue + (!rightexpansion ? "\"" : "") + ")"
                break
            case "-w":
                clause = "filewritable(" + (!rightexpansion ? "\"" : "") + rightValue + (!rightexpansion ? "\"" : "") + ")"
                break
            case "-x":
                clause = "fileexecutable(" + (!rightexpansion ? "\"" : "") + rightValue + (!rightexpansion ? "\"" : "") + ")"
                break
            case "-d":
                clause = "direxists(" + (!rightexpansion ? "\"" : "") + rightValue + (!rightexpansion ? "\"" : "") + ")"
                break
            case "!-r":
                clause = "!filereadable(" + (!rightexpansion ? "\"" : "") + rightValue + (!rightexpansion ? "\"" : "") + ")"
                break
            case "!-w":
                clause = "!filewritable(" + (!rightexpansion ? "\"" : "") + rightValue + (!rightexpansion ? "\"" : "") + ")"
                break
            case "!-x":
                clause = "!fileexecutable(" + (!rightexpansion ? "\"" : "") + rightValue + (!rightexpansion ? "\"" : "") + ")"
                break
            case "!-d":
                clause = "!direxists(" + (!rightexpansion ? "\"" : "") + rightValue + (!rightexpansion ? "\"" : "") + ")"
                break
            case "-n":
                {
                    const val = !rightexpansion ? rightValue : '"' + rightexpansion[0].parameter + '"'
                    if (rightexpansion)
                        clause = "envexists_and_hascontent(" + (!rightexpansion ? "\"" : "") + val + (!rightexpansion ? "\"" : "") + ")"
                    else
                        clause = rightValue.length > 0 ? "1" : "0"
                }
                break
            case "-z":
                {
                    const val = !rightexpansion ? rightValue : '"' + rightexpansion[0].parameter + '"'
                    if (rightexpansion)
                        clause = "envempty(" + (!rightexpansion ? "\"" : "") + val + (!rightexpansion ? "\"" : "") + ")"
                    else
                        clause = rightValue.length == 0 ? "1" : "0"
                    break
                }
            case "!-n":
                {
                    let val = !rightexpansion ? rightValue : '"' + rightexpansion[0].parameter + '"'
                    if (rightexpansion)
                        clause = "!envexists_and_hascontent(" + (!rightexpansion ? "\"" : "") + val + (!rightexpansion ? "\"" : "") + ")"
                    else
                        clause = rightValue.length > 0 ? "0" : "1"
                }
                break
            case "!-z":
                {
                    let val = !rightexpansion ? rightValue : '"' + rightexpansion[0].parameter + '"'
                    if (rightexpansion && rightexpansion[0].parameter)
                        clause = "!envempty(" + (!rightexpansion ? "\"" : "") + val + (!rightexpansion ? "\"" : "") + ")"
                    else if (rightexpansion) {
                        val = rightValue
                        clause = rightValue + ".length() != 0"
                    }
                    else
                        clause = rightValue.length == 0 ? "0" : "1"
                }
                break
            case "==":
            case "=":
                clause = leftValue + "==" + (!rightexpansion ? "\"" : "") + rightValue + (!rightexpansion ? "\"" : "")
                break
            case "!=":
                clause = leftValue + "!=" + (!rightexpansion ? "\"" : "") + rightValue + (!rightexpansion ? "\"" : "")
                break
            default:
                console.log('unknown opValue: ' + leftValue + " " + opValue + " " + rightValue);
                this.terminate("")
        }

        return [op, clause];
    }

    private convertOneCondition(clausecommands: any, startindex: any): string {
        let leftValue = null
        let leftValueExpansion = null
        let opValue = null
        let rightValue = null
        let rightValueExpansion = null
        let skipname = false
        let leftindex

        if (clausecommands.name) {
            if ((clausecommands.name.text == "[") || (clausecommands.name.text == "[[") || (clausecommands.name.text == "test")) {
                skipname = true;
            }
        }

        let redirectBug = false

        if (skipname == false) {
            leftindex = -1 + startindex
            leftValue = this.convertCommand(clausecommands.name)
            leftValueExpansion = clausecommands.expansion ? clausecommands.expansion : clausecommands.name.expansion
            if (leftValue == "!") {
                leftindex = 0 + startindex
                leftValue = this.convertCommand(clausecommands.suffix[leftindex])
                leftValueExpansion = clausecommands.suffix[leftindex].expansion
                if ((leftValue == "[") || (leftValue == "[[") || (leftValue == "test")) {
                    leftindex = 1 + startindex
                    leftValue = this.convertCommand(clausecommands.suffix[leftindex])
                    leftValueExpansion = clausecommands.suffix[leftindex].expansion
                }
                leftValue = "!" + leftValue
            }
            opValue = clausecommands.suffix.length > (leftindex + 1) ? this.convertCommand(clausecommands.suffix[leftindex + 1]) : ""

            rightValue = clausecommands.suffix.length > (leftindex + 2) ? this.convertCommand(clausecommands.suffix[leftindex + 2]) : null
            rightValueExpansion = clausecommands.suffix.length > (leftindex + 2) ? clausecommands.suffix[leftindex + 2].expansion : null

            // bash-parser bug
            if (clausecommands.suffix[leftindex + 1].type == "Redirect") {
                if (!rightValue) {
                    opValue = clausecommands.suffix[leftindex + 1].op.text
                    rightValue = this.convertCommand(clausecommands.suffix[leftindex + 1].file);
                    rightValueExpansion = clausecommands.suffix[leftindex + 1].file.expansion
                } else {
                    opValue = clausecommands.suffix[leftindex + 1].op.text + clausecommands.suffix[leftindex + 1].file.text
                }
                redirectBug = true
            }

        }
        else if (clausecommands.suffix) {
            leftindex = 0 + startindex
            leftValue = this.convertCommand(clausecommands.suffix[leftindex])
            leftValueExpansion = clausecommands.suffix[leftindex].expansion
            if (leftValue == "!") {
                leftindex = 1 + startindex
                leftValue = this.convertCommand(clausecommands.suffix[leftindex])
                leftValueExpansion = clausecommands.suffix[leftindex].expansion
                leftValue = "!" + leftValue
            }
            opValue = clausecommands.suffix.length > (leftindex + 1) ? this.convertCommand(clausecommands.suffix[leftindex + 1]) : ""
            rightValue = clausecommands.suffix.length > (leftindex + 2) ? this.convertCommand(clausecommands.suffix[leftindex + 2]) : null
            rightValueExpansion = clausecommands.suffix.length > (leftindex + 2) ? clausecommands.suffix[leftindex + 2].expansion : null
        }
        else {
            const prefixcommand = clausecommands
            if (prefixcommand.prefix && prefixcommand.prefix.length && (!prefixcommand.name || !prefixcommand.name.text)) {
                leftValue = prefixcommand.prefix.map(c => this.convertCommand(c)).join('\n');
                leftValueExpansion = prefixcommand.prefix.expansion
            }
        }
        let clause = ""

        if ((clausecommands.suffix.length > 1) || redirectBug) {
            if ((rightValue == "]]") || (rightValue == "]") || (rightValue == null)|| (rightValue == "-o") || (rightValue == "-a")) {
                rightValueExpansion = clausecommands.suffix.length > (leftindex + 1) ? clausecommands.suffix[leftindex + 1].expansion : null
                rightValue = opValue
                opValue = leftValue
                leftValue = ""
                leftValueExpansion = null
            }

            if ((rightValue != null) && rightValue != ']')
                [, clause] = this.convertCondition(leftValue, rightValue, opValue, rightValueExpansion, leftValueExpansion)
            else {
                if (clausecommands.suffix && clausecommands.suffix[0].expansion)
                    clause = opValue + " != \"\""
                else if (clausecommands.prefix && clausecommands.prefix[0].expansion)
                    clause = opValue + " != \"\""
                else if (opValue == "")
                    clause = "0"
                else
                    clause = "1"
            }
        } else {
            if (clausecommands.suffix.length == 1)
                clause = "0"
        }

        return clause;
    }

    private convertLogicalCondition(left: any, right: any, op: any): string {
        let clause = ""
        if (left.type == "LogicalExpression") {
            clause += this.convertLogicalCondition(left.left, left.right, left.op)
        }
        if (right.type == "LogicalExpression") {
            clause += this.convertLogicalCondition(right.left, right.right, right.op)
        }

        if (left.type == "LogicalExpression") {
            let opstr = ""
            if (op == "and")
                opstr = "&&"
            else if (op == "or")
                opstr = "||"
            else
                this.terminate(left)

            let [rightclause, ] = this.convertClause(right)
            if (right.bang)
                rightclause = "!" + rightclause

            if (left.bang)
                clause = "!" + "(" + clause + ")"

            return "(" + clause + ") " + opstr + rightclause
        }

        let [leftclause, intest] = this.convertClause(left)
        leftclause = "(" + leftclause + ")"

        let [rightclause, ] = this.convertClause(right, intest)
        rightclause = "(" + rightclause + ")"
        if (right.bang)
            rightclause = "!" + rightclause

        if (op == "and")
            clause = leftclause + " && " + rightclause
        else if (op == "or")
            clause = leftclause + " || " + rightclause
        else
            this.terminate(left)

        if (left.bang)
            clause = "!" + "(" + clause + ")"

        return clause
    }

    private convertClause(clausecommands: any, intest = false, async = true): [string, boolean] {
        let clause = ""
        let name = clausecommands.name ? clausecommands.name.text : ""
        if (intest || (name == "test") || (name == "[") || (name == "[[") ||
            (name == "!") && ((clausecommands.suffix[0].text == "test") || (clausecommands.suffix[0].text == "[") || (clausecommands.suffix[0].text == "[["))) {

            let combinedExpressionIndex = [-1]

            if (clausecommands.suffix) {
                for (let i = 0; i < clausecommands.suffix.length; i++) {
                    if (clausecommands.suffix[i].text == "-o")
                        combinedExpressionIndex.push(i)
                    if (clausecommands.suffix[i].text == "-a")
                        combinedExpressionIndex.push(i)
                }
            }

            if (combinedExpressionIndex.length == 1)
                clause = this.convertOneCondition(clausecommands, 0)
            else {
                for (let v = 0; v < combinedExpressionIndex.length; v++) {
                    clause = clause + "(" + this.convertOneCondition(clausecommands, combinedExpressionIndex[v] + 1) + ")"
                    if ((v != (combinedExpressionIndex.length - 1)) && (clausecommands.suffix[combinedExpressionIndex[v + 1]].text == "-o")) {
                        clause += "||"
                    }
                    if ((v != (combinedExpressionIndex.length - 1)) && (clausecommands.suffix[combinedExpressionIndex[v + 1]].text == "-a"))
                        clause += "&&"
                }
            }

            if (clausecommands.suffix[clausecommands.suffix.length - 1].text != "]")
                intest = true
        }
        else {
            let cmd = "checkexec"
            let isinternal = this.isKnownFunction(clausecommands.name, clausecommands.suffix)
            if (isinternal)
                cmd = "checkknownexec"
            let isbuiltin = this.isBuiltinFunction(clausecommands.name, clausecommands.suffix)
            if (isbuiltin)
                cmd = "checkbuiltinexec"
            let name = clausecommands.name ? clausecommands.name.text : ""
            if (name && (name.text == "!") && clausecommands.suffix.length > 0) {
                name = clausecommands.suffix[0].text
            }
            let negative = false
            if (clausecommands.commands && clausecommands.commands[0].name && clausecommands.commands[0].name.negative) {
                negative = true
            }
            if (clausecommands.name && clausecommands.name.negative) {
                negative = true
            }
            if (clausecommands.commands && clausecommands.commands[0].name && clausecommands.commands[0].name.text == "!") {
                negative = true
                if (clausecommands.commands[0].suffix) {
                    clausecommands.commands[0].name = clausecommands.commands[0].suffix[0]
                    clausecommands.commands[0].name.negative = true
                    clausecommands.commands[0].suffix.shift()
                } else {
                    this.terminate(clausecommands.commands[0])
                }
            } else if (name == "!") {
                negative = true
                if (clausecommands.suffix) {
                    clausecommands.name = clausecommands.suffix[0]
                    clausecommands.name.negative = true
                    clausecommands.suffix.shift()
                } else {
                    this.terminate(clausecommands.commands[0])
                }
            } else if (isbuiltin) {
                if (clausecommands.suffix) {
                    clausecommands.name = clausecommands.suffix[0]
                    clausecommands.suffix.shift()
                } else {
                    this.terminate(clausecommands.commands[0])
                }
            }
            if (clausecommands.type == "Pipeline") {
                cmd = "checkexitcode"
            }
            if ((name != "!") && !negative) {
                if (!isbuiltin) {
                    const issuesystem = false
                    const handlecommands = true
                    const stdout = false
                    const collectresults = true
                    let pipeline = false
                    if (clausecommands.type == "Pipeline")
                        pipeline = true
                    clause = " " + cmd + "(" + this.convertExecCommand(clausecommands, issuesystem, handlecommands, [], stdout, async, collectresults, pipeline) + ")"
                }
                else {
                    const issuesystem = false
                    const handlecommands = true
                    const stdout = false
                    const collectresults = true
                    let pipeline = false
                    if (clausecommands.type == "Pipeline")
                        pipeline = true
                    clause = " " + cmd + "(" + name + ", " + this.convertExecCommand(clausecommands, issuesystem, handlecommands, [], stdout, async, collectresults, pipeline) + ")"
                }
            }
            else {
                const issuesystem = false
                const handlecommands = true
                const stdout = false
                const collectresults = true
                let pipeline = false
                if (clausecommands.type == "Pipeline")
                    pipeline = true
                const clauseexpansion = this.convertExecCommand(clausecommands, issuesystem, handlecommands, [], stdout, async, collectresults, pipeline)
                if (!isbuiltin)
                    clause = "!" + cmd + "(" + clauseexpansion + ")"
                else
                    clause = "!" + cmd + "(" + name + ", " + clauseexpansion + ")"
            }
        }

        return [clause, intest]
    }

    private convertIfStatement(command: any, clausecommands:any, then: any, async = true): string [] {
        let clause = ""

        if (clausecommands.type == "Subshell") {
            if (clausecommands.list.commands.length > 1)
                this.terminate(clausecommands)
            if (clausecommands.list.commands[0].list.commands.length > 1)
                this.terminate(clausecommands)
            const commands = clausecommands.list.commands[0].list.commands[0]
            const [tmpclause,] = this.convertClause(commands, true, async)
            clause = tmpclause
            if ((clausecommands.list.commands[0].type == "Subshell") && !commands.name.expansion){
                try {
                    let arithmeticAST = babylon.parse(clause);
                    if (arithmeticAST.program.body.length)
                        clause = this.convertArithmeticAST(arithmeticAST.program.body[0].expression, clause)
                } catch (err) {
                }
            } 
        }
        else if (clausecommands.type == "LogicalExpression") {
            const left = clausecommands.left
            const right = clausecommands.right
            const op = clausecommands.op

            clause = this.convertLogicalCondition(left, right, op)
        } else {
            const [tmpclause, ] = this.convertClause(clausecommands, false, async)
            clause = tmpclause
        }

        let thenval = ""
        if (then) {
            thenval += this.convertCommand(then);
            thenval += ";\n"
        }
        const elseval = command.else && (command.else.type == "CompoundList") ? ` ${command.else.commands.map(c => this.convertCommand(c)).join(';\n') + ";\n"}` : '';

        return [clause, thenval, elseval]
    }

    private convertIf(command: any): string {
        let redirectindex = -1
        let redirections = null
        let async = true

        if (command.clause.commands.length != 1) {
            if (command.clause.commands[1].prefix && command.clause.commands[1].prefix[0].type == "Redirect") {
                redirectindex = 0
                redirections = command.clause.commands[1].prefix
                async = false
            }
            else
                this.terminate(command)
        }

        let maintext = ""
        const [clause, thenval, elseval] = this.convertIfStatement(command, command.clause.commands[0], command.then, async)
        
        maintext += "if (" + clause + ") { \n" + thenval + "\n}\n" + (elseval ? "else\n{\n" + elseval + "}" : "");
        if (command.else && command.else.type == "If") {
            maintext += "else " + this.convertIf(command.else)
        }

        return this.convertStdRedirects(redirections, redirectindex, maintext)
    }

    private convertOneFunction(name: any, body: any, maxargs:any): string {
        let text = ""
        if (name[0] == '"' && name[name.length - 1] == '"') {
            name = name.substring(1, name.length - 2)
        }
        text += "const std::string " + name + "(const std::initializer_list<std::string> &list) {\n"
        text += "scopeparams prms" + name + "(list, " + parseInt(maxargs) + ");\n"
        text += "scopeexitcout scope(true);\n"

        text += body + "; \n"
        text += "return scope.buf().str();\n"
        text += "}\n"

        return text
    }

    private maxReferredArgsCmd(cmd: any, num: any): number {
        for (let s = 0; cmd.suffix && (s < cmd.suffix.length); s++) {
            let sfx = cmd.suffix[s]
            for (let e = 0; sfx.expansion && (e < sfx.expansion.length); e++) {
                let exp = sfx.expansion[e]
                if (exp.parameter && (exp.parameter > num)) {
                    num = exp.parameter
                }
            }
        }
        for (let p = 0; cmd.prefix && (p < cmd.prefix.length); p++) {
            let pfx = cmd.prefix[p]
            for (let e = 0; pfx.expansion && (e < pfx.expansion.length); e++) {
                let exp = pfx.expansion[e]
                if (exp.parameter && (exp.parameter > num)) {
                    num = exp.parameter
                }
                if (exp.commandAST) {
                    num = this.maxReferredArgs(exp.commandAST, num)
                }
                if (exp.arithmeticAST) {
                    if (exp.arithmeticAST.left && (exp.arithmeticAST.left.type == "Identifier")) {
                        let leftid = this.getIdentifier(exp.arithmeticAST.left.name, exp.arithmeticAST.left, false)
                        if (this.isNumeric(leftid)) {
                            if (Number(leftid) > num) {
                                num = Number(leftid)
                            }
                        } else {
                            let name = exp.arithmeticAST.left.name
                            name = this.replaceAll(name, "$", "")
                            if (this.isNumeric(name)) {
                                if (Number(name) > num) {
                                    num = Number(name)
                                }
                            }
                        }
                    }
                    if (exp.arithmeticAST.right && (exp.arithmeticAST.right.type == "Identifier")) {
                        let rightid = this.getIdentifier(exp.arithmeticAST.right.name, exp.arithmeticAST.right, false)
                        if (this.isNumeric(rightid)) {
                            if (Number(rightid) > num) {
                                num = Number(rightid)
                            }
                        } else {
                            let name = exp.arithmeticAST.right.name
                            name = this.replaceAll(name, "$", "")
                            if (this.isNumeric(name)) {
                                if (Number(name) > num) {
                                    num = Number(name)
                                }
                            }
                        }
                    }
                    if (exp.arithmeticAST.argument && (exp.arithmeticAST.argument.type == "Identifier")) {
                        let argid = this.getIdentifier(exp.arithmeticAST.argument.name, exp.arithmeticAST.argument, false)
                        if (this.isNumeric(argid)) {
                            if (Number(argid) > num) {
                                num = Number(argid)
                            }
                        }
                    }
                }
            }
        }
        for (let p = 0; cmd.name && (p < cmd.name.length); p++) {
            let nm = cmd.name[p]
            for (let e = 0; nm.expansion && (e < nm.expansion.length); e++) {
                let exp = nm.expansion[e]
                if (exp.parameter && (exp.parameter > num)) {
                    num = exp.parameter
                }
            }
        }
        return num
    }

    private traverseTree(cmd: any, maxargs: any) {
        if (cmd.left)
            return this.traverseTree(cmd.left, maxargs)
        if (cmd.right)
            return this.traverseTree(cmd.right, maxargs)

        maxargs = this.maxReferredArgsCmd(cmd, maxargs)
        if (cmd.do) {
            maxargs = this.maxReferredArgs(cmd.do, maxargs)
        }
        if (cmd.subshell) {
            maxargs = this.maxReferredArgs(cmd.subshell, maxargs)
        }
        if (cmd.else) {
            maxargs = this.maxReferredArgs(cmd.else, maxargs)
        }
        if (cmd.then) {
            maxargs = this.maxReferredArgs(cmd.then, maxargs)
        }
        if (cmd.clause) {
            maxargs = this.maxReferredArgs(cmd.clause, maxargs)
        }
        if (cmd.list) {
            maxargs = this.maxReferredArgs(cmd.list, maxargs)
        }
        if (cmd.body) {
            maxargs = this.maxReferredArgs(cmd.body, maxargs)
        }
        if (cmd.cases) {
            for (let v = 0; v < cmd.cases.length; v++)
                maxargs = this.traverseTree(cmd.cases[v], maxargs)
        }
        if (cmd.wordlist) {
            for (let v = 0; v < cmd.wordlist.length; v++)
                maxargs = this.traverseTree(cmd.wordlist[v], maxargs)
        }
        if (cmd.redirections) {
            for (let v = 0; v < cmd.redirections.length; v++)
                maxargs = this.traverseTree(cmd.redirections[v], maxargs)
        }
        if (cmd.pattern) {
            for (let v = 0; v < cmd.pattern.length; v++)
                maxargs = this.traverseTree(cmd.pattern[v], maxargs)
        }
        return maxargs
    }

    public maxReferredArgs(command: any, maxargs: any): number {

        for (let v = 0; command.commands && (v < command.commands.length); v++) {
            let cmd = command.commands[v]
            maxargs = this.traverseTree(cmd, maxargs)
        }

        return maxargs
    }

    private convertFunction(command: any): string {
        let maxargs = 0
        maxargs = this.maxReferredArgs(command.body, maxargs)
        this.convertOneFunction(this.convertCommand(command.name), this.convertCommand(command.body), maxargs)
        let text = ""
        let currentlength = this.functiondefs.length
        for (let v = 0; v < this.functiondefs.length; v++) {
            if (this.functiondefs[v][0] == command)
                return ""
        }
        this.functiondefs.push([command, this.currentrowstart, this.currentrowend])
        return ""
    }

    private escapeText(text: any): any {
        text = this.replaceAll(text, "\\", "\\\\");
        text = this.replaceAll(text, "'", "\\'");
        text = this.replaceAll(text, "\n", "\\n");
        text = this.escapeDoubleQuotes(text)
        text = this.replaceAll(text, "\?", "\\?");
        text = this.replaceAll(text, "\f", "\\f");
        text = this.replaceAll(text, "\r", "\\r");
        text = this.replaceAll(text, "\t", "\\t");
        text = this.replaceAll(text, "\v", "\\v");

        return text
    }

    private escapeSingleQuotes(text: any): any {
        text = this.replaceAll(text, "\\?", "?");
        text = this.replaceAll(text, "\\", "\\\\");
        text = this.replaceAll(text, "\n", "\\n");
        text = this.replaceAll(text, "\f", "\\f");
        text = this.replaceAll(text, "\r", "\\r");
        text = this.replaceAll(text, "\t", "\\t");
        text = this.replaceAll(text, "\v", "\\v");

        return text
    }

    private escapeEOL(text: any): any {
        text = text.replace(/\\n/g, "\\\\n");
        text = text.replace(/\\f/g, "\\\\f");
        text = text.replace(/\\r/g, "\\\\r");
        text = text.replace(/\\t/g, "\\\\t");
        text = text.replace(/\\v/g, "\\\\v");

        return text
    }

    // remove "$val" or '$val'
    private removeQuotesFromVariables(strbegin: any, strend: any): [string, string] {
        var last2 = strbegin.slice(-2);
        var first2 = strend.substring(0, 2);

        // remove "$val" or '$val'
        if ((("\\\"") == (last2)) && (("\\\"") == (first2))) {
            strbegin = strbegin.substring(0, strbegin.length - 2)
            strend = strend.substring(2)
        }
        else if ((("\\\'") == (last2)) && (("\\\'") == (first2))) {
            strbegin = strbegin.substring(0, strbegin.length - 2)
            strend = strend.substring(2)
        }

        return [strbegin, strend]
    }


    private numExpansions(command: any): number {
        let numexpansions = 0
        if (command.expansion) {
            let text = command.text
            const expansions = []
            for (let i = command.expansion.length - 1; i >= 0; i--) {
                if (command.expansion[i]) {
                    const expansion = this.convertCommand(command.expansion[i], command.text);
                    if (expansion != "") {
                        expansions[i] = true
                        numexpansions++
                    }
                }
            }
        }
        return numexpansions
    }
    /*
     * Array<ArithmeticExpansion |
	 *				 CommandExpansion |
	 *				 ParameterExpansion>
     */
    private convertWord(command: any): string {
        if (command.expansion && this.numExpansions(command)) {
            let strbegin = ""
            let strend = ""
            let text = command.text
            const expansions = []
            let numexpansions = 0
            let curexpansions = 0
            for (let i = command.expansion.length - 1; i >= 0; i--) {
                if (command.expansion[i]) {
                    const expansion = this.convertCommand(command.expansion[i], command.text);
                    if (expansion != "") {
                        expansions[i] = true
                        numexpansions++
                    }
                }
            }

            // look for missing string termination
            /*for (let i = 0; i < command.expansion.length; i++) {
                if (command.expansion[i]) {
                    const expansion = this.convertCommand(command.expansion[i]);
                    if (expansion != "") {
                        strbegin = text.substring(0, command.expansion[i].loc.start);
                        strend = text.substring(command.expansion[i].loc.end + 1, text.length);

                        if ((strend != "") && (strend != "\"") && (strend.charAt(strend.length - 1) != "\"")) {
                            if ((curexpansions + 1) == numexpansions)
                                text += "\""
                        }

                        curexpansions++
                    }
                }
            }*/

            let nonexpansionchanges = []
            let nonexpansionoffsets = []
            let nonexpansionlens = []
            let nonexpansions = []
            let previousstart = 0
            for (let i = 0; i < command.expansion.length; i++) {
                let start = command.expansion[i].loc.start
                let end = command.expansion[i].loc.end

                if (command.expansion[i].loc.start < 0) {
                    continue
                }

                let t = text.substr(previousstart, start - previousstart)
                let est = this.escapeText(t)

                if ((previousstart == 0) && (t == "\"")) {
                    previousstart = end + 1
                    continue
                }
                if (t == "") {
                    previousstart = end + 1
                    continue
                }

                nonexpansionoffsets.push(previousstart)
                nonexpansionchanges.push(est.length - t.length)
                nonexpansionlens.push(start - previousstart)
                nonexpansions.push(est)

                previousstart = end + 1
            }
            let t = text.substr(previousstart, text.length - previousstart)
            let est = this.escapeText(t)

            if ((t != "\"") && (t != "")) {
                nonexpansionoffsets.push(previousstart)
                nonexpansionchanges.push(est.length - t.length)
                nonexpansionlens.push(text.length - previousstart)
                nonexpansions.push(est)
            }

            let expansionstarts = []
            let expansionends = []
            for (let i = 0; i < command.expansion.length; i++) {
                let increments = 0
                for (let j = 0; j < nonexpansionoffsets.length; j++) {
                    if (nonexpansionoffsets[j] < command.expansion[i].loc.start)
                        increments += nonexpansionchanges[j]
                }
                expansionstarts.push(command.expansion[i].loc.start + increments)
                expansionends.push(command.expansion[i].loc.end + increments)
            }

            for (let i = nonexpansionoffsets.length - 1; i >= 0; i--) {
                let p = text.substr(0, nonexpansionoffsets[i])
                let exp = nonexpansions[i]
                let e = text.substr(nonexpansionoffsets[i] + nonexpansionlens[i])
                let offset = nonexpansionoffsets[i]
                text = p + exp + e
            }

            let laststrend = ""
            for (let i = command.expansion.length - 1; i >= 0; i--) {
                if (command.expansion[i]) {
                    const expansion = this.convertCommand(command.expansion[i], command.text);
                    if (expansion != "") {
                        strbegin = text.substring(0, expansionstarts[i]);
                        strend = text.substring(expansionends[i] + 1, text.length);

                        let strquotes = "\""
                        let plus = " + "

                        if (command.expansion[i].type == "ArithmeticExpansion") {
                            strquotes = ""
                            plus = ""
                        }

                        var last2 = strbegin.slice(-2);
                        var first2 = strend.substring(0, 2);

                        [strbegin, strend] = this.removeQuotesFromVariables(strbegin, strend)

                        if (i == (command.expansion.length - 1))
                            laststrend = strend

                        if ((strbegin != "") && ((strbegin != "\"")))
                            text = strbegin + strquotes + plus + expansion
                        else
                            text = expansion

                        if ((strend != "") && ((strend != "\"")) && (strend != "\\\"")) {
                            text += plus + strquotes;
                            text += strend;
                        }
                    }
                }
            }

            text = this.convertQuotes(command.expansion, text)

            if (nonexpansionoffsets[nonexpansionoffsets.length - 1] > command.expansion[command.expansion.length - 1].loc.start)
                if (nonexpansions[nonexpansionoffsets.length - 1] && (nonexpansions[nonexpansionoffsets.length - 1] != "\\\"") && (laststrend != "\\\""))
                    if (numexpansions && !this.isStringTerminated(text))
                        text += "\""
            return text;
        }
        let text = command.text;
        text = this.escapeText(text)

        if (text == " ")
            text = '"' + " " + '"'
        else if ((text[0] == '{') && (text[text.length - 1] == '}')) {
            let vals = []
            vals.push(command)
            let [t,] = this.convertRangeExpansion(vals, false, " ")
            if (t != "")
                text = t
        }

        return text;
    }

    private convertExpansion(varray: any, skipRedirects: any, currentline:any): [string, boolean] {
        let suffix = '';

        if (varray) {
            let hasExpansion = false;
            const expansionIndex = []
            for (let i = 0; i < varray.length; i++) {
                if (varray[i].expansion) {
                    hasExpansion = true
                    expansionIndex[i] = true
                }
            }

            if (hasExpansion == false) {
                for (let i = 0; i < varray.length; i++) {
                    if (skipRedirects && (varray[i].type == "Redirect"))
                        continue
                    let q0offset = varray[i].text ? currentline.indexOf(varray[i].text) : 0
                    let q1offset = varray[i].text ? currentline.indexOf(varray[i].text) + varray[i].text.length : 0
                    let q0 = varray[i].loc ? currentline[varray[i].loc.start.col - 1] : currentline[q0offset - 1]
                    let q1 = varray[i].loc ? currentline[varray[i].loc.end.col - 1] : currentline[q1offset]
                    let t = this.convertCommand(varray[i])
                    if ((q0 == '\'') && (q1 == '\''))
                        t = '\'' + this.escapeEOL(t) + '\''
                    if ((q0 == '\"') && (q1 == '\"')) {
                        if ((t[0] != '"') && (t[t.length - 1] != '"'))
                            t = '\'' + t + '\''
                    }
                    suffix += t
                    if ((i != (varray.length - 1)) && (varray[i + 1].type != "Redirect") && skipRedirects)
                        suffix += " "
                }
                suffix = this.convertQuotes(varray.expansion, suffix)
            } else {
                for (let i = 0; i < varray.length; i++) {
                    if (skipRedirects && (varray[i].type == "Redirect"))
                        continue
                    if (varray[i].expansion) {

                        if (i > 0) {
                            if (!expansionIndex[i - 1])
                                suffix += '"'
                            suffix += " + std::string(\" \")"
                            suffix += ' + '
                        }
                        const start0 = varray[i].expansion[0].loc.start
                        if ((start0 != 0) && (varray[i].text.charAt(0) != "\""))
                            suffix += "\""
                        suffix += this.convertCommand(varray[i])
                        if (i != (varray.length -1 ))
                            suffix += " + std::string(\" \")"
                    }
                    else {
                        if (i == 0)
                            suffix += "\""

                        if (i > 0) {
                            if (expansionIndex[i - 1]) {
                                suffix += " + "
                                suffix += "\""
                            }
                        }
                        let t = this.convertCommand(varray[i])
                        let q0offset = varray[i].text ? currentline.indexOf(varray[i].text) : 0
                        let q1offset = varray[i].text ? currentline.indexOf(varray[i].text) + varray[i].text.length : 0
                        let q0 = varray[i].loc ? currentline[varray[i].loc.start.col - 1] : currentline[q0offset - 1]
                        let q1 = varray[i].loc ? currentline[varray[i].loc.end.col - 1] : currentline[q1offset]
                        if ((q0 == '\'') && (q1 == '\''))
                            t = '\'' + this.escapeEOL(t) + '\''
                        suffix += t
                        if ((i != (varray.length - 1)) && (!varray[i + 1].expansion))
                            suffix +=  " "
                    }
                }
            }
            if (suffix.indexOf("\"\\\"\" + ") == 0)
                suffix = suffix.substring(7)
            return [suffix, hasExpansion]
        } else {
            this.terminate(varray)
        }
    }

    public isRegexExpression(str: any): boolean {
        if (str.includes("[*]"))
            return false
        if (str.includes("*") || str.includes("?")) {
            return true
        }
        return false
    }

    private nextChar(c) {
        return String.fromCharCode(c.charCodeAt(0) + 1);
    }

    parseArithmeticAST(xp) {
        let AST;
        try {
            AST = babylon.parse(xp.expression);
        } catch (err) {
            throw new SyntaxError(`Cannot parse arithmetic expression "${xp.expression}": ${err.message}`);
        }

        const expression = AST.program.body[0].expression;

        if (expression === undefined) {
            throw new SyntaxError(`Cannot parse arithmetic expression "${xp.expression}": Not an expression`);
        }

        return JSON.parse(JSON.stringify(expression));
    }

    public convertIoNumber(command: any): string {
        return command.text
    }

    public convertStdRedirects(redirections: any, index: any, maintext: any): string {
        let text = ""
        if (redirections) {
            text += "{\n"
            if (redirections.length <= index)
                this.terminate(redirections)
            let file
            if (!redirections[index].file.expansion)
                file = "\"" + this.convertCommand(redirections[index].file) + "\""
            else {
                file = this.convertCommand(redirections[index].file)
                let locstart = redirections[index].file.expansion[0].loc.start
                if (locstart > 0) {
                    if ((file[0] != '"') && (redirections[index].file.text[0] != '"')){
                        file = '"' + file
                    }
                }
            }

            let numberIo = redirections[index].numberIo ? parseInt(redirections[index].numberIo.text) : 1
            if (redirections[index].op.text == ">") {
                if (numberIo == 2) {
                    text += "scopeexitcerrfile scopefile(" + file + ");\n"
                } else {
                    text += "scopeexitcoutfile scopefile(" + file + ");\n"
                }
            }
            else if (redirections[index].op.text == ">>") {
                if (numberIo == 2) {
                    text += "scopeexitcerrfile scopefile(" + file + ", true);\n"
                } else {
                    text += "scopeexitcoutfile scopefile(" + file + ", true);\n"
                }
            }
            else if (redirections[index].op.text == "<") {
                text += "scopeexitcinfile scopefile(" + file + ");\n"
            }
            else if (redirections[index].op.text == ">&") {
                text += "std::streambuf *backup;\n"
                file = parseInt(redirections[index].file.text)
                if (numberIo == 2) {
                    if (file == 1)
                        file = "std::cout.rdbuf()"
                    else if (file == 0)
                        file = "std::cin.rdbuf()"
                    else if (file == 2)
                        file = "std::cerr.rdbuf()"
                    else
                        this.terminate(redirections)
                    text += "backup = std::cerr.rdbuf();\n"
                    text += "auto rdbuf(" + file + ");\n"
                    text += "std::cerr.rdbuf(rdbuf);\n"
                } else if (numberIo == 1){
                    if (file == 1)
                        file = "std::cout.rdbuf()"
                    else if (file == 0)
                        file = "std::cin.rdbuf()"
                    else if (file == 2)
                        file = "std::cerr.rdbuf()"
                    else
                        this.terminate(redirections)
                    text += "backup = std::cout.rdbuf();\n"
                    text += "auto rdbuf(" + file + ");\n"
                    text += "std::cout.rdbuf(rdbuf);\n"
                } 
                else if (numberIo == 0){
                    //this.terminate(redirections)
                    console.log("fix me")
                }
            }
            else
                this.terminate(redirections[index])
        }
        text += maintext + ";"
        if (redirections && (redirections[index].type == "Redirect")) {
            let numberIo = redirections[index].numberIo ? parseInt(redirections[index].numberIo.text) : 1
            if (redirections[index].op.text == ">&"){
                if (numberIo == 2) {
                    text += "std::cerr.rdbuf(backup);\n"
                } else {
                    text += "std::cout.rdbuf(backup);\n"
                }
            }
            else if ((redirections[index].op.text == ">") ||
                (redirections[index].op.text == ">>")){
            }
            else if (redirections[index].op.text == "<") {
            }
            else
                this.terminate(redirections[index])
            text += "}\n"
        }

        return text
    }

    public convertSubshell(command: any): string {
        if (command.list.commands.length == 1) {
            let cmd;
            if (command.list.commands[0].type == "CompoundsList") {
                cmd = command.list.commands[0].list.commands[0]
                this.terminate(command)
            } else {
                cmd = command.list.commands[0]
            }

            let arithmeticAST;
            let expression = cmd.name ? cmd.name.text : "";

            if (!expression) {
                expression = cmd.prefix ? cmd.prefix[0].text : "";
            }
            if (!cmd.suffix) {
                try {
                    arithmeticAST = babylon.parse(expression);
                    if (arithmeticAST.program.body.length)
                        return this.convertArithmeticAST(arithmeticAST.program.body[0].expression, expression)
                } catch (err) {
                    //throw new SyntaxError(`Cannot parse arithmetic expression "${cmd.name.text}": ${err.message}`);
                }
            } else {
                const suffix = cmd.suffix.map(c => this.convertCommand(c)).join(' ');
                let text = expression + " "
                text += suffix
                expression = text;
                try {
                    arithmeticAST = babylon.parse(expression);
                    return this.convertArithmeticAST(arithmeticAST.program.body[0].expression, expression)
                } catch (err) {
                    //throw new SyntaxError(`Cannot parse arithmetic expression "${cmd.name.text}": ${err.message}`);
                }

            }
        }

        let maintext = command.list.commands.map(c => this.convertCommand(c)).join(';') + ";"
        if (command.redirections && command.redirections.length != 1)
            this.terminate(command)
        return this.convertStdRedirects(command.redirections, 0, maintext)
    }

    public getCharRange(start: any, end: any, assignment: any, delimiter: any) {
        let text = ""
        var i
        for (i = start; i != end; i = this.nextChar(i)) {
            if (assignment)
                text += "\"" + i + "\""
            else
                text += i
            if (i != (end)) {
                if (assignment)
                    text += delimiter
                else
                    text += " "
            }
        }
        if (assignment)
            text += "\"" + i + "\""
        else
            text += i

        return text
    }

    public getNumberRange(start: any, end: any, increment: any, delimiter: any, assignment: any) {
        let text = ""
        if (end > start) {
            for (let i = start; i <= end; i = i + increment) {
                if (assignment)
                    text += "\"" + i + "\""
                else
                    text += i
                if ((i + increment) <= (end))
                    text += delimiter
            }
        } else {
            if (increment > 0)
                increment = -increment
            for (let i = start; i >= end; i = i + increment) {
                if (assignment)
                    text += "\"" + i + "\""
                else
                    text += i
                if (i != (end))
                    text += delimiter

            }
        }
        return text
    }

    public getRange(start: any, end: any, increment: any, delimiter: any, assignment:any) {
        let text = ""
        if (this.isNumeric(start)) {
            start = parseInt(start)
            end = parseInt(end)
            text += this.getNumberRange(start, end, increment, delimiter, assignment)
        } else {
            var i
            end = end.substring(0, end.length - 1)
            text += this.getCharRange(start, end, assignment, delimiter)
        }
        return text
    }

    public convertRangeExpansion(commandwordlist: any, assignment: any = true, delimiter: any = ","): [string, string, boolean] {
        let text = ""
        var countstr = ""
        let isstdstring = false
        let vector = false
        if (commandwordlist &&(commandwordlist.length == 1) && commandwordlist[0].text[0] == "{") {
            const statements = commandwordlist[0].text.split("{")
            if (!assignment)
                text += "\""
            if (assignment)
                text += "const char *vals[] = {\n"

            for (let s = 1; s < statements.length; s++) {
                const limiters = statements[s].split("..")
                let start = limiters[0]
                if (!start)
                    return ["", "", vector]
                let end = limiters[1]
                if (!end)
                    return ["", "", vector]
                let increment = limiters.length > 2 ? parseInt(limiters[2].substring(0, limiters[2].length - 1)) : 1
                text += this.getRange(start, end, increment, delimiter, assignment)
            }
            if (!assignment)
                text += "\""
            if (assignment) {
                text += "\n"
                text += "};\n"
                countstr = "int length = sizeof(vals)/sizeof(vals[0]);\n"
            }
        }
        else if (commandwordlist && (commandwordlist.length == 1) && this.isRegexExpression(commandwordlist[0].text)) {
            if (assignment) {
                text += "std::vector<std::string> vals = {\n"
                vector = true
            }
            text += "globvector(\"" + commandwordlist[0].text + "\")"
            if (assignment) {
                text += "\n"
                text += "};\n"
                countstr = "int length = vals.size();\n"
            }
        }
        else if (!commandwordlist)
        {
            vector = true
            text += "std::vector<std::string> vals; \n"
            text += "regexsplit(vals, get_env(\"@\"));\n"
            countstr = "int length = vals.size();\n"
        }
        else {
            let hasExpansion = false;
            var i
            for (i = 0; i < commandwordlist.length; i++) {
                if (commandwordlist[i].expansion) {
                    hasExpansion = true
                    break
                }
            }
            if (assignment) {
                if (hasExpansion) {
                    text += "std::vector<std::string> vals;\n"
                    vector = true
                }
                else
                    text += "const char* vals[] = {\n"
            }

            if (!hasExpansion && !assignment)
                text += "\""
            for (i = 0; i < commandwordlist.length; i++) {
                if (commandwordlist[i].expansion) {
                    if (vector) {
                        text += "regexsplit(vals, " + this.convertCommand(commandwordlist[i]) + ");\n"
                    }
                    else
                        text += "regexsplit(" + this.convertCommand(commandwordlist[i]) + ")"
                } else {
                    if (hasExpansion)
                        text += "std::string(\"" + commandwordlist[i].text + "\")"
                    else if (assignment)
                        text += "\"" + commandwordlist[i].text + "\""
                    else
                        text += commandwordlist[i].text
                }
                if (i != (commandwordlist.length - 1)) {
                    if (!vector)
                        text += delimiter
                }
            }
            if (!hasExpansion && !assignment)
                text += "\""
            if (assignment) {
                text += "\n"
                if (!vector)
                    text += "};\n"
                if (hasExpansion)
                    countstr = "int length = vals.size();\n"
                else
                    countstr = "int length = sizeof(vals) / sizeof(vals[0]);\n"
            }
        }

        return [text, countstr, vector]
    }

    public extractForParam(left: any): string {
        let lefttext = ""
        if (left.prefix) lefttext += left.prefix[0].text
        if (left.name) lefttext += left.name.text
        if (left.suffix) {
            for (let v = 0; v < left.suffix.length; v++) {
                if (left.suffix[v].type == "Redirect") {
                    lefttext += left.suffix[v].op.text + left.suffix[v].file.text
                    continue
                }
                let t = left.suffix[v].text
                if ((left.suffix[v].type == "Word") && (left.suffix[v].expansion)) {
                    if (left.suffix[v].expansion[0].type == "ParameterExpansion") {
                        let strbegin = t.substring(0, left.suffix[v].expansion[0].loc.start);
                        let strend = t.substring(left.suffix[v].expansion[0].loc.end + 1, t.length);
                        t = strbegin + "$" + left.suffix[v].expansion[0].parameter + strend
                    }
                }
                lefttext += t
            }
        }
        return lefttext
    }
    public convertFor(command: any): string {
        let text = ""
        let i

        if (command.paren) {
            text += "for ( ; ; )"
            text += "{\n"
            //text += "set_env(\"" + command.name.text + "\", vals[i]);\n"
            const cmds = this.convertCommand(command.do);
            text += cmds + ";\n";
            text += "};\n"
            return text;
        }
        if (command.clause) {
            let text = ""
            if (command.clause.commands[0].type == "Subshell") {
                if (command.clause.commands.length != 1)
                    this.terminate(command)
                if (command.clause.commands[0].list.commands[0].list.commands.length != 3)
                    this.terminate(command)
                const left = command.clause.commands[0].list.commands[0].list.commands[0]
                const mid = command.clause.commands[0].list.commands[0].list.commands[1]
                const right = command.clause.commands[0].list.commands[0].list.commands[2]
                let lefttext = this.extractForParam(left)
                try {
                    let arithmeticAST
                    arithmeticAST = babylon.parse(lefttext);
                    lefttext = this.convertArithmeticExpansion(left, lefttext, arithmeticAST.program.body[0].expression)
                } catch (err) {
                    throw new SyntaxError(`Cannot parse arithmetic expression "${lefttext}": ${err.message}`);
                }                

                //let midtext = mid.name.text + mid.suffix[0].op.text + mid.suffix[0].file.text
                let midtext = this.extractForParam(mid)
                try {
                    let arithmeticAST
                    arithmeticAST = babylon.parse(midtext);
                    midtext = this.convertArithmeticExpansion(mid, midtext, arithmeticAST.program.body[0].expression)
                } catch (err) {
                    throw new SyntaxError(`Cannot parse arithmetic expression "${midtext}": ${err.message}`);
                }

                let righttext = this.extractForParam(right)
                try {
                    let arithmeticAST
                    arithmeticAST = babylon.parse(righttext);
                    righttext = this.convertArithmeticExpansion(right, righttext, arithmeticAST.program.body[0].expression)
                } catch (err) {
                    throw new SyntaxError(`Cannot parse arithmetic expression "${midtext}": ${err.message}`);
                }
                text += "{\n"
                text += "for (" + lefttext + "; " + midtext + "; " + righttext + ")"
                text += "{\n"
                //text += "set_env(\"" + command.name.text + "\", vals[i]);\n"
                const cmds = this.convertCommand(command.do);
                text += cmds + ";\n";
                text += "};\n"
                text += "}\n"
            }
            return text;
        }

        text += "{\n"
        let [t, countstr, vector] = this.convertRangeExpansion(command.wordlist)
        text += t
        text += countstr
        text += "for (int i =0; i < length; i++)"
        text += "{\n"
        if (vector)
            text += "setenv(\"" + command.name.text + "\", vals[i].c_str(), 1);\n"
        else
            text += "setenv(\"" + command.name.text + "\", vals[i], 1);\n"
        const cmds = this.convertCommand(command.do);
        text += cmds + ";\n";
        text += "};\n"
        text += "}\n"
        return text
    }

    public replaceAll(pattern: any, from: any, to: any): string {
        const pieces = pattern.split(from);
        pattern = pieces.join(to);
        return pattern
    }

    public convertCase(command: any): string {
        let clause = this.convertCommand(command.clause)
        let text = ""

        if (!command.clause.expansion) {
            clause = "\"" + clause + "\""
        }

        text += "{\n"
        text += "const std::string clause( " + clause + ");\n"

        for (let i = 0; i < command.cases.length; i++) {
            const body = command.cases[i].body ? this.convertCommand(command.cases[i].body) : ""

            for (let p = 0; p < command.cases[i].pattern.length; p++) {
                let pattern = this.convertCommand(command.cases[i].pattern[p])

                if (!command.cases[i].pattern[p].expansion) {
                    pattern = "\"" + pattern + "\""
                }

                if ((i == 0) && (p == 0))
                    text += "if"
                else
                    text += "else if"

                pattern = this.replaceAll(pattern, "*", ".*")
                text += "(regexmatch(clause, \"^\" + std::string(" + pattern + ") + \"$\")) { \n"
                text += body + ";\n"
                text += "}\n"
            }
        }
        text += "}\n"
        return text
    }
    public convertUntil(command: any): string {
        if (command.clause.commands.length != 1)
            this.terminate(command)
        const [clause, thenval, ] = this.convertIfStatement(command, command.clause.commands[0], command.do)

        let text = ""
        text += "do {\n"
        text += thenval
        text += "} while( !(" + clause + ")); \n"

        return text
    }

    public convertWhile(command: any): string {
        if (command.clause.commands.length != 1)
            this.terminate(command)
        const [clause, thenval, ] = this.convertIfStatement(command, command.clause.commands[0], command.do)

        let text = ""
        let maintext = ""
        maintext += "while ( "
        if (command.redirections) {
            let file = this.convertCommand(command.redirections[0].file)
            // maintext += " fileexists(" + file + ") && "
        }
        maintext += clause + ") {\n"
        maintext += thenval
        maintext += "\n}\n"

        if (command.redirections && command.redirections.length != 1)
            this.terminate(command)
        text += this.convertStdRedirects(command.redirections, 0, maintext)
        return text
    }
    public convertRedirect(command: any): string {
        if (0)
        {
            let file = this.convertCommand(command.file)

            if (!command.file.expansion)
                file = "\"" + file
            else
                file += "+\""
            return "\" + std::string(\"" + command.op.text + "\") + " + file;
        }
        {
            let file = command.file ? this.convertCommand(command.file) : ""
            let numberIo = command.numberIo ? this.convertCommand(command.numberIo) : ""
            let op = command.op.text
            let text = ""
            //text += "\" + std::string(\"" + command.op.text + "\") + " + file;
            text += numberIo + op + file
            return text
        }
    }
    public convertCompoundList(command: any): string {
        let maintext = command.commands.map(c => this.convertCommand(c)).join(';\n');
        let redirecttext = maintext
        if (command.redirections) {
            for (let i = 0; i < command.redirections.length; i++) {
                if ((command.redirections[i].type == "Redirect")) {
                    redirecttext = this.convertStdRedirects(command.redirections, i, redirecttext)
                }
            }
        }
        return redirecttext
    }

    public isBuiltinFunction(name: any, suffixarray: any) {
        let sarray = suffixarray
        if (name && (name.text == "!") && sarray.length > 0) {
            name = suffixarray[0]
        }
        if (!name)
            return false;
        for (let v = 0; v < this.builtindefs.length; v++) {
            let func = this.builtindefs[v]
            if (func == name.text) {
                return true;
            }
        }
        return false;
    }

    public isKnownFunction(name: any, suffixarray: any) {
        let sarray = suffixarray
        if (name && (name.text == "!") && sarray.length > 0) {
            name = suffixarray[0]
        }
        if (!name)
            return false;
        for (let v = 0; v < this.functiondefs.length; v++) {
            let func = this.functiondefs[v][0].name.text
            if (func == name.text) {
                return true;
            }
        }
        return false;
    }

    public handleKnownFunctions(name: any, suffixarray: any) {
        let sarray = suffixarray
        let startindex = 0
        if ((name.text == "!") && sarray.length > 0) {
            name = suffixarray[0]
            startindex = 1
        }
        for (let v = 0; v < this.functiondefs.length; v++) {
            let func = this.functiondefs[v][0].name.text
            if (func == name.text) {
                let text = ""
                let length = 0
                if (sarray) {
                    length = sarray.length
                    for (let s = startindex; s < sarray.length; s++) {
                        let suf = this.convertCommand(sarray[s])
                        if (!sarray[s].expansion)
                            suf = '"' + suf + '"'
                        else if (sarray[s].expansion[0].type == "ArithmeticExpansion")
                            suf = "std::to_string(" + suf + ")"

                        text += suf
                        if (s != (sarray.length - 1))
                            text += ","
                    }
                }
                return name.text + "({" + text + "})"
            }
        }
        return ""
    }

    public handleWait(command: any, name: any, suffixarray: any, suffixprocessed: any, issuesystem: any): string {
        return "wait()"
    }

    public handleSource(command: any, name: any, suffixarray: any, suffixprocessed: any, issuesystem: any): string {
        return "source(" + suffixprocessed + ")"
    }
    public handleLocal(command:any, name: any, suffixarray: any, suffixprocessed: any, issuesystem: any): string {
        let vals = suffixarray[0].text.split('=')
        let text = ""
        for (let s = 0; s < command.suffix.length; s++) {
            let [key, variableValue, needsquote] = this.getAssignmentPair(command.suffix[s])
            if (needsquote)
                variableValue = "\"" + variableValue + "\""


            if (vals.length > 1) {
                text += "scopedvariable var" + key + "(\"" + key + "\", " + variableValue + ")"
            } else {
                text += "scopedvariable var" + key + "(\"" + key + "\")"
            }
        }
        return text
    }

    public handleCommands(command:any, name: any, suffixarray: any, suffixprocessed: any, issuesystem: any, collectresult: any = true, pipeline: any) {
        let nametext = this.convertCommand(name)
        if (nametext[0] == '"' && nametext[nametext.length - 1] == '"') {
            nametext = nametext.substring(1, nametext.length - 2)
         }
        let nameexpanded = false
        if (name.expansion && name.expansion[0].loc.start >= 0) {
            nameexpanded = true
        }
        let t = this.handleKnownFunctions(name, suffixarray)
        if (t)
            return t

        switch (name.text) {
            case 'exit':
                {
                    const retval = suffixprocessed ? "mystoi(std::string_view(" + suffixprocessed + "))" : "mystoi(getenv(\"?\"))"
                    return "bashexit(" + retval + ")"
                }
            case '.':
            case 'source':
                {
                    return this.handleSource(command,name, suffixarray, suffixprocessed, issuesystem)
                }
            case 'local':
                {
                    return this.handleLocal(command,name, suffixarray, suffixprocessed, issuesystem)
                }
            case 'wait':
                {
                    return this.handleWait(command,name, suffixarray, suffixprocessed, issuesystem)
                }
            case 'break':
                return "break"
            case 'continue':
                return "continue"
            case 'return':
                {
                    const retval = suffixprocessed ? "std::string(" + suffixprocessed + ")" : "get_env(\"?\")"
                    return "return " + retval
                }
            case 'set':
                return '';
            case 'read':
                return "readval(" + suffixprocessed + ")"
            case ':':
                return ""
            case 'echo':
                {
                    let text = ""
                    if ((suffixprocessed.substring(0, 2) == "\"'") && (suffixprocessed.substring(suffixprocessed.length - 2, suffixprocessed.length) == "'\"")) {
                        suffixprocessed = '"' + suffixprocessed.substring(2, suffixprocessed.length - 2) + '"'
                    }
                    if ((suffixprocessed.substring(0, 1) == "'") && (suffixprocessed.substring(suffixprocessed.length - 1, suffixprocessed.length) == "'")) {
                        suffixprocessed = suffixprocessed.substring(1, suffixprocessed.length - 1)
                    }

                    if (issuesystem) {
                        text += "echo("

                        if (suffixprocessed)
                            text += suffixprocessed
                        else
                            text += "\"\""

                        text += ")"
                        return text
                    }
                }
            case 'printf':
                {
                    let text = ""
                    if ((suffixprocessed.substring(0, 2) == "\"'") && (suffixprocessed.substring(suffixprocessed.length - 2, suffixprocessed.length) == "'\"")) {
                        suffixprocessed = '"' + suffixprocessed.substring(2, suffixprocessed.length - 2) + '"'
                    }
                    if ((suffixprocessed.substring(0, 1) == "'") && (suffixprocessed.substring(suffixprocessed.length - 1, suffixprocessed.length) == "'")) {
                        suffixprocessed = suffixprocessed.substring(1, suffixprocessed.length - 1)
                    }

                    if (issuesystem) {
                        text += "printf("

                        if (suffixprocessed)
                            text += suffixprocessed
                        else
                            text += "\"\""

                        text += ")"
                        return text
                    }
                }
            // falls through
            case 'cd':
                {
                    let text = ""

                    if (issuesystem) {
                        text += "cd("

                        if (suffixprocessed)
                            text += suffixprocessed
                        else
                            text += "\"\""

                        text += ")"
                        return text
                    }
                }
            // falls through
            default:
                {
                    let text = ""
                    if (issuesystem) {
                        if (pipeline)
                            text += ""
                        else if (!collectresult)
                            text += "execnoresult("
                        else
                            text += "exec("
                    }
                    text += this.handleExec(issuesystem, nameexpanded, suffixarray, suffixprocessed, nametext)
                    if (issuesystem) {
                        if ((nametext == "printf") || (nametext == "echo")) {
                            text += ")"
                        } else {
                            if (pipeline)
                                text += ""
                            else if (!collectresult) {
                                text += ")"
                            }
                            else {
                                text += ")"
                            }
                        }
                    }
                    return text
                }
        }
    }

    public handleExec(issuesystem: any, nameexpanded: any, suffixarray: any, suffixprocessed: any, nametext: any) {
        let text = ""

        let expanded = false
        if (nameexpanded) {
            expanded = true
        }
        if (suffixarray) {
            for (let v = 0; v < suffixarray.length; v++) {
                if (suffixarray[v].expansion) {
                    expanded = true
                    break
                }
            }
        }

        if (expanded) {
            if (!nameexpanded) {
                text += "std::string("
                text += "\""
            }
            else
                text += ""
            text += nametext
            if (suffixprocessed) {
                if (!nameexpanded)
                    suffixprocessed = "\") + " + suffixprocessed
                else
                    suffixprocessed = "+ \" \"" + " + " + suffixprocessed
            }
            if (suffixprocessed)
                text += " " + suffixprocessed
            else if (!nameexpanded) {
                text += "\")"
            }
            else
                text += ""

        } else {
            if (!suffixprocessed)
                suffixprocessed = ""

            if (suffixprocessed[0] == '"')
                suffixprocessed = suffixprocessed.substr(1)
            if (suffixprocessed[suffixprocessed.length - 1] == '"')
                suffixprocessed = suffixprocessed.substr(0, suffixprocessed.length - 1)

            suffixprocessed = this.escapeDoubleQuotes(suffixprocessed)
            if (!nameexpanded)
                text += "\""
            else
                text += ""

            if (nametext[nametext.length - 1] == '"')
                nametext = nametext.substring(0, nametext.length - 1)
            if (nametext[0] == '"')
                nametext = nametext.substring(1)

            text += nametext
            text += " " + suffixprocessed + '"'
        }

        return text
    }

    public trimTrailingSpaces(suffix: any) {
        if (suffix) {
            if (suffix.length > 1) {
                if (suffix[suffix.length - 1] == "\"" && suffix[suffix.length - 2] == " ") {
                    suffix = suffix.slice(0, -1)
                    suffix = suffix.trim()
                    suffix += "\""
                }
            }
        }
        return suffix
    }

    public convertNonExecRedirects(command: any, maintext: any): string {
        let text = ""
        let currentlength = this.redirects.length
        for (let v = 0; v < this.redirects.length; v++) {
            if (this.redirects[v][0] == command)
                return "redirects" + v.toString() + "(" + maintext + ")"
        }
        this.redirects.push([command, this.currentrowstart, this.currentrowend])
        return "redirects" + currentlength.toString() + "(" + maintext + ")"
    }

    public convertExecCommand(command: any, issuesystem: any , handlecommands: any ,
                              coordinate = [], stdout: any , async: any , collectresults: any, pipeline:any ): string {
        let currentline = ""
        let currentstr = ""
        if (command.async && async) {
            let text = ""
            let index = this.asyncs.length
            let found = false
            for (let v = 0; v < this.asyncs.length; v++) {
                if (this.asyncs[v][0] == command) {
                    index = v
                    found = true
                    break
                }
            }
            if (!found)
                this.asyncs.push([command, this.currentrowstart, this.currentrowend])
            text += "asyncs" + index.toString() + "();\n"
            return text
        }
        if (coordinate.length > 0) {
            currentline = this.lines[coordinate[0].row - 1]
        } else {
            currentline = this.lines[this.currentrowstart.row - 1]
        }
        if (command.prefix && command.prefix.length && (!command.name || !command.name.text)) {
            return command.prefix.map(c => this.convertCommand(c)).join(';\n');
        }
        if (command.name && command.name.text) {
            let nametext = this.convertCommand(command.name)
            let ignoreRedirects = true
            if (nametext == "exec")
                ignoreRedirects = false
            let [suffix,] = command.suffix ? this.convertExpansion(command.suffix, ignoreRedirects, currentline) : ["", false];
            let lastnonexpanded = false
            if ((suffix != "") && (suffix[suffix.length - 1] != "\"")) {
                for (let i = command.suffix.length - 1; i >= 0; i--) {
                    if (command.suffix[i].type == "Redirect")
                        continue
                    if (!command.suffix[i].expansion) {
                        lastnonexpanded = true
                    }
                    break;
                }
            }
            if (lastnonexpanded)
                suffix += "\""
            //suffix = this.trimTrailingSpaces(suffix)
            let redirecttext = ""
            if (command.suffix && ignoreRedirects) {
                const maintext = this.handleCommands(command, command.name, command.suffix, suffix, issuesystem, collectresults, pipeline)
                redirecttext = maintext
                for (let i = 0; i < command.suffix.length; i++) {
                    if ((command.suffix[i].type == "Redirect")) {
                        redirecttext = this.convertStdRedirects(command.suffix, i, redirecttext)
                    }
                }
            }

            if (issuesystem && (redirecttext != "")) {
                return redirecttext
            }

            if (handlecommands) {
                let t = this.handleCommands(command, command.name, command.suffix, suffix, issuesystem, collectresults, pipeline)
                let hasRedirect = false
                if (command.suffix) {
                    for (let i = 0; i < command.suffix.length; i++) {
                        if ((command.suffix[i].type == "Redirect")) {
                            hasRedirect = true;
                            break;
                        }
                    }
                }
                if (hasRedirect)
                    return this.convertNonExecRedirects(command, t)
                return t
            }
            else {
                let t = this.handleKnownFunctions(command.name, command.suffix)
                if (t)
                    return t
                return suffix
            }
        }
        if (command.type == "Pipeline") {
            return this.convertPipeline(command, stdout)
        }
        this.terminate(command)
    }

    public convertArray(command: any): string {
        let text = command.items.map(c => this.convertCommand(c)).join(' ');
        let cmd = command.text.split('=')[0]
        return "set_env(\"" + cmd + "\", \"" + text + "\")"
    }
    public convertPipeline(command: any, stdout : any = true): string {
        let text = ""
        let currentlength = this.pipelines.length
        for (let v = 0; v < this.pipelines.length; v++) {
            if (this.pipelines[v][0] == command)
                return "pipeline" + v.toString() + "(" + stdout + ")"
        }
        let row = this.currentrowstart
        let col = this.currentrowend
        if (command.loc) {
            row = command.loc.start.row > this.currentrowstart.row ? command.loc.start : this.currentrowstart
            col = command.loc.end.row > this.currentrowend.row ? command.loc.end : this.currentrowend
        }
        this.pipelines.push([command, row, col])

        text += "pipeline" + currentlength.toString() + "(" + stdout + ")"
        return text
    }

    /* 
     * example: value=$(echo $a) 
     */
    public convertCommandExpansion(command: any): string {
        if (!command.commandAST)
            this.terminate(command)

        if (command.commandAST.type != "Script")
            this.terminate(command)

        let text = ""
        let pipeline = false
        let isinternal = false
        let isbuiltin = false
        if (command.loc.start >= 0 && command.loc.end > 0) {
            if (command.commandAST.commands.length != 1)
                this.terminate(command.commandAST.commands)

            for (let i = 0; i < command.commandAST.commands.length; i++) {
                let async = true
                if (command.commandAST.commands[0].type == "Pipeline") {
                    async = false
                    pipeline = true
                }
                const issuesystem = false
                const handlecommands = true
                const stdout = false
                const collectresults = true
                text += this.convertExecCommand(command.commandAST.commands[i], issuesystem, handlecommands, [], stdout, async, collectresults, pipeline)

                if (this.isKnownFunction(command.commandAST.commands[i].name, command.commandAST.commands[i].suffix)) {
                    isinternal = true;
                }
                if (this.isBuiltinFunction(command.commandAST.commands[i].name, command.commandAST.commands[i].suffix)) {
                    isbuiltin = true;
                }
            }
            if (!pipeline) {
                if (isinternal) {
                    text = "execinternal(" + command.commandAST.commands[0].name.text + ")"
                }
                else if (isbuiltin) {
                    let ignoreRedirects = true
                    if (command.commandAST.commands[0].name.text == "exec")
                        ignoreRedirects = false

                    let currentline = this.lines[this.currentrowstart.row - 1]
                    let [suffix,] = command.commandAST.commands[0].suffix ? this.convertExpansion(command.commandAST.commands[0].suffix, ignoreRedirects, currentline) : ["", false];
                    text = "execbuiltin(" + command.commandAST.commands[0].name.text + ", " + suffix + ")"
                } else {
                    text = "execnoout(" + text + ")"
                }
            }
        }
        return text;
    }

    private handleParameterCase(str: any): string {
        let text = ""
        if ((str.length > 1) && (str.indexOf("^^") != -1) && (str.indexOf("^^") == (str.length - 2))) {
            str = str.substring(0, str.length - 2)
            text = "get_env(\"" + str + "\")";
            text = "upper(" + text + ")"
        }
        else if ((str.length > 0) && (str.indexOf("^") != -1) && (str.indexOf("^") == (str.length - 1))) {
            str = str.substring(0, str.length - 1)
            text = "get_env(\"" + str + "\")";
            text = "uppercapitalize(" + text + ")"
        }
        else if ((str.length > 1) && (str.indexOf(",,") != -1) && (str.indexOf(",,") == (str.length - 2))) {
            str = str.substring(0, str.length - 2)
            text = "get_env(\"" + str + "\")";
            text = "lower(" + text + ")"
        }
        else if ((str.length > 0) && (str.indexOf(",") != -1) && (str.indexOf(",") == (str.length - 1))) {
            str = str.substring(0, str.length - 1)
            text = "get_env(\"" + str + "\")";
            text = "lowercapitalize(" + text + ")"
        }
        else {
            text = "get_env(\"" + str + "\")";
        }
        return text
    }

    public convertParameterExpansion(command: any, uppertext: any): string {
        if (command.loc.start >= 0 && command.loc.end > 0) {
            if ((command.op) && (command.op == "caseChange")) {
                if (command.globally == true) {
                    let text = ""
                    if (command.case == "upper")
                        text += "upper(get_env(\"" + command.parameter + "\"))"
                    else
                        text += "lower(get_env(\"" + command.parameter + "\"))"
                    return text
                } else {
                    let text = ""
                    if (command.case == "upper")
                        text += "uppercapitalize(get_env(\"" + command.parameter + "\"))"
                    else
                        text += "lowercapitalize(get_env(\"" + command.parameter + "\"))"
                    return text
                }
            }
            if ((command.op) && (command.op == "substring") || (command.op == "assignDefaultValueIfUnset") || (command.op == "indicateErrorIfUnset")|| (command.op == "useDefaultValueIfUnset")|| (command.op == "useAlternativeValueIfUnset")) {
                if (command.length) {
                    let length = command.length
                    let offset = command.offset

                    if (offset < 0)
                        offset = "get_env(\"" + command.parameter + "\").length() " + offset

                    if (length < 0)
                        length = "get_env(\"" + command.parameter + "\").length() " + length + " - " + offset

                    return "get_env(\"" + command.parameter + "\").substr(" + offset + "," + length + ")";
                }
                else {
                    let offset = command.offset
                    if (isNaN(offset)) {
                        let offset = uppertext.indexOf(command.parameter)
                        let ops = [":-", ":=", ":+", "+", ":?", "?", "-", "="]
                        let op = ""
                        for (let v = 0; v < ops.length; v++) {
                            if (uppertext.indexOf(ops[v]) != -1) {
                                op = ops[v]
                                break;
                            }
                        }
                        let altvalue = uppertext.substring(offset + command.parameter.length + op.length, command.loc.end)

                        // ${VAR:=STRING}	If VAR is empty or unset, set the value of VAR to STRING.
                        if (op == ":=")
                            return "set_env_ifempty(\"" + command.parameter + "\",\"" + altvalue + "\")"

                        // ${VAR=STRING}	If VAR is unset, set the value of VAR to STRING.
                        if (op == "=")
                            return "set_env_ifunset(\"" + command.parameter + "\",\"" + altvalue + "\")"

                        // ${VAR:-STRING}	If VAR is empty or unset, use STRING as its value.
                        if (op == ":-")
                            return "envempty(\"" + command.parameter + "\") ? \"" + altvalue + "\" : get_env(\"" + command.parameter + "\")"

                        // ${VAR-STRING}	If VAR is unset, use STRING as its value.
                        if (op == "-")
                            return "!envset(\"" + command.parameter + "\") ? \"" + altvalue + "\" : get_env(\"" + command.parameter + "\")"

                        // ${VAR:+STRING}	If VAR is not empty, use STRING as its value.
                        if (op == ":+")
                            return "!envempty(\"" + command.parameter + "\") ? \"" + altvalue + "\" : \"\""

                        // ${VAR+STRING}	If VAR is set, use STRING as its value.
                        if (op == "+")
                            return "envset(\"" + command.parameter + "\") ? \"" + altvalue + "\" : \"\""

                        // ${VAR:?STRING}	Display an error if empty or unset.
                        if (op == ":?")
                            return "envempty(\"" + command.parameter + "\") ? \"" + "value unset" + "\" : \"\""

                        // ${VAR?STRING}	Display an error if unset.
                        if (op == "?")
                            return "!envset(\"" + command.parameter + "\") ? \"" + "value unset" + "\" : \"\""

                        this.terminate(command)
                    }
                    if (offset < 0)
                        offset = "get_env(\"" + command.parameter + "\").length() " + offset

                    return "get_env(\"" + command.parameter + "\").substr(" + offset + ",  std::string::npos)";
                }
            }
            if (typeof command.parameter != "number") {
                if (command.parameter && (command.parameter.indexOf("[@]") >= 0)) {
                    if (command.parameter.indexOf("#") == 0) {
                        let prm = command.parameter
                        prm = prm.substring(1)
                        return "std::to_string(split(get_env(\"" + this.replaceAll(prm, "[@]", "") + "\")).size())"
                    }
                    else
                        return "get_env(\"" + this.replaceAll(command.parameter, "[@]", "") + "\")"
                }
                if (command.parameter && (command.parameter.indexOf("[") >= 0) && (command.parameter.indexOf("]") >= 0)) {
                    let leftbracket = command.parameter.indexOf("[")
                    let rightbracket = command.parameter.indexOf("]")
                    if (leftbracket < rightbracket) {
                        let index = command.parameter.substring(leftbracket + 1, rightbracket)
                        let noindexprm = this.replaceAll(command.parameter, "[" + index + "]", "")
                        if (index != "*")
                            return "split(get_env(\"" + noindexprm + "\"))[" + index + "]"
                        else
                            return "ifscombine(split(get_env(\"" + noindexprm + "\"), false))"
                    }
                }
            }

            return this.handleParameterCase(command.parameter)
        }
        else {
            return '';
        }
    }

    public convertCommand(command: any, uppertext: any = ""): string {
        if (command.loc && command.loc.start && command.loc.start.row) {
            this.currentrowstart = command.loc.start
            this.currentrowend = command.loc.end
        }
        switch (command.type) {
            case 'LogicalExpression':
                return this.convertLogicalExpression(command);
            case 'ArithmeticExpansion':
                return this.convertArithmeticExpansion(command, command.expression, command.arithmeticAST);
            case 'If':
                return this.convertIf(command);
            case 'ParameterExpansion':
                return this.convertParameterExpansion(command, uppertext);
            case 'CommandExpansion':
                return this.convertCommandExpansion(command);
            case 'Function':
                return this.convertFunction(command);
            case 'Word':
            case 'Name':
                return this.convertWord(command);
            case 'AssignmentWord':
                return this.convertAssignment(command);
            case 'Command': {
                const issuesystem = true
                const handlecommands = true
                const coordinate = []
                const stdout = true
                const async = true
                const collectresults = true
                const pipeline = false
                return this.convertExecCommand(command, issuesystem, handlecommands, coordinate, stdout, async, collectresults, pipeline);
            }
            case 'CompoundList':
                return this.convertCompoundList(command);
            case 'Redirect':
                return this.convertRedirect(command);
            case 'While':
                return this.convertWhile(command);
            case 'Until':
                return this.convertUntil(command);
            case 'Case':
                return this.convertCase(command);
            case 'For':
                return this.convertFor(command);
            case 'Subshell':
                return this.convertSubshell(command);
            case 'io_number':
                return this.convertIoNumber(command);
            case 'Pipeline':
                return this.convertPipeline(command);
            case 'Array':
                return this.convertArray(command);
        }
        this.terminate(command)
    }

    public getFunctionPrototypes(): string {
        if (this.functiondefs) {
            let text = ""
            for (let v = 0; v < this.functiondefs.length; v++) {
                let command = this.functiondefs[v][0]
                text += "const std::string " + this.convertCommand(command.name) + "(const std::initializer_list<std::string> &list);\n"
            }
            return text ? "\n\n" + text + "\n\n" : ""
        }
        return ""
    }

    public getFunctionDefinitions(): string {
        if (this.functiondefs) {
            let text = ""
            for (let v = 0; v < this.functiondefs.length; v++) {
                let command = this.functiondefs[v][0]
                let maxargs = 0
                maxargs = this.maxReferredArgs(command.body, maxargs)
                text += this.convertOneFunction(this.convertCommand(command.name), this.convertCommand(command.body), maxargs)
            }
            return text ? "\n\n" + text + "\n\n" : ""
        }
        return ""
    }

    public getRedirectDefinitions(): string {
        if (this.redirects) {
            let text = ""
            for (let v = 0; v < this.redirects.length; v++) {
                let name = "redirects" + v

                text += "const std::string " + name + "(const std::string_view &str) {\n"
                let redir = "execnoout(str);\n"
                for (let r = this.redirects[v][0].suffix.length - 1; r >= 0; r--) {
                    if (this.redirects[v][0].suffix[r].type == "Redirect") {
                        redir = this.convertStdRedirects(this.redirects[v][0].suffix, r, redir)
                    }
                }
                text += redir
                text += "return \"\";\n"
                text += "}\n"
                text += "\n"
            }
            return text ? "\n\n" + text + "\n\n" : ""
        }
        return ""
    }

    public getAsyncDefinitions(prototype = false): string {
        if (this.asyncs) {
            let text = ""
            for (let v = 0; v < this.asyncs.length; v++) {
                let name = "asyncs" + v
                const issuesystem = true
                const handlecommands = true
                const stdout = true
                const async = false 
                const collectresults = true
                const pipeline = false
                let maintext = this.convertExecCommand(this.asyncs[v][0], issuesystem, handlecommands, [this.asyncs[v][1], this.asyncs[v][2]], stdout, async, collectresults, pipeline)

                text += "void " + name + "(void)"
                if (prototype) {
                    text += ";\n"
                    continue
                }
                text += "{\n"
                text += "pid_t pid = fork();\n"
                text += "if (pid > 0) {return;}\n"
                let redir = maintext + ";\n"
                for (let r = this.asyncs[v][0].suffix.length - 1; r >= 0; r--) {
                    if (this.asyncs[v][0].suffix[r].type == "Redirect") {
                        redir = this.convertStdRedirects(this.asyncs[v][0].suffix, r, redir)
                    }
                }
                text += redir
                text += "exit(0);\n"
                text += "}\n"
                text += "\n"
            }
            if (text) {
                let waitfunc = "void wait()"
                if (!prototype)
                    waitfunc += "\n{\n" +
                    "    waitpid(-1, NULL, 0);\n" +
                    "}\n"
                else
                    waitfunc += ";\n"
                text += waitfunc
            }
            return text ? "\n\n" + text + "\n\n" : ""
        }
        return ""
    }

    public getPipelineDefinitions(): string {
        if (this.pipelines) {
            let text = ""
            for (let v = 0; v < this.pipelines.length; v++) {
                let name = "pipeline" + v

                text += "const std::string " + name + "(bool stdout = true) {\n"

                for (let c = 0; c < this.pipelines[v][0].commands.length; c++) {
                    let scope = "scope" + c.toString()
                    let redirectc = "redirectStream" + c.toString()
                    let previousc = c ? (c - 1): 0
                    let previousscope = "scope" + previousc.toString()
                    let func = "boost::process::pipe "
                    let pipe = "boost::process::ipstream "
                    let funcvariable = scope
                    //if (c == (this.pipelines[v][0].commands.length - 1)) {
                    //    funcvariable += "(stdout)"
                    //}
                    text += func + funcvariable + ";\n"
                    if (c == this.pipelines[v][0].commands.length - 1) {
                        text += pipe + "outpipe" + c.toString() + ";\n"
                    }
                    let coordinate = [this.pipelines[v][1], this.pipelines[v][2]]
                    let cmd = this.pipelines[v][0].commands[c]
                    if (cmd.name.text == "!") {
                        if (cmd.suffix) {
                            cmd.name = cmd.suffix[0]
                            cmd.suffix.shift()
                        } else {
                            this.terminate(cmd)
                        }
                    }
                    const issuesystem = true
                    const handlecommands = true
                    const stdout = true
                    const async = true
                    const collectresults = false
                    const pipeline = true
                    let hasRedirect = false
                    if (cmd.suffix) {
                        for (let i = 0; i < cmd.suffix.length; i++) {
                            if ((cmd.suffix[i].type == "Redirect")) {
                                hasRedirect = true;
                                break;
                            }
                        }
                    }
                    text += "std::vector<std::string> args" + c.toString() + ";\n"
                    text += "quotesplit(" + this.convertExecCommand(cmd, issuesystem, handlecommands, coordinate, stdout, async, collectresults, pipeline) + ", args" + c.toString() + ", false);\n"
                    text += "std::string prog" + c.toString() + "(args" + c.toString() + "[0]);\n"
                    text += "std::string path" + c.toString() + ";\n"
                    text += "if (prog" + c.toString() + ".find('/') != std::string::npos) path" + c.toString() + " = prog" + c.toString() + ";\n"
                    text += "else path" + c.toString() + " = boost::process::search_path(prog" + c.toString() + ").string();\n"
                    text += "args" + c.toString() + ".erase(args" + c.toString() + ".begin());\n"
                    if (!hasRedirect)
                        text += "boost::process::child " + "c" + c.toString() + "("
                    text += "path" + c.toString() + ", boost::process::args(args" + c.toString() +")"

                    if (c != 0) {
                        text += ",  boost::process::std_in < " + previousscope
                    }
                    if (c == this.pipelines[v][0].commands.length - 1) {
                        text += ",  boost::process::std_out > " + "outpipe" + c.toString()
                    } else {
                        text += ",  boost::process::std_out > " + scope
                    }
                    text += " )" + ";\n"
                    text += "\n"
                }
                text += "std::string outline;\n"
                text += "std::string line;\n"
                text += "while (" + "c" + (this.pipelines[v][0].commands.length - 1) + ".running() && std::getline(" + "outpipe" + (this.pipelines[v][0].commands.length - 1) + ", line))\n"
                text += "    outline += line;\n"
                text += "\n"

                for (let c = 0; c < this.pipelines[v][0].commands.length; c++) {
                    text += "c" + c.toString() + ".wait()" + ";\n"
                }
                text += "while (std::getline(" + "outpipe" + (this.pipelines[v][0].commands.length - 1) + ", line))\n"
                text += "    outline += line;\n"
                text += "\n"
                text += "if (!outline.empty()) std::cout << outline << std::endl;\n"
                //text += "if (stdout) std::cout << outline << std::endl;\n"
                text += "int exit_code = 0;\n"
                for (let c = 0; c < this.pipelines[v][0].commands.length; c++) {
                    text += "exit_code |= c" + c + ".exit_code();\n"
                }
                text += "set_env(\"?\", exit_code);\n"
                //let finalres = "scope" + (this.pipelines[v][0].commands.length - 1).toString() + ".buf().str()"
                //text += "if (stdout)\n"
                //text += "std::cout << " + finalres + ";\n"
                text += "return outline; \n"
                text += "}\n"
                text += "\n"
            }
            return text ? "\n\n" + text + "\n\n" : ""
        }
        else
            return "\n"
    }

    public getSupportDefinitions(): string {
        const fileexists = "\n\
        const int fileexists(const std::string_view &file) {\n\
            struct stat buf;                        \n\
            if (file == \"\") return true; \n\
                return (stat(file.data(), &buf) == 0);        \n\
        }\n\
        off_t filesize(const char* filename)\n\
        {\n\
			struct stat st;\n\
			if (stat(filename, &st)) return 0;\n\
			off_t size = st.st_size;\n\
            return size;\n\
        }\n\
        const int fileexists_sizenonzero(const std::string_view &file) {\n\
            if (fileexists(file)){        \n\
                return filesize(file.data()) != 0;\n\
            }\n\
            return 0;\n\
        }\n"

        const regularfileexists = "\n\
        const int regularfileexists(const std::string_view &file) {          \n\
            struct stat buf;                        \n\
            return fileexists(file) && (stat(file.data(), &buf) == 0) && S_ISREG(buf.st_mode);        \n\
        }\n"

        const pipefileexists = "\n\
        const int pipefileexists(const std::string_view &file) {          \n\
            struct stat buf;                        \n\
            if (file == \"\") return true; \n\
            return fileexists(file) && (stat(file.data(), &buf) == 0) && (buf.st_mode & S_IFIFO);        \n\
        }\n"

        const linkfileexists = "\n\
        const int linkfileexists(const std::string_view &file) {          \n\
            struct stat buf;                        \n\
            if (file == \"\") return true; \n\
            return fileexists(file) && (stat(file.data(), &buf) == 0) && S_ISLNK(buf.st_mode);        \n\
        }\n"

        const socketfileexists = "\n\
        const int socketfileexists(const std::string_view &file) {          \n\
            struct stat buf;                        \n\
            if (file == \"\") return true; \n\
            return fileexists(file) && (stat(file.data(), &buf) == 0) && S_ISSOCK(buf.st_mode);        \n\
        }\n"

        const blockfileexists = "\n\
        const int blockfileexists(const std::string_view &file) {          \n\
            struct stat buf;                        \n\
            if (file == \"\") return true; \n\
            return fileexists(file) && (stat(file.data(), &buf) == 0) && S_ISBLK(buf.st_mode);        \n\
        }\n"

        const charfileexists = "\n\
        const int charfileexists(const std::string_view &file) {          \n\
            struct stat buf;                        \n\
            if (file == \"\") return true; \n\
            return fileexists(file) && (stat(file.data(), &buf) == 0) && S_ISCHR(buf.st_mode);        \n\
        }\n"

        const fileexecutable = "\n\
        const int fileexecutable(const std::string_view &file) {          \n\
            struct stat buf;                        \n\
            if (file == \"\") return true; \n\
            return fileexists(file) && (stat(file.data(), &buf) == 0) &&  (buf.st_mode & S_IXUSR);        \n\
        }\n"

        const filewritable = "\n\
        const int filewritable(const std::string_view &file) {          \n\
            struct stat buf;                        \n\
            if (file == \"\") return true; \n\
            return fileexists(file) && (stat(file.data(), &buf) == 0) &&  (buf.st_mode & S_IWUSR);        \n\
        }\n"

        const filereadable = "\n\
        const int filereadable(const std::string_view &file) {          \n\
            struct stat buf;                        \n\
            if (file == \"\") return true; \n\
            return fileexists(file) && (stat(file.data(), &buf) == 0) &&  (buf.st_mode & S_IRUSR);        \n\
        }\n"

        const direxists = "\n\
        const int direxists(const std::string_view &file) {                                   \n\
            struct stat buf;                                                \n\
            if (file == \"\") return true; \n\
            return fileexists(file) && (stat(file.data(), &buf) == 0) && S_ISDIR(buf.st_mode);        \n\
        }\n"

        const envCommand = "\n\
        const int mystoi(const std::string_view &str, int defreturn = -1) { \n\
            if (!str.empty()) return std::stoi(str.data()); \n\
            return defreturn; \n\
        }\n\
        const int mystoiz(const char *str) { \n\
            if (str && (str[0] != 0)) return atoi(str); \n\
            return 0; \n\
        }\n\
        \n\
        const std::string get_env(const std::string_view &cmd) { \n\
            const char *env = getenv(cmd.data());\n\
            return env ? env : \"\"; \n\
        }\n\
        void get_env(std::string &envstr, const std::string_view &cmd) { \n\
            const char *env = getenv(cmd.data());\n\
            envstr = env ? env : \"\"; \n\
        }\n\
        \n\
        const int envexists_and_hascontent(const std::string_view &cmd) { \n\
            char *env = getenv(cmd.data()); \n\
            return env ? env[0] != '\\0' > 0 : 0; \n\
        }\n\
        \n\
        const int envempty(const std::string_view &cmd) { \n\
            char *env = getenv(cmd.data()); \n\
            return env ? env[0] == '\\0' : true; \n\
        }\n\
        const int envset(const std::string_view &cmd) { \n\
            char *env = getenv(cmd.data()); \n\
            return env ? true : false; \n\
        }\n\
        \n\
        const std::string_view set_env(const char *cmd, const std::string &value) { \n\
            if (value.back() == '\\n')\n\
                setenv(cmd, value.substr(0, value.length()-1).c_str(), 1);\n\
            else \n\
                setenv(cmd, value.c_str(), 1);\n\
            return \"\";\n\
        }\n\
        \n\
        const std::string_view set_env(const char *cmd, const float value) { \n\
            char c[64];\n\
            sprintf(c, \"%f\", value);\n\
            setenv(cmd, c, 1);\n\
            return \"\";\n\
        }\n\
        \n\
        const std::string_view set_env(const char *cmd, const int value) { \n\
            char c[64];\n\
            sprintf(c, \"%d\", value);\n\
            setenv(cmd, c, 1);\n\
            return \"\";\n\
        }\n\
        \n\
        void set_env(const char *cmd, const char value) { \n\
            char c[2];\n\
            c[0] = value;\n\
            c[1] = 0;\n\
            setenv(cmd, c, 1);\n\
        }\n\
        const std::string set_env_ifunset(const char *cmd, const std::string_view &value) {\n\
        \n\
            char *env = getenv(cmd); \n\
            if (!env) { setenv(cmd, value.data(), 1); return std::string(value.data()); } \n\
            return env;\n\
        }\n\
        const std::string set_env_ifempty(const char *cmd, const std::string_view &value) { \n\
            char *env = getenv(cmd); \n\
            if (!env) { setenv(cmd, value.data(), 1); return std::string(value);}\n\
            if (envempty(cmd)) { setenv(cmd, value.data(), 1); return std::string(value.data());}\n\
            return env;\n\
        }\n"

        const execCommand = "\n\
int createChild(int *outfd, char ** aArguments) {\n\
    int aStdinPipe[2];\n\
    int aStdoutPipe[2];\n\
    int nChild;\n\
    char nChar;\n\
    int nResult;\n\
\n\
    if (pipe(aStdinPipe) < 0) {\n\
        fprintf( stderr,\"%s:%d\\n\", __func__, __LINE__);\n\
        exit(-1);\n\
    }\n\
    if (pipe(aStdoutPipe) < 0) {\n\
        close(aStdinPipe[PIPE_READ]);\n\
        close(aStdinPipe[PIPE_WRITE]);\n\
        fprintf( stderr,\"%s:%d\\n\", __func__, __LINE__);\n\
        exit(-1);\n\
    }\n\
\n\
    nChild = fork();\n\
    if (0 == nChild) {\n\
        close(outfd[0]);\n\
        if (dup2(outfd[1], STDOUT_FILENO) == -1) {\n\
            fprintf( stderr,\"%s:%d\\n\", __func__, __LINE__);\n\
            exit(errno);\n\
        }\n\
\n\
        if (dup2(outfd[1], STDERR_FILENO) == -1) {\n\
            fprintf( stderr,\"%s:%d\\n\", __func__, __LINE__);\n\
            exit(errno);\n\
        }\n\
\n\
        close(aStdinPipe[PIPE_READ]);\n\
        close(aStdinPipe[PIPE_WRITE]);\n\
        close(aStdoutPipe[PIPE_READ]);\n\
        close(aStdoutPipe[PIPE_WRITE]);\n\
\n\
        nResult = execvpe(aArguments[0], &aArguments[0], environ);\n\
\n\
        exit(nResult);\n\
    } else if (nChild > 0) {\n\
        close(outfd[1]);\n\
        close(aStdinPipe[PIPE_READ]);\n\
        close(aStdoutPipe[PIPE_WRITE]);\n\
        close(aStdinPipe[PIPE_WRITE]);\n\
        close(aStdoutPipe[PIPE_READ]);\n\
\n\
        int rc;\n\
        if (waitpid(nChild, &rc, 0) != -1) {\n\
            if (WIFEXITED(rc)) {\n\
                nChild = WEXITSTATUS(rc);\n\
            }\n\
        }\n\
    } else {\n\
        close(aStdinPipe[PIPE_READ]);\n\
        close(aStdinPipe[PIPE_WRITE]);\n\
        close(aStdoutPipe[PIPE_READ]);\n\
        close(aStdoutPipe[PIPE_WRITE]);\n\
    }\n\
    return nChild;\n\
}\n\
\n\
void execcommand(int *outfd, const std::string_view &cmd, int & exitstatus) \n\
{\n\
    wordexp_t p;\n\
    char **w;\n\
    int ret;\n\
        \n\
    ret = wordexp(cmd.data(), &p, 0);\n\
    if (ret) {\n\
        fprintf( stderr,\"%s:%d\\n\", __func__, __LINE__);\n\
        exit(-1);\n\
     };\n\
    w = p.we_wordv;\n\
    exitstatus = createChild(outfd, &w[0]);\n\
    wordfree(&p);\n\
}\n\
        \n\
        const void writetoout(int *outfd, std::string &result, bool stdout, bool resultcollect) { \n\
            char nChar;\n\
            size_t available = 0;\n\
            if (read(outfd[0], &nChar, 1) == 1) {\n\
                ioctl(outfd[0], FIONREAD, &available);\n\
                if (resultcollect) {\n\
                    if (available) result.resize(available + 1);\n\
					result[0] = nChar;\n\
					if (available && read(outfd[0], &result[1], available) < 0) {\n\
						fprintf( stderr,\"%s:%d\\n\", __func__, __LINE__);\n\
						exit(-1);\n\
					}\n\
                    if (stdout) std::cout << result; \n\
                }\n\
                else if (stdout) {\n\
                    const int bufsize = 4096;\n\
                    char databuf[bufsize + 1];\n\
                    databuf[bufsize] = 0;\n\
					if (stdout)\n\
						std::cout << nChar;\n\
					\n\
					int count = available / bufsize;\n\
                    while (count) {\n\
                        if (read(outfd[0], &databuf[0], bufsize) < 0) break;\n\
                        std::cout << databuf;\n\
                        count--;\n\
                    }\n\
					int remaining = (available % bufsize);\n\
					if (remaining) {\n\
						if (read(outfd[0], &databuf[0], remaining) > 0) {\n\
						databuf[remaining] = 0;\n\
						if (stdout)\n\
							std::cout << databuf;\n\
						}\n\
					}\n\
                }\n\
            }\n\
            close(outfd[0]); \n\
        } \n\
        const int checkexec(const std::string_view &cmd) { \n\
            int exitstatus; \n\
            if (!cmd.empty()) {\n\
                std::string result;\n\
                int outfd[2];\n\
                if (pipe(outfd) < 0) {\n\
                    fprintf( stderr,\"%s:%d\\n\", __func__, __LINE__);\n\
                    exit(-1);\n\
                }\n\
                bool stdout = true;\n bool resultcollect = false;\n\
                execcommand(outfd, cmd, exitstatus);\n\
                writetoout(outfd, result, stdout, resultcollect);\n\
                set_env(\"?\", exitstatus);\n\
            } else {\n\
                exitstatus = mystoiz(getenv(\"?\"));\n\
            }\n\
            return exitstatus == 0; \n\
        }\n\
        const int checkknownexec(const std::string_view &cmd) { \n\
            int exitstatus; \n\
            if (!cmd.empty()) {\n\
                if (cmd == \"0\") return true;\n\
                if (cmd == \"1\") return false;\n\
            }\n\
            exitstatus = mystoiz(getenv(\"?\"));\n\
            return exitstatus == 0; \n\
        }\n\
        const int checkexitcode(const std::string &cmd) { \n\
            int exitstatus; \n\
            exitstatus = mystoiz(getenv(\"?\"));\n\
            return exitstatus == 0; \n\
        }\n\
        \n\
        const std::string exec(const std::string_view &cmd, bool  resultcollect = true) {\n\
            int exitstatus; \n\
            std::string result;\n\
            char nChar;\n\
            int outfd[2];\n\
            if (pipe(outfd) < 0) {\n\
                fprintf( stderr,\"%s:%d\\n\", __func__, __LINE__);\n\
                exit(-1);\n\
            }\n\
            execcommand(outfd, cmd, exitstatus);\n\
            writetoout(outfd, result, stdout, resultcollect);\n\
            set_env(\"?\", exitstatus);\n\
            return result; \n\
        }\n\
        \n\
        const void execnoresult(const std::string_view &cmd) {\n\
            int exitstatus; \n\
            std::string result;\n\
            char nChar;\n\
            int outfd[2];\n\
            if (pipe(outfd) < 0) {\n\
                fprintf( stderr,\"%s:%d\\n\", __func__, __LINE__);\n\
                exit(-1);\n\
            }\n\
            bool stdout = true;\n bool resultcollect = false;\n\
            execcommand(outfd, cmd, exitstatus);\n\
            writetoout(outfd, result, stdout, resultcollect);\n\
            set_env(\"?\", exitstatus);\n\
        }\n\
        \n\
        const std::string execnoout(const std::string_view &cmd, bool resultcollect = true) {\n\
            int exitstatus; \n\
            std::string result; \n\
            char nChar;\n\
            int outfd[2];\n\
            if (pipe(outfd) < 0) {\n\
                fprintf( stderr,\"%s:%d\\n\", __func__, __LINE__);\n\
                exit(-1);\n\
            }\n\
            bool stdout = false;\n\
            execcommand(outfd, cmd, exitstatus);\n\
            writetoout(outfd, result, stdout, resultcollect);\n\
            set_env(\"?\", exitstatus);\n\
            return result; \n\
        }\n"

        const splitCommand = "\n\
        void split(std::vector <std::string> &tokens, const std::string &str, std::string &delimiter)\n\
        {\n\
            // Vector of string to save tokens  \n\
            size_t pos = 0; \n\
            size_t prev = 0; \n\
            bool shifted = false; \n\
            if (str.front() == '\\\'') {prev++; shifted = true;}\n\
                                                \n\
            while ((pos = str.find_first_of(delimiter, prev)) != std::string::npos) {\n\
                if (pos > prev)\n\
                    tokens.emplace_back(str.substr(prev, pos-prev));\n\
                prev = pos+1;\n\
            }\n\
            if (prev < str.length()){\n\
                size_t end = str.length() - prev;\n\
                if ((str.back() == '\\\'') && shifted) end--;\n\
                tokens.emplace_back(str.substr(prev, end));\n\
            }\n\
        }\n\
        \n\
        const std::vector <std::string> split(const std::string_view &s, bool ifs = true) {\n\
            std::string delim(\" \\t\\n\"); \n\
            std::vector <std::string> elems;\n\
            const char *userdelim = getenv(\"IFS\");\n\
            if ((userdelim != NULL) && ifs)\n\
            {\n\
                delim = userdelim;\n\
            }\n\
            { \n\
                split(elems, std::string(s.data()), delim); \n\
            }\n\
            return elems;\n\
        }\n\
        const void quotesplit(const std::string_view &cmd, std::vector <std::string> &elems, bool ifs = true) {\n\
            wordexp_t p; \n\
            char **w; \n\
            if (wordexp(cmd.data(), &p, 0)) return; \n\
            for (int i = 0; i < p.we_wordc; i++)\n\
                elems.emplace_back(p.we_wordv[i]);\n\
            wordfree(&p);\n\
            for (auto &f : elems){\n\
                if ((f.front() == '\\'') && (f.back() == '\\'')) {\n\
                    f.erase(0, 1);\n\
                    f.erase(f.size() - 1);\n\
                }\n\
            } \n\
        }\n\
        void split(std::vector <std::string> &elems, const std::string_view &s, bool ifs= true) {\n\
            std::string delim(\" \\t\\n\"); \n\
            const char *userdelim = getenv(\"IFS\");\n\
            if ((userdelim != NULL) && ifs)\n\
            {\n\
                delim = userdelim;\n\
            }\n\
            { \n\
                split(elems, std::string(s.data()), delim); \n\
            }\n\
        }\n"

        const regexstr = "\n\
        const bool regexmatch(const std::string_view &subject, const std::string_view &pattern)\n\
        {\n\
            pcre *re;\n\
            const char *error;\n\
            int erroffset;\n\
            int ovector[30];\n\
            int subject_length;\n\
            int rc;\n\
            \n\
            subject_length = (int)subject.length();\n\
            \n\
            re = pcre_compile(pattern.data(), 0, &error, &erroffset, NULL); \n\
            if (re == NULL) return 0; \n\
                                        \n\
            rc = pcre_exec(re, NULL, subject.data(),           \n\
                subject_length, 0, PCRE_ANCHORED,               \n\
                ovector, sizeof(ovector) / sizeof(ovector[0])); \n\
                                                                \n\
            if (rc < 0) {                                       \n\
                pcre_free(re);                                  \n\
                return 0;                                       \n\
            }                                                   \n\
            pcre_free(re);                                      \n\
            return 1;                                           \n\
        }                                                       \n\
        \n\
        const bool isregexstring(const std::string_view &str)\n\
        {\n\
            if (str.find_first_of(\"*?\", 0) != std::string::npos)\n\
                return true;\n\
            return false;\n\
        }\n\
        \n\
        const std::vector<std::string> globvector(const std::string_view& pattern){\n\
            glob_t glob_result;\n\
            glob(pattern.data(), GLOB_TILDE, NULL,& glob_result);\n\
            std::vector <std::string> files;\n\
            files.reserve(glob_result.gl_pathc);\n\
            for (unsigned int i = 0; i < glob_result.gl_pathc; ++i) {\n\
                files.emplace_back(std::string(glob_result.gl_pathv[i]));\n\
            }\n\
            globfree(& glob_result);\n\
            return files;\n\
        }\n\
        void globvector(std::vector<std::string> &elems, const std::string_view& pattern){\n\
            glob_t glob_result;\n\
            glob(pattern.data(), GLOB_TILDE, NULL,& glob_result);\n\
            elems.reserve(glob_result.gl_pathc);\n\
            for (unsigned int i = 0; i < glob_result.gl_pathc; ++i) {\n\
                elems.emplace_back(std::string(glob_result.gl_pathv[i]));\n\
            }\n\
            globfree(& glob_result);\n\
        }\n\
        \n\
        const std::vector <std::string> regexsplit(const std::string_view &str)\n\
        {\n\
            if (isregexstring(str)) {\n\
                return globvector(str);\n\
            }\n\
            return split(str);\n\
        }\n\
        void regexsplit(std::vector <std::string> &list, const std::string_view &str)\n\
        {\n\
            if (isregexstring(str)) {\n\
                globvector(list, str);\n\
                return;\n\
            }\n\
            split(list, str);\n\
        }\n"

        const echostr = "\n\
        void echom(const std::string_view &str, size_t endoffset = std::string::npos)\n\
        {\n\
            size_t startoffset = 0;\n\
            bool endprint = true;\n\
            size_t offset = str.find(\"-n\"); \n\
            if (offset != std::string::npos) {\n\
                startoffset = 3;\n\
                endprint = false;\n\
            }\n\
            if (endprint && (endoffset == std::string::npos) && str.back() == ' ') {\n\
                endoffset = str.length() - 1;\n\
            }\n\
            while (endprint && endoffset && (endoffset != std::string::npos) && str[endoffset - 1] == ' ') {\n\
                endoffset--;\n\
            }\n\
            {\n\
                size_t initial_pos = startoffset;\n\
                size_t start_pos = startoffset;\n\
                int spacelen = std::string(\"  \").length();\n\
                while ((start_pos = str.find(\"  \", start_pos)) != std::string::npos) {\n\
                    std::cout << str.substr(initial_pos, start_pos - initial_pos) << \" \"; \n\
                    start_pos += spacelen; \n\
                    initial_pos = start_pos; \n\
                }\n\
                if (endoffset != std::string::npos)\n\
                    std::cout << str.substr(initial_pos, endoffset - initial_pos); \n\
                else \n\
                    std::cout << str.substr(initial_pos, endoffset); \n\
            }\n\
            if (endprint) std::cout << std::endl; \n\
            set_env(\"?\", 0);\n\
        }\n\
        \n\
        void echov(const std::string_view &str)\n\
        {\n\
            size_t endoffset = str.find_last_not_of(\"\\n\");\n\
            if (endoffset != std::string::npos) {\n\
                echom(str, endoffset + 1);\n\
            } else {\n\
                echom(str);\n\
            }\n\
        }\n\
        \n\
        const std::string ifscombine(const std::vector<std::string> &vec)\n\
        {\n\
            const std::string separator(get_env(\"IFS\"));\n\
            std::string str(\"\");\n\
            int vecsize = vec.size();\n\
            for (int i = 0; i < vecsize; i++) {\n\
                str += vec[i];\n\
                if (i != (vecsize - 1))\n\
                    str += separator;\n\
            }\n\
            return (str); \n\
        }\n\
auto format_vector(boost::format fmt, const std::vector<char *> &v) {\n\
    for(const auto &s : v) {\n\
        fmt = fmt % s;\n\
    }\n\
    return fmt;\n\
}\n\
        void printf(const std::string_view &str)\n\
        {\n\
            std::vector<char *> toks;\n\
            wordexp_t p;\n\
            char **w;\n\
            int ret;\n\
                \n\
            ret = wordexp(str.data(), &p, 0);\n\
            if (ret) {\n\
                fprintf( stderr,\"%s:%d\\n\", __func__, __LINE__);\n\
                exit(-1);\n\
             };\n\
            w = p.we_wordv;\n\
            toks.reserve(p.we_wordc);\n\
            for (int i = 0; i < p.we_wordc; i++) {\n\
                toks.emplace_back(w[i]);\n\
            }\n\
            boost::format fmt(toks[0]);\n\
            toks.erase(toks.begin());\n\
            std::stringstream outstr;\n\
            std::string strval(format_vector(fmt, toks).str());\n\
            std::vector <std::string> tokens;\n\
            std::string delim(\"\\\\n\"); \n\
            split(tokens, strval, delim);\n\
            for (auto &a : tokens)\n\
                std::cout << a << std::endl;\n\
            wordfree(&p);\n\
            set_env(\"?\", 0);\n\
        }\n\
        \n\
        void echo(const std::string_view &str)\n\
        {\n\
            echov(str); \n\
            set_env(\"?\", 0);\n\
        }\n\
        \n\
        void echo(const float value) {\n\
            std::cout << value << std::endl; \n\
            set_env(\"?\", 0);\n\
        }\n\
        \n\
        void echo(const int value) {\n\
            std::cout << value << std::endl; \n\
            set_env(\"?\", 0);\n\
        }\n"

        const readstr = "\n\
        const std::string readval(const std::string_view &var) {\n\
            std::string line;\n\
            if (!std::getline(std::cin, line)) {\n\
                set_env(\"?\", -1);\n\
                return \"\";\n\
            }\n\
            std::vector <std::string> tokens;\n\
            std::vector <std::string> keys;\n\
            split(keys, var);\n\
            tokens.reserve(keys.size());\n\
            split(tokens, line);\n\
            int tokensize = tokens.size();\n\
            int keysize = keys.size();\n\
            if (tokensize) {\n\
                int i = 0;\n\
                for (int j = 0; j < tokensize; j++) {\n\
                    if (i == keysize)\n\
                        break;\n\
                    setenv(keys[i].c_str(), tokens[j].c_str(), 1);\n\
                    i++;\n\
                }\n\
                if (tokensize > keysize) {\n\
                    int first = keysize - 1;\n\
                    int last = tokensize;\n\
                    std::string s;\n\
                    s.reserve(line.length());\n\
                    for (int count = first; count < last; count++) {\n\
                        s += tokens[count];\n\
                        if (count != (tokensize - 1))\n\
                            s +=  \" \";\n\
                    }\n\
                    setenv(keys.back().c_str(), s.c_str(), 1);\n\
                }\n\
            } else {\n\
                if (keysize)\n\
                    set_env(keys[0].c_str(), line);\n\
                else \n\
                    set_env(var.data(), line);\n\
            }\n\
            set_env(\"?\", 0);\n\
            return \"\";\n\
        }\n\
        \n\
        const std::string readval(void) {\n\
            return readval(\"REPLY\");\n\
        }\n"

        const cdstr = "\n\
        void cd(const std::string_view &directory) {\n\
            std::vector<char> cwd;\n\
            if (chdir(directory.data())) return;\n\
            long size = pathconf(\".\", _PC_PATH_MAX);\n\
            cwd.reserve(size);\n\
            setenv(\"PWD\", getcwd(cwd.data(), (size_t)size), 1);\n\
            set_env(\"?\", 0);\n\
        }\n"

        const bashexitstr = "\n\
        std::streambuf *stdoutbackup = std::cout.rdbuf();\n\
        void bashexit(int code) {\n\
            int c;\n\
            std::streambuf *current = std::cout.rdbuf();\n\
            std::cout.rdbuf(stdoutbackup);\n\
            int n = current->in_avail();\n\
			if ((c = current->sgetc()) != EOF) printf(\"%c\", c); \n\
			while ((c = current->snextc()) != EOF) printf(\"%c\", c); \n\
            exit(code);\n\
        }\n"

        let text = ""
        text += "void restoreargs(const std::vector<std::string> &list, int maxargs)\n"
        text += "{\n"
        text += "    char str[50];\n"
        text += "    for (int i = 0; i < maxargs; i++) {\n"
        text += "        sprintf(str, \"%d\", i + 1);\n"
        text += "        setenv(str, list[i].c_str(), 1);\n"
        text += "    }\n"
        text += "}\n"
        text += "void saveargs(std::vector<std::string> &list, int maxargs)\n"
        text += "{\n"
        text += "    char str[50];\n"
        text += "    list.reserve(maxargs);\n"
        text += "    for (int i = 0; i < maxargs; i++) {\n"
        text += "        sprintf(str, \"%d\", i + 1);\n"
        text += "        list.emplace_back(get_env(str));\n"
        text += "    }\n"
        text += "}\n"
        text += "void processargs(const std::initializer_list<std::string> &list, int maxargs)\n"
        text += "{\n"
        text += "    int i = 0, sz = 0;\n"
        text += "    std::string combinedargs;\n"
        text += "    for (auto &elem : list )\n"
        text += "        sz += elem.size() + 1;\n"
        text += "    combinedargs.reserve(sz);\n"
        text += "    int listsize = list.size();\n"
        text += "    set_env(\"#\", listsize);\n"
        text += "    char str[50];\n"
        text += "    for (auto &elem : list )\n"
        text += "    {\n"
        text += "        sprintf(str, \"%d\", i + 1);\n"
        text += "        setenv(str, elem.c_str(), 1);\n"
        text += "        combinedargs += elem;\n"
        text += "        if (i != (listsize - 1)) combinedargs += \" \";\n"
        text += "        i++;\n"
        text += "    }\n"
        text += "    for (int i = listsize + 1; i < (maxargs + 1); i++) {\n"
        text += "        sprintf(str, \"%d\", i);\n"
        text += "        setenv(str, \" \", 1);\n"
        text += "    }\n"
        text += "    if (combinedargs.length() == 0) combinedargs = \" \";\n"
        text += "        set_env(\"@\", combinedargs);\n"
        text += "}\n"
        const processargsstr = text

        const incrementstr = "\n\
        const std::string pre_increment(const char *variable) {\n\
            int val = mystoiz(getenv(variable)) + 1;\n\
            set_env(variable, val);\n\
            return std::to_string(val);\n\
        }\n\
        const std::string post_increment(const char *variable) {\n\
            int initval = mystoiz(getenv(variable));\n\
            int val = initval + 1;\n\
            set_env(variable, val);\n\
            return std::to_string(initval);\n\
        }\n\
        const std::string pre_decrement(const char *variable) {\n\
            int val = mystoiz(getenv(variable)) - 1;\n\
            set_env(variable, val);\n\
            return std::to_string(val);\n\
        }\n\
        const std::string post_decrement(const char *variable) {\n\
            int initval = mystoiz(getenv(variable));\n\
            int val = initval - 1;\n\
            set_env(variable, val);\n\
            return std::to_string(initval);\n\
        }\n\
        \n"

        let scopeexitstr = 
    "class scopeexitcerrfile{\n" +
    "    std::streambuf *m_backup;\n" +
    "    std::ofstream m_redirectStream;\n" +
    "public:\n" +
    "    scopeexitcerrfile(const std::string &file, bool append = false) {\n" +
    "        append ? m_redirectStream = std::ofstream(file, std::ios_base::app): m_redirectStream = std::ofstream(file);\n" +
    "        m_backup = std::cerr.rdbuf();\n" +
    "        if (m_redirectStream) std::cerr.rdbuf(m_redirectStream.rdbuf());\n" +
    "    }\n" +
    "    ~scopeexitcerrfile(){std::cerr.rdbuf(m_backup);}\n" +
    "};\n" +
    "class scopeparams{\n" +
    "    int m_maxargs;\n" +
    "    std::vector<std::string> m_vec;\n" +
    "public:\n" +
    "    scopeparams(const std::initializer_list<std::string> &list, int maxargs): m_maxargs(maxargs) {\n" +
    "        saveargs(m_vec, maxargs);\n" +
    "        processargs(list, maxargs);\n" +
    "    }\n" +
    "    ~scopeparams(){restoreargs(m_vec, m_maxargs);}\n" +
    "};\n" +
    "class scopeexitcincout {\n\
    \n\
    std::streambuf *backupout = std::cout.rdbuf();\n\
	std::streambuf *backupin = std::cin.rdbuf();\n\
	std::stringstream buffer;\n\
	int readfd[2];\n\
	int m_inbackup;\n\
	bool m_released = false;\n\
\n\
	public: \n\
\n\
	~scopeexitcincout() {\n\
		release();\n\
	}\n\
	scopeexitcincout(bool stdout = false) {\n\
		if (!stdout) std::cout.rdbuf(buffer.rdbuf());\n\
        if (pipe(readfd) < 0) {\n\
            fprintf( stderr,\"%s:%d\\n\", __func__, __LINE__);\n\
            exit(-1);\n\
        }\n\
		m_inbackup = dup(0);\n\
		dup2(readfd[0], STDIN_FILENO); \n\
		close(readfd[0]);\n\
	}\n\
\n\
	std::stringstream &buf() { return buffer;}\n\
\n\
	void release() {\n\
		if (m_released) return;\n\
\n\
		std::cout.rdbuf(backupout);\n\
		std::cin.rdbuf(backupin);\n\
		dup2(m_inbackup, 0); \n\
		close(m_inbackup); \n\
		m_released = true;\n\
	}\n\
\n\
	void writecin(std::stringstream &str) {\n\
		if (write(readfd[1], str.str().data(), str.str().length()) < 0) {\n\
			fprintf( stderr,\"%s:%d\\n\", __func__, __LINE__);\n\
			exit(-1);\n\
		}\n\
		close(readfd[1]);\n\
	}\n\
};\n\
" +
    "class scopeexitcinfile {\n\
    \n\
        int m_backup; \n\
        int m_redirectStream; \n\
        public: \n\
        scopeexitcinfile(const std::string &file) {\n\
        \n\
            m_redirectStream = open(file.c_str(), O_RDONLY); \n\
            m_backup = dup(0); \n\
            if (m_redirectStream >= 0) {\n\
            \n\
                dup2(m_redirectStream, STDIN_FILENO); \n\
                close(m_redirectStream); \n\
            } \n\
        } \n\
        ~scopeexitcinfile() {\n\
        \n\
            dup2(m_backup, 0); \n\
            close(m_backup); \n\
        } \n\
    }; \n" +
        "class scopeexitcoutfile{\n" +
        "    std::streambuf *m_backup;\n" +
        "    std::ofstream m_redirectStream;\n" +
        "    public:\n" +
        "    scopeexitcoutfile(const std::string &file, bool append = false) {\n" +
        "        append ? m_redirectStream = std::ofstream(file, std::ios_base::app): m_redirectStream = std::ofstream(file);\n" +
        "        m_backup = std::cout.rdbuf();\n" +
        "        if (m_redirectStream) std::cout.rdbuf(m_redirectStream.rdbuf());\n" +
        "    }\n" +
        "    ~scopeexitcoutfile(){std::cout.rdbuf(m_backup);}\n" +
        "};\n" +
        "class scopeexitcout{\n" +
        "    bool m_stdout = false;\n" +
        "    std::streambuf *m_backup;\n" +
        "    std::stringstream m_redirectStream;\n" +
        "    bool m_released = false;" +
        "    public:\n" +
        "    std::stringstream &buf(){ return m_redirectStream;} \n" +
        "    scopeexitcout(bool stdout = false){\n" +
        "        m_stdout = stdout;\n" +
        "        m_backup = std::cout.rdbuf();\n" +
        "        std::cout.rdbuf(m_redirectStream.rdbuf());\n" +
        "    }\n" +
        "    ~scopeexitcout(){release();}\n" +
        "    void release(){if (m_released) return; std::cout.rdbuf(m_backup); if (m_stdout) std::cout << m_redirectStream.str(); m_released = true;}\n" +
        "};\n" +
        "class scopedvariable{\n" +
            "    std::string m_backup;\n" +
            "    std::string m_env;\n" +
            "    public:\n" +
            "    scopedvariable(const std::string_view &env, const std::string_view &newval) {\n" +
            "        m_env = env;\n" +
            "        get_env(m_backup, env);\n" +
            "        set_env(env.data(), newval.data());\n" +
            "    }\n" +
            "    scopedvariable(const std::string_view &env) {\n" +
            "        m_env = env;\n" +
            "        get_env(m_backup, env);\n" +
            "    }\n" +
            "    ~scopedvariable(){setenv(m_env.c_str(), m_backup.c_str(), 1);}\n" +
            "};\n\
        template <typename F>\n\
        const std::string execinternal(F f)\n\
        {\n\
            scopeexitcout scope(false);\n\
            f({});\n\
            return scope.buf().str();\n\
        }\n\
        const std::string execbuiltin(void (*f)(const std::string_view &arg), const std::string_view &arg)\n\
        {\n\
            scopeexitcout scope(false);\n\
            f(arg);\n\
            return scope.buf().str();\n\
        }\n\
        const int checkbuiltinexec(void (*f)(const std::string_view &arg), const std::string_view &arg) { \n\
            f(arg);\n\
            int exitstatus; \n\
            exitstatus = mystoiz(getenv(\"?\"));\n\
            return exitstatus == 0; \n\
        }\n"

        let upperstr = "const std::string upper(const std::string_view &str)\n" +
        "{\n" +
        "    std::string s(str);\n" +
        "    std::transform(s.begin(), s.end(), s.begin(), ::toupper);\n" +
        "    return s;\n" +
        "}\n"
        let lowerstr = "const std::string lower(const std::string_view &str)\n" +
        "{\n" +
        "    std::string s(str);\n" +
        "    std::transform(s.begin(), s.end(), s.begin(), ::tolower);\n" +
        "    return s;\n" +
        "}\n"
        let uppercapitalize = "const std::string uppercapitalize(const std::string_view &str)\n" +
        "{\n" +
        "    std::string s(str);\n" +
        "    s[0] = toupper(s[0]);\n" +
        "    return s;\n" +
        "}\n"
        let lowercapitalize = "const std::string lowercapitalize(const std::string_view &str)\n" +
        "{\n" +
        "    std::string s(str);\n" +
        "    s[0] = tolower(s[0]);\n" +
        "    return s;\n" +
        "}\n"
        let sourcefunc = "void source(const std::string_view &fname)\n" +
        "{\n"  +
            "int exitstatus;\n" +
            "std::string result;\n" +
            "std::string cmd(\"set -a && . \");\n" +
            "cmd.reserve(cmd.size() + fname.size() + 19);\n" +
            "cmd += fname;\n" +
            "cmd += \" && set +a && env\";\n" +
            "char *toks[4] = {(char*)\"sh\", (char*)\"-c\", cmd.data(), (char*)NULL};\n" +
            "boost::process::ipstream pipe_stream;\n" +
            "cmd = \"sh -c \\\"\" + cmd + \"\\\"\";\n" +
            "boost::process::child c(cmd, boost::process::std_out > pipe_stream);\n" +
            "std::string line;\n" +
            "while (pipe_stream && std::getline(pipe_stream, line) && !line.empty()) {\n" +
            "   size_t offset = line.find(\"=\");\n\
                if (line[0] == '#') continue;\n\
                if (offset != std::string::npos) {;\n\
                    std::string key(line.substr(0, offset));\n\
                    std::string value(line.substr(offset + 1));\n\
                    if (!value.empty()){ \n\
                        setenv(key.data(), value.data(), 1);\n\
                    }\n\
                }\n" +
            "};\n" +
            "c.wait();\n" +
        "}\n"
        return fileexists + regularfileexists + pipefileexists + linkfileexists + socketfileexists + blockfileexists
            + charfileexists + filereadable + fileexecutable + filewritable + direxists + envCommand + execCommand + splitCommand + regexstr + echostr
            + cdstr + bashexitstr+ readstr + incrementstr + processargsstr + scopeexitstr + upperstr + lowerstr + uppercapitalize + lowercapitalize + sourcefunc;
    }
}

const parse = require('./bash-parser');
const ast = parse(file, { mode: 'bash' ,insertLOC: true });

const converter = new ConvertBash();

process.on('exit', function (code) {
    if (code != 0)
        return console.log(`About to exit with code ${code}`);
    return 0
});

let str = ""
try {
    var textByLine = file.split("\n")

    converter.setLines(textByLine)

    const parseresult = ast.commands
        .map(c => converter.convertCommand(c))
        .filter((c: any) => !!c) // filter empty commands
        .join(';\n')

    let maxargs= 0
    maxargs = converter.maxReferredArgs(ast, maxargs)

    let argstr = "void convertMainArgs(int argc, const char *argv[], int maxargs){\n"
    argstr += "char str[50];\n"
    argstr += "\n"
    argstr += "if (argc > 1) {\n"
    argstr += "    sprintf(str, \"%d\", argc - 1);\n"
    argstr += "    setenv(\"#\", str, 1);\n"
    argstr += "}\n"
    argstr += "else  setenv(\"#\", \"0\", 1);\n"
    argstr += "std::string combinedargs;\n"
    argstr += "int sz = 0;\n"
	argstr += "for (int i = 1; i < argc; i++)\n"
	argstr += "    sz += strlen(argv[i]) + 1;\n"
	argstr += "combinedargs.reserve(sz);\n"
    argstr += "setenv(\"0\", argv[0], 1);\n"
    argstr += "for (int i = 1; i < argc; i++) {\n"
    argstr += "    sprintf(str, \"%d\", i);\n"
    argstr += "    setenv(str, argv[i], 1);\n"
    argstr += "    combinedargs += argv[i];\n"
    argstr += "    if (i != (argc - 1)) combinedargs += \" \";\n"
    argstr += "}\n"
    argstr += "if (combinedargs.length() == 0) combinedargs = \" \";\n"
    argstr += "setenv(\"@\", combinedargs.c_str(), 1);\n"
    argstr += "for (int i = argc; i < (maxargs + 1); i++) {\n"
    argstr += "    sprintf(str, \"%d\", i);\n"
    argstr += "    setenv(str, \" \", 1);\n"
    argstr += "}\n"
    argstr += "}\n"

    str = "#include <stdlib.h> \n" +
        "#include <stdio.h>\n" +
        "#include <string.h>\n" +
        "#include <string>\n" +
        "#include <unistd.h>\n" +
        "#include <stdarg.h>\n" +
        "#include <memory>\n" +
        "#include <sys/ioctl.h>\n" +
        "#include <boost/format.hpp>\n" +
        "#include <boost/process.hpp>\n" +
        "#include <iostream>\n" +
        "#include <regex>\n" +
        "#include <iterator>\n" +
        "#include <glob.h>\n" +
        "#include <pcre.h>\n" +
        "#include <sys/stat.h>\n" +
        "#include <sys/types.h>\n" +
        "#include <sys/wait.h>\n" +
        "#include <fcntl.h>\n" +
        "#include <fstream>\n" +
        "#include <numeric>\n" +
        "#include <string_view>\n" +
        "#include <wordexp.h>\n" +
        "#define PIPE_READ 0\n" +
        "#define PIPE_WRITE 1\n" +
        argstr +
        converter.getSupportDefinitions() +
        converter.getAsyncDefinitions(true) +
        converter.getPipelineDefinitions() +
        converter.getRedirectDefinitions() +
        converter.getFunctionPrototypes() +
        converter.getFunctionDefinitions() +
        converter.getAsyncDefinitions() +
        "\n" +
        "int main(int argc, const char *argv[]) {\n" +
        "convertMainArgs(argc, argv, " + maxargs.toString() + ");\n" + 
        parseresult +
        ";\n" +
        "return 0;\n" +
        "} \n"
}
catch (e) {
    console.log(e);
    console.log("exception captured");
    process.exit(-1);
}

fs.writeFileSync(process.argv[3], str, function (err) {
    if (err) throw err;
    console.log('Saved!');
});

if (process.argv[4]) {
    fs.writeFileSync(process.argv[4], JSON.stringify(ast), function (err) {
        if (err) throw err;
        console.log('Saved!');
    });
}

process.exit(0);
