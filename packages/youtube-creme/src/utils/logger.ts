import { loadSettings } from "../config/settings";

class LoggerClass {
  private get isDebug(): boolean {
    // Dynamically check so it responds to UI changes immediately without reload
    const settings = loadSettings();
    return settings.debugMode === true;
  }

  private prefix = "[YouTube Creme]";

  public info(...args: any[]) {
    console.log(this.prefix, "[Info]", ...args);
  }

  public debug(...args: any[]) {
    if (!this.isDebug) return;
    console.log(this.prefix, "[Debug]", ...args);
  }

  public warn(...args: any[]) {
    console.warn(this.prefix, "[Warning]", ...args);
  }

  public error(...args: any[]) {
    console.error(this.prefix, "[Error]", ...args);
  }

  public group(label: string) {
    if (!this.isDebug) return;
    console.group(`${this.prefix} [Debug] ${label}`);
  }

  public groupEnd() {
    if (!this.isDebug) return;
    console.groupEnd();
  }
}

export const Logger = new LoggerClass();
