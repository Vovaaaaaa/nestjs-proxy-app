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

      browser = await puppeteer.launch();
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
    await page.goto(url, { waitUntil: 'networkidle0' });
  }

  protected async fixAssetUrls(page: puppeteer.Page, baseUrl: string): Promise<void> {
    this.logger.log('Getting content from original url.');

    await page.evaluate((baseUrl) => {
      const elements = document.querySelectorAll('link[rel="stylesheet"], script[src], img[src], source[src], iframe[src]');

      elements.forEach(element => {
        const tagName = element.tagName;

        if (tagName === 'IMG') {
          const attribute = element.tagName === 'IMG' ? 'src' : (element.tagName === 'LINK' ? 'href' : 'src');
          const url = element.getAttribute(attribute);
          if (url && !url.startsWith('http')) {
            element.setAttribute(attribute, new URL(url, baseUrl).href);
          }
        }
        if (tagName === 'SOURCE' || tagName === 'IFRAME') {
          const src = (element as HTMLSourceElement | HTMLIFrameElement).src;
          if (src && !src.startsWith('http')) {
            (element as HTMLSourceElement | HTMLIFrameElement).src = new URL(src, baseUrl).href;
          }
        } else if (tagName === 'LINK') {
          const href = (element as HTMLLinkElement).href;
          if (href && !href.startsWith('http')) {
            (element as HTMLLinkElement).href = new URL(href, baseUrl).href;
          }
        } else if (tagName === 'SCRIPT') {
          const src = (element as HTMLScriptElement).src;
          if (src && !src.startsWith('http')) {
            (element as HTMLScriptElement).src = new URL(src, baseUrl).href;
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
          const xhr = new XMLHttpRequest();
          xhr.open('GET', stylesheet.href, true);
          xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
              const style = document.createElement('style');
              style.textContent = xhr.responseText;
              document.head.appendChild(style);
              link.remove();
              resolve();
            } else {
              reject(`Failed to load CSS: ${xhr.statusText}`);
            }
          };
          xhr.onerror = () => reject(`Network error while loading CSS`);
          xhr.send();
        });
      }));
    });
  }

  protected async updateLinks(page: puppeteer.Page): Promise<void> {
    this.logger.log('Updating links.');

    await page.evaluate(() => {
      const proxyUrl = 'http://localhost:3000/?url=';
      const links = document.querySelectorAll('a[href]');
      links.forEach(link => {
        const anchor = link as HTMLAnchorElement;
        const originalHref = anchor.href;

        const newHref = `${proxyUrl}${originalHref}`;

        anchor.href = newHref;
      });
    });
  }

  protected async extractModifiedHtml(page: puppeteer.Page): Promise<string> {
    this.logger.log('Extract modified html.');

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
