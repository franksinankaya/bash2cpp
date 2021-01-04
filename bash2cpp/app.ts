const fs = require('fs');
import { readFileSync } from 'fs';
const file = readFileSync(process.argv[2], 'utf-8');
const babylon = require('babylon');

class ConvertBash {
    private functiondefs:any = ""

    private terminate(command: any) {
        console.log('unknown command: ' + JSON.stringify(command));
        throw new Error();
    }

    private getIdentifier(expression:any, argument: any): string {
        let str = expression.substring(argument.start, argument.end);

        if (str[0] == "$") {
            str = str.substring(1)
        }
        const val = "get_env(\"" + str + "\")"
        return val
    }

    private convertArithmeticASTBinaryExpression(arithmeticAST: any, expression: any): string {
        let leftvalue
        if (arithmeticAST.left.type == "NumericLiteral") {
            leftvalue = arithmeticAST.left.value
        }
        else if (arithmeticAST.left.type == "Identifier") {
            leftvalue = this.getIdentifier(expression, arithmeticAST.left)
            leftvalue = "mystoi(" + leftvalue + ", 0)"
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
            rightvalue = "mystoi(" + rightvalue + ", 0)"
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
    private convertArithmeticAST(arithmeticAST: any, expression: any): string {
        if (arithmeticAST.type == "UpdateExpression") {
            let val = ""
            let identifier = ""
            if (arithmeticAST.argument.type == "Identifier") {
                identifier = arithmeticAST.name ? arithmeticAST.name : arithmeticAST.argument.name
                val = this.getIdentifier(expression, arithmeticAST.argument)
            } else {
                this.terminate(expression)
            }
            switch (arithmeticAST.operator) {
                case "++":
                    return "set_env(\"" + identifier + "\",  mystoi(" + val + ") + 1)"
                case "--":
                    return "set_env(\"" + identifier + "\",  mystoi(" + val + ") - 1)"
            }
            this.terminate(expression)
        }
        if (arithmeticAST.type == "BinaryExpression") {
            return this.convertArithmeticASTBinaryExpression(arithmeticAST, expression)
        }
        if (arithmeticAST.type == "AssignmentExpression") {
            let leftvalue
            let leftstoi = ""
            if (arithmeticAST.left.type == "Identifier") {
                leftvalue = "\"" + arithmeticAST.left.name + "\""
                leftstoi = "mystoi(" + this.getIdentifier(expression, arithmeticAST.left) + ", 0)"
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
                rightvalue = "mystoi(" + rightvalue + ", 0)"
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
    private convertArithmeticExpansion(command: any): string {
        if ((command.loc.start < 0) || (command.loc.end < 0)) {
            return ""
        }
        return this.convertArithmeticAST(command.arithmeticAST, command.expression)
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

    /*
     * type: 'AssignmentWord',
	 * text: String,
	 * expansion: Array<ArithmeticExpansion |
					 CommandExpansion |
					 ParameterExpansion>
     */
    private convertAssignment(command: any): string {
        if (command.expansion) {
            const text = this.convertWord(command)
            const equalpos = text.indexOf("=")
            const variableName = text.substr(0, equalpos)
            const variableValue = text.substr(equalpos + 1, text.length)

            let expansion = variableValue
            let stringexpression = true

            for (let i = 0; i < command.expansion.length; i++) {
                if ((command.expansion[i].loc.start > 0) && (command.expansion[i].type == "ArithmeticExpansion"))
                    stringexpression = false;
            }

            if ((expansion.charAt(0) == "'") && (expansion.charAt(expansion.length - 1) != "'")) {
                let t = ""
                if (stringexpression)
                    t += "\""
                t += expansion.substring(1, expansion.length)
                if (stringexpression)
                    t += "\""
                expansion = t
            }

            if ((expansion.charAt(0) == "'") && (expansion.charAt(expansion.length - 1) == "'")) {
                let t = ""
                if (stringexpression)
                    t += "\""
                t += expansion.substring(1, expansion.length - 1)
                if (stringexpression)
                    t += "\""
                expansion = t
            }

            let needsquote = expansion.charAt(0) == "\"" && (expansion.charAt(1) == " ")
            if (needsquote && stringexpression)
                expansion = "\"" + expansion

            needsquote = (expansion.charAt(0) != "\"") && (expansion.charAt(expansion.length-1) != "\"")
            if (needsquote && stringexpression)
                expansion = "\"" + expansion + "\""

            if (expansion.indexOf("\"\" + ") == 0)
                expansion = expansion.substring(5)
            return `set_env("${variableName}", ${expansion})`;
        }

        let variableValue

        const equalpos = command.text.indexOf("=")
        const variableName = command.text.substr(0, equalpos)
        variableValue = command.text.substr(equalpos+1, command.text.length)

        if ((variableValue.charAt(0) == "\"") && (variableValue.charAt(variableValue.length - 1) == "\"")) {
            variableValue = variableValue.substring(1);
            variableValue = variableValue.substr(0, variableValue.length - 1);
        }
        if ((variableValue.charAt(0) == "'") && (variableValue.charAt(variableValue.length - 1) == "'")) {
            variableValue = variableValue.substring(1);
            variableValue = variableValue.substr(0, variableValue.length - 1);
        }

        if (variableValue.indexOf("\"\" + ") == 0)
            variableValue = variableValue.substring(5)

        // auto-quote value if it doesn't start with quote
        if (!variableValue.startsWith('"') && !this.isNumeric(variableValue))
            return `set_env("${variableName}", "${variableValue}")`;
        return `set_env("${variableName}", ${variableValue})`;
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
                    const val = !rightexpansion ? rightValue : '"' + rightexpansion[0].parameter + '"'
                    if (rightexpansion)
                        clause = "!envexists_and_hascontent(" + (!rightexpansion ? "\"" : "") + val + (!rightexpansion ? "\"" : "") + ")"
                    else
                        clause = rightValue.length > 0 ? "0" : "1"
                }
                break
            case "!-z":
                {
                    const val = !rightexpansion ? rightValue : '"' + rightexpansion[0].parameter + '"'
                    if (rightexpansion)
                        clause = "!envempty(" + (!rightexpansion ? "\"" : "") + val + (!rightexpansion ? "\"" : "") + ")"
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

    private convertOneCondition(clausecommands: any): string {
        let leftValue = null
        let leftValueExpansion = null
        let opValue = null
        let rightValue = null
        let rightValueExpansion = null
        let skipname = false
        let leftindex

        if ((clausecommands.name.text == "[") || (clausecommands.name.text == "[[") || (clausecommands.name.text == "test")) {
            skipname = true;
        }

        let redirectBug = false

        if (skipname == false) {
            leftindex = -1
            leftValue = this.convertCommand(clausecommands.name)
            leftValueExpansion = clausecommands.expansion ? clausecommands.expansion : clausecommands.name.expansion
            if (leftValue == "!") {
                leftindex = 0
                leftValue = this.convertCommand(clausecommands.suffix[leftindex])
                leftValueExpansion = clausecommands.suffix[leftindex].expansion
                if ((leftValue == "[") || (leftValue == "[[") || (leftValue == "test")) {
                    leftindex = 1
                    leftValue = this.convertCommand(clausecommands.suffix[leftindex])
                    leftValueExpansion = clausecommands.suffix[leftindex].expansion
                }
                leftValue = "!" + leftValue
            }
            opValue = clausecommands.suffix.length > (leftindex + 1) ? this.convertCommand(clausecommands.suffix[leftindex + 1]) : ""

            rightValue = clausecommands.suffix.length > (leftindex + 2) ? this.convertCommand(clausecommands.suffix[leftindex + 2]) : ""
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
            leftindex = 0
            leftValue = this.convertCommand(clausecommands.suffix[leftindex])
            leftValueExpansion = clausecommands.suffix[leftindex].expansion
            if (leftValue == "!") {
                leftindex = 1
                leftValue = this.convertCommand(clausecommands.suffix[leftindex])
                leftValueExpansion = clausecommands.suffix[leftindex].expansion
                leftValue = "!" + leftValue
            }
            opValue = clausecommands.suffix.length > (leftindex + 1) ? this.convertCommand(clausecommands.suffix[leftindex + 1]) : ""
            rightValue = clausecommands.suffix.length > (leftindex + 2) ? this.convertCommand(clausecommands.suffix[leftindex + 2]) : ""
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
            if ((rightValue == "]]") || (rightValue == "]") || (rightValue == "")) {
                rightValueExpansion = clausecommands.suffix.length > (leftindex + 1) ? clausecommands.suffix[leftindex + 1].expansion : null
                rightValue = opValue
                opValue = leftValue
                leftValue = ""
                leftValueExpansion = null
            }

            if (rightValue && rightValue != ']')
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

    private convertClause(clausecommands: any, intest = false): [string, boolean] {
        let clause = ""
        if (intest || (clausecommands.name.text == "test") || (clausecommands.name.text == "[") || (clausecommands.name.text == "[[") ||
            (clausecommands.name.text == "!") && ((clausecommands.suffix[0].text == "test") || (clausecommands.suffix[0].text == "[") || (clausecommands.suffix[0].text == "[["))) {
            clause = this.convertOneCondition(clausecommands)

            if (clausecommands.suffix[clausecommands.suffix.length - 1].text != "]")
                intest = true
        }
        else {
            if (clausecommands.name.text != "!")
                clause = " checkval(" + this.convertExecCommand(clausecommands, false) + ")"
            else {
                const clauseexpansion = this.convertExecCommand(clausecommands, false, false)
                clause = "!checkval(" + clauseexpansion + ")"
            }
        }

        return [clause, intest]
    }

    private convertIfStatement(command: any, clausecommands:any, then: any): string [] {
        let clause = ""

        if (clausecommands.type == "Subshell") {
            const commands = clausecommands.list.commands[0].list.commands[0]
            const [tmpclause, ] = this.convertClause(commands, true)
            clause = tmpclause
        }
        else if (clausecommands.type == "LogicalExpression") {
            const left = clausecommands.left
            const right = clausecommands.right
            const op = clausecommands.op

            clause = this.convertLogicalCondition(left, right, op)
        } else {
            const [tmpclause, ] = this.convertClause(clausecommands)
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
        let text = ""
        if (command.clause.commands.length != 1)
            this.terminate(command)

        const [clause, thenval, elseval] = this.convertIfStatement(command, command.clause.commands[0], command.then)
        
        text += "if (" + clause + ") { \n" + thenval + "\n}\n" + (elseval ? "else\n{\n" + elseval + "}" : "");
        if (command.else && command.else.type == "If") {
            text += "else " + this.convertIf(command.else)
        }

        return text;
    }

    private convertFunction(command: any): string {
        let text = ""

        text += "std::string " + this.convertCommand(command.name) + "() {\n"
        text += this.convertCommand(command.body) + "; \n"
        text += "return \"\"; \n"
        text += "}\n"

        this.functiondefs += text
        return ""
    }

    /*
     * Array<ArithmeticExpansion |
	 *				 CommandExpansion |
	 *				 ParameterExpansion>
     */
    private convertWord(command: any): string {
        if (command.expansion) {
            let strbegin = ""
            let strend = ""
            let text = command.text
            const expansions = []
            let numexpansions = 0
            let curexpansions = 0
            for (let i = command.expansion.length - 1; i >= 0; i--) {
                if (command.expansion[i]) {
                    const expansion = this.convertCommand(command.expansion[i]);
                    if (expansion != "") {
                        expansions[i] = true
                        numexpansions++
                    }
                }
            }

            // look for missing string termination
            for (let i = 0; i < command.expansion.length; i++) {
                if (command.expansion[i]) {
                    const expansion = this.convertCommand(command.expansion[i]);
                    if (expansion != "") {
                        strbegin = text.substring(0, command.expansion[i].loc.start);
                        strend = text.substring(command.expansion[i].loc.end + 1, text.length);

                        if ((strend != "") && (strend != "\"") && (strend != "'") && (strend.charAt(strend.length - 1) != "\"") && (strend.charAt(strend.length - 1) != "'")) {
                            if ((curexpansions + 1) == numexpansions)
                                text += "\""
                        }

                        curexpansions++
                    }
                }
            }

            for (let i = command.expansion.length - 1; i >= 0; i--) {
                if (command.expansion[i]) {
                    const expansion = this.convertCommand(command.expansion[i]);
                    if (expansion != "") {
                        strbegin = text.substring(0, command.expansion[i].loc.start);
                        strend = text.substring(command.expansion[i].loc.end + 1, text.length);

                        let strquotes = "\""
                        let plus = " + "

                        if (command.expansion[i].type == "ArithmeticExpansion") {
                            strquotes = ""
                            plus = ""
                        }

                        if ((strbegin != "") && ((strbegin != "\"") && (strbegin != "'")))
                            text = strbegin + strquotes + plus + expansion
                        else
                            text = expansion

                        if ((strend != "") && ((strend != "\"") && (strend != "'"))) {
                            text += plus + strquotes;
                            text += strend;
                        }
                    }
                }
            }
            return text;
        }
        const text = command.text;

        return text;
    }

    private convertExpansion(varray: any, skipRedirects: any): [string, boolean] {
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
                    suffix += this.convertCommand(varray[i])
                    if (i != (varray.length - 1))
                        suffix += " "
                }

                suffix = '"' + suffix + '"'
            } else {
                for (let i = 0; i < varray.length; i++) {
                    if (skipRedirects && (varray[i].type == "Redirect"))
                        continue
                    if (varray[i].expansion) {

                        if (i > 0) {
                            if (!expansionIndex[i - 1])
                                suffix += '"'
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
                        suffix += this.convertCommand(varray[i])
                        if (i != (varray.length - 1))
                            suffix +=  " "
                    }
                }
            }
            return [suffix, hasExpansion]
        } else {
            this.terminate(varray)
        }
    }

    public isRegexExpression(str: any): boolean {
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
            else
                file = this.convertCommand(redirections[index].file)

            let numberIo = redirections[index].numberIo ? parseInt(redirections[index].numberIo.text) : 1
            text += "std::streambuf *backup;\n"
            if (redirections[index].op.text == ">") {
                if (numberIo == 2) {
                    text += "backup = std::cerr.rdbuf();\n"
                    text += "std::ofstream file(" + file + ");\n"
                    text += "if (file) std::cerr.rdbuf(file.rdbuf());\n"
                } else {
                    text += "backup = std::cout.rdbuf();\n"
                    text += "std::ofstream file(" + file + ");\n"
                    text += "if (file) std::cout.rdbuf(file.rdbuf());\n"
                }
            }
            else if (redirections[index].op.text == ">>") {
                if (numberIo == 2) {
                    text += "backup = std::cerr.rdbuf();\n"
                    text += "std::ofstream file;\n"
                    text += "file.open(" + file + ", std::ios_base::app);\n"
                    text += "if (file) std::cerr.rdbuf(file.rdbuf());\n"
                } else {
                    text += "backup = std::cout.rdbuf();\n"
                    text += "std::ofstream file;\n"
                    text += "file.open(" + file + ", std::ios_base::app);\n"
                    text += "if (file) std::cout.rdbuf(file.rdbuf());\n"
                }
            }
            else if (redirections[index].op.text == "<") {
                text += "backup = std::cin.rdbuf();\n"
                text += "std::ifstream file(" + file + ");\n"
                text += "if (file) std::cin.rdbuf(file.rdbuf());\n"
            }
            else if (redirections[index].op.text == ">&") {
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
                        this.terminate(redirections)
                }
            }
            else
                this.terminate(redirections[index])
        }
        text += maintext + ";"
        if (redirections && (redirections[index].type == "Redirect")) {
            let numberIo = redirections[index].numberIo ? parseInt(redirections[index].numberIo.text) : 1
            if ((redirections[index].op.text == ">") ||
                (redirections[index].op.text == ">&") ||
                (redirections[index].op.text == ">>")){
                if (numberIo == 2) {
                    text += "std::cerr.rdbuf(backup);\n"
                } else {
                    text += "std::cout.rdbuf(backup);\n"
                }
            }
            else if (redirections[index].op.text == "<") {
                text += "std::cin.rdbuf(backup);\n"
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

    public convertFor(command: any): string {
        let text = ""
        let i

        text += "{\n"
        if ((command.wordlist.length == 1) && command.wordlist[0].text[0] == "{") {
            const limiters = command.wordlist[0].text.split("..")
            let start = limiters[0].substring(1)
            let end = limiters[1]
            let increment = limiters.length > 2 ? parseInt(limiters[2].substring(0, limiters[2].length - 1))  : 1

            if (this.isNumeric(start)) {
                text += "int vals[] = {\n"
                start = parseInt(start)
                end = parseInt(end)
                if (end > start) {
                    for (i = start; i <= end; i = i + increment) {
                        text += i
                        if (i != (command.wordlist.length - 1))
                            text += ","
                    }
                    text += "\n"
                } else {
                    if (increment > 0)
                        increment = -increment
                    for (i = start; i >= end; i = i + increment) {
                        text += i
                        if (i != (command.wordlist.length - 1))
                            text += ","

                    }
                    text += "\n"
                }
            } else {
                text += "const char *vals[] = {\n"
                end = end.substring(0, end.length - 1)
                for (i = start; i != end; i = this.nextChar(i)) {
                    text += "\"" + i + "\""
                    if (i != (command.wordlist.length - 1))
                        text += ","

                }
                text += "\n"
                text += "\"" + i + "\""
                if (i != (command.wordlist.length - 1))
                    text += ","

                text += "\n"
            }
            text += "};\n"
            text += "int length = sizeof(vals)/sizeof(vals[0]);\n"
        }
        else if ((command.wordlist.length == 1) && this.isRegexExpression(command.wordlist[0].text)) {
            text += "std::vector<std::string> vals = {\n"
            text += "globvector(\"" + command.wordlist[0].text + "\")"
            text += "\n"
            text += "};\n"
            text += "int length = vals.size();\n"
        }
        else {
            let hasExpansion = false;
            for (i = 0; i < command.wordlist.length; i++) {
                if (command.wordlist[i].expansion) {
                    hasExpansion = true
                    break
                }
            }

            if (hasExpansion)
                text += "std::vector<std::string> vals = {\n"
            else
                text += "const char* vals[] = {\n"
            for (i = 0; i < command.wordlist.length; i++) {
                if (command.wordlist[i].expansion) {
                    text += "regexsplit(" + this.convertCommand(command.wordlist[i]) + ")"
                } else {
                    if (hasExpansion)
                        text += "std::string(\"" + command.wordlist[i].text + "\")"
                    else
                        text += "\"" + command.wordlist[i].text + "\""
                }
                if (i != (command.wordlist.length - 1))
                    text += ","

            }
            text += "\n"
            text += "};\n"
            if (hasExpansion)
                text += "int length = vals.size();\n"
            else
                text += "int length = sizeof(vals) / sizeof(vals[0]);\n"
        }
        text += "for (int i =0; i < length; i++)"
        text += "{\n"
        text += "set_env(\"" + command.name.text + "\", vals[i]);\n"
        const cmds = this.convertCommand(command.do);
        text += cmds + ";\n";
        text += "};\n"
        text += "}\n"
        return text
    }
    public convertCase(command: any): string {
        let clause = this.convertCommand(command.clause)
        let text = ""

        if (!command.clause.expansion) {
            clause = "\"" + clause + "\""
        }

        text += "{\n"
        text += "std::string clause = " + clause + ";\n"

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

                pattern = pattern.replace("*", ".*")
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
            maintext += " file && "
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
        return command.commands.map(c => this.convertCommand(c)).join(';\n');
    }

    public handleCommands(name: any, suffixarray: any, suffixprocessed: any, issuesystem: any) {
        switch (name) {
            case 'exit':
                {
                    const retval = suffixprocessed ? "mystoi(std::string(" + suffixprocessed + "))" : "mystoi(get_env(\"?\"))"
                    return "exit(" + retval + ")"
                }
            case 'break':
                return "break"
            case 'continue':
                return "continue"
            case 'set':
                if (suffixprocessed) {
                    suffixprocessed = "\") + " + suffixprocessed
                }

                if (suffixarray && suffixarray.length === 1 && suffixarray[0].text === '-e') {
                    console.log('skipping "set -e"');
                    return '';
                } else {
                    return `${name}${suffixprocessed}`;
                }
            case 'read':
                return "readval(" + suffixprocessed + ")"
            case 'echo':
                {
                    let text = ""

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
                        text += "exec("
                    }

                    if (suffixprocessed) {
                        suffixprocessed = "\") + " + suffixprocessed
                    }

                    text += "std::string(\"" + name
                    if (suffixprocessed)
                        text += " " + suffixprocessed
                    else
                        text += "\")"

                    if (issuesystem) {
                        text += ")"
                    }

                    return text
                }
        }
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

    public convertExecCommand(command: any, issuesystem: any = true, handlecommands: any = true): string {
        if (command.prefix && command.prefix.length && (!command.name || !command.name.text)) {
            return command.prefix.map(c => this.convertCommand(c)).join(';\n');
        }
        if (command.name && command.name.text) {
            let ignoreRedirects = issuesystem
            if (command.name.text == "exec")
                ignoreRedirects = false
            let [suffix,] = command.suffix ? this.convertExpansion(command.suffix, ignoreRedirects) : ["", false];
            if ((suffix != "") && (suffix[suffix.length - 1] != "\"")) {
                if (!command.suffix[command.suffix.length - 1].expansion)
                    suffix += "\""
            }
            suffix = this.trimTrailingSpaces(suffix)
            let redirecttext = ""
            if (command.suffix && ignoreRedirects) {
                const maintext = this.handleCommands(command.name.text, command.suffix, suffix, issuesystem)
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

            if (handlecommands)
                return this.handleCommands(command.name.text, command.suffix, suffix, issuesystem)
            else
                return suffix
        }
        this.terminate(command)
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
        if (command.loc.start >= 0 && command.loc.end > 0) {
            for (let i = 0; i < command.commandAST.commands.length; i++) {
                text += this.convertExecCommand(command.commandAST.commands[i], false)
            }
            text = "execnoout(" + text + ")"
        }
        return text;
    }


    public convertParameterExpansion(command: any): string {
        if (command.loc.start >= 0 && command.loc.end > 0) {
            if ((command.op) && (command.op == "substring")) {
                if (command.length) {
                    let length = command.length
                    let offset = command.offset

                    if (offset < 0)
                        offset = "get_env(\"" + command.parameter + "\").size() " + offset

                    if (length < 0)
                        length = "get_env(\"" + command.parameter + "\").size() " + length + " - " + offset

                    return "get_env(\"" + command.parameter + "\").substr(" + offset + "," + length + ")";
                }
                else {
                    let offset = command.offset
                    if (offset < 0)
                        offset = "get_env(\"" + command.parameter + "\").size() " + offset
                    return "get_env(\"" + command.parameter + "\").substr(" + offset + ",  std::string::npos)";
                }
            }
            return "get_env(\"" + command.parameter + "\")";
        }
        else {
            return '';
        }
    }

    public convertCommand(command: any): string {

        switch (command.type) {
            case 'LogicalExpression':
                return this.convertLogicalExpression(command);
            case 'ArithmeticExpansion':
                return this.convertArithmeticExpansion(command);
            case 'If':
                return this.convertIf(command);
            case 'ParameterExpansion':
                return this.convertParameterExpansion(command);
            case 'CommandExpansion':
                return this.convertCommandExpansion(command);
            case 'Function':
                return this.convertFunction(command);
            case 'Word':
            case 'Name':
                return this.convertWord(command);
            case 'AssignmentWord':
                return this.convertAssignment(command);
            case 'Command':
                return this.convertExecCommand(command);
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
        }
        this.terminate(command)
    }

    public getFunctionDefinitions(): string {
        if (this.functiondefs)
            return "\n\n" + this.functiondefs + "\n\n"
        else
            return "\n"
    }

    public getSupportDefinitions(): string {
        const fileexists = "\n\
        const int fileexists(const std::string &file) {          \n\
            struct stat buf;                        \n\
            return (stat(file.c_str(), &buf) == 0);        \n\
        }\n"

        const regularfileexists = "\n\
        const int regularfileexists(const std::string &file) {          \n\
            struct stat buf;                        \n\
            return (stat(file.c_str(), &buf) == 0) && S_ISREG(buf.st_mode);        \n\
        }\n"

        const pipefileexists = "\n\
        const int pipefileexists(const std::string &file) {          \n\
            struct stat buf;                        \n\
            return (stat(file.c_str(), &buf) == 0) && (buf.st_mode & S_IFIFO);        \n\
        }\n"

        const linkfileexists = "\n\
        const int linkfileexists(const std::string &file) {          \n\
            struct stat buf;                        \n\
            return (stat(file.c_str(), &buf) == 0) && S_ISLNK(buf.st_mode);        \n\
        }\n"

        const socketfileexists = "\n\
        const int socketfileexists(const std::string &file) {          \n\
            struct stat buf;                        \n\
            return (stat(file.c_str(), &buf) == 0) && S_ISSOCK(buf.st_mode);        \n\
        }\n"

        const blockfileexists = "\n\
        const int blockfileexists(const std::string &file) {          \n\
            struct stat buf;                        \n\
            return (stat(file.c_str(), &buf) == 0) && S_ISBLK(buf.st_mode);        \n\
        }\n"

        const charfileexists = "\n\
        const int charfileexists(const std::string &file) {          \n\
            struct stat buf;                        \n\
            return (stat(file.c_str(), &buf) == 0) && S_ISCHR(buf.st_mode);        \n\
        }\n"

        const fileexecutable = "\n\
        const int fileexecutable(const std::string &file) {          \n\
            struct stat buf;                        \n\
            return (stat(file.c_str(), &buf) == 0) &&  (buf.st_mode & S_IXUSR);        \n\
        }\n"

        const filewritable = "\n\
        const int filewritable(const std::string &file) {          \n\
            struct stat buf;                        \n\
            return (stat(file.c_str(), &buf) == 0) &&  (buf.st_mode & S_IWUSR);        \n\
        }\n"

        const filereadable = "\n\
        const int filereadable(const std::string &file) {          \n\
            struct stat buf;                        \n\
            return (stat(file.c_str(), &buf) == 0) &&  (buf.st_mode & S_IRUSR);        \n\
        }\n"

        const direxists = "\n\
        const int direxists(const std::string &file) {                                   \n\
                                                                            \n\
            struct stat buf;                                                \n\
            return (stat(file.c_str(), &buf) == 0) && S_ISDIR(buf.st_mode);         \n\
        }\n"

        const envCommand = "\n\
        const int mystoi(const std::string &str, int defreturn = -1) { \n\
            if (!str.empty()) return std::stoi(str); \n\
            return defreturn; \n\
        }\n\
        \n\
        const std::string get_env(const std::string &cmd) { \n\
            const char *env = getenv(cmd.c_str());\n\
            return env ? env : \"\"; \n\
        }\n\
        \n\
        const int envexists_and_hascontent(const std::string &cmd) { \n\
            char *env = getenv(cmd.c_str()); \n\
            return env ? env[0] != '\\0' > 0 : 0; \n\
        }\n\
        \n\
        const int envempty(const std::string &cmd) { \n\
            char *env = getenv(cmd.c_str()); \n\
            return env ? env[0] == '\\0' : true; \n\
        }\n\
        \n\
        void set_env(const char *cmd, const std::string &value) { \n\
            if (value.back() == '\\n')\n\
                setenv(cmd, value.substr(0, value.size()-1).c_str(), 1);\n\
            else \n\
                setenv(cmd, value.c_str(), 1);\n\
        }\n\
        \n\
        void set_env(const char *cmd, const char *value) { \n\
            setenv(cmd, value, 1);\n\
        }\n\
        \n\
        void set_env(const char *cmd, const float value) { \n\
            setenv(cmd, std::to_string(value).c_str(), 1);\n\
        }\n\
        \n\
        void set_env(const char *cmd, const int value) { \n\
            setenv(cmd, std::to_string(value).c_str(), 1);\n\
        }\n\
        \n\
        void set_env(const char *cmd, const char value) { \n\
            setenv(cmd, std::to_string(value).c_str(), 1);\n\
        }\n"

        const execCommand = "\n\
        void execcommand(const std::string &cmd, int& exitstatus, std::string &result, bool stdout = true) \n\
        { \n\
            exitstatus = 0; \n\
            auto pPipe = ::popen(cmd.c_str(), \"r\"); \n\
            if (pPipe == nullptr) { \n\
                return;\n\
            }\n\
        \n\
            std::array <char, 256> buffer; \n\
        \n\
            while (not std::feof(pPipe)) \n\
            {\n\
                auto bytes = std::fread(buffer.data(), 1, buffer.size(), pPipe); \n\
                result.append(buffer.data(), bytes);\n\
            }\n\
        \n\
            auto rc = ::pclose(pPipe);\n\
        \n\
            if (WIFEXITED(rc)) {\n\
                exitstatus = WEXITSTATUS(rc);\n\
            }\n\
            if (stdout) \n\
                std::cout << result;\n\
\n\
        }\n\
        \n\
        const int checkval(const std::string &cmd) { \n\
            int exitstatus; \n\
            std::string result;\n\
            if (!cmd.empty()) {\n\
                execcommand(cmd, exitstatus, result);\n\
            } else {\n\
                exitstatus = mystoi(get_env(\"?\"), 0);\n\
            }\n\
            return exitstatus == 0; \n\
        }\n\
        \n\
        const std::string exec(const std::string &cmd, bool stdout = true) {\n\
            int exitstatus; \n\
            std::string result;\n\
            execcommand(cmd, exitstatus, result, stdout);\n\
            set_env(\"?\", exitstatus);\n\
            return result; \n\
        }\n\
        \n\
        const std::string execnoout(const std::string &cmd) {\n\
            int exitstatus; \n\
            std::string result; \n\
            execcommand(cmd, exitstatus, result, false);\n\
            set_env(\"?\", exitstatus);\n\
            return result; \n\
        }\n"

        const splitCommand = "\n\
        void split(std::vector <std::string> &tokens, const std::string &str, std::string delimiter)\n\
        {\n\
            // Vector of string to save tokens  \n\
            size_t pos = 0; \n\
            size_t prev = 0; \n\
                                                \n\
            while ((pos = str.find_first_of(delimiter, prev)) != std::string::npos) {\n\
                if (pos > prev)\n\
                    tokens.push_back(str.substr(prev, pos-prev));\n\
                prev = pos+1;\n\
            }\n\
            if (prev < str.length()){\n\
                tokens.push_back(str.substr(prev, std::string::npos));\n\
            }\n\
        }\n\
        \n\
        std::vector <std::string> split(const std::string &s) {\n\
            std::string delim = \" \\t\\n\"; \n\
            std::vector <std::string> elems;\n\
            const char *userdelim = getenv(\"IFS\");\n\
            if (userdelim != NULL)\n\
            {\n\
                delim = userdelim[0];\n\
            }\n\
            { \n\
                split(elems, s, delim); \n\
            }\n\
            return elems;\n\
        }\n"

        const regexstr = "\n\
        const bool regexmatch(const std::string &subject, const std::string &pattern)\n\
        {\n\
            pcre *re;\n\
            const char *error;\n\
            int erroffset;\n\
            int ovector[30];\n\
            int subject_length;\n\
            int rc;\n\
            \n\
            subject_length = (int)subject.size();\n\
            \n\
            re = pcre_compile(pattern.c_str(), 0, &error, &erroffset, NULL); \n\
            if (re == NULL) return 0; \n\
                                        \n\
            rc = pcre_exec(re, NULL, subject.c_str(),           \n\
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
        const bool isregexstring(const std::string &str)\n\
        {\n\
            if (str.find_first_of(\"*?\", 0) != std::string::npos)\n\
                return true;\n\
            return false;\n\
        }\n\
        \n\
        std::vector<std::string> globvector(const std::string& pattern){\n\
            glob_t glob_result;\n\
            glob(pattern.c_str(), GLOB_TILDE, NULL,& glob_result);\n\
            std::vector <std::string> files;\n\
            for (unsigned int i = 0; i < glob_result.gl_pathc; ++i) {\n\
                files.push_back(std::string(glob_result.gl_pathv[i]));\n\
            }\n\
            globfree(& glob_result);\n\
            return files;\n\
        }\n\
        \n\
        std::vector <std::string> regexsplit(const std::string &str)\n\
        {\n\
            if (isregexstring(str)) {\n\
                std::vector <std::string> files = globvector(str);\n\
                for (const auto &entry : files)\n\
                    std::cout << entry << std::endl;\n\
                return files;\n\
            }\n\
            return split(str);\n\
        }\n"

        const echostr = "\n\
        void echom(const std::string &str, size_t endoffset = std::string::npos)\n\
        {\n\
            size_t startoffset = 0;\n\
            bool endprint = true;\n\
            size_t offset = str.find(\"-n\"); \n\
            if (offset != std::string::npos) {\n\
                startoffset = 3;\n\
                endprint = false;\n\
            }\n\
            {\n\
                size_t initial_pos = startoffset;\n\
                size_t start_pos = startoffset;\n\
                while ((start_pos = str.find(\"  \", start_pos)) != std::string::npos) {\n\
                    std::cout << str.substr(initial_pos, start_pos); \n\
                    std::cout << \" \"; \n\
                    start_pos += std::string(\"  \").length(); \n\
                    initial_pos = start_pos; \n\
                }\n\
                std::cout << str.substr(initial_pos, endoffset); \n\
            }\n\
            if (endprint) std::cout << std::endl; \n\
            set_env(\"?\", 0);\n\
        }\n\
        \n\
        void echov(const std::string &str)\n\
        {\n\
            size_t endoffset = str.find_last_not_of(\" \\n\");\n\
            if (endoffset != std::string::npos) {\n\
                echom(str, endoffset + 1);\n\
            } else {\n\
                echom(str);\n\
            }\n\
        }\n\
        \n\
        void echo(const std::string &str)\n\
        {\n\
            echov(str); \n\
        }\n\
        \n\
        void echo(const float value) {\n\
            std::cout << std::to_string(value).c_str() << std::endl; \n\
            set_env(\"?\", 0);\n\
        }\n\
        \n\
        void echo(const int value) {\n\
            std::cout << std::to_string(value).c_str() << std::endl; \n\
            set_env(\"?\", 0);\n\
        }\n"

        const readstr = "\n\
        std::string readval(const std::string &var) {\n\
            std::string line;\n\
            if (!std::getline(std::cin, line)) {\n\
                set_env(\"?\", -1);\n\
                return \"\";\n\
            }\n\
            std::vector <std::string> tokens;\n\
            std::vector <std::string> keys;\n\
            keys = split(var);\n\
            tokens = split(line);\n\
            if (tokens.size()) {\n\
                int i = 0;\n\
                for (int j = 0; j < tokens.size(); j++) {\n\
                    if (i == keys.size())\n\
                        break;\n\
                    set_env(keys[i].c_str(), tokens[j].c_str());\n\
                    i++;\n\
                }\n\
                if (tokens.size() > keys.size()) {\n\
                    std::vector<std::string>::const_iterator first = tokens.begin() + keys.size() - 1;\n\
                    std::vector<std::string>::const_iterator last = tokens.begin() + tokens.size();\n\
                    std::vector<std::string> remaining(first, last);\n\
                    std::string s;\n\
                    for (const auto &piece : remaining) s += piece + \" \";\n\
                    set_env(keys.back().c_str(), s.c_str());\n\
                }\n\
            } else {\n\
                if (keys.size())\n\
                    set_env(keys[0].c_str(), line);\n\
                else \n\
                    set_env(var.c_str(), line);\n\
            }\n\
            set_env(\"?\", 0);\n\
            return \"\";\n\
        }\n\
        \n\
        std::string readval(void) {\n\
            return readval(\"REPLY\");\n\
        }\n"

        const cdstr = "\n\
        void cd(const std::string &directory) {\n\
            std::filesystem::current_path(directory);\n\
            set_env(\"PWD\", std::filesystem::current_path());\n\
            set_env(\"?\", 0);\n\
        }\n"
        return fileexists + regularfileexists + pipefileexists + linkfileexists + socketfileexists + blockfileexists
            + charfileexists + filereadable + fileexecutable + filewritable + direxists + envCommand + execCommand + splitCommand + regexstr + echostr
            + cdstr + readstr;
    }
}

const parse = require('bash-parser');
const ast = parse(file, { mode: 'bash' });

const converter = new ConvertBash();

process.on('exit', function (code) {
    if (code != 0)
        return console.log(`About to exit with code ${code}`);
    return 0
});

let str = ""
try {

    const parseresult = ast.commands
        .map(c => converter.convertCommand(c))
        .filter((c: any) => !!c) // filter empty commands
        .join(';\n')

    let argstr = "if (argc > 1) set_env(\"@\", argc - 1);\n"
    argstr += "else  set_env(\"@\", \" \");\n"
    argstr += "for (int i = 1; i < argc; i++) {\n"
    argstr += "set_env(std::to_string(i).c_str(), argv[i]);\n"
    argstr += "}\n"
    argstr += "for (int i = argc; i < 11; i++) {\n"
    argstr += "set_env(std::to_string(i).c_str(), \" \");\n"
    argstr += "}\n"

    str = "#include <stdlib.h> \n" +
        "#include <stdio.h>\n" +
        "#include <string.h>\n" +
        "#include <string>\n" +
        "#include <memory>\n" +
        "#include <iostream>\n" +
        "#include <regex>\n" +
        "#include <iterator>\n" +
        "#include <glob.h>\n" +
        "#include <pcre.h>\n" +
        "#include <filesystem>\n" +
        "#include <fstream>\n" +
        "#include <sys/stat.h>\n" +
        converter.getSupportDefinitions() +
        converter.getFunctionDefinitions() +
        "int main(int argc, const char *argv[]) {\n" +
        argstr + 
        parseresult +
        ";\n}\n"
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

process.exit(0);