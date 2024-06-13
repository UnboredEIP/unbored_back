import { Controller, Get, HttpStatus, NotAcceptableException, NotFoundException, Query, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { join } from 'path';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/getImage')
  @ApiTags('General')
  @ApiOperation({summary: "Use this route to fetch and image using imageName as query"})
  @ApiQuery({name: "imageName", required: true})
  async serveImage(@Query('imageName') imageName: string, @Res() res: Response) {
    if (!imageName)
      throw new NotAcceptableException("Valid imageName is required");
    res.status(HttpStatus.OK)
    const imagePath = join(__dirname, '../', 'data', 'images', imageName);
    const fileExtension = path.extname(imagePath).toLowerCase();
    if (fileExtension || imageName.length != 32)
      throw new NotAcceptableException("Not acceptable");
    try {
      await fs.promises.stat(imagePath);
      res.sendFile(imagePath)
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new NotFoundException("Image not found")
      }
    }
  }
}
