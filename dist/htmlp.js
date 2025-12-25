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
        this.value = value;
        this.tag = tag;
        this.id = id;
        this.classes = classes;
        this.children = children || [];
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
                console.error([
                    "Incorrect input source.",
                    'Must be "string" or "file".',
                ].join("\n"));
        }
        let i = 0;
        function peek() {
            return file[i];
        }
        function consume() {
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
            consume();
            let s = "";
            while (peek() !== '"') {
                s += consume();
            }
            consume();
            return s;
        }
        function parseNode() {
            skipWhitespace();
            if (peek() === "}") {
                throw new SyntaxError(`Unexpected "}" at ${i}`);
            }
            if (file.startsWith("text", i)) {
                i += 4;
                skipWhitespace();
                if (consume() !== "{") {
                    throw new SyntaxError(`Expected "{" after text at ${i - 1}`);
                }
                skipWhitespace();
                const value = parseString();
                skipWhitespace();
                if (consume() !== "}") {
                    throw new SyntaxError(`Expected "}" after text at ${i - 1}`);
                }
                return new NodeP("text", value);
            }
            const tag = parseIdentifier() || "div";
            skipWhitespace();
            let id = null;
            let classes = [];
            while (peek() === "#" || peek() === ".") {
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
            if (peek() !== "{") {
                throw new SyntaxError(`Expected "{" at ${i}`);
            }
            consume();
            skipWhitespace();
            const children = [];
            while (peek() !== "}") {
                children.push(parseNode());
                skipWhitespace();
            }
            consume();
            return new NodeP("element", null, tag, id, classes.length ? classes.join(" ") : null, children);
        }
        return parseNode();
    }
    generate() {
        if (this.type === "text") {
            return this.value || "";
        }
        let attrs = "";
        if (this.id) {
            attrs += ` id="${this.id}"`;
        }
        if (this.classes) {
            attrs += ` class="${this.classes}"`;
        }
        const children = this.children
            .map((child) => child.generate())
            .join("");
        return `<${this.tag}${attrs}>${children}</${this.tag}>`;
    }
}
const file = process.argv[2];
if (file) {
    fs.writeFileSync(file.replace(/src\/(.*?)\.htmlp/, "dist/$1.html"), new NodeP().parse("file", file).generate());
}
