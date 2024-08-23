import { ProxyService } from '../src/proxy/service/proxy.service';
import * as puppeteer from 'puppeteer';
import { Test, TestingModule } from '@nestjs/testing';

class TestableProxyService extends ProxyService {

  public async exposeLoadPage(page: puppeteer.Page, url: string): Promise<void> {
    return this.loadPage(page, url);
  }

  public async exposeFixAssetUrls(page: puppeteer.Page, baseUrl: string): Promise<void> {
    return this.fixAssetUrls(page, baseUrl);
  }

  public async exposeLoadStylesheets(page: puppeteer.Page): Promise<void> {
    return this.loadStylesheets(page);
  }

  public async exposeUpdateLinks(page: puppeteer.Page): Promise<void> {
    return this.updateLinks(page);
  }

  public async exposeExtractModifiedHtml(page: puppeteer.Page): Promise<string> {
    return this.extractModifiedHtml(page);
  }
}

describe('ProxyService', () => {
  let service: TestableProxyService;
  let mockPage: puppeteer.Page;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TestableProxyService],
    }).compile();

    service = module.get<TestableProxyService>(TestableProxyService);

    mockPage = {
      goto: jest.fn().mockResolvedValue(null),
    } as any;
  });

  it('should call page.goto with the correct URL and options', async () => {
    const url = 'http://example.com';
    await service.exposeLoadPage(mockPage, url);

    expect(mockPage.goto).toHaveBeenCalledWith(url, { waitUntil: 'networkidle0' });
  });

  it('should log "Loading page."', async () => {
    const loggerSpy = jest.spyOn(service['logger'], 'log');
    const url = 'http://example.com';
    await service.exposeLoadPage(mockPage, url);

    expect(loggerSpy).toHaveBeenCalledWith('Loading page.');
  });
});

describe('ProxyService', () => {
    let service: TestableProxyService;
    let mockPage: puppeteer.Page;
  
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [TestableProxyService],
      }).compile();
  
      service = module.get<TestableProxyService>(TestableProxyService);
  
      mockPage = {
        evaluate: jest.fn().mockResolvedValue(null),
      } as any;
    });
  
    it('should call page.evaluate with the correct script and baseUrl', async () => {
      const baseUrl = 'http://example.com';
      await service.exposeFixAssetUrls(mockPage, baseUrl);
  
      expect(mockPage.evaluate).toHaveBeenCalledWith(expect.any(Function), baseUrl);
    });
  
    it('should log "Getting content from original url."', async () => {
      const loggerSpy = jest.spyOn(service['logger'], 'log');
      const baseUrl = 'http://example.com';
      await service.exposeFixAssetUrls(mockPage, baseUrl);
  
      expect(loggerSpy).toHaveBeenCalledWith('Getting content from original url.');
    });
  });

  describe('ProxyService', () => {
    let service: TestableProxyService;
    let mockPage: puppeteer.Page;
  
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [TestableProxyService],
      }).compile();
  
      service = module.get<TestableProxyService>(TestableProxyService);
  
      mockPage = {
        evaluate: jest.fn().mockResolvedValue(null),
      } as any;
    });
  
    it('should call page.evaluate for loading stylesheets', async () => {
      await service.exposeLoadStylesheets(mockPage);
  
      expect(mockPage.evaluate).toHaveBeenCalledWith(expect.any(Function));
    });
  
    it('should log "Loading stylesheets."', async () => {
      const loggerSpy = jest.spyOn(service['logger'], 'log');
  
      await service.exposeLoadStylesheets(mockPage);
  
      expect(loggerSpy).toHaveBeenCalledWith('Loading stylesheets.');
    });
  });

  describe('ProxyService', () => {
    let service: TestableProxyService;
    let mockPage: puppeteer.Page;
  
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [TestableProxyService],
      }).compile();
  
      service = module.get<TestableProxyService>(TestableProxyService);
  
      mockPage = {
        evaluate: jest.fn().mockResolvedValue(null),
      } as any;
    });
  
    it('should call page.evaluate for updating links', async () => {
      await service.exposeUpdateLinks(mockPage);
  
      expect(mockPage.evaluate).toHaveBeenCalledWith(expect.any(Function));
    });
  
    it('should log "Updating links."', async () => {
      const loggerSpy = jest.spyOn(service['logger'], 'log');
  
      await service.exposeUpdateLinks(mockPage);
  
      expect(loggerSpy).toHaveBeenCalledWith('Updating links.');
    });
  });

  describe('ProxyService', () => {
    let service: TestableProxyService;
    let mockPage: puppeteer.Page;
  
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [TestableProxyService],
      }).compile();
  
      service = module.get<TestableProxyService>(TestableProxyService);
  
      mockPage = {
        evaluate: jest.fn().mockResolvedValue('<html><body>Modified HTML</body></html>'),
      } as any;
    });
  
    it('should call page.evaluate to extract and modify HTML', async () => {
      const result = await service.exposeExtractModifiedHtml(mockPage);
  
      expect(mockPage.evaluate).toHaveBeenCalledWith(expect.any(Function));
      expect(result).toBe('<html><body>Modified HTML</body></html>');
    });
  
    it('should log "Extract modified html."', async () => {
      const loggerSpy = jest.spyOn(service['logger'], 'log');
  
      await service.exposeExtractModifiedHtml(mockPage);
  
      expect(loggerSpy).toHaveBeenCalledWith('Extract modified html.');
    });
  });


