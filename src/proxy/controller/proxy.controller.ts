import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ProxyService } from '../service/test.service';
import { Logger } from '@nestjs/common';


@Controller()
export class ProxyController {

  private readonly logger = new Logger(ProxyController.name);

  constructor(private readonly proxyService: ProxyService) {}
  
  @Get()
  async processHtml(@Query('url') url: string): Promise<string> {
    this.logger.log('Process html by url: ' + url);
    if (!url) {
      throw new HttpException('URL parameter is required', HttpStatus.BAD_REQUEST);
    }
    return this.proxyService.processHtml(url);
  }
}