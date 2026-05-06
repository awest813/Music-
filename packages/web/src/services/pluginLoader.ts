import type {
  LoadedPlugin,
  NuclearPlugin,
  PluginManifest,
  PluginMetadata,
} from '@nuclearplayer/plugin-sdk';

import { Logger } from './logger';
import { safeParsePluginManifest } from './pluginManifest';

type PluginCode = string;

export class PluginLoader {
  private url?: string;
  private manifest?: PluginManifest;
  private warnings: string[] = [];

  constructor(url: string) {
    this.url = url;
  }

  private async fetchPluginManifest(): Promise<PluginManifest> {
    if (!this.url) {
      throw new Error('Plugin URL not provided');
    }

    Logger.plugins.debug(
      `Fetching plugin manifest from ${this.url}/package.json`,
    );
    const response = await fetch(`${this.url}/package.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch package.json: ${response.status}`);
    }
    const raw = await response.json();
    const res = safeParsePluginManifest(raw);
    if (!res.success) {
      const msg = res.errors.join('; ');
      throw new Error(`Invalid package.json: ${msg}`);
    }
    this.warnings = res.warnings;
    this.manifest = res.data;
    Logger.plugins.debug(
      `Parsed manifest for ${this.manifest.name}@${this.manifest.version}`,
    );
    return this.manifest;
  }

  private buildMetadata(manifest: PluginManifest): PluginMetadata {
    return {
      id: manifest.name,
      name: manifest.name,
      displayName: manifest.nuclear?.displayName || manifest.name,
      version: manifest.version,
      description: manifest.description,
      author: manifest.author,
      category: manifest.nuclear?.category,
      categories: manifest.nuclear?.categories ?? [],
      icon: manifest.nuclear?.icon,
      permissions: manifest.nuclear?.permissions || [],
    };
  }

  private async resolveEntryPath(manifest: PluginManifest): Promise<string> {
    if (manifest.main) {
      const entryPath = `${this.url}/${manifest.main}`;
      Logger.plugins.debug(`Entry path from manifest.main: ${entryPath}`);
      return entryPath;
    }
    const candidates = [
      'index.js',
      'index.ts',
      'index.tsx',
      'dist/index.js',
      'dist/index.ts',
      'dist/index.tsx',
    ];
    for (const candidate of candidates) {
      const full = `${this.url}/${candidate}`;
      try {
        const response = await fetch(full, { method: 'HEAD' });
        if (response.ok) {
          Logger.plugins.debug(`Entry path resolved to ${full}`);
          return full;
        }
      } catch {
        // Continue to next candidate
      }
    }
    throw new Error('Could not resolve plugin entry file');
  }

  private async fetchPluginCode(entryPath: string): Promise<PluginCode> {
    Logger.plugins.debug(`Fetching plugin code from ${entryPath}`);
    const response = await fetch(entryPath);
    if (!response.ok) {
      throw new Error(`Failed to fetch plugin code: ${response.status}`);
    }
    return response.text();
  }

  private evaluatePlugin(
    code: string,
    allowedModules: Record<string, unknown>,
  ): NuclearPlugin {
    Logger.plugins.debug('Evaluating plugin code');
    const exports = {} as Record<string, unknown>;
    const module = { exports } as { exports: unknown };
    const require = (id: string) => {
      if (id in allowedModules) {
        return allowedModules[id];
      }
      Logger.plugins.error(`Plugin tried to require unknown module: ${id}`);
      throw new Error(`Module ${id} not found`);
    };
    try {
      new Function('exports', 'module', 'require', code)(
        exports,
        module,
        require,
      );
    } catch (error) {
      Logger.plugins.error(
        `Plugin evaluation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plugin = (module.exports as unknown as any).default || module.exports;
    if (!plugin || typeof plugin !== 'object') {
      throw new Error('Plugin must export a default object.');
    }
    Logger.plugins.debug('Plugin code evaluated successfully');
    return plugin as NuclearPlugin;
  }

  async loadMetadata(): Promise<PluginMetadata> {
    const manifest = await this.fetchPluginManifest();
    return this.buildMetadata(manifest);
  }

  async load(allowedModules: Record<string, unknown>): Promise<LoadedPlugin> {
    Logger.plugins.debug(`Loading plugin from ${this.url}`);
    const manifest = this.manifest ?? (await this.fetchPluginManifest());
    const metadata = this.buildMetadata(manifest);
    const entryPath = await this.resolveEntryPath(manifest);
    const code = await this.fetchPluginCode(entryPath);
    const instance = this.evaluatePlugin(code, allowedModules);
    Logger.plugins.info(
      `Plugin ${metadata.id}@${metadata.version} loaded successfully`,
    );
    return {
      metadata,
      instance,
      path: this.url!,
    };
  }

  getWarnings(): string[] {
    return this.warnings;
  }
}

export const createPluginLoader = (url: string): PluginLoader =>
  new PluginLoader(url);
