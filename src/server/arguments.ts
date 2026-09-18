export type ServerCommand = "start" | "help";

export function parseServerCommand(args: string[]): ServerCommand {
  if (args.length === 0) {
    return "start";
  }
  if (args.length === 1 && (args[0] === "--help" || args[0] === "-h")) {
    return "help";
  }
  throw new Error(`Unknown argument: ${args.join(" ")}. Run wemo --help.`);
}

export function serverHelpText(): string {
  return [
    "Usage: wemo",
    "",
    "Starts the local Wemo Web service.",
    "",
    "Options:",
    "  -h, --help  Show this help without starting the service",
    "",
    "Environment:",
    "  WEMO_PORT       Local Web port (default: 18788)",
    "  WEMO_STATE_DIR  State directory (default: ~/.wemo)",
    "  WEMO_OPEN=0     Do not open the browser automatically"
  ].join("\n");
}
