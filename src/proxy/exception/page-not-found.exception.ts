import { HttpException, HttpStatus } from '@nestjs/common';

export class PageNotFoundException extends HttpException {
  constructor(message: string = 'Page not found') {
    super(message, HttpStatus.NOT_FOUND);
  }
}
