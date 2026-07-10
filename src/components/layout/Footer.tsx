import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-muted-dark text-foreground py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Inoyu. Licensed under Apache 2.0.
          </p>
          <p className="text-xs text-muted-foreground">
            Powered by{' '}
            <a
              href="https://unomi.apache.org/"
              className="hover:text-foreground transition-colors underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Apache Unomi
            </a>
            . Apache&reg;, Apache Unomi, and Unomi are trademarks of the Apache Software Foundation.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
