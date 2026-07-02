const { existsSync } = require("node:fs");
const { spawn, spawnSync } = require("node:child_process");
const path = require("node:path");

const androidStudioJavaHome =
  process.env.ANDROID_STUDIO_JAVA_HOME ||
  "/Applications/Android Studio.app/Contents/jbr/Contents/Home";

function parseJavaMajor(versionOutput) {
  const match = versionOutput.match(/version "(\d+)(?:\.\d+)?/);
  return match ? Number(match[1]) : null;
}

function currentJavaMajor() {
  if (process.env.JAVA_HOME) {
    const javaBin = path.join(process.env.JAVA_HOME, "bin", "java");
    const result = spawnSync(javaBin, ["-version"], { encoding: "utf8" });
    return parseJavaMajor(`${result.stdout}\n${result.stderr}`);
  }

  const result = spawnSync("java", ["-version"], { encoding: "utf8" });
  if (result.error) {
    return null;
  }

  return parseJavaMajor(`${result.stdout}\n${result.stderr}`);
}

function buildEnv() {
  const env = { ...process.env };
  const javaMajor = currentJavaMajor();

  if (existsSync(androidStudioJavaHome) && (!javaMajor || javaMajor > 21)) {
    env.JAVA_HOME = androidStudioJavaHome;
    env.PATH = `${path.join(androidStudioJavaHome, "bin")}:${env.PATH || ""}`;
    console.log(
      `Using Android Studio JDK at ${androidStudioJavaHome} for Android build.`
    );
  }

  return env;
}

const child = spawn("expo", ["run:android"], {
  stdio: "inherit",
  env: buildEnv(),
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
