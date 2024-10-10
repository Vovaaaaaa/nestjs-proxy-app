import { ProxyService } from '../service/proxy.service';
import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';


@Controller()
export class ProxyController {

  constructor(private readonly proxyService: ProxyService) {}

  @Get()
  async handleRequest(@Query('url') url: string, @Res() res: Response): Promise<void> {
    const content = await this.proxyService.processHtml(url);
    try {
      res.setHeader('Content-Type', 'text/html');
      res.send(content);
    } catch (error) {
      res.status(500).send('Failed to process HTML');
    }
  }

}