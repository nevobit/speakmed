declare global {
    namespace NodeJS {
      interface ProcessEnv {
        NODE_ENV: 'local' | 'development' | 'production' | 'test' | 'staging';
        PORT: number;
        DATABASE_URL: string;
        HOST: string;
        REGION: string;
        CORS_ORIGIN: string;
        ENVIRONMENT: string;
        JWT_SECRET: string;
        MONGO_URL: string;
        POSTGRES_URL: string;
        OPENAI_API_KEY: string;
        MERCADOPAGO_ACCESS_TOKEN: string;
        AWS_ACCESS_KEY: string;
        AWS_SECRET_KEY: string;
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
        METHODS: 'GET' | 'POST' | 'OPTIONS';
        STRIPE_SECRET_KEY: string;
      }
    }
  }
  
  export {};