import fs from "fs";
class NodeP {
	type: string;
	value: string;
	tag: string;
	id: string;
	classes: string;
	children: Array<NodeP>;
	constructor(
		nodeType?: "element" | "text" | null,
		value?: string | null,
		tag?: string | null,
		id?: string | null,
		classes?: string | null,
		children?: Array<NodeP> | null
	) {
		this.type = nodeType as string;
		this.value = value as string;
		this.tag = tag as string;
		this.id = id as string;
		this.classes = classes as string;
		this.children = children || [];
	}
	parse(source: "string" | "file", input: string): NodeP {
		let file: string;
		switch (source) {
			case "string": file = input; break
			case "file": file = fs.readFileSync(input, "utf8"); break
			default: console.error("Incorrect input source.", 'Must be "string" or "file".')
		}
		let i = 0;
		function peek(): string {
			return file[i]!;
		}
		function consume(): string {
			return file[i++]!;
		}
		function skipWhitespace(): void {
			while (/\s/.test(peek() ?? "")) {
				consume();
			}
		}
		function parseIdentifier(): string {
			let s = "";
			while (peek() && /[\w-]/.test(peek()!)) {
				s += consume();
			}
			return s;
		}
		function parseString(): string {
			consume();
			let s = "";
			while (peek() !== '"') {
				s += consume();
			}
			consume();
			return s;
		}
		function parseNode(): NodeP {
			skipWhitespace();
			if (peek() === "}") {
				throw new SyntaxError(`Unexpected "}" at ${i}`);
			}
			if (file.startsWith("text", i)) {
				i += 4;
				skipWhitespace();
				if (consume() !== "{") {
					throw new SyntaxError(
						`Expected "{" after text at ${i - 1}`
					);
				}
				skipWhitespace();
				const value = parseString();
				skipWhitespace();
				if (consume() !== "}") {
					throw new SyntaxError(
						`Expected "}" after text at ${i - 1}`
					);
				}
				return new NodeP("text", value);
			}
			const tag: string = parseIdentifier() || "div";
			skipWhitespace();
			let id = null;
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
			return new NodeP(
				"element",
				null,
				tag,
				id,
				classes.length ? classes.join(" ") : null,
				children
			);
		}
		return parseNode();
	}
	generate(): string {
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
	write(file: string): void {
		fs.writeFileSync(
			file.replace(/src\/(.*?)\.htmlp/, "dist/$1.html"),
			new NodeP().parse("file", file).generate()
		);
	}
}
const file = process.argv[2];
if (file) new NopeP().write(file);
