console.log(
	[
		"b d \u00f0 f g h j k l m n \u014b p r s \u0283 t \u00fe v w z \u0292",
		"a \u00e6 e e\u0323 i o u y \u03c9",
		"\u0300 \u0301",
	]
		.map((i) => i.split(/\s+/).join(" "))
		.join("\n")
);
