const fs = require("fs");

const packageJson = JSON.parse(fs.readFileSync("../package.json", "utf8"));
const manifestJson = JSON.parse(fs.readFileSync("../manifest.json", "utf8"));

manifestJson.version = packageJson.version;

fs.writeFileSync("../manifest.json", JSON.stringify(manifestJson, null, 2) + "\n");

console.log(`Synced manifest.json version to ${packageJson.version}`);
