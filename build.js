const s = require("shelljs");
const process = require("process");

function argv(key) {
  // Return true if the key exists and a value is defined
  if (process.argv.includes(`--${key}`)) return true;

  const value = process.argv.find((element) => element.startsWith(`--${key}=`));

  // Return null if the key does not exist and a value is not defined
  if (!value) return null;

  return value.replace(`--${key}=`, "");
}

console.log("Build JS >>>>>>");
console.log(argv("env"));

s.rm("-rf", "build");
s.mkdir("build");

if (argv("env") == "dev") {
  s.cp(".env", "build/.env");
}
if (argv("env") == "test") {
  s.cp(".env.test", "build/.env");
}
if (argv("env") == "demo") {
  s.cp(".env.demo", "build/.env");
}
if (argv("env") == "prod") {
  s.cp(".env.prod", "build/.env");
}
if (argv("env") == "demo") {
  s.cp(".env.demo", "build/.env");
}

s.cp("-R", "bin", "build/bin");
s.cp("-R", "public", "build/public");
s.mkdir("-p", "build/server/common/swagger");

// Dependency for creating logs (orchestration, deployment)
s.mkdir("-p", "build/instances");

s.cp("server/common/swagger/Api.yaml", "build/server/common/swagger/Api.yaml");
s.cp(
  "server/common/swagger/definitions.yaml",
  "build/server/common/swagger/definitions.yaml"
);
s.cp("-R", "deployment_scripts", "build/deployment_scripts");
// s.mkdir('build/instances');
