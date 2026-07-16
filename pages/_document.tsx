import Document, { Html, Head, Main, NextScript, DocumentContext, DocumentInitialProps } from 'next/document';

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext): Promise<DocumentInitialProps> {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render(): JSX.Element {
    return (
      <Html lang="en">
        <Head>
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          {/* Apply theme synchronously before React renders to prevent flash */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    const theme = localStorage.getItem('inoyu-oss-ui-theme-preference') || 'system';
                    const root = document.documentElement;
                    root.classList.remove('dark', 'light');
                    
                    if (theme === 'system') {
                      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                      root.classList.add(prefersDark ? 'dark' : 'light');
                    } else {
                      root.classList.add(theme);
                    }
                  } catch (e) {
                    console.error('Error applying theme:', e);
                  }
                })();
              `,
            }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
