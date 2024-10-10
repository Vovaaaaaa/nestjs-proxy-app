import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { ConfigService } from '@nestjs/config';
import { PageNotFoundException } from '../exception/page-not-found.exception';
import { Logger } from '@nestjs/common';


@Injectable()
export class ProxyService {

  private readonly logger = new Logger(ProxyService.name);

  constructor(private configService: ConfigService) {}

  async processHtml(url: string): Promise<string> {
    this.logger.log('Processing html.');
    if (!url) {
      throw new Error('URL parameter is missing');
    }
  
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  
    try {
      const page = await browser.newPage();
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (resourceType === 'font' || resourceType === 'image') {
          req.abort();
        } else {
          req.continue();
        }
      });
  
      await this.loadPage(page, url);       

      let content = await page.content();
      content = this.updateAssetUrls(content, url);
      content = this.addTrademarkToWords(content);
      content = this.updateLinks(content, url);

      return content;
    } catch (error) {
      this.logger.error(`Failed to process the page: ${error.message}`);
      if (error instanceof PageNotFoundException) {
        throw error;
      }
      throw new Error(`Failed to process HTML: ${error}`);
    } finally {
      await browser.close();
    }
  }

  protected async loadPage(page: puppeteer.Page, url: string): Promise<void> {
    const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });
  
    if (response.status() >= 400) {
      throw new PageNotFoundException(`Page not found for URL: ${url}`);
    }
  }

  protected updateAssetUrls(html: string, baseUrl: string): string {
    this.logger.log('Updating asset urls.');

    const baseDomain = new URL(baseUrl).origin;
    return html
      .replace(/src="\/([^"]*)"/g, `src="${baseDomain}/$1"`)
      .replace(/href="\/([^"]*)"/g, `href="${baseDomain}/$1"`);
  }

  protected updateLinks(html: string, baseUrl: string): string {
    this.logger.log('Updating URLs to go through localhost.');
  
    const $ = cheerio.load(html);
    const port = this.configService.get<number>('PORT');
    const proxyUrl = `http://localhost:${port}/?url=`;
    const baseDomain = new URL(baseUrl).origin;
  
    $('a').each((_, element) => {
      const originalHref = $(element).attr('href');  
      if (originalHref && originalHref.startsWith(baseDomain)) {
        const modifiedHref = proxyUrl + originalHref;
        $(element).attr('href', modifiedHref);
      }
    });
    return $.html();
  }
  
  protected addTrademarkToWords(html: string): string {
    this.logger.log('Adding Trademark.');

    const $ = cheerio.load(html);
    $('body *').each((_, element) => {
      const tagName = $(element).prop('tagName').toLowerCase();
      if (tagName !== 'script' && tagName !== 'style') {
        $(element).contents().each((_, content) => {
          if (content.type === 'text') {
            content.data = content.data.replace(/\b([a-zA-Z]{6})\b/g, '$1™');
          }
        });
      }
    });
    return $.html();
  }
  
}
