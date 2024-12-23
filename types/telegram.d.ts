interface TelegramWebApp {
    platform: string;
  }
  
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
  
  