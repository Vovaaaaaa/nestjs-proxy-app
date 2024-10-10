import { Page } from 'puppeteer';
import { PageNotFoundException } from '../src/proxy/exception/page-not-found.exception';
import { ProxyService } from '../src/proxy/service/proxy.service';
import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';


class TestableProxyService extends ProxyService {
  public async testLoadPage(page: Page, url: string): Promise<void> {
    return this.loadPage(page, url);
  }

  public testUpdateAssetUrls(html: string, baseUrl: string): string {
      return this.updateAssetUrls(html, baseUrl);
  }

  public testUpdateLinks(html: string, baseUrl: string): string {
      return this.updateLinks(html, baseUrl);
  }

  public testAddTrademarkToWords(html: string): string {
    return this.addTrademarkToWords(html);
  }
}

describe('TestableProxyService', () => {
  let proxyService: TestableProxyService;
  let page: Page;
  let configService: ConfigService;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockReturnValue('some value'),
    } as unknown as ConfigService;

    proxyService = new TestableProxyService(configService);
    page = {} as Page;
  });

  describe('loadPage', () => {
    it('should load a page successfully', async () => {
      const url = 'https://example.com';
      const mockResponse = {
        status: jest.fn().mockReturnValue(200),
      };
      page.goto = jest.fn().mockResolvedValue(mockResponse);

      await proxyService.testLoadPage(page, url);

      expect(page.goto).toHaveBeenCalledWith(url, { waitUntil: 'networkidle2', timeout: 0 });
    });

    it('should throw PageNotFoundException when status code is 404', async () => {
      const url = 'https://example.com/404';
      const mockResponse = {
        status: jest.fn().mockReturnValue(404),
      };
      page.goto = jest.fn().mockResolvedValue(mockResponse);

      await expect(proxyService.testLoadPage(page, url)).rejects.toThrow(PageNotFoundException);
      await expect(proxyService.testLoadPage(page, url)).rejects.toThrow(`Page not found for URL: ${url}`);
    });

    it('should throw PageNotFoundException for status code 500', async () => {
      const url = 'https://example.com/500';
      const mockResponse = {
        status: jest.fn().mockReturnValue(500),
      };
      page.goto = jest.fn().mockResolvedValue(mockResponse);

      await expect(proxyService.testLoadPage(page, url)).rejects.toThrow(PageNotFoundException);
      await expect(proxyService.testLoadPage(page, url)).rejects.toThrow(`Page not found for URL: ${url}`);
    });

    it('should throw PageNotFoundException for status code 400', async () => {
      const url = 'https://example.com/400';
      const mockResponse = {
        status: jest.fn().mockReturnValue(400),
      };
      page.goto = jest.fn().mockResolvedValue(mockResponse);

      await expect(proxyService.testLoadPage(page, url)).rejects.toThrow(PageNotFoundException);
      await expect(proxyService.testLoadPage(page, url)).rejects.toThrow(`Page not found for URL: ${url}`);
    });

    it('should call page.goto with correct options', async () => {
      const url = 'https://example.com';
      const mockResponse = {
        status: jest.fn().mockReturnValue(200),
      };
      page.goto = jest.fn().mockResolvedValue(mockResponse);

      await proxyService.testLoadPage(page, url);

      expect(page.goto).toHaveBeenCalledWith(url, { waitUntil: 'networkidle2', timeout: 0 });
    });
  });

  describe('updateAssetUrls', () => {
    it('should update relative src and href URLs to absolute URLs', () => {
      const htmlWithRelativeUrls = `
        <html>
          <head>
            <link href="/assets/styles.css" rel="stylesheet">
          </head>
          <body>
            <img src="/images/logo.png" alt="Logo">
            <a href="/contact">Contact Us</a>
          </body>
        </html>
      `;
      const baseUrl = 'https://example.com';
      const expectedHtml = `
        <html>
          <head>
            <link href="https://example.com/assets/styles.css" rel="stylesheet">
          </head>
          <body>
            <img src="https://example.com/images/logo.png" alt="Logo">
            <a href="https://example.com/contact">Contact Us</a>
          </body>
        </html>
      `.trim();
  
      const result = proxyService.testUpdateAssetUrls(htmlWithRelativeUrls, baseUrl);
  
      expect(result.trim()).toEqual(expectedHtml);
    });
  
    it('should not update absolute URLs', () => {
      const htmlWithAbsoluteUrls = `
        <html>
          <head>
            <link href="https://example.com/assets/styles.css" rel="stylesheet">
          </head>
          <body>
            <img src="https://example.com/images/logo.png" alt="Logo">
            <a href="https://example.com/contact">Contact Us</a>
          </body>
        </html>
      `;
      const baseUrl = 'https://example.com';
  
      const result = proxyService.testUpdateAssetUrls(htmlWithAbsoluteUrls, baseUrl);
  
      expect(result.trim()).toEqual(htmlWithAbsoluteUrls.trim());
    });
  
    it('should not update relative URLs without a leading slash', () => {
      const htmlWithRelativeUrlsNoLeadingSlash = `
        <html>
          <head>
            <link href="assets/styles.css" rel="stylesheet">
          </head>
          <body>
            <img src="images/logo.png" alt="Logo">
            <a href="contact">Contact Us</a>
          </body>
        </html>
      `;
      const baseUrl = 'https://example.com';
  
      const result = proxyService.testUpdateAssetUrls(htmlWithRelativeUrlsNoLeadingSlash, baseUrl);
  
      expect(result.trim()).toEqual(htmlWithRelativeUrlsNoLeadingSlash.trim());
    });
  
    it('should not change HTML that does not contain src or href attributes', () => {
      const htmlWithoutSrcOrHref = `
        <html>
          <head></head>
          <body>
            <h1>Test</h1>
          </body>
        </html>
      `;
      const baseUrl = 'https://example.com';
  
      const result = proxyService.testUpdateAssetUrls(htmlWithoutSrcOrHref, baseUrl);
  
      expect(result.trim()).toEqual(htmlWithoutSrcOrHref.trim());
    });
  
    it('should handle HTML with multiple asset URLs correctly', () => {
      const htmlWithMultipleAssetUrls = `
        <html>
          <head>
            <link href="/assets/styles.css" rel="stylesheet">
            <link href="/assets/another.css" rel="stylesheet">
          </head>
          <body>
            <img src="/images/logo.png" alt="Logo">
            <img src="/images/banner.png" alt="Banner">
            <a href="/contact">Test</a>
            <a href="/about">Test</a>
          </body>
        </html>
      `;
      const baseUrl = 'https://example.com';
      const expectedHtml = `
        <html>
          <head>
            <link href="https://example.com/assets/styles.css" rel="stylesheet">
            <link href="https://example.com/assets/another.css" rel="stylesheet">
          </head>
          <body>
            <img src="https://example.com/images/logo.png" alt="Logo">
            <img src="https://example.com/images/banner.png" alt="Banner">
            <a href="https://example.com/contact">Test</a>
            <a href="https://example.com/about">Test</a>
          </body>
        </html>
      `.trim();
  
      const result = proxyService.testUpdateAssetUrls(htmlWithMultipleAssetUrls, baseUrl);
  
      expect(result.trim()).toEqual(expectedHtml);
    });
  });
  
  describe('updateLinks', () => {
    function normalizeHtml(html: string): string {
      return cheerio.load(html).html();
    }

    it('should update absolute links that start with the base domain to go through localhost', () => {
      const htmlWithBaseLinks = `
        <html>
          <body>
            <a href="https://example.com/page1">Test 1</a>
            <a href="https://example.com/page2">Test 2</a>
          </body>
        </html>
      `;
      const baseUrl = 'https://example.com';
      const expectedHtml = `
        <html>
          <body>
            <a href="http://localhost:3000/?url=https://example.com/page1">Test 1</a>
            <a href="http://localhost:3000/?url=https://example.com/page2">Test 2</a>
          </body>
        </html>
      `;

      jest.spyOn(configService, 'get').mockReturnValue(3000);

      const result = proxyService.testUpdateLinks(htmlWithBaseLinks, baseUrl);

      expect(normalizeHtml(result)).toEqual(normalizeHtml(expectedHtml));
    });

    
  
    it('should not update links that do not start with the base domain', () => {
      const htmlWithExternalLinks = `
        <html>
          <body>
            <a href="https://otherdomain.com/page1">Test 1</a>
            <a href="https://example.com/page2">Test 2</a>
          </body>
        </html>
      `;
      const baseUrl = 'https://example.com';
      const expectedHtml = `
        <html>
          <body>
            <a href="https://otherdomain.com/page1">Test 1</a>
            <a href="http://localhost:3000/?url=https://example.com/page2">Test 2</a>
          </body>
        </html>
      `;
  
      jest.spyOn(configService, 'get').mockReturnValue(3000);

      const result = proxyService.testUpdateLinks(htmlWithExternalLinks, baseUrl);
  
      expect(normalizeHtml(result)).toEqual(normalizeHtml(expectedHtml));
    });
  
    it('should not update relative links', () => {
      const htmlWithRelativeLinks = `
        <html>
          <body>
            <a href="/local-page1">Local Page 1</a>
            <a href="https://example.com/page2">Page 2</a>
          </body>
        </html>
      `;
      const baseUrl = 'https://example.com';
      const expectedHtml = `
        <html>
          <body>
            <a href="/local-page1">Local Page 1</a>
            <a href="http://localhost:3000/?url=https://example.com/page2">Page 2</a>
          </body>
        </html>
      `;
      jest.spyOn(configService, 'get').mockReturnValue(3000);

      const result = proxyService.testUpdateLinks(htmlWithRelativeLinks, baseUrl);
  
      expect(normalizeHtml(result)).toEqual(normalizeHtml(expectedHtml));
    });
  
    it('should handle anchor tags without href attributes without throwing errors', () => {
      const htmlWithoutHref = `
        <html>
          <body>
            <a>Link without href</a>
            <a href="https://example.com/page1">Test 1</a>
          </body>
        </html>
      `;
      const baseUrl = 'https://example.com';
      const expectedHtml = `
        <html>
          <body>
            <a>Link without href</a>
            <a href="http://localhost:3000/?url=https://example.com/page1">Test 1</a>
          </body>
        </html>
      `;
      jest.spyOn(configService, 'get').mockReturnValue(3000);

      const result = proxyService.testUpdateLinks(htmlWithoutHref, baseUrl);
  
      expect(normalizeHtml(result)).toEqual(normalizeHtml(expectedHtml));
    });
  
    it('should not change HTML that does not contain anchor tags', () => {
      const htmlWithoutAnchorTags = `
        <html>
          <body>
            <p>No links here, just a paragraph.</p>
          </body>
        </html>
      `;
      const baseUrl = 'https://example.com';
  
      const result = proxyService.testUpdateLinks(htmlWithoutAnchorTags, baseUrl);
  
      expect(normalizeHtml(result)).toEqual(normalizeHtml(htmlWithoutAnchorTags));
    });
  });

  describe('addTrademarkToWords', () => {
    function normalizeHtml(html: string): string {
      return cheerio.load(html).html();
    }
  
    it('should add the ™ symbol to six-letter words in the body', () => {
      const htmlWithSixLetterWords = `
        <html>
          <body>
            <p>Hello people</p>
            <p>Some random text</p>
          </body>
        </html>
      `;
      const expectedHtml = `
        <html>
          <body>
            <p>Hello people™</p>
            <p>Some random™ text</p>
          </body>
        </html>
      `;
  
      const result = proxyService.testAddTrademarkToWords(htmlWithSixLetterWords);
  
      expect(normalizeHtml(result)).toEqual(normalizeHtml(expectedHtml));
    });
  
    it('should not modify words that are not exactly six letters', () => {
      const htmlWithoutSixLetterWords = `
        <html>
          <body>
            <p>Short longword longestwords</p>
          </body>
        </html>
      `;
      const expectedHtml = `
        <html>
          <body>
            <p>Short longword longestwords</p>
          </body>
        </html>
      `;
  
      const result = proxyService.testAddTrademarkToWords(htmlWithoutSixLetterWords);
  
      expect(normalizeHtml(result)).toEqual(normalizeHtml(expectedHtml));
    });
  
    it('should not modify text inside <script> or <style> tags', () => {
      const htmlWithScriptAndStyle = `
        <html>
          <body>
            <p>Script inside here</p>
            <script>
              var scriptContent = "Test";
            </script>
            <style>
              .class { content: "Test"; }
            </style>
          </body>
        </html>
      `;
      const expectedHtml = `
        <html>
          <body>
            <p>Script™ inside™ here</p>
            <script>
              var scriptContent = "Test";
            </script>
            <style>
              .class { content: "Test"; }
            </style>
          </body>
        </html>
      `;
  
      const result = proxyService.testAddTrademarkToWords(htmlWithScriptAndStyle);
  
      expect(normalizeHtml(result)).toEqual(normalizeHtml(expectedHtml));
    });
  
    it('should not modify HTML attributes or non-text content', () => {
      const htmlWithAttributes = `
        <html>
          <body>
            <a href="https://example.com">Testtt</a>
            <img alt="Test" />
          </body>
        </html>
      `;
      const expectedHtml = `
        <html>
          <body>
            <a href="https://example.com">Testtt™</a>
            <img alt="Test" />
          </body>
        </html>
      `;
  
      const result = proxyService.testAddTrademarkToWords(htmlWithAttributes);
  
      expect(normalizeHtml(result)).toEqual(normalizeHtml(expectedHtml));
    });
  
    it('should handle empty or missing text gracefully', () => {
      const htmlWithEmptyElements = `
        <html>
          <body>
            <p></p>
            <div></div>
          </body>
        </html>
      `;
      const expectedHtml = `
        <html>
          <body>
            <p></p>
            <div></div>
          </body>
        </html>
      `;
  
      const result = proxyService.testAddTrademarkToWords(htmlWithEmptyElements);
  
      expect(normalizeHtml(result)).toEqual(normalizeHtml(expectedHtml));
    });
  });
  
  
});
