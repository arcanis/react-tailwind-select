query =
    / _? ::expression _?
    / _? { return null; }

expression =
    / head:secondary tail:(type:logical_operator right:secondary)* {
        type Node = ast.Secondary | {
            type: ast.LogicalOperator;
            left: Node;
            right: Node;
        };

        let root: Node = {type: `and`, left: head, right: head};
        let current = root;

        for (let next of tail) {
            current.right = {type: next.type, left: current.right, right: next.right};
            current = current.right;
        }

        return root.right;
    }

logical_operator =
    / (_ and _ / _? and_sym _?) { return `and` as const }
    / (_ or _ / _? or_sym _?) { return `or` as const }
    / _ { return `and` as const }

and = @token(type: `operator`)
    `and` / `AND`
and_sym = @token(type: `operator`)
    `&&` / `&`

or = @token(type: `operator`)
    `or` / `OR`
or_sym = @token(type: `operator`)
    `||` / `|`

secondary = 
    / (@type(type: `never`) `(` _? paren_content)
    / field:ident operator:operator value:value {
        return {type: `filter` as const, field, operator, value};
    }
    / (@if(recovery) field:ident _? operator:operator _? $) {
        return {type: `filter` as const, field, operator, value: null};
    }
    / (@if(recovery) field:ident _? $) {
        return {type: `filter` as const, field, operator: null, value: null};
    }
    / value:value {
        return {type: `default` as const, value};
    }

paren_content =
    / _? ::expression _? `)`
    / (@if(recovery) _? ::expression _? $)

ident = @token(type: `ident`)
    / $[a-zA-Z_]+

operator = @token(type: `operator`)
    / ([=:] {return `=` as const})
    / `!=` / `<` / `<=` / `>` / `>=`

value =
    / string
    / number
    / shorthand

string = @token(type: `string`)
    / `"` string_content

string_content =
    / ::$(char*) `"`
    / (@if(recovery) ::$(char*))

number = @token(type: `number`)
    / $[0-9]+ { return parseInt(text(), 10) }

shorthand = @token(type: `string`)
    / $[a-zA-Z_]+

char =
    / [^\0-\x1F\x22\x5C]
    / "\\" ::(
        / '"'
        / "\\"
        / "/"
        / "b" {return "\b"}
        / "f" {return "\f"}
        / "n" {return "\n"}
        / "r" {return "\r"}
        / "t" {return "\t"}
        / "u" digits:$(hex hex hex hex) {return String.fromCharCode(parseInt(digits, 16))}
    )

hex = [0-9a-f]i

_ = [ ]+
