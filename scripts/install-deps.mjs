import { execSync } from "child_process";

try {
  console.log("Installing lucide-react...");
  execSync("cd /vercel/share/v0-project && pnpm add lucide-react@0.454.0", {
    stdio: "inherit",
  });
  console.log("Done!");
} catch (err) {
  console.error("Install failed:", err.message);
}
