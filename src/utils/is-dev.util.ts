import { ConfigService } from '@nestjs/config';

export default function isDev(configService: ConfigService) {
  return configService.getOrThrow('NODE_DEV') === 'development';
}
