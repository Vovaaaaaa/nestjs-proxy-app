import { ProxyService } from '../service/proxy.service';
import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { Logger } from '@nestjs/common';


@Controller()
export class ProxyController {

  private readonly logger = new Logger(ProxyController.name);

  constructor(private readonly proxyService: ProxyService) {}

  @Get()
  async reproducePage(@Query('url') url: string, @Res() res: Response): Promise<void> {
    this.logger.log('Reproduce page: ' + url);

    const content = await this.proxyService.processHtml(url);
    try {
      res.setHeader('Content-Type', 'text/html');
      res.send(content);
    } catch (error) {
      res.status(500).send('Failed to process HTML');
    }
  }

}