import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

export const loadPlugins = async (app) => {
  const pluginsDir = path.join(process.cwd(), "plugins");

  if (!fs.existsSync(pluginsDir)) {
    console.log("No plugins folder found");
    return;
  }

  const plugins = fs.readdirSync(pluginsDir);

  for (const pluginName of plugins) {
    const pluginJsonPath = path.join(
      pluginsDir,
      pluginName,
      "plugin.json"
    );

    if (!fs.existsSync(pluginJsonPath)) {
      console.log(`${pluginName}: plugin.json not found`);
      continue;
    }

    const config = JSON.parse(
      fs.readFileSync(pluginJsonPath, "utf8")
    );

    if (!config.enabled) {
      console.log(`${pluginName} disabled`);
      continue;
    }

    const pluginPath = path.join(
      pluginsDir,
      pluginName,
      config.main || "index.js"
    );

    if (!fs.existsSync(pluginPath)) {
      console.log(`${pluginName}: main file not found`);
      continue;
    }

    const plugin = await import(
      pathToFileURL(pluginPath).href
    );

    plugin.default.register(app);

    console.log(
      `${config.name} v${config.version} loaded`
    );
  }
};