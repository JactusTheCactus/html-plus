import fs from "fs";
class NodeP {
    type;
    value;
    tag;
    id;
    classes;
    children;
    constructor(nodeType, value, tag, id, classes, children) {
        this.type = nodeType;
        this.value = value ?? "";
        this.tag = tag ?? "";
        this.id = id ?? "";
        this.classes = classes ?? "";
        this.children = children ?? [];
    }
    parse(source, input) {
        let file;
        switch (source) {
            case "string":
                file = input;
                break;
            case "file":
                file = fs.readFileSync(input, "utf8");
                break;
            default:
                console.error("Incorrect input source.", 'Must be "string" or "file".');
        }
        let i = 0;
        function peek(n = 0) {
            return file[i + n];
        }
        function consume(n = 0) {
            for (let I = 0; I < n; I++) {
                i++;
            }
            return file[i++];
        }
        function skipWhitespace() {
            while (/\s/.test(peek() ?? "")) {
                consume();
            }
        }
        function parseIdentifier() {
            let s = "";
            while (peek() && /[\w-]/.test(peek())) {
                s += consume();
            }
            return s;
        }
        function parseString() {
            function esc(char) {
                const obj = {
                    "<": "lt",
                    ">": "gt",
                    "&": "amp",
                    '"': "quot",
                    "'": "#x27",
                };
                return Object.keys(obj).includes(char)
                    ? `&${obj[char]};`
                    : char;
            }
            consume();
            let s = "";
            while (!/["']/.test(peek())) {
                switch (peek()) {
                    case "<":
                    case ">":
                    case "&":
                    case '"':
                    case "'":
                        s += esc(consume());
                        break;
                    case "\\":
                        s += esc(consume(1));
                        break;
                    default:
                        s += consume();
                }
            }
            consume();
            return s;
        }
        function parseNode() {
            skipWhitespace();
            if (/\}/.test(peek())) {
                throw new SyntaxError(`Unexpected "}" at ${i}`);
            }
            if (/"/.test(peek())) {
                return new NodeP("text", parseString());
            }
            const tag = parseIdentifier() || "div";
            skipWhitespace();
            let id;
            let classes = [];
            while (/[#.]/.test(peek())) {
                switch (consume()) {
                    case "#":
                        id = parseIdentifier();
                        break;
                    case ".":
                        classes.push(parseIdentifier());
                        break;
                }
            }
            skipWhitespace();
            if (!/\{/.test(peek())) {
                throw new SyntaxError(`Expected "{" at ${i}`);
            }
            consume();
            skipWhitespace();
            const children = [];
            while (!/\}/.test(peek())) {
                children.push(parseNode());
                skipWhitespace();
            }
            consume();
            return new NodeP("element", null, tag, id, classes.length ? classes.join(" ") : null, children);
        }
        return parseNode();
    }
    generate() {
        if (/text/.test(this.type)) {
            return this.value;
        }
        const tag = this.tag +
            (this.id ? ` id="${this.id}"` : "") +
            (this.classes ? ` class="${this.classes}"` : "");
        const children = this.children
            .map((child) => child.generate())
            .join("");
        switch (this.tag) {
            case "html":
                return `<!DOCTYPE html><${tag}>${children}</${this.tag}>`;
            case "hr":
            case "br":
                return `<${tag}/>`;
            default:
                return `<${tag}>${children}</${this.tag}>`;
        }
    }
    write(file) {
        fs.writeFileSync(file.replace(/src\/(.*?)\.htmlp/, "dist/$1.html"), new NodeP().parse("file", file).generate());
    }
}
const file = process.argv[2];
if (file) {
    new NodeP().write(file);
}
