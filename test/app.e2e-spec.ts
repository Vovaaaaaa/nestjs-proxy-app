import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ProxyController } from '../src/proxy/controller/proxy.controller';
import { ProxyService } from '../src/proxy/service/proxy.service';

describe('ProxyController (e2e)', () => {
  let app: INestApplication;
  let proxyService: ProxyService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ProxyController],
      providers: [
        {
          provide: ProxyService,
          useValue: {
            processHtml: jest.fn().mockResolvedValue('<html><body>Mock Content</body></html>'),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    proxyService = moduleFixture.get<ProxyService>(ProxyService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('/GET ?url= (valid URL)', async () => {
    const url = 'http://example.com';
    const response = await request(app.getHttpServer()).get('/').query({ url });

    expect(response.status).toBe(200);
    expect(response.text).toBe('<html><body>Mock Content</body></html>');
    expect(proxyService.processHtml).toHaveBeenCalledWith(url);
  });

  it('/GET ?url= (missing URL)', async () => {
    const response = await request(app.getHttpServer()).get('/');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('URL parameter is required');
  });

  it('/GET ?url= (URL not found)', async () => {
    jest.spyOn(proxyService, 'processHtml').mockRejectedValueOnce(new Error('Page not found'));

    const url = 'http://nonexistent.com';
    const response = await request(app.getHttpServer()).get('/').query({ url });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Failed to process HTML: Page not found');
  });
});
