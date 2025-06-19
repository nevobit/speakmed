declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'local' | 'development' | 'production' | 'test' | 'staging';
      PORT: number;
      DATABASE_URL: string;
      REDIS_URL: string;
      HOST: string;
      REGION: string;
      CORS_ORIGIN: string;
      ENVIRONMENT: string;
      JWT_SECRET: string;
      MONGO_URL: string;
      POSTGRES_URL: string;
      OPENAI_API_KEY: string;
      MERCADOPAGO_ACCESS_TOKEN: string;
      AWS_ACCESS_KEY_ID: string;
      AWS_SECRET_ACCESS_KEY: string;
      AWS_S3_BUCKET_NAME: string;
      GOOGLE_APPLICATION_CREDENTIALS: string;
      FIREBASE_PROJECT_ID: string;
      FILES_BUCKET: string;
      GOOGLE_CLIENT_ID: string;
      GOOGLE_CLIENT_SECRET: string;
      GOOGLE_REDIRECT_URI: string;
      GOOGLE_AI_KEY: string;
      RESEND_KEY: string;
      APPLICATION_NAME: string;
      STRIPE_SECRET_KEY: string;
      PAYPAL_CLIENT_ID: string;
      PAYPAL_SECRET: string;
      PAYPAL_BASE_URL: string;
      JWT_REFRESH_SECRET: string;
    }
  }
}

export { };