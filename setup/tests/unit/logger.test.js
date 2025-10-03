/**
 * Unit Tests: Logger Output Formatting
 * Tests for logger.js output formatting and logging functionality
 */

// const chalk = require('chalk'); // Not used - chalk is mocked by Jest

// Mock chalk to test color output
jest.mock('chalk', () => {
  const mockChalk = (text) => text;
  mockChalk.blue = (text) => `BLUE:${text}`;
  mockChalk.yellow = (text) => `YELLOW:${text}`;
  mockChalk.red = (text) => `RED:${text}`;
  mockChalk.green = (text) => `GREEN:${text}`;
  mockChalk.gray = (text) => `GRAY:${text}`;
  mockChalk.cyan = (text) => `CYAN:${text}`;
  return mockChalk;
});

// Import logger after chalk mock
const { createLogger } = require('../../lib/logger');

describe('Logger Output Formatting', () => {
  let consoleLogSpy;
  let consoleErrorSpy;
  let stdoutWriteSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    stdoutWriteSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    stdoutWriteSpy.mockRestore();
  });

  describe('Logger creation', () => {
    it('should create logger with default options', () => {
      const logger = createLogger();

      expect(logger).toBeDefined();
      expect(logger.log).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.success).toBeDefined();
      expect(logger.debug).toBeDefined();
      expect(logger.verbose).toBeDefined();
    });

    it('should accept custom log level', () => {
      const logger = createLogger({ level: 'verbose' });

      expect(logger).toBeDefined();
    });

    it('should accept color option', () => {
      const logger = createLogger({ color: false });

      expect(logger).toBeDefined();
    });
  });

  describe('Basic logging functions', () => {
    it('should log a plain message', () => {
      const logger = createLogger();
      logger.log('Test message');

      expect(consoleLogSpy).toHaveBeenCalledWith('Test message');
    });

    it('should log info message with icon and color', () => {
      const logger = createLogger({ color: true });
      logger.info('Info message');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ℹ'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Info message'));
    });

    it('should log warning message with icon and color', () => {
      const logger = createLogger({ color: true });
      logger.warn('Warning message');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('⚠'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Warning message'));
    });

    it('should log error message with icon and color', () => {
      const logger = createLogger({ color: true });
      logger.error('Error message');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('✗'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error message'));
    });

    it('should log success message with icon and color', () => {
      const logger = createLogger({ color: true });
      logger.success('Success message');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('✓'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Success message'));
    });
  });

  describe('Verbose and debug logging', () => {
    it('should not log debug messages in normal mode', () => {
      const logger = createLogger({ level: 'normal' });
      logger.debug('Debug message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log debug messages in verbose mode', () => {
      const logger = createLogger({ level: 'verbose' });
      logger.debug('Debug message');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Debug message'));
    });

    it('should not log verbose messages in normal mode', () => {
      const logger = createLogger({ level: 'normal' });
      logger.verbose('Verbose message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log verbose messages in verbose mode', () => {
      const logger = createLogger({ level: 'verbose' });
      logger.verbose('Verbose message');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Verbose message'));
    });
  });

  describe('Quiet mode', () => {
    it('should not log info messages in quiet mode', () => {
      const logger = createLogger({ level: 'quiet' });
      logger.info('Info message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should not log warnings in quiet mode', () => {
      const logger = createLogger({ level: 'quiet' });
      logger.warn('Warning message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should still log errors in quiet mode', () => {
      const logger = createLogger({ level: 'quiet' });
      logger.error('Error message');

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should not log success messages in quiet mode', () => {
      const logger = createLogger({ level: 'quiet' });
      logger.success('Success message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('JSON mode', () => {
    it('should output errors as JSON in JSON mode', () => {
      const logger = createLogger({ level: 'json' });
      logger.error('Error message');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('{"level":"error","message":"Error message"}')
      );
    });

    it('should not log regular messages in JSON mode', () => {
      const logger = createLogger({ level: 'json' });
      logger.info('Info message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('Section headers', () => {
    it('should format section headers with separators', () => {
      const logger = createLogger({ color: false });
      logger.section('Test Section');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test Section')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('─')
      );
    });

    it('should not display sections in quiet mode', () => {
      const logger = createLogger({ level: 'quiet' });
      logger.section('Test Section');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('Progress indicators', () => {
    it('should display progress bar with percentage', () => {
      const logger = createLogger();
      logger.progress('Installing', 5, 10);

      expect(stdoutWriteSpy).toHaveBeenCalledWith(
        expect.stringContaining('Installing')
      );
      expect(stdoutWriteSpy).toHaveBeenCalledWith(
        expect.stringContaining('50%')
      );
      expect(stdoutWriteSpy).toHaveBeenCalledWith(
        expect.stringContaining('(5/10)')
      );
    });

    it('should display filled and empty bar characters', () => {
      const logger = createLogger();
      logger.progress('Installing', 5, 10);

      const call = stdoutWriteSpy.mock.calls[0][0];
      expect(call).toMatch(/[█░]/);
    });

    it('should add newline when progress is complete', () => {
      const logger = createLogger();
      logger.progress('Installing', 10, 10);

      const calls = stdoutWriteSpy.mock.calls;
      const lastCall = calls[calls.length - 1][0];
      expect(lastCall).toBe('\n');
    });

    it('should not display progress in quiet mode', () => {
      const logger = createLogger({ level: 'quiet' });
      logger.progress('Installing', 5, 10);

      expect(stdoutWriteSpy).not.toHaveBeenCalled();
    });
  });

  describe('Color support detection', () => {
    it('should disable colors when color option is false', () => {
      const logger = createLogger({ color: false });
      logger.info('Test message');

      // When colors are disabled, output should not contain color codes
      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).not.toContain('BLUE:');
    });

    it('should respect NO_COLOR environment variable', () => {
      const originalNoColor = process.env.NO_COLOR;
      process.env.NO_COLOR = '1';

      const logger = createLogger({ color: true });
      logger.info('Test message');

      process.env.NO_COLOR = originalNoColor;

      // Should not apply colors when NO_COLOR is set
      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).not.toContain('BLUE:');
    });

    it('should respect CLAUDE_BUDDY_NO_COLOR environment variable', () => {
      const originalNoColor = process.env.CLAUDE_BUDDY_NO_COLOR;
      process.env.CLAUDE_BUDDY_NO_COLOR = '1';

      const logger = createLogger({ color: true });
      logger.info('Test message');

      process.env.CLAUDE_BUDDY_NO_COLOR = originalNoColor;

      const call = consoleLogSpy.mock.calls[0][0];
      expect(call).not.toContain('BLUE:');
    });
  });

  describe('Specialized logging functions', () => {
    it('should have logInstallationSummary function', () => {
      const logger = createLogger();
      expect(logger.logInstallationSummary).toBeDefined();
    });

    it('should have logUpdateSummary function', () => {
      const logger = createLogger();
      expect(logger.logUpdateSummary).toBeDefined();
    });

    it('should have logUninstallSummary function', () => {
      const logger = createLogger();
      expect(logger.logUninstallSummary).toBeDefined();
    });

    it('should have logErrorWithSuggestions function', () => {
      const logger = createLogger();
      expect(logger.logErrorWithSuggestions).toBeDefined();
    });
  });

  describe('Spinner functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should have startSpinner function', () => {
      const logger = createLogger();
      expect(logger.startSpinner).toBeDefined();
    });

    it('should have stopSpinner function', () => {
      const logger = createLogger();
      expect(logger.stopSpinner).toBeDefined();
    });

    it('should start and stop spinner without errors', () => {
      const logger = createLogger();

      expect(() => {
        logger.startSpinner('Loading');
        jest.advanceTimersByTime(1000);
        logger.stopSpinner('Done');
      }).not.toThrow();
    });
  });

  describe('Level management', () => {
    it('should have setLevel function', () => {
      const logger = createLogger();
      expect(logger.setLevel).toBeDefined();
    });

    it('should change log level dynamically', () => {
      const logger = createLogger({ level: 'normal' });

      logger.debug('Should not appear');
      expect(consoleLogSpy).not.toHaveBeenCalled();

      logger.setLevel('verbose');
      logger.debug('Should appear');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Should appear'));
    });
  });

  describe('Output format consistency', () => {
    it('should prefix info messages correctly', () => {
      const logger = createLogger({ color: false });
      logger.info('Test');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ℹ'));
    });

    it('should prefix warning messages correctly', () => {
      const logger = createLogger({ color: false });
      logger.warn('Test');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('⚠'));
    });

    it('should prefix error messages correctly', () => {
      const logger = createLogger({ color: false });
      logger.error('Test');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('✗'));
    });

    it('should prefix success messages correctly', () => {
      const logger = createLogger({ color: false });
      logger.success('Test');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('✓'));
    });

    it('should prefix debug messages correctly', () => {
      const logger = createLogger({ level: 'verbose', color: false });
      logger.debug('Test');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('🔍'));
    });
  });

  describe('Cleanup', () => {
    it('should have close function for cleanup', () => {
      const logger = createLogger();
      expect(logger.close).toBeDefined();
    });

    it('should close without errors', async () => {
      const logger = createLogger();

      await expect(logger.close()).resolves.not.toThrow();
    });
  });
});
