// run-script.js
const { execSync } = require("child_process");

const isWin = process.platform === "win32";

const script = process.argv[2];

if (!script) {
  console.error("No script specified!");
  process.exit(1);
}

// Map logical scripts to OS-specific commands
const scripts = {
  "backend-setup": isWin ? "setup.bat" : "./setup.sh",
  "backend-start": isWin ? "start.bat" : "./start.sh"
};

if (!scripts[script]) {
  console.error(`Unknown script: ${script}`);
  process.exit(1);
}

try {
  execSync(scripts[script], { stdio: "inherit", cwd: "./backend" });
} catch (e) {
  process.exit(1);
}
