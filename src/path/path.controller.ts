import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { PathService } from './path.service';

import { ErrorResponseDto, FindPathDto, PathResponseDto } from './dto';

@Controller('path')
export class PathController {
  constructor(private readonly pathService: PathService) {}

  @Get()
  async getPath(
    @Query() { from, to }: FindPathDto,
  ): Promise<PathResponseDto | ErrorResponseDto> {
    try {
      console.log('from', from);
      console.log('to', to);
      const path = await this.pathService.findPath(from, to);
      return { from, to, path };
    } catch (error: unknown) {
      const errorMessage =
        typeof error === 'string'
          ? error
          : ((error as { message?: string })?.message ?? 'Unknown error');
      throw new HttpException(
        {
          from,
          to,
          error: errorMessage,
        } as ErrorResponseDto,
        HttpStatus.NOT_FOUND,
      );
    }
  }
  // @Post()
  // create(@Body() createPathDto: CreatePathDto) {
  //   return this.pathService.create(createPathDto);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updatePathDto: UpdatePathDto) {
  //   return this.pathService.update(+id, updatePathDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.pathService.remove(+id);
  // }
}
