import { ApplicationContext } from './applicationContext';

// start application
try {
  new ApplicationContext();
} catch (error) {
  console.error('Error starting context', error);
}