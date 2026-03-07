import { defineLexiconConfig } from "@atcute/lex-cli";

export default defineLexiconConfig({
  files: ["lexicon/**/*.json"],
  outdir: "lib/lexicon/",
});
