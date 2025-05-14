export class ErrorResponseDto {
  from: string;
  to: string;
  error: string | Record<string, any>;
}
