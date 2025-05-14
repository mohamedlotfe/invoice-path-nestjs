import { IsNotEmpty, IsString } from 'class-validator';

export class FindPathDto {
  @IsString()
  @IsNotEmpty()
  from: string;

  @IsString()
  @IsNotEmpty()
  to: string;
}
