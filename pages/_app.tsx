import type { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next/pages';
import { AuthProvider } from '../src/contexts/AuthContext';
import { LanguageProvider } from '../src/contexts/LanguageContext';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { PluginRegistry, PluginRegistryProvider, PluginLoader } from '../src/plugins';
import { corePlugin } from '../src/plugins/core-plugin';
import Head from 'next/head';
import '../src/styles/globals.css';

// Create a singleton PluginRegistry instance shared across the application.
// Register built-in plugins at module level (runs once).
const registry = new PluginRegistry();
const loader = new PluginLoader(registry);
loader.registerPlugins([corePlugin]);

// Resolve app name from plugin config
const appConfig = registry.getConfig('app');
const appName = (appConfig.appName as string) || 'Inoyu OSS UI';

function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>{appName}</title>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" /> 
      </Head>
      <PluginRegistryProvider registry={registry}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <Component {...pageProps} />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </PluginRegistryProvider>
    </>
  );
}

export default appWithTranslation(App);
