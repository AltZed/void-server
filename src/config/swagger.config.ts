import { DocumentBuilder } from '@nestjs/swagger';

export function getSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('Void messanger')
    .setDescription('Документация для мессенджера void (so-ta.ru)')
    .setVersion('0.0.1a')
    .setContact('Danilz', 'https://t.me/danilzed', 'supp@void.com')
    .addBearerAuth()
    .build();
}
