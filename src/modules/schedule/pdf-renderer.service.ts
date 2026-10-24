import { Injectable, Logger, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import puppeteer, { type Browser } from 'puppeteer';

/**
 * Renders HTML to PDF with one shared headless Chromium. The browser starts on
 * first use and is reused; each render gets its own page.
 */
@Injectable()
export class PdfRendererService implements OnModuleDestroy {
  private readonly logger = new Logger(PdfRendererService.name);
  private browserPromise: Promise<Browser> | null = null;

  async renderHtml(html: string): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: 'load' });
      const pdf = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        preferCSSPageSize: true,
      });
      return Buffer.from(pdf);
    } finally {
      await page.close().catch(() => undefined);
    }
  }

  async onModuleDestroy(): Promise<void> {
    const pending = this.browserPromise;
    this.browserPromise = null;
    if (pending) {
      await (await pending.catch(() => null))?.close().catch(() => undefined);
    }
  }

  private getBrowser(): Promise<Browser> {
    if (!this.browserPromise) {
      this.browserPromise = puppeteer
        .launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        })
        .then((browser) => {
          browser.on('disconnected', () => {
            this.browserPromise = null;
          });
          return browser;
        })
        .catch((error: unknown) => {
          this.browserPromise = null;
          this.logger.error('Failed to launch Chromium for PDF export', error instanceof Error ? error.stack : error);
          throw new ServiceUnavailableException('PDF generation is not available');
        });
    }
    return this.browserPromise;
  }
}
