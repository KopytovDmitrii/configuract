// Настройка тестовой среды Jest
import 'jest-environment-jsdom';

// Глобальные моки и настройки для тестов
global.console = {
  ...console,
  // Можно отключить предупреждения в тестах если нужно
  // warn: jest.fn(),
  // error: jest.fn(),
};