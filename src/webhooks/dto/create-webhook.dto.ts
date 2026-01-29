import { IsString, IsUrl, IsOptional, IsArray } from 'class-validator';

export class CreateWebhookDto {
  @IsString()
  source: string;

  @IsOptional()
  @IsUrl()
  sourceUrl?: string;

  @IsUrl()
  callbackUrl: string;

  @IsOptional()
  @IsArray()
  events?: string[];
}
