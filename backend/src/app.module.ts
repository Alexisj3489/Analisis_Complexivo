import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveysModule } from './modules/surveys/surveys.module';
import { SurveyQuestionsModule } from './modules/survey-questions/survey-questions.module';
import { QuestionOptionsModule } from './modules/question-options/question-options.module';
import { SurveyResponsesModule } from './modules/survey-responses/survey-responses.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { ImportsModule } from './modules/imports/imports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // OJO: solo para desarrollo, lo desactivamos antes de producción
      }),
    }),
    SurveysModule,
    SurveyQuestionsModule,
    QuestionOptionsModule,
    SurveyResponsesModule,
    AnalyticsModule,
    WebhooksModule,
    ImportsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
