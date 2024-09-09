import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { Logger } from '@nestjs/common';
import { PageNotFoundException } from '../exception/page-not-found.exception';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProxyService {

  private readonly logger = new Logger(ProxyService.name);

  constructor(private configService: ConfigService) {}

  getSecretKey(): string {
    return this.configService.get<string>('SECRET_KEY');
  }

  async processHtml(url: string): Promise<string> {
    let browser: puppeteer.Browser | undefined;
    try {
      this.logger.log('Building page content.');

      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();

      await this.loadPage(page, url);
      await this.fixAssetUrls(page, url);
      await this.loadStylesheets(page);
      await this.updateLinks(page);
      await this.enableRequestLogging(page);

      return await this.extractModifiedHtml(page);
    } catch (error) {
      this.logger.log('An error occurred', error.stack);
      if (error.message.includes('404')) { 
        throw new PageNotFoundException(`Page not found for URL: ${url}`);
      }
      throw new Error(`Failed to process HTML: ${error.message}`);
    } finally {
      if (browser) {
        this.logger.log('Close resource.');
        await browser.close();
      }
    }
  }

  protected async loadPage(page: puppeteer.Page, url: string): Promise<void> {
    this.logger.log('Loading page.');
    await page.goto(url, { waitUntil: 'networkidle2' });
  }

  protected async fixAssetUrls(page: puppeteer.Page, baseUrl: string): Promise<void> {
    this.logger.log('Getting content from original url.');

    await page.evaluate((baseUrl) => {
      const elements = document.querySelectorAll('link[rel="stylesheet"], script[src], img[src], source[src], iframe[src]');

      elements.forEach(element => {
        const tagName = element.tagName;

        function shouldUpdateUrl(url: string | null | undefined): boolean {
          return url != null && !url.startsWith('http');
        }

        function updateElementUrl(element: any, currentUrl: string | null | undefined, baseUrl: string, property: 'src' | 'href') {
            if (currentUrl) {
              element[property] = new URL(currentUrl, baseUrl).href;
            }
        }

        if (tagName === 'IMG') {
            const imageElement = element as HTMLImageElement;
            updateElementUrl(imageElement, imageElement.src, baseUrl, 'src');
          } else if (tagName === 'SOURCE' || tagName === 'IFRAME') {
            const sourceElement = element as HTMLSourceElement | HTMLIFrameElement;
            if (shouldUpdateUrl(sourceElement.src)) {
              updateElementUrl(sourceElement, sourceElement.src, baseUrl, 'src');
            }
          } else if (tagName === 'LINK') {
            const linkElement = element as HTMLLinkElement;
            if (shouldUpdateUrl(linkElement.href)) {
              updateElementUrl(linkElement, linkElement.href, baseUrl, 'href');
            }
          } else if (tagName === 'SCRIPT') {
            const scriptElement = element as HTMLScriptElement;
            if (shouldUpdateUrl(scriptElement.src)) {
              updateElementUrl(scriptElement, scriptElement.src, baseUrl, 'src');
            }
          }
      });
    }, baseUrl);
  }
  
  protected async loadStylesheets(page: puppeteer.Page): Promise<void> {
    this.logger.log('Loading stylesheets.');

    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      return Promise.all(links.map(link => {
        return new Promise<void>((resolve, reject) => {
          const stylesheet = link as HTMLLinkElement;
          fetch(stylesheet.href)
            .then(response => response.text())
            .then(cssText => {
              const style = document.createElement('style');
              style.textContent = cssText;
              document.head.appendChild(style);
              link.remove();
              resolve();
            })
            .catch(() => reject(`Failed to load CSS from ${stylesheet.href}`));
        });
      }));
    });
  }

  protected async updateLinks(page: puppeteer.Page): Promise<void> {
    this.logger.log('Updating links.');

    const port = this.configService.get<string>('PORT');
    const proxyUrl = `http://localhost:${port}/?url=`;

    await page.evaluate((proxyUrl) => {
      const links = document.querySelectorAll('a[href]');
      links.forEach(link => {
        const anchor = link as HTMLAnchorElement;
        const originalHref = anchor.href;
        const newHref = `${proxyUrl}${originalHref}`;
        anchor.href = newHref;
      });
    }, proxyUrl);
  }

  protected async extractModifiedHtml(page: puppeteer.Page): Promise<string> {
    this.logger.log('Extracting and modifying HTML.');
  
    return await page.evaluate(() => {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null
      );
      let node;
      while ((node = walker.nextNode())) {
        node.textContent = node.textContent.replace(/\b\w{6}\b/g, '$&™');
      }
      return document.documentElement.outerHTML;
    });
  }
  

  private async enableRequestLogging(page: puppeteer.Page): Promise<void> {
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (request.url().includes('image') || request.url().includes('css') || request.url().includes('js')) {
        console.log('Requesting:', request.url());
      }
      request.continue();
    });
  }

}
